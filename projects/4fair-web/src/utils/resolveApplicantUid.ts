import type { UserInfo } from '@/stores/auth'

import { parseApplyScenarioType } from '@/constants/intentApplyScenarios'

export function isValidApplyScenario(type: string): boolean {
  return parseApplyScenarioType(type) !== null
}

/**
 * 解析用于上传/申请接口的路径 uid（按优先级取第一个非空）
 */
export function resolveApplicantUid(
  ...candidates: (string | undefined | null)[]
): string {
  for (const c of candidates) {
    const s = String(c ?? '').trim()
    if (s) return s
  }
  return ''
}

export function resolveApplicantUidFromUser(
  user: UserInfo | null | undefined,
  ...extra: (string | undefined | null)[]
): string {
  return resolveApplicantUid(
    ...extra,
    user?.uid,
    user?.openId,
    user?.id
  )
}
