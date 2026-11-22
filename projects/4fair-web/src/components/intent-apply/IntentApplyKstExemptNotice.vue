<template>
  <div
    class="intent-apply-kst-notice"
    :class="variant === 'h5' ? 'intent-apply-kst-notice--h5' : 'intent-apply-kst-notice--pc'"
    role="status"
  >
    <iconify-icon icon="mdi:check-circle" class="intent-apply-kst-notice__icon"></iconify-icon>
    <p class="intent-apply-kst-notice__text">{{ message }}</p>
  </div>
</template>

<script setup lang="ts">
import { INTENT_APPLY_KST_EXEMPT_MESSAGE } from '@/constants/intentApplyScenarios'

withDefaults(
  defineProps<{
    variant?: 'pc' | 'h5'
    message?: string
  }>(),
  {
    variant: 'pc',
    message: INTENT_APPLY_KST_EXEMPT_MESSAGE
  }
)
</script>

<style scoped>
.intent-apply-kst-notice {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  padding: 12px 14px;
  background: #ecfdf5;
  border: 1px solid #a7f3d0;
  border-radius: 10px;
}

.intent-apply-kst-notice--h5 {
  border-radius: 8px;
}

.intent-apply-kst-notice__icon {
  flex-shrink: 0;
  margin-top: 1px;
  font-size: 1.25rem;
  color: #059669;
}

.intent-apply-kst-notice__text {
  margin: 0;
  font-size: 0.875rem;
  line-height: 1.5;
  color: #065f46;
}

.intent-apply-kst-notice--h5 .intent-apply-kst-notice__text {
  font-size: 0.8125rem;
}
</style>
