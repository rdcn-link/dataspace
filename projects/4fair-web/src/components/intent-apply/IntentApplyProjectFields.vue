<template>
  <div
    class="intent-apply-project"
    :class="variant === 'h5' ? 'intent-apply-project--h5' : 'intent-apply-project--pc'"
  >
    <h4 class="intent-apply-project__heading">支撑项目/课题研究</h4>

    <div class="intent-apply-project__grid">
      <div class="intent-apply-project__field">
        <label class="intent-apply-project__label">
          项目类型 <span class="intent-apply-project__required">*</span>
        </label>
        <select
          v-model="model.projectType"
          class="intent-apply-project__input intent-apply-project__select"
        >
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
      <div class="intent-apply-project__field">
        <label class="intent-apply-project__label">
          项目/课题名称 <span class="intent-apply-project__required">*</span>
        </label>
        <input
          v-model="model.projectTopicName"
          type="text"
          class="intent-apply-project__input"
          placeholder="请输入项目/课题名称"
        />
      </div>
    </div>

    <div class="intent-apply-project__field intent-apply-project__field--full">
      <label class="intent-apply-project__label">
        项目/课题研究内容 <span class="intent-apply-project__required">*</span>
      </label>
      <textarea
        v-model="model.projectResearchContent"
        class="intent-apply-project__textarea"
        rows="4"
        placeholder="请填写项目/课题研究内容"
      ></textarea>
    </div>

    <div class="intent-apply-project__field intent-apply-project__field--full">
      <label class="intent-apply-project__label">
        预期成果及完成时间 <span class="intent-apply-project__required">*</span>
      </label>
      <textarea
        v-model="model.expectedResultsAndCompletionTime"
        class="intent-apply-project__textarea"
        rows="4"
        placeholder="请填写数据在研究应用中的作用、预期成果及完成时间。"
      ></textarea>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { IntentApplyProjectForm } from '@/constants/intentApplyProjectForm'
import { INTENT_APPLY_PROJECT_TYPES } from '@/constants/intentApplyProjectForm'

withDefaults(
  defineProps<{
    variant?: 'pc' | 'h5'
  }>(),
  { variant: 'pc' }
)

const model = defineModel<IntentApplyProjectForm>({ required: true })

const projectTypes = INTENT_APPLY_PROJECT_TYPES
</script>

<style scoped>
.intent-apply-project {
  padding: 16px;
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
}

.intent-apply-project--h5 {
  padding: 14px;
  border-radius: 10px;
}

.intent-apply-project__heading {
  margin: 0 0 14px;
  font-size: 0.9375rem;
  font-weight: 700;
  color: #0f172a;
}

.intent-apply-project__grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px 14px;
}

.intent-apply-project--h5 .intent-apply-project__grid {
  grid-template-columns: 1fr;
  gap: 12px;
}

.intent-apply-project__field--full {
  margin-top: 12px;
}

.intent-apply-project__label {
  display: block;
  margin-bottom: 6px;
  font-size: 0.8125rem;
  font-weight: 600;
  line-height: 1.4;
  color: #334155;
}

.intent-apply-project--h5 .intent-apply-project__label {
  font-size: 0.875rem;
}

.intent-apply-project__required {
  color: #ef4444;
}

.intent-apply-project__input,
.intent-apply-project__textarea,
.intent-apply-project__select {
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

.intent-apply-project__select {
  appearance: none;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%2364748b' stroke-width='2'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E");
  background-repeat: no-repeat;
  background-position: right 12px center;
  padding-right: 36px;
}

.intent-apply-project__input:focus,
.intent-apply-project__textarea:focus,
.intent-apply-project__select:focus {
  border-color: #3b82f6;
  box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.15);
}

.intent-apply-project__textarea {
  resize: vertical;
  min-height: 96px;
  line-height: 1.5;
}

.intent-apply-project__input::placeholder,
.intent-apply-project__textarea::placeholder {
  color: #94a3b8;
}
</style>
