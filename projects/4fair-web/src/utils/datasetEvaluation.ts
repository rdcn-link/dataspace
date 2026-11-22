import { normalizeCstr } from '@/utils/cstrUrl'

function isOkCode(code: unknown): boolean {
  return code === 200 || code === 0 || code === '200'
}

export type SaveEvaluationResult = { ok: boolean; message?: string }

/** 发表评价 POST /tds-trading/order/evaluation.save?uid=&cstr=&description=&score= */
export async function saveDatasetEvaluation(
  uid: string,
  cstr: string,
  description: string,
  score: number,
): Promise<SaveEvaluationResult> {
  const id = normalizeCstr(cstr)
  if (!uid || !id || score <= 0) {
    return { ok: false, message: '缺少必要信息' }
  }

  const qs = new URLSearchParams()
  qs.set('uid', uid)
  qs.set('cstr', id)
  qs.set('description', description.trim())
  qs.set('score', String(score))

  try {
    const res = await fetch(`/tds-trading/order/evaluation.save?${qs.toString()}`, { method: 'POST' })
    const json = await res.json()
    if (isOkCode(json.code)) return { ok: true }
    return { ok: false, message: String(json.message || '提交评价失败') }
  } catch {
    return { ok: false, message: '网络错误，请稍后重试' }
  }
}
