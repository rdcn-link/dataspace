/**
 * 移动端非微信访问门禁（与 Login「请在微信中打开」一致）
 * PC 浏览器应走扫码登录，不得进入此门禁。
 */
import { isMobileBrowser, isWeChatBrowser } from '@/utils/wechatOAuth'

/** 允许在非微信中停留的路由（登录引导 / 微信 OAuth / 协议） */
export const OPEN_IN_WECHAT_ALLOW_ROUTE_NAMES = new Set<string>([
  'Login',
  'WechatH5',
  'WechatAuth',
  'WechatScanLogin',
  'WechatOAuthShort',
  'WechatOAuth',
  'AuthAgreement',
  'MobileApplyApproval',
  'MobileApplyAudit'
])

/** 是否应拦截并提示「请在微信中打开」（仅移动端非微信） */
export function needsOpenInWechatPrompt(routeName?: unknown): boolean {
  if (typeof window === 'undefined') return false
  if (isWeChatBrowser()) return false
  if (!isMobileBrowser()) return false
  if (typeof routeName === 'string' && OPEN_IN_WECHAT_ALLOW_ROUTE_NAMES.has(routeName)) {
    return false
  }
  return true
}
