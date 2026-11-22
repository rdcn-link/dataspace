<template>
  <div class="pangeo-page" :style="pageStyle">
    <main class="pangeo-main">
      <div class="pangeo-toolbar">
        <label class="pangeo-search">
          <iconify-icon icon="mdi:magnify" aria-hidden="true" />
          <input
            v-model.trim="searchQuery"
            type="search"
            placeholder="搜索名称、简介、工具或 UUID…"
            autocomplete="off"
            @keydown.enter.prevent
          />
          <button
            v-if="searchQuery"
            type="button"
            class="pangeo-search__clear"
            aria-label="清空搜索"
            @click="searchQuery = ''"
          >
            <iconify-icon icon="mdi:close" />
          </button>
        </label>
      </div>

      <div v-if="loading && !items.length" class="pangeo-state">
        <iconify-icon icon="mdi:loading" class="animate-spin text-3xl" />
        <p>正在加载数据集目录…</p>
      </div>
      <div v-else-if="error" class="pangeo-state pangeo-state--error">
        <p>{{ error }}</p>
        <button type="button" class="pangeo-btn" @click="load">重新加载</button>
      </div>
      <div v-else-if="!items.length" class="pangeo-state">
        <p>暂无可用数据集</p>
      </div>
      <div v-else-if="!filteredItems.length" class="pangeo-state">
        <p>未找到匹配「{{ searchQuery }}」的数据集</p>
        <button type="button" class="pangeo-btn" @click="searchQuery = ''">清空搜索</button>
      </div>

      <div v-else class="pangeo-grid">
        <article
          v-for="item in filteredItems"
          :key="item.external_id"
          class="pangeo-card group"
        >
          <div class="pangeo-card__thumb" :class="{ 'pangeo-card__thumb--placeholder': !item.dataSetPicture }">
            <img
              v-if="item.dataSetPicture"
              :src="item.dataSetPicture"
              :alt="item.name"
              @error="onCoverError(item)"
            />
            <span v-else class="pangeo-card__thumb-label">{{ coverLabel(item.name) }}</span>
          </div>
          <div class="pangeo-card__info">
            <div class="pangeo-card__title-row">
              <h4 :title="item.name">{{ item.name }}</h4>
              <button
                type="button"
                class="pangeo-card__seek"
                :disabled="!!seekOpening[item.external_id]"
                title="数据智能探查"
                @click="openDataSeek(item)"
              >
                <iconify-icon
                  v-if="seekOpening[item.external_id]"
                  icon="mdi:loading"
                  class="animate-spin"
                />
                <img
                  v-else
                  class="pangeo-card__seek-icon"
                  src="/images/analysis-tools/d9380dd23e9d6a7135057e9b926b8e75.png"
                  alt=""
                  width="18"
                  height="18"
                />
                <span>{{ seekOpening[item.external_id] ? '打开中…' : '数据智能探查' }}</span>
              </button>
            </div>
            <p class="pangeo-card__summary">{{ item.summary || '暂无简介' }}</p>
            <div class="pangeo-card__foot">
              <span class="pangeo-card__authors" :title="item.authors || ''">
                作者：{{ item.authors || '—' }}
              </span>
              <span class="pangeo-card__time">时间：{{ item.updateAt || '—' }}</span>
              <span class="pangeo-card__source">{{ activeCenter.shortName }}</span>
            </div>
          </div>
        </article>
      </div>
    </main>

    <p v-if="seekToast" class="pangeo-toast" role="status">{{ seekToast }}</p>

    <SiteBottomTabBar />
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import SiteBottomTabBar from '@/components/SiteBottomTabBar.vue'
import { useAuthStore } from '@/stores/auth'
import {
  DATA_CENTERS,
  fetchDataCenterDatasets
} from '@/utils/dataCenterRegistry'
import type { TpdcDatasetConfig } from '@/utils/tpdcDataConfigApi'
import { resolveAnalysisTools } from '@/utils/analysisToolCatalog'
import { openDatasetSeekFlow, savePendingDatasetSeek } from '@/utils/datasetSeekPending'
import { goLogin } from '@/utils/loginRedirect'
import {
  isMixedContentBackgroundUrl,
  preferHttpsBackgroundUrl,
  resolveBackgroundUrlByCenterId
} from '@/utils/dataCenterAllApi'
import chemAllDataBg from '@/assets/img/chem-allData-bg.png'
import tpdcAllDataBg from '@/assets/img/tpdc-allData-bg.png'

const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()

const pageBgUrl = ref(
  String(route.query.center || 'tpdc') === 'chem' ? chemAllDataBg : tpdcAllDataBg
)

const pageStyle = computed(() => ({
  backgroundImage: `url(${pageBgUrl.value})`
}))

const items = ref<TpdcDatasetConfig[]>([])
const loading = ref(false)
const error = ref('')
const searchQuery = ref('')
const seekToast = ref('')
const seekOpening = reactive<Record<string, boolean>>({})

const activeCenter = computed(() => {
  const id = String(route.query.center || 'tpdc')
  return DATA_CENTERS.find((c) => c.id === id) || DATA_CENTERS[0]
})

const filteredItems = computed(() => {
  const q = searchQuery.value.trim().toLowerCase()
  if (!q) return items.value
  return items.value.filter((item) => {
    const tools = resolveAnalysisTools(item.tools)
      .map((t) => `${t.label} ${t.id} ${t.desc}`)
      .join(' ')
    const hay = [
      item.name,
      item.summary,
      item.external_id,
      item.keywords,
      item.authors,
      item.updateAt,
      tools
    ]
      .filter(Boolean)
      .join(' ')
      .toLowerCase()
    return hay.includes(q)
  })
})

function coverLabel(name: string): string {
  if (/全球/.test(name)) return '全球'
  if (/中国|区域/.test(name)) return '中国'
  return '数据'
}

function onCoverError(item: TpdcDatasetConfig) {
  item.dataSetPicture = ''
}

function showSeekToast(message: string) {
  seekToast.value = message
  window.setTimeout(() => {
    if (seekToast.value === message) seekToast.value = ''
  }, 3200)
}

/** 列表入口：打开数据智能探查（原数据探查工具） */
async function openDataSeek(item: TpdcDatasetConfig) {
  const id = String(item.external_id || '').trim()
  if (!id || seekOpening[id]) return

  if (!authStore.isLoggedIn) {
    savePendingDatasetSeek(activeCenter.value.id, item)
    showSeekToast('请先登录，登录后将自动打开数据智能探查')
    void goLogin(router, router.currentRoute.value.fullPath)
    return
  }

  seekOpening[id] = true
  try {
    await openDatasetSeekFlow(item, authStore, { center: activeCenter.value.id })
    showSeekToast('已打开数据智能探查')
  } catch (e: unknown) {
    showSeekToast(e instanceof Error ? e.message : '数据智能探查打开失败')
  } finally {
    seekOpening[id] = false
  }
}

function fallbackBgForCenter(centerId: string): string {
  return centerId === 'chem' ? chemAllDataBg : tpdcAllDataBg
}

/** 接口 backGroundUrl → 可在当前页安全展示的地址（避开 HTTPS 混入 HTTP） */
function pickPageBackground(apiBg: string, centerId: string): string {
  const fallback = fallbackBgForCenter(centerId)
  const url = String(apiBg || '').trim()
  if (!url) return fallback
  if (!isMixedContentBackgroundUrl(url)) return url
  // ChemDC 仅有 http banner，使用同图本地资源
  if (centerId === 'chem' || /chemdc\.casdc\.cn/i.test(url)) return chemAllDataBg
  return preferHttpsBackgroundUrl(url)
}

async function load() {
  loading.value = true
  error.value = ''
  try {
    const bg = await resolveBackgroundUrlByCenterId(activeCenter.value.id)
    pageBgUrl.value = pickPageBackground(bg, activeCenter.value.id)
    items.value = await fetchDataCenterDatasets(activeCenter.value)
  } catch (e: unknown) {
    items.value = []
    error.value = e instanceof Error ? e.message : '加载失败'
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  authStore.syncFromStorage()
  void load()
})

watch(
  () => String(route.query.center || 'tpdc'),
  () => {
    void load()
  }
)
</script>

<style scoped>
.pangeo-page {
  --pg-bg: #f0f2f5;
  --pg-ink: #0f1c2e;
  --pg-muted: #64748b;
  --pg-line: #e6ebf0;
  --pg-navy: #1a365d;
  --pg-primary: #2563eb;
  min-height: 100vh;
  background-color: var(--pg-bg);
  background-size: cover;
  background-position: center top;
  background-repeat: no-repeat;
  background-attachment: fixed;
  color: var(--pg-ink);
  font-family: 'Noto Sans SC', 'PingFang SC', 'Microsoft YaHei', sans-serif;
  padding-bottom: calc(3.75rem + env(safe-area-inset-bottom, 0px));
}

@media (min-width: 768px) {
  .pangeo-page {
    padding-bottom: 1.5rem;
  }
}

.pangeo-btn {
  display: inline-flex;
  align-items: center;
  gap: 0.3rem;
  height: 2.25rem;
  padding: 0 0.9rem;
  border: 1px solid transparent;
  border-radius: 0.35rem;
  background: var(--pg-navy);
  color: #fff;
  font-size: 0.8125rem;
  font-weight: 600;
  cursor: pointer;
}

.pangeo-main {
  max-width: 1120px;
  margin: 0 auto;
  padding: 1.5rem 1.25rem 2rem;
}

.pangeo-toolbar {
  margin-bottom: 1rem;
}

.pangeo-search {
  position: relative;
  display: flex;
  align-items: center;
  gap: 0.45rem;
  height: 2.5rem;
  padding: 0 0.75rem 0 0.85rem;
  background: #fff;
  border: 1px solid var(--pg-line);
  border-radius: 0.45rem;
  box-shadow: 0 1px 2px rgba(15, 28, 46, 0.03);
}

.pangeo-search iconify-icon {
  flex-shrink: 0;
  font-size: 1.25rem;
  color: #94a3b8;
}

.pangeo-search input {
  flex: 1;
  min-width: 0;
  height: 100%;
  border: 0;
  outline: none;
  background: transparent;
  font: inherit;
  font-size: 0.9375rem;
  color: var(--pg-ink);
}

.pangeo-search input::placeholder {
  color: #94a3b8;
}

.pangeo-search:focus-within {
  border-color: #93c5fd;
  box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.12);
}

.pangeo-search__clear {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 1.6rem;
  height: 1.6rem;
  border: 0;
  border-radius: 999px;
  background: #f1f5f9;
  color: #64748b;
  cursor: pointer;
}

.pangeo-search__clear:hover {
  background: #e2e8f0;
}

.pangeo-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 0.75rem;
  min-height: 14rem;
  color: var(--pg-muted);
  font-size: 0.9375rem;
  background: #fff;
  border: 1px solid var(--pg-line);
  border-radius: 0.85rem;
}

.pangeo-state--error {
  color: #b91c1c;
}

.pangeo-grid {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.pangeo-card {
  display: flex;
  gap: 1rem;
  padding: 0.9rem 1rem;
  min-width: 0;
  background: #fff;
  border: 1px solid rgba(15, 28, 46, 0.06);
  border-radius: 0.85rem;
  box-shadow: 0 4px 14px rgba(15, 28, 46, 0.04);
  transition: box-shadow 0.2s ease, transform 0.2s ease;
}

.pangeo-card:hover {
  box-shadow: 0 10px 24px rgba(15, 28, 46, 0.08);
  transform: translateY(-1px);
}

.pangeo-card__thumb {
  flex-shrink: 0;
  width: 7.5rem;
  height: 5.5rem;
  border-radius: 0.65rem;
  background: #f1f5f9;
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: center;
}

.pangeo-card__thumb--placeholder {
  background: linear-gradient(135deg, #1e4a73 0%, #2f6ea5 55%, #3d8f7a 100%);
}

.pangeo-card__thumb img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 0.4s ease;
}

.group:hover .pangeo-card__thumb img {
  transform: scale(1.06);
}

.pangeo-card__thumb-label {
  color: rgba(255, 255, 255, 0.92);
  font-size: 0.95rem;
  font-weight: 700;
  letter-spacing: 0.08em;
}

.pangeo-card__info {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
}

.pangeo-card__title-row {
  display: flex;
  align-items: flex-start;
  gap: 0.75rem;
}

.pangeo-card__info h4 {
  margin: 0;
  flex: 1;
  min-width: 0;
  font-size: 1.05rem;
  font-weight: 700;
  color: var(--pg-ink);
  line-height: 1.4;
  display: -webkit-box;
  -webkit-line-clamp: 1;
  line-clamp: 1;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.pangeo-card__seek {
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

.pangeo-card__seek:hover:not(:disabled) {
  background: #dbeafe;
  border-color: #93c5fd;
  color: #1e40af;
}

.pangeo-card__seek:disabled {
  opacity: 0.7;
  cursor: wait;
}

.pangeo-card__seek-icon {
  width: 1.15rem;
  height: 1.15rem;
  border-radius: 0.28rem;
  object-fit: cover;
  flex-shrink: 0;
}

.pangeo-card__seek iconify-icon {
  font-size: 0.95rem;
}

.pangeo-toast {
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
  font-weight: 600;
  box-shadow: 0 10px 30px rgba(15, 23, 42, 0.2);
}

@media (min-width: 768px) {
  .pangeo-toast {
    bottom: 1.5rem;
  }
}

.pangeo-card__summary {
  margin: 0.4rem 0 0;
  flex: 1;
  font-size: 0.875rem;
  line-height: 1.55;
  color: #64748b;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.pangeo-card__foot {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  margin-top: 0.5rem;
  padding-top: 0.45rem;
  border-top: 1px solid #f1f5f9;
  font-size: 0.8125rem;
  color: #94a3b8;
}

.pangeo-card__authors {
  flex: 1;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  color: #64748b;
}

.pangeo-card__source {
  flex-shrink: 0;
  padding: 0.15rem 0.45rem;
  border-radius: 0.25rem;
  background: #eff6ff;
  color: var(--pg-primary);
  font-size: 0.75rem;
  font-weight: 700;
  line-height: 1.3;
}

.pangeo-card__time {
  flex-shrink: 0;
  color: #94a3b8;
  white-space: nowrap;
}

@media (max-width: 560px) {
  .pangeo-card {
    flex-direction: column;
  }

  .pangeo-card__thumb {
    width: 100%;
    height: 8rem;
  }
}
</style>
