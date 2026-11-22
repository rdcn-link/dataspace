<template>
  <div class="login-page">
    <div class="bg-blob blob-1"></div>
    <div class="bg-blob blob-2"></div>

    <div class="login-shell">
      <div class="login-content">
        <!-- 移动端非微信：引导在微信中打开 -->
        <div v-if="mode === 'open_wechat'" class="login-mobile-card">
          <div class="flex items-center justify-center gap-2 mb-6">
            <BrandLogo size="lg" />
            <span class="text-xl font-bold text-slate-900">费尔空间</span>
          </div>
          <iconify-icon class="text-5xl text-green-500 mb-3" icon="mdi:wechat"></iconify-icon>
          <h2 class="text-lg font-bold text-slate-900 mb-2">请在微信中打开访问链接</h2>
          <p class="text-sm text-slate-500 leading-relaxed mb-5">
            移动端需在微信内打开链接完成授权登录。请复制下方链接，到微信中粘贴打开。
          </p>
          <div class="login-mobile-card__link">{{ wechatAccessUrl }}</div>
          <button type="button" class="btn-gradient text-white font-bold py-2.5 px-6 rounded-xl text-sm" @click="copyAccessUrl">
            {{ copyHint || '复制访问链接' }}
          </button>
        </div>

        <!-- 移动端微信内：跳转授权中 -->
        <div v-else-if="mode === 'wechat_redirect'" class="login-mobile-card">
          <div class="flex items-center justify-center gap-2 mb-6">
            <BrandLogo size="lg" />
            <span class="text-xl font-bold text-slate-900">费尔空间</span>
          </div>
          <iconify-icon class="text-4xl text-green-500 animate-spin mb-3" icon="mdi:loading"></iconify-icon>
          <p class="text-sm text-slate-600">正在进入微信授权登录…</p>
          <p v-if="mobileError" class="text-sm text-red-500 mt-3">{{ mobileError }}</p>
          <button
            v-if="mobileError"
            type="button"
            class="btn-gradient text-white font-bold py-2 px-5 rounded-xl text-sm mt-4"
            @click="startWechatInAppLogin"
          >
            重试
          </button>
        </div>

        <!-- Web 端：微信扫码登录 -->
        <div v-else class="login-wechat bg-white rounded-2xl shadow-2xl overflow-hidden max-w-3xl w-full flex">
          <div class="w-1/2 p-8 flex flex-col items-center justify-center">
            <div v-if="status === 'loading'" class="flex flex-col items-center justify-center w-64 h-64">
              <iconify-icon class="text-4xl text-blue-500 animate-spin" icon="mdi:loading"></iconify-icon>
              <p class="text-sm text-slate-500 mt-4">正在获取二维码...</p>
            </div>

            <div v-else-if="status === 'waiting'" class="flex flex-col items-center">
              <div class="qr-container border-2 border-slate-200 rounded-xl shadow-lg">
                <img alt="微信登录二维码" class="w-64 h-64 object-contain rounded-xl" :src="qrCodeUrl" />
              </div>
              <div class="flex items-center gap-2 mt-4">
                <span class="text-sm text-slate-400">二维码有效期</span>
                <span class="text-sm font-mono text-slate-600" :class="{ 'text-red-500': remainingSeconds < 30 }">
                  {{ remainingSeconds }}s
                </span>
              </div>
            </div>

            <div v-else-if="status === 'confirmed'" class="flex flex-col items-center justify-center w-64 h-64">
              <iconify-icon class="text-7xl text-green-500 mb-4" icon="mdi:check-circle-outline"></iconify-icon>
              <p class="text-lg font-medium text-slate-800">扫码成功</p>
              <p class="text-sm text-slate-400 mt-1">正在跳转...</p>
            </div>

            <div v-else-if="status === 'expired'" class="flex flex-col items-center justify-center w-64 h-64">
              <iconify-icon class="text-6xl text-slate-300 mb-4" icon="mdi:qrcode-scan"></iconify-icon>
              <p class="text-sm text-slate-500 mb-4">二维码已过期</p>
              <button
                type="button"
                class="btn-gradient text-white font-bold py-2 px-6 rounded-xl transition-all text-sm hover:scale-105 active:scale-95"
                @click="refresh"
              >
                重新获取
              </button>
            </div>

            <div v-else-if="status === 'error'" class="flex flex-col items-center justify-center w-64 h-64">
              <iconify-icon class="text-6xl text-red-300 mb-4" icon="mdi:alert-circle-outline"></iconify-icon>
              <p class="text-sm text-red-500 mb-1 text-center">{{ errorMessage }}</p>
              <button
                type="button"
                class="btn-gradient text-white font-bold py-2 px-6 rounded-xl transition-all text-sm mt-2 hover:scale-105 active:scale-95"
                @click="refresh"
              >
                重试
              </button>
            </div>

            <p class="text-slate-700 font-medium text-center mt-6">请使用微信扫码完成登录/注册</p>
          </div>

          <div class="w-1/2 p-8 flex flex-col justify-between">
            <div>
              <div class="flex items-center space-x-2 mb-8">
                <BrandLogo size="lg" />
                <span class="text-xl font-bold text-slate-900">费尔空间</span>
              </div>

              <h2 class="text-2xl font-bold mb-2">微信扫码登录</h2>
              <p class="text-slate-500 text-sm mb-8">使用微信扫一扫完成登录</p>

              <ul class="text-sm text-slate-500 space-y-4 mb-8">
                <li class="flex items-center gap-3">
                  <iconify-icon class="text-blue-600 text-xl" icon="mdi:account-plus-outline"></iconify-icon>
                  <span>首次登录可完善手机号、邮箱与用户名称（可跳过）</span>
                </li>
                <li class="flex items-center gap-3">
                  <iconify-icon class="text-blue-600 text-xl" icon="mdi:bell-outline"></iconify-icon>
                  <span>审批、消息通知将通过微信实时推送</span>
                </li>
              </ul>
            </div>

            <div class="pt-6 border-t border-slate-100">
              <p class="text-xs text-slate-400">
                登录即表示同意费尔空间相关的
                <router-link to="/auth/agreement" class="text-blue-600 hover:underline">《服务协议》</router-link>
                和
                <router-link to="/auth/agreement" class="text-blue-600 hover:underline">《隐私政策》</router-link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRoute } from 'vue-router'
import { useWechatLogin } from '@/composables/useWechatLogin'
import BrandLogo from '@/components/BrandLogo.vue'
import { resolvePostLoginPath } from '@/utils/loginRedirect'
import {
  buildOAuthScanUrl,
  createOAuthSessionState,
  getPublicSiteOrigin,
  isMobileBrowser,
  isWeChatBrowser,
  saveLoginOAuthPending
} from '@/utils/wechatOAuth'

const route = useRoute()

type LoginMode = 'qr' | 'open_wechat' | 'wechat_redirect'

const mode = ref<LoginMode>('qr')
const wechatAccessUrl = ref('')
const copyHint = ref('')
const mobileError = ref('')

const {
  qrCodeUrl,
  status,
  errorMessage,
  remainingSeconds,
  fetchQRCode,
  refresh
} = useWechatLogin({
  redirectPath: () => resolvePostLoginPath(route.query.redirect, '/')
})

const redirectQuery = computed(() => {
  const redirect = resolvePostLoginPath(route.query.redirect, '')
  return redirect ? `?redirect=${encodeURIComponent(redirect)}` : ''
})

function buildPublicLoginUrl(): string {
  const origin = getPublicSiteOrigin() || (typeof window !== 'undefined' ? window.location.origin : '')
  return `${origin}/login${redirectQuery.value}`
}

async function copyAccessUrl() {
  const text = wechatAccessUrl.value || buildPublicLoginUrl()
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
    copyHint.value = '已复制'
    setTimeout(() => {
      copyHint.value = ''
    }, 2000)
  } catch {
    copyHint.value = '请长按链接复制'
  }
}

async function startWechatInAppLogin() {
  mode.value = 'wechat_redirect'
  mobileError.value = ''
  try {
    const { state } = await createOAuthSessionState()
    const redirect = resolvePostLoginPath(route.query.redirect, '')
    saveLoginOAuthPending(state, {
      intent: 'login',
      redirect: redirect || undefined
    })
    const url = buildOAuthScanUrl(state)
    if (!url) {
      throw new Error('无法生成微信访问链接，请稍后重试')
    }
    const u = new URL(url)
    if (redirect) u.searchParams.set('redirect', redirect)
    window.location.assign(u.toString())
  } catch (e: unknown) {
    mobileError.value = e instanceof Error ? e.message : '进入微信授权失败'
  }
}

onMounted(() => {
  if (isMobileBrowser() && !isWeChatBrowser()) {
    mode.value = 'open_wechat'
    wechatAccessUrl.value = buildPublicLoginUrl()
    return
  }
  if (isMobileBrowser() && isWeChatBrowser()) {
    void startWechatInAppLogin()
    return
  }
  mode.value = 'qr'
  void fetchQRCode()
})
</script>

<style scoped>
.login-page {
  background: linear-gradient(135deg, #f8fafc 0%, #eff6ff 50%, #f5f3ff 100%);
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  overflow: hidden;
  padding: 2rem 1rem;
}

.login-shell {
  width: min(100%, 56rem);
  display: flex;
  flex-direction: column;
  align-items: center;
}

.login-content {
  width: min(100%, 48rem);
}

.login-wechat {
  width: 100%;
}

.login-mobile-card {
  width: min(100%, 24rem);
  margin: 0 auto;
  padding: 2rem 1.5rem;
  border-radius: 1.25rem;
  background: #fff;
  border: 1px solid #e2e8f0;
  box-shadow: 0 16px 40px rgba(30, 64, 175, 0.08);
  text-align: center;
}

.login-mobile-card__link {
  margin: 0 0 1rem;
  padding: 0.75rem 0.85rem;
  border-radius: 0.65rem;
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  color: #334155;
  font-size: 0.75rem;
  line-height: 1.5;
  word-break: break-all;
  text-align: left;
}

.bg-blob {
  position: fixed;
  width: 500px;
  height: 500px;
  background: radial-gradient(circle, rgba(59, 130, 246, 0.08) 0%, rgba(139, 92, 246, 0.05) 50%, rgba(255, 255, 255, 0) 100%);
  border-radius: 50%;
  z-index: -1;
  filter: blur(60px);
  pointer-events: none;
}

.blob-1 {
  top: -100px;
  right: -100px;
  animation: float 20s infinite alternate;
}

.blob-2 {
  bottom: -100px;
  left: -100px;
  animation: float 25s infinite alternate-reverse;
}

@keyframes float {
  0% { transform: translate(0, 0); }
  100% { transform: translate(50px, 100px); }
}

.qr-container {
  position: relative;
  overflow: hidden;
  border-radius: 0.75rem;
}

.btn-gradient {
  background: linear-gradient(135deg, #3b82f6 0%, #6366f1 100%);
  box-shadow: 0 4px 15px rgba(59, 130, 246, 0.3);
}

.animate-spin {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

@media (max-width: 900px) {
  .login-wechat {
    flex-direction: column;
    max-width: 34rem;
  }

  .login-wechat .w-1\/2 {
    width: 100%;
  }
}
</style>
