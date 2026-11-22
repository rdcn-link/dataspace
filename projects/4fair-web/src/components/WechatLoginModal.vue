<template>
  <div
    v-if="modelValue"
    class="login-modal-overlay"
    @click="closeLoginModal"
  >
    <div
      class="login-modal relative mx-4 flex w-full max-w-3xl overflow-hidden rounded-2xl bg-white shadow-2xl"
      @click.stop
    >
      <button
        type="button"
        aria-label="关闭"
        class="absolute right-4 top-4 z-10 flex h-8 w-8 items-center justify-center rounded-full transition-colors hover:bg-slate-100"
        @click="closeLoginModal"
      >
        <iconify-icon class="text-slate-400" icon="mdi:close"></iconify-icon>
      </button>

      <div class="flex w-1/2 flex-col items-center justify-center p-8">
        <div v-if="qrStatus === 'loading'" class="flex h-64 w-64 flex-col items-center justify-center">
          <iconify-icon class="animate-spin text-4xl text-blue-500" icon="mdi:loading"></iconify-icon>
          <p class="mt-4 text-sm text-slate-500">正在获取二维码...</p>
        </div>

        <div v-else-if="qrStatus === 'waiting'" class="flex flex-col items-center">
          <div class="qr-container rounded-xl border-2 border-slate-200 shadow-lg">
            <img
              alt="微信登录二维码"
              class="h-64 w-64 rounded-xl object-contain"
              :src="qrCodeUrl"
            />
          </div>
          <div class="mt-4 flex items-center gap-2">
            <span class="text-sm text-slate-400">二维码有效期</span>
            <span
              class="font-mono text-sm text-slate-600"
              :class="{ 'text-red-500': remainingSeconds < 30 }"
            >
              {{ remainingSeconds }}s
            </span>
          </div>
        </div>

        <div v-else-if="qrStatus === 'confirmed'" class="flex h-64 w-64 flex-col items-center justify-center">
          <iconify-icon class="mb-4 text-7xl text-green-500" icon="mdi:check-circle-outline"></iconify-icon>
          <p class="text-lg font-medium text-slate-800">登录成功</p>
          <p class="mt-1 text-sm text-slate-400">即将关闭...</p>
        </div>

        <div v-else-if="qrStatus === 'expired'" class="flex h-64 w-64 flex-col items-center justify-center">
          <iconify-icon class="mb-4 text-6xl text-slate-300" icon="mdi:qrcode-scan"></iconify-icon>
          <p class="mb-4 text-sm text-slate-500">二维码已过期</p>
          <button
            type="button"
            class="btn-gradient rounded-xl px-6 py-2 text-sm font-bold text-white transition-all hover:scale-105 active:scale-95"
            @click="refreshQR"
          >
            重新获取
          </button>
        </div>

        <div v-else-if="qrStatus === 'error'" class="flex h-64 w-64 flex-col items-center justify-center">
          <iconify-icon class="mb-4 text-6xl text-red-300" icon="mdi:alert-circle-outline"></iconify-icon>
          <p class="mb-1 text-center text-sm text-red-500">{{ qrErrorMessage }}</p>
          <button
            type="button"
            class="btn-gradient mt-2 rounded-xl px-6 py-2 text-sm font-bold text-white transition-all hover:scale-105 active:scale-95"
            @click="refreshQR"
          >
            重试
          </button>
        </div>

        <p class="mt-6 text-center font-medium text-slate-700">请使用微信扫码完成登录/注册</p>
      </div>

      <div class="flex w-1/2 flex-col justify-between p-8">
        <div>
          <div class="mb-8 flex items-center space-x-2">
            <BrandLogo size="lg" />
            <span class="text-xl font-bold text-slate-900">费尔空间</span>
          </div>

          <h2 class="mb-2 text-2xl font-bold">微信扫码登录</h2>
          <p class="mb-8 text-sm text-slate-500">使用微信扫一扫完成登录</p>

          <ul class="mb-8 space-y-4 text-sm text-slate-500">
            <li class="flex items-center gap-3">
              <iconify-icon class="text-xl text-blue-600" icon="mdi:account-plus-outline"></iconify-icon>
              <span>首次扫码将引导完成实名注册</span>
            </li>
            <li class="flex items-center gap-3">
              <iconify-icon class="text-xl text-blue-600" icon="mdi:bell-outline"></iconify-icon>
              <span>审批、消息通知将通过微信实时推送</span>
            </li>
          </ul>
        </div>

        <div class="border-t border-slate-100 pt-6">
          <p class="mb-3 text-xs text-slate-400">
            登录即表示同意费尔空间相关的
            <router-link class="text-blue-600 hover:underline" to="/auth/agreement">《服务协议》</router-link>
            和
            <router-link class="text-blue-600 hover:underline" to="/auth/agreement">《隐私政策》</router-link>
          </p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { watch } from 'vue'
import { useWechatLogin } from '@/composables/useWechatLogin'
import BrandLogo from '@/components/BrandLogo.vue'

const props = defineProps<{
  modelValue: boolean
  redirectPath?: string
}>()

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  success: []
}>()

const {
  qrCodeUrl,
  status: qrStatus,
  errorMessage: qrErrorMessage,
  remainingSeconds,
  fetchQRCode,
  refresh: refreshQR,
  cleanup: cleanupQR
} = useWechatLogin({
  redirectPath: () => props.redirectPath ?? '/',
  onSuccess: () => {
    emit('success')
    emit('update:modelValue', false)
  }
})

function closeLoginModal() {
  if (qrStatus.value === 'loading' || qrStatus.value === 'confirmed') return
  emit('update:modelValue', false)
}

watch(
  () => props.modelValue,
  (open) => {
    if (open) {
      fetchQRCode()
    } else {
      cleanupQR()
    }
  }
)
</script>

<style scoped>
.login-modal-overlay {
  display: flex;
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  backdrop-filter: blur(4px);
  z-index: 100;
  align-items: center;
  justify-content: center;
}

.login-modal {
  animation: modalSlideIn 0.3s ease-out;
}

@keyframes modalSlideIn {
  from {
    opacity: 0;
    transform: scale(0.95) translateY(-10px);
  }
  to {
    opacity: 1;
    transform: scale(1) translateY(0);
  }
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

.btn-gradient:hover {
  box-shadow: 0 6px 20px rgba(59, 130, 246, 0.4);
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
