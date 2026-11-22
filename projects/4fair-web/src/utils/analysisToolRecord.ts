/** 是否使用过分析工具（评价权限） GET /tds-trading/order/order.hasAnalysisToolRecord */

function isOkCode(code: unknown): boolean {
  return code === 200 || code === 0 || code === '200'
}

function parseTruthy(value: unknown): boolean {
  if (value === true || value === 1) return true
  if (typeof value === 'string') {
    const s = value.trim().toLowerCase()
    return s === 'true' || s === '1' || s === 'yes'
  }
  return false
}

/** 解析 hasAnalysisToolRecord 多种返回结构 */
export function parseHasAnalysisToolRecordResponse(json: unknown): boolean {
  if (typeof json === 'boolean' || typeof json === 'number' || typeof json === 'string') {
    return parseTruthy(json)
  }
  if (!json || typeof json !== 'object') return false
  const body = json as Record<string, unknown>

  if ('code' in body && !isOkCode(body.code)) return false

  const data = 'data' in body ? body.data : body
  if (typeof data === 'boolean' || typeof data === 'number' || typeof data === 'string') {
    return parseTruthy(data)
  }

  if (data && typeof data === 'object') {
    const obj = data as Record<string, unknown>
    for (const key of [
      'hasRecord',
      'hasAnalysisToolRecord',
      'used',
      'hasUsed',
      'exist',
      'exists',
      'result'
    ]) {
      if (key in obj) return parseTruthy(obj[key])
    }
  }

  if (isOkCode(body.code) && data === null) return false
  return false
}

export type AnalysisToolRecordQuery = {
  openId: string
  toolId: string
  /** 使用来源：青藏高原数据中心填 tpdc */
  source: string
}

/**
 * 查询当前用户是否使用过指定分析工具（有记录才可评价）
 * GET /order/order.hasAnalysisToolRecord?openId=&toolId=&source=
 */
export async function fetchHasAnalysisToolRecord(
  openId: string,
  toolId: string,
  source = 'tpdc'
): Promise<boolean> {
  const oid = String(openId || '').trim()
  const tid = String(toolId || '').trim()
  const src = String(source || '').trim() || 'tpdc'
  if (!oid || !tid) return false

  try {
    const qs = new URLSearchParams({
      openId: oid,
      toolId: tid,
      source: src
    })
    const res = await fetch(`/tds-trading/order/order.hasAnalysisToolRecord?${qs.toString()}`)
    const json = await res.json()
    return parseHasAnalysisToolRecordResponse(json)
  } catch {
    return false
  }
}

/**
 * 使用分析工具时记账
 * POST /order/order.addAnalysisToolCount?uid=&title=&toolId=&source=
 */
export async function addAnalysisToolCount(payload: {
  uid: string
  title: string
  toolId: string
  source?: string
}): Promise<boolean> {
  const uid = String(payload.uid || '').trim()
  const title = String(payload.title || '').trim()
  const toolId = String(payload.toolId || '').trim()
  const source = String(payload.source || '').trim() || 'tpdc'
  if (!uid || !title || !toolId) return false

  try {
    const qs = new URLSearchParams({ uid, title, toolId, source })
    const res = await fetch(`/tds-trading/order/order.addAnalysisToolCount?${qs.toString()}`, {
      method: 'POST'
    })
    const json = await res.json()
    if (json && typeof json === 'object' && 'code' in json) {
      return isOkCode((json as Record<string, unknown>).code)
    }
    return res.ok
  } catch {
    return false
  }
}

/** 批量查询多个工具的使用记录 */
export async function fetchAnalysisToolRecordMap(
  openId: string,
  toolIds: string[],
  source = 'tpdc'
): Promise<Record<string, boolean>> {
  const oid = String(openId || '').trim()
  const src = String(source || '').trim() || 'tpdc'
  const ids = [...new Set(toolIds.map((id) => String(id || '').trim()).filter(Boolean))]
  const out: Record<string, boolean> = {}
  if (!oid || !ids.length) return out

  await Promise.all(
    ids.map(async (tid) => {
      out[tid] = await fetchHasAnalysisToolRecord(oid, tid, src)
    })
  )
  return out
}
