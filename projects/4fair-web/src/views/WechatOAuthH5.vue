<template>
  <div class="wechat-oauth-h5 min-h-screen">
    <main class="max-w-md mx-auto px-6 py-10">
      <div class="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div class="px-6 py-8 bg-gradient-to-r from-green-500 to-emerald-600 text-center">
          <iconify-icon class="text-5xl text-white" icon="mdi:wechat"></iconify-icon>
          <h1 class="text-lg font-bold text-white mt-3">微信授权</h1>
          <p class="text-white/85 text-sm mt-1">费尔空间</p>
        </div>

        <div class="p-8 text-center space-y-4">
          <div v-if="phase === 'checking' || phase === 'redirecting' || phase === 'exchanging'">
            <iconify-icon class="text-4xl text-green-500 animate-spin" icon="mdi:loading"></iconify-icon>
            <p class="text-sm text-slate-600 mt-3">
              {{
                phase === 'redirecting'
                  ? '正在跳转微信授权…'
                  : phase === 'exchanging'
                    ? '正在处理授权结果…'
                    : '正在初始化…'
              }}
            </p>
          </div>

          <div v-else-if="phase === 'need_wechat'" class="space-y-3">
            <iconify-icon class="text-5xl text-amber-500" icon="mdi:cellphone-message"></iconify-icon>
            <p class="text-sm text-slate-700 font-medium">请在微信内打开此页面</p>
            <p class="text-xs text-slate-500 leading-relaxed">
              请使用电脑端二维码扫码进入，或复制链接到微信中打开。
            </p>
          </div>

          <div v-else-if="phase === 'success'" class="space-y-3">
            <iconify-icon class="text-5xl text-green-500" icon="mdi:check-circle-outline"></iconify-icon>
            <p class="text-sm font-semibold text-slate-800">
              {{ loginIntent ? '授权登录完成' : '授权完成' }}
            </p>
            <p class="text-xs text-slate-500">
              {{ loginIntent ? '请返回电脑端继续操作' : '授权信息已通过弹窗展示' }}
            </p>
            <button
              v-if="authCode && !showCodeModal"
              type="button"
              class="text-sm text-green-600 font-medium underline"
              @click="showCodeModal = true"
            >
              再次查看授权 code
            </button>
          </div>

          <div v-else class="space-y-3 text-left">
            <iconify-icon class="text-5xl text-red-400 mx-auto block" icon="mdi:alert-circle-outline"></iconify-icon>
            <p class="text-sm text-red-600 text-center">{{ errorMessage || '授权失败' }}</p>

            <div
              v-if="oauthDiag"
              class="rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs text-slate-700 space-y-2"
            >
              <p class="font-semibold text-amber-900">微信 10003 排查</p>
              <p>
                公众平台 →
                {{ oauthDiag.isTestAppId ? '测试号' : '公众号' }}
                → 授权回调域名，只填主机名（无 https、无路径）：
                <strong class="text-amber-900">{{ oauthDiag.redirectHost }}</strong>
              </p>
              <p class="break-all">
                <span class="text-slate-500">redirect_uri：</span>{{ oauthDiag.redirectUri }}
              </p>
              <p>
                <span class="text-slate-500">AppID：</span>{{ oauthDiag.appId }}
              </p>
              <p v-if="!oauthDiag.hostsMatch" class="text-red-600">
                当前页域名 {{ oauthDiag.pageHost }} 与回调域名不一致
              </p>
            </div>

            <div class="flex flex-col gap-2 items-center">
              <button
                v-if="pendingAuthUrl"
                type="button"
                class="text-sm text-white bg-green-600 px-4 py-2 rounded-lg font-medium"
                @click="goWechatAuthorize"
              >
                前往微信授权
              </button>
              <button type="button" class="text-sm text-green-600 font-medium" @click="retry">重试</button>
            </div>
          </div>
        </div>
      </div>
    </main>

    <!-- 授权成功：展示当前微信用户 code -->
    <Teleport to="body">
      <div
        v-if="showCodeModal && authCode"
        class="oauth-code-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="oauth-code-title"
        @click.self="closeCodeModal"
      >
        <div class="oauth-code-modal__panel">
          <div class="oauth-code-modal__head">
            <iconify-icon class="text-3xl text-green-500" icon="mdi:wechat"></iconify-icon>
            <h2 id="oauth-code-title" class="oauth-code-modal__title">微信授权成功</h2>
            <p class="oauth-code-modal__subtitle">当前微信用户的授权 code 如下</p>
          </div>

          <div class="oauth-code-modal__body">
            <p class="oauth-code-modal__label">授权 code</p>
            <p class="oauth-code-modal__code font-mono" @click="copyAuthCode">{{ authCode }}</p>
            <p class="oauth-code-modal__hint">5 分钟内有效，仅可使用一次</p>
            <p v-if="copyHint" class="oauth-code-modal__copy-hint">{{ copyHint }}</p>
            <p v-if="errorMessage" class="oauth-code-modal__warn">{{ errorMessage }}</p>
            <template v-if="openId">
              <p class="oauth-code-modal__label mt-3">openId</p>
              <p class="oauth-code-modal__code oauth-code-modal__code--sm font-mono">{{ openId }}</p>
            </template>
          </div>

          <div class="oauth-code-modal__actions">
            <button type="button" class="oauth-code-modal__btn oauth-code-modal__btn--secondary" @click="copyAuthCode">
              复制 code
            </button>
            <button type="button" class="oauth-code-modal__btn oauth-code-modal__btn--primary" @click="closeCodeModal">
              知道了
            </button>
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<script setup lang="ts">
import { useWechatOAuthH5 } from '@/composables/useWechatOAuthH5'

const {
  phase,
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
  retry
} = useWechatOAuthH5()
</script>

<style scoped>
.wechat-oauth-h5 {
  background: linear-gradient(180deg, #ecfdf5 0%, #f8fafc 40%);
}

.oauth-code-modal {
  position: fixed;
  inset: 0;
  z-index: 1000;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1.25rem;
  background: rgba(15, 23, 42, 0.55);
  backdrop-filter: blur(4px);
}

.oauth-code-modal__panel {
  width: 100%;
  max-width: 22rem;
  background: #fff;
  border-radius: 1rem;
  box-shadow: 0 20px 50px rgba(15, 23, 42, 0.2);
  overflow: hidden;
  animation: oauth-modal-in 0.28s ease-out;
}

@keyframes oauth-modal-in {
  from {
    opacity: 0;
    transform: scale(0.94) translateY(8px);
  }
  to {
    opacity: 1;
    transform: scale(1) translateY(0);
  }
}

.oauth-code-modal__head {
  padding: 1.25rem 1.25rem 0.75rem;
  text-align: center;
}

.oauth-code-modal__title {
  margin-top: 0.5rem;
  font-size: 1.125rem;
  font-weight: 700;
  color: #0f172a;
}

.oauth-code-modal__subtitle {
  margin-top: 0.25rem;
  font-size: 0.8125rem;
  color: #64748b;
}

.oauth-code-modal__body {
  padding: 0.75rem 1.25rem 1rem;
}

.oauth-code-modal__label {
  font-size: 0.75rem;
  font-weight: 600;
  color: #64748b;
}

.oauth-code-modal__code {
  margin-top: 0.375rem;
  padding: 0.75rem;
  font-size: 0.8125rem;
  line-height: 1.5;
  word-break: break-all;
  color: #0f172a;
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 0.5rem;
  user-select: all;
}

.oauth-code-modal__code--sm {
  font-size: 0.75rem;
}

.oauth-code-modal__hint {
  margin-top: 0.5rem;
  font-size: 0.75rem;
  color: #94a3b8;
}

.oauth-code-modal__copy-hint {
  margin-top: 0.375rem;
  font-size: 0.75rem;
  color: #16a34a;
}

.oauth-code-modal__warn {
  margin-top: 0.5rem;
  font-size: 0.75rem;
  color: #b45309;
}

.oauth-code-modal__actions {
  display: flex;
  gap: 0.75rem;
  padding: 0 1.25rem 1.25rem;
}

.oauth-code-modal__btn {
  flex: 1;
  padding: 0.625rem 1rem;
  font-size: 0.875rem;
  font-weight: 600;
  border-radius: 0.625rem;
  border: none;
  cursor: pointer;
}

.oauth-code-modal__btn--secondary {
  color: #334155;
  background: #f1f5f9;
}

.oauth-code-modal__btn--primary {
  color: #fff;
  background: linear-gradient(135deg, #16a34a 0%, #059669 100%);
}

@keyframes spin {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

.animate-spin {
  animation: spin 1s linear infinite;
}
</style>
