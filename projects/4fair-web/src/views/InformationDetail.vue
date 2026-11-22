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

    <main class="consult-main consult-main--article">
      <div class="consult-shell consult-shell--article">
        <div class="info-article-layout">
          <div class="consult-panel consult-panel--article">
            <div v-if="pageLoading" class="info-article-loading" role="status" aria-live="polite">
              <div class="info-article-loading__ring" aria-hidden="true"></div>
              <p class="info-article-loading__text">{{ loadingText }}</p>
            </div>

            <p v-if="error" class="info-article-error">{{ error }}</p>

            <div
              v-if="articleEmbed && !error"
              ref="articleHostRef"
              class="info-article-host"
            ></div>

            <iframe
              v-else-if="articleUrl && useIframeFallback && !error"
              class="info-article-frame"
              :src="articleUrl"
              :title="item?.name || '资讯详情'"
              @load="onIframeFallbackLoad"
            ></iframe>

            <article
              v-else-if="!metaLoading && !articleLoading && !error && item && (!articleUrl || articleUnavailable)"
              class="info-article-fallback tech-card"
            >
              <h1 class="info-article-fallback__title">{{ item.name }}</h1>
              <p v-if="articleUnavailable" class="info-article-fallback__hint">
                原文页面暂不可用（远端文件不存在或未发布）
              </p>
              <p class="info-article-fallback__text">{{ bodyText || '暂无摘要' }}</p>
            </article>

            <p v-else-if="!metaLoading && !articleLoading && !error" class="info-article-state">未找到该资讯</p>

            <footer v-if="showArticleFooter" class="info-article-footer">
              <section
                v-if="relatedDatasets.length"
                class="info-article-datasets"
                aria-label="数据集详情链接"
              >
                <div
                  v-for="dataset in relatedDatasets"
                  :key="dataset.cstr"
                  class="info-article-datasets__block"
                >
                  <p class="info-article-datasets__label">查看数据集详情，请点击⬇️：</p>
                  <div class="info-article-datasets__content">
                    <a
                      :href="dataset.href"
                      class="info-article-datasets__link"
                      target="_blank"
                      rel="noopener noreferrer"
                      :title="dataset.title"
                    >{{ dataset.title }}</a>
                    <a
                      v-if="dataset.source && dataset.sourceHomeUrl"
                      :href="dataset.sourceHomeUrl"
                      class="info-article-datasets__source-link"
                      target="_blank"
                      rel="noopener noreferrer"
                      :title="`访问${dataset.source}官网`"
                    >{{ dataset.source }}</a>
                    <span v-else-if="dataset.source" class="info-article-datasets__source-text">{{ dataset.source }}</span>
                  </div>
                </div>
              </section>

              <p class="info-article-reprint">
                以上内容转载于互联网，为学术分享，仅供科研交流，如有错误/侵权等，请联系修改或删除。
              </p>
            </footer>
          </div>

          <aside
            v-if="otherItems.length || otherLoading"
            class="info-article-sidebar info-article-sidebar--right"
            aria-label="相关推荐"
          >
            <div class="info-article-sidebar__stack">
              <section class="consult-side-card consult-side-card--news">
                <header class="consult-side-card__head">
                  <h2 class="consult-side-card__title">相关资讯</h2>
                  <a
                    v-if="informationSource?.homeUrl"
                    :href="informationSource.homeUrl"
                    class="consult-side-card__source-inline"
                    target="_blank"
                    rel="noopener noreferrer"
                    :title="`访问${informationSource.name}官网`"
                  >
                    <InformationSourceLogo
                      :name="informationSource.name"
                      :logo-url="informationSource.logoUrl"
                    />
                    <span class="consult-side-card__source-inline-name">{{ informationSource.name }}</span>
                  </a>
                  <span
                    v-else-if="informationSource"
                    class="consult-side-card__source-inline consult-side-card__source-inline--static"
                  >
                    <InformationSourceLogo
                      :name="informationSource.name"
                      :logo-url="informationSource.logoUrl"
                    />
                    <span class="consult-side-card__source-inline-name">{{ informationSource.name }}</span>
                  </span>
                </header>
                <ol class="consult-side-card__list consult-side-card__list--ranked">
                  <li v-for="(other, index) in otherItems" :key="other.id">
                    <button
                      type="button"
                      class="consult-side-card__link"
                      :title="other.name"
                      @click="openOtherArticle(other)"
                    >
                      <span
                        class="consult-side-card__rank"
                        :class="{
                          'consult-side-card__rank--1': index === 0,
                          'consult-side-card__rank--2': index === 1,
                          'consult-side-card__rank--3': index === 2
                        }"
                      >{{ index + 1 }}</span>
                      <span class="consult-side-card__text">{{ other.name }}</span>
                    </button>
                  </li>
                  <li v-if="otherLoading" class="consult-side-card__load-more" aria-live="polite">
                    加载中…
                  </li>
                </ol>
              </section>
            </div>
          </aside>
        </div>
      </div>
    </main>
    <SiteBottomTabBar active="headlines" />
  </div>
</template>

<script setup lang="ts">
import { computed, nextTick, onMounted, onUnmounted, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { goLogin } from '@/utils/loginRedirect'
import { useAuthStore } from '@/stores/auth'
import BrandLogo from '@/components/BrandLogo.vue'
import InformationSourceLogo from '@/components/InformationSourceLogo.vue'
import SiteBottomTabBar from '@/components/SiteBottomTabBar.vue'
import SiteTopNavLinks from '@/components/SiteTopNavLinks.vue'
import UserCenterNavButton from '@/components/UserCenterNavButton.vue'
import {
  fetchInformationById,
  fetchInformationPage,
  fetchInformationRelatedDatasets,
  getInformationArticleUrl,
  type InformationRecord,
  type InformationRelatedDataset
} from '@/utils/informationApi'
import {
  canEmbedInformationArticle,
  clearInformationArticleShadow,
  fetchInformationArticleEmbed,
  isInformationArticleEmbedVisible,
  renderInformationArticleShadow,
  type InformationArticleEmbed
} from '@/utils/informationArticleEmbed'
import { openInformationArticleWindow, readCachedInformationItem } from '@/utils/openInformationArticle'
import { resolveInformationSourceCard } from '@/utils/informationSourceSites'
import { stripHtml } from '@/utils/richText'

const props = defineProps<{
  id: string
}>()

const router = useRouter()
const authStore = useAuthStore()

const metaLoading = ref(true)
const articleLoading = ref(false)
const error = ref('')
const item = ref<InformationRecord | null>(null)
const articleEmbed = ref<InformationArticleEmbed | null>(null)
const articleHostRef = ref<HTMLElement | null>(null)
const useIframeFallback = ref(false)
/** 原文 URL 指向的 HTML 实际是站点壳 / 文件缺失 */
const articleUnavailable = ref(false)
const otherItems = ref<InformationRecord[]>([])
const otherLoading = ref(false)
const relatedDatasets = ref<InformationRelatedDataset[]>([])
const datasetsLoading = ref(false)

const RELATED_COUNT = 4

const articleUrl = computed(() =>
  item.value ? getInformationArticleUrl(item.value) : ''
)

const informationSource = computed(() => {
  if (!item.value?.source?.trim()) return null
  return resolveInformationSourceCard({
    source: item.value.source,
    sourceUrl: item.value.sourceUrl,
    sourceLogoUrl: item.value.sourceLogoUrl,
    articleUrl: articleUrl.value
  })
})

const pageLoading = computed(() => metaLoading.value || articleLoading.value)

const loadingText = computed(() =>
  metaLoading.value ? '正在获取资讯…' : '正在加载文章内容…'
)

const bodyText = computed(() => {
  if (!item.value) return ''
  return stripHtml(item.value.description)
})

const showArticleFooter = computed(() => {
  if (metaLoading.value || articleLoading.value || error.value || !item.value) return false
  if (articleEmbed.value) return true
  if (articleUrl.value && useIframeFallback.value) return true
  if (articleUnavailable.value) return true
  return !articleUrl.value && Boolean(bodyText.value)
})

async function mountArticleEmbed() {
  await nextTick()
  if (!articleEmbed.value || !articleHostRef.value) return
  renderInformationArticleShadow(articleHostRef.value, articleEmbed.value)
}

async function loadArticleContent() {
  const url = articleUrl.value
  if (!url) {
    articleEmbed.value = null
    useIframeFallback.value = false
    articleUnavailable.value = false
    clearInformationArticleShadow(articleHostRef.value)
    return
  }

  articleLoading.value = true
  articleEmbed.value = null
  useIframeFallback.value = false
  articleUnavailable.value = false
  clearInformationArticleShadow(articleHostRef.value)

  try {
    const embed = await fetchInformationArticleEmbed(url)
    articleEmbed.value = embed
    await mountArticleEmbed()
    if (!isInformationArticleEmbedVisible(articleHostRef.value)) {
      throw new Error('文章内容渲染为空')
    }
  } catch {
    articleEmbed.value = null
    clearInformationArticleShadow(articleHostRef.value)
    // 仅当远端确有可用 HTML 时才 iframe；否则展示摘要，避免嵌套 SPA 空白页
    const canIframe = await canEmbedInformationArticle(url)
    if (canIframe) {
      useIframeFallback.value = true
    } else {
      articleUnavailable.value = true
    }
  } finally {
    articleLoading.value = false
  }
}

function onIframeFallbackLoad() {
  articleLoading.value = false
}

function applyItem(record: InformationRecord | null) {
  item.value = record
}

async function loadRelatedDatasets() {
  if (!item.value) {
    relatedDatasets.value = []
    return
  }

  datasetsLoading.value = true
  try {
    relatedDatasets.value = await fetchInformationRelatedDatasets(item.value)
  } catch {
    relatedDatasets.value = []
  } finally {
    datasetsLoading.value = false
  }
}

async function loadRelatedNews() {
  const source = item.value?.source?.trim()
  if (!source) {
    otherItems.value = []
    return
  }

  otherLoading.value = true
  try {
    const { rows } = await fetchInformationPage({
      page: 1,
      pageSize: RELATED_COUNT + 5,
      source
    })
    otherItems.value = rows
      .filter((row) => row.id !== props.id && getInformationArticleUrl(row))
      .slice(0, RELATED_COUNT)
  } catch {
    otherItems.value = []
  } finally {
    otherLoading.value = false
  }
}

function openOtherArticle(record: InformationRecord) {
  openInformationArticleWindow(router, record.id, record)
}

async function loadDetail() {
  metaLoading.value = true
  error.value = ''
  articleLoading.value = false
  articleEmbed.value = null
  useIframeFallback.value = false
  articleUnavailable.value = false
  relatedDatasets.value = []
  clearInformationArticleShadow(articleHostRef.value)

  const cached = readCachedInformationItem(props.id)
  if (cached) {
    applyItem(cached)
    metaLoading.value = false
    return
  }

  try {
    const record = await fetchInformationById(props.id)
    if (!record) {
      error.value = '资讯不存在或已下线'
      item.value = null
      return
    }
    applyItem(record)
  } catch (e: unknown) {
    error.value = e instanceof Error ? e.message : '加载失败，请稍后重试'
    item.value = null
  } finally {
    metaLoading.value = false
  }
}

watch(
  () => articleHostRef.value,
  () => {
    void mountArticleEmbed()
  }
)

watch(
  () => [articleUrl.value, metaLoading.value] as const,
  ([url, loading]) => {
    if (!loading && url && item.value) {
      void loadArticleContent()
    }
  }
)

watch(
  () => item.value?.id,
  (id) => {
    if (!id) {
      relatedDatasets.value = []
      return
    }
    void loadRelatedDatasets()
  }
)

watch(
  () => [props.id, item.value?.source] as const,
  ([id, source]) => {
    if (!id || !source) {
      otherItems.value = []
      return
    }
    void loadRelatedNews()
  }
)

watch(
  () => props.id,
  (id) => {
    if (!id) return
    void loadDetail()
  }
)

function goToLogin() {
  void goLogin(router, router.currentRoute.value.fullPath)
}

function handleLogout() {
  authStore.logout()
}

onMounted(() => {
  if (!props.id) {
    metaLoading.value = false
    error.value = '无效的资讯标识'
    return
  }
  loadDetail()
})

onUnmounted(() => {
  clearInformationArticleShadow(articleHostRef.value)
})
</script>

<style scoped>
.consult-page {
  font-family: 'Inter', 'Microsoft YaHei', sans-serif;
  background: #f1f5f9;
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  position: relative;
  overflow-x: clip;
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

.consult-main--article {
  padding-top: 1rem;
  padding-bottom: 2rem;
  padding-left: 0.75rem;
  padding-right: 0.75rem;
}

@media (min-width: 768px) {
  .consult-main--article {
    padding-top: 4rem;
    padding-left: 7rem;
    padding-right: 7rem;
  }
}

.consult-shell--article {
  width: 100%;
  max-width: none;
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

.info-article-layout {
  display: flex;
  flex-direction: column;
  align-items: stretch;
  width: 100%;
  gap: 0.75rem;
  --sidebar-list-gap: 0.55rem;
  --news-row-height: 3.25rem;
  --news-visible-rows: 4;
  --dataset-row-gap: 0.65rem;
}

.info-article-sidebar {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  flex: 0 0 auto;
  width: 100%;
  min-width: 0;
  height: auto;
  padding: 0.5rem 0 0;
  box-sizing: border-box;
  overflow: visible;
  border-top: 1px solid #e2e8f0;
}

.info-article-sidebar--right {
  width: 100%;
  max-width: none;
}

.info-article-sidebar__stack {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  width: 100%;
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

.consult-side-card__source-inline {
  margin-left: auto;
  display: inline-flex;
  align-items: center;
  gap: 0.45rem;
  max-width: min(60%, 22rem);
  min-width: 0;
  font-size: 0.8125rem;
  font-weight: 600;
  color: #0284c7;
  text-decoration: none;
  transition: color 0.15s;
}

.consult-side-card__source-inline :deep(.information-source-logo) {
  width: 1.5rem;
  height: 1.5rem;
  border-radius: 0.35rem;
}

.consult-side-card__source-inline-name {
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.consult-side-card__source-inline:hover {
  color: #0369a1;
}

.consult-side-card__source-inline:hover .consult-side-card__source-inline-name {
  text-decoration: underline;
}

.consult-side-card__source-inline--static {
  color: #64748b;
  cursor: default;
}

.consult-side-card__source-inline--static:hover {
  color: #64748b;
}

.consult-side-card__source-inline--static:hover .consult-side-card__source-inline-name {
  text-decoration: none;
}

.consult-side-card--news {
  flex: 1 1 auto;
  min-height: 0;
  width: 100%;
  display: flex;
  flex-direction: column;
  --news-list-visible-rows: var(--news-visible-rows);
}

.consult-side-card--datasets {
  flex: none;
  width: 100%;
  display: flex;
  flex-direction: column;
  --dataset-card-width: 100%;
  padding: 1rem 1.15rem;
}

.consult-side-card--datasets .consult-side-card__head {
  flex: 0 0 auto;
}

.consult-side-card__placeholder {
  margin: 0;
  min-height: calc(
    var(--news-list-visible-rows, var(--news-visible-rows)) * var(--news-row-height) +
    (var(--news-list-visible-rows, var(--news-visible-rows)) - 1) * var(--sidebar-list-gap)
  );
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1rem 0.5rem;
  font-size: 0.8125rem;
  color: #94a3b8;
  text-align: center;
  border: 1px dashed #e2e8f0;
  border-radius: 0.5rem;
  background: rgba(248, 250, 252, 0.8);
}

.consult-side-card__head {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 0.75rem;
  padding-bottom: 0.65rem;
  border-bottom: 1px solid #e2e8f0;
  min-width: 0;
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
  flex-shrink: 0;
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

.consult-side-card__list--ranked {
  counter-reset: none;
  gap: var(--sidebar-list-gap);
  max-height: calc(
    var(--news-list-visible-rows) * var(--news-row-height) +
    (var(--news-list-visible-rows) - 1) * var(--sidebar-list-gap)
  );
  overflow-y: auto;
  overflow-x: hidden;
  overscroll-behavior: contain;
}

.consult-side-card__list--ranked .consult-side-card__link {
  min-height: var(--news-row-height);
  box-sizing: border-box;
}

.consult-side-card__load-more {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: var(--news-row-height);
  font-size: 0.75rem;
  color: #94a3b8;
}

.consult-side-card__list--datasets {
  flex: none;
  min-height: 0;
  gap: var(--dataset-row-gap);
  overflow: visible;
  overscroll-behavior: contain;
}

.consult-side-card__dataset-item {
  width: var(--dataset-card-width);
}

.consult-side-card--datasets .consult-side-card__dataset-link {
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
  width: var(--dataset-card-width);
  box-sizing: border-box;
  padding: 0.75rem 0.85rem;
  margin: 0;
  border: 1px solid #e2e8f0;
  border-radius: 0.5rem;
  background: #fff;
  color: #334155;
  text-decoration: none;
}

.consult-side-card--datasets .consult-side-card__dataset-link:hover {
  background: rgba(59, 130, 246, 0.06);
}

.consult-side-card__empty {
  margin: 0;
  padding: 0.25rem 0;
  font-size: 0.8125rem;
  color: #94a3b8;
  text-align: center;
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

.consult-side-card__dataset-name {
  font-size: 0.8125rem;
  font-weight: 600;
  line-height: 1.45;
  display: -webkit-box;
  -webkit-line-clamp: 3;
  line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.consult-side-card__dataset-source {
  font-size: 0.6875rem;
  line-height: 1.4;
  color: #94a3b8;
}

.consult-panel--article {
  flex: 0 0 auto;
  width: 100%;
  min-width: 0;
  min-height: 0;
  display: block;
  padding: 0;
  background: #fff;
  border: none;
  border-radius: 0;
  overflow: visible;
  position: relative;
}

.consult-main {
  position: relative;
  z-index: 1;
  flex: 1 0 auto;
  display: flex;
  flex-direction: column;
  width: 100%;
  box-sizing: border-box;
  padding: 4rem 9rem;
}

.consult-shell,
.consult-panel {
  box-sizing: border-box;
}

.info-article-loading {
  position: absolute;
  inset: 0;
  z-index: 2;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 1.25rem;
  background: #fff;
}

.info-article-loading__ring {
  width: 3rem;
  height: 3rem;
  border-radius: 50%;
  border: 3px solid #e2e8f0;
  border-top-color: #2563eb;
  animation: info-article-spin 0.85s linear infinite;
}

.info-article-loading__text {
  margin: 0;
  font-size: 0.9375rem;
  font-weight: 600;
  color: #64748b;
  letter-spacing: 0.02em;
}

@keyframes info-article-spin {
  to {
    transform: rotate(360deg);
  }
}
.info-article-host { 
  display: block;
  width: 100%;
  min-height: 1px;
  padding: 2rem;
  box-sizing: border-box;
}

.info-article-footer {
  padding: 0 2rem 2rem;
  background: #fff;
}

.info-article-datasets {
  padding-top: 1.5rem;
}

.info-article-datasets__block + .info-article-datasets__block {
  margin-top: 1.25rem;
}

.info-article-datasets__label {
  margin: 0 0 0.35rem;
  font-size: 0.9375rem;
  line-height: 1.85;
  color: #334155;
}

.info-article-datasets__content {
  display: flex;
  flex-direction: column;
  gap: 0.3rem;
}

.info-article-datasets__link {
  display: inline;
  font-size: 1.0625rem;
  font-weight: 700;
  line-height: 1.85;
  color: #0f172a;
  text-decoration: none;
  word-break: break-word;
}

.info-article-datasets__link:hover {
  color: #2563eb;
  text-decoration: underline;
}

.info-article-datasets__source-link {
  display: inline;
  font-size: 0.8125rem;
  line-height: 1.6;
  color: #64748b;
  text-decoration: none;
  word-break: break-word;
}

.info-article-datasets__source-link:hover {
  color: #2563eb;
  text-decoration: underline;
}

.info-article-datasets__source-text {
  font-size: 0.8125rem;
  line-height: 1.6;
  color: #64748b;
  word-break: break-word;
}

.info-article-datasets__loading {
  margin: 0;
  font-size: 0.9375rem;
  line-height: 1.85;
  color: #94a3b8;
}

.info-article-reprint {
  margin: 1.5rem 0 0;
  font-size: 0.8125rem;
  line-height: 1.85;
  color: #94a3b8;
}

.info-article-frame {
  display: block;
  width: 100%;
  min-height: calc(100vh - 4rem);
  border: none;
  border-radius: 0;
  background: #fff;
}

.info-article-state,
.info-article-error {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  flex: 1;
  min-height: 16rem;
  color: #64748b;
}

.info-article-error {
  color: #dc2626;
}

.tech-card {
  background: rgba(255, 255, 255, 0.92);
  border: 1px solid rgba(226, 232, 240, 0.8);
  border-radius: 0.85rem;
  padding: 1.5rem;
  margin: 1.5rem;
}

.info-article-fallback__title {
  margin: 0 0 1rem;
  font-size: 1.25rem;
  font-weight: 800;
  color: #0f172a;
  line-height: 1.45;
}

.info-article-fallback__hint {
  margin: 0 0 1rem;
  font-size: 0.875rem;
  font-weight: 600;
  color: #b45309;
  line-height: 1.5;
}

.info-article-fallback__text {
  margin: 0;
  font-size: 0.9375rem;
  color: #334155;
  line-height: 1.85;
  text-indent: 2em;
  white-space: pre-wrap;
}

@media (max-width: 1200px) {
  .consult-main,
  .consult-main--article {
    padding-left: 3rem;
    padding-right: 3rem;
  }
}

@media (max-width: 1024px) {
  .consult-main,
  .consult-main--article {
    padding-left: 1.25rem;
    padding-right: 1.25rem;
  }

  .consult-side-card--datasets {
    flex: none;
    min-height: auto;
  }

  .consult-side-card__list--datasets {
    overflow: visible;
  }

  .consult-side-card--news,
  .consult-side-card--datasets {
    position: static;
  }

  .info-article-host {
    padding: 1.25rem 1rem;
  }

  .info-article-footer {
    padding: 0 1rem 1.5rem;
  }
}

@media (max-width: 640px) {
  .consult-main,
  .consult-main--article {
    padding-top: 0.75rem;
    padding-bottom: 1rem;
    padding-left: 0.75rem;
    padding-right: 0.75rem;
  }

  .consult-side-card__source-inline {
    max-width: 50%;
    font-size: 0.75rem;
  }

  .info-article-host {
    padding: 1rem 0.5rem;
    overflow-x: auto;
  }

  .info-article-footer {
    padding: 0 0.5rem 1.25rem;
  }

  .info-article-sidebar {
    padding: 0.75rem 0.25rem;
  }

  .tech-card {
    margin: 0.75rem 0;
    padding: 1rem;
  }
}
</style>
