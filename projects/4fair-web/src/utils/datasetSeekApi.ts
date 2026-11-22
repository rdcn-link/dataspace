import type { AnalysisToolApiItem } from '@/utils/analysisToolApi'
import type { TpdcDatasetConfig } from '@/utils/tpdcDataConfigApi'
import { tpdcDatasetId, tpdcDatasetName, tpdcDatasetSummary } from '@/utils/tpdcDataConfigApi'

/** 数据探查服务默认源站（与工具 url 同源） */
export const DATASET_SEEK_ORIGIN_DEFAULT = 'https://dataseek.tpdc.ac.cn'

/**
 * chem / scidb / nbsdc / kiz 数据中心探查链路：
 * - chem：所有数据集统一直连 https://chemdc.fairspace.cn（仿青藏高原直连形式）
 * - scidb / nbsdc / kiz：走同源反代 /api/dataset-seek/（Nginx 转发到测试源站，规避 CORS），探查页直连 http://39.106.98.67:7000
 */
const SEEK_TEST_CENTER_IDS = new Set(['chem', 'scidb', 'nbsdc', 'kiz'])

/** chem/scidb 探查页源站（测试服务器，HTTP） */
export const DATASET_SEEK_TEST_ORIGIN = 'http://39.106.98.67:7000'

/** chem/scidb 提交探查的同源反代路径（Nginx: /api/dataset-seek/ → 测试源站 /api/v1/datasets/） */
const SEEK_PROXY_SUBMIT_PATH = '/api/dataset-seek/submissions'

/** 判断是否走测试探查源站的数据中心 */
export function isSeekTestCenter(centerId?: string): boolean {
  return SEEK_TEST_CENTER_IDS.has(String(centerId || '').trim().toLowerCase())
}

/** chem 直连源站（chem 中心所有数据集均走此直连，仿青藏高原直连形式） */
export const DATASET_SEEK_CHEM_ORIGIN = 'https://chemdc.fairspace.cn'

/** chem 中心是否走 chemdc 直连（chem 所有数据集统一直连，不按 external_id 区分） */
export function isChemDirectSeekDataset(centerId?: string, _externalId?: string): boolean {
  return String(centerId || '').trim().toLowerCase() === 'chem'
}

/**
 * 探查提交地址（与本地一致，直连探查源站）：
 * POST https://dataseek.tpdc.ac.cn/api/v1/datasets/submissions
 */
const SEEK_SUBMIT_PATH = '/api/v1/datasets/submissions'

/** 门户站主机：禁止用作探查 API 源站 / 禁止 POST 其根路径 */
const FORBIDDEN_SEEK_HOSTS = new Set(['fairspace.cn'])

export type DatasetSeekSubmitPayload = {
  external_id: string
  name: string
  summary: string
  keywords: string[]
  storage_directory: string
  /** SSO token：POST /oidc-server/sso/token?uid= */
  token?: string
  /**
   * 仅青藏高原数据中心（tpdc）白名单内数据集携带：
   * https://databox.tpdc.ac.cn/?folder_id={external_id}
   * 其他数据中心及白名单外的 tpdc 数据集不携带此字段。
   */
  ncViewUrl?: string
}

/** 提交探查 / 打开探查页：拉取 SSO token */
const ENABLE_SEEK_SSO_TOKEN = true

/** NC 查看入口（仅 TPDC） */
const NC_VIEW_URL_BASE = 'https://databox.tpdc.ac.cn'

/** 可携带 ncViewUrl 的数据中心 */
const NC_VIEW_CENTER_ID = 'tpdc'

/**
 * ncViewUrl 白名单：仅这些 external_id 携带 ncViewUrl。
 * 来源：GET /tds-trading/order/dataCenter.json?dataCenterName=国家青藏高原科学数据中心
 * 当前接口返回 2 个数据集；未来新增的 tpdc 数据集不携带 ncViewUrl。
 */
const NC_VIEW_URL_WHITELIST = new Set<string>([
  'e60dfd96-5fd8-493f-beae-e8e5d24dece4',
  'be562de3-6367-402f-956d-59f7c21ad294'
])

/** 是否应在 submissions 中携带 ncViewUrl：tpdc 且 external_id 在白名单内 */
export function shouldIncludeNcViewUrl(
  centerId: string | undefined,
  externalId?: string
): boolean {
  if (String(centerId || '').trim().toLowerCase() !== NC_VIEW_CENTER_ID) return false
  const id = String(externalId || '').trim()
  if (!id) return false
  return NC_VIEW_URL_WHITELIST.has(id)
}

/** 拼完整 ncViewUrl（不得截断） */
export function buildDatasetNcViewUrl(externalId: string): string {
  const id = String(externalId || '').trim()
  if (!id) throw new Error('缺少 external_id，无法生成 ncViewUrl')
  const base = NC_VIEW_URL_BASE.replace(/\/$/, '')
  return `${base}/?folder_id=${encodeURIComponent(id)}`
}

export type DatasetSeekSubmitResult = {
  datasetId: string
  seekUrl: string
}

function asRecord(v: unknown): Record<string, unknown> | null {
  return v && typeof v === 'object' ? (v as Record<string, unknown>) : null
}

function pickString(...vals: unknown[]): string {
  for (const v of vals) {
    if (typeof v === 'string' && v.trim()) return v.trim()
    if (typeof v === 'number' && Number.isFinite(v)) return String(v)
  }
  return ''
}

/** 是否为「数据探查」工具（按名称或 seek 入口 url 识别） */
export function isDataSeekTool(tool: Pick<AnalysisToolApiItem, 'label' | 'toolUrl' | 'id'>): boolean {
  const label = String(tool.label || '').trim()
  const url = String(tool.toolUrl || '').trim().toLowerCase()
  if (label.includes('数据探查')) return true
  if (url.includes('/dataset/seek')) return true
  return false
}

export function parseDatasetKeywords(raw?: string | string[] | null): string[] {
  if (Array.isArray(raw)) {
    return raw.map((s) => String(s || '').trim()).filter(Boolean)
  }
  const text = String(raw || '').trim()
  if (!text) return []
  return text
    .split(/[,，、;/|]+/)
    .map((s) => s.trim())
    .filter(Boolean)
}

function isOkCode(code: unknown): boolean {
  return code === 200 || code === 0 || code === '200' || code === '0'
}

/** 禁止 POST https://fairspace.cn/ 这类门户根路径 */
function isForbiddenSeekSubmitUrl(apiUrl: string): boolean {
  const raw = String(apiUrl || '').trim()
  if (!raw || raw === '/' || raw === './') return true
  try {
    const base =
      typeof window !== 'undefined' ? window.location.href : 'https://fairspace.cn/'
    const u = new URL(raw, base)
    const path = u.pathname.replace(/\/+$/, '') || '/'
    if (path === '/') return true
    return false
  } catch {
    return true
  }
}

/**
 * 获取数据探查提交用 SSO token
 * POST /oidc-server/sso/token?uid=
 */
export async function fetchDatasetSeekSsoToken(uid: string): Promise<string> {
  const id = String(uid || '').trim()
  if (!id) throw new Error('缺少用户 uid，无法获取 token')

  const res = await fetch(`/oidc-server/sso/token?uid=${encodeURIComponent(id)}`, {
    method: 'POST',
    headers: { Accept: 'application/json' }
  })
  const json = (await res.json().catch(() => null)) as unknown
  const body = asRecord(json)

  if (!res.ok) {
    throw new Error(pickString(body?.message, body?.msg) || `获取 token 失败（${res.status}）`)
  }
  if (body && 'code' in body && !isOkCode(body.code)) {
    throw new Error(pickString(body.message, body.msg) || '获取 token 失败')
  }

  const data = body?.data
  const token =
    pickString(
      typeof data === 'string' ? data : null,
      asRecord(data)?.token,
      asRecord(data)?.accessToken,
      asRecord(data)?.access_token,
      body?.token,
      body?.accessToken,
      body?.access_token
    ) || ''

  if (!token) throw new Error('token 接口未返回有效凭证')
  return token
}

export function buildDatasetSeekPayload(
  dataset: TpdcDatasetConfig,
  token?: string,
  centerId?: string
): DatasetSeekSubmitPayload {
  const external_id = tpdcDatasetId(dataset)
  const name = tpdcDatasetName(dataset)
  const summary = tpdcDatasetSummary(dataset)
  const raw = dataset as Record<string, unknown>
  // 文档必填 storage_directory；兼容多字段名，缺省时按 external_id 推导
  const storage_directory =
    pickString(
      dataset.storage_directory,
      raw.storageDirectory,
      raw.storage_dir,
      raw.storagePath,
      raw.data_path,
      raw.dataPath
    ) || (external_id ? `/mnt/data/${external_id}` : '')

  const keywords = parseDatasetKeywords(dataset.keywords as string | string[] | undefined)
  // 上游要求 keywords 至少 1 项
  if (!keywords.length && name) keywords.push(name)
  if (!keywords.length) keywords.push('dataset')

  const payload: DatasetSeekSubmitPayload = {
    external_id,
    name,
    summary,
    keywords,
    storage_directory
  }
  // 仅青藏高原数据中心白名单内的数据集带 ncViewUrl；其他不携带
  if (shouldIncludeNcViewUrl(centerId, external_id) && external_id) {
    payload.ncViewUrl = buildDatasetNcViewUrl(external_id)
  }
  const credential = String(token || '').trim()
  if (ENABLE_SEEK_SSO_TOKEN && credential) {
    payload.token = credential
  }
  return payload
}

function resolveSeekOrigin(toolUrl?: string, _centerId?: string): string {
  const fromEnv = String(import.meta.env.VITE_DATASET_SEEK_ORIGIN || '').trim().replace(/\/$/, '')
  if (fromEnv) {
    try {
      const host = new URL(fromEnv).hostname.toLowerCase()
      if (FORBIDDEN_SEEK_HOSTS.has(host)) return DATASET_SEEK_ORIGIN_DEFAULT
    } catch {
      // ignore
    }
    return fromEnv
  }
  const raw = String(toolUrl || '').trim()
  if (raw) {
    try {
      const origin = new URL(raw).origin
      const host = new URL(origin).hostname.toLowerCase()
      // 工具入口若误配成门户站，不要用门户当探查 API 源
      if (FORBIDDEN_SEEK_HOSTS.has(host)) return DATASET_SEEK_ORIGIN_DEFAULT
      return origin
    } catch {
      // ignore
    }
  }
  return DATASET_SEEK_ORIGIN_DEFAULT
}

function resolveSubmitApiUrls(toolUrl?: string, centerId?: string, externalId?: string): string[] {
  // chem 所有数据集：直连 chemdc（仿青藏高原直连形式）
  if (isChemDirectSeekDataset(centerId, externalId)) {
    return [`${DATASET_SEEK_CHEM_ORIGIN}${SEEK_SUBMIT_PATH}`].filter((url) => !isForbiddenSeekSubmitUrl(url))
  }

  // chem/scidb 提交走同源反代（规避自签证书/CORS；探查页跳转才直连测试源站 HTTPS）
  if (isSeekTestCenter(centerId)) {
    return [SEEK_PROXY_SUBMIT_PATH].filter((url) => !isForbiddenSeekSubmitUrl(url))
  }

  const fromEnv = String(import.meta.env.VITE_DATASET_SEEK_API_URL || '').trim()
  if (fromEnv) {
    return isForbiddenSeekSubmitUrl(fromEnv) ? [] : [fromEnv]
  }

  // 线上/本地统一直连探查源站，避免走门户 /api/dataset-seek/ 反代
  const origin = resolveSeekOrigin(toolUrl, centerId)
  return [`${origin}${SEEK_SUBMIT_PATH}`].filter((url) => !isForbiddenSeekSubmitUrl(url))
}

/**
 * 探查页地址：
 * - tpdc：https://dataseek.tpdc.ac.cn/dataset/seek/{id}?token=...#token=...
 * - chem：https://chemdc.fairspace.cn/dataset/seek/{id}?token=...#token=...
 * - scidb / nbsdc / kiz：http://39.106.98.67:7000/dataset/seek/{id}?token=...#token=...
 *
 * - ?token=：探查前端读取并写入 sessionStorage（鉴权）
 * - #token=：探查页清掉 query.token 后，hash 仍留在地址栏
 * - ncViewUrl 仅出现在提交 body，不写入打开地址
 */
export function buildDatasetSeekPageUrl(
  datasetId: string,
  _toolUrl?: string,
  token?: string,
  centerId?: string,
  externalId?: string
): string {
  const id = String(datasetId || '').trim()
  if (!id) throw new Error('dataset_id 缺失')
  const t = String(token || '').trim()
  if (!t) throw new Error('缺少 token，无法打开数据探查')

  const q = encodeURIComponent(t)
  // chem 直连 chemdc；scidb/nbsdc 走测试探查源站
  const origin = isChemDirectSeekDataset(centerId, externalId)
    ? DATASET_SEEK_CHEM_ORIGIN
    : isSeekTestCenter(centerId)
      ? DATASET_SEEK_TEST_ORIGIN
      : DATASET_SEEK_ORIGIN_DEFAULT
  const base = `${origin}/dataset/seek/${encodeURIComponent(id)}`
  return `${base}?token=${q}#token=${q}`
}

/** 校验探查页地址：tpdc 须为 dataseek.tpdc.ac.cn；chem 须为 chemdc.fairspace.cn；scidb/nbsdc/kiz 须为测试源站；均须携带 token */
export function assertDatasetSeekPageUrl(seekUrl: string, centerId?: string, externalId?: string): string {
  const url = String(seekUrl || '').trim()
  if (!url) throw new Error('探查地址为空')

  let parsed: URL
  try {
    parsed = new URL(url)
  } catch {
    throw new Error('探查地址无效')
  }

  const expectedOrigin = isChemDirectSeekDataset(centerId, externalId)
    ? DATASET_SEEK_CHEM_ORIGIN
    : isSeekTestCenter(centerId)
      ? DATASET_SEEK_TEST_ORIGIN
      : DATASET_SEEK_ORIGIN_DEFAULT

  if (FORBIDDEN_SEEK_HOSTS.has(parsed.hostname.toLowerCase())) {
    throw new Error('探查地址不能指向门户站')
  }
  if (parsed.origin.replace(/\/$/, '') !== expectedOrigin) {
    throw new Error(`探查地址必须为 ${expectedOrigin}`)
  }
  if (!parsed.pathname.startsWith('/dataset/seek/')) {
    throw new Error('探查路径不正确')
  }
  const tokenInQuery = parsed.searchParams.get('token')?.trim() || ''
  const tokenInHash = parsed.hash.startsWith('#token=')
    ? decodeURIComponent(parsed.hash.slice('#token='.length)).trim()
    : ''
  if (!tokenInQuery && !tokenInHash) {
    throw new Error('探查地址缺少 token')
  }

  return parsed.toString()
}

/** 点击当下同步占住新窗口，避免 about:blank 被浏览器主页顶替 */
export function openSeekPlaceholderWindow(message = '数据集在线分析启动中…'): Window | null {
  const win = window.open('about:blank', '_blank')
  if (!win) return null
  writeSeekPlaceholder(win, message)
  return win
}

function writeSeekPlaceholder(win: Window, message: string, isError = false) {
  const safe = String(message || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
  const bg = isError ? '#fff1f2' : '#f8fafc'
  const color = isError ? '#881337' : '#0f172a'
  const spin = isError
    ? ''
    : `<div class="spin"></div>`
  try {
    win.document.open()
    win.document.write(
      `<!doctype html><html><head><meta charset="utf-8"/><title>数据探查</title>
      <style>body{font-family:system-ui,sans-serif;display:flex;align-items:center;justify-content:center;min-height:100vh;margin:0;background:${bg};color:${color}}
      .box{max-width:28rem;text-align:center;padding:1.5rem;background:#fff;border:1px solid #e2e8f0;border-radius:12px}
      .spin{width:28px;height:28px;border:3px solid #cbd5e1;border-top-color:#2563eb;border-radius:50%;margin:0 auto 1rem;animation:s .8s linear infinite}
      @keyframes s{to{transform:rotate(360deg)}}p{margin:0;line-height:1.6;word-break:break-word}</style></head>
      <body><div class="box">${spin}<p>${safe}</p></div></body></html>`
    )
    win.document.close()
  } catch {
    // ignore
  }
}

/** 将占位窗口导航到探查绝对地址（仅此一次） */
export function navigateDatasetSeekWindow(win: Window, seekUrl: string, centerId?: string, externalId?: string): void {
  const url = assertDatasetSeekPageUrl(seekUrl, centerId, externalId)
  win.location.href = url
}

/** 提交失败时在新窗口展示原因（不立刻 close，避免「弹一下就没了」） */
export function showSeekOpenError(win: Window | null, message: string): void {
  if (!win || win.closed) return
  writeSeekPlaceholder(win, message || '数据探查打开失败', true)
}

async function postDatasetSeek(
  apiUrl: string,
  payload: DatasetSeekSubmitPayload,
  centerId?: string,
  allowOneRedirect = true
): Promise<string> {
  if (isForbiddenSeekSubmitUrl(apiUrl)) {
    throw new Error('已跳过门户根地址提交（禁止 POST https://fairspace.cn/）')
  }

  const res = await fetch(apiUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify(payload),
    // 避免 30x 跳到门户首页后再次 POST 根路径触发 405
    redirect: 'manual'
  })

  if (res.type === 'opaqueredirect' || (res.status >= 300 && res.status < 400)) {
    const location = res.headers.get('Location') || res.headers.get('location') || ''
    if (!location || isForbiddenSeekSubmitUrl(location)) {
      throw new Error('探查提交 307/302 指向门户或无效地址，已拦截')
    }
    // 仅允许跟一次：同探查源站内的尾斜杠等跳转
    if (allowOneRedirect) {
      try {
        const next = new URL(location, apiUrl).toString()
          const seekOrigin = resolveSeekOrigin(undefined, centerId)
          if (next.startsWith(seekOrigin) && !isForbiddenSeekSubmitUrl(next)) {
            return postDatasetSeek(next, payload, centerId, false)
          }
      } catch {
        // fall through
      }
    }
    throw new Error(
      `探查提交被重定向（${res.status}${location ? ` → ${location}` : ''}），已中止`
    )
  }

  const finalUrl = String(res.url || apiUrl)
  if (isForbiddenSeekSubmitUrl(finalUrl)) {
    throw new Error('已阻止向门户根路径提交探查请求')
  }

  const text = await res.text()
  const trimmed = text.trim()

  if (res.status === 405) {
    throw new Error(
      '探查提交接口返回 405（Nginx 未放行 POST）。请按 scripts/nginx-dataset-seek-api.conf.snippet 配置 /api/v1/datasets/ 反代后重载 Nginx'
    )
  }

  if (!trimmed || trimmed.startsWith('<!') || trimmed.startsWith('<html')) {
    throw new Error(
      `探查提交接口未正确代理（${res.status}，返回了网页）。请配置 Nginx /api/v1/datasets/ 反代后重试`
    )
  }

  let json: unknown = null
  try {
    json = JSON.parse(trimmed)
  } catch {
    throw new Error(`探查提交响应无效（${res.status}）`)
  }

  const body = asRecord(json)
  if (!res.ok) {
    const msg = pickString(body?.msg, body?.message) || `提交失败（${res.status}）`
    throw new Error(msg)
  }

  const code = body?.code
  if (code != null && code !== 0 && code !== 200 && code !== '0' && code !== '200') {
    throw new Error(pickString(body?.msg, body?.message) || '提交失败')
  }

  const data = asRecord(body?.data) || body
  const datasetId = pickString(data?.dataset_id, data?.datasetId, data?.id)
  if (!datasetId) throw new Error('接口未返回 dataset_id')
  return datasetId
}

/**
 * POST /api/v1/datasets/submissions → dataset_id，再拼 seek 跳转地址（?token=）
 * body：
 * - token：始终携带（SSO）
 * - ncViewUrl：仅青藏高原数据中心（tpdc）白名单内数据集携带
 */
export async function submitDatasetSeek(
  dataset: TpdcDatasetConfig,
  toolUrl?: string,
  uid?: string,
  centerId?: string
): Promise<DatasetSeekSubmitResult> {
  const token = ENABLE_SEEK_SSO_TOKEN
    ? await fetchDatasetSeekSsoToken(String(uid || '').trim())
    : ''
  const payload = buildDatasetSeekPayload(dataset, token, centerId)
  if (!payload.external_id) throw new Error('数据集 external_id 缺失')
  if (!payload.name) throw new Error('数据集名称缺失')
  if (!payload.storage_directory) throw new Error('数据集 storage_directory 缺失，无法提交探查')
  if (ENABLE_SEEK_SSO_TOKEN && !token) throw new Error('缺少 token，无法提交/打开探查')

  const externalId = String(payload.external_id || '').trim()
  const urls = resolveSubmitApiUrls(toolUrl, centerId, externalId)
  if (!urls.length) throw new Error('没有可用的探查提交地址')

  let lastError: Error | null = null
  for (const apiUrl of urls) {
    try {
      const datasetId = await postDatasetSeek(apiUrl, payload, centerId)
      return {
        datasetId,
        seekUrl: buildDatasetSeekPageUrl(datasetId, toolUrl, token, centerId, externalId)
      }
    } catch (e: unknown) {
      lastError = e instanceof Error ? e : new Error('数据探查提交失败')
    }
  }
  throw lastError || new Error('数据探查提交失败')
}
