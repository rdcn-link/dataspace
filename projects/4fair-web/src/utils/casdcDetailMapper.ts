/**
 * 将后端 DataSet 映射为 CASDC 详情页展示模型
 * 字段对齐 CASDC /resources/getResourcesDetails 页面结构
 */
export type CasdcPrivacyType = 'open' | 'notOpen' | 'condition' | 'protect' | 'unknown'

export type CasdcDatasetDetail = {
  id: string
  name: string
  nameEn: string
  description: string
  descriptionEn: string
  resourceType: string
  publicationDate: string
  updateDate: string
  keywords: string[]
  keywordsEn: string[]
  authors: string[]
  publisher: string
  subject: string
  subjectEn: string
  doi: string
  cstr: string
  isbn: string
  shareMode: string
  privacyType: CasdcPrivacyType
  privacyLabel: string
  license: string
  fileSize: string
  fileCount: number
  format: string
  version: string
  visitNum: number
  followNum: number
  downloadNum: number
  coverUrl: string
  bannerUrl: string
  datasetRemoteUrl: string
  url: string
  referenceLink: string
  showFile: boolean
}

/** 接口 shareMode 转中文展示（如 PUBLIC → 开放共享） */
export function formatShareModeLabel(shareMode: string): string {
  const mode = (shareMode || '').trim()
  if (!mode) return '开放共享'
  const upper = mode.toUpperCase()
  if (upper === 'PUBLIC' || upper.includes('OPEN')) return '开放共享'
  if (mode.includes('开放')) return '开放共享'
  if (upper === 'REVIEW' || mode.includes('审核')) return '审核使用'
  if (upper === 'CONTROLLED' || mode.includes('受控') || mode.includes('协议')) return '受控使用'
  if (mode.includes('暂不')) return '暂不共享'
  return mode
}

function mapShareModeToPrivacy(shareMode: string): { type: CasdcPrivacyType; label: string } {
  const mode = (shareMode || '').trim()
  const upper = mode.toUpperCase()
  if (!mode || mode.includes('开放') || upper === 'PUBLIC' || upper.includes('OPEN')) {
    return { type: 'open', label: formatShareModeLabel(mode) }
  }
  if (mode.includes('审核')) return { type: 'condition', label: '申请共享' }
  if (mode.includes('受控') || mode.includes('协议')) return { type: 'protect', label: '协议共享' }
  if (mode.includes('暂不')) return { type: 'notOpen', label: '暂不共享' }
  return { type: 'unknown', label: mode || '未知' }
}

function tryParseJsonValue(raw: unknown): unknown {
  if (typeof raw !== 'string') return raw
  const s = raw.trim()
  if (!s.startsWith('[') && !s.startsWith('{')) return raw
  try {
    return JSON.parse(s) as unknown
  } catch {
    return raw
  }
}

function splitTokens(raw: unknown): string[] {
  if (!raw) return []
  const parsed = tryParseJsonValue(raw)
  if (Array.isArray(parsed)) {
    return parsed
      .map((item) => {
        if (typeof item === 'string') return item.trim()
        if (item && typeof item === 'object') {
          const o = item as Record<string, unknown>
          const zh = String(o.nameZh || o.name_zh || '').trim()
          if (zh) return zh
          return String(o.nameEn || o.name_en || o.name || o.keyword || o.value || '').trim()
        }
        return String(item).trim()
      })
      .filter(Boolean)
  }
  return String(parsed)
    .split(/[；;、,，\s]+/)
    .map((s) => s.trim())
    .filter(Boolean)
}

/** 从 JSON 对象项提取展示名（prefer=zh 优先 nameZh，prefer=en 优先 nameEn） */
function extractLabelFromItem(item: unknown, prefer: 'zh' | 'en'): string {
  if (typeof item === 'string') return item.trim()
  if (item && typeof item === 'object') {
    const o = item as Record<string, unknown>
    const zh = String(o.nameZh || o.name_zh || '').trim()
    const en = String(o.nameEn || o.name_en || o.name || '').trim()
    if (prefer === 'zh') return zh || en
    return en || zh
  }
  return String(item).trim()
}

function joinLabels(items: string[]): string {
  return items.filter(Boolean).join('；')
}

/** 解析含 nameZh 的 JSON 分类字段，仅展示 nameZh（无则回退 nameEn） */
export function parseNameZhLabel(raw: unknown): string {
  if (!raw) return ''
  const parsed = tryParseJsonValue(raw)
  if (Array.isArray(parsed)) {
    return joinLabels(parsed.map((item) => extractLabelFromItem(item, 'zh')))
  }
  if (parsed && typeof parsed === 'object') {
    return extractLabelFromItem(parsed, 'zh')
  }
  const s = String(parsed).trim()
  if (s.startsWith('[') || s.startsWith('{')) return ''
  return s
}

/** 解析含 nameEn 的 JSON 分类字段，优先展示 nameEn */
export function parseNameEnLabel(raw: unknown): string {
  if (!raw) return ''
  const parsed = tryParseJsonValue(raw)
  if (Array.isArray(parsed)) {
    return joinLabels(parsed.map((item) => extractLabelFromItem(item, 'en')))
  }
  if (parsed && typeof parsed === 'object') {
    return extractLabelFromItem(parsed, 'en')
  }
  const s = String(parsed).trim()
  if (s.startsWith('[') || s.startsWith('{')) return ''
  return s
}

/** 解析作者列表（支持 JSON 数组、{nameZh,nameEn} 对象、分隔字符串） */
export function parseAuthors(raw: unknown): string[] {
  if (!raw) return []
  const parsed = tryParseJsonValue(raw)
  if (Array.isArray(parsed)) {
    return parsed
      .map((item) => {
        if (typeof item === 'string') return item.trim()
        if (item && typeof item === 'object') {
          const o = item as Record<string, unknown>
          const zh = String(o.nameZh || o.name_zh || '').trim()
          if (zh) return zh
          return String(o.nameEn || o.name_en || o.name || '').trim()
        }
        return String(item).trim()
      })
      .filter(Boolean)
  }
  return splitTokens(raw)
}

function normalizeKeywordText(text: string): string {
  return text.replace(/;/g, ' ').replace(/\s+/g, ' ').trim()
}

/** 从 [; "a; b; c"; "d; e"; ] 等非标准数组字符串中提取引号内关键词 */
function extractQuotedKeywords(raw: string): string[] {
  const results: string[] = []
  const re = /"([^"]*)"/g
  let m: RegExpExecArray | null
  while ((m = re.exec(raw)) !== null) {
    const kw = normalizeKeywordText(m[1])
    if (kw) results.push(kw)
  }
  return results
}

function mapKeywordItem(item: unknown): string {
  if (typeof item === 'string') return normalizeKeywordText(item)
  if (item && typeof item === 'object') {
    const o = item as Record<string, unknown>
    return normalizeKeywordText(String(o.keyword || o.nameZh || o.name || o.value || ''))
  }
  return normalizeKeywordText(String(item))
}

/** 解析关键词列表（支持 JSON 字符串数组、引号分号数组、分隔字符串） */
export function parseKeywords(raw: unknown): string[] {
  if (!raw) return []
  if (Array.isArray(raw)) {
    return raw.map(mapKeywordItem).filter(Boolean)
  }

  const parsed = tryParseJsonValue(raw)
  if (Array.isArray(parsed)) {
    return parsed.map(mapKeywordItem).filter(Boolean)
  }

  const s = String(parsed).trim()
  if (!s) return []

  if (s.startsWith('[')) {
    const fromQuotes = extractQuotedKeywords(s)
    if (fromQuotes.length) return fromQuotes
  }

  return s
    .split(/[；、,，]+/)
    .map((part) => normalizeKeywordText(part))
    .filter(Boolean)
}

function formatFileSize(bytes: number | string): string {
  const b = Number(bytes)
  if (!b || b <= 0) return '未知'
  const units = ['B', 'KB', 'MB', 'GB', 'TB']
  let i = 0
  let size = b
  while (size >= 1024 && i < units.length - 1) {
    size /= 1024
    i++
  }
  return `${size.toFixed(i === 0 ? 0 : 1)} ${units[i]}`
}

function formatDate(dateStr: unknown): string {
  if (!dateStr) return ''
  return String(dateStr).substring(0, 10)
}

const DEFAULT_SCIDB_STATIC_BASE = 'https://www.scidb.cn/static'

function getScidbStaticBase(): string {
  const fromEnv = import.meta.env.VITE_SCIDB_STATIC_BASE?.trim()
  return (fromEnv || DEFAULT_SCIDB_STATIC_BASE).replace(/\/$/, '')
}

/** 接口占位图或无效封面，不应作为真实封面展示（直接走本地占位图标） */
export function isInvalidDatasetCoverUrl(path: string): boolean {
  const raw = (path || '').trim()
  if (!raw) return true
  // 科学数据银行缺省封面（含完整 URL）
  if (/detail_error\.png/i.test(raw)) return true
  return false
}

/**
 * 将 coverUrl 等相对路径拼成可访问的封面地址。
 * - `/cover/...`：科学数据银行 CDN（https://www.scidb.cn/static/cover/...）
 * - `/cover2026/...`：新封面路径，同样走 CDN（需后端已同步到 CDN）
 * - 开发环境对 `/cover*` 使用相对路径，由 Vite 代理到 CDN
 */
export function resolveScidbStaticUrl(path: string): string {
  const raw = (path || '').trim()
  if (!raw || isInvalidDatasetCoverUrl(raw)) return ''
  if (/^https?:\/\//i.test(raw)) return raw

  const normalized = raw.startsWith('/') ? raw : `/${raw}`
  if (import.meta.env.DEV && /^\/cover/.test(normalized)) {
    return normalized
  }
  return `${getScidbStaticBase()}${normalized}`
}

export function mapApiDataSetToCasdc(d: Record<string, unknown>, fallbackId: string): CasdcDatasetDetail {
  const shareModeRaw = String(d.shareMode || '开放共享')
  const shareMode = formatShareModeLabel(shareModeRaw)
  const privacy = mapShareModeToPrivacy(shareModeRaw)
  const publisher = String(d.source || '未知来源')

  return {
    id: String(d.id || d.cstr || fallbackId),
    name: String(d.titleZh || '无标题'),
    nameEn: String(d.titleEn || d.title_en || ''),
    description: String(d.introductionZh || '暂无描述'),
    descriptionEn: String(d.introductionEn || d.introduction_en || ''),
    resourceType: String(d.resourceType || d.dataType || '数据集'),
    publicationDate: formatDate(d.publishAt || d.createAt || d.createTime),
    updateDate: formatDate(d.updateAt || d.updateTime),
    keywords: parseKeywords(d.keywordsZh || d.keywords),
    keywordsEn: parseKeywords(d.keywordsEn || d.keywords_en),
    authors: parseAuthors(d.authors),
    publisher,
    subject: parseNameZhLabel(d.subject) || '其他',
    subjectEn: parseNameEnLabel(d.subjectEn || d.subject_en) || parseNameEnLabel(d.subject),
    doi: String(d.doi || ''),
    cstr: String(d.cstr || d.id || fallbackId),
    isbn: String(d.isbn || ''),
    shareMode,
    privacyType: privacy.type,
    privacyLabel: privacy.label,
    license: String(d.license || d.useLicense),
    fileSize: formatFileSize(d.byteSize as number | string),
    fileCount: Number(d.fileNumber) || 0,
    format: String(d.format || ''),
    version: String(d.version || ''),
    visitNum: Number(d.visitNum || d.viewCount) || 0,
    followNum: Number(d.followNum || d.favoriteCount) || 0,
    downloadNum: Number(d.downloadNum || d.downloadCount || d.downloadTimes) || 0,
    coverUrl: resolveScidbStaticUrl(String(d.coverUrl || d.dataSetLogoUrl || '')),
    bannerUrl: resolveScidbStaticUrl(String(d.bannerUrl || d.coverUrl || d.dataSetLogoUrl || '')),
    datasetRemoteUrl: String(d.datasetRemoteUrl || d.datasetUrl || d.url || ''),
    url: String(d.url || d.datasetRemoteUrl || d.datasetUrl || ''),
    referenceLink: String(d.reference_link || d.referenceLink || ''),
    showFile: d.showFile !== 0 && d.showFile !== false
  }
}

export function buildCasdcCitation(d: CasdcDatasetDetail): string {
  const year = d.publicationDate?.slice(0, 4) || new Date().getFullYear()
  const authors = d.authors.length ? d.authors.join(', ') : d.publisher
  const idPart = d.doi ? `https://doi.org/${d.doi}` : `CSTR:${d.cstr}`
  return `${authors}. ${d.name}[DS/OL]. ${d.publisher}, ${year}. ${idPart}.`
}

export function buildJsonLd(d: CasdcDatasetDetail): Record<string, unknown> {
  return {
    '@context': 'https://schema.org',
    '@type': 'Dataset',
    name: d.name,
    alternateName: d.nameEn || undefined,
    description: d.description,
    identifier: [d.cstr, d.doi].filter(Boolean),
    keywords: d.keywords.join(', ') || undefined,
    datePublished: d.publicationDate || undefined,
    dateModified: d.updateDate || undefined,
    creator: d.authors.map((name) => ({ '@type': 'Person', name })),
    provider: { '@type': 'Organization', name: d.publisher },
    distribution: {
      '@type': 'DataDownload',
      encodingFormat: d.format || 'application/octet-stream',
      contentUrl: d.datasetRemoteUrl || undefined
    }
  }
}

/** CASDC 详情页「基本信息」元数据行 */
export function buildCasdcBasicMetaRows(d: CasdcDatasetDetail) {
  return [
    { label: '资源名称', value: d.name },
    { label: '资源类型', value: d.resourceType },
    { label: '资源描述', value: d.description, multiline: true },
    // { label: '英文描述', value: d.descriptionEn, multiline: true },
    { label: '关键词', value: d.keywords.join('；') },
    { label: '共享方式', value: d.shareMode },
    { label: '提供方', value: d.publisher },
    { label: '发布日期', value: d.publicationDate },
    { label: '更新时间', value: d.updateDate },
    { label: '数据格式', value: d.format },
    { label: '数据体量', value: d.fileSize },
    { label: 'ISBN', value: d.isbn, mono: true },
    { label: '参考文献链接', value: d.referenceLink, link: true }
  ].filter((row) => row.value)
}
