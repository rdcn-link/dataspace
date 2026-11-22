/**
 * 微信扫码登录 Composable
 *
 * 对接后端实际接口：
 *   GET /oidc-server/wechat/wxLogin              → { qrCodeUrl, loginToken }
 *   GET /oidc-server/wechat/status/{loginToken}  → { openId, message, status }
 */
import { ref, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import request from '@/utils/request'
import { useAuthStore } from '@/stores/auth'
import { resolvePostLoginPath, navigateAfterLogin } from '@/utils/loginRedirect'
import { peekPendingDatasetSeek, resumePendingDatasetSeek } from '@/utils/datasetSeekPending'

export type QrStatus = 'loading' | 'waiting' | 'confirmed' | 'expired' | 'error'
export type WechatLoginOptions = {
  pollInterval?: number
  expiresIn?: number
  qrcodeApi?: string
  redirectPath?: string | (() => string)
  onSuccess?: () => void | Promise<void>
}

function extractOpenId(source: unknown): string {
  if (!source || typeof source !== 'object') return ''
  const obj = source as Record<string, unknown>
  const nested = obj.data
  const candidates = [
    obj.openId,
    obj.openid,
    nested && typeof nested === 'object' ? (nested as Record<string, unknown>).openId : '',
    nested && typeof nested === 'object' ? (nested as Record<string, unknown>).openid : ''
  ]
  for (const value of candidates) {
    const text = String(value ?? '').trim()
    if (text) return text
  }
  return ''
}

function isLoginConfirmedStatus(status: unknown): boolean {
  return Number(status) === 2
}

export function useWechatLogin(options?: WechatLoginOptions) {
  const {
    pollInterval = 2500,
    expiresIn = 300,
    qrcodeApi = '/oidc-server/wechat/wxLogin',
    redirectPath = '/',
    onSuccess
  } = options || {}

  const router = useRouter()
  const authStore = useAuthStore()

  const qrCodeUrl = ref<string>('')
  const loginToken = ref<string>('')
  const status = ref<QrStatus>('loading')
  const errorMessage = ref<string>('')
  const remainingSeconds = ref<number>(0)

  let pollTimer: ReturnType<typeof setTimeout> | null = null
  let countdownTimer: ReturnType<typeof setInterval> | null = null

  function resolveRedirectPath(): string {
    const raw = typeof redirectPath === 'function' ? redirectPath() : redirectPath
    return resolvePostLoginPath(raw, '/')
  }

  async function finishLoginFlow() {
    authStore.syncFromStorage()

    if (onSuccess) {
      if (peekPendingDatasetSeek() && !authStore.needsProfileCompletion()) {
        await resumePendingDatasetSeek(authStore)
      }
      await Promise.resolve(onSuccess())
      return
    }

    await navigateAfterLogin(router, resolveRedirectPath())
  }

  async function fetchQRCode() {
    status.value = 'loading'
    errorMessage.value = ''
    qrCodeUrl.value = ''
    loginToken.value = ''

    try {
      const res: any = await request.get(qrcodeApi)
      const body = res?.data?.qrCodeUrl != null ? res.data : res
      if (body && body.qrCodeUrl) {
        loginToken.value = body.loginToken
        qrCodeUrl.value = body.qrCodeUrl
        status.value = 'waiting'
        remainingSeconds.value = expiresIn
        startCountdown()
        startPolling()
      } else {
        throw new Error('获取二维码失败')
      }
    } catch (err: any) {
      status.value = 'error'
      errorMessage.value = err?.message || '网络错误，请检查网络连接'
    }
  }

  function startCountdown() {
    stopCountdown()
    remainingSeconds.value = expiresIn
    countdownTimer = setInterval(() => {
      if (remainingSeconds.value > 0) {
        remainingSeconds.value--
      } else {
        stopCountdown()
      }
    }, 1000)
  }

  function stopCountdown() {
    if (countdownTimer) {
      clearInterval(countdownTimer)
      countdownTimer = null
    }
  }

  function startPolling() {
    stopPolling()
    pollTimer = setTimeout(doPoll, pollInterval)
  }

  async function doPoll() {
    if (!loginToken.value) return
    if (status.value === 'confirmed' || status.value === 'expired') return

    try {
      const res: any = await request.get(`/oidc-server/wechat/status/${loginToken.value}`)
      const payload = res?.data?.status != null ? res.data : res
      if (payload) {
        const apiStatus = payload.status
        if (isLoginConfirmedStatus(apiStatus)) {
          stopPolling()
          stopCountdown()
          const openId = extractOpenId(payload) || extractOpenId(res)
          if (!openId) {
            status.value = 'error'
            errorMessage.value = '登录失败：未获取到用户信息，请重试'
            return
          }
          try {
            await authStore.loginWithOpenId(openId)
          } catch {
            status.value = 'error'
            errorMessage.value = '登录失败，请重试'
            return
          }
          if (!authStore.isLoggedIn) {
            authStore.syncFromStorage()
          }
          if (!authStore.isLoggedIn) {
            status.value = 'error'
            errorMessage.value = '登录状态保存失败，请重试'
            return
          }
          status.value = 'confirmed'
          setTimeout(() => {
            void finishLoginFlow()
          }, 800)
        } else if (Number(apiStatus) === 3) {
          status.value = 'expired'
          stopPolling()
          stopCountdown()
        } else {
          if (remainingSeconds.value <= 0) {
            status.value = 'expired'
            stopPolling()
            stopCountdown()
          } else {
            pollTimer = setTimeout(doPoll, pollInterval)
          }
        }
      } else {
        pollTimer = setTimeout(doPoll, pollInterval)
      }
    } catch {
      if (status.value !== 'confirmed' && status.value !== 'expired') {
        pollTimer = setTimeout(doPoll, pollInterval * 2)
      }
    }
  }

  function stopPolling() {
    if (pollTimer) {
      clearTimeout(pollTimer)
      pollTimer = null
    }
  }

  function refresh() {
    stopPolling()
    stopCountdown()
    fetchQRCode()
  }

  function cleanup() {
    stopPolling()
    stopCountdown()
  }

  onUnmounted(cleanup)

  return {
    qrCodeUrl,
    loginToken,
    status,
    errorMessage,
    remainingSeconds,
    fetchQRCode,
    refresh,
    cleanup
  }
}
