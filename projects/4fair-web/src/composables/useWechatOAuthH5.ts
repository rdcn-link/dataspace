/**
 * 微信内 H5：网页授权获取 code → openId → findbyopenid → 登录 / 完善资料
 * 正常登录流程不再展示「授权 code」调试弹窗。
 */
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { navigateAfterLogin, resolvePostLoginPath } from '@/utils/loginRedirect'
import {
  isWeChatBrowser,
  stripOAuthQueryParams,
  getOAuthRedirectUri,
  buildWechatAuthorizeUrl,
  extractOpenIdFromResponse,
  isBizSuccess,
  loadWechatOAuthConfig,
  reportOAuthToServer,
  useServerOAuthApi,
  getOAuthRedirectDiagnostics,
  saveLoginOAuthPending,
  takeLoginOAuthPending,
  peekLoginOAuthPending,
  type OAuthRedirectDiagnostics
} from '@/utils/wechatOAuth'

export type OAuthH5Phase =
  | 'checking'
  | 'need_wechat'
  | 'redirecting'
  | 'exchanging'
  | 'success'
  | 'error'

function queryString(value: unknown): string {
  if (typeof value === 'string') return value
  if (Array.isArray(value) && typeof value[0] === 'string') return value[0]
  return ''
}

export function useWechatOAuthH5() {
  const route = useRoute()
  const router = useRouter()
  const authStore = useAuthStore()

  const phase = ref<OAuthH5Phase>('checking')
  const loginIntent = ref(true)
  const state = ref('')
  const authCode = ref('')
  const openId = ref('')
  const errorMessage = ref('')
  const showCodeModal = ref(false)
  const copyHint = ref('')
  const oauthDiag = ref<OAuthRedirectDiagnostics | null>(null)
  const pendingAuthUrl = ref('')
  const redirectAfterLogin = ref('')

  const serverBacked = useServerOAuthApi()

  async function exchangeCode(code: string) {
    const res = await fetch(
      `/oidc-server/wechat/code2openidByService?code=${encodeURIComponent(code)}`
    )
    if (!res.ok) {
      throw new Error(`换取身份失败 (HTTP ${res.status})`)
    }
    const text = await res.text()
    if (!text?.trim()) {
      throw new Error('code2openidByService 返回为空，请确认后端已配置正式公众号')
    }
    const json = JSON.parse(text)
    const oid = extractOpenIdFromResponse(json)
    if (!oid && !isBizSuccess(json?.code)) {
      throw new Error(json?.msg || json?.message || '换取 openId 失败')
    }
    return oid
  }

  /** openId → findbyopenid → 新用户完善资料 / 老用户进入业务页 */
  async function finishLoginWithOpenId(oid: string) {
    await authStore.loginWithOpenId(oid)
    phase.value = 'success'
    await navigateAfterLogin(router, redirectAfterLogin.value || route.query.redirect, '/')
  }

  async function handleOAuthCallback(code: string, sessionState: string) {
    phase.value = 'exchanging'
    authCode.value = code
    stripOAuthQueryParams()

    const pending = takeLoginOAuthPending(sessionState)
    if (pending?.redirect) {
      redirectAfterLogin.value = pending.redirect
    }
    // 微信回跳丢失 intent 时，默认仍按登录处理（本页即登录授权页）
    loginIntent.value = true

    const debugMode =
      route.query.oauth_debug === '1' ||
      (Array.isArray(route.query.oauth_debug) && route.query.oauth_debug[0] === '1')

    try {
      const oid = await exchangeCode(code)
      if (!oid) {
        throw new Error('未获取到 openId，请确认后端 code2openidByService 已配置正式公众号')
      }
      openId.value = oid
      await reportOAuthToServer({ state: sessionState, code, openId: oid }, serverBacked)

      if (debugMode) {
        phase.value = 'success'
        showCodeModal.value = true
        return
      }

      await finishLoginWithOpenId(oid)
    } catch (err: unknown) {
      await reportOAuthToServer({ state: sessionState, code }, serverBacked)
      authCode.value = code
      errorMessage.value =
        err instanceof Error ? err.message : '已获取 code，但换取 openId 失败'
      phase.value = 'error'
    }
  }

  function closeCodeModal() {
    showCodeModal.value = false
  }

  async function copyAuthCode() {
    const text = authCode.value
    if (!text) return
    copyHint.value = ''
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(text)
      } else {
        const ta = document.createElement('textarea')
        ta.value = text
        ta.style.position = 'fixed'
        ta.style.left = '-9999px'
        document.body.appendChild(ta)
        ta.select()
        document.execCommand('copy')
        document.body.removeChild(ta)
      }
      copyHint.value = '已复制到剪贴板'
    } catch {
      copyHint.value = '请长按下方 code 手动复制'
    }
  }

  function startOAuthRedirect(config: Awaited<ReturnType<typeof loadWechatOAuthConfig>>, sessionState: string) {
    const redirectUri = getOAuthRedirectUri()
    oauthDiag.value = getOAuthRedirectDiagnostics()
    oauthDiag.value.redirectUri = redirectUri
    try {
      oauthDiag.value.redirectHost = new URL(redirectUri).hostname
    } catch {
      oauthDiag.value.redirectHost = ''
    }

    if (!oauthDiag.value.hostsMatch) {
      phase.value = 'error'
      errorMessage.value = `回调域名「${oauthDiag.value.redirectHost}」与当前页「${oauthDiag.value.pageHost}」不一致，微信会报 10003`
      return
    }

    saveLoginOAuthPending(sessionState, {
      intent: 'login',
      redirect: redirectAfterLogin.value || undefined
    })

    const url = buildWechatAuthorizeUrl(config, redirectUri, sessionState)
    pendingAuthUrl.value = url

    const debugMode =
      route.query.oauth_debug === '1' ||
      (Array.isArray(route.query.oauth_debug) && route.query.oauth_debug[0] === '1')

    if (debugMode) {
      phase.value = 'error'
      errorMessage.value = '调试模式：请核对下方配置后点击「前往微信授权」'
      return
    }

    phase.value = 'redirecting'
    window.location.href = url
  }

  function goWechatAuthorize() {
    if (pendingAuthUrl.value) {
      phase.value = 'redirecting'
      window.location.href = pendingAuthUrl.value
    }
  }

  async function init() {
    phase.value = 'checking'
    errorMessage.value = ''
    showCodeModal.value = false
    copyHint.value = ''
    authCode.value = ''
    openId.value = ''

    if (!isWeChatBrowser()) {
      phase.value = 'need_wechat'
      return
    }

    const sessionState = queryString(route.query.state)
    if (!sessionState) {
      phase.value = 'error'
      errorMessage.value = '缺少 state 参数，请重新扫码'
      return
    }
    state.value = sessionState

    const redirectFromQuery = resolvePostLoginPath(queryString(route.query.redirect), '')
    const pending = peekLoginOAuthPending(sessionState)
    redirectAfterLogin.value = redirectFromQuery || pending?.redirect || ''

    loginIntent.value = true

    if (redirectFromQuery || queryString(route.query.intent) === 'login') {
      saveLoginOAuthPending(sessionState, {
        intent: 'login',
        redirect: redirectAfterLogin.value || undefined
      })
    }

    const code = queryString(route.query.code)
    if (code) {
      await handleOAuthCallback(code, sessionState)
      return
    }

    try {
      const config = await loadWechatOAuthConfig()
      startOAuthRedirect(config, sessionState)
    } catch (err: unknown) {
      phase.value = 'error'
      errorMessage.value = err instanceof Error ? err.message : '初始化授权失败'
    }
  }

  onMounted(() => {
    init()
  })

  return {
    phase,
    state,
    authCode,
    openId,
    errorMessage,
    loginIntent,
    showCodeModal,
    copyHint,
    oauthDiag,
    pendingAuthUrl,
    goWechatAuthorize,
    closeCodeModal,
    copyAuthCode,
    retry: init
  }
}
