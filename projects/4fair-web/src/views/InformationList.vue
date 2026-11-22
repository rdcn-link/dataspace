<template>
  <div class="consult-page">
    <div class="consult-page__decor" aria-hidden="true">
      <div class="bg-blob blob-1"></div>
      <div class="bg-blob blob-2"></div>
    </div>

    <nav class="glass-nav fixed top-0 w-full z-50 hidden md:block">
      <div class="relative max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-2">
        <div class="flex items-center space-x-2 group cursor-pointer shrink-0 z-10" @click="router.push('/home')">
          <BrandLogo size="md" interactive />
          <span class="text-lg sm:text-xl font-bold tracking-tight text-slate-900">费尔空间</span>
        </div>
        <SiteTopNavLinks active="headlines" />
        <div class="flex items-center space-x-2 sm:space-x-4 shrink-0 z-10">
          <UserCenterNavButton />
          <template v-if="!authStore.isLoggedIn">
            <button
              type="button"
              class="btn-gradient text-white font-bold py-2 px-4 sm:px-5 rounded-xl transition-all text-sm"
              @click="goToLogin"
            >
              登录
            </button>
          </template>
          <template v-else>
            <span class="hidden sm:inline text-sm text-slate-600">欢迎您，{{ authStore.displayName }}</span>
            <button
              type="button"
              class="text-xs text-slate-400 hover:text-red-500 transition-colors px-2 py-1"
              @click="handleLogout"
            >
              退出
            </button>
          </template>
        </div>
      </div>
    </nav>

    <main class="consult-main">
      <div class="consult-shell">
        <div class="consult-panel">
          <div class="consult-layout">
            <section class="consult-section consult-section--main">
              <div v-if="loading && !items.length" class="consult-state">
                <iconify-icon class="animate-spin text-blue-600" icon="mdi:loading"></iconify-icon>
                <span>加载资讯中…</span>
              </div>
              <p v-else-if="error && !items.length" class="consult-error">{{ error }}</p>
              <template v-else>
                <ul v-if="items.length" class="consult-list">
                  <li v-for="item in items" :key="item.id">
                    <article class="consult-row tech-card">
                      <button
                        v-if="item.thumbUrl && !coverFailed.has(item.id)"
                        type="button"
                        class="consult-row__cover consult-row__cover--btn"
                        @click="openArticle(item)"
                      >
                        <img
                          :src="item.thumbUrl"
                          :alt="item.name"
                          loading="lazy"
                          @error="onCoverError(item.id)"
                        />
                      </button>
                      <div class="consult-row__body">
                        <h3 class="consult-row__title">
                          <button
                            v-if="item.articleUrl"
                            type="button"
                            class="consult-row__title-btn"
                            @click="openArticle(item)"
                          >{{ item.name }}</button>
                          <span v-else>{{ item.name }}</span>
                        </h3>
                        <p class="consult-row__summary">{{ item.summaryText }}</p>
                        <div class="consult-row__foot">
                          <span>{{ item.source || '—' }}</span>
                          <time>{{ item.publishedAt }}</time>
                        </div>
                      </div>
                    </article>
                  </li>
                </ul>
                <p v-else class="consult-empty">暂无资讯内容</p>

                <div
                  v-if="items.length"
                  ref="loadMoreSentinel"
                  class="consult-load-more"
                  aria-live="polite"
                >
                  <div v-if="loadingMore" class="consult-load-more__state">
                    <iconify-icon class="animate-spin text-blue-600" icon="mdi:loading"></iconify-icon>
                    <span>加载更多…</span>
                  </div>
                  <p v-else-if="!hasMore" class="consult-load-more__end">已加载全部 {{ total }} 条资讯</p>
                </div>
              </template>
            </section>

            <aside
              v-if="hotDatasets.length || hotItems.length"
              class="consult-sidebar"
              aria-label="热门推荐"
            >
              <section v-if="hotDatasets.length" class="consult-side-card consult-side-card--datasets">
                <header class="consult-side-card__head">
                  <h2 class="consult-side-card__title">热门数据集</h2>
                </header>
                <ul class="consult-side-card__list">
                  <li v-for="item in hotDatasets" :key="item.cstr">
                    <a
                      :href="assetDetailHref(item.cstr)"
                      class="consult-side-card__dataset-link"
                      target="_blank"
                      rel="noopener noreferrer"
                      :title="item.title"
                    >
                      <span class="consult-side-card__dataset-name">{{ item.title }}</span>
                      <span class="consult-side-card__dataset-source">{{ item.source }}</span>
                    </a>
                  </li>
                </ul>
              </section>

              <section v-if="hotItems.length" class="consult-side-card consult-side-card--news">
                <header class="consult-side-card__head">
                  <h2 class="consult-side-card__title">热门资讯</h2>
                </header>
                <ol class="consult-side-card__list consult-side-card__list--ranked">
                  <li v-for="(item, index) in hotItems" :key="item.id">
                    <button
                      v-if="item.articleUrl"
                      type="button"
                      class="consult-side-card__link"
                      :title="item.name"
                      @click="openArticle(item)"
                    >
                      <span
                        class="consult-side-card__rank"
                        :class="{
                          'consult-side-card__rank--1': index === 0,
                          'consult-side-card__rank--2': index === 1,
                          'consult-side-card__rank--3': index === 2
                        }"
                      >{{ index + 1 }}</span>
                      <span class="consult-side-card__text">{{ item.name }}</span>
                    </button>
                    <span v-else class="consult-side-card__link consult-side-card__link--static">
                      <span class="consult-side-card__rank">{{ index + 1 }}</span>
                      <span class="consult-side-card__text">{{ item.name }}</span>
                    </span>
                  </li>
                </ol>
              </section>
            </aside>
          </div>
        </div>
      </div>
    </main>

    <AppFooter />
    <SiteBottomTabBar active="headlines" />
  </div>
</template>

<script setup lang="ts">
import { computed, nextTick, onMounted, onUnmounted, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { goLogin } from '@/utils/loginRedirect'
import { useAuthStore } from '@/stores/auth'
import BrandLogo from '@/components/BrandLogo.vue'
import SiteBottomTabBar from '@/components/SiteBottomTabBar.vue'
import SiteTopNavLinks from '@/components/SiteTopNavLinks.vue'
import UserCenterNavButton from '@/components/UserCenterNavButton.vue'
import AppFooter from '@/components/AppFooter.vue'
import { assetDetailPath } from '@/utils/cstrUrl'
import { openInformationArticleWindow } from '@/utils/openInformationArticle'
import {
  fetchInformationPage,
  formatInformationDate,
  getInformationArticleUrl,
  getInformationThumbUrl,
  informationSummary,
  type InformationRecord
} from '@/utils/informationApi'

const HOT_DATASETS = [
  {
    cstr: '18406.11.SolidEar.tpdc.272442',
    title: '雅鲁藏布江流域松散沉积物数据集',
    source: '国家青藏高原科学数据中心'
  },
  {
    cstr: '18406.11.Atmos.tpdc.302428',
    title: '青藏高原地-气间水分、热量与CO₂通量数据集',
    source: '国家青藏高原科学数据中心'
  },
  {
    cstr: '18406.11.Terre.tpdc.302923',
    title: '中国区域1 km分辨率多源融合土壤湿度数据集（2000-2025）',
    source: '国家青藏高原科学数据中心'
  }
] as const

const PAGE_SIZE = 10
const HOT_COUNT = 5

type InformationCard = InformationRecord & {
  summaryText: string
  publishedAt: string
  articleUrl: string
  thumbUrl: string
}

const router = useRouter()
const authStore = useAuthStore()

const hotDatasets = HOT_DATASETS
const loading = ref(false)
const loadingMore = ref(false)
const error = ref('')
const total = ref(0)
const currentPage = ref(0)
const items = ref<InformationCard[]>([])
const hotItems = ref<InformationCard[]>([])
const coverFailed = ref(new Set<string>())
const loadMoreSentinel = ref<HTMLElement | null>(null)

const hasMore = computed(() => items.value.length < total.value)

let loadMoreObserver: IntersectionObserver | null = null

function assetDetailHref(cstr: string) {
  return assetDetailPath(cstr)
}

function openArticle(item: InformationCard) {
  openInformationArticleWindow(router, item.id, item)
}

function mapCard(row: InformationRecord): InformationCard {
  return {
    ...row,
    summaryText: informationSummary(row.description),
    publishedAt: formatInformationDate(row.updateAt),
    articleUrl: getInformationArticleUrl(row),
    thumbUrl: getInformationThumbUrl(row)
  }
}

async function loadList(reset = false) {
  if (reset) {
    loading.value = true
    error.value = ''
    currentPage.value = 0
    items.value = []
    hotItems.value = []
    total.value = 0
  } else if (loading.value || loadingMore.value || !hasMore.value) {
    return
  } else {
    loadingMore.value = true
  }

  const nextPage = reset ? 1 : currentPage.value + 1

  try {
    const result = await fetchInformationPage({
      page: nextPage,
      pageSize: PAGE_SIZE
    })
    total.value = result.total
    const mapped = result.rows.map(mapCard)

    if (reset) {
      items.value = mapped
      hotItems.value = mapped.slice(0, HOT_COUNT)
    } else {
      const existingIds = new Set(items.value.map((row) => row.id))
      items.value = [...items.value, ...mapped.filter((row) => !existingIds.has(row.id))]
    }

    currentPage.value = nextPage
  } catch (e: unknown) {
    if (reset) {
      error.value = e instanceof Error ? e.message : '网络错误，请稍后重试'
      items.value = []
      hotItems.value = []
      total.value = 0
      currentPage.value = 0
    }
  } finally {
    if (reset) {
      loading.value = false
    } else {
      loadingMore.value = false
    }
  }
}

function loadMore() {
  void loadList(false)
}

function setupLoadMoreObserver() {
  loadMoreObserver?.disconnect()
  loadMoreObserver = null

  const el = loadMoreSentinel.value
  if (!el || !hasMore.value) return

  loadMoreObserver = new IntersectionObserver(
    (entries) => {
      if (entries.some((entry) => entry.isIntersecting)) {
        loadMore()
      }
    },
    { root: null, rootMargin: '160px 0px', threshold: 0 }
  )
  loadMoreObserver.observe(el)
}

function teardownLoadMoreObserver() {
  loadMoreObserver?.disconnect()
  loadMoreObserver = null
}

function onCoverError(id: string) {
  coverFailed.value.add(id)
}

function goToLogin() {
  void goLogin(router, router.currentRoute.value.fullPath)
}

function handleLogout() {
  authStore.logout()
}

watch([loadMoreSentinel, hasMore, () => items.value.length], () => {
  void nextTick(() => setupLoadMoreObserver())
})

onMounted(() => {
  void loadList(true)
})

onUnmounted(() => {
  teardownLoadMoreObserver()
})
</script>

<style scoped>
.consult-page {
  font-family: 'Inter', 'Microsoft YaHei', sans-serif;
  background: linear-gradient(135deg, #f8fafc 0%, #eff6ff 50%, #f5f3ff 100%);
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  position: relative;
  width: 100%;
  max-width: 100%;
  padding-bottom: calc(3.75rem + env(safe-area-inset-bottom, 0px));
}

@media (min-width: 768px) {
  .consult-page {
    padding-bottom: 0;
  }
}

.consult-page__decor {
  position: fixed;
  inset: 0;
  overflow: hidden;
  pointer-events: none;
  z-index: 0;
}

.consult-page__decor .bg-blob {
  position: absolute;
  border-radius: 50%;
  filter: blur(80px);
  opacity: 0.35;
  pointer-events: none;
}

.consult-page__decor .blob-1 {
  width: 420px;
  height: 420px;
  background: #93c5fd;
  top: -120px;
  right: -80px;
}

.consult-page__decor .blob-2 {
  width: 360px;
  height: 360px;
  background: #c4b5fd;
  bottom: 120px;
  left: -100px;
}

.glass-nav {
  background: rgba(255, 255, 255, 0.8);
  backdrop-filter: blur(20px);
  border-bottom: 1px solid rgba(226, 232, 240, 0.3);
}

.consult-main {
  position: relative;
  z-index: 1;
  flex: 1;
  display: flex;
  flex-direction: column;
  min-height: 0;
  width: 100%;
  padding-top: 1rem;
  padding-bottom: 2rem;
  box-sizing: border-box;
}

@media (min-width: 768px) {
  .consult-main {
    padding-top: 4rem;
  }
}

.consult-shell {
  width: 100%;
  max-width: 80rem;
  margin-left: auto;
  margin-right: auto;
  padding-left: 1.5rem;
  padding-right: 1.5rem;
  box-sizing: border-box;
}

.consult-panel {
  width: 100%;
  min-width: 0;
  padding: 1.25rem;
  background: rgba(241, 245, 249, 0.98);
  border: 1px solid rgba(203, 213, 225, 0.85);
  border-radius: 1rem;
  box-sizing: border-box;
}

.consult-section--main {
  min-width: 0;
}

.consult-layout {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(0, 18rem);
  gap: 1.25rem;
  align-items: stretch;
  width: 100%;
  min-width: 0;
}

.consult-sidebar {
  align-self: stretch;
  display: flex;
  flex-direction: column;
  gap: 1rem;
  width: 100%;
  min-width: 0;
  min-height: 100%;
}

.consult-side-card--datasets {
  flex-shrink: 0;
}

.consult-side-card--news {
  position: sticky;
  top: 4rem;
  z-index: 20;
  align-self: start;
  flex-shrink: 0;
}

.consult-side-card {
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(12px);
  border: 1px solid rgba(226, 232, 240, 0.9);
  border-radius: 0.75rem;
  padding: 1rem 1.1rem;
  box-shadow:
    0 4px 6px rgba(15, 23, 42, 0.04),
    0 12px 28px rgba(15, 23, 42, 0.08);
}

.consult-side-card__head {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 0.75rem;
  padding-bottom: 0.65rem;
  border-bottom: 1px solid #e2e8f0;
}

.consult-side-card__head::before {
  content: '';
  flex-shrink: 0;
  width: 3px;
  height: 0.9rem;
  border-radius: 2px;
  background: linear-gradient(180deg, #3b82f6, #6366f1);
}

.consult-side-card--datasets .consult-side-card__head::before {
  background: linear-gradient(180deg, #0ea5e9, #2563eb);
}

.consult-side-card__title {
  margin: 0;
  font-size: 0.9375rem;
  font-weight: 800;
  color: #0f172a;
}

.consult-side-card__list {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 0.55rem;
}

.consult-side-card__link {
  display: flex;
  align-items: flex-start;
  gap: 0.55rem;
  padding: 0.35rem 0.4rem;
  margin: 0 -0.4rem;
  border-radius: 0.5rem;
  color: #334155;
  text-decoration: none;
  line-height: 1.5;
  width: 100%;
  border: none;
  background: none;
  font: inherit;
  text-align: left;
  cursor: pointer;
}

.consult-side-card__link:hover {
  background: rgba(59, 130, 246, 0.06);
}

.consult-side-card__link:hover .consult-side-card__text {
  color: #2563eb;
}

.consult-side-card__link--static {
  cursor: default;
  color: #334155;
}

.consult-side-card__rank {
  flex-shrink: 0;
  width: 1.35rem;
  font-size: 0.8125rem;
  font-weight: 800;
  color: #94a3b8;
  text-align: center;
}

.consult-side-card__rank--1 { color: #dc2626; }
.consult-side-card__rank--2 { color: #ea580c; }
.consult-side-card__rank--3 { color: #d97706; }

.consult-side-card__text {
  flex: 1;
  min-width: 0;
  font-size: 0.8125rem;
  font-weight: 600;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.consult-side-card__dataset-link {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  padding: 0.4rem 0.45rem;
  margin: 0 -0.45rem;
  border-radius: 0.5rem;
  color: #334155;
  text-decoration: none;
}

.consult-side-card__dataset-link:hover {
  background: rgba(59, 130, 246, 0.06);
}

.consult-side-card__dataset-name {
  font-size: 0.8125rem;
  font-weight: 600;
  line-height: 1.45;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.consult-side-card__dataset-source {
  font-size: 0.6875rem;
  color: #94a3b8;
}

.tech-card {
  background: rgba(255, 255, 255, 0.85);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(226, 232, 240, 0.6);
}

.consult-list {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 0.85rem;
}

.consult-row {
  display: flex;
  align-items: stretch;
  gap: 1rem;
  padding: 1rem 1.15rem;
  border-radius: 0.85rem;
}

.consult-row__cover {
  flex-shrink: 0;
  width: 8.5rem;
  border-radius: 0.625rem;
  overflow: hidden;
  align-self: center;
}

.consult-row__cover--btn {
  padding: 0;
  border: none;
  background: none;
  cursor: pointer;
}

.consult-row__cover img {
  width: 100%;
  aspect-ratio: 16 / 9;
  display: block;
  object-fit: cover;
}

.consult-row__body {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
}

.consult-row__title {
  margin: 0;
  font-size: 0.9375rem;
  font-weight: 800;
  color: #0f172a;
  line-height: 1.45;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.consult-row__title a {
  color: inherit;
  text-decoration: none;
}

.consult-row__title-btn {
  padding: 0;
  border: none;
  background: none;
  font: inherit;
  font-weight: inherit;
  color: inherit;
  text-align: left;
  cursor: pointer;
}

.consult-row__title a:hover,
.consult-row__title-btn:hover {
  color: #2563eb;
}

.consult-row__summary {
  margin: 0;
  font-size: 0.8125rem;
  color: #64748b;
  line-height: 1.5;
  text-indent: 2em;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.consult-row__foot {
  display: flex;
  justify-content: space-between;
  gap: 0.75rem;
  font-size: 0.75rem;
  color: #94a3b8;
}

.consult-empty {
  text-align: center;
  padding: 3rem 1rem;
  color: #94a3b8;
}

.consult-state,
.consult-error {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  min-height: 12rem;
  color: #64748b;
}

.consult-error {
  color: #dc2626;
}

.consult-load-more {
  min-height: 3rem;
  margin-top: 1.25rem;
  padding-top: 1.25rem;
  border-top: 1px solid #e2e8f0;
}

.consult-load-more__state,
.consult-load-more__end {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  margin: 0;
  min-height: 2.5rem;
  font-size: 0.8125rem;
  color: #94a3b8;
}

.consult-load-more__state {
  color: #64748b;
}

@media (max-width: 1024px) {
  .consult-layout {
    grid-template-columns: 1fr;
  }

  .consult-side-card--news {
    position: static;
  }
}

@media (max-width: 768px) {
  .consult-row {
    flex-direction: column;
  }

  .consult-row__cover {
    width: 100%;
  }
}
</style>
