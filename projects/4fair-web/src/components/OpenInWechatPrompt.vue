<template>
  <div class="open-wechat-prompt" role="dialog" aria-modal="true" aria-labelledby="open-wechat-title">
    <div class="open-wechat-prompt__card">
      <div class="open-wechat-prompt__brand">
        <BrandLogo size="lg" />
        <span class="open-wechat-prompt__brand-name">费尔空间</span>
      </div>
      <iconify-icon class="open-wechat-prompt__icon" icon="mdi:wechat" aria-hidden="true"></iconify-icon>
      <h2 id="open-wechat-title" class="open-wechat-prompt__title">请在微信中打开访问链接</h2>
      <p class="open-wechat-prompt__desc">
        移动端需在微信内打开链接完成授权登录。请复制下方链接，到微信中粘贴打开。
      </p>
      <div class="open-wechat-prompt__link">{{ accessUrl }}</div>
      <button type="button" class="open-wechat-prompt__btn" @click="copyAccessUrl">
        {{ copyHint || '复制访问链接' }}
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import BrandLogo from '@/components/BrandLogo.vue'

const props = defineProps<{
  accessUrl: string
}>()

const copyHint = ref('')

async function copyAccessUrl() {
  const text = props.accessUrl
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
</script>

<style scoped>
.open-wechat-prompt {
  position: fixed;
  inset: 0;
  z-index: 9999;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1.5rem 1rem;
  background: linear-gradient(135deg, #f8fafc 0%, #eff6ff 50%, #f5f3ff 100%);
}

.open-wechat-prompt__card {
  width: min(100%, 22rem);
  background: #fff;
  border-radius: 1rem;
  box-shadow: 0 25px 50px -12px rgba(15, 23, 42, 0.18);
  padding: 1.75rem 1.25rem 1.5rem;
  text-align: center;
}

.open-wechat-prompt__brand {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  margin-bottom: 1.25rem;
}

.open-wechat-prompt__brand-name {
  font-size: 1.25rem;
  font-weight: 700;
  color: #0f172a;
}

.open-wechat-prompt__icon {
  font-size: 3rem;
  color: #22c55e;
  margin-bottom: 0.75rem;
}

.open-wechat-prompt__title {
  margin: 0 0 0.5rem;
  font-size: 1.125rem;
  font-weight: 700;
  color: #0f172a;
}

.open-wechat-prompt__desc {
  margin: 0 0 1.25rem;
  font-size: 0.875rem;
  line-height: 1.6;
  color: #64748b;
}

.open-wechat-prompt__link {
  margin-bottom: 1rem;
  padding: 0.75rem 0.85rem;
  border-radius: 0.75rem;
  background: #f1f5f9;
  color: #334155;
  font-size: 0.75rem;
  line-height: 1.5;
  word-break: break-all;
  text-align: left;
}

.open-wechat-prompt__btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 10rem;
  padding: 0.65rem 1.5rem;
  border: none;
  border-radius: 0.75rem;
  background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%);
  color: #fff;
  font-size: 0.875rem;
  font-weight: 700;
  cursor: pointer;
}

.open-wechat-prompt__btn:active {
  transform: scale(0.98);
}
</style>
