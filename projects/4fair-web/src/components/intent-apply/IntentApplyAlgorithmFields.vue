<template>
  <div
    class="intent-apply-algorithm"
    :class="variant === 'h5' ? 'intent-apply-algorithm--h5' : 'intent-apply-algorithm--pc'"
  >
    <h4 class="intent-apply-algorithm__heading">算法模型</h4>

    <div class="intent-apply-algorithm__field intent-apply-algorithm__field--full">
      <label class="intent-apply-algorithm__label">
        使用目的 <span class="intent-apply-algorithm__required">*</span>
      </label>
      <textarea
        v-model="model.usagePurpose"
        class="intent-apply-algorithm__textarea"
        rows="5"
        :placeholder="usagePurposePlaceholder"
      ></textarea>
    </div>

    <div class="intent-apply-algorithm__field intent-apply-algorithm__field--full">
      <label class="intent-apply-algorithm__label">
        预期成果及完成时间 <span class="intent-apply-algorithm__required">*</span>
      </label>
      <textarea
        v-model="model.expectedResultsAndCompletionTime"
        class="intent-apply-algorithm__textarea"
        rows="4"
        placeholder="请填写数据在研究应用中的作用、预期成果及完成时间。"
      ></textarea>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { IntentApplyAlgorithmForm } from '@/constants/intentApplyAlgorithmForm'
import { INTENT_APPLY_ALGORITHM_USAGE_PURPOSE_PLACEHOLDER } from '@/constants/intentApplyAlgorithmForm'

withDefaults(
  defineProps<{
    variant?: 'pc' | 'h5'
  }>(),
  { variant: 'pc' }
)

const model = defineModel<IntentApplyAlgorithmForm>({ required: true })

const usagePurposePlaceholder = INTENT_APPLY_ALGORITHM_USAGE_PURPOSE_PLACEHOLDER
</script>

<style scoped>
.intent-apply-algorithm {
  padding: 16px;
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
}

.intent-apply-algorithm--h5 {
  padding: 14px;
  border-radius: 10px;
}

.intent-apply-algorithm__heading {
  margin: 0 0 14px;
  font-size: 0.9375rem;
  font-weight: 700;
  color: #0f172a;
}

.intent-apply-algorithm__field--full + .intent-apply-algorithm__field--full {
  margin-top: 12px;
}

.intent-apply-algorithm__label {
  display: block;
  margin-bottom: 6px;
  font-size: 0.8125rem;
  font-weight: 600;
  line-height: 1.4;
  color: #334155;
}

.intent-apply-algorithm--h5 .intent-apply-algorithm__label {
  font-size: 0.875rem;
}

.intent-apply-algorithm__required {
  color: #ef4444;
}

.intent-apply-algorithm__textarea {
  width: 100%;
  box-sizing: border-box;
  padding: 10px 12px;
  font-size: 0.875rem;
  line-height: 1.5;
  color: #0f172a;
  background: #fff;
  border: 1px solid #cbd5e1;
  border-radius: 8px;
  outline: none;
  resize: vertical;
  min-height: 120px;
}

.intent-apply-algorithm__textarea:focus {
  border-color: #3b82f6;
  box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.15);
}

.intent-apply-algorithm__textarea::placeholder {
  color: #94a3b8;
}
</style>
