/**
 * 分析工具调用统计
 * - 汇总兜底：spaceHub.statistics + analysisTool.list
 * - 明细/图表：order.analysisToolRecord.page / .statistics（后端就绪后自动生效）
 */

import { fetchAnalysisToolList, type AnalysisToolApiItem } from '@/utils/analysisToolApi'
import { fetchSpaceHubStatistics } from '@/utils/spaceHubStatisticsApi'
import { DATA_CENTERS, type DataCenterDef } from '@/utils/dataCenterRegistry'
import { SPACE_HUBS } from '@/data/spaceHubs'


export type AnalysisToolCallRecord = {
  id: string
  openId: string
  title: string
  toolId: string
  toolName: string
  source: string
  count: number
  createAt: string
}

export type NamedCount = {
  id: string
  name: string
  count: number
}

export type TrendPoint = {
  label: string
  date: string
  count: number
}

export type AnalysisToolStatsBundle = {
  toolCount: number
  totalCalls: number
  updatedAt: string
  trend: TrendPoint[]
  toolShare: NamedCount[]
  toolRank: NamedCount[]
  datasetRank: NamedCount[]
  records: AnalysisToolCallRecord[]
  recordsTotal: number
  /** 明细接口是否可用；false 时图表可能为空或仅有汇总 */
  recordsApiOk: boolean
  tools: AnalysisToolApiItem[]
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

function pad2(n: number): string {
  return String(n).padStart(2, '0')
}

export function formatStatsDate(raw: unknown): string {
  const text = pickString(raw)
  if (!text) return ''
  const m = text.match(/^(\d{4}-\d{2}-\d{2})/)
  if (m) return m[1]
  const d = new Date(text)
  if (Number.isNaN(d.getTime())) return text
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`
}

export function formatStatsDateTime(raw: unknown): string {
  const text = pickString(raw)
  if (!text) return '—'
  const d = new Date(text)
  if (Number.isNaN(d.getTime())) {
    return text.length > 19 ? text.slice(0, 19).replace('T', ' ') : text
  }
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())} ${pad2(d.getHours())}:${pad2(d.getMinutes())}`
}

export function dateSpanBetween(
  startDate: string,
  endDate: string
): { startDate: string; endDate: string; days: number } {
  const start = formatStatsDate(startDate) || formatStatsDate(new Date().toISOString())
  const end = formatStatsDate(endDate) || formatStatsDate(new Date().toISOString())
  const a = new Date(`${start}T00:00:00`)
  const b = new Date(`${end}T00:00:00`)
  const diff = Number.isNaN(a.getTime()) || Number.isNaN(b.getTime())
    ? 1
    : Math.round((b.getTime() - a.getTime()) / 86400000) + 1
  return { startDate: start, endDate: end, days: Math.max(1, diff) }
}

export function resolveCenterStatisticsSource(center: DataCenterDef): string {
  const hub = SPACE_HUBS.find((h) => h.dataCenterId === center.id)
  if (hub?.statisticsSource?.trim()) return hub.statisticsSource.trim()
  return center.name
}

function extractList(json: unknown): unknown[] {
  if (Array.isArray(json)) return json
  const body = asRecord(json)
  if (!body) return []
  if (Array.isArray(body.data)) return body.data
  const data = asRecord(body.data)
  if (data) {
    for (const key of ['list', 'records', 'rows', 'items', 'content']) {
      if (Array.isArray(data[key])) return data[key] as unknown[]
    }
  }
  for (const key of ['list', 'records', 'rows', 'items']) {
    if (Array.isArray(body[key])) return body[key] as unknown[]
  }
  return []
}

function extractTotal(json: unknown, fallback: number): number {
  const body = asRecord(json)
  if (!body) return fallback
  const data = asRecord(body.data) || body
  return (
    pickNumber(data.total, data.totalElements, data.totalCount, data.count, body.total) || fallback
  )
}

function mapRecord(raw: unknown, index: number): AnalysisToolCallRecord | null {
  const o = asRecord(raw)
  if (!o) return null
  const toolId = pickString(o.toolId, o.tool_id, o.analysisToolId)
  const title = pickString(o.title, o.datasetTittle, o.datasetTitle, o.datasetName, o.name)
  const createAt = pickString(o.createAt, o.createdAt, o.updateAt, o.updatedAt, o.time, o.date)
  if (!toolId && !title && !createAt) return null
  return {
    id: pickString(o.id, o._id) || `${toolId}-${createAt}-${index}`,
    openId: pickString(o.openId, o.openid, o.uid, o.userId),
    title: title || '—',
    toolId: toolId || '—',
    toolName: pickString(o.toolName, o.toolLabel, o.label) || toolId || '未知工具',
    source: pickString(o.source) || 'tpdc',
    count: Math.max(1, pickNumber(o.count, o.num, o.times, o.callCount) || 1),
    createAt: createAt || ''
  }
}

function mapNamedCount(raw: unknown, index: number): NamedCount | null {
  const o = asRecord(raw)
  if (!o) return null
  const name = pickString(
    o.name,
    o.toolName,
    o.title,
    o.datasetTitle,
    o.datasetTittle,
    o.label
  )
  const id =
    pickString(o.id, o.toolId, o.title, o.datasetTitle, o.datasetTittle, o.name) ||
    name ||
    String(index)
  const count = pickNumber(o.count, o.num, o.times, o.total, o.value)
  if (!name && !count) return null
  return { id, name: name || id, count }
}

function mapTrendPoint(raw: unknown, index: number): TrendPoint | null {
  const o = asRecord(raw)
  if (!o) return null
  const date = formatStatsDate(o.date ?? o.day ?? o.statDate ?? o.time ?? o.label)
  const count = pickNumber(o.count, o.num, o.times, o.total, o.value)
  if (!date && !count) return null
  const label = date ? date.slice(5) : pickString(o.label) || `T${index + 1}`
  return { label, date: date || label, count }
}

function emptyDaySeries(days: number): TrendPoint[] {
  const now = new Date()
  return Array.from({ length: days }, (_, i) => {
    const d = new Date(now)
    d.setDate(now.getDate() - (days - 1 - i))
    const date = formatStatsDate(d.toISOString())
    return { label: date.slice(5), date, count: 0 }
  })
}

function buildTrendFromRecords(records: AnalysisToolCallRecord[], days: number): TrendPoint[] {
  const series = emptyDaySeries(days)
  const index = new Map(series.map((p, i) => [p.date, i]))
  for (const row of records) {
    const day = formatStatsDate(row.createAt)
    if (!day || !index.has(day)) continue
    const i = index.get(day)!
    series[i].count += row.count || 1
  }
  return series
}

function buildRankFromRecords(
  records: AnalysisToolCallRecord[],
  key: 'tool' | 'dataset',
  toolNameById: Map<string, string>,
  limit = 8
): NamedCount[] {
  const map = new Map<string, NamedCount>()
  for (const row of records) {
    const id = key === 'tool' ? row.toolId : row.title
    if (!id || id === '—') continue
    const name =
      key === 'tool'
        ? row.toolName || toolNameById.get(row.toolId) || row.toolId
        : row.title
    const prev = map.get(id)
    if (prev) prev.count += row.count || 1
    else map.set(id, { id, name, count: row.count || 1 })
  }
  return [...map.values()].sort((a, b) => b.count - a.count || a.name.localeCompare(b.name, 'zh')).slice(0, limit)
}

async function fetchJson(url: string): Promise<{ ok: boolean; status: number; json: unknown }> {
  try {
    const res = await fetch(url)
    if (res.status === 404) return { ok: false, status: 404, json: null }
    const json = await res.json().catch(() => null)
    const body = asRecord(json)
    if (body && 'code' in body && !isOkCode(body.code)) {
      return { ok: false, status: res.status, json }
    }
    return { ok: res.ok, status: res.status, json }
  } catch {
    return { ok: false, status: 0, json: null }
  }
}

/**
 * 调用明细分页
 * GET /tds-trading/order/order.analysisTool.record
 *   ?source=枢纽名称&startTime=YYYY-MM-DD HH:mm:ss&endTime=...&page=1&pageSize=10
 * 返回 data：content / totalElements / totalPages / pageSize
 */
export async function fetchAnalysisToolRecordPage(params: {
  source: string
  startTime: string
  endTime: string
  page: number
  pageSize: number
}): Promise<{ rows: AnalysisToolCallRecord[]; total: number; apiOk: boolean }> {
  const url =
    `/tds-trading/order/order.analysisTool.record?source=${encodeURIComponent(params.source)}` +
    `&startTime=${encodeURIComponent(params.startTime)}` +
    `&endTime=${encodeURIComponent(params.endTime)}` +
    `&page=${Math.max(1, Math.floor(params.page) || 1)}` +
    `&pageSize=${Math.max(1, params.pageSize)}`

  const { ok, status, json } = await fetchJson(url)
  if (status === 404 || !ok || !json) return { rows: [], total: 0, apiOk: false }

  const rows = extractList(json)
    .map((item, i) => mapRecord(item, i))
    .filter((r): r is AnalysisToolCallRecord => !!r)
  return { rows, total: extractTotal(json, rows.length), apiOk: true }
}

/**
 * 统计聚合（趋势 / 占比 / 排行）
 * GET /order/order.analysisToolRecord.statistics?source=&toolId=&startDate=&endDate=
 */
async function fetchAnalysisToolRecordStatistics(params: {
  source: string
  toolId?: string
  startDate: string
  endDate: string
}): Promise<{
  apiOk: boolean
  totalCalls: number
  toolCount: number
  trend: TrendPoint[]
  toolShare: NamedCount[]
  toolRank: NamedCount[]
  datasetRank: NamedCount[]
} | null> {
  const qs = new URLSearchParams({
    source: params.source,
    startDate: params.startDate,
    endDate: params.endDate
  })
  if (params.toolId) qs.set('toolId', params.toolId)

  const urls = [
    `/tds-trading/order/order.analysisToolRecord.statistics?${qs}`,
    `/tds-trading/order/order.analysisToolCount.statistics?${qs}`
  ]

  for (const url of urls) {
    const { ok, status, json } = await fetchJson(url)
    if (status === 404) continue
    if (!ok || !json) continue

    const body = asRecord(json)
    const data = asRecord(body?.data) || body || {}
    const trendRaw = data.trend || data.timeTrend || data.series || data.days
    const shareRaw = data.toolShare || data.pie || data.toolRatio || data.byTool
    const toolRankRaw = data.toolRank || data.toolRanking || shareRaw
    const datasetRankRaw = data.datasetRank || data.datasetRanking || data.byDataset || data.titleRank

    const trend = (Array.isArray(trendRaw) ? trendRaw : [])
      .map((item, i) => mapTrendPoint(item, i))
      .filter((p): p is TrendPoint => !!p)
    const toolShare = (Array.isArray(shareRaw) ? shareRaw : [])
      .map((item, i) => mapNamedCount(item, i))
      .filter((p): p is NamedCount => !!p)
      .sort((a, b) => b.count - a.count)
    const toolRank = (Array.isArray(toolRankRaw) ? toolRankRaw : toolShare)
      .map((item, i) => mapNamedCount(item, i))
      .filter((p): p is NamedCount => !!p)
      .sort((a, b) => b.count - a.count)
      .slice(0, 8)
    const datasetRank = (Array.isArray(datasetRankRaw) ? datasetRankRaw : [])
      .map((item, i) => mapNamedCount(item, i))
      .filter((p): p is NamedCount => !!p)
      .sort((a, b) => b.count - a.count)
      .slice(0, 8)

    return {
      apiOk: true,
      totalCalls: pickNumber(data.totalCalls, data.total, data.analysisToolStatistics, data.count),
      toolCount: pickNumber(data.toolCount, data.analysisTool, data.tools),
      trend,
      toolShare,
      toolRank,
      datasetRank
    }
  }

  return null
}

/**
 * 枢纽按时间段统计
 * GET /tds-trading/order/spaceHub.statisticsByDate?source=&startTime=YYYY-MM-DD HH:mm:ss&endTime=...
 * - callCountByDay → 趋势；callRateByTool → 各工具占比；callCountByTool → 工具排行
 * - callCountByDataSet → 数据集排行（datasetTittle 为上游原样拼写）
 */
export async function fetchSpaceHubStatsByDate(params: {
  source: string
  startTime: string
  endTime: string
}): Promise<{
  apiOk: boolean
  source: string
  totalCalls: number
  trend: TrendPoint[]
  toolShare: NamedCount[]
  toolRank: NamedCount[]
  datasetRank: NamedCount[]
} | null> {
  const source = String(params.source || '').trim()
  if (!source) return null

  const url =
    `/tds-trading/order/spaceHub.statisticsByDate?source=${encodeURIComponent(source)}` +
    `&startTime=${encodeURIComponent(params.startTime)}` +
    `&endTime=${encodeURIComponent(params.endTime)}`
  const { ok, status, json } = await fetchJson(url)
  if (status === 404 || !ok || !json) return null

  const body = asRecord(json)
  const data = asRecord(body?.data) || {}
  const dayRaw = Array.isArray(data.callCountByDay) ? data.callCountByDay : []
  const rateRaw = Array.isArray(data.callRateByTool) ? data.callRateByTool : []
  const toolRaw = Array.isArray(data.callCountByTool) ? data.callCountByTool : []
  const datasetRaw = Array.isArray(data.callCountByDataSet) ? data.callCountByDataSet : []
  if (!dayRaw.length && !rateRaw.length && !toolRaw.length && !datasetRaw.length) return null

  const trend = dayRaw
    .map((item, i) => mapTrendPoint(item, i))
    .filter((p): p is TrendPoint => !!p)
  const toolShare = rateRaw
    .map((item, i) => mapNamedCount(item, i))
    .filter((p): p is NamedCount => !!p)
    .sort((a, b) => b.count - a.count)
  const toolRank = toolRaw
    .map((item, i) => mapNamedCount(item, i))
    .filter((p): p is NamedCount => !!p)
    .sort((a, b) => b.count - a.count)
    .slice(0, 8)
  const datasetRank = datasetRaw
    .map((item, i) => mapNamedCount(item, i))
    .filter((p): p is NamedCount => !!p)
    .sort((a, b) => b.count - a.count)
    .slice(0, 8)

  return {
    apiOk: true,
    source: pickString(data.source) || source,
    totalCalls: toolRank.reduce((s, i) => s + i.count, 0),
    trend,
    toolShare,
    toolRank,
    datasetRank
  }
}

/** toolId → 工具名称（工具列表里能匹配上则替换展示名） */
function withToolLabels(list: NamedCount[], toolNameById: Map<string, string>): NamedCount[] {
  return list.map((item) => {
    const label = toolNameById.get(item.id)
    return label ? { ...item, name: label } : item
  })
}

export async function loadAnalysisToolStats(params: {
  centerId: string
  toolId?: string
  startDate: string
  endDate: string
  pageNum: number
  pageSize?: number
}): Promise<AnalysisToolStatsBundle> {
  const center = DATA_CENTERS.find((c) => c.id === params.centerId) || DATA_CENTERS[0]
  const source = center.id
  const statsSource = resolveCenterStatisticsSource(center)
  const span = dateSpanBetween(params.startDate, params.endDate)
  const pageSize = params.pageSize || 10
  const toolId = String(params.toolId || '').trim()

  const [tools, hub, page, stats, byDate] = await Promise.all([
    fetchAnalysisToolList(source),
    fetchSpaceHubStatistics(statsSource).catch(() => null),
    fetchAnalysisToolRecordPage({
      source: statsSource,
      startTime: `${span.startDate} 00:00:00`,
      endTime: `${span.endDate} 00:00:00`,
      page: params.pageNum,
      pageSize
    }),
    fetchAnalysisToolRecordStatistics({
      source,
      toolId: toolId || undefined,
      startDate: span.startDate,
      endDate: span.endDate
    }),
    fetchSpaceHubStatsByDate({
      source: statsSource,
      startTime: `${span.startDate} 00:00:00`,
      endTime: `${span.endDate} 00:00:00`
    }).catch(() => null)
  ])

  const toolNameById = new Map(tools.map((t) => [t.id, t.label]))

  // 明细 toolName 常为空，用工具列表映射中文名
  const labeledRows = page.rows.map((r) => {
    const label = toolNameById.get(r.toolId)
    return label ? { ...r, toolName: label } : r
  })

  // 若统计接口缺失但明细可用：拉取多页明细做前端聚合（上限 200 条）
  let aggregateRecords = labeledRows
  if (page.apiOk && !stats?.apiOk && !byDate && page.total > page.rows.length) {
    const extra: AnalysisToolCallRecord[] = []
    const maxPages = Math.min(Math.ceil(Math.min(page.total, 200) / pageSize), 20)
    for (let p = 2; p <= maxPages; p++) {
      const more = await fetchAnalysisToolRecordPage({
        source: statsSource,
        startTime: `${span.startDate} 00:00:00`,
        endTime: `${span.endDate} 00:00:00`,
        page: p,
        pageSize
      })
      if (!more.rows.length) break
      extra.push(...more.rows)
    }
    aggregateRecords = [...page.rows, ...extra]
  }

  const trend =
    byDate?.trend?.length
      ? byDate.trend
      : stats?.trend?.length
        ? stats.trend
        : page.apiOk
          ? buildTrendFromRecords(aggregateRecords, span.days)
          : emptyDaySeries(span.days)

  const toolShare = byDate?.toolShare?.length
    ? withToolLabels(byDate.toolShare, toolNameById)
    : stats?.toolShare?.length
      ? stats.toolShare
      : page.apiOk
        ? buildRankFromRecords(aggregateRecords, 'tool', toolNameById, 12)
        : []

  const toolRank = byDate?.toolRank?.length
    ? withToolLabels(byDate.toolRank, toolNameById)
    : stats?.toolRank?.length
      ? stats.toolRank
      : page.apiOk
        ? buildRankFromRecords(aggregateRecords, 'tool', toolNameById, 8)
        : []

  const datasetRank =
    byDate?.datasetRank?.length
      ? byDate.datasetRank
      : stats?.datasetRank?.length
        ? stats.datasetRank
        : page.apiOk
          ? buildRankFromRecords(aggregateRecords, 'dataset', toolNameById, 8)
          : []

  const toolCount = hub?.analysisTool || stats?.toolCount || tools.length
  const totalCalls =
    (toolId && (stats?.totalCalls || page.apiOk)
      ? stats?.totalCalls || toolShare.reduce((s, i) => s + i.count, 0) || page.total
      : hub?.analysisToolStatistics || byDate?.totalCalls || stats?.totalCalls || 0) || 0

  return {
    toolCount,
    totalCalls,
    updatedAt: hub?.createAt || '',
    trend,
    toolShare,
    toolRank,
    datasetRank,
    records: labeledRows,
    recordsTotal: page.apiOk ? page.total : 0,
    recordsApiOk: page.apiOk || Boolean(stats?.apiOk) || Boolean(byDate),
    tools
  }
}

export function listStatsDataCenters(): DataCenterDef[] {
  return DATA_CENTERS
}
