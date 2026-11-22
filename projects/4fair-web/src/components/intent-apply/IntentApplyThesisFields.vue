<template>
  <div
    class="intent-apply-thesis"
    :class="variant === 'h5' ? 'intent-apply-thesis--h5' : 'intent-apply-thesis--pc'"
  >
    <h4 class="intent-apply-thesis__heading">支撑学术论文/毕业论文</h4>

    <div class="intent-apply-thesis__grid">
      <div class="intent-apply-thesis__field">
        <label class="intent-apply-thesis__label">
          论文名称 <span class="intent-apply-thesis__required">*</span>
        </label>
        <input
          v-model="model.paperTitle"
          type="text"
          class="intent-apply-thesis__input"
          placeholder="请输入论文名称"
          required
        />
      </div>
      <div class="intent-apply-thesis__field">
        <label class="intent-apply-thesis__label">
          研究方向 <span class="intent-apply-thesis__required">*</span>
        </label>
        <input
          v-model="model.researchDirection"
          type="text"
          class="intent-apply-thesis__input"
          placeholder="请输入研究方向"
          required
        />
      </div>
      <div class="intent-apply-thesis__field">
        <label class="intent-apply-thesis__label">
          指导老师 <span class="intent-apply-thesis__required">*</span>
        </label>
        <input
          v-model="model.guidanceTeacher"
          type="text"
          class="intent-apply-thesis__input"
          placeholder="请输入指导老师姓名"
          required
        />
      </div>
      <div class="intent-apply-thesis__field">
        <label class="intent-apply-thesis__label">
          指导老师单位 <span class="intent-apply-thesis__required">*</span>
        </label>
        <input
          v-model="model.guidanceTeacherUnit"
          type="text"
          class="intent-apply-thesis__input"
          placeholder="请输入指导老师所在单位"
          required
        />
      </div>
    </div>

    <div class="intent-apply-thesis__field intent-apply-thesis__field--full">
      <label class="intent-apply-thesis__label">
        预期成果及完成时间 <span class="intent-apply-thesis__required">*</span>
      </label>
      <textarea
        v-model="model.expectedResultsAndCompletionTime"
        class="intent-apply-thesis__textarea"
        rows="4"
        placeholder="请填写数据在研究应用中的作用、预期成果及完成时间。"
        required
      ></textarea>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { IntentApplyThesisForm } from '@/constants/intentApplyScenarios'

withDefaults(
  defineProps<{
    variant?: 'pc' | 'h5'
  }>(),
  { variant: 'pc' }
)

const model = defineModel<IntentApplyThesisForm>({ required: true })
</script>

<style scoped>
.intent-apply-thesis {
  padding: 16px;
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
}

.intent-apply-thesis--h5 {
  padding: 14px;
  border-radius: 10px;
}

.intent-apply-thesis__heading {
  margin: 0 0 14px;
  font-size: 0.9375rem;
  font-weight: 700;
  color: #0f172a;
}

.intent-apply-thesis__grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px 14px;
}

.intent-apply-thesis--h5 .intent-apply-thesis__grid {
  grid-template-columns: 1fr;
  gap: 12px;
}

.intent-apply-thesis__field--full {
  margin-top: 12px;
}

.intent-apply-thesis__label {
  display: block;
  margin-bottom: 6px;
  font-size: 0.8125rem;
  font-weight: 600;
  color: #334155;
}

.intent-apply-thesis--h5 .intent-apply-thesis__label {
  font-size: 0.875rem;
}

.intent-apply-thesis__required {
  color: #ef4444;
}

.intent-apply-thesis__input,
.intent-apply-thesis__textarea {
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

.intent-apply-thesis__input:focus,
.intent-apply-thesis__textarea:focus {
  border-color: #3b82f6;
  box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.15);
}

.intent-apply-thesis__textarea {
  resize: vertical;
  min-height: 96px;
  line-height: 1.5;
}

.intent-apply-thesis__input::placeholder,
.intent-apply-thesis__textarea::placeholder {
  color: #94a3b8;
}
</style>
