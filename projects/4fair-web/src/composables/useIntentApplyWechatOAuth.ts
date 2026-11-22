/**
 * 申请页扫码：微信授权 → code2openid → bindUser，成功则进入申请流程
 */
import { ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import type { IntentApplyQuery } from '@/utils/intentApply'
import {
  saveIntentApplyOAuthPending,
  loadIntentApplyOAuthPending,
  clearIntentApplyOAuthPending
} from '@/utils/intentApplyOAuth'
import {
  isWeChatBrowser,
  stripOAuthQueryParams,
  getOAuthRedirectUri,
  buildWechatAuthorizeUrl,
  extractOpenIdFromResponse,
  isBizSuccess,
  loadWechatOAuthConfig,
  createOAuthState,
  getOAuthRedirectDiagnostics,
  type OAuthRedirectDiagnostics
} from '@/utils/wechatOAuth'

export type IntentApplyOAuthPhase =
  | 'idle'
  | 'checking'
  | 'redirecting'
  | 'exchanging'
  | 'binding'
  | 'ready'
  | 'error'

const OPENID_CACHE_PREFIX = 'intent_apply_openid_for_code_'
const VERIFY_FAIL_MSG = '用户校验失败，请重新扫码申请'
const BIND_OTHER_WECHAT_API_MSG = '用户已绑定其他微信'
const BIND_OTHER_WECHAT_TIP = '请使用本人微信扫码申请'

function readApiMessage(json: Record<string, unknown>): string {
  return String(json?.message || json?.msg || '').trim()
}

function isBindOtherWechatMessage(message: string): boolean {
  return message.includes(BIND_OTHER_WECHAT_API_MSG)
}

function resolveVerifyFailMessage(err: unknown): string {
  if (err instanceof Error && err.message === BIND_OTHER_WECHAT_TIP) {
    return BIND_OTHER_WECHAT_TIP
  }
  return VERIFY_FAIL_MSG
}

function cacheOpenIdForCode(code: string, openId: string) {
  try {
    sessionStorage.setItem(`${OPENID_CACHE_PREFIX}${code}`, openId)
  } catch {
    /* ignore */
  }
}

function readCachedOpenIdForCode(code: string): string {
  try {
    return sessionStorage.getItem(`${OPENID_CACHE_PREFIX}${code}`) || ''
  } catch {
    return ''
  }
}

export function useIntentApplyWechatOAuth(options: {
  getApplyParams: () => IntentApplyQuery
  onParamsRestored: (params: IntentApplyQuery) => void
  onOpenIdReady: (openId: string) => void
}) {
  const route = useRoute()
  const router = useRouter()

  const phase = ref<IntentApplyOAuthPhase>('idle')
  const wechatOpenId = ref('')
  const showVerifyFailModal = ref(false)
  const verifyFailMessage = ref(VERIFY_FAIL_MSG)
  const oauthDiag = ref<OAuthRedirectDiagnostics | null>(null)

  let initFinished = false
  let exchangeInFlight: Promise<string> | null = null
  let exchangeInFlightCode = ''
  let callbackConsumed = false

  function readOAuthCode(): string {
    const q = route.query.code
    if (typeof q === 'string') return q
    if (Array.isArray(q) && q[0]) return String(q[0])
    return ''
  }

  function readOAuthState(): string {
    const q = route.query.state
    if (typeof q === 'string') return q
    if (Array.isArray(q) && q[0]) return String(q[0])
    return ''
  }

  function isOAuthDisabled(): boolean {
    const q = route.query.wx_auth
    if (q === '0' || q === 'false') return true
    if (Array.isArray(q) && (q[0] === '0' || q[0] === 'false')) return true
    return false
  }

  function showVerifyFail(message = VERIFY_FAIL_MSG) {
    verifyFailMessage.value = message
    showVerifyFailModal.value = true
    phase.value = 'error'
  }

  function closeVerifyFailModal() {
    showVerifyFailModal.value = false
  }

  function applyRestoredQuery(params: IntentApplyQuery) {
    options.onParamsRestored(params)
    const q: Record<string, string> = {
      uid: params.uid,
      cstr: params.cstr
    }
    if (params.title) q.title = params.title
    if (params.publisher) q.publisher = params.publisher
    if (params.level) q.level = params.level
    router.replace({ path: '/intent/apply-new', query: q })
  }

  async function exchangeCodeToOpenId(code: string): Promise<string> {
    const cached = readCachedOpenIdForCode(code)
    if (cached) return cached

    if (exchangeInFlight && exchangeInFlightCode === code) {
      return exchangeInFlight
    }

    exchangeInFlightCode = code
    exchangeInFlight = (async () => {
      const res = await fetch(
        `/oidc-server/wechat/code2openidByService?code=${encodeURIComponent(code)}`
      )
      if (!res.ok) {
        throw new Error(`HTTP ${res.status}`)
      }
      const text = await res.text()
      if (!text?.trim()) {
        throw new Error('接口返回为空')
      }
      const json = JSON.parse(text)
      const oid = extractOpenIdFromResponse(json)
      if (!oid && !isBizSuccess(json?.code)) {
        throw new Error(json?.message || json?.msg || '换取 openId 失败')
      }
      if (!oid) {
        throw new Error('未返回 openId')
      }
      cacheOpenIdForCode(code, oid)
      return oid
    })()

    try {
      return await exchangeInFlight
    } finally {
      if (exchangeInFlightCode === code) {
        exchangeInFlight = null
        exchangeInFlightCode = ''
      }
    }
  }

  async function bindWechatUser(openId: string, uid: string): Promise<void> {
    const res = await fetch(
      `/oidc-server/wechat/bindUser?openid=${encodeURIComponent(openId)}&uid=${encodeURIComponent(uid)}`
    )
    const text = await res.text()
    let json: Record<string, unknown> = {}
    if (text?.trim()) {
      try {
        json = JSON.parse(text) as Record<string, unknown>
      } catch {
        throw new Error(VERIFY_FAIL_MSG)
      }
    }

    const apiMsg = readApiMessage(json)
    if (isBindOtherWechatMessage(apiMsg)) {
      throw new Error(BIND_OTHER_WECHAT_TIP)
    }

    if (!res.ok || !isBizSuccess(json?.code)) {
      throw new Error(VERIFY_FAIL_MSG)
    }
  }

  async function completeVerify(openId: string, uid: string) {
    wechatOpenId.value = openId
    phase.value = 'binding'
    await bindWechatUser(openId, uid)
    options.onOpenIdReady(openId)
    phase.value = 'ready'
  }

  async function handleOAuthCallback(code: string, sessionState: string) {
    if (callbackConsumed) return
    callbackConsumed = true

    phase.value = 'exchanging'
    showVerifyFailModal.value = false

    const pending = loadIntentApplyOAuthPending(sessionState)
    if (!pending?.uid || !pending?.cstr) {
      stripOAuthQueryParams()
      showVerifyFail()
      return
    }

    applyRestoredQuery(pending)
    clearIntentApplyOAuthPending(sessionState)
    stripOAuthQueryParams()

    try {
      let openId = readCachedOpenIdForCode(code)
      if (!openId) {
        openId = await exchangeCodeToOpenId(code)
      }
      await completeVerify(openId, pending.uid)
    } catch (err: unknown) {
      showVerifyFail(resolveVerifyFailMessage(err))
    }
  }

  async function startOAuthRedirect() {
    const params = options.getApplyParams()
    if (!params.uid || !params.cstr) {
      showVerifyFail('链接缺少 uid 或 cstr，请重新扫码')
      return
    }

    const sessionState = createOAuthState()
    saveIntentApplyOAuthPending(sessionState, params)

    const redirectUri = getOAuthRedirectUri('/intent/apply-new')
    oauthDiag.value = getOAuthRedirectDiagnostics()
    oauthDiag.value.redirectUri = redirectUri
    try {
      oauthDiag.value.redirectHost = new URL(redirectUri).hostname
    } catch {
      oauthDiag.value.redirectHost = ''
    }

    if (!oauthDiag.value.hostsMatch) {
      showVerifyFail('授权回调域名配置异常，请重新扫码')
      return
    }

    try {
      const config = await loadWechatOAuthConfig()
      const url = buildWechatAuthorizeUrl(config, redirectUri, sessionState)
      phase.value = 'redirecting'
      window.location.href = url
    } catch (err: unknown) {
      showVerifyFail(resolveVerifyFailMessage(err))
    }
  }

  async function initWechatOAuth() {
    if (initFinished) return
    initFinished = true

    if (!isWeChatBrowser()) {
      if (isOAuthDisabled()) {
        phase.value = 'idle'
        initFinished = false
        return
      }
      showVerifyFail('请在微信内打开此链接')
      return
    }

    if (isOAuthDisabled()) {
      phase.value = 'idle'
      initFinished = false
      return
    }

    const code = readOAuthCode()
    const sessionState = readOAuthState()

    if (code && sessionState) {
      await handleOAuthCallback(code, sessionState)
      return
    }

    if (code && !sessionState) {
      stripOAuthQueryParams()
      showVerifyFail()
      return
    }

    phase.value = 'checking'
    await startOAuthRedirect()
  }

  const oauthBusy = () =>
    phase.value === 'checking' ||
    phase.value === 'redirecting' ||
    phase.value === 'exchanging' ||
    phase.value === 'binding'

  const oauthVerified = () => phase.value === 'ready' && !!wechatOpenId.value

  /** 校验失败（含已绑定其他微信）时不应展示申请表单 */
  const applyAccessDenied = () => phase.value === 'error' || showVerifyFailModal.value

  return {
    phase,
    wechatOpenId,
    showVerifyFailModal,
    verifyFailMessage,
    oauthDiag,
    oauthBusy,
    oauthVerified,
    applyAccessDenied,
    closeVerifyFailModal,
    initWechatOAuth,
    retryWechatOAuth: startOAuthRedirect
  }
}
