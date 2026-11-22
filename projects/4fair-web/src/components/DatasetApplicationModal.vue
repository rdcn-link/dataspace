<template>
  <div v-if="modelValue" class="dataset-app-overlay" @click.self="close">
    <div
      class="dataset-app-modal"
      role="dialog"
      aria-modal="true"
      aria-labelledby="dataset-app-title"
      @click.stop
    >
      <button type="button" class="dataset-app-modal__close" aria-label="关闭" @click="close">
        <iconify-icon icon="mdi:close" />
      </button>

      <div class="dataset-app-modal__header">
        <div>
          <h2 id="dataset-app-title" class="dataset-app-modal__title">数据集申请使用信息表</h2>
          <p class="dataset-app-modal__subtitle">数据集使用申请 · 请如实填写以下信息</p>
        </div>
        <div class="dataset-app-modal__logo">数</div>
      </div>

      <div class="dataset-app-modal__content">
        <form class="dataset-app-form" novalidate @submit.prevent="handleSubmit">
          <!-- 1. 申请人信息 -->
          <section class="dataset-app-section">
            <h3 class="dataset-app-section__title">
              <span class="dataset-app-section__step">1</span>
              申请人信息
            </h3>

            <div class="applicant-card">
              <div class="applicant-avatar">{{ applicantInitial }}</div>
              <div class="applicant-info">
                <div class="applicant-info__name">{{ applicant.name || '—' }}</div>
                <div class="applicant-info__meta">

                  <span v-if="applicant.email">邮箱：{{ applicant.email }}</span>
                  <span v-if="applicant.phone">电话：{{ applicant.phone }}</span>
                  <span v-if="applicant.orgName">单位：{{ applicant.orgName }}</span>
                </div>
              </div>
            </div>
          </section>

          <!-- 2. 申请数据集信息 -->
          <section class="dataset-app-section">
            <h3 class="dataset-app-section__title">
              <span class="dataset-app-section__step">2</span>
              申请数据集信息
            </h3>

            <div v-if="dataset" class="dataset-card">
              <div class="dataset-card__header">
                <div class="dataset-card__title">{{ dataset.title }}</div>
                <div class="dataset-card__tags">
                  <span class="tag tag--open">{{ dataset.level || '—' }}</span>
                  <span v-if="dataset.subject" class="tag tag--domain">{{ dataset.subject }}</span>
                </div>
              </div>
              <div class="dataset-card__body">
                <div class="dataset-meta">

                  <span class="dataset-meta__label">发布机构</span>
                  <span class="dataset-meta__value">{{ dataset.source || '—' }}</span>
                </div>
                <div class="dataset-meta">
                  <span class="dataset-meta__label">数据大小</span>
                  <span class="dataset-meta__value">{{ dataset.dataSize || '—' }}</span>
                </div>
                <div class="dataset-meta">
                  <span class="dataset-meta__label">文件数量</span>
                  <span class="dataset-meta__value">{{ fileNumberLabel }}</span>
                </div>
                <div class="dataset-meta">
                  <span class="dataset-meta__label">数据集更新时间</span>
                  <span class="dataset-meta__value">{{ dataset.updatedAt || '—' }}</span>
                </div>
              </div>
            </div>

            <div class="form-grid">
              <div class="form-item form-item--full">
                <label>数据使用时间范围 <span class="required">*</span></label>
                <div class="quick-range">
                  <button type="button" class="quick-range-btn" @click="applyQuickRange(1)">1个月</button>
                  <button type="button" class="quick-range-btn" @click="applyQuickRange(3)">3个月</button>
                  <button type="button" class="quick-range-btn" @click="applyQuickRange(6)">6个月</button>
                  <button type="button" class="quick-range-btn" @click="applyQuickRange(12)">1年</button>
                </div>
              </div>
              <div class="form-item">
                <label>开始日期 <span class="required">*</span></label>
                <input v-model="form.startDate" type="date" required />
                <p v-if="fieldErrors.startDate" class="field-error">{{ fieldErrors.startDate }}</p>
              </div>
              <div class="form-item">
                <label>结束日期 <span class="required">*</span></label>
                <input v-model="form.endDate" type="date" required />
                <p v-if="fieldErrors.endDate" class="field-error">{{ fieldErrors.endDate }}</p>
              </div>
            </div>
          </section>

          <!-- 3. 使用目的与承诺 -->
          <section class="dataset-app-section">
            <h3 class="dataset-app-section__title">
              <span class="dataset-app-section__step">3</span>
              使用目的与承诺
            </h3>

            <div class="form-grid">
              <div class="form-item form-item--full">
                <label>研究项目 <span class="required">*</span></label>
                <textarea
                  v-model="form.researchProject"
                  placeholder="请简要描述研究项目的背景、目标及主要内容"
                  rows="4"
                />
                <p v-if="fieldErrors.researchProject" class="field-error">{{ fieldErrors.researchProject }}</p>
              </div>
              <div class="form-item form-item--full">
                <label>数据使用说明 <span class="required">*</span></label>
                <textarea
                  v-model="form.dataUsage"
                  placeholder="请详细说明本数据集在研究中的具体用途、分析方法及预期成果"
                  rows="4"
                />
                <p v-if="fieldErrors.dataUsage" class="field-error">{{ fieldErrors.dataUsage }}</p>
              </div>
              <div class="form-item form-item--full">
                <label>使用承诺 <span class="required">*</span></label>
                <div class="checkbox-group">
                  <label v-for="item in promiseOptions" :key="item.id" class="checkbox-item">
                    <input v-model="form.promises[item.id]" type="checkbox" />
                    <span>{{ item.label }}</span>
                  </label>
                </div>
                <p v-if="fieldErrors.promises" class="field-error">{{ fieldErrors.promises }}</p>
              </div>
            </div>
          </section>

          <!-- 4. 其他材料 -->
          <section class="dataset-app-section">
            <h3 class="dataset-app-section__title">
              <span class="dataset-app-section__step">4</span>
              其他材料
            </h3>

            <div class="form-grid">
              <div class="form-item form-item--full">
                <label>补充说明</label>
                <textarea
                  v-model="form.notes"
                  placeholder="如有其他需要说明的事项，请在此填写"
                  rows="3"
                />
              </div>
            </div>
          </section>

          <p v-if="errorMessage" class="submit-error">
            <iconify-icon icon="mdi:alert-circle-outline" />
            {{ errorMessage }}
          </p>

          <div class="dataset-app-actions">
            <button type="button" class="btn btn-secondary" :disabled="submitting" @click="close">
              取消
            </button>
            <button type="submit" class="btn btn-primary" :disabled="submitting">
              <iconify-icon v-if="submitting" class="animate-spin" icon="mdi:loading" />
              {{ submitting ? '提交中…' : '提交申请' }}
            </button>
          </div>

          <p class="footer-note">
            提交即表示您已阅读并同意《数据集使用协议》及上述使用承诺 · 申请结果将通过微信服务号或邮件通知
          </p>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, reactive, ref, watch } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { submitDatasetApply } from '@/utils/intentApplySubmit'

import { resolveApplicantUidFromUser } from '@/utils/resolveApplicantUid'

export type DatasetApplicationTarget = {
  id?: string
  cstr: string
  title: string
  level?: string
  subject?: string
  source?: string
  dataSize?: string
  fileNumber?: number | string
  updatedAt?: string
}

export type DatasetApplicationApplicant = {
  name?: string
  email?: string
  phone?: string
  orgName?: string
}

const promiseOptions = [
  { id: 'p1', label: '承诺所申请数据仅用于本表所填研究目的，不用于商业用途' },
  { id: 'p2', label: '承诺不将数据转发、出售或提供给第三方使用' },
  { id: 'p3', label: '承诺在公开发表成果中规范标注数据来源' },
  { id: 'p4', label: '承诺遵守国家相关法律法规及数据中心的数据使用协议' },
  { id: 'p5', label: '承诺对数据安全负责，采取必要措施防止数据泄露' }
] as const

type PromiseId = (typeof promiseOptions)[number]['id']

const props = defineProps<{
  modelValue: boolean
  dataset: DatasetApplicationTarget | null
  applicant?: DatasetApplicationApplicant | null
  uid?: string
}>()

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  submitted: []
}>()

const authStore = useAuthStore()

const form = reactive({
  startDate: '',
  endDate: '',
  researchProject: '',
  dataUsage: '',
  notes: '',
  promises: {
    p1: true,
    p2: true,
    p3: true,
    p4: true,
    p5: true
  } as Record<PromiseId, boolean>
})

const fieldErrors = reactive({
  startDate: '',
  endDate: '',
  researchProject: '',
  dataUsage: '',
  promises: ''
})

const submitting = ref(false)
const errorMessage = ref('')

const applicant = computed(() => ({
  name: String(props.applicant?.name || '').trim(),
  email: String(props.applicant?.email || '').trim(),
  phone: String(props.applicant?.phone || '').trim(),
  orgName: String(props.applicant?.orgName || '').trim()
}))


const applicantInitial = computed(() => {
  const name = applicant.value.name
  return name ? name.slice(0, 1) : '用'
})

const fileNumberLabel = computed(() => {
  const n = props.dataset?.fileNumber
  if (n === undefined || n === null || n === '') return '—'
  const num = Number(n)
  if (Number.isFinite(num)) return `${num} 个文件`
  return String(n)
})

watch(
  () => props.modelValue,
  (open) => {
    if (!open) return
    errorMessage.value = ''
    form.startDate = ''
    form.endDate = ''
    form.researchProject = ''
    form.dataUsage = ''
    form.notes = ''
    promiseOptions.forEach((item) => {
      form.promises[item.id] = true
    })
    Object.keys(fieldErrors).forEach((key) => {
      fieldErrors[key as keyof typeof fieldErrors] = ''
    })
  }
)

function close() {
  if (submitting.value) return
  emit('update:modelValue', false)
}

function formatDateInput(d: Date): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

function applyQuickRange(months: number) {
  const today = new Date()
  const end = new Date(today)
  end.setMonth(end.getMonth() + months)
  form.startDate = formatDateInput(today)
  form.endDate = formatDateInput(end)
  fieldErrors.startDate = ''
  fieldErrors.endDate = ''
}


function validateForm(): boolean {
  fieldErrors.startDate = ''
  fieldErrors.endDate = ''
  fieldErrors.researchProject = ''
  fieldErrors.dataUsage = ''
  fieldErrors.promises = ''

  if (!form.startDate) fieldErrors.startDate = '请选择开始日期'
  if (!form.endDate) fieldErrors.endDate = '请选择结束日期'
  if (form.startDate && form.endDate && form.endDate < form.startDate) {
    fieldErrors.endDate = '结束日期不能早于开始日期'
  }
  if (!form.researchProject.trim()) fieldErrors.researchProject = '请填写研究项目'
  if (!form.dataUsage.trim()) fieldErrors.dataUsage = '请填写数据使用说明'
  const allPromisesChecked = promiseOptions.every((item) => form.promises[item.id])
  if (!allPromisesChecked) fieldErrors.promises = '请勾选全部使用承诺'

  return !Object.values(fieldErrors).some(Boolean)
}

function resolveSubmitUid(): string {
  const fromProp = String(props.uid || '').trim()
  if (fromProp) return fromProp
  authStore.syncFromStorage()
  return resolveApplicantUidFromUser(authStore.user)
}

async function handleSubmit() {
  errorMessage.value = ''
  if (!validateForm()) return

  const dataset = props.dataset
  const dataSetId = String(dataset?.id || '').trim()
  if (!dataSetId) {
    errorMessage.value = '缺少数据集标识，请关闭后重试'
    return
  }


  const uid = resolveSubmitUid()
  const openId = String(authStore.user?.openId || '').trim()

  if (!uid || !openId) {
    errorMessage.value = '登录状态已失效，请重新登录后再试'
    return
  }

  const promiseText = promiseOptions
    .filter((item) => form.promises[item.id])
    .map((item) => item.label)
    .join('；')

  const instructionsParts = [form.dataUsage.trim()]
  if (form.notes.trim()) instructionsParts.push(`补充说明：${form.notes.trim()}`)


  const updatedAtRaw = String(dataset?.updatedAt || '').trim()
  const updatedAtDate = updatedAtRaw ? new Date(updatedAtRaw) : new Date()
  const dataSetUpdateTime = Number.isNaN(updatedAtDate.getTime())
    ? new Date().toISOString()
    : updatedAtDate.toISOString()

  submitting.value = true
  try {

    const json = await submitDatasetApply({
      uid,
      dataSetId,
      dataSetUpdateTime,
      researchProject: form.researchProject.trim(),
      instructions: instructionsParts.join('\n'),
      commitment: promiseText,
      startTime: form.startDate,
      endTime: form.endDate
    })

    if (json.code !== 200) {
      throw new Error(json.message || json.msg || '提交申请失败')
    }

    emit('update:modelValue', false)
    emit('submitted')
    window.alert('申请已提交，结果将通过微信服务号或邮件通知')
  } catch (e: unknown) {
    errorMessage.value = e instanceof Error ? e.message : '提交失败，请稍后重试'
  } finally {
    submitting.value = false
  }
}
</script>

<style scoped>
.dataset-app-overlay {
  position: fixed;
  inset: 0;
  z-index: 130;
  display: flex;
  align-items: flex-start;
  justify-content: center;
  padding: 1rem;
  overflow-y: auto;
  background: rgba(15, 23, 42, 0.45);
  backdrop-filter: blur(4px);
}

.dataset-app-modal {
  position: relative;
  width: min(100%, 68rem);
  margin: 1rem auto 2rem;
  background: #fff;
  border-radius: 12px;
  box-shadow: 0 24px 60px rgba(15, 23, 42, 0.18);
  overflow: hidden;
}

.dataset-app-modal__close {
  position: absolute;
  top: 0.85rem;
  right: 0.85rem;
  z-index: 2;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 2rem;
  height: 2rem;
  border: none;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.2);
  color: #fff;
  cursor: pointer;
}

.dataset-app-modal__close:hover {
  background: rgba(255, 255, 255, 0.32);
}

.dataset-app-modal__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  padding: 1.75rem 2.5rem;
  background: linear-gradient(135deg, #1a5490 0%, #2d7dd2 100%);
  color: #fff;
}

.dataset-app-modal__title {
  margin: 0;
  font-size: 1.5rem;
  font-weight: 600;
  letter-spacing: 0.02em;
}

.dataset-app-modal__subtitle {
  margin: 0.35rem 0 0;
  font-size: 0.8125rem;
  opacity: 0.85;
}

.dataset-app-modal__logo {
  width: 3.5rem;
  height: 3.5rem;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.15);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.5rem;
  font-weight: 700;
  flex-shrink: 0;
  backdrop-filter: blur(10px);
}

.dataset-app-modal__content {
  padding: 2rem 2.5rem 1.5rem;
}

.dataset-app-section {
  margin-bottom: 2rem;
}

.dataset-app-section__title {
  display: flex;
  align-items: center;
  gap: 0.65rem;
  margin: 0 0 1.25rem;
  padding-bottom: 0.75rem;
  border-bottom: 2px solid #e8edf3;
  font-size: 1.0625rem;
  font-weight: 600;
  color: #1a5490;
}

.dataset-app-section__title::before {
  content: '';
  display: inline-block;
  width: 4px;
  height: 1.125rem;
  background: #2d7dd2;
  border-radius: 2px;
}

.dataset-app-section__step {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 1.375rem;
  height: 1.375rem;
  border-radius: 50%;
  background: #2d7dd2;
  color: #fff;
  font-size: 0.75rem;
  font-weight: 500;
}

.applicant-card {
  display: flex;
  align-items: center;
  gap: 1.25rem;
  padding: 1.25rem 1.5rem;
  background: #f7f9fc;
  border: 1px solid #e8edf3;
  border-radius: 8px;
}

.applicant-avatar {
  width: 4rem;
  height: 4rem;
  border-radius: 50%;
  background: linear-gradient(135deg, #2d7dd2, #1a5490);
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.625rem;
  font-weight: 700;
  flex-shrink: 0;
}

.applicant-info__name {
  font-size: 1.0625rem;
  font-weight: 600;
  color: #1a5490;
  margin-bottom: 0.25rem;
}

.applicant-info__meta {
  display: flex;
  flex-wrap: wrap;
  gap: 1rem;
  font-size: 0.8125rem;
  color: #6b7280;
}

.dataset-card {
  border: 1px solid #e8edf3;
  border-radius: 8px;
  overflow: hidden;
  margin-bottom: 1.25rem;
  background: #fff;
}

.dataset-card__header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 1rem;
  padding: 1rem 1.5rem;
  background: linear-gradient(135deg, #f0f7ff 0%, #e8f3fe 100%);
  border-bottom: 1px solid #e8edf3;
}

.dataset-card__title {
  font-size: 0.9375rem;
  font-weight: 600;
  color: #1a5490;
  line-height: 1.5;
}

.dataset-card__tags {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  flex-shrink: 0;
}

.tag {
  font-size: 0.75rem;
  padding: 0.2rem 0.65rem;
  border-radius: 999px;
  font-weight: 500;
}

.tag--open {
  background: #e6f7ed;
  color: #2e9e5b;
}

.tag--domain {
  background: #e8f3fe;
  color: #1a5490;
}

.dataset-card__body {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 1rem;
  padding: 1.125rem 1.5rem;
}

.dataset-meta__label {
  display: block;
  font-size: 0.75rem;
  color: #9ca3af;
  margin-bottom: 0.25rem;
}

.dataset-meta__value {
  font-size: 0.8125rem;
  color: #2c3e50;
  font-weight: 500;
}

.quick-range {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  margin-bottom: 0.75rem;
}

.quick-range-btn {
  padding: 0.3rem 0.85rem;
  border: 1px solid #cbd5e1;
  border-radius: 999px;
  background: #f8fafc;
  color: #4a5568;
  font-size: 0.8125rem;
  cursor: pointer;
  transition: all 0.15s ease;
}

.quick-range-btn:hover {
  border-color: #2d7dd2;
  color: #2d7dd2;
  background: #eff6ff;
}

.form-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1.25rem 1.75rem;
}

.form-item {
  display: flex;
  flex-direction: column;
}

.form-item--full {
  grid-column: 1 / -1;
}

.form-item label {
  font-size: 0.875rem;
  color: #4a5568;
  margin-bottom: 0.5rem;
  font-weight: 500;
}

.required {
  color: #e53e3e;
  margin-left: 0.15rem;
}

.form-item input,
.form-item textarea {
  padding: 0.625rem 0.875rem;
  border: 1px solid #d8dee9;
  border-radius: 6px;
  font-size: 0.875rem;
  color: #2c3e50;
  background: #fff;
  font-family: inherit;
  transition: border-color 0.2s, box-shadow 0.2s;
}

.form-item textarea {
  resize: vertical;
  min-height: 5.5rem;
}

.form-item input:focus,
.form-item textarea:focus {
  outline: none;
  border-color: #2d7dd2;
  box-shadow: 0 0 0 3px rgba(45, 125, 210, 0.12);
}

.checkbox-group {
  display: flex;
  flex-direction: column;
  gap: 0.65rem;
}

.checkbox-item {
  display: flex;
  align-items: flex-start;
  gap: 0.5rem;
  font-size: 0.8125rem;
  color: #4a5568;
  font-weight: normal;
  cursor: pointer;
}

.checkbox-item input {
  accent-color: #2d7dd2;
  margin-top: 0.2rem;
}

.field-error,
.submit-error {
  margin: 0.35rem 0 0;
  font-size: 0.75rem;
  color: #dc2626;
}

.submit-error {
  display: flex;
  align-items: center;
  gap: 0.35rem;
  font-size: 0.8125rem;
  margin-bottom: 0.5rem;
}

.dataset-app-actions {
  display: flex;
  justify-content: center;
  gap: 1rem;
  margin-top: 2rem;
  padding-top: 1.75rem;
  border-top: 1px solid #e8edf3;
}

.btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.35rem;
  padding: 0.7rem 2.25rem;
  border: none;
  border-radius: 6px;
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  font-family: inherit;
  transition: transform 0.2s, box-shadow 0.2s, background 0.2s;
}

.btn:disabled {
  opacity: 0.72;
  cursor: not-allowed;
}

.btn-primary {
  background: linear-gradient(135deg, #1a5490 0%, #2d7dd2 100%);
  color: #fff;
  box-shadow: 0 4px 12px rgba(45, 125, 210, 0.3);
}

.btn-primary:hover:not(:disabled) {
  transform: translateY(-1px);
  box-shadow: 0 6px 16px rgba(45, 125, 210, 0.4);
}

.btn-secondary {
  background: #f7f9fc;
  color: #4a5568;
  border: 1px solid #d8dee9;
}

.btn-secondary:hover:not(:disabled) {
  background: #eef2f7;
}

.footer-note {
  margin: 1.25rem 0 0;
  text-align: center;
  font-size: 0.75rem;
  color: #9ca3af;
  line-height: 1.55;
}

.animate-spin {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

@media (max-width: 768px) {
  .dataset-app-modal__header,
  .dataset-app-modal__content {
    padding-left: 1.25rem;
    padding-right: 1.25rem;
  }

  .form-grid {
    grid-template-columns: 1fr;
  }

  .dataset-card__body {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .dataset-card__header {
    flex-direction: column;
  }

  .dataset-app-actions {
    flex-direction: column-reverse;
  }

  .btn {
    width: 100%;
  }
}
</style>
