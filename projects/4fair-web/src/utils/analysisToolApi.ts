/** 分析工具列表 GET /tds-trading/order/order.analysisTool.list */

export type AnalysisToolApiItem = {
  id: string
  label: string
  desc: string
  /** 来自接口 toolLogo */
  iconUrl: string
  toolUrl: string
  source: string
  sort: number
  status: number
  /** 为 true 时可点击跳转 */
  enabled: boolean
  avgStar: number
  scoreNum: number
  toolType: string
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
    if (typeof v === 'number' && Number.isFinite(v)) return String(v)
  }
  return ''
}

function pickNumber(...vals: unknown[]): number {
  for (const v of vals) {
    if (typeof v === 'number' && Number.isFinite(v)) return v
    if (typeof v === 'string' && v.trim()) {
      const n = Number(v)
      if (Number.isFinite(n)) return n
    }
  }
  return 0
}

function pickEnabled(raw: Record<string, unknown>): boolean {
  if (!('enabled' in raw)) return true
  const v = raw.enabled
  if (v === true || v === 1) return true
  if (v === false || v === 0) return false
  if (typeof v === 'string') {
    const s = v.trim().toLowerCase()
    if (s === 'true' || s === '1' || s === 'yes') return true
    if (s === 'false' || s === '0' || s === 'no') return false
  }
  return Boolean(v)
}

/** 图标地址：仅使用接口 toolLogo 字段 */
function normalizeToolLogoUrl(rawUrl: string): string {
  return String(rawUrl || '').trim()
}

function mapToolItem(raw: unknown): AnalysisToolApiItem | null {
  const o = asRecord(raw)
  if (!o) return null
  const id = pickString(o.id, o.toolId)
  if (!id) return null
  return {
    id,
    label: pickString(o.toolName, o.name, o.label) || `工具 ${id}`,
    desc: pickString(o.toolDesc, o.toolDescription, o.description, o.desc),
    iconUrl: normalizeToolLogoUrl(pickString(o.toolLogo)),
    toolUrl: pickString(o.url, o.toolUrl),
    source: pickString(o.source) || 'tpdc',
    sort: pickNumber(o.sort),
    status: 'status' in o ? pickNumber(o.status) : 1,
    enabled: pickEnabled(o),
    avgStar: pickNumber(o.avgStar, o.average, o.avg),
    scoreNum: pickNumber(o.scoreNum, o.scoreCount, o.count),
    toolType: pickString(o.toolType, o.type)
  }
}

function extractList(json: unknown): unknown[] {
  if (Array.isArray(json)) return json
  const body = asRecord(json)
  if (!body) return []
  if (Array.isArray(body.data)) return body.data
  const data = asRecord(body.data)
  if (data) {
    for (const key of ['list', 'records', 'rows', 'items']) {
      if (Array.isArray(data[key])) return data[key] as unknown[]
    }
  }
  return []
}

/**
 * 查询分析工具列表
 * GET /order/order.analysisTool.list
 */
export async function fetchAnalysisToolList(source = 'tpdc'): Promise<AnalysisToolApiItem[]> {
  const src = String(source || '').trim() || 'tpdc'
  try {
    const res = await fetch('/tds-trading/order/order.analysisTool.list')
    const json = await res.json()
    const body = asRecord(json)
    if (body && 'code' in body && !isOkCode(body.code)) return []

    return extractList(json)
      .map(mapToolItem)
      .filter((t): t is AnalysisToolApiItem => !!t)
      .filter((t) => t.status === 1)
      .filter((t) => !t.source || t.source === src)
      .sort((a, b) => a.sort - b.sort || Number(a.id) - Number(b.id))
  } catch {
    return []
  }
}
