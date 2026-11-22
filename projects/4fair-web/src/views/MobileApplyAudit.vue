<template>
  <div class="m-apply-page">
    <header class="m-apply-header">
      <h1>审批</h1>
    </header>

    <div v-if="loading" class="m-apply-state">
      <p>正在加载…</p>
    </div>

    <div v-else-if="error" class="m-apply-state m-apply-state--error">
      <p>{{ error }}</p>
    </div>

    <template v-else-if="record">
      <section class="m-apply-detail">
        <div class="m-apply-row">
          <span class="m-apply-label">数据集名称</span>
          <span class="m-apply-value">{{ record.dataSetTitle || '—' }}</span>
        </div>
        <div class="m-apply-row">
          <span class="m-apply-label">数据集ID</span>
          <span class="m-apply-value">{{ record.dataSetId || '—' }}</span>
        </div>
        <div class="m-apply-row">
          <span class="m-apply-label">数据来源</span>
          <span class="m-apply-value">{{ record.dataSetSource || '—' }}</span>
        </div>
        <div class="m-apply-row">
          <span class="m-apply-label">申请人</span>
          <span class="m-apply-value">{{ record.username || '—' }}</span>
        </div>
        <div class="m-apply-row">
          <span class="m-apply-label">研究项目</span>
          <span class="m-apply-value">{{ record.researchProject || '—' }}</span>
        </div>
        <div class="m-apply-row">
          <span class="m-apply-label">使用说明</span>
          <span class="m-apply-value">{{ record.instructions || '—' }}</span>
        </div>
        <div class="m-apply-row">
          <span class="m-apply-label">使用承诺</span>
          <span class="m-apply-value">{{ record.commitment || '—' }}</span>
        </div>
        <div class="m-apply-row">
          <span class="m-apply-label">开始时间</span>
          <span class="m-apply-value">{{ record.startTime || '—' }}</span>
        </div>
        <div class="m-apply-row">
          <span class="m-apply-label">结束时间</span>
          <span class="m-apply-value">{{ record.endTime || '—' }}</span>
        </div>
        <div class="m-apply-row">
          <span class="m-apply-label">创建时间</span>
          <span class="m-apply-value">{{ record.applyTime }}</span>
        </div>

      </section>

      <section class="m-apply-audit">
        <h2>审批操作</h2>
        <div class="m-audit-form__row">
          <span class="m-audit-form__label">审批状态</span>
          <div class="m-audit-form__radios">
            <label class="m-audit-radio">
              <input type="radio" value="approved" v-model="auditStatus" />
              <span>通过</span>
            </label>
            <label class="m-audit-radio">
              <input type="radio" value="rejected" v-model="auditStatus" />
              <span>拒绝</span>
            </label>
          </div>
        </div>
        <div class="m-audit-form__row">
          <span class="m-audit-form__label">审批意见</span>
          <textarea
            v-model="auditOpinion"
            class="m-audit-form__textarea"
            maxlength="500"
            rows="4"
            placeholder="请输入审批意见（不超过500字）"
          ></textarea>
        </div>
        <button
          type="button"
          class="m-audit-submit"
          :disabled="submitting"
          @click="submitAudit"
        >
          {{ submitting ? '提交中…' : '提交' }}
        </button>
      </section>
    </template>

    <Transition name="m-toast">
      <div v-if="toast" class="m-apply-toast">{{ toast }}</div>
    </Transition>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useRoute } from 'vue-router'
import {
  fetchDatasetAuditList,
  auditDatasetApply,
  type DatasetApplyRecord
} from '@/utils/userCenterApi'

const route = useRoute()

const loading = ref(true)
const error = ref('')
const record = ref<DatasetApplyRecord | null>(null)

const auditStatus = ref<'approved' | 'rejected'>('approved')
const auditOpinion = ref('')
const submitting = ref(false)
const toast = ref('')

async function loadRecord() {
  const applyId = String(route.query.applyId || '').trim()
  const uid = String(route.query.uid || '').trim()

  if (!applyId || !uid) {
    loading.value = false
    error.value = '缺少申请参数'
    return
  }

  try {
    const res = await fetchDatasetAuditList(uid, 1, 100)
    const found = res.rows.find((r) => r.id === applyId)
    if (!found) {
      error.value = '未找到该申请记录'
    } else {
      record.value = found
    }
  } catch (e: unknown) {
    error.value = e instanceof Error ? e.message : '加载失败'
  } finally {
    loading.value = false
  }
}

async function submitAudit() {
  if (!record.value) return
  const uid = String(route.query.uid || '').trim()
  if (!uid) {
    error.value = '缺少用户参数'
    return
  }

  submitting.value = true
  error.value = ''
  try {
    await auditDatasetApply({
      applyId: record.value.id,
      uid,
      reason: auditOpinion.value,
      status: auditStatus.value === 'approved' ? 1 : 2
    })
    toast.value = '审批成功'
    setTimeout(() => {
      window.location.href = 'https://fairspace.cn'
    }, 1000)
  } catch (e: unknown) {
    error.value = e instanceof Error ? e.message : '审批失败'
  } finally {
    submitting.value = false
  }
}

onMounted(() => {
  loadRecord()
})
</script>

<style scoped>
.m-apply-page {
  min-height: 100vh;
  background: #f8fafc;
  padding-bottom: 2rem;
}

.m-apply-header {
  position: sticky;
  top: 0;
  z-index: 10;
  background: #fff;
  border-bottom: 1px solid #e2e8f0;
  padding: 1rem 1.25rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
}

.m-apply-header h1 {
  font-size: 1.125rem;
  font-weight: 700;
  color: #0f172a;
  margin: 0;
}

.m-apply-state {
  padding: 3rem 1.25rem;
  text-align: center;
  color: #64748b;
  font-size: 0.9375rem;
}

.m-apply-state--error {
  color: #ef4444;
}

.m-apply-detail {
  background: #fff;
  margin: 0.75rem 0.75rem 0;
  border-radius: 0.75rem;
  overflow: hidden;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.06);
}

.m-apply-row {
  padding: 0.75rem 1rem;
  border-bottom: 1px solid #f1f5f9;
}

.m-apply-row:last-child {
  border-bottom: none;
}

.m-apply-label {
  display: block;
  font-size: 0.8125rem;
  font-weight: 600;
  color: #1e293b;
  margin-bottom: 0.35rem;
  padding-left: 0.5rem;
  border-left: 3px solid #6366f1;
  line-height: 1.4;
}

.m-apply-value {
  display: block;
  font-size: 0.875rem;
  color: #334155;
  line-height: 1.6;
  word-break: break-all;
  padding-left: 0.625rem;
}


.m-apply-audit {
  background: #fff;
  margin: 0.75rem;
  border-radius: 0.75rem;
  padding: 1rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.06);
}

.m-apply-audit h2 {
  font-size: 1rem;
  font-weight: 700;
  color: #0f172a;
  margin: 0 0 0.75rem;
  padding-bottom: 0.5rem;
  border-bottom: 1px solid #f1f5f9;
}

.m-audit-form__row {
  margin-bottom: 0.85rem;
}

.m-audit-form__label {
  display: block;
  font-size: 0.8125rem;
  font-weight: 600;
  color: #1e293b;
  margin-bottom: 0.4rem;
}

.m-audit-form__radios {
  display: flex;
  gap: 1.5rem;
}

.m-audit-radio {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  cursor: pointer;
  font-size: 0.875rem;
  color: #334155;
}

.m-audit-radio input[type='radio'] {
  width: 1.1rem;
  height: 1.1rem;
  cursor: pointer;
}

.m-audit-form__textarea {
  width: 100%;
  font-size: 0.875rem;
  color: #334155;
  border: 1px solid #e2e8f0;
  border-radius: 0.5rem;
  padding: 0.6rem 0.75rem;
  resize: vertical;
  outline: none;
  transition: border-color 0.15s;
  font-family: inherit;
  box-sizing: border-box;
}

.m-audit-form__textarea:focus {
  border-color: #6366f1;
}

.m-audit-submit {
  width: 100%;
  font-size: 0.9375rem;
  font-weight: 600;
  color: #fff;
  background: #6366f1;
  border: none;
  border-radius: 0.5rem;
  padding: 0.7rem;
  cursor: pointer;
  transition: background 0.15s;
  margin-top: 0.5rem;
}

.m-audit-submit:hover:not(:disabled) {
  background: #4f46e5;
}

.m-audit-submit:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.m-apply-toast {
  position: fixed;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  background: rgba(15, 23, 42, 0.9);
  color: #fff;
  font-size: 0.9375rem;
  padding: 0.75rem 1.5rem;
  border-radius: 0.5rem;
  z-index: 100;
  white-space: nowrap;
}

.m-toast-enter-active,
.m-toast-leave-active {
  transition: opacity 0.25s;
}

.m-toast-enter-from,
.m-toast-leave-to {
  opacity: 0;
}
</style>
