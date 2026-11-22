import type { IntentApplyQuery } from '@/utils/intentApply'

const STORAGE_PREFIX = 'intent_apply_oauth_pending_'

export function saveIntentApplyOAuthPending(state: string, params: IntentApplyQuery): void {
  try {
    sessionStorage.setItem(`${STORAGE_PREFIX}${state}`, JSON.stringify(params))
  } catch {
    /* ignore quota / private mode */
  }
}

export function loadIntentApplyOAuthPending(state: string): IntentApplyQuery | null {
  try {
    const raw = sessionStorage.getItem(`${STORAGE_PREFIX}${state}`)
    if (!raw) return null
    const parsed = JSON.parse(raw) as IntentApplyQuery
    if (!parsed?.uid || !parsed?.cstr) return null
    return parsed
  } catch {
    return null
  }
}

export function clearIntentApplyOAuthPending(state: string): void {
  try {
    sessionStorage.removeItem(`${STORAGE_PREFIX}${state}`)
  } catch {
    /* ignore */
  }
}
