<template>
  <div class="wechat-scan-login min-h-screen">
    <div class="bg-blob blob-1"></div>
    <div class="bg-blob blob-2"></div>

    <main class="min-h-screen flex items-center justify-center p-6">
      <div
        class="bg-white rounded-2xl border border-slate-200 shadow-lg overflow-hidden max-w-3xl w-full flex flex-col md:flex-row"
      >
        <section class="md:w-1/2 p-8 flex flex-col items-center justify-center bg-slate-50/80">
          <div
            class="w-64 h-64 rounded-xl border-2 border-slate-200 bg-white flex items-center justify-center relative overflow-hidden"
          >
            <div v-if="phase === 'loading'" class="text-center text-slate-500">
              <iconify-icon class="text-4xl text-green-500 animate-spin" icon="mdi:loading"></iconify-icon>
              <p class="text-sm mt-3">正在生成二维码…</p>
            </div>

            <img
              v-else-if="phase === 'waiting' && qrDataUrl"
              :src="qrDataUrl"
              alt="微信扫码登录"
              class="w-full h-full object-contain p-2"
            />

            <div v-else-if="phase === 'success'" class="text-center px-4">
              <iconify-icon class="text-6xl text-green-500" icon="mdi:check-circle-outline"></iconify-icon>
              <p class="text-base font-medium text-slate-800 mt-3">登录成功</p>
              <p class="text-sm text-slate-500 mt-1">正在跳转…</p>
            </div>

            <div v-else class="text-center px-4">
              <iconify-icon class="text-5xl text-slate-300" icon="mdi:qrcode-remove"></iconify-icon>
              <p class="text-sm text-red-500 mt-2">
                {{ phase === 'expired' ? '二维码已过期' : errorMessage || '加载失败' }}
              </p>
              <button
                type="button"
                class="btn-gradient text-white text-sm font-bold py-2 px-5 rounded-xl mt-4"
                @click="refresh"
              >
                重新获取
              </button>
            </div>
          </div>

          <p v-if="phase === 'waiting'" class="text-sm text-slate-500 mt-4">
            有效期
            <span class="font-mono font-semibold" :class="{ 'text-red-500': remainingSeconds < 30 }">
              {{ remainingSeconds }}s
            </span>
          </p>

          <p class="text-sm font-medium text-slate-700 mt-4 text-center">
            请使用微信扫一扫完成授权登录
          </p>

          <div
            v-if="needsPublicUrl"
            class="mt-4 max-w-sm mx-auto rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-left text-xs text-amber-900 leading-relaxed"
          >
            <p class="font-semibold mb-1">手机无法打开 localhost</p>
            <p>
              请部署到服务器，或使用 cpolar / ngrok 等穿透，在 .env.development 中设置
              VITE_APP_PUBLIC_URL 为你的 HTTPS 域名后重启 npm run dev。公众号「网页授权域名」须与之一致。
            </p>
          </div>
        </section>

        <section class="md:w-1/2 p-8 flex flex-col justify-between">
          <div>
            <div class="flex items-center gap-2 mb-8">
              <div
                class="w-10 h-10 bg-gradient-to-tr from-green-500 to-emerald-600 rounded-xl flex items-center justify-center shadow-md"
              >
                <iconify-icon class="text-white text-xl" icon="mdi:wechat"></iconify-icon>
              </div>
              <span class="text-xl font-bold text-slate-900">费尔空间</span>
            </div>

            <h1 class="text-2xl font-bold text-slate-900 mb-2">微信授权登录</h1>
            <p class="text-slate-500 text-sm mb-8">
              扫码后在微信内确认授权，即可自动登录本平台
            </p>

            <ol class="text-sm text-slate-600 space-y-3 list-decimal list-inside">
              <li>打开手机微信，扫描左侧二维码</li>
              <li>在微信内打开授权页并同意授权</li>
              <li>本页将自动完成登录并跳转</li>
            </ol>
          </div>

          <div class="pt-6 mt-8 border-t border-slate-100">
            <p class="text-xs text-slate-400">
              登录即表示同意
              <router-link class="text-blue-600 hover:underline" to="/auth/agreement">服务协议</router-link>
            </p>
            <router-link class="inline-block text-sm text-slate-500 hover:text-blue-600 mt-3" to="/login">
              使用其他方式登录
            </router-link>
          </div>
        </section>
      </div>
    </main>
  </div>
</template>

<script setup lang="ts">
import { useWechatOAuthLogin } from '@/composables/useWechatOAuthLogin'

const { phase, qrDataUrl, needsPublicUrl, errorMessage, remainingSeconds, refresh } =
  useWechatOAuthLogin()
</script>

<style scoped>
.wechat-scan-login {
  position: relative;
  background: linear-gradient(135deg, #f8fafc 0%, #ecfdf5 45%, #eff6ff 100%);
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
