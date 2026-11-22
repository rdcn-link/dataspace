import { getPublicSiteOrigin } from '@/utils/wechatOAuth'

/** 微信扫码申请（IntentApplyNew）链接参数，须带 uid */
export type IntentApplyQuery = {
  uid: string
  cstr: string
  title?: string
  publisher?: string
  level?: string
}

/** Web 端「发起申请」页（IntentApply），登录后使用，仅需 cstr */
export type IntentApplyWebQuery = {
  cstr: string
  title?: string
  publisher?: string
  level?: string
}

/** 详情页按钮 → 浏览器内申请（/intent/apply） */
export function buildIntentApplyUrl(params: IntentApplyWebQuery): string {
  const q = new URLSearchParams()
  q.set('cstr', params.cstr)
  if (params.title) q.set('title', params.title)
  if (params.publisher) q.set('publisher', params.publisher)
  if (params.level) q.set('level', params.level)
  return `/intent/apply?${q.toString()}`
}

/** 微信 OAuth 回调等场景（/intent/apply-new） */
export function buildIntentApplyNewUrl(params: IntentApplyQuery): string {
  const q = new URLSearchParams()
  q.set('uid', params.uid)
  q.set('cstr', params.cstr)
  if (params.title) q.set('title', params.title)
  if (params.publisher) q.set('publisher', params.publisher)
  if (params.level) q.set('level', params.level)
  return `/intent/apply-new?${q.toString()}`
}

/**
 * 生成用于二维码的短链接（仅 uid + cstr，避免长标题导致二维码过密、微信难扫）
 * 申请页会根据 cstr 自动拉取标题等信息
 */
export function buildIntentApplyQrUrl(params: Pick<IntentApplyQuery, 'uid' | 'cstr'>): string {
  const origin = getPublicSiteOrigin()
  const q = new URLSearchParams()
  q.set('uid', params.uid)
  q.set('cstr', params.cstr)
  const path = `/intent/apply-new?${q.toString()}`
  return origin ? `${origin}${path}` : path
}