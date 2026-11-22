<template>
  <div class="dctp">
    <div class="panel-head">
      <div>
        <h2>{{ title }}</h2>
        <p class="dctp__hint">{{ subtitle }}</p>
      </div>
      <div class="dctp__actions">
        <span class="panel-head__count">共 {{ centerRows.length }} 个节点</span>
        <button type="button" class="panel-head__btn" :disabled="loading" @click="reload">
          <iconify-icon :icon="loading ? 'mdi:loading' : 'mdi:refresh'" :class="{ 'animate-spin': loading }" />
          刷新
        </button>
      </div>
    </div>

    <div v-if="loading && !centerRows.length" class="panel-state">
      <iconify-icon icon="mdi:loading" class="animate-spin text-2xl" />
      <p>正在加载数据中心信息…</p>
    </div>
    <div v-else-if="error" class="panel-state panel-state--error">
      <p>{{ error }}</p>
      <button type="button" class="panel-head__btn" @click="reload">重新加载</button>
    </div>
    <div v-else-if="!centerRows.length" class="panel-state">
      <iconify-icon icon="mdi:database-off-outline" class="text-3xl text-slate-300" />
      <p>暂无数据中心节点</p>
    </div>

    <div v-else class="dctp-table-wrap">
      <table class="dctp-table">
        <thead>
          <tr>
            <th style="width: 3rem">#</th>
            <th>数据中心</th>
            <th style="width: 5rem">标识</th>
            <th style="width: 7rem">数据集数</th>
            <th style="width: 6rem">工具配置</th>
            <th style="width: 8rem">最近更新</th>
            <th>状态</th>
            <th style="width: 6rem">操作</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="(row, idx) in centerRows" :key="row.centerId">
            <td class="dctp-table__num">{{ idx + 1 }}</td>
            <td>
              <p class="dctp-table__title">{{ row.centerName }}</p>
            </td>
            <td>
              <span class="dctp-table__center">{{ row.shortName }}</span>
            </td>
            <td>{{ row.datasetCount }}</td>
            <td>{{ row.toolCount }}</td>
            <td>{{ row.latestUpdate || '—' }}</td>
            <td>
              <span
                class="dctp-table__status"
                :class="row.error ? 'dctp-table__status--error' : 'dctp-table__status--ok'"
              >
                {{ row.error || '正常' }}
              </span>
            </td>
            <td>
              <button
                type="button"
                class="dctp-table__link"
                :disabled="!row.datasetCount"
                @click="openCenter(row)"
              >
                查看数据
              </button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import type { DataCenterAccess } from '@/utils/dataCenterAccess'
import {
  fetchAllDataCenterBundles,
  fetchDataCenterDatasets,
  type DataCenterDatasetBundle
} from '@/utils/dataCenterRegistry'

const props = defineProps<{
  access: DataCenterAccess
  institutionFallbackName?: string
}>()

const router = useRouter()

type CenterRow = {
  centerId: string
  centerName: string
  shortName: string
  datasetCount: number
  toolCount: number
  latestUpdate: string
  error?: string
}

const bundles = ref<DataCenterDatasetBundle[]>([])
const loading = ref(false)
const error = ref('')

const title = computed(() =>
  props.access.mode === 'all' ? '总数据中心节点' : props.access.center?.name || '数据分析'
)

const subtitle = computed(() =>
  props.access.mode === 'all'
    ? '每个数据中心节点仅展示一条汇总信息'
    : '当前机构数据中心节点汇总信息'
)

const centerRows = computed<CenterRow[]>(() =>
  bundles.value.map((bundle) => {
    let latestUpdate = ''
    let toolCount = 0
    for (const item of bundle.datasets) {
      toolCount += (item.tools || []).length
      const at = String(item.updateAt || '').trim()
      if (at && (!latestUpdate || at > latestUpdate)) latestUpdate = at
    }
    return {
      centerId: bundle.center.id,
      centerName: bundle.center.name,
      shortName: bundle.center.shortName,
      datasetCount: bundle.datasets.length,
      toolCount,
      latestUpdate,
      error: bundle.error
    }
  })
)

function openCenter(row: CenterRow) {
  if (!row.datasetCount) return
  // 跳转到数据分析目录页，按该中心浏览数据集卡片
  router.push({ path: '/analysis-datasets', query: { center: row.centerId } })
}

async function reload() {
  loading.value = true
  error.value = ''
  try {
    if (props.access.mode === 'all') {
      bundles.value = await fetchAllDataCenterBundles()
      return
    }
    const center = props.access.center
    if (!center) {
      bundles.value = [
        {
          center: {
            id: 'unregistered',
            name: props.institutionFallbackName || '当前机构',
            shortName: '机构中心',
            keywords: [],
            configUrl: ''
          },
          datasets: [],
          error: '该机构尚未接入数据集配置'
        }
      ]
      return
    }
    const datasets = await fetchDataCenterDatasets(center)
    bundles.value = [{ center, datasets }]
  } catch (e: unknown) {
    bundles.value = []
    error.value = e instanceof Error ? e.message : '加载失败'
  } finally {
    loading.value = false
  }
}

watch(
  () => [props.access.mode, props.access.center?.id] as const,
  () => {
    void reload()
  }
)

onMounted(() => {
  void reload()
})

defineExpose({ reload })
</script>

<style scoped>
.dctp__hint {
  margin-top: 0.2rem;
  font-size: 0.75rem;
  color: #94a3b8;
}

.dctp__actions {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  flex-wrap: wrap;
}

.panel-head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 1rem;
  margin-bottom: 1rem;
}

.panel-head h2 {
  font-size: 1.125rem;
  font-weight: 800;
  color: #0f172a;
}

.panel-head__count {
  font-size: 0.8125rem;
  color: #94a3b8;
}

.panel-head__btn {
  display: inline-flex;
  align-items: center;
  gap: 0.3rem;
  padding: 0.4rem 0.75rem;
  border-radius: 0.55rem;
  background: #eff6ff;
  color: #2563eb;
  font-size: 0.8125rem;
  font-weight: 600;
}

.panel-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 0.65rem;
  padding: 2.5rem 1rem;
  color: #94a3b8;
  font-size: 0.875rem;
}

.panel-state--error {
  color: #dc2626;
}

.dctp-table-wrap {
  overflow-x: auto;
  border: 1px solid #e2e8f0;
  border-radius: 0.75rem;
}

.dctp-table {
  width: 100%;
  border-collapse: collapse;
  min-width: 640px;
  background: #fff;
}

.dctp-table th,
.dctp-table td {
  padding: 0.75rem 0.85rem;
  text-align: left;
  border-bottom: 1px solid #f1f5f9;
  vertical-align: middle;
  font-size: 0.8125rem;
  color: #334155;
}

.dctp-table th {
  background: #f8fafc;
  font-size: 0.75rem;
  font-weight: 700;
  color: #64748b;
  white-space: nowrap;
}

.dctp-table tbody tr:hover {
  background: #f8fafc;
}

.dctp-table tbody tr:last-child td {
  border-bottom: none;
}

.dctp-table__num {
  color: #94a3b8;
  font-variant-numeric: tabular-nums;
}

.dctp-table__center {
  display: inline-block;
  padding: 0.15rem 0.45rem;
  border-radius: 999px;
  background: #eff6ff;
  color: #2563eb;
  font-size: 0.6875rem;
  font-weight: 700;
}

.dctp-table__title {
  margin: 0;
  font-weight: 700;
  color: #0f172a;
  line-height: 1.4;
}

.dctp-table__status {
  font-size: 0.75rem;
  font-weight: 600;
}

.dctp-table__status--ok {
  color: #15803d;
}

.dctp-table__status--error {
  color: #dc2626;
}

.dctp-table__link {
  font-size: 0.75rem;
  font-weight: 700;
  color: #2563eb;
}

.dctp-table__link:hover:not(:disabled) {
  text-decoration: underline;
}

.dctp-table__link:disabled {
  color: #cbd5e1;
  cursor: not-allowed;
}
</style>
