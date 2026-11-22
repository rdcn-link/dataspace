<template>
  <div class="ats-panel">
    <div class="panel-head">
      <div>
        <h2>数据集在线分析统计</h2>

      </div>
      <button type="button" class="panel-head__btn" :disabled="loading" @click="reload">
        <iconify-icon :icon="loading ? 'mdi:loading' : 'mdi:refresh'" :class="{ 'animate-spin': loading }" />
        刷新
      </button>
    </div>

    <div class="ats-filters">
      <label class="ats-field">
        <span>数据中心</span>
        <select v-model="centerId" @change="onFilterChange">
          <option v-for="c in centers" :key="c.id" :value="c.id">{{ c.name }}</option>
        </select>
      </label>
      <label class="ats-field">

        <span>开始日期</span>
        <input v-model="startDate" type="date" :max="endDate" @change="onDateChange" />
      </label>
      <label class="ats-field">
        <span>结束日期</span>
        <input v-model="endDate" type="date" :min="startDate" :max="todayStr" @change="onDateChange" />
      </label>
    </div>

    <div v-if="loading && !bundle" class="panel-state">
      <iconify-icon icon="mdi:loading" class="animate-spin text-2xl" />
      <p>正在加载统计数据…</p>
    </div>

    <div v-else-if="error" class="panel-state panel-state--error">
      <p>{{ error }}</p>
      <button type="button" class="panel-head__btn" @click="reload">重新加载</button>
    </div>

    <template v-else-if="bundle">
      <div class="ats-kpis">
        <div class="ats-kpi ats-kpi--blue">
          <iconify-icon icon="mdi:toolbox-outline" class="ats-kpi__icon" />
          <div>
            <p class="ats-kpi__value font-num tabular-nums">{{ bundle.toolCount }}</p>
            <p class="ats-kpi__label">接入分析工具</p>
          </div>
        </div>
        <div class="ats-kpi ats-kpi--cyan">
          <iconify-icon icon="mdi:chart-timeline-variant" class="ats-kpi__icon" />
          <div>
            <p class="ats-kpi__value font-num tabular-nums">{{ formatNum(bundle.totalCalls) }}</p>
            <p class="ats-kpi__label">在线分析次数</p>
          </div>
        </div>

        <div class="ats-kpi ats-kpi--amber">
          <iconify-icon icon="mdi:calendar-month-outline" class="ats-kpi__icon" />
          <div>
            <p class="ats-kpi__value ats-kpi__value--sm">{{ bundle.updatedAt || '—' }}</p>
            <p class="ats-kpi__label">统计更新日期</p>
          </div>
        </div>
      </div>

      <p v-if="!bundle.recordsApiOk" class="ats-hint">
        汇总来自空间枢纽统计；调用明细接口尚未就绪时，下方图表与列表可能为空。
      </p>

      <div class="ats-charts">
        <section class="ats-card">
          <header class="ats-card__head">
            <h3>调用次数时间趋势</h3>
            <span>折线图 · 次数</span>
          </header>
          <div v-if="!trendHasData" class="ats-empty">暂无趋势数据</div>
          <div v-else class="ats-line">
            <div class="ats-line__y" aria-hidden="true">
              <span v-for="tick in trendYTicks" :key="tick">{{ tick }}</span>
            </div>
            <div class="ats-line__plot">
              <svg viewBox="0 0 100 56" preserveAspectRatio="none" class="ats-line__svg">
                <polyline
                  v-for="(g, gi) in trendGridYs"
                  :key="`g-${gi}`"
                  class="ats-line__grid"
                  :points="`0,${g} 100,${g}`"
                />
                <polyline class="ats-line__area" :points="trendAreaPoints" />
                <polyline class="ats-line__path" :points="trendLinePoints" />
              </svg>
              <div class="ats-line__dots">
                <span
                  v-for="(p, i) in bundle.trend"
                  :key="p.date"
                  class="ats-line__dot"
                  :style="{ left: `${trendX(i)}%`, bottom: `${trendY(p.count)}%` }"
                  :title="`${p.date}：${p.count} 次`"
                />
              </div>
              <div class="ats-line__x">
                <span
                  v-for="p in trendXLabels"
                  :key="`x-${p.date}`"
                  :style="{ left: `${trendX(p.index)}%` }"
                >{{ p.label }}</span>
              </div>
            </div>
          </div>
        </section>

        <section class="ats-card">
          <header class="ats-card__head">
            <h3>各工具调用占比</h3>
            <span>饼图 · 比例</span>
          </header>
          <div v-if="!pieSlices.length" class="ats-empty">暂无占比数据</div>
          <div v-else class="ats-pie">
            <div class="ats-pie__chart" :style="{ background: pieGradient }" />
            <ul class="ats-pie__legend">
              <li v-for="slice in pieSlices.slice(0, 6)" :key="slice.id">
                <i :style="{ background: slice.color }" />
                <span class="ats-pie__name" :title="slice.name">{{ slice.name }}</span>
                <strong class="font-num">{{ slice.pct }}%</strong>
              </li>
            </ul>
          </div>
        </section>

        <section class="ats-card">
          <header class="ats-card__head">
            <h3>分析工具调用排行</h3>
            <span>Top {{ bundle.toolRank.length || 0 }}</span>
          </header>
          <div v-if="!bundle.toolRank.length" class="ats-empty">暂无排行数据</div>
          <ol v-else class="ats-rank">
            <li v-for="(item, idx) in bundle.toolRank" :key="item.id">
              <span class="ats-rank__idx" :class="{ 'is-top': idx < 3 }">{{ idx + 1 }}</span>
              <div class="ats-rank__body">
                <div class="ats-rank__meta">
                  <span :title="item.name">{{ item.name }}</span>
                  <strong class="font-num">{{ formatNum(item.count) }}</strong>
                </div>
                <div class="ats-rank__bar">
                  <i :style="{ width: `${rankWidth(item.count, toolRankMax)}%` }" />
                </div>
              </div>
            </li>
          </ol>
        </section>

        <section class="ats-card">
          <header class="ats-card__head">
            <h3>数据集分析排行</h3>
            <span>Top {{ bundle.datasetRank.length || 0 }}</span>
          </header>
          <div v-if="!bundle.datasetRank.length" class="ats-empty">暂无排行数据</div>
          <ol v-else class="ats-rank">
            <li v-for="(item, idx) in bundle.datasetRank" :key="item.id">
              <span class="ats-rank__idx" :class="{ 'is-top': idx < 3 }">{{ idx + 1 }}</span>
              <div class="ats-rank__body">
                <div class="ats-rank__meta">
                  <span :title="item.name">{{ item.name }}</span>
                  <strong class="font-num">{{ formatNum(item.count) }}</strong>
                </div>
                <div class="ats-rank__bar ats-rank__bar--dataset">
                  <i :style="{ width: `${rankWidth(item.count, datasetRankMax)}%` }" />
                </div>
              </div>
            </li>
          </ol>
        </section>
      </div>

      <section class="ats-detail">
        <header class="ats-detail__head">
          <h3>调用详情</h3>
          <span>共 {{ formatNum(bundle.recordsTotal) }} 条</span>
        </header>
        <div v-if="!bundle.recordsApiOk" class="ats-empty ats-empty--block">
          暂无调用明细接口（需后端提供 `order.analysisToolRecord.page`）
        </div>
        <div v-else-if="!bundle.records.length" class="ats-empty ats-empty--block">当前筛选条件下暂无调用记录</div>
        <div v-else class="ats-table-wrap">
          <table class="ats-table">
            <thead>
              <tr>
                <th>时间</th>
                <th>分析工具</th>
                <th>数据集</th>
                <th>来源</th>
                <th>次数</th>
                <th>用户</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="row in bundle.records" :key="row.id">
                <td class="font-num whitespace-nowrap">{{ formatStatsDateTime(row.createAt) }}</td>
                <td>{{ row.toolName || row.toolId }}</td>
                <td :title="row.title">{{ row.title }}</td>
                <td><span class="ats-source">{{ sourceBadge(row.source) }}</span></td>
                <td class="font-num">{{ row.count }}</td>
                <td class="ats-openid" :title="row.openId">{{ maskOpenId(row.openId) }}</td>
              </tr>
            </tbody>
          </table>
        </div>
        <div v-if="totalPages > 1" class="ats-pager">
          <button type="button" :disabled="page <= 1 || loading" @click="goPage(page - 1)">上一页</button>
          <span>{{ page }} / {{ totalPages }}</span>
          <button type="button" :disabled="page >= totalPages || loading" @click="goPage(page + 1)">下一页</button>
        </div>
      </section>
    </template>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import {
  formatStatsDateTime,
  listStatsDataCenters,
  loadAnalysisToolStats,
  type AnalysisToolStatsBundle
} from '@/utils/analysisToolStatsApi'


defineExpose({
  reload: () => load(true)
})

const PIE_COLORS = ['#2563eb', '#0891b2', '#4f46e5', '#d97706', '#059669', '#e11d48', '#64748b']

function formatDayInput(d: Date): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

const centers = listStatsDataCenters()
const centerId = ref(centers[0]?.id || 'tpdc')

const todayStr = formatDayInput(new Date())
const defaultStartDate = (() => {
  const d = new Date()
  d.setDate(d.getDate() - 29)
  return formatDayInput(d)
})()
const startDate = ref(defaultStartDate)
const endDate = ref(todayStr)
const page = ref(1)
const pageSize = 10

const loading = ref(false)
const error = ref('')
const bundle = ref<AnalysisToolStatsBundle | null>(null)


const totalPages = computed(() =>
  Math.max(1, Math.ceil((bundle.value?.recordsTotal || 0) / pageSize))
)

const toolRankMax = computed(() => Math.max(1, ...(bundle.value?.toolRank.map((i) => i.count) || [1])))
const datasetRankMax = computed(() =>
  Math.max(1, ...(bundle.value?.datasetRank.map((i) => i.count) || [1]))
)

const trendMax = computed(() => Math.max(1, ...(bundle.value?.trend.map((i) => i.count) || [1])))
const trendHasData = computed(() => (bundle.value?.trend || []).some((p) => p.count > 0))

const trendYTicks = computed(() => {
  const max = trendMax.value
  return [max, Math.round(max * 0.5), 0]
})

const trendGridYs = computed(() => [0, 28, 56])

const trendLinePoints = computed(() => {
  const list = bundle.value?.trend || []
  if (!list.length) return ''
  return list
    .map((p, i) => {
      const x = list.length === 1 ? 50 : (i / (list.length - 1)) * 100
      const y = 56 - (p.count / trendMax.value) * 52 - 2
      return `${x},${y}`
    })
    .join(' ')
})

const trendAreaPoints = computed(() => {
  const line = trendLinePoints.value
  if (!line) return ''
  return `0,56 ${line} 100,56`
})

const trendXLabels = computed(() => {
  const list = bundle.value?.trend || []
  if (!list.length) return [] as { label: string; date: string; index: number }[]
  if (list.length <= 8) {
    return list.map((p, index) => ({ label: p.label, date: p.date, index }))
  }
  const step = Math.ceil(list.length / 6)
  return list
    .map((p, index) => ({ label: p.label, date: p.date, index }))
    .filter((p) => p.index % step === 0 || p.index === list.length - 1)
})

function trendX(i: number): number {
  const n = bundle.value?.trend.length || 1
  return n <= 1 ? 50 : (i / (n - 1)) * 100
}

function trendY(count: number): number {
  return (count / trendMax.value) * 92 + 4
}

const pieSlices = computed(() => {
  const list = bundle.value?.toolShare || []
  const total = list.reduce((s, i) => s + i.count, 0) || 1
  return list.map((item, i) => ({
    ...item,
    color: PIE_COLORS[i % PIE_COLORS.length],
    pct: Math.round((item.count / total) * 1000) / 10
  }))
})

const pieGradient = computed(() => {
  const slices = pieSlices.value
  if (!slices.length) return '#e2e8f0'
  let acc = 0
  const parts = slices.map((s) => {
    const start = acc
    acc += s.pct
    return `${s.color} ${start}% ${acc}%`
  })
  return `conic-gradient(${parts.join(', ')})`
})

function formatNum(n: number): string {
  return Number(n || 0).toLocaleString('zh-CN')
}

function rankWidth(count: number, max: number): number {
  return Math.max(4, Math.round((count / Math.max(max, 1)) * 100))
}

function maskOpenId(id: string): string {
  const s = String(id || '').trim()
  if (!s) return '—'
  if (s.length <= 8) return s
  return `${s.slice(0, 4)}…${s.slice(-4)}`
}

function sourceBadge(source: string): string {
  const s = String(source || '').trim()
  if (s.toLowerCase() === 'tpdc') return 'TPDC'
  const center = centers.find((c) => c.id === s || c.name === s)
  return center?.shortName || s || '—'
}

async function load(_force = false) {
  if (loading.value) return
  loading.value = true
  error.value = ''
  try {
    const data = await loadAnalysisToolStats({
      centerId: centerId.value,
      startDate: startDate.value,
      endDate: endDate.value,
      pageNum: page.value,
      pageSize
    })
    bundle.value = data
  } catch (e: unknown) {
    bundle.value = null
    error.value = e instanceof Error ? e.message : '加载失败'
  } finally {
    loading.value = false
  }
}

function onDateChange() {
  if (!startDate.value) startDate.value = defaultStartDate
  if (!endDate.value) endDate.value = todayStr
  if (startDate.value > endDate.value) {
    endDate.value = startDate.value
  }
  onFilterChange()
}

function onFilterChange() {
  page.value = 1
  void load(true)
}

function goPage(next: number) {
  page.value = next
  void load(true)
}

function reload() {
  void load(true)
}

onMounted(() => {
  void load(true)
})
</script>

<style scoped>
.panel-head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 1rem;
  margin-bottom: 1.25rem;
  padding-bottom: 0.75rem;
  border-bottom: 1px solid #f1f5f9;
}

.panel-head h2 {
  margin: 0;
  font-size: 1.125rem;
  font-weight: 800;
  color: #0f172a;
}

.panel-head__btn {
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  flex-shrink: 0;
  padding: 0.45rem 0.9rem;
  border-radius: 0.5rem;
  border: 1px solid #cbd5e1;
  font-size: 0.8125rem;
  font-weight: 600;
  color: #334155;
  background: #fff;
  cursor: pointer;
}

.panel-head__btn:hover {
  border-color: #2563eb;
  color: #2563eb;
}

.panel-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  min-height: 10rem;
  color: #94a3b8;
  font-size: 0.875rem;
}

.panel-state--error {
  color: #b91c1c;
}


.ats-filters {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 0.75rem;
  margin-bottom: 1rem;
}

.ats-field {
  display: flex;
  flex-direction: column;
  gap: 0.3rem;
  font-size: 0.75rem;
  color: #64748b;
  font-weight: 600;
}

.ats-field select,
.ats-field input {
  min-height: 2.35rem;
  border: 1px solid #e2e8f0;
  border-radius: 0.5rem;
  background: #fff;
  padding: 0.35rem 0.65rem;
  color: #0f172a;
  font-size: 0.875rem;
  font-weight: 500;
}

.ats-kpis {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 0.75rem;
  margin-bottom: 0.85rem;
}

.ats-kpi {
  display: flex;
  align-items: center;
  gap: 0.65rem;
  padding: 0.85rem 0.9rem;
  border-radius: 0.75rem;
  background: #f8fafc;
  border: 1px solid #eef2f7;
}

.ats-kpi__icon {
  font-size: 1.35rem;
}

.ats-kpi--blue .ats-kpi__icon { color: #2563eb; }
.ats-kpi--cyan .ats-kpi__icon { color: #0891b2; }

.ats-kpi--amber .ats-kpi__icon { color: #d97706; }

.ats-kpi__value {
  margin: 0;
  font-size: 1.25rem;
  font-weight: 700;
  color: #0f172a;
  line-height: 1.2;
}

.ats-kpi__value--sm {
  font-size: 0.95rem;
}

.ats-kpi__label {
  margin: 0.15rem 0 0;
  font-size: 0.75rem;
  color: #94a3b8;
}

.ats-hint {
  margin: 0 0 0.85rem;
  padding: 0.55rem 0.75rem;
  border-radius: 0.5rem;
  background: #fffbeb;
  color: #b45309;
  font-size: 0.8125rem;
}

.ats-charts {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 0.85rem;
}

.ats-card {
  min-height: 16rem;
  padding: 0.9rem 1rem 1rem;
  border: 1px solid #eef2f7;
  border-radius: 0.75rem;
  background: #fff;
}

.ats-card__head {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 0.5rem;
  margin-bottom: 0.75rem;
}

.ats-card__head h3 {
  margin: 0;
  font-size: 0.9375rem;
  font-weight: 700;
  color: #0f172a;
}

.ats-card__head span {
  font-size: 0.75rem;
  color: #94a3b8;
}

.ats-empty {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 10rem;
  color: #94a3b8;
  font-size: 0.875rem;
}

.ats-empty--block {
  min-height: 5rem;
  border: 1px dashed #e2e8f0;
  border-radius: 0.65rem;
  background: #f8fafc;
}

.ats-line {
  display: flex;
  gap: 0.35rem;
  height: 12.5rem;
}

.ats-line__y {
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  width: 2rem;
  font-size: 0.6875rem;
  color: #94a3b8;
  text-align: right;
  padding-bottom: 1.25rem;
}

.ats-line__plot {
  position: relative;
  flex: 1;
  min-width: 0;
}

.ats-line__svg {
  width: 100%;
  height: calc(100% - 1.25rem);
  display: block;
}

.ats-line__grid {
  fill: none;
  stroke: #f1f5f9;
  stroke-width: 0.4;
}

.ats-line__area {
  fill: rgba(37, 99, 235, 0.1);
  stroke: none;
}

.ats-line__path {
  fill: none;
  stroke: #2563eb;
  stroke-width: 1.2;
  stroke-linejoin: round;
  stroke-linecap: round;
}

.ats-line__dots {
  position: absolute;
  inset: 0 0 1.25rem 0;
  pointer-events: none;
}

.ats-line__dot {
  position: absolute;
  width: 0.4rem;
  height: 0.4rem;
  margin-left: -0.2rem;
  margin-bottom: -0.2rem;
  border-radius: 50%;
  background: #2563eb;
  border: 2px solid #fff;
  box-shadow: 0 0 0 1px rgba(37, 99, 235, 0.35);
  pointer-events: auto;
}

.ats-line__x {
  position: absolute;
  left: 0;
  right: 0;
  bottom: 0;
  height: 1.25rem;
}

.ats-line__x span {
  position: absolute;
  transform: translateX(-50%);
  font-size: 0.6875rem;
  color: #94a3b8;
  white-space: nowrap;
}

.ats-pie {
  display: flex;
  align-items: center;
  gap: 1rem;
  min-height: 11rem;
}

.ats-pie__chart {
  width: 8.5rem;
  height: 8.5rem;
  flex-shrink: 0;
  border-radius: 50%;
  border: 4px solid #fff;
  box-shadow: 0 0 0 1px #e2e8f0;
}

.ats-pie__legend {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 0.45rem;
  min-width: 0;
  flex: 1;
}

.ats-pie__legend li {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  font-size: 0.8125rem;
  color: #475569;
}

.ats-pie__legend i {
  width: 0.55rem;
  height: 0.55rem;
  border-radius: 0.15rem;
  flex-shrink: 0;
}

.ats-pie__name {
  flex: 1;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.ats-rank {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 0.55rem;
}

.ats-rank li {
  display: flex;
  align-items: center;
  gap: 0.55rem;
}

.ats-rank__idx {
  width: 1.35rem;
  height: 1.35rem;
  border-radius: 0.35rem;
  background: #f1f5f9;
  color: #64748b;
  font-size: 0.75rem;
  font-weight: 700;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.ats-rank__idx.is-top {
  background: #eff6ff;
  color: #2563eb;
}

.ats-rank__body {
  flex: 1;
  min-width: 0;
}

.ats-rank__meta {
  display: flex;
  justify-content: space-between;
  gap: 0.5rem;
  margin-bottom: 0.25rem;
  font-size: 0.8125rem;
  color: #334155;
}

.ats-rank__meta span {
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.ats-rank__meta strong {
  color: #0f172a;
  flex-shrink: 0;
}

.ats-rank__bar {
  height: 0.35rem;
  border-radius: 999px;
  background: #f1f5f9;
  overflow: hidden;
}

.ats-rank__bar i {
  display: block;
  height: 100%;
  border-radius: inherit;
  background: linear-gradient(90deg, #60a5fa, #2563eb);
}

.ats-rank__bar--dataset i {
  background: linear-gradient(90deg, #67e8f9, #0891b2);
}

.ats-detail {
  margin-top: 0.85rem;
  padding: 0.9rem 1rem 1rem;
  border: 1px solid #eef2f7;
  border-radius: 0.75rem;
  background: #fff;
}

.ats-detail__head {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  margin-bottom: 0.75rem;
}

.ats-detail__head h3 {
  margin: 0;
  font-size: 0.9375rem;
  font-weight: 700;
  color: #0f172a;
}

.ats-detail__head span {
  font-size: 0.75rem;
  color: #94a3b8;
}

.ats-table-wrap {
  overflow-x: auto;
}

.ats-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.8125rem;
}

.ats-table th,
.ats-table td {
  padding: 0.65rem 0.55rem;
  border-bottom: 1px solid #f1f5f9;
  text-align: left;
  vertical-align: top;
  color: #334155;
}

.ats-table th {
  color: #94a3b8;
  font-weight: 600;
  white-space: nowrap;
}

.ats-table td:nth-child(3) {
  max-width: 16rem;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.ats-source {
  display: inline-block;
  padding: 0.1rem 0.4rem;
  border-radius: 0.25rem;
  background: #eff6ff;
  color: #2563eb;
  font-size: 0.75rem;
  font-weight: 700;
}

.ats-openid {
  color: #94a3b8;
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
  font-size: 0.75rem;
}

.ats-pager {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.75rem;
  margin-top: 0.85rem;
  font-size: 0.8125rem;
  color: #64748b;
}

.ats-pager button {
  min-height: 2rem;
  padding: 0.25rem 0.75rem;
  border: 1px solid #e2e8f0;
  border-radius: 0.45rem;
  background: #fff;
  color: #475569;
  cursor: pointer;
}

.ats-pager button:disabled {
  opacity: 0.45;
  cursor: not-allowed;
}

@media (max-width: 960px) {
  .ats-kpis,
  .ats-charts,
  .ats-filters {
    grid-template-columns: 1fr 1fr;
  }
}

@media (max-width: 640px) {
  .ats-kpis,
  .ats-charts,
  .ats-filters {
    grid-template-columns: 1fr;
  }

  .ats-pie {
    flex-direction: column;
    align-items: flex-start;
  }
}
</style>
