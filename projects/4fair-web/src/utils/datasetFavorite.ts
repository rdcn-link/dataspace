import { normalizeCstr } from '@/utils/cstrUrl'

function isOkCode(code: unknown): boolean {
  return code === 200 || code === 0 || code === '200'
}

function favoriteQuery(uid: string, cstr: string): string {
  const id = normalizeCstr(cstr)
  return `uid=${encodeURIComponent(uid)}&cstr=${encodeURIComponent(id)}`
}

function parseTruthy(value: unknown): boolean {
  if (value === true || value === 1) return true
  if (typeof value === 'string') {
    const s = value.trim().toLowerCase()
    return s === 'true' || s === '1' || s === 'yes'
  }
  return false
}

/** 解析 favorite.check 多种返回结构 */
export function parseFavoriteCheckResponse(json: unknown): boolean {
  if (!json || typeof json !== 'object') return false
  const body = json as Record<string, unknown>

  if (!isOkCode(body.code)) return false

  const data = body.data
  if (typeof data === 'boolean' || typeof data === 'number' || typeof data === 'string') {
    return parseTruthy(data)
  }

  if (data && typeof data === 'object') {
    const obj = data as Record<string, unknown>
    for (const key of ['favorited', 'favorite', 'isFavorite', 'isFavorited', 'collected', 'isCollected']) {
      if (key in obj) return parseTruthy(obj[key])
    }
  }

  return false
}

/** 收藏数据集 POST /tds-trading/order/favorite.save?uid=&cstr= */
export async function saveDatasetFavorite(uid: string, cstr: string): Promise<boolean> {
  const id = normalizeCstr(cstr)
  if (!uid || !id) return false

  const res = await fetch(`/tds-trading/order/favorite.save?${favoriteQuery(uid, id)}`, { method: 'POST' })
  const json = await res.json()
  return isOkCode(json.code)
}

/** 取消收藏 DELETE /tds-trading/order/favorite.remove?uid=&cstr= */
export async function removeDatasetFavorite(uid: string, cstr: string): Promise<boolean> {
  const id = normalizeCstr(cstr)
  if (!uid || !id) return false

  const res = await fetch(`/tds-trading/order/favorite.remove?${favoriteQuery(uid, id)}`, { method: 'DELETE' })
  const json = await res.json()
  return isOkCode(json.code)
}

/** 是否已收藏 GET /tds-trading/order/favorite.check?uid=&cstr= */
export async function checkDatasetFavorite(uid: string, cstr: string): Promise<boolean> {
  const id = normalizeCstr(cstr)
  if (!uid || !id) return false

  try {
    const res = await fetch(`/tds-trading/order/favorite.check?${favoriteQuery(uid, id)}`)
    const json = await res.json()
    return parseFavoriteCheckResponse(json)
  } catch {
    return false
  }
}

/** 解析 favorite.statistics 返回的收藏量 */
export function parseFavoriteStatisticsResponse(json: unknown): number | null {
  if (!json || typeof json !== 'object') return null
  const body = json as Record<string, unknown>
  if (!isOkCode(body.code)) return null

  const data = body.data
  if (typeof data === 'number' && Number.isFinite(data)) return data
  if (typeof data === 'string') {
    const n = Number(data)
    return Number.isFinite(n) ? n : null
  }
  if (data && typeof data === 'object') {
    const obj = data as Record<string, unknown>
    for (const key of ['favoriteCount', 'followNum', 'count', 'total']) {
      if (key in obj) {
        const n = Number(obj[key])
        if (Number.isFinite(n)) return n
      }
    }
  }
  return null
}

/** 统计收藏量 GET /tds-trading/order/favorite.statistics?cstr= */
export async function fetchDatasetFavoriteStatistics(cstr: string): Promise<number | null> {
  const id = normalizeCstr(cstr)
  if (!id) return null

  try {
    const res = await fetch(`/tds-trading/order/favorite.statistics?cstr=${encodeURIComponent(id)}`)
    const json = await res.json()
    return parseFavoriteStatisticsResponse(json)
  } catch {
    return null
  }
}
