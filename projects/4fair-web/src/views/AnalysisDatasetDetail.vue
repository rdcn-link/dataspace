<template>
  <div class="add-page">
    <header class="add-banner">
      <div class="add-shell">
        <nav class="add-breadcrumb">
          <button type="button" @click="router.push({ path: '/analysis-datasets', query: route.query.center ? { center: String(route.query.center) } : {} })">
            数据目录
          </button>
          <iconify-icon icon="mdi:chevron-right" />
          <span>数据集详情</span>
        </nav>
      </div>
    </header>

    <main class="add-shell add-main">
      <div v-if="loading" class="add-state">
        <iconify-icon icon="mdi:loading" class="animate-spin text-3xl text-blue-600" />
        <p>正在加载数据集…</p>
      </div>
      <div v-else-if="error" class="add-state add-state--error">
        <p>{{ error }}</p>
        <button type="button" class="add-btn" @click="load">重新加载</button>
      </div>

      <template v-else-if="detail">
        <section class="add-base tech-card">
          <div class="add-base__tags">
            <span class="add-pill">在线分析数据集</span>
            <span v-if="detail.updateAt" class="add-meta">更新 {{ detail.updateAt }}</span>
            <span v-if="sizeLabel" class="add-meta">{{ sizeLabel }}</span>
          </div>
          <div class="add-title-box">
            <div class="add-cover">
              <img
                v-if="detail.dataSetPicture"
                :src="detail.dataSetPicture"
                :alt="detail.name"
                @error="detail.dataSetPicture = ''"
              />
              <span v-else class="add-cover__label">{{ coverLabel(detail.name) }}</span>
            </div>
            <div class="add-title-main">
              <div class="add-title-row">
                <h1>{{ detail.name }}</h1>
                <button
                  type="button"
                  class="add-seek"
                  :disabled="seekOpening"
                  title="数据智能探查"
                  @click="openDataSeek"
                >
                  <iconify-icon v-if="seekOpening" icon="mdi:loading" class="animate-spin" />
                  <img
                    v-else
                    class="add-seek__icon"
                    src="/images/analysis-tools/d9380dd23e9d6a7135057e9b926b8e75.png"
                    alt=""
                    width="18"
                    height="18"
                  />
                  <span>{{ seekOpening ? '打开中…' : '数据智能探查' }}</span>
                </button>
              </div>
              <p class="add-uuid" :title="detail.external_id">{{ detail.external_id }}</p>
            </div>
          </div>
        </section>

        <div class="add-layout">
          <div class="add-left">
            <section class="add-panel tech-card">
              <h2>基本信息</h2>
              <div class="add-meta-line">
                <span class="add-meta-line__label">数据集名称：</span>
                <span>{{ detail.name }}</span>
              </div>
              <div class="add-meta-line">
                <span class="add-meta-line__label">UUID：</span>
                <span class="font-mono">{{ detail.external_id }}</span>
              </div>
              <div v-if="detail.updateAt" class="add-meta-line">
                <span class="add-meta-line__label">最近更新：</span>
                <span>{{ detail.updateAt }}</span>
              </div>
              <div v-if="detail.authors" class="add-meta-line">
                <span class="add-meta-line__label">作者：</span>
                <span>{{ detail.authors }}</span>
              </div>
              <div v-if="sizeLabel" class="add-meta-line">
                <span class="add-meta-line__label">数据规模：</span>
                <span>{{ sizeLabel }}</span>
              </div>
              <div class="add-block">
                <div class="add-block__label">简介</div>
                <div class="add-block__content">{{ detail.summary || '暂无简介' }}</div>
              </div>
              <div v-if="scaleEntries.length" class="add-block">
                <div class="add-block__label">时间尺度</div>
                <div class="add-tags">
                  <span v-for="[k, v] in scaleEntries" :key="k" class="add-tag">{{ k }}（{{ v }}）</span>
                </div>
              </div>
              <div v-if="metricEntries.length" class="add-block">
                <div class="add-block__label">指标类型</div>
                <div class="add-tags">
                  <span v-for="[k, v] in metricEntries" :key="k" class="add-tag add-tag--muted">{{ k }}（{{ v }}）</span>
                </div>
              </div>
            </section>
          </div>
        </div>
      </template>
    </main>

    <p v-if="seekToast" class="add-toast" role="status">{{ seekToast }}</p>

    <AppFooter />
    <SiteBottomTabBar active="hubs" />
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import SiteBottomTabBar from '@/components/SiteBottomTabBar.vue'
import AppFooter from '@/components/AppFooter.vue'
import { useAuthStore } from '@/stores/auth'
import {
  DATA_CENTERS,
  fetchDataCenterDatasets
} from '@/utils/dataCenterRegistry'
import {
  formatByteSize,
  type TpdcDatasetConfig
} from '@/utils/tpdcDataConfigApi'
import { openDatasetSeekFlow, savePendingDatasetSeek } from '@/utils/datasetSeekPending'
import { goLogin } from '@/utils/loginRedirect'

const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()

const loading = ref(true)
const error = ref('')
const detail = ref<TpdcDatasetConfig | null>(null)
const seekOpening = ref(false)
const seekToast = ref('')

const uuid = computed(() => decodeURIComponent(String(route.params.uuid || '').trim()))

const activeCenter = computed(() => {
  const id = String(route.query.center || 'tpdc')
  return DATA_CENTERS.find((c) => c.id === id) || DATA_CENTERS[0]
})

const sizeLabel = computed(() => formatByteSize(detail.value?.byteSize))

const scaleEntries = computed(() => Object.entries(detail.value?.['时间尺度'] || {}))
const metricEntries = computed(() => Object.entries(detail.value?.['指标类型'] || {}))

function coverLabel(name: string): string {
  if (/全球/.test(name)) return '全球'
  if (/中国|区域/.test(name)) return '中国'
  return '数据集'
}

function showSeekToast(message: string) {
  seekToast.value = message
  window.setTimeout(() => {
    if (seekToast.value === message) seekToast.value = ''
  }, 3200)
}

async function openDataSeek() {
  const item = detail.value
  if (!item || seekOpening.value) return

  if (!authStore.isLoggedIn) {
    savePendingDatasetSeek(activeCenter.value.id, item)
    showSeekToast('请先登录，登录后将自动打开数据智能探查')
    void goLogin(router, router.currentRoute.value.fullPath)
    return
  }

  seekOpening.value = true
  try {
    await openDatasetSeekFlow(item, authStore, { center: activeCenter.value.id })
    showSeekToast('已打开数据智能探查')
  } catch (e: unknown) {
    showSeekToast(e instanceof Error ? e.message : '数据智能探查打开失败')
  } finally {
    seekOpening.value = false
  }
}

async function load() {
  loading.value = true
  error.value = ''
  detail.value = null
  try {
    const list = await fetchDataCenterDatasets(activeCenter.value)
    const found = list.find((d) => d.external_id === uuid.value) || null
    if (!found) {
      error.value = '未找到该数据集'
      return
    }
    detail.value = { ...found }
  } catch (e: unknown) {
    error.value = e instanceof Error ? e.message : '加载失败'
  } finally {
    loading.value = false
  }
}

watch(uuid, () => {
  void load()
})

onMounted(() => {
  authStore.syncFromStorage()
  void load()
})
</script>

<style scoped>
.add-page {
  min-height: 100vh;
  background:
    radial-gradient(ellipse 70% 40% at 8% -8%, rgba(37, 99, 235, 0.07), transparent 55%),
    #f4f7fb;
  padding-bottom: calc(3.75rem + env(safe-area-inset-bottom, 0px));
}

@media (min-width: 768px) {
  .add-page {
    padding-bottom: 0;
  }
}

.add-shell {
  max-width: 72rem;
  margin: 0 auto;
  padding-left: 1.25rem;
  padding-right: 1.25rem;
}

.add-banner {
  background: linear-gradient(120deg, #16324f 0%, #1e4a73 55%, #1a6b7a 100%);
  min-height: 7.5rem;
}

.add-breadcrumb {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.25rem;
  padding: 1.1rem 0 1rem;
  color: rgba(255, 255, 255, 0.78);
  font-size: 0.8125rem;
}

.add-breadcrumb button {
  border: 0;
  background: transparent;
  color: rgba(255, 255, 255, 0.92);
  cursor: pointer;
  font: inherit;
}

.add-breadcrumb button:hover {
  text-decoration: underline;
}

.add-main {
  margin-top: -2.25rem;
  padding-bottom: 2.5rem;
}

.add-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 0.75rem;
  min-height: 16rem;
  padding: 2rem;
  border-radius: 1rem;
  background: #fff;
  border: 1px solid #e2e8f0;
  color: #64748b;
}

.add-state--error {
  color: #b91c1c;
}

.add-btn {
  height: 2.25rem;
  padding: 0 1rem;
  border: 0;
  border-radius: 0.5rem;
  background: #2563eb;
  color: #fff;
  font-size: 0.875rem;
  font-weight: 600;
  cursor: pointer;
}

.add-base {
  padding: 1.15rem 1.25rem 1.25rem;
  margin-bottom: 1rem;
}

.add-base__tags {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.45rem;
  margin-bottom: 0.85rem;
}

.add-pill {
  display: inline-flex;
  padding: 0.18rem 0.55rem;
  border-radius: 999px;
  background: #eff6ff;
  color: #1d4ed8;
  font-size: 0.75rem;
  font-weight: 700;
}

.add-meta {
  font-size: 0.75rem;
  color: #64748b;
}

.add-title-box {
  display: flex;
  gap: 1rem;
  align-items: flex-start;
}

.add-cover {
  flex-shrink: 0;
  width: 5.5rem;
  height: 5.5rem;
  border-radius: 0.75rem;
  overflow: hidden;
  background: linear-gradient(135deg, #1e4a73 0%, #2f6ea5 55%, #3d8f7a 100%);
  display: flex;
  align-items: center;
  justify-content: center;
}

.add-cover img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.add-cover__label {
  color: rgba(255, 255, 255, 0.92);
  font-size: 0.9rem;
  font-weight: 700;
}

.add-title-main {
  min-width: 0;
  flex: 1;
}

.add-title-row {
  display: flex;
  align-items: flex-start;
  gap: 0.75rem;
}

.add-title-main h1 {
  margin: 0;
  flex: 1;
  min-width: 0;
  font-size: 1.35rem;
  font-weight: 800;
  color: #0f172a;
  line-height: 1.35;
}

.add-seek {
  flex-shrink: 0;
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  height: 1.9rem;
  padding: 0 0.7rem 0 0.4rem;
  border: 1px solid #bfdbfe;
  border-radius: 999px;
  background: #eff6ff;
  color: #1d4ed8;
  font-size: 0.75rem;
  font-weight: 700;
  line-height: 1;
  cursor: pointer;
  transition: background 0.15s, border-color 0.15s, color 0.15s;
}

.add-seek:hover:not(:disabled) {
  background: #dbeafe;
  border-color: #93c5fd;
  color: #1e40af;
}

.add-seek:disabled {
  opacity: 0.7;
  cursor: wait;
}

.add-seek__icon {
  width: 1.15rem;
  height: 1.15rem;
  border-radius: 0.28rem;
  object-fit: cover;
  flex-shrink: 0;
}

.add-seek iconify-icon {
  font-size: 0.95rem;
}

.add-uuid {
  margin: 0.4rem 0 0;
  font-size: 0.8125rem;
  color: #94a3b8;
  word-break: break-all;
}

.add-toast {
  position: fixed;
  left: 50%;
  bottom: calc(4.5rem + env(safe-area-inset-bottom, 0px));
  z-index: 40;
  transform: translateX(-50%);
  max-width: min(90vw, 28rem);
  margin: 0;
  padding: 0.65rem 1rem;
  border-radius: 0.65rem;
  background: rgba(15, 23, 42, 0.92);
  color: #fff;
  font-size: 0.8125rem;
  line-height: 1.4;
  box-shadow: 0 8px 24px rgba(15, 23, 42, 0.25);
}

@media (min-width: 768px) {
  .add-toast {
    bottom: 1.5rem;
  }
}

.add-layout {
  display: block;
}

.add-panel {
  padding: 1.15rem 1.25rem 1.35rem;
}

.add-panel h2 {
  margin: 0 0 0.85rem;
  font-size: 1.05rem;
  font-weight: 800;
  color: #0f172a;
}

.add-meta-line {
  display: flex;
  flex-wrap: wrap;
  gap: 0.25rem 0.5rem;
  margin-bottom: 0.55rem;
  font-size: 0.875rem;
  color: #334155;
  line-height: 1.5;
}

.add-meta-line__label {
  flex-shrink: 0;
  color: #64748b;
  font-weight: 600;
}

.add-block {
  margin-top: 0.95rem;
}

.add-block__label {
  margin-bottom: 0.4rem;
  font-size: 0.8125rem;
  font-weight: 700;
  color: #475569;
}

.add-block__content {
  font-size: 0.875rem;
  line-height: 1.65;
  color: #334155;
  white-space: pre-wrap;
}

.add-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 0.35rem;
}

.add-tag {
  display: inline-flex;
  padding: 0.18rem 0.5rem;
  border-radius: 999px;
  background: #f0f9ff;
  border: 1px solid #bae6fd;
  color: #0369a1;
  font-size: 0.75rem;
  font-weight: 600;
}

.add-tag--muted {
  background: #f8fafc;
  border-color: #e2e8f0;
  color: #475569;
}
</style>
