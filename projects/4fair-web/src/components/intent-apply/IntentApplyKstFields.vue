<template>
  <div
    class="intent-apply-kst"
    :class="variant === 'h5' ? 'intent-apply-kst--h5' : 'intent-apply-kst--pc'"
  >
    <h4 class="intent-apply-kst__heading">快数通</h4>

    <div class="intent-apply-kst__grid">
      <div class="intent-apply-kst__field">
        <label class="intent-apply-kst__label">
          项目类型 <span class="intent-apply-kst__required">*</span>
        </label>
        <select v-model="model.projectType" class="intent-apply-kst__input intent-apply-kst__select">
          <option value="" disabled>请选择</option>
          <option
            v-for="item in projectTypes"
            :key="item.value"
            :value="item.value"
          >
            {{ item.label }}
          </option>
        </select>
      </div>
      <div class="intent-apply-kst__field">
        <label class="intent-apply-kst__label">
          项目编号 <span class="intent-apply-kst__required">*</span>
        </label>
        <input
          v-model="model.projectNumber"
          type="text"
          class="intent-apply-kst__input"
          placeholder="请输入项目编号"
        />
      </div>
      <div class="intent-apply-kst__field">
        <label class="intent-apply-kst__label">
          项目名称 <span class="intent-apply-kst__required">*</span>
        </label>
        <input
          v-model="model.projectName"
          type="text"
          class="intent-apply-kst__input"
          placeholder="请输入项目名称"
        />
      </div>
      <div class="intent-apply-kst__field">
        <label class="intent-apply-kst__label">
          专项名称 <span class="intent-apply-kst__required">*</span>
        </label>
        <input
          v-model="model.specialProjectName"
          type="text"
          class="intent-apply-kst__input"
          placeholder="请输入专项名称"
        />
      </div>
    </div>

    <div class="intent-apply-kst__field intent-apply-kst__field--full">
      <label class="intent-apply-kst__label">
        该项目是否在国家基础数据中心进行数据汇交
        <span class="intent-apply-kst__required">*</span>
      </label>
      <select
        v-model="model.dataSubmissionAtNbdc"
        class="intent-apply-kst__input intent-apply-kst__select"
      >
        <option value="" disabled>请选择</option>
        <option
          v-for="item in dataSubmissionOptions"
          :key="item.value"
          :value="item.value"
        >
          {{ item.label }}
        </option>
      </select>
    </div>

    <div class="intent-apply-kst__field intent-apply-kst__field--full">
      <label class="intent-apply-kst__label">
        预期成果及完成时间 <span class="intent-apply-kst__required">*</span>
      </label>
      <textarea
        v-model="model.expectedResultsAndCompletionTime"
        class="intent-apply-kst__textarea"
        rows="4"
        placeholder="请填写数据在研究应用中的作用、预期成果及完成时间。"
      ></textarea>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { IntentApplyKstForm } from '@/constants/intentApplyKstForm'
import {
  INTENT_APPLY_KST_DATA_SUBMISSION_OPTIONS,
  INTENT_APPLY_KST_PROJECT_TYPES
} from '@/constants/intentApplyKstForm'

withDefaults(
  defineProps<{
    variant?: 'pc' | 'h5'
  }>(),
  { variant: 'pc' }
)

const model = defineModel<IntentApplyKstForm>({ required: true })

const projectTypes = INTENT_APPLY_KST_PROJECT_TYPES
const dataSubmissionOptions = INTENT_APPLY_KST_DATA_SUBMISSION_OPTIONS
</script>

<style scoped>
.intent-apply-kst {
  padding: 16px;
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
}

.intent-apply-kst--h5 {
  padding: 14px;
  border-radius: 10px;
}

.intent-apply-kst__heading {
  margin: 0 0 14px;
  font-size: 0.9375rem;
  font-weight: 700;
  color: #0f172a;
}

.intent-apply-kst__grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px 14px;
}

.intent-apply-kst--h5 .intent-apply-kst__grid {
  grid-template-columns: 1fr;
  gap: 12px;
}

.intent-apply-kst__field--full {
  margin-top: 12px;
}

.intent-apply-kst__label {
  display: block;
  margin-bottom: 6px;
  font-size: 0.8125rem;
  font-weight: 600;
  line-height: 1.4;
  color: #334155;
}

.intent-apply-kst--h5 .intent-apply-kst__label {
  font-size: 0.875rem;
}

.intent-apply-kst__required {
  color: #ef4444;
}

.intent-apply-kst__input,
.intent-apply-kst__textarea,
.intent-apply-kst__select {
  width: 100%;
  box-sizing: border-box;
  padding: 10px 12px;
  font-size: 0.875rem;
  color: #0f172a;
  background: #fff;
  border: 1px solid #cbd5e1;
  border-radius: 8px;
  outline: none;
}

.intent-apply-kst__select {
  appearance: none;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%2364748b' stroke-width='2'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E");
  background-repeat: no-repeat;
  background-position: right 12px center;
  padding-right: 36px;
}

.intent-apply-kst__input:focus,
.intent-apply-kst__textarea:focus,
.intent-apply-kst__select:focus {
  border-color: #3b82f6;
  box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.15);
}

.intent-apply-kst__textarea {
  resize: vertical;
  min-height: 96px;
  line-height: 1.5;
}

.intent-apply-kst__input::placeholder,
.intent-apply-kst__textarea::placeholder {
  color: #94a3b8;
}
</style>
