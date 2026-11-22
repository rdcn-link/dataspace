/**
 * PC 扫码 + 微信内 OAuth 授权 + 登录（费尔空间）
 *
 * PC：/oidc-server/wechat/login 展示二维码
 * 手机：/wx/oauth?state=xxx&intent=login → 公众号授权 → code2openidByService → 登录
 * （旧路径 /oidc-server/wechat/oauth 在生产会被 Nginx 反代成 403）
 */
import { ref, onMounted, onUnmounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import {
  createOAuthSessionState,
  fetchOAuthStatus,
  buildOAuthScanUrl,
  extractOpenIdFromResponse,
  isLocalhostQrOrigin
} from '@/utils/wechatOAuth'
import { generateQRDataURL } from '@/utils/qrcode'
import { resolvePostLoginPath, navigateAfterLogin } from '@/utils/loginRedirect'

export type OAuthLoginPhase = 'loading' | 'waiting' | 'success' | 'expired' | 'error'

const EXPIRES_IN = 300
const POLL_INTERVAL = 2000

export function useWechatOAuthLogin() {
  const route = useRoute()
  const router = useRouter()
  const authStore = useAuthStore()

  const phase = ref<OAuthLoginPhase>('loading')
  const sessionState = ref('')
  const qrDataUrl = ref('')
  const scanUrl = ref('')
  const needsPublicUrl = ref(isLocalhostQrOrigin())
  const errorMessage = ref('')
  const remainingSeconds = ref(0)

  let pollTimer: ReturnType<typeof setTimeout> | null = null
  let countdownTimer: ReturnType<typeof setInterval> | null = null
  let serverBackedSession = false

  function resolveRedirect(): string {
    return resolvePostLoginPath(route.query.redirect, '/')
  }

  async function finishLogin(openId: string) {
    if (!openId) return
    await authStore.loginWithOpenId(openId)
    phase.value = 'success'
    stopPolling()
    stopCountdown()
    setTimeout(() => {
      void navigateAfterLogin(router, resolveRedirect(), '/')
    }, 800)
  }

  function stopCountdown() {
    if (countdownTimer) {
      clearInterval(countdownTimer)
      countdownTimer = null
    }
  }

  function stopPolling() {
    if (pollTimer) {
      clearTimeout(pollTimer)
      pollTimer = null
    }
  }

  function startCountdown() {
    stopCountdown()
    remainingSeconds.value = EXPIRES_IN
    countdownTimer = setInterval(() => {
      if (remainingSeconds.value > 0) {
        remainingSeconds.value--
      } else {
        phase.value = 'expired'
        stopPolling()
        stopCountdown()
      }
    }, 1000)
  }

  async function pollStatus() {
    if (
      !serverBackedSession ||
      !sessionState.value ||
      phase.value === 'success' ||
      phase.value === 'expired'
    ) {
      return
    }

    const data = await fetchOAuthStatus(sessionState.value)
    if (data) {
      const oid = String(data.openId || data.openid || '')
      if (oid) {
        await finishLogin(oid)
        return
      }
      if (data.status === 2 && data.code) {
        const codeRes = await fetch(
          `/oidc-server/wechat/code2openidByService?code=${encodeURIComponent(String(data.code))}`
        )
        if (codeRes.ok) {
          const text = await codeRes.text()
          const parsed = JSON.parse(text || '{}')
          const fromCode = extractOpenIdFromResponse(parsed)
          if (fromCode) {
            await finishLogin(fromCode)
            return
          }
        }
      }
      if (data.status === 3) {
        phase.value = 'expired'
        stopPolling()
        stopCountdown()
        return
      }
    }

    if (remainingSeconds.value > 0) {
      pollTimer = setTimeout(pollStatus, POLL_INTERVAL)
    }
  }

  function startPolling() {
    if (!serverBackedSession) return
    stopPolling()
    pollTimer = setTimeout(pollStatus, POLL_INTERVAL)
  }

  async function init() {
    phase.value = 'loading'
    errorMessage.value = ''
    qrDataUrl.value = ''
    stopPolling()
    stopCountdown()

    try {
      const { state, serverBacked } = await createOAuthSessionState()
      serverBackedSession = serverBacked
      sessionState.value = state
      scanUrl.value = buildOAuthScanUrl(state)
      if (!scanUrl.value) {
        phase.value = 'error'
        errorMessage.value =
          '无法生成扫码地址。请在 .env.development 设置 VITE_APP_PUBLIC_URL=https://fairspace.cn 后重启 dev。'
        return
      }
      needsPublicUrl.value = isLocalhostQrOrigin()
      if (needsPublicUrl.value) {
        phase.value = 'error'
        errorMessage.value =
          '当前二维码指向 localhost，手机微信无法访问。请在 .env 配置 VITE_APP_PUBLIC_URL 为公网/穿透地址后重启 dev。'
        return
      }
      qrDataUrl.value = await generateQRDataURL(scanUrl.value, 280)
      if (!qrDataUrl.value) {
        throw new Error('二维码图片生成失败')
      }
      phase.value = 'waiting'
      startCountdown()
      startPolling()
    } catch (err: unknown) {
      phase.value = 'error'
      errorMessage.value = err instanceof Error ? err.message : '生成二维码失败'
    }
  }

  function refresh() {
    init()
  }

  onMounted(init)
  onUnmounted(() => {
    stopPolling()
    stopCountdown()
  })

  return {
    phase,
    qrDataUrl,
    scanUrl,
    needsPublicUrl,
    errorMessage,
    remainingSeconds,
    refresh
  }
}
