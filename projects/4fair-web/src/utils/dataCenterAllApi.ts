/** 空间枢纽列表 GET /tds-trading/order/dataCenter.all */

import type { SpaceHubNode } from '@/data/spaceHubs'
import { DATA_CENTERS, type DataCenterDef } from '@/utils/dataCenterRegistry'

export type DataCenterAllItem = {
  id: string
  dataCenterName: string
  orgName: string
  email: string
  introduction: string
  subject: string[]
  datasetType: string[]
  /** 枢纽图标 */
  coverUrl: string
  /** 数据集列表 JSON 地址 */
  datasetInfoFile: string
  /** 数据集列表页背景图 */
  backGroundUrl: string
  /** 是否可访问（1=可显示，0=隐藏） */
  isAccess?: number
}

function isOkCode(code: unknown): boolean {
  return code === 200 || code === 0 || code === '200'
}

function asRecord(v: unknown): Record<string, unknown> | null {
  return v && typeof v === 'object' ? (v as Record<string, unknown>) : null
}

function pickString(...vals: unknown[]): string {
  for (const v of vals) {
    if (typeof v === 'string' && v.trim()) return v.trim()
  }
  return ''
}

function pickStringList(v: unknown): string[] {
  if (!Array.isArray(v)) return []
  return v.map((x) => String(x || '').trim()).filter(Boolean)
}

/** 解析封面地址：支持绝对 URL / 站内相对路径 */
function resolveCoverUrl(raw: string): string {
  const url = String(raw || '').trim()
  if (!url) return ''
  if (/^https?:\/\//i.test(url) || url.startsWith('data:') || url.startsWith('blob:')) return url
  if (url.startsWith('//')) return `https:${url}`
  if (url.startsWith('/')) return url
  return `/${url}`
}

/**
 * 数据集 JSON 地址转同域可请求路径，避免 CORS：
 * https://fairspace.cn/datasetFile/xxx.json → /datasetFile/xxx.json
 */
export function toLocalDatasetInfoFileUrl(raw: string): string {
  const url = String(raw || '').trim()
  if (!url) return ''
  try {
    if (/^https?:\/\//i.test(url)) {
      const u = new URL(url)
      if (/space\.4fair\.cn$/i.test(u.hostname) && u.pathname.startsWith('/datasetFile/')) {
        return `${u.pathname}${u.search || ''}`
      }
      return url
    }
  } catch {
    /* ignore */
  }
  if (url.startsWith('/')) return url
  if (url.startsWith('datasetFile/')) return `/${url}`
  return url
}

function mapItem(raw: unknown): DataCenterAllItem | null {
  const o = asRecord(raw)
  if (!o) return null
  const id = pickString(o.id, o.dataCenterId)
  const dataCenterName = pickString(o.dataCenterName, o.name, o.centerName)
  if (!id && !dataCenterName) return null
  return {
    id: id || dataCenterName,
    dataCenterName: dataCenterName || id,
    orgName: pickString(o.orgName, o.organization, o.org),
    email: pickString(o.email, o.contactEmail, o.contractorEamil),
    introduction: pickString(o.introduction, o.description, o.summary),
    subject: pickStringList(o.subject ?? o.subjects),
    datasetType: pickStringList(o.datasetType ?? o.dataTypes ?? o.dataType),
    coverUrl: resolveCoverUrl(pickString(o.coverUrl, o.logoUrl, o.icon, o.logo)),
    datasetInfoFile: pickString(
      o.datasetInfoFile,
      o.dataset_info_file,
      o.dataConfigUrl,
      o.configUrl
    ),
    backGroundUrl: resolveCoverUrl(
      pickString(o.backGroundUrl, o.backgroundUrl, o.bgUrl, o.listBgUrl)
    ),
    isAccess: typeof o.isAccess === 'number' ? o.isAccess : Number(o.isAccess) || 0
  }
}

/** 按名称关键字关联本地数据中心（用于分析数据集跳转） */
export function resolveLinkedDataCenter(name: string): DataCenterDef | undefined {
  const text = name.trim()
  if (!text) return undefined
  const scored = DATA_CENTERS.map((c) => {
    const hit = c.keywords
      .filter((k) => text.includes(k) || k.includes(text) || text.includes(c.name))
      .sort((a, b) => b.length - a.length)[0]
    return { c, score: hit ? hit.length : 0 }
  })
    .filter((x) => x.score > 0)
    .sort((a, b) => b.score - a.score)
  return scored[0]?.c
}

export function toSpaceHubNode(item: DataCenterAllItem): SpaceHubNode {
  const linked = resolveLinkedDataCenter(item.dataCenterName)
  const fallbackById: Record<string, string> = {
    tpdc: '/information-sources/tpdc.jpg',
    scidb: '/favicon.ico',
    chem: '/favicon.ico'
  }
  const fallbackLogo = (linked && fallbackById[linked.id]) || '/favicon.ico'
  return {
    id: item.id,
    name: item.dataCenterName,
    homePage: item.email ? `mailto:${item.email}` : '#',
    orgName: item.orgName || '—',
    contactEmail: item.email || '—',
    logoUrl: item.coverUrl || fallbackLogo,
    subjects: item.subject,
    dataTypes: item.datasetType,
    description: item.introduction || '暂无简介',
    dataCenterId: linked?.id,
    datasetInfoFile: item.datasetInfoFile || undefined,
    backGroundUrl: item.backGroundUrl || undefined,
    statisticsSource: linked?.name || item.dataCenterName.replace(/枢纽$/, ''),
    serviceCount: 0,
    lastUpdatedAt: '',
    isAccess: item.isAccess
  }
}

let cachedHubs: SpaceHubNode[] | null = null
let cachedAt = 0
const CACHE_MS = 60_000

/**
 * GET /tds-trading/order/dataCenter.all
 * @see https://fairspace.cn/tds-trading/order/dataCenter.all
 */
export async function fetchDataCenterAll(force = false): Promise<SpaceHubNode[]> {
  const now = Date.now()
  if (!force && cachedHubs && now - cachedAt < CACHE_MS) {
    return cachedHubs
  }

  const res = await fetch('/tds-trading/order/dataCenter.all', {
    headers: { Accept: 'application/json' }
  })
  if (!res.ok) throw new Error(`空间枢纽列表请求失败（${res.status}）`)

  const json = (await res.json()) as unknown
  const root = asRecord(json)
  if (!root || !isOkCode(root.code)) {
    throw new Error(pickString(root?.message) || '空间枢纽列表返回异常')
  }

  const list = Array.isArray(root.data) ? root.data : []
  cachedHubs = list
    .map(mapItem)
    .filter((x): x is DataCenterAllItem => !!x)
    .map(toSpaceHubNode)
  cachedAt = now
  return cachedHubs
}

/** 按本地 centerId（tpdc/scidb/chem）解析枢纽 datasetInfoFile */
export async function resolveDatasetInfoFileByCenterId(centerId: string): Promise<string> {
  const hub = await findHubByCenterId(centerId)
  return hub?.datasetInfoFile || ''
}

/** 按本地 centerId 解析数据集列表页背景图 backGroundUrl */
export async function resolveBackgroundUrlByCenterId(centerId: string): Promise<string> {
  const hub = await findHubByCenterId(centerId)
  return hub?.backGroundUrl || ''
}

/** 按本地 centerId 解析 dataCenter.json 参数 dataCenterName（空间枢纽名称） */
export async function resolveDataCenterNameByCenterId(centerId: string): Promise<string> {
  const hub = await findHubByCenterId(centerId)
  if (hub) {
    return (
      hub.statisticsSource?.trim() ||
      hub.name.replace(/枢纽$/, '').trim() ||
      hub.name.trim()
    )
  }
  const center = DATA_CENTERS.find((c) => c.id === String(centerId || '').trim())
  return center?.name?.trim() || ''
}

/**
 * HTTPS 页面加载 HTTP 背景图会被浏览器拦截（混合内容）。
 * ChemDC 官方站仅提供 http://chemdc.casdc.cn/...，无可用 HTTPS。
 */
export function isMixedContentBackgroundUrl(url: string): boolean {
  if (typeof window === 'undefined') return false
  if (window.location.protocol !== 'https:') return false
  return /^http:\/\//i.test(String(url || '').trim())
}

/** 尝试将 http 背景升为 https（ChemDC 等无证书的站点不适用） */
export function preferHttpsBackgroundUrl(url: string): string {
  const u = String(url || '').trim()
  if (/^http:\/\//i.test(u)) return `https://${u.slice('http://'.length)}`
  return u
}

async function findHubByCenterId(centerId: string) {
  const id = String(centerId || '').trim()
  if (!id) return null
  try {
    const hubs = await fetchDataCenterAll()
    const byId = hubs.find((h) => h.dataCenterId === id)
    if (byId) return byId
    const center = DATA_CENTERS.find((c) => c.id === id)
    if (!center) return null
    return (
      hubs.find((h) =>
        center.keywords.some((k) => h.name.includes(k) || k.includes(h.name.replace(/枢纽$/, '')))
      ) || null
    )
  } catch {
    return null
  }
}
