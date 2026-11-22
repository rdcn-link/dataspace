/**
 * PC 端：展示扫码二维码，轮询授权结果（code / openId）
 */
import { ref, onMounted, onUnmounted } from 'vue'
import {
  createOAuthSessionState,
  fetchOAuthStatus,
  buildOAuthScanUrl
} from '@/utils/wechatOAuth'
import { generateQRDataURL } from '@/utils/qrcode'

export type ScanPhase = 'loading' | 'waiting' | 'success' | 'expired' | 'error'

const EXPIRES_IN = 300
const POLL_INTERVAL = 2000

export function useWechatOAuthScan() {
  const phase = ref<ScanPhase>('loading')
  const sessionState = ref('')
  const qrDataUrl = ref('')
  const h5Url = ref('')
  const authCode = ref('')
  const openId = ref('')
  const errorMessage = ref('')
  const remainingSeconds = ref(0)

  let pollTimer: ReturnType<typeof setTimeout> | null = null
  let countdownTimer: ReturnType<typeof setInterval> | null = null
  let serverBackedSession = false

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
      const status = data.status
      if (status === 2 || data.code) {
        authCode.value = String(data.code || data.authCode || '')
        openId.value = String(data.openId || data.openid || '')
        phase.value = 'success'
        stopPolling()
        stopCountdown()
        return
      }
      if (status === 3) {
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
    authCode.value = ''
    openId.value = ''
    qrDataUrl.value = ''
    stopPolling()
    stopCountdown()

    try {
      const { state, serverBacked } = await createOAuthSessionState()
      serverBackedSession = serverBacked
      sessionState.value = state
      h5Url.value = buildOAuthScanUrl(state)
      qrDataUrl.value = await generateQRDataURL(h5Url.value, 280)
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
    sessionState,
    qrDataUrl,
    h5Url,
    authCode,
    openId,
    errorMessage,
    remainingSeconds,
    refresh
  }
}
