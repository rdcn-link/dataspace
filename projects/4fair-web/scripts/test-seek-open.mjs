/**
 * 验证探查打开不会落到 fairspace.cn/headlines
 *
 * 探查前端逻辑（client-*.js）：
 * - 读 ?token= → sessionStorage dataseek_sso_token → Authorization
 * - API 401/307 → window.location.replace('https://fairspace.cn') → /headlines
 */
import { chromium } from 'playwright'
import { pathToFileURL } from 'node:url'
import path from 'node:path'
import { createRequire } from 'node:module'

const SEEK_ORIGIN = 'https://dataseek.tpdc.ac.cn'
const DATASET_ID = process.env.SEEK_DATASET_ID || '63d112f1-3ff9-4689-86d4-c1ec7f6c2257'
const FAKE_TOKEN = 'test-sso-token-for-seek-open'

function assertNotPortal(url, label) {
  const u = String(url || '')
  if (u.includes('fairspace.cn') || u.includes('/headlines')) {
    throw new Error(`[FAIL] ${label} 落到门户: ${u}`)
  }
}

async function testWithoutTokenRedirectsToPortal(browser) {
  const page = await browser.newPage()
  const nav = []
  page.on('framenavigated', (f) => {
    if (f === page.mainFrame()) nav.push(f.url())
  })
  await page.goto(`${SEEK_ORIGIN}/dataset/seek/${encodeURIComponent(DATASET_ID)}`, {
    waitUntil: 'domcontentloaded',
    timeout: 30000
  })
  await page.waitForTimeout(4500)
  const finalUrl = page.url()
  console.log('[control no-token]', finalUrl)
  if (!finalUrl.includes('fairspace.cn')) {
    throw new Error(`[FAIL] 无 token 时应跳门户，实际: ${finalUrl}`)
  }
  await page.close()
  console.log('[PASS] 无 token → 门户（对照成立）')
}

async function testWithTokenStaysOnSeek(browser) {
  const context = await browser.newContext()
  const page = await context.newPage()
  const nav = []
  const authHeaders = []

  await page.route('**/api/**', async (route) => {
    const headers = route.request().headers()
    const auth = headers.authorization || headers.Authorization || ''
    authHeaders.push(auth)
    if (auth) {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ code: 0, data: {} })
      })
      return
    }
    await route.fulfill({
      status: 401,
      contentType: 'application/json',
      body: JSON.stringify({ detail: 'Unauthorized' })
    })
  })

  page.on('framenavigated', (f) => {
    if (f === page.mainFrame()) {
      nav.push(f.url())
      console.log('[nav]', f.url())
    }
  })

  await page.goto('about:blank')
  await page.setContent('<p>启动中…</p>')

  const seekUrl = `${SEEK_ORIGIN}/dataset/seek/${encodeURIComponent(DATASET_ID)}?token=${encodeURIComponent(FAKE_TOKEN)}`
  console.log('[open]', seekUrl)
  await page.goto(seekUrl, { waitUntil: 'domcontentloaded', timeout: 30000 })
  await page.waitForTimeout(4500)

  const finalUrl = page.url()
  console.log('[final]', finalUrl)
  console.log('[auth samples]', authHeaders.slice(0, 5))

  for (const u of nav) assertNotPortal(u, 'nav')
  assertNotPortal(finalUrl, 'final')

  if (!finalUrl.startsWith(SEEK_ORIGIN)) {
    throw new Error(`[FAIL] 最终未停留在探查源站: ${finalUrl}`)
  }
  if (!finalUrl.includes(`/dataset/seek/${DATASET_ID}`)) {
    throw new Error(`[FAIL] 路径不正确: ${finalUrl}`)
  }
  // 打开时必须带 ?token=；探查页可能随后清掉 query（写入 sessionStorage）
  if (!seekUrl.includes('?token=')) {
    throw new Error('[FAIL] 打开地址未使用 ?token=')
  }
  const stored = await page.evaluate(() => sessionStorage.getItem('dataseek_sso_token'))
  if (stored !== FAKE_TOKEN) {
    throw new Error(`[FAIL] sessionStorage token 未写入: ${stored}`)
  }
  if (!authHeaders.some((h) => h === FAKE_TOKEN)) {
    throw new Error('[FAIL] 请求未带上 Authorization=token')
  }

  await context.close()
  console.log('[PASS] 带 ?token= 打开探查页成功')
}

async function testBuildUrlIncludesToken() {
  const id = DATASET_ID
  const token = FAKE_TOKEN
  const withToken = `${SEEK_ORIGIN}/dataset/seek/${encodeURIComponent(id)}?token=${encodeURIComponent(token)}`
  if (!withToken.includes('?token=') || withToken.includes('#token=')) {
    throw new Error('build url should be ?token= only')
  }
  console.log('[PASS] seekUrl 形如', withToken.replaceAll(token, '***'))
}

async function main() {
  await testBuildUrlIncludesToken()
  const browser = await chromium.launch({ headless: true })
  try {
    await testWithoutTokenRedirectsToPortal(browser)
    await testWithTokenStaysOnSeek(browser)
  } finally {
    await browser.close()
  }
  console.log('\nALL TESTS PASSED')
}

main().catch((e) => {
  console.error('\nTEST FAILED:', e.message || e)
  process.exit(1)
})
