/** 空间枢纽统计 GET /tds-trading/order/spaceHub.statistics?source= */

export type SpaceHubStatistics = {
  source: string
  dataSet: number
  analysisTool: number
  analysisToolStatistics: number
  /** YYYY-MM-DD */
  createAt: string
}

function isOkCode(code: unknown): boolean {
  return code === 200 || code === 0 || code === '200'
}

function asRecord(v: unknown): Record<string, unknown> | null {
  return v && typeof v === 'object' ? (v as Record<string, unknown>) : null
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

function pickString(...vals: unknown[]): string {
  for (const v of vals) {
    if (typeof v === 'string' && v.trim()) return v.trim()
  }
  return ''
}

/** 接口 createAt → 展示用日期 YYYY-MM-DD */
export function formatSpaceHubStatDate(raw: unknown): string {
  const text = pickString(raw)
  if (!text) return ''
  const m = text.match(/^(\d{4}-\d{2}-\d{2})/)
  if (m) return m[1]
  const d = new Date(text)
  if (!Number.isNaN(d.getTime())) {
    const y = d.getFullYear()
    const mo = String(d.getMonth() + 1).padStart(2, '0')
    const day = String(d.getDate()).padStart(2, '0')
    return `${y}-${mo}-${day}`
  }
  return text
}

/**
 * GET /order/spaceHub.statistics?source=
 * 返回 dataSet / analysisTool / analysisToolStatistics / createAt
 */
export async function fetchSpaceHubStatistics(source: string): Promise<SpaceHubStatistics | null> {
  const name = source.trim()
  if (!name) return null

  const res = await fetch(
    `/tds-trading/order/spaceHub.statistics?source=${encodeURIComponent(name)}`
  )
  if (!res.ok) throw new Error(`空间枢纽统计请求失败 (${res.status})`)

  const json = (await res.json()) as unknown
  const root = asRecord(json)
  if (!root || !isOkCode(root.code)) {
    throw new Error(pickString(root?.message) || '空间枢纽统计返回异常')
  }

  const data = asRecord(root.data) || root
  return {
    source: pickString(data.source) || name,
    dataSet: pickNumber(data.dataSet, data.dataset, data.dataSetCount),
    analysisTool: pickNumber(data.analysisTool, data.analysisToolCount),
    analysisToolStatistics: pickNumber(
      data.analysisToolStatistics,
      data.serviceCount,
      data.statistics
    ),
    createAt: formatSpaceHubStatDate(data.createAt ?? data.updateAt ?? data.updatedAt)
  }
}
