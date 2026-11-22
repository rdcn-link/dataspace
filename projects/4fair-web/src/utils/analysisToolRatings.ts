/** 分析工具评分（本地持久化，后续可换服务端接口） */

const STORAGE_KEY = 'fairspace.analysis-tool-ratings.v1'

export type ToolRatingEntry = {
  score: number
  comment: string
  updatedAt: string
}

export type ToolRatingRecord = {
  scores: number[]
  entries: ToolRatingEntry[]
  updatedAt: string
}

type StoreShape = Record<string, Record<string, ToolRatingRecord>>

function normalizeRecord(raw: unknown): ToolRatingRecord | null {
  if (!raw || typeof raw !== 'object') return null
  const o = raw as Record<string, unknown>
  const scores = Array.isArray(o.scores)
    ? o.scores.filter((n): n is number => typeof n === 'number' && n >= 1 && n <= 5)
    : []
  const entries: ToolRatingEntry[] = []
  if (Array.isArray(o.entries)) {
    for (const item of o.entries) {
      if (!item || typeof item !== 'object') continue
      const e = item as Record<string, unknown>
      const score = typeof e.score === 'number' ? Math.min(5, Math.max(1, Math.round(e.score))) : 0
      if (!score) continue
      entries.push({
        score,
        comment: typeof e.comment === 'string' ? e.comment.trim() : '',
        updatedAt: typeof e.updatedAt === 'string' ? e.updatedAt : ''
      })
    }
  }
  // 旧数据只有 scores 时，补齐 entries 便于展示
  if (!entries.length && scores.length) {
    for (const score of scores) {
      entries.push({ score, comment: '', updatedAt: typeof o.updatedAt === 'string' ? o.updatedAt : '' })
    }
  }
  const mergedScores = entries.length ? entries.map((e) => e.score) : scores
  return {
    scores: mergedScores,
    entries,
    updatedAt: typeof o.updatedAt === 'string' ? o.updatedAt : ''
  }
}

function readStore(): StoreShape {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return {}
    const parsed = JSON.parse(raw) as StoreShape
    if (!parsed || typeof parsed !== 'object') return {}
    const out: StoreShape = {}
    for (const [ds, tools] of Object.entries(parsed)) {
      if (!tools || typeof tools !== 'object') continue
      out[ds] = {}
      for (const [tid, rec] of Object.entries(tools)) {
        const normalized = normalizeRecord(rec)
        if (normalized) out[ds][tid] = normalized
      }
    }
    return out
  } catch {
    return {}
  }
}

function writeStore(store: StoreShape) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(store))
}

export function getToolRating(datasetUuid: string, toolId: string): ToolRatingRecord | null {
  const ds = String(datasetUuid || '').trim()
  const tid = String(toolId || '').trim()
  if (!ds || !tid) return null
  return readStore()[ds]?.[tid] || null
}

export function getToolAverage(datasetUuid: string, toolId: string): {
  average: number
  count: number
} {
  const rec = getToolRating(datasetUuid, toolId)
  if (!rec?.scores?.length) return { average: 0, count: 0 }
  const sum = rec.scores.reduce((a, b) => a + b, 0)
  return { average: sum / rec.scores.length, count: rec.scores.length }
}

export function getToolComments(
  datasetUuid: string,
  toolId: string,
  limit = 3
): ToolRatingEntry[] {
  const rec = getToolRating(datasetUuid, toolId)
  if (!rec?.entries?.length) return []
  return [...rec.entries]
    .filter((e) => e.comment)
    .reverse()
    .slice(0, Math.max(0, limit))
}

/** 全部历史评价（新→旧） */
export function getToolHistory(
  datasetUuid: string,
  toolId: string
): ToolRatingEntry[] {
  const rec = getToolRating(datasetUuid, toolId)
  if (!rec?.entries?.length) return []
  return [...rec.entries].reverse()
}

/** 近 N 天历史评价（新→旧） */
export function getToolHistoryWithinDays(
  datasetUuid: string,
  toolId: string,
  days = 3
): ToolRatingEntry[] {
  const all = getToolHistory(datasetUuid, toolId)
  if (!all.length) return []
  const cutoff = Date.now() - Math.max(1, days) * 24 * 60 * 60 * 1000
  return all.filter((e) => {
    const t = Date.parse(e.updatedAt)
    if (!Number.isFinite(t)) return true
    return t >= cutoff
  })
}

export function formatToolRatingTime(iso: string): string {
  const t = Date.parse(iso)
  if (!Number.isFinite(t)) return ''
  const d = new Date(t)
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`
}

export function submitToolRating(
  datasetUuid: string,
  toolId: string,
  score: number,
  comment = ''
): ToolRatingRecord {
  const ds = String(datasetUuid || '').trim()
  const tid = String(toolId || '').trim()
  const s = Math.min(5, Math.max(1, Math.round(score)))
  const text = String(comment || '').trim().slice(0, 500)
  const store = readStore()
  if (!store[ds]) store[ds] = {}
  const prev = normalizeRecord(store[ds][tid]) || { scores: [], entries: [], updatedAt: '' }
  const entry: ToolRatingEntry = {
    score: s,
    comment: text,
    updatedAt: new Date().toISOString()
  }
  const next: ToolRatingRecord = {
    scores: [...prev.scores, s],
    entries: [...prev.entries, entry],
    updatedAt: entry.updatedAt
  }
  store[ds][tid] = next
  writeStore(store)
  return next
}
