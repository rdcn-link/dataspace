<template>
  <div class="wechat-h5-page bg-gradient-to-br from-green-50 to-emerald-50 min-h-screen">
    <main class="max-w-md mx-auto px-6 py-10">
      <div class="bg-white rounded-2xl shadow-lg overflow-hidden">

        <!-- Logo -->
        <div class="p-8 text-center bg-gradient-to-r from-green-500 to-emerald-500">
          <iconify-icon class="text-6xl text-white" icon="mdi:wechat"></iconify-icon>
          <h1 class="text-2xl font-bold text-white mt-4">费尔空间</h1>
          <p class="text-white/80 text-sm mt-2">科研数据协作平台</p>
        </div>

        <!-- 内容区 -->
        <div class="p-8 space-y-6">
          <div class="text-center">
            <p class="text-slate-600 mb-4">请使用微信扫码登录</p>
            <!-- 二维码区域 -->
            <div class="w-48 h-48 mx-auto bg-slate-100 rounded-xl flex items-center justify-center relative overflow-hidden">
              <!-- 加载 -->
              <div v-if="status === 'loading'" class="absolute inset-0 flex items-center justify-center">
                <iconify-icon class="text-3xl text-green-500 animate-spin" icon="mdi:loading"></iconify-icon>
              </div>
              <!-- 二维码 -->
              <img
                v-else-if="status === 'waiting'"
                :src="qrCodeUrl"
                class="w-full h-full object-cover rounded-xl"
              />
              <!-- 成功 -->
              <div v-else-if="status === 'confirmed'" class="absolute inset-0 bg-white/80 flex items-center justify-center rounded-xl">
                <div class="text-center">
                  <iconify-icon class="text-4xl text-green-500" icon="mdi:check-circle-outline"></iconify-icon>
                  <p class="text-xs text-slate-600 mt-1">登录成功</p>
                </div>
              </div>
              <!-- 过期/错误 -->
              <div v-else-if="status === 'expired' || status === 'error'" class="absolute inset-0 bg-white/80 flex items-center justify-center rounded-xl">
                <div class="text-center">
                  <iconify-icon class="text-4xl text-slate-300" icon="mdi:qrcode-scan"></iconify-icon>
                  <p class="text-xs text-red-500 mt-1">{{ status === 'expired' ? '二维码已过期' : '加载失败' }}</p>
                </div>
              </div>
            </div>

            <!-- 倒计时 -->
            <p v-if="status === 'waiting'" class="text-xs text-slate-400 mt-2">
              有效期 {{ remainingSeconds }}s
            </p>

            <!-- 重试/刷新 -->
            <button
              v-if="status === 'expired' || status === 'error'"
              @click="refresh"
              class="mt-3 text-sm text-green-600 underline hover:text-green-700"
            >
              重新获取二维码
            </button>
          </div>

          <div class="space-y-3">
            <div class="flex items-center gap-3 text-sm text-slate-600">
              <iconify-icon class="text-green-500" icon="mdi:check-circle"></iconify-icon>
              <span>安全可靠的身份认证</span>
            </div>
            <div class="flex items-center gap-3 text-sm text-slate-600">
              <iconify-icon class="text-green-500" icon="mdi:check-circle"></iconify-icon>
              <span>实时消息推送通知</span>
            </div>
            <div class="flex items-center gap-3 text-sm text-slate-600">
              <iconify-icon class="text-green-500" icon="mdi:check-circle"></iconify-icon>
              <span>便捷的移动端体验</span>
            </div>
          </div>
        </div>
      </div>

      <p class="text-center text-xs text-slate-400 mt-6">
        &copy; 2026 费尔空间·可信科学数据空间|qbliu@cnic.cn|京ICP备2021012700号-4
      </p>
    </main>
  </div>
</template>

<script setup lang="ts">
import { onMounted } from 'vue'
import { useWechatLogin } from '@/composables/useWechatLogin'

const {
  qrCodeUrl,
  status,
  remainingSeconds,
  fetchQRCode,
  refresh
} = useWechatLogin()

onMounted(() => {
  fetchQRCode()
})
</script>

<style scoped>
.wechat-h5-page {  }

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

.animate-spin {
  animation: spin 1s linear infinite;
}
</style>
