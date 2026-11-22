/**
 * 微信公众号网页授权（OAuth2）工具
 * @see https://developers.weixin.qq.com/doc/offiaccount/OA_Web_Apps/Wechat_webpage_authorization.html
 */

export type WechatOAuthScope = 'snsapi_base' | 'snsapi_userinfo'

/** 费尔空间正式公众号 AppID（网页授权；密钥仅配后端，勿写入前端） */
export const FAIRSPACE_WECHAT_APP_ID = 'REPLACE_WITH_EXTERNAL_CONFIG'

/** 历史接口测试号 AppID（仅用于诊断文案） */
const LEGACY_WECHAT_TEST_APP_ID = 'wx748efde8ff1f83d5'

export interface WechatOAuthConfig {
  appId: string
  scope: WechatOAuthScope
}

function resolveWechatAppId(): string {
  const fromEnv = (import.meta.env.VITE_WECHAT_APP_ID as string | undefined)?.trim()
  if (fromEnv) return fromEnv

  if (typeof window !== 'undefined') {
    const host = window.location.hostname
    if (host === 'fairspace.cn' || host.endsWith('.fairspace.cn')) {
      return FAIRSPACE_WECHAT_APP_ID
    }
  }

  if (import.meta.env.PROD) {
    return FAIRSPACE_WECHAT_APP_ID
  }

  return ''
}

const WECHAT_UA_RE = /MicroMessenger/i

export function isWeChatBrowser(): boolean {
  if (typeof navigator === 'undefined') return false
  return WECHAT_UA_RE.test(navigator.userAgent)
}

/** 与底部 Tab（md:hidden / 768px）一致的移动端视口判断 */
const MOBILE_VIEWPORT_MQ = '(max-width: 767px)'

/**
 * 是否为手机/平板浏览器（用于「请在微信中打开」vs PC 扫码）。
 * 以 UA 为主；仅「窄屏 + 粗指针」作桌面 UA 伪装兜底，避免触控笔记本/缩窗 PC 误判。
 */
export function isMobileBrowser(): boolean {
  if (typeof window === 'undefined' || typeof navigator === 'undefined') return false
  const ua = navigator.userAgent || ''
  // 注意：不要单独匹配 HuaweiBrowser（PC 华为浏览器也会带），须有 Mobile/Android/鸿蒙等信号
  if (
    /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini|Mobile|MQQBrowser|UCBrowser|Quark|VivoBrowser|MiuiBrowser|OpenHarmony|HarmonyOS|ArkWeb|\bPhone\b/i.test(
      ua
    )
  ) {
    return true
  }
  try {
    const narrow = window.matchMedia(MOBILE_VIEWPORT_MQ).matches
    const coarse = window.matchMedia('(pointer: coarse)').matches
    if (narrow && coarse) return true
  } catch {
    /* ignore */
  }
  return false
}

export function createOAuthState(): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID().replace(/-/g, '')
  }
  return `fs_${Date.now()}_${Math.random().toString(36).slice(2, 12)}`
}

/** 去掉 URL 上的 code / state，避免刷新重复提交 */
export function stripOAuthQueryParams(): void {
  if (typeof window === 'undefined') return
  const u = new URL(window.location.href)
  u.searchParams.delete('code')
  u.searchParams.delete('state')
  window.history.replaceState({}, '', u.toString())
}

/** 本地 dev 未配置 VITE_APP_PUBLIC_URL 时，扫码链接默认指向的生产站点 */
const DEV_QR_ORIGIN_FALLBACK = 'https://fairspace.cn'

/**
 * 对外可访问的站点根地址（扫码 / OAuth redirect_uri 必须用此地址，不能用 localhost）
 * 开发时配置 VITE_APP_PUBLIC_URL 为内网穿透或测试域名，例如 https://xxx.cpolar.cn
 */
export function getPublicSiteOrigin(): string {
  const fromEnv = (import.meta.env.VITE_APP_PUBLIC_URL as string | undefined)?.trim()
  if (fromEnv) {
    return fromEnv.replace(/\/+$/, '')
  }
  if (typeof window !== 'undefined') {
    const { hostname, origin } = window.location
    if (
      import.meta.env.DEV &&
      (hostname === 'localhost' || hostname === '127.0.0.1')
    ) {
      return DEV_QR_ORIGIN_FALLBACK
    }
    return origin
  }
  return import.meta.env.PROD ? DEV_QR_ORIGIN_FALLBACK : ''
}

/** 当前是否用 localhost 生成二维码（手机微信无法打开） */
export function isLocalhostQrOrigin(): boolean {
  const origin = getPublicSiteOrigin()
  return /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/i.test(origin)
}

/**
 * 微信网页授权回调页路径（须走前端 SPA）。
 * 勿再用 /oidc-server/wechat/oauth：线上 Nginx 会把 /oidc-server/** 反代到后端导致 403。
 */
export const WECHAT_OAUTH_CALLBACK_PATH = '/wx/oauth'

/**
 * OAuth 回调地址（勿带 code/state 参数）
 * 微信 10003：redirect_uri 的域名必须与当前页域名、公众平台「授权回调域名」完全一致
 */
export function getOAuthRedirectUri(h5Path = WECHAT_OAUTH_CALLBACK_PATH): string {
  const path = h5Path.startsWith('/') ? h5Path : `/${h5Path}`
  if (typeof window !== 'undefined') {
    return `${window.location.origin}${path}`
  }
  return `${getPublicSiteOrigin()}${path}`
}

export type OAuthRedirectDiagnostics = {
  appId: string
  redirectUri: string
  redirectHost: string
  pageHost: string
  hostsMatch: boolean
  isTestAppId: boolean
}

export function getOAuthRedirectDiagnostics(): OAuthRedirectDiagnostics {
  const redirectUri = getOAuthRedirectUri()
  let redirectHost = ''
  try {
    redirectHost = new URL(redirectUri).hostname
  } catch {
    redirectHost = ''
  }
  const pageHost = typeof window !== 'undefined' ? window.location.hostname : ''
  const appId = resolveWechatAppId()
  return {
    appId,
    redirectUri,
    redirectHost,
    pageHost,
    hostsMatch: !!redirectHost && redirectHost === pageHost,
    isTestAppId: appId === LEGACY_WECHAT_TEST_APP_ID
  }
}

/** 短链扫码地址（减小二维码数据量，/w/:state 会跳转到完整 OAuth 页） */
export function buildOAuthScanUrl(state: string): string {
  const origin = getPublicSiteOrigin()
  if (!origin) return ''
  const safe = encodeURIComponent(state)
  return `${origin}/w/${safe}?intent=login`
}

const LOGIN_OAUTH_PENDING_PREFIX = 'fairspace_login_oauth_'

export type LoginOAuthPending = {
  intent: 'login'
  redirect?: string
}

/** 微信回跳只会带回 code/state，intent/redirect 需本地暂存 */
export function saveLoginOAuthPending(state: string, pending: LoginOAuthPending): void {
  if (typeof sessionStorage === 'undefined' || !state) return
  try {
    sessionStorage.setItem(`${LOGIN_OAUTH_PENDING_PREFIX}${state}`, JSON.stringify(pending))
  } catch {
    /* ignore */
  }
}

export function takeLoginOAuthPending(state: string): LoginOAuthPending | null {
  if (typeof sessionStorage === 'undefined' || !state) return null
  try {
    const key = `${LOGIN_OAUTH_PENDING_PREFIX}${state}`
    const raw = sessionStorage.getItem(key)
    sessionStorage.removeItem(key)
    if (!raw) return null
    const parsed = JSON.parse(raw) as LoginOAuthPending
    if (parsed?.intent !== 'login') return null
    return parsed
  } catch {
    return null
  }
}

export function peekLoginOAuthPending(state: string): LoginOAuthPending | null {
  if (typeof sessionStorage === 'undefined' || !state) return null
  try {
    const raw = sessionStorage.getItem(`${LOGIN_OAUTH_PENDING_PREFIX}${state}`)
    if (!raw) return null
    const parsed = JSON.parse(raw) as LoginOAuthPending
    if (parsed?.intent !== 'login') return null
    return parsed
  } catch {
    return null
  }
}

export function buildWechatAuthorizeUrl(
  config: WechatOAuthConfig,
  redirectUri: string,
  state: string
): string {
  const redirect = encodeURIComponent(redirectUri)
  const st = encodeURIComponent(state)
  return (
    'https://open.weixin.qq.com/connect/oauth2/authorize' +
    `?appid=${config.appId}` +
    `&redirect_uri=${redirect}` +
    '&response_type=code' +
    `&scope=${config.scope}` +
    `&state=${st}` +
    '#wechat_redirect'
  )
}

export function extractOpenIdFromResponse(res: unknown): string {
  if (!res || typeof res !== 'object') {
    return typeof res === 'string' ? res : ''
  }
  const r = res as Record<string, unknown>
  const direct = (r.openid || r.openId) as string | undefined
  if (direct) return direct

  const data = r.data
  if (typeof data === 'string') return data
  if (data && typeof data === 'object') {
    const d = data as Record<string, unknown>
    return String(d.openid || d.openId || '')
  }

  const result = r.result
  if (typeof result === 'string') return result
  if (result && typeof result === 'object') {
    const rr = result as Record<string, unknown>
    return String(rr.openid || rr.openId || '')
  }
  return ''
}

export function isBizSuccess(code: unknown): boolean {
  return code === undefined || code === 0 || code === 200 || code === '200'
}

/** 为 true 时才请求 /oidc-server/wechat/oauth/session|status|report|config（后端未实现时会 403） */
export function useServerOAuthApi(): boolean {
  return import.meta.env.VITE_WECHAT_OAUTH_SERVER_SESSION === 'true'
}

export type OAuthSessionResult = {
  state: string
  /** 是否由后端会话接口创建（为 true 时 PC 端才轮询 status） */
  serverBacked: boolean
}

/** 默认仅前端生成 state，避免请求不存在的 /oidc-server/wechat/oauth/session */
export async function createOAuthSessionState(): Promise<OAuthSessionResult> {
  if (useServerOAuthApi()) {
    try {
      const res = await fetch('/oidc-server/wechat/oauth/session')
      if (res.ok) {
        const json = await res.json()
        const data = json?.data ?? json
        const state = data?.state || data?.loginToken
        if (state) {
          return { state: String(state), serverBacked: true }
        }
      }
    } catch {
      /* 回退本地 state */
    }
  }
  return { state: createOAuthState(), serverBacked: false }
}

export async function reportOAuthToServer(
  params: { state: string; code: string; openId?: string },
  serverBacked: boolean
): Promise<void> {
  if (!serverBacked && !useServerOAuthApi()) return
  try {
    const q = new URLSearchParams({ state: params.state, code: params.code })
    if (params.openId) q.set('openId', params.openId)
    const res = await fetch(`/oidc-server/wechat/oauth/report?${q.toString()}`)
    if (!res.ok && res.status !== 404) {
      /* 静默：后端未部署 report 时不打扰用户 */
    }
  } catch {
    /* ignore */
  }
}

export async function fetchOAuthStatus(state: string): Promise<Record<string, unknown> | null> {
  if (!useServerOAuthApi()) return null
  try {
    const res = await fetch(`/oidc-server/wechat/oauth/status/${encodeURIComponent(state)}`)
    if (!res.ok) return null
    const json = await res.json()
    return (json?.data ?? json) as Record<string, unknown>
  } catch {
    return null
  }
}

export async function loadWechatOAuthConfig(): Promise<WechatOAuthConfig> {
  const envScope = (import.meta.env.VITE_WECHAT_OAUTH_SCOPE || 'snsapi_base') as WechatOAuthScope
  const appId = resolveWechatAppId()

  if (appId) {
    return { appId, scope: envScope }
  }

  if (useServerOAuthApi()) {
    try {
      const res = await fetch('/oidc-server/wechat/oauth/config')
      if (res.ok) {
        const json = await res.json()
        const data = json?.data ?? json
        const remoteAppId = data?.appId || data?.appid
        const scope = (data?.scope || envScope) as WechatOAuthScope
        if (remoteAppId) return { appId: String(remoteAppId), scope }
      }
    } catch {
      /* fall through */
    }
  }

  throw new Error('请配置 VITE_WECHAT_APP_ID（公众号 AppID）')
}
