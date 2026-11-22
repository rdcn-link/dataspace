<template>
  <div class="m-apply-page">
    <header class="m-apply-header">
      <h1>申请详情</h1>
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
        <div class="m-apply-row">
          <span class="m-apply-label">状态</span>
          <span class="m-apply-value">
            <span class="m-apply-status" :class="`m-apply-status--${record.status.key}`">{{ record.status.label }}</span>
          </span>
        </div>
        <div class="m-apply-row">
          <span class="m-apply-label">审批意见</span>
          <span class="m-apply-value">{{ record.auditOpinion || '—' }}</span>
        </div>
      </section>

      <button type="button" class="m-home-btn" @click="goHome">进入首页</button>
    </template>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useRoute } from 'vue-router'
import { fetchDatasetAuditList, type DatasetApplyRecord } from '@/utils/userCenterApi'

const route = useRoute()

const loading = ref(true)
const error = ref('')
const record = ref<DatasetApplyRecord | null>(null)

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

function goHome() {
  window.location.href = 'https://fairspace.cn'
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

.m-apply-status {
  display: inline-block;
  font-size: 0.75rem;
  font-weight: 600;
  padding: 0.15rem 0.55rem;
  border-radius: 999px;
  white-space: nowrap;
}

.m-apply-status--approved {
  background: #dcfce7;
  color: #166534;
}

.m-apply-status--rejected {
  background: #fee2e2;
  color: #991b1b;
}

.m-apply-status--pending {
  background: #fef9c3;
  color: #854d0e;
}

.m-apply-status--unknown {
  background: #f1f5f9;
  color: #64748b;
}

.m-home-btn {
  display: block;
  width: calc(100% - 1.5rem);
  margin: 1rem 0.75rem 0;
  font-size: 0.9375rem;
  font-weight: 600;
  color: #fff;
  background: #6366f1;
  border: none;
  border-radius: 0.5rem;
  padding: 0.75rem;
  cursor: pointer;
  transition: background 0.15s;
}

.m-home-btn:hover {
  background: #4f46e5;
}
</style>
