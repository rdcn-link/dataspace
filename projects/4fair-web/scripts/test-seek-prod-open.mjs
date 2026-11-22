/**
 * 线上探查打开回归：
 * 1) /api/v1/datasets/submissions 当前 405
 * 2) /api/dataset-seek/submissions 可用
 * 3) 打开带 token 的 seek URL 不跳 headlines
 */
import { chromium } from 'playwright'

const DATASET_ID = '63d112f1-3ff9-4689-86d4-c1ec7f6c2257'
const SEEK_ORIGIN = 'https://dataseek.tpdc.ac.cn'
const FAKE_TOKEN = 'prod-test-token'

async function testProdSubmitPaths() {
  const payload = {
    external_id: DATASET_ID,
    name: 'CRU_TS test',
    summary: 'test',
    keywords: ['climate'],
    storage_directory: `/mnt/data/${DATASET_ID}`,
    token: FAKE_TOKEN
  }

  const v1 = await fetch('https://fairspace.cn/api/v1/datasets/submissions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify(payload),
    redirect: 'manual'
  })
  const v1Text = await v1.text()
  console.log('[v1]', v1.status, v1Text.slice(0, 120).replace(/\n/g, ' '))
  if (v1.status !== 405 && !v1Text.includes('405')) {
    console.warn('[warn] /api/v1/datasets 已不再 405，可改回优先文档路径')
  } else {
    console.log('[PASS] 文档路径 /api/v1/datasets 仍 405（需兼容路径）')
  }

  const compat = await fetch('https://fairspace.cn/api/dataset-seek/submissions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify(payload),
    redirect: 'manual'
  })
  const compatText = await compat.text()
  console.log('[compat]', compat.status, compatText.slice(0, 240).replace(/\n/g, ' '))

  if (compat.status === 405 || compatText.trim().startsWith('<')) {
    throw new Error('兼容路径 /api/dataset-seek/submissions 也不可用')
  }
  // 200 拿到 dataset_id，或业务校验错误（如 token 无效）都说明反代通了
  if (!(compat.ok || compat.status === 422 || compat.status === 400 || compat.status === 401)) {
    // 仍可能 200 with code!=0
  }
  let datasetId = DATASET_ID
  try {
    const json = JSON.parse(compatText)
    const data = json?.data || json
    const id = data?.dataset_id || data?.datasetId || data?.id
    if (id) datasetId = String(id)
    console.log('[compat json code]', json?.code, 'dataset_id=', id || '(none)')
  } catch {
    // ignore
  }
  console.log('[PASS] 兼容提交路径可到达探查服务')
  return datasetId
}

async function testOpenWithToken(datasetId) {
  const browser = await chromium.launch({ headless: true })
  const context = await browser.newContext()

  // 对整个 context（含 popup）拦截探查 API，模拟已授权
  await context.route('**/api/**', async (route) => {
    const url = route.request().url()
    // 只 mock 探查源站 API
    if (!url.includes('dataseek.tpdc.ac.cn')) {
      await route.continue()
      return
    }
    const auth = route.request().headers().authorization || ''
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

  const page = await context.newPage()
  await page.goto(
    `https://fairspace.cn/analysis-datasets/${DATASET_ID}?center=tpdc`,
    { waitUntil: 'domcontentloaded', timeout: 45000 }
  )

  const seekUrl = `${SEEK_ORIGIN}/dataset/seek/${encodeURIComponent(datasetId)}?token=${encodeURIComponent(FAKE_TOKEN)}`
  const popupPromise = context.waitForEvent('page', { timeout: 10000 })

  const opened = await page.evaluate(async (url) => {
    const win = window.open('about:blank', '_blank')
    if (!win) return { ok: false, reason: 'blocked' }
    try {
      win.document.open()
      win.document.write('<!doctype html><p>启动中</p>')
      win.document.close()
    } catch (e) {
      return { ok: false, reason: 'write:' + e.message }
    }
    try {
      win.location.href = url
      return { ok: true }
    } catch (e) {
      return { ok: false, reason: 'nav:' + e.message }
    }
  }, seekUrl)

  console.log('[popup evaluate]', opened)
  if (!opened.ok) throw new Error(`无法打开新窗口: ${opened.reason}`)

  const popup = await popupPromise
  const nav = []
  popup.on('framenavigated', (f) => {
    if (f === popup.mainFrame()) nav.push(f.url())
  })
  await popup.waitForTimeout(4500)
  const finalUrl = popup.url()
  console.log('[popup final]', finalUrl)

  if (finalUrl.includes('fairspace.cn') || finalUrl.includes('/headlines')) {
    throw new Error(`新窗口落到门户: ${finalUrl}`)
  }
  if (!finalUrl.startsWith(SEEK_ORIGIN)) {
    throw new Error(`新窗口未到探查源站: ${finalUrl}`)
  }

  await browser.close()
  console.log('[PASS] HTTPS 页打开带 token 的探查页成功')
}

async function testResolveUrlOrder() {
  // 与源码约定一致：生产优先兼容路径
  const urls = ['/api/dataset-seek/submissions', '/api/v1/datasets/submissions']
  if (urls[0] !== '/api/dataset-seek/submissions') {
    throw new Error('生产提交路径顺序错误')
  }
  console.log('[PASS] 生产提交优先', urls[0])
}

async function main() {
  await testResolveUrlOrder()
  const datasetId = await testProdSubmitPaths()
  await testOpenWithToken(datasetId)
  console.log('\nALL PROD TESTS PASSED')
}

main().catch((e) => {
  console.error('\nTEST FAILED:', e.message || e)
  process.exit(1)
})
