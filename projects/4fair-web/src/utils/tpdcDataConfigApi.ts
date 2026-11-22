/** 线上 tpdc_data_config.json 字段；旧字段名作兼容别名 */
export type TpdcDatasetConfig = {
  /** 数据集 UUID（线上字段 external_id） */
  external_id: string
  /** 数据集名称（线上字段 name） */
  name: string
  /** 简介（线上字段 summary） */
  summary?: string
  dataSetPicture?: string
  byteSize?: string
  updateAt?: string
  keywords?: string
  /** 作者（线上字段 authors） */
  authors?: string
  storage_directory?: string
  dataSetOther?: string
  /** 为 true 且数据中心为 tpdc 时，探查提交携带 ncViewUrl */
  permanentLink?: boolean
  时间尺度?: Record<string, string>
  指标类型?: Record<string, string>
  /** 勾选的工具市场工具 id，与 Pangeo ANALYSIS 工具对齐 */
  tools?: string[]
  /** @deprecated 兼容旧配置 / 模板，读取时由 normalize 填入 */
  dataSetUuid?: string
  /** @deprecated 兼容旧配置 / 模板，读取时由 normalize 填入 */
  dataSetName?: string
  /** @deprecated 兼容旧配置 / 模板，读取时由 normalize 填入 */
  introductionZh?: string
  [key: string]: unknown
}

export function tpdcDatasetId(item: Pick<TpdcDatasetConfig, 'external_id' | 'dataSetUuid'>): string {
  return String(item.external_id || item.dataSetUuid || '').trim()
}

export function tpdcDatasetName(item: Pick<TpdcDatasetConfig, 'name' | 'dataSetName'>): string {
  return String(item.name || item.dataSetName || '').trim()
}

export function tpdcDatasetSummary(
  item: Pick<TpdcDatasetConfig, 'summary' | 'introductionZh'>
): string {
  return String(item.summary || item.introductionZh || '').trim()
}

/** 将线上/旧版任意一条配置归一为双字段可用结构 */
export function normalizeTpdcDatasetConfig(raw: unknown): TpdcDatasetConfig {
  const o = raw && typeof raw === 'object' ? (raw as Record<string, unknown>) : {}
  const id = String(o.external_id ?? o.dataSetUuid ?? '').trim()
  const name = String(o.name ?? o.dataSetName ?? '').trim()
  const summary = String(o.summary ?? o.introductionZh ?? '').trim()
  const keywords = String(o.keywords ?? '').trim()
  const authors = String(o.authors ?? '').trim()
  const storageDir = String(
    o.storage_directory ?? o.storageDirectory ?? o.storage_dir ?? o.storagePath ?? ''
  ).trim()
  const permanentLinkRaw = o.permanentLink ?? o.permanent_link
  const permanentLink =
    permanentLinkRaw === true ||
    permanentLinkRaw === 1 ||
    permanentLinkRaw === '1' ||
    String(permanentLinkRaw || '').trim().toLowerCase() === 'true'
  return {
    ...o,
    external_id: id,
    name,
    summary: summary || undefined,
    keywords: keywords || undefined,
    authors: authors || undefined,
    storage_directory: storageDir || (id ? `/mnt/data/${id}` : undefined),
    permanentLink: permanentLink || undefined,
    dataSetPicture: o.dataSetPicture != null ? String(o.dataSetPicture) : undefined,
    byteSize: o.byteSize != null ? String(o.byteSize) : undefined,
    updateAt: o.updateAt != null ? String(o.updateAt) : undefined,
    dataSetOther: o.dataSetOther != null ? String(o.dataSetOther) : undefined,
    时间尺度:
      o['时间尺度'] && typeof o['时间尺度'] === 'object'
        ? (o['时间尺度'] as Record<string, string>)
        : undefined,
    指标类型:
      o['指标类型'] && typeof o['指标类型'] === 'object'
        ? (o['指标类型'] as Record<string, string>)
        : undefined,
    tools: Array.isArray(o.tools) ? (o.tools as string[]) : undefined,
    // 兼容旧模板绑定
    dataSetUuid: id,
    dataSetName: name,
    introductionZh: summary || undefined
  }
}

/** 写入 JSON 时使用线上字段名 */
export function toTpdcConfigWire(item: TpdcDatasetConfig): Record<string, unknown> {
  const id = tpdcDatasetId(item)
  const name = tpdcDatasetName(item)
  const summary = tpdcDatasetSummary(item)
  const wire: Record<string, unknown> = {
    external_id: id,
    name,
    dataSetPicture: item.dataSetPicture?.trim() || undefined,
    summary: summary || undefined,
    byteSize: item.byteSize?.trim() || undefined,
    updateAt: item.updateAt?.trim() || undefined,
    keywords: String(item.keywords || '').trim() || undefined,
    authors: String(item.authors || '').trim() || undefined,
    storage_directory: String(item.storage_directory || '').trim() || undefined,
    dataSetOther: item.dataSetOther?.trim() || undefined,
    permanentLink: item.permanentLink === true ? true : undefined,
    时间尺度: item.时间尺度,
    指标类型: item.指标类型,
    tools: item.tools
  }
  for (const key of Object.keys(wire)) {
    if (wire[key] === undefined) delete wire[key]
  }
  return wire
}

const API_BASE = '/api/tpdc-data-config'
/** 线上配置（生产同域路径） */
const ONLINE_CONFIG_PATH = '/datasetFile/tpdc_data_config.json'
/** 本地开发走 Vite 代理，避免 CORS */
const DEV_REMOTE_CONFIG_PATH = '/__remote/tpdc_data_config.json'
const REMOTE_CONFIG_URL =
  String(import.meta.env.VITE_TPDC_DATA_CONFIG_URL || '').trim() ||
  'https://fairspace.cn/datasetFile/tpdc_data_config.json'

/** 仅读线上配置，不读本地 public JSON */
function resolveTpdcConfigReadUrls(): string[] {
  const bust = `t=${Date.now()}`
  const withBust = (url: string) => `${url}${url.includes('?') ? '&' : '?'}${bust}`
  if (import.meta.env.DEV) {
    return [withBust(DEV_REMOTE_CONFIG_PATH), withBust(REMOTE_CONFIG_URL)]
  }
  return [withBust(ONLINE_CONFIG_PATH), withBust(REMOTE_CONFIG_URL)]
}

const TPDC_ORG_KEYWORDS = ['国家青藏高原科学数据中心', '青藏高原科学数据中心', 'TPDC', 'tpdc']

export function isTpdcInstitution(input?: {
  institution?: string
  orgName?: string
  affiliation?: string
} | null): boolean {
  const text = [input?.institution, input?.orgName, input?.affiliation]
    .map((v) => String(v || '').trim())
    .filter(Boolean)
    .join(' ')
  if (!text) return false
  return TPDC_ORG_KEYWORDS.some((keyword) => text.includes(keyword))
}

async function parseApiResponse<T>(res: Response): Promise<T> {
  const contentType = res.headers.get('content-type') || ''
  if (!contentType.includes('application/json')) {
    if (res.status === 405) {
      throw new Error(
        '线上未配置数据集写接口（405）。请部署 scripts/tpdc-data-config-api.mjs，并由 Nginx 反代 /api/tpdc-data-config'
      )
    }
    throw new Error(`接口返回非 JSON（${res.status}）`)
  }
  const json = (await res.json().catch(() => null)) as {
    code?: number
    data?: T
    message?: string
  } | null
  if (!json || typeof json !== 'object') {
    throw new Error('接口响应无效')
  }
  if (!res.ok || (json.code != null && json.code !== 0)) {
    throw new Error(json.message || `请求失败（${res.status}）`)
  }
  if (!('data' in json) || json.data === undefined) {
    throw new Error(json.message || '接口未返回 data')
  }
  return json.data as T
}

function ensureConfigArray(data: unknown): TpdcDatasetConfig[] {
  if (!Array.isArray(data)) {
    throw new Error('配置文件格式无效：期望数组')
  }
  return data.map((row) => normalizeTpdcDatasetConfig(row))
}

export async function fetchTpdcDatasetConfigs(): Promise<TpdcDatasetConfig[]> {
  // 仅读线上 https://fairspace.cn/datasetFile/tpdc_data_config.json
  for (const url of resolveTpdcConfigReadUrls()) {
    try {
      const res = await fetch(url, { headers: { Accept: 'application/json' } })
      if (!res.ok) continue
      const data = await res.json().catch(() => null)
      return ensureConfigArray(data)
    } catch {
      // try next
    }
  }

  throw new Error('加载数据集配置失败（线上）')
}

export async function createTpdcDatasetConfig(item: TpdcDatasetConfig): Promise<TpdcDatasetConfig> {
  const res = await fetch(API_BASE, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify(toTpdcConfigWire(item))
  })
  return normalizeTpdcDatasetConfig(await parseApiResponse<unknown>(res))
}

export async function updateTpdcDatasetConfig(
  uuid: string,
  item: TpdcDatasetConfig
): Promise<TpdcDatasetConfig> {
  const res = await fetch(`${API_BASE}/${encodeURIComponent(uuid)}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify(toTpdcConfigWire(item))
  })
  return normalizeTpdcDatasetConfig(await parseApiResponse<unknown>(res))
}

export async function deleteTpdcDatasetConfig(uuid: string): Promise<void> {
  const res = await fetch(`${API_BASE}/${encodeURIComponent(uuid)}`, {
    method: 'DELETE',
    headers: { Accept: 'application/json' }
  })
  await parseApiResponse<boolean>(res)
}

export function formatByteSize(size?: string): string {
  const n = Number(size)
  if (!Number.isFinite(n) || n < 0) return size || '—'
  if (n < 1024) return `${n} B`
  if (n < 1024 ** 2) return `${(n / 1024).toFixed(1)} KB`
  if (n < 1024 ** 3) return `${(n / 1024 ** 2).toFixed(1)} MB`
  if (n < 1024 ** 4) return `${(n / 1024 ** 3).toFixed(2)} GB`
  return `${(n / 1024 ** 4).toFixed(2)} TB`
}

export function emptyTpdcDatasetForm(): TpdcDatasetConfig {
  return {
    external_id: '',
    name: '',
    summary: '',
    dataSetPicture: '',
    byteSize: '',
    updateAt: new Date().toISOString().slice(0, 10),
    keywords: '',
    storage_directory: '',
    dataSetOther: '',
    时间尺度: {},
    指标类型: {},
    tools: [],
    dataSetUuid: '',
    dataSetName: '',
    introductionZh: ''
  }
}
