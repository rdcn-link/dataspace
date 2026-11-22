import { normalizeCstr } from '@/utils/cstrUrl'

export type StatsRange = 'day' | 'week' | 'month'

export type StatsChartPoint = {
  label: string
  visit: number
  download: number
}

function isOkCode(code: unknown): boolean {
  return code === 200 || code === 0 || code === '200'
}

function pad2(n: number): string {
  return String(n).padStart(2, '0')
}

function formatDayLabel(date: Date): string {
  return `${pad2(date.getMonth() + 1)}-${pad2(date.getDate())}`
}

function formatMonthLabel(date: Date): string {
  return `${date.getFullYear()}-${pad2(date.getMonth() + 1)}`
}

function hashSeed(seed: string, index: number): number {
  let h = index + 1
  for (let i = 0; i < seed.length; i++) {
    h = (h * 31 + seed.charCodeAt(i) * (index + 1)) % 1000
  }
  return h
}

function distributeTotal(total: number, count: number, seed: string, offset = 0): number[] {
  if (!total || total <= 0) return Array.from({ length: count }, () => 0)

  const weights = Array.from({ length: count }, (_, i) => 0.4 + (hashSeed(seed, i + offset) % 60) / 100)
  const sum = weights.reduce((a, b) => a + b, 0)
  const raw = weights.map((w) => (total * w) / sum)
  const rounded = raw.map((v) => Math.floor(v))
  let rest = total - rounded.reduce((a, b) => a + b, 0)
  for (let i = 0; rest > 0; i = (i + 1) % count) {
    rounded[i] += 1
    rest -= 1
  }
  return rounded
}

/** 无接口数据时，按总量生成趋势柱状图 */
export function buildFallbackStatsSeries(
  range: StatsRange,
  visitTotal: number,
  downloadTotal: number,
  seed: string
): StatsChartPoint[] {
  const now = new Date()
  const count = range === 'day' ? 7 : 6
  const visits = distributeTotal(visitTotal, count, seed, 0)
  const downloads = distributeTotal(downloadTotal, count, seed, 17)

  return Array.from({ length: count }, (_, i) => {
    let label = ''
    if (range === 'day') {
      const d = new Date(now)
      d.setDate(d.getDate() - (count - 1 - i))
      label = formatDayLabel(d)
    } else if (range === 'week') {
      label = `第${count - i}周`
    } else {
      const d = new Date(now.getFullYear(), now.getMonth() - (count - 1 - i), 1)
      label = formatMonthLabel(d)
    }

    return {
      label,
      visit: visits[i] || 0,
      download: downloads[i] || 0
    }
  })
}

function mapApiPoint(item: Record<string, unknown>, index: number): StatsChartPoint {
  const label = String(
    item.label || item.date || item.time || item.statDate || item.name || `T${index + 1}`
  ).trim()

  return {
    label,
    visit: Number(item.visit ?? item.visitNum ?? item.viewCount ?? item.views) || 0,
    download: Number(item.download ?? item.downloadNum ?? item.downloadCount ?? item.downloads) || 0
  }
}

function parseStatsResponse(data: unknown): StatsChartPoint[] {
  if (!data) return []

  if (Array.isArray(data)) {
    return data
      .map((item, index) =>
        item && typeof item === 'object' ? mapApiPoint(item as Record<string, unknown>, index) : null
      )
      .filter((p): p is StatsChartPoint => Boolean(p))
  }

  if (typeof data === 'object') {
    const obj = data as Record<string, unknown>
    const list = obj.rows || obj.list || obj.points || obj.series || obj.data
    if (Array.isArray(list)) return parseStatsResponse(list)
  }

  return []
}

/** 后端统计接口就绪后改为 true */
const ENABLE_DATASET_STATS_API = false

const STATS_ENDPOINTS = (cstr: string, range: StatsRange) => [
  `/tds-trading/order/dataset.statistics?cstr=${cstr}&range=${range}`,
  `/tds-trading/order/dataset.visitStat?cstr=${cstr}&range=${range}`,
  `/tds-trading/order/dataset.stats?cstr=${cstr}&range=${range}`
]

export async function fetchDatasetStatsSeries(
  cstr: string,
  range: StatsRange,
  totals: { visit: number; download: number }
): Promise<StatsChartPoint[]> {
  const id = normalizeCstr(cstr)
  if (!id) return buildFallbackStatsSeries(range, totals.visit, totals.download, '')

  if (ENABLE_DATASET_STATS_API) {
    for (const url of STATS_ENDPOINTS(id, range)) {
      try {
        const res = await fetch(url)
        if (res.status === 404) continue
        const json = await res.json()
        if (!isOkCode(json.code)) continue

        const points = parseStatsResponse(json.data)
        if (points.length) return points
      } catch {
        continue
      }
    }
  }

  return buildFallbackStatsSeries(range, totals.visit, totals.download, id)
}
