<template>
  <div
    class="intent-apply-competition"
    :class="variant === 'h5' ? 'intent-apply-competition--h5' : 'intent-apply-competition--pc'"
  >
    <h4 class="intent-apply-competition__heading">参加比赛</h4>

    <div class="intent-apply-competition__field intent-apply-competition__field--full">
      <label class="intent-apply-competition__label">
        使用目的 <span class="intent-apply-competition__required">*</span>
      </label>
      <textarea
        v-model="model.usagePurpose"
        class="intent-apply-competition__textarea"
        rows="4"
        placeholder="请简要介绍赛事信息及数据应用方向"
      ></textarea>
    </div>

    <div class="intent-apply-competition__field intent-apply-competition__field--full">
      <label class="intent-apply-competition__label">
        预期成果及完成时间 <span class="intent-apply-competition__required">*</span>
      </label>
      <textarea
        v-model="model.expectedResultsAndCompletionTime"
        class="intent-apply-competition__textarea"
        rows="4"
        placeholder="请填写预期成果及赛事成绩公布时间。"
      ></textarea>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { IntentApplyCompetitionForm } from '@/constants/intentApplyCompetitionForm'

withDefaults(
  defineProps<{
    variant?: 'pc' | 'h5'
  }>(),
  { variant: 'pc' }
)

const model = defineModel<IntentApplyCompetitionForm>({ required: true })
</script>

<style scoped>
.intent-apply-competition {
  padding: 16px;
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
}

.intent-apply-competition--h5 {
  padding: 14px;
  border-radius: 10px;
}

.intent-apply-competition__heading {
  margin: 0 0 14px;
  font-size: 0.9375rem;
  font-weight: 700;
  color: #0f172a;
}

.intent-apply-competition__field--full + .intent-apply-competition__field--full {
  margin-top: 12px;
}

.intent-apply-competition__label {
  display: block;
  margin-bottom: 6px;
  font-size: 0.8125rem;
  font-weight: 600;
  line-height: 1.4;
  color: #334155;
}

.intent-apply-competition--h5 .intent-apply-competition__label {
  font-size: 0.875rem;
}

.intent-apply-competition__required {
  color: #ef4444;
}

.intent-apply-competition__textarea {
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
  min-height: 96px;
}

.intent-apply-competition__textarea:focus {
  border-color: #3b82f6;
  box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.15);
}

.intent-apply-competition__textarea::placeholder {
  color: #94a3b8;
}
</style>
