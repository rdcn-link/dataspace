import { assetDetailPath, normalizeCstr } from '@/utils/cstrUrl'
import { resolveInformationSourceCard } from '@/utils/informationSourceSites'
import { stripHtml } from '@/utils/richText'

export type InformationRelatedDataset = {
  cstr: string
  title: string
  source: string
  sourceHomeUrl: string
  href: string
}

export interface InformationRecord {
  id: string
  name: string
  description: string
  coverUrl: string | null
  source: string
  /** 来源机构官网（若后端提供则优先使用） */
  sourceUrl?: string | null
  /** 来源机构 logo（若后端提供则优先使用） */
  sourceLogoUrl?: string | null
  url: string
  updateAt: string
  cstr?: string[] | string | null
}

export interface InformationPageResult {
  total: number
  rows: InformationRecord[]
}

const LIST_API = '/tds-trading/order/information.page'
const DATASET_BY_CSTR_LIST_API = '/tds-trading/order/dataset.getByCstrList'
const INFORMATION_BY_CSTR_API = '/tds-trading/order/information.getByCstr'
const CACHE_KEY_PREFIX = 'fairspace:information:'

function cacheKey(id: string) {
  return `${CACHE_KEY_PREFIX}${id}`
}

export function cacheInformationRecord(record: InformationRecord) {
  const id = String(record.id || '').trim()
  if (!id) return
  try {
    sessionStorage.setItem(cacheKey(id), JSON.stringify(record))
  } catch {
    // 存储失败时忽略，详情页将回退到接口查询
  }
}

export function readCachedInformationRecord(id: string): InformationRecord | null {
  const target = String(id || '').trim()
  if (!target) return null
  try {
    const raw = sessionStorage.getItem(cacheKey(target))
    if (!raw) return null
    return JSON.parse(raw) as InformationRecord
  } catch {
    return null
  }
}

async function parseApiJson(res: Response): Promise<unknown> {
  const text = await res.text()
  if (!text.trim()) {
    throw new Error('接口返回为空')
  }
  try {
    return JSON.parse(text)
  } catch {
    throw new Error('接口返回格式异常')
  }
}

async function fetchInformationPageOnce(opts: {
  page: number
  pageSize: number
  source?: string
}): Promise<InformationPageResult> {
  const params = new URLSearchParams({
    page: String(opts.page),
    pageSize: String(opts.pageSize)
  })
  const source = String(opts.source || '').trim()
  if (source) {
    params.set('source', source)
  }
  const res = await fetch(`${LIST_API}?${params}`)
  const json = (await parseApiJson(res)) as {
    code?: number
    data?: { total?: number; rows?: InformationRecord[] }
    message?: string
  }
  if (json.code !== 200 || !json.data) {
    throw new Error(json.message || '获取资讯列表失败')
  }
  return {
    total: Number(json.data.total) || 0,
    rows: Array.isArray(json.data.rows) ? json.data.rows : []
  }
}

export async function fetchInformationPage(opts: {
  page: number
  pageSize: number
  source?: string
}): Promise<InformationPageResult> {
  let lastError: unknown
  for (let attempt = 0; attempt < 3; attempt += 1) {
    try {
      return await fetchInformationPageOnce(opts)
    } catch (e) {
      lastError = e
      if (attempt < 2) {
        await new Promise((resolve) => setTimeout(resolve, 300 * (attempt + 1)))
      }
    }
  }
  throw lastError instanceof Error ? lastError : new Error('获取资讯列表失败')
}

/** 无单条详情接口时，分页扫描列表匹配 id */
export async function fetchInformationById(id: string): Promise<InformationRecord | null> {
  const target = String(id || '').trim()
  if (!target) return null

  let page = 1
  const pageSize = 50
  while (true) {
    const { total, rows } = await fetchInformationPage({ page, pageSize })
    const found = rows.find((row) => row.id === target)
    if (found) return found
    if (page * pageSize >= total || rows.length === 0) return null
    page += 1
  }
}

export function isInformationHtmlUrl(url: string | null | undefined): boolean {
  const raw = String(url || '').trim().toLowerCase()
  if (!raw) return false
  return raw.endsWith('.html') || raw.endsWith('.htm') || raw.includes('.html?')
}

/** 资讯正文页地址（coverUrl 或 url 为 HTML 时优先） */
export function getInformationArticleUrl(record: Pick<InformationRecord, 'coverUrl' | 'url'>): string {
  const cover = String(record.coverUrl || '').trim()
  const link = String(record.url || '').trim()
  if (isInformationHtmlUrl(cover)) return cover
  if (isInformationHtmlUrl(link)) return link
  if (/^https?:\/\//i.test(link)) return link
  if (/^https?:\/\//i.test(cover)) return cover
  return ''
}

/** 列表缩略图（coverUrl 为图片时使用，HTML 地址不作为封面） */
export function getInformationThumbUrl(record: Pick<InformationRecord, 'coverUrl'>): string {
  const cover = String(record.coverUrl || '').trim()
  if (!cover || isInformationHtmlUrl(cover)) return ''
  return cover
}

export function formatInformationDate(iso: string): string {
  const raw = String(iso || '').trim()
  if (!raw) return ''
  const d = new Date(raw)
  if (Number.isNaN(d.getTime())) return raw.slice(0, 10)
  return d.toISOString().slice(0, 10)
}

export function informationSummary(description: string, maxLen = 160): string {
  const text = stripHtml(description)
  if (text.length <= maxLen) return text
  return `${text.slice(0, maxLen)}…`
}

/** 从费尔空间数据集详情链接或 cstr 查询参数提取 CSTR */
export function extractCstrFromUrl(url: string): string {
  const raw = String(url || '').trim()
  if (!raw) return ''

  const pathMatch = raw.match(/\/assets\/detail\/([^?#]+)/i)
  if (pathMatch?.[1]) return normalizeCstr(pathMatch[1])

  const queryMatch = raw.match(/[?&]cstr=([^&#]+)/i)
  if (queryMatch?.[1]) return normalizeCstr(queryMatch[1])

  try {
    const parsed = new URL(raw, 'https://fairspace.cn')
    const cstrParam = parsed.searchParams.get('cstr')
    if (cstrParam) return normalizeCstr(cstrParam)
  } catch {
    // ignore invalid URL
  }

  return ''
}

function normalizeCstrList(value: string[] | string | null | undefined): string[] {
  const raw = Array.isArray(value) ? value : value ? [value] : []
  const normalized = raw
    .map((item) => normalizeCstr(String(item || '')))
    .filter(Boolean)
  return [...new Set(normalized)]
}

/** 从资讯记录提取关联 CSTR 列表 */
export function getInformationCstrList(
  record: Pick<InformationRecord, 'cstr' | 'url'>
): string[] {
  const fromField = normalizeCstrList(record.cstr)
  if (fromField.length) return fromField

  const fromUrl = extractCstrFromUrl(record.url)
  return fromUrl ? [fromUrl] : []
}

function extractInformationRows(data: unknown): unknown[] {
  if (Array.isArray(data)) return data
  if (!data || typeof data !== 'object') return []

  const obj = data as Record<string, unknown>
  for (const key of ['rows', 'list', 'records', 'informationList', 'informations']) {
    const value = obj[key]
    if (Array.isArray(value)) return value
  }
  if (obj.information) return [obj.information]
  return []
}

function normalizeInformationRecord(item: unknown): InformationRecord | null {
  const row = (item && typeof item === 'object' ? item : {}) as Record<string, unknown>
  const id = String(row.id || '').trim()
  if (!id) return null

  return {
    id,
    name: String(row.name || row.title || row.titleZh || '无标题').trim(),
    description: String(row.description || row.introductionZh || row.introduction || ''),
    coverUrl: row.coverUrl != null ? String(row.coverUrl) : null,
    source: String(row.source || ''),
    sourceUrl: row.sourceUrl != null ? String(row.sourceUrl) : null,
    sourceLogoUrl: row.sourceLogoUrl != null ? String(row.sourceLogoUrl) : null,
    url: String(row.url || ''),
    updateAt: String(row.updateAt || row.updateTime || row.publishAt || ''),
    cstr: (row.cstr as InformationRecord['cstr']) ?? null
  }
}

/** 根据 CSTR 查询关联资讯 */
export async function fetchInformationByCstr(cstr: string): Promise<InformationRecord[]> {
  const target = normalizeCstr(String(cstr || ''))
  if (!target) return []

  const params = new URLSearchParams({ cstr: target })
  const res = await fetch(`${INFORMATION_BY_CSTR_API}?${params}`)
  const json = (await parseApiJson(res)) as {
    code?: number
    data?: unknown
    message?: string
  }

  if (json.code !== 200) {
    throw new Error(json.message || '获取相关资讯失败')
  }

  return extractInformationRows(json.data)
    .map(normalizeInformationRecord)
    .filter((item): item is InformationRecord => Boolean(item))
}

function extractDatasetRows(data: unknown): unknown[] {
  if (Array.isArray(data)) return data
  if (!data || typeof data !== 'object') return []

  const obj = data as Record<string, unknown>
  for (const key of ['rows', 'list', 'records', 'dataSets', 'datasets', 'dataSetList']) {
    const value = obj[key]
    if (Array.isArray(value)) return value
  }
  if (obj.DataSet) return [obj.DataSet]
  return []
}

function mapDatasetToRelated(item: unknown): InformationRelatedDataset | null {
  const row = (item && typeof item === 'object' ? item : {}) as Record<string, unknown>
  const nested = row.DataSet || row.dataSet || row.dataset
  const ds = (
    nested && typeof nested === 'object' ? nested : row
  ) as Record<string, unknown>

  const cstr = normalizeCstr(String(ds.cstr || ds.id || row.cstr || row.id || ''))
  if (!cstr) return null

  const title = String(ds.titleZh || ds.title || ds.name || row.titleZh || row.title || '无标题').trim()
  const source = String(ds.source || ds.publisher || ds.institution || row.source || '').trim()
  const sourceHomeUrl = resolveInformationSourceCard({ source })?.homeUrl || ''

  return {
    cstr,
    title,
    source,
    sourceHomeUrl,
    href: assetDetailPath(cstr)
  }
}

/** 根据资讯 cstr 列表查询关联数据集 */
export async function fetchInformationRelatedDatasets(
  record: Pick<InformationRecord, 'cstr' | 'url'>
): Promise<InformationRelatedDataset[]> {
  const cstrList = getInformationCstrList(record)
  if (!cstrList.length) return []

  const params = new URLSearchParams()
  cstrList.forEach((cstr) => params.append('cstrList', cstr))

  const res = await fetch(`${DATASET_BY_CSTR_LIST_API}?${params}`)
  const json = (await parseApiJson(res)) as {
    code?: number
    data?: unknown
    message?: string
  }

  if (json.code !== 200) {
    throw new Error(json.message || '获取相关数据集失败')
  }

  const rows = extractDatasetRows(json.data)
  const mapped = rows
    .map(mapDatasetToRelated)
    .filter((item): item is InformationRelatedDataset => Boolean(item))

  const order = new Map(cstrList.map((cstr, index) => [cstr, index]))
  mapped.sort((a, b) => (order.get(a.cstr) ?? 999) - (order.get(b.cstr) ?? 999))
  return mapped
}
