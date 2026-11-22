<template>
  <div class="user-share-page">
    <div class="bg-blob blob-1" aria-hidden="true" />
    <div class="bg-blob blob-2" aria-hidden="true" />

    <header class="page-header">
      <div class="page-header__inner">
        <div class="brand">
          <BrandLogo size="sm" class="brand__logo" />
          <span class="brand__name">费尔空间</span>
        </div>
      </div>
    </header>

    <main class="page-main">
      <div class="page-intro">
        <h1 class="page-title">
          用户<span class="gradient-text">信息</span>
        </h1>
        <p class="page-subtitle">扫码关注公众号，获取审批与数据服务通知</p>
      </div>

      <div v-if="loading" class="state-card">
        <iconify-icon class="state-card__spin" icon="mdi:loading" />
        <p>正在加载用户信息…</p>
      </div>

      <div v-else-if="error" class="state-card state-card--error">
        <iconify-icon icon="mdi:alert-circle-outline" />
        <p class="state-card__msg">{{ error }}</p>
        <p v-if="!uid" class="state-card__hint">
          请在链接中携带 uid，例如：/oidc-server/user/share?uid=您的用户ID
        </p>
      </div>

      <div v-else-if="userInfo" class="share-layout">
        <!-- 用户信息 -->
        <section class="panel panel--user">
          <div class="user-head">
            <span class="user-avatar">{{ avatarInitial }}</span>
            <div class="user-head__text">
              <span class="user-head__tag">账号用户</span>
              <h2 class="user-head__name">{{ displayName }}</h2>
              <p v-if="userInfo.uid" class="user-head__uid">UID: {{ userInfo.uid }}</p>
            </div>
          </div>

          <dl class="info-list">
            <div v-for="row in infoRows" :key="row.label" class="info-row">
              <dt>
                <iconify-icon :icon="row.icon" />
                {{ row.label }}
              </dt>
              <dd>{{ row.value }}</dd>
            </div>
          </dl>
        </section>

        <!-- 公众号二维码 -->
        <section class="panel panel--qr">
          <div class="qr-copy">
            <h3>扫码关注官方公众号</h3>
            <p>关注后可接收数据集申请审批结果通知</p>
          </div>
          <div class="qr-display">
            <div v-if="qrStatus === 'loading'" class="qr-state">
              <iconify-icon class="qr-state__spin" icon="mdi:loading" />
              <p>正在获取二维码...</p>
            </div>

            <div v-else-if="qrStatus === 'waiting'" class="qr-state">
              <div class="qr-container">
                <img
                  alt="微信登录二维码"
                  class="share-qr-img"
                  :src="qrCodeUrl"
                />
              </div>
              <div class="qr-countdown">
                <span>二维码有效期</span>
                <span
                  class="qr-countdown__sec"
                  :class="{ 'qr-countdown__sec--warn': remainingSeconds < 30 }"
                >
                  {{ remainingSeconds }}s
                </span>
              </div>
            </div>

            <div v-else-if="qrStatus === 'confirmed'" class="qr-state">
              <iconify-icon class="qr-state__ok" icon="mdi:check-circle-outline" />
              <p class="qr-state__title">扫码成功</p>
              <p class="qr-state__hint">已绑定微信，即将跳转主页…</p>
            </div>

            <div v-else-if="qrStatus === 'expired'" class="qr-state">
              <iconify-icon class="qr-state__muted" icon="mdi:qrcode-scan" />
              <p class="qr-state__hint">二维码已过期</p>
              <button type="button" class="btn-gradient qr-retry-btn" @click="refreshQR">
                重新获取
              </button>
            </div>

            <div v-else-if="qrStatus === 'error'" class="qr-state">
              <iconify-icon class="qr-state__err" icon="mdi:alert-circle-outline" />
              <p class="qr-state__err-msg">{{ qrErrorMessage }}</p>
              <button type="button" class="btn-gradient qr-retry-btn" @click="refreshQR">
                重试
              </button>
            </div>
          </div>

          <p class="qr-foot">
            <iconify-icon icon="mdi:qrcode-scan" />
            请使用微信扫码完成绑定
          </p>
        </section>
      </div>
    </main>
  </div>
</template>

<script setup lang="ts">
/**
 * 微信扫码绑定（本页内联实现）
 *   GET /oidc-server/wechat/wxLogin                                    → { qrCodeUrl, loginToken }
 *   GET /oidc-server/wechat/bindUser?loginToken=xxx&uid=xxx            → { status, ... }，status=2 为扫码绑定成功
 */
import { computed, onMounted, onUnmounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import request from '@/utils/request'
import { useAuthStore } from '@/stores/auth'
import { useMyDatasetsModal } from '@/composables/useMyDatasetsModal'
import BrandLogo from '@/components/BrandLogo.vue'

type QrStatus = 'loading' | 'waiting' | 'confirmed' | 'expired' | 'error'

interface UserInfoRecord {
  uid?: string
  username?: string
  name?: string
  phone?: string
  source?: string
  email?: string
  affiliation?: string
}

const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()
const { markOpenAfterBind } = useMyDatasetsModal()

const uid = ref('')
const loading = ref(false)
const error = ref('')
const userInfo = ref<UserInfoRecord | null>(null)

const QR_POLL_INTERVAL = 2500
const QR_EXPIRES_IN = 300
const QR_CODE_API = '/oidc-server/wechat/wxLogin'

const qrCodeUrl = ref('')
const loginToken = ref('')
const qrStatus = ref<QrStatus>('loading')
const qrErrorMessage = ref('')
const remainingSeconds = ref(0)

let pollTimer: ReturnType<typeof setTimeout> | null = null
let countdownTimer: ReturnType<typeof setInterval> | null = null

const displayName = computed(() => {
  if (!userInfo.value) return '—'
  return (
    userInfo.value.name ||
    userInfo.value.username ||
    userInfo.value.uid ||
    '未知用户'
  )
})

const avatarInitial = computed(() => {
  const name = displayName.value
  return name && name !== '—' ? name.charAt(0).toUpperCase() : '?'
})

const infoRows = computed(() => {
  if (!userInfo.value) return []
  const u = userInfo.value
  return [
    { label: '用户账号', value: u.username || '暂无', icon: 'mdi:account-outline' },
    { label: '用户姓名', value: u.name || '暂无', icon: 'mdi:card-account-details-outline' },
    { label: '联系电话', value: u.phone || '暂无', icon: 'mdi:phone-outline' },
    { label: '所属机构', value: u.source || '暂无', icon: 'mdi:office-building-outline' }
  ]
})

function resolveUid() {
  const q = route.query.uid
  const fromQuery = typeof q === 'string' ? q : Array.isArray(q) ? q[0] : ''
  uid.value = (fromQuery || '').trim()
}

async function fetchUserInfo() {
  if (!uid.value) {
    userInfo.value = null
    error.value = '链接缺少 uid 参数'
    return
  }

  loading.value = true
  error.value = ''
  userInfo.value = null

  try {
    const res = await fetch(
      `/oidc-server/user/user.findbyuid?uid=${encodeURIComponent(uid.value)}`
    )
    const json = await res.json()
    const data = (json.data || json) as UserInfoRecord

    if (json.code !== undefined && json.code !== 200 && json.code !== 0) {
      throw new Error(json.message || json.msg || '获取用户信息失败')
    }

    if (!data || (!data.username && !data.name && !data.uid)) {
      throw new Error('未查询到该用户信息')
    }

    userInfo.value = {
      uid: data.uid || uid.value,
      username: data.username,
      name: data.name,
      phone: data.phone,
      source: data.source,
      email: data.email,
      affiliation: data.affiliation
    }
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : '网络异常，请稍后重试'
    error.value = msg
  } finally {
    loading.value = false
  }
}

async function fetchQRCode() {
  qrStatus.value = 'loading'
  qrErrorMessage.value = ''
  qrCodeUrl.value = ''
  loginToken.value = ''

  try {
    const res: { qrCodeUrl?: string; loginToken?: string } = await request.get(QR_CODE_API)
    if (res?.qrCodeUrl) {
      loginToken.value = res.loginToken || ''
      qrCodeUrl.value = res.qrCodeUrl
      qrStatus.value = 'waiting'
      remainingSeconds.value = QR_EXPIRES_IN
      startCountdown()
      if (uid.value) {
        startPolling()
      }
    } else {
      throw new Error('获取二维码失败')
    }
  } catch (err: unknown) {
    qrStatus.value = 'error'
    qrErrorMessage.value =
      err instanceof Error ? err.message : '网络错误，请检查网络连接'
  }
}

function startCountdown() {
  stopCountdown()
  remainingSeconds.value = QR_EXPIRES_IN
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
  pollTimer = setTimeout(doPoll, QR_POLL_INTERVAL)
}

function getBindPayload(res: unknown): Record<string, unknown> {
  if (!res || typeof res !== 'object') return {}
  const body = res as Record<string, unknown>
  const data = body.data
  if (data && typeof data === 'object') {
    return { ...body, ...(data as Record<string, unknown>) }
  }
  return body
}

function resolveBindStatus(res: unknown): number | undefined {
  const payload = getBindPayload(res)
  if (payload.status !== undefined && payload.status !== null) {
    return Number(payload.status)
  }
  return undefined
}

function resolveBindOpenId(res: unknown): string {
  const payload = getBindPayload(res)
  const openId = payload.openId ?? payload.openid ?? payload.open_id
  return typeof openId === 'string' ? openId.trim() : ''
}

function handleBindSuccess(res: unknown) {
  qrStatus.value = 'confirmed'
  stopPolling()
  stopCountdown()

  const openId = resolveBindOpenId(res)
  if (openId) {
    authStore.loginWithOpenId(openId)
  } else if (uid.value) {
    authStore.setUser({
      id: uid.value,
      nickname:
        userInfo.value?.name ||
        userInfo.value?.username ||
        uid.value,
      uid: uid.value,
      openId: ''
    })
  }

  markOpenAfterBind()

  setTimeout(() => {
    router.push('/')
  }, 1000)
}

function scheduleNextPoll(delay = QR_POLL_INTERVAL) {
  if (qrStatus.value === 'confirmed' || qrStatus.value === 'expired') return
  if (remainingSeconds.value <= 0) {
    qrStatus.value = 'expired'
    stopPolling()
    stopCountdown()
    return
  }
  pollTimer = setTimeout(doPoll, delay)
}

async function doPoll() {
  if (!loginToken.value || !uid.value) return
  if (qrStatus.value === 'confirmed' || qrStatus.value === 'expired') return

  try {
    const res = await request.get('/oidc-server/wechat/bindUser', {
      params: {
        loginToken: loginToken.value,
        uid: uid.value
      }
    })
    const apiStatus = resolveBindStatus(res)
    if (apiStatus === 2) {
      handleBindSuccess(res)
      return
    }
    scheduleNextPoll()
  } catch {
    scheduleNextPoll(QR_POLL_INTERVAL * 2)
  }
}

function stopPolling() {
  if (pollTimer) {
    clearTimeout(pollTimer)
    pollTimer = null
  }
}

function refreshQR() {
  stopPolling()
  stopCountdown()
  fetchQRCode()
}

function cleanupQR() {
  stopPolling()
  stopCountdown()
}

onMounted(() => {
  resolveUid()
  fetchUserInfo()
  fetchQRCode()
})

onUnmounted(cleanupQR)

watch(
  () => route.query.uid,
  () => {
    resolveUid()
    fetchUserInfo()
    if (loginToken.value && qrStatus.value === 'waiting' && uid.value) {
      startPolling()
    }
  }
)
</script>

<style scoped>
/* —— 页面基底 —— */
.user-share-page {
  --c-bg: #f1f5f9;
  --c-surface: #ffffff;
  --c-border: #e2e8f0;
  --c-text: #0f172a;
  --c-muted: #64748b;
  --c-accent: #2563eb;
  --radius: 16px;
  --shadow: 0 4px 24px -4px rgba(37, 99, 235, 0.1), 0 2px 8px rgba(15, 23, 42, 0.04);

    min-height: 100dvh;
  background: linear-gradient(160deg, #f8fafc 0%, #eef2ff 45%, #f5f3ff 100%);
  color: var(--c-text);
  display: flex;
  flex-direction: column;
  overflow-x: hidden;
}

/* —— 顶栏 —— */
.page-header {
  flex-shrink: 0;
  background: rgba(255, 255, 255, 0.85);
  backdrop-filter: blur(16px);
  border-bottom: 1px solid rgba(226, 232, 240, 0.6);
}

.page-header__inner {
  max-width: 960px;
  margin: 0 auto;
  padding: 0 16px;
  height: 48px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.brand {
  display: flex;
  align-items: center;
  gap: 8px;
}

.brand__logo {
  flex-shrink: 0;
}

.brand__name {
  font-size: 16px;
  font-weight: 700;
  letter-spacing: -0.02em;
}

/* —— 主内容：垂直居中，卡片随内容增高 —— */
.page-main {
  flex: 1;
  width: 100%;
  max-width: 960px;
  margin: 0 auto;
  padding: 12px 16px 20px;
  padding-bottom: calc(20px + env(safe-area-inset-bottom, 0));
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  box-sizing: border-box;
}

.page-intro {
  text-align: center;
  margin-bottom: 14px;
  flex-shrink: 0;
}

.page-title {
  font-size: 1.25rem;
  font-weight: 800;
  letter-spacing: -0.03em;
  line-height: 1.2;
  margin: 0;
}

.page-subtitle {
  margin: 4px 0 0;
  font-size: 12px;
  color: var(--c-muted);
  line-height: 1.4;
}

.gradient-text {
  background: linear-gradient(135deg, #2563eb, #7c3aed, #db2777);
  -webkit-background-clip: text;
  background-clip: text;
  -webkit-text-fill-color: transparent;
}

/* —— 加载 / 错误 —— */
.state-card {
  width: 100%;
  max-width: 420px;
  padding: 28px 20px;
  text-align: center;
  background: var(--c-surface);
  border-radius: var(--radius);
  border: 1px solid var(--c-border);
  box-shadow: var(--shadow);
  font-size: 13px;
  color: var(--c-muted);
}

.state-card iconify-icon {
  font-size: 36px;
  color: #f87171;
}

.state-card__spin {
  font-size: 28px !important;
  color: var(--c-accent) !important;
  animation: spin 0.9s linear infinite;
}

.state-card__msg {
  margin: 10px 0 0;
  color: var(--c-text);
  font-weight: 600;
}

.state-card__hint {
  margin: 8px 0 0;
  font-size: 11px;
  line-height: 1.5;
}

/* —— 双卡布局：手机纵向 / Web 横向 —— */
.share-layout {
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 12px;
  align-items: stretch;
}

.panel {
  background: var(--c-surface);
  border: 1px solid var(--c-border);
  border-radius: var(--radius);
  box-shadow: var(--shadow);
  width: 100%;
  box-sizing: border-box;
}

/* —— 用户信息卡 —— */
.panel--user {
  padding: 14px 16px 6px;
}

.user-head {
  display: flex;
  align-items: center;
  gap: 12px;
  padding-bottom: 12px;
  border-bottom: 1px solid #f1f5f9;
}

.user-avatar {
  width: 44px;
  height: 44px;
  flex-shrink: 0;
  border-radius: 12px;
  background: linear-gradient(135deg, #2563eb, #6366f1);
  color: #fff;
  font-size: 18px;
  font-weight: 700;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 4px 14px rgba(37, 99, 235, 0.28);
}

.user-head__text {
  min-width: 0;
  text-align: left;
}

.user-head__tag {
  display: block;
  font-size: 10px;
  font-weight: 600;
  color: var(--c-accent);
  text-transform: uppercase;
  letter-spacing: 0.06em;
}

.user-head__name {
  margin: 2px 0 0;
  font-size: 16px;
  font-weight: 700;
  line-height: 1.25;
  word-break: break-all;
}

.user-head__uid {
  margin: 2px 0 0;
  font-size: 10px;
  color: #94a3b8;
  font-family: ui-monospace, monospace;
  word-break: break-all;
}

.info-list {
  margin: 0;
  padding: 0;
}

.info-row {
  display: grid;
  grid-template-columns: 88px 1fr;
  gap: 8px;
  align-items: start;
  padding: 10px 0;
  border-bottom: 1px solid #f1f5f9;
}

.info-row:last-child {
  border-bottom: none;
  padding-bottom: 8px;
}

.info-row dt {
  margin: 0;
  font-size: 12px;
  color: var(--c-muted);
  display: flex;
  align-items: center;
  gap: 4px;
  line-height: 1.35;
}

.info-row dt iconify-icon {
  font-size: 15px;
  color: var(--c-accent);
  flex-shrink: 0;
}

.info-row dd {
  margin: 0;
  font-size: 13px;
  font-weight: 600;
  color: var(--c-text);
  line-height: 1.4;
  word-break: break-word;
  text-align: left;
}

/* —— 二维码卡 —— */
.panel--qr {
  padding: 16px;
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
}

.qr-copy h3 {
  margin: 0;
  font-size: 14px;
  font-weight: 700;
  line-height: 1.3;
}

.qr-copy p {
  margin: 4px 0 0;
  font-size: 11px;
  color: var(--c-muted);
  line-height: 1.45;
  max-width: 240px;
}

.qr-display {
  margin-top: 12px;
  width: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.qr-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 148px;
  width: 100%;
  font-size: 12px;
  color: var(--c-muted);
  gap: 8px;
}

.qr-state__spin {
  font-size: 28px;
  color: #3b82f6;
  animation: spin 0.9s linear infinite;
}

.qr-state__ok {
  font-size: 48px;
  color: #22c55e;
}

.qr-state__muted {
  font-size: 40px;
  color: #cbd5e1;
}

.qr-state__err {
  font-size: 40px;
  color: #fca5a5;
}

.qr-state__title {
  margin: 0;
  font-size: 14px;
  font-weight: 600;
  color: var(--c-text);
}

.qr-state__hint,
.qr-state__err-msg {
  margin: 0;
  text-align: center;
  line-height: 1.45;
}

.qr-state__err-msg {
  color: #ef4444;
  font-size: 12px;
}

.qr-container {
  position: relative;
  overflow: hidden;
  border-radius: 12px;
  border: 2px solid #e2e8f0;
  box-shadow: 0 4px 12px -4px rgba(59, 130, 246, 0.15);
  line-height: 0;
}

.share-qr-img {
  width: 132px;
  height: 132px;
  object-fit: contain;
  border-radius: 10px;
  display: block;
  background: #fff;
}

.qr-countdown {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-top: 10px;
  font-size: 11px;
  color: var(--c-muted);
}

.qr-countdown__sec {
  font-family: ui-monospace, monospace;
  font-weight: 600;
  color: #475569;
}

.qr-countdown__sec--warn {
  color: #ef4444;
}

.qr-retry-btn {
  margin-top: 4px;
  padding: 8px 18px;
  font-size: 12px;
  font-weight: 700;
  color: #fff;
  border: none;
  border-radius: 10px;
  cursor: pointer;
}

.btn-gradient {
  background: linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%);
  transition: all 0.3s ease;
}

.btn-gradient:hover {
  opacity: 0.9;
  transform: scale(1.02);
  box-shadow: 0 10px 15px -3px rgba(59, 130, 246, 0.3);
}

.qr-foot {
  margin: 10px 0 0;
  font-size: 11px;
  color: #94a3b8;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 4px;
}

.qr-foot iconify-icon {
  font-size: 14px;
}

/* —— Web 端（≥768px）—— */
@media (min-width: 768px) {
  .page-header__inner {
    height: 56px;
    justify-content: flex-start;
  }

  .page-main {
    padding: 20px 24px 32px;
  }

  .page-intro {
    margin-bottom: 20px;
  }

  .page-title {
    font-size: 1.5rem;
  }

  .page-subtitle {
    font-size: 13px;
  }

  .share-layout {
    flex-direction: row;
    align-items: stretch;
    gap: 20px;
    max-width: 720px;
  }

  .panel--user {
    flex: 1;
    min-width: 0;
    padding: 20px 22px 10px;
  }

  .panel--qr {
    flex: 0 0 240px;
    padding: 20px 16px;
    justify-content: center;
  }

  .user-avatar {
    width: 52px;
    height: 52px;
    font-size: 22px;
    border-radius: 14px;
  }

  .user-head__name {
    font-size: 18px;
  }

  .info-row {
    grid-template-columns: 96px 1fr;
    padding: 12px 0;
  }

  .info-row dt {
    font-size: 13px;
  }

  .info-row dd {
    font-size: 14px;
  }

  .share-qr-img {
    width: 148px;
    height: 148px;
  }

  .qr-state {
    min-height: 168px;
  }

  .qr-copy h3 {
    font-size: 15px;
  }

  .qr-copy p {
    font-size: 12px;
    max-width: none;
  }
}

/* —— 大屏 Web 微调 —— */
@media (min-width: 1024px) {
  .share-layout {
    max-width: 800px;
    gap: 24px;
  }

  .panel--qr {
    flex-basis: 260px;
  }
}

/* —— 背景装饰 —— */
.bg-blob {
  position: fixed;
  width: 420px;
  height: 420px;
  border-radius: 50%;
  z-index: 0;
  filter: blur(64px);
  pointer-events: none;
  background: radial-gradient(
    circle,
    rgba(59, 130, 246, 0.1) 0%,
    rgba(139, 92, 246, 0.05) 50%,
    transparent 100%
  );
}

.blob-1 {
  top: -80px;
  right: -60px;
}

.blob-2 {
  bottom: -80px;
  left: -60px;
}

.page-header,
.page-main {
  position: relative;
  z-index: 1;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}
</style>
