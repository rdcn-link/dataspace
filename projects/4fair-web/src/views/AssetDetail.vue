<template>
  <div class="casdc-detail-page">
    <!-- 顶栏：费尔空间导航（桌面端） -->
    <nav class="glass-nav fixed top-0 w-full z-50 hidden md:block">
      <div class="casdc-page-shell h-16 flex items-center justify-between">
        <div class="flex items-center space-x-2 group cursor-pointer" @click="router.push('/home')">
          <BrandLogo size="lg" interactive />
          <span class="text-xl font-bold tracking-tight text-slate-900">费尔空间</span>
        </div>
        <div class="flex items-center space-x-8 text-base font-bold text-slate-600">
          <a class="hover:text-blue-600 transition-colors cursor-pointer" @click="router.push('/headlines')">头条资讯</a>
          <a class="hover:text-blue-600 transition-colors cursor-pointer" @click="goBackToList">数据目录</a>
          <a class="hover:text-blue-600 transition-colors cursor-pointer" @click="router.push('/spatial-hubs')">空间枢纽</a>
        </div>
        <div class="flex items-center gap-3">
          <button type="button" class="casdc-link-btn text-sm" @click="goBackToList">
            <iconify-icon icon="mdi:arrow-left"></iconify-icon>
            返回列表
          </button>
          <UserCenterNavButton prefer-login-modal @need-login="showLoginModal = true" />
          <template v-if="!authStore.isLoggedIn">
            <button class="btn-gradient text-white font-bold py-2 px-5 rounded-xl text-sm" @click="showLoginModal = true">登录</button>
          </template>
          <template v-else>
            <span class="text-sm text-slate-600">{{ authStore.displayName }}</span>
          </template>
        </div>
      </div>
    </nav>

    <!-- 移动端顶栏：仅返回 -->
    <div class="casdc-mobile-bar md:hidden">
      <button type="button" class="casdc-mobile-bar__back" @click="goBackToList">
        <iconify-icon icon="mdi:arrow-left"></iconify-icon>
        返回列表
      </button>
    </div>

    <!-- 加载 / 错误 -->
    <div v-if="loading" class="casdc-state-wrap">
      <iconify-icon class="text-5xl text-blue-600 animate-spin" icon="mdi:loading"></iconify-icon>
      <p>正在加载资源详情…</p>
    </div>
    <div v-else-if="error" class="casdc-state-wrap">
      <iconify-icon class="text-6xl text-red-300" icon="mdi:alert-circle-outline"></iconify-icon>
      <p>{{ error }}</p>
      <button type="button" class="btn-gradient text-white text-sm font-bold py-2 px-6 rounded-lg" @click="fetchDetail">重新加载</button>
    </div>

    <template v-else-if="detail">
      <!-- CASDC topbox 顶图 -->
      <header
        class="casdc-topbox"
        :style="detail.bannerUrl ? { backgroundImage: `url(${detail.bannerUrl})` } : undefined"
      >
        <div class="casdc-topbox__mask"></div>
        <div class="casdc-page-shell relative z-[1]">
          <nav class="casdc-breadcrumb pb-4">
            <button type="button" @click="router.push('/home')">主页</button>
            <iconify-icon icon="mdi:chevron-right"></iconify-icon>
            <button type="button" @click="goBackToList">数据目录</button>
            <iconify-icon icon="mdi:chevron-right"></iconify-icon>
            <span>数据集详情</span>
          </nav>
        </div>
      </header>

      <div class="casdc-container-details casdc-page-shell pb-16 -mt-8 relative z-[2]">
        <!-- BaseInfo：标题 + 共享状态 + 操作 -->
        <section class="casdc-base-info tech-card">
          <div class="casdc-jurisdiction">
            <span class="casdc-privacy" :class="`casdc-privacy--${detail.privacyType}`">
              <iconify-icon :icon="privacyIcon"></iconify-icon>
              {{ detail.privacyLabel }}
            </span>
            <span class="casdc-stat font-num">
              <iconify-icon icon="mdi:eye-outline"></iconify-icon>
              访问量 {{ detail.visitNum || '—' }}
            </span>
            <button
              type="button"
              class="casdc-stat casdc-stat--favorite font-num"
              :class="{ 'casdc-stat--favorite-active': isFavorited }"
              :disabled="favoriteLoading"
              :title="isFavorited ? '取消收藏' : '收藏'"
              @click="toggleFavorite"
            >
              <iconify-icon
                :icon="isFavorited ? 'mdi:heart' : 'mdi:heart-outline'"
                class="casdc-stat__heart"
                :class="{ 'casdc-stat__heart--active': isFavorited }"
              ></iconify-icon>
              收藏 {{ displayFollowNum }}
            </button>
          </div>

          <div class="casdc-title-box">
            <div class="casdc-cover">
              <img
                v-if="detail.coverUrl"
                :src="detail.coverUrl"
                :alt="detail.name"
                @error="detail.coverUrl = ''"
              />
              <iconify-icon v-else icon="mdi:database" class="text-4xl text-slate-300"></iconify-icon>
            </div>
            <div class="casdc-title-main">
              <h1>{{ detail.name }}</h1>
              <p v-if="detail.nameEn" class="casdc-title-en">{{ detail.nameEn }}</p>
              <div class="casdc-title-meta">
                <span>{{ detail.resourceType }}</span>
                <span v-if="detail.publicationDate">发布日期 {{ detail.publicationDate }}</span>
                <span v-if="detail.updateDate">更新 {{ detail.updateDate }}</span>
              </div>
              <div v-if="detail.authors.length" class="casdc-authors">
                <span class="casdc-authors__label">作者：</span>
                <span v-for="(author, idx) in detail.authors" :key="idx" class="casdc-author-item">{{ author }}</span>
              </div>
            </div>
          </div>

          <div v-if="showApplyButton" class="casdc-actions">
            <button type="button" class="casdc-btn casdc-btn--primary" @click="applyUse">
              立即申请
            </button>
          </div>
        </section>

        <!-- 主体：左内容 + 右侧栏（CASDC infoContentBox） -->
        <div class="casdc-info-content">
          <div class="casdc-left-content">
            <!-- 基本信息 -->
            <section :id="sectionIds.basic" class="casdc-panel tech-card">
              <div class="casdc-basic-head">
                <h2 class="casdc-label-title">基本信息</h2>
                <DataSeekButton size="lg" />
              </div>

              <div v-for="row in basicMetaSingleLineRows" :key="row.label" class="casdc-meta-line">
                <span class="casdc-meta-line__label">{{ row.label }}：</span>
                <span class="casdc-meta-line__value" :class="{ 'font-mono': row.mono }">
                  <a
                    v-if="row.link"
                    :href="row.value"
                    target="_blank"
                    rel="noopener noreferrer"
                    class="casdc-ext-link"
                  >{{ row.value }}</a>
                  <template v-else>{{ row.value }}</template>
                </span>
              </div>

              <div v-for="row in basicMetaBlockRows" :key="row.label" class="casdc-details-block">
                <div class="casdc-details-block__label">{{ row.label }}</div>
                <div class="casdc-details-block__content" :class="{ 'font-mono': row.mono, 'casdc-rich-text': hasHtmlTags(row.value) }">
                  <a
                    v-if="row.link"
                    :href="row.value"
                    target="_blank"
                    rel="noopener noreferrer"
                    class="casdc-ext-link"
                  >{{ row.value }}</a>
                  <div v-else-if="hasHtmlTags(row.value)" v-html="row.value"></div>
                  <template v-else>{{ row.value }}</template>
                </div>
              </div>

              <table v-if="basicMetaTableRowGroups.length" class="casdc-meta-table">
                <tbody>
                  <tr v-for="(group, idx) in basicMetaTableRowGroups" :key="idx">
                    <td v-for="cell in group" :key="cell.label">
                      <div class="casdc-meta-table__cell">
                        <span class="casdc-meta-table__label">{{ cell.label }}：</span>
                        <span class="casdc-meta-table__value">{{ cell.value }}</span>
                      </div>
                    </td>
                    <td
                      v-for="pad in 3 - group.length"
                      :key="`pad-${idx}-${pad}`"
                      class="casdc-meta-table__empty"
                    ></td>
                  </tr>
                </tbody>
              </table>

              <div v-for="row in basicMetaOtherRows" :key="row.label" class="casdc-meta-line">
                <span class="casdc-meta-line__label">{{ row.label }}：</span>
                <span class="casdc-meta-line__value" :class="{ 'font-mono': row.mono }">
                  <a
                    v-if="row.link"
                    :href="row.value"
                    target="_blank"
                    rel="noopener noreferrer"
                    class="casdc-ext-link"
                  >{{ row.value }}</a>
                  <template v-else>{{ row.value }}</template>
                </span>
              </div>
            </section>

            <!-- 发表评价（暂时隐藏） -->
            <section
              v-if="SHOW_DATASET_EVALUATION"
              :id="sectionIds.evalForm"
              class="casdc-panel tech-card casdc-eval-form-panel"
            >
              <h2 class="casdc-label-title">发表评价</h2>
              <template v-if="authStore.isLoggedIn">
                <div class="casdc-eval-form__rating">
                  <span>您的评分</span>
                  <div class="casdc-eval-stars casdc-eval-stars--pick">
                    <button
                      v-for="i in 5"
                      :key="i"
                      type="button"
                      class="casdc-eval-star-btn"
                      :aria-label="`${i} 星`"
                      @click="newRating = i"
                    >
                      <iconify-icon
                        :icon="i <= newRating ? 'mdi:star' : 'mdi:star-outline'"
                        :class="{ 'casdc-eval-star--active': i <= newRating }"
                      ></iconify-icon>
                    </button>
                  </div>
                </div>
                <textarea
                  v-if="SHOW_DATASET_COMMENT"
                  v-model="newComment"
                  class="casdc-eval-textarea"
                  rows="3"
                  placeholder="分享您对本数据集的质量评价和使用体验…"
                ></textarea>
                <p v-if="commentSuccess" class="casdc-eval-success">
                  <iconify-icon icon="mdi:check-circle-outline"></iconify-icon>
                  {{ commentSuccess }}
                </p>
                <p v-else-if="commentError" class="casdc-eval-error">
                  <iconify-icon icon="mdi:alert-circle-outline"></iconify-icon>
                  {{ commentError }}
                </p>
                <div class="casdc-eval-form__foot">
                  <p>您的评价将帮助其他研究者更好地了解本数据集</p>
                  <button
                    type="button"
                    class="casdc-btn casdc-btn--primary"
                    :disabled="submittingComment"
                    @click="submitEvaluation"
                  >
                    <iconify-icon v-if="submittingComment" class="animate-spin" icon="mdi:loading"></iconify-icon>
                    {{ submittingComment ? '提交中…' : '提交评价' }}
                  </button>
                </div>
              </template>
              <p v-else class="casdc-eval-login-hint">
                <button type="button" class="text-blue-600 hover:underline" @click="goLoginForDownload">
                  登录
                </button>
                后可发表评价
              </p>
            </section>

            <!-- 访问量 -->
            <section :id="sectionIds.stats" class="casdc-panel tech-card">
              <div class="casdc-stats-section__head">
                <h2 class="casdc-label-title casdc-stats-title">
                  访问量
                  <strong class="font-num casdc-stats-title__value">{{ detail.visitNum || 0 }}</strong>
                </h2>
                <div class="casdc-stats-tabs" role="tablist">
                  <button
                    v-for="tab in statsTabs"
                    :key="tab.key"
                    type="button"
                    role="tab"
                    class="casdc-stats-tab"
                    :class="{ 'casdc-stats-tab--active': statsRange === tab.key }"
                    :aria-selected="statsRange === tab.key"
                    @click="statsRange = tab.key"
                  >
                    {{ tab.label }}
                  </button>
                </div>
              </div>

              <div v-if="statsLoading" class="casdc-stats-chart-loading">
                <iconify-icon icon="mdi:loading" class="animate-spin text-xl text-slate-400"></iconify-icon>
              </div>
              <div v-else class="casdc-bar-chart">
                <div class="casdc-bar-chart__body">
                  <div class="casdc-bar-chart__y-wrap">
                    <span class="casdc-bar-chart__axis-title casdc-bar-chart__axis-title--y">次数</span>
                    <div class="casdc-bar-chart__y-axis" aria-hidden="true">
                      <span
                        v-for="tick in statsYAxisTicksReversed"
                        :key="`y-${tick}`"
                        class="casdc-bar-chart__y-tick font-num"
                      >{{ formatAxisValue(tick) }}</span>
                    </div>
                  </div>

                  <div class="casdc-bar-chart__canvas">
                    <div class="casdc-bar-chart__plot-area">
                      <div class="casdc-bar-chart__grid" aria-hidden="true">
                        <div
                          v-for="tick in statsYAxisTicks"
                          :key="`grid-${tick}`"
                          class="casdc-bar-chart__grid-line"
                        ></div>
                      </div>
                      <div class="casdc-bar-chart__plot">
                        <div
                          v-for="point in statsChartPoints"
                          :key="point.label"
                          class="casdc-bar-chart__group"
                        >
                          <div class="casdc-bar-chart__bars">
                            <div
                              class="casdc-bar-chart__bar casdc-bar-chart__bar--visit"
                              :style="{ height: statsBarHeight(point.visit) }"
                              :title="`访问 ${point.visit}`"
                            ></div>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div class="casdc-bar-chart__x-axis" aria-hidden="true">
                      <span
                        v-for="point in statsChartPoints"
                        :key="`x-${point.label}`"
                        class="casdc-bar-chart__x-tick"
                      >{{ point.label }}</span>
                    </div>
                    <div class="casdc-bar-chart__axis-title casdc-bar-chart__axis-title--x">
                      {{ statsXAxisLabel }}
                    </div>
                  </div>
                </div>
              </div>
            </section>
          </div>

          <!-- 右侧栏 -->
          <aside class="casdc-right-content">
            <SourceOrgCard title="数据集来源" :card="datasetSource" />

            <div class="casdc-side-card tech-card casdc-related-news">
              <h3 class="casdc-side-title">相关资讯</h3>
              <div v-if="relatedNewsLoading" class="casdc-related-news__empty" aria-live="polite">
                <iconify-icon class="animate-spin text-blue-600" icon="mdi:loading"></iconify-icon>
                <p>加载中…</p>
              </div>
              <div v-else-if="relatedNewsItems.length" class="casdc-related-news__list">
                <article
                  v-for="item in relatedNewsItems"
                  :key="item.id"
                  class="casdc-news-card"
                >
                  <button
                    v-if="item.coverImage && !relatedNewsCoverFailed.has(item.id)"
                    type="button"
                    class="casdc-news-card__cover casdc-news-card__cover--btn"
                    @click="openRelatedNews(item)"
                  >
                    <img
                      :src="item.coverImage"
                      :alt="item.title"
                      loading="lazy"
                      @error="onRelatedNewsCoverError(item.id)"
                    />
                  </button>
                  <div class="casdc-news-card__body">
                    <h4 class="casdc-news-card__title">
                      <button type="button" class="casdc-news-card__title-btn" @click="openRelatedNews(item)">
                        {{ item.title }}
                      </button>
                    </h4>
                    <p class="casdc-news-card__summary">{{ item.summaryText }}</p>
                    <div class="casdc-news-card__foot">
                      <span>{{ item.publisher }}</span>
                      <time>{{ item.publishedAt }}</time>
                    </div>
                  </div>
                </article>
              </div>
              <div v-else class="casdc-related-news__empty">
                <iconify-icon icon="mdi:newspaper-variant-outline"></iconify-icon>
                <p>暂无资讯</p>
              </div>
            </div>

            <div
              v-if="SHOW_DATASET_EVALUATION"
              :id="sectionIds.evaluation"
              class="casdc-side-card tech-card casdc-eval-sidebar"
            >
              <div class="casdc-eval-side__head">
                <h3 class="casdc-side-title">数据评价</h3>
                <button type="button" class="casdc-eval-goto" @click="scrollToEvalForm">
                  去评价
                  <iconify-icon icon="mdi:chevron-down"></iconify-icon>
                </button>
              </div>
              <p v-if="!evaluationsLoading && evaluations.length" class="casdc-eval-side__count">
                共 {{ evaluations.length }} 条评价
              </p>

              <div v-if="evaluationsLoading" class="casdc-side-state">
                <iconify-icon class="animate-spin text-blue-600" icon="mdi:loading"></iconify-icon>
                <span>加载评价中…</span>
              </div>
              <div v-else-if="evaluations.length" class="casdc-eval-list casdc-eval-list--sidebar">
                <article v-for="(ev, idx) in evaluations" :key="idx" class="casdc-eval-item">
                  <div class="casdc-eval-item__head">
                    <div class="casdc-eval-item__user">
                      <div class="casdc-eval-avatar" :class="ev.avatarColor">
                        {{ ev.avatarInitial }}
                      </div>
                      <div>
                        <strong>{{ maskDisplayName(ev.author) }}</strong>
                        <p v-if="ev.affiliation">{{ ev.affiliation }}</p>
                      </div>
                    </div>
                    <div class="casdc-eval-item__meta">
                      <div class="casdc-eval-stars casdc-eval-stars--sm">
                        <iconify-icon
                          v-for="i in 5"
                          :key="i"
                          :icon="i <= ev.rating ? 'mdi:star' : 'mdi:star-outline'"
                        ></iconify-icon>
                      </div>
                      <time>{{ ev.date }}</time>
                    </div>
                  </div>
                  <p v-if="SHOW_DATASET_COMMENT && ev.content" class="casdc-eval-item__content">{{ ev.content }}</p>
                </article>
              </div>
              <p v-else class="casdc-side-empty">暂无评价，欢迎成为第一个评价者</p>
            </div>

          </aside>
        </div>
      </div>
    </template>

    <AppFooter />
    <SiteBottomTabBar active="assets" prefer-login-modal @need-login="showLoginModal = true" />

    <WechatLoginModal
      v-model="showLoginModal"
      :redirect-path="route.fullPath"
      @success="handleLoginSuccess"
    />

    <Transition name="casdc-toast">
      <div
        v-if="evalSuccessToast"
        class="casdc-toast casdc-toast--success"
        role="status"
        aria-live="polite"
      >
        <iconify-icon icon="mdi:check-circle"></iconify-icon>
        <span>评价提交成功，感谢您的反馈！</span>
      </div>
    </Transition>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import AppFooter from '@/components/AppFooter.vue'
import BrandLogo from '@/components/BrandLogo.vue'
import SiteBottomTabBar from '@/components/SiteBottomTabBar.vue'
import SourceOrgCard from '@/components/SourceOrgCard.vue'
import DataSeekButton from '@/components/DataSeekButton.vue'
import UserCenterNavButton from '@/components/UserCenterNavButton.vue'
import WechatLoginModal from '@/components/WechatLoginModal.vue'
import { trackApplyClick } from '@/utils/applyClickTracking'
import { resolveApplicantUidFromUser } from '@/utils/resolveApplicantUid'
import { datasetOrderPath, evaluationDatasetPath, normalizeCstr } from '@/utils/cstrUrl'
import {
  mapApiDataSetToCasdc,
  buildCasdcBasicMetaRows,
  type CasdcDatasetDetail
} from '@/utils/casdcDetailMapper'
import {
  fetchDatasetStatsSeries,
  type StatsChartPoint,
  type StatsRange
} from '@/utils/datasetStatsChart'
import {
  checkDatasetFavorite,
  fetchDatasetFavoriteStatistics,
  removeDatasetFavorite,
  saveDatasetFavorite
} from '@/utils/datasetFavorite'
import { saveDatasetEvaluation } from '@/utils/datasetEvaluation'
import { maskDisplayName } from '@/utils/maskDisplayName'
import { hasHtmlTags } from '@/utils/richText'
import {
  fetchInformationByCstr,
  formatInformationDate,
  getInformationArticleUrl,
  getInformationThumbUrl,
  informationSummary,
  type InformationRecord
} from '@/utils/informationApi'
import { openInformationArticleWindow } from '@/utils/openInformationArticle'
import { resolveInformationSourceCard } from '@/utils/informationSourceSites'

defineOptions({ name: 'AssetDetail' })

/** 数据评价（发表评价 / 侧栏评价列表）：评分已开启，评论暂未开放 */
const SHOW_DATASET_EVALUATION = true
/** 数据评论（文字评价输入与展示）暂时关闭，仅开放星级评分 */
const SHOW_DATASET_COMMENT = false

type RelatedNewsItem = {
  id: string
  title: string
  coverImage: string
  summaryText: string
  publisher: string
  publishedAt: string
  record: InformationRecord
}

type EvaluationItem = {
  author: string
  affiliation: string
  date: string
  rating: number
  content: string
  avatarInitial: string
  avatarColor: string
}

const AVATAR_COLORS = [
  'casdc-eval-avatar--1',
  'casdc-eval-avatar--2',
  'casdc-eval-avatar--3',
  'casdc-eval-avatar--4',
  'casdc-eval-avatar--5',
  'casdc-eval-avatar--6'
]

function getAvatarColor(name: string): string {
  let hash = 0
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash)
  }
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length]
}

const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()

const loading = ref(true)
const error = ref('')
const detail = ref<CasdcDatasetDetail | null>(null)
const evaluations = ref<EvaluationItem[]>([])
const evaluationsLoading = ref(false)
const newRating = ref(0)
const newComment = ref('')
const submittingComment = ref(false)
const commentError = ref('')
const commentSuccess = ref('')
const evalSuccessToast = ref(false)
let evalSuccessTimer: ReturnType<typeof setTimeout> | null = null
const isFavorited = ref(false)
const favoriteLoading = ref(false)
const showLoginModal = ref(false)

const displayFollowNum = computed(() => {
  const n = detail.value?.followNum
  if (n == null || n === 0) return '—'
  return n
})

const statsTabs = [
  { key: 'day' as StatsRange, label: '按天' },
  { key: 'week' as StatsRange, label: '按周' },
  { key: 'month' as StatsRange, label: '按月' }
] as const

const statsRange = ref<StatsRange>('day')
const statsChartPoints = ref<StatsChartPoint[]>([])
const statsLoading = ref(false)

const sectionIds = {
  basic: 'casdc-sec-basic',
  evalForm: 'casdc-sec-eval-form',
  stats: 'casdc-sec-stats',
  evaluation: 'casdc-sec-evaluation'
} as const


const BASIC_META_SINGLE_LINE_LABELS = ['资源名称', '关键词'] as const

const BASIC_META_TABLE_LABELS = [
  '资源类型',
  '共享方式',
  '提供方',
  '数据体量',
  '更新时间',
] as const

type BasicMetaRow = ReturnType<typeof buildCasdcBasicMetaRows>[number]

const basicMetaRows = computed(() => (detail.value ? buildCasdcBasicMetaRows(detail.value) : []))

const basicMetaSingleLineRows = computed(() =>
  BASIC_META_SINGLE_LINE_LABELS.map((label) =>
    basicMetaRows.value.find((row) => row.label === label)
  ).filter((row): row is BasicMetaRow => Boolean(row?.value))
)

const basicMetaTableRowGroups = computed(() => {
  const cells = BASIC_META_TABLE_LABELS.map((label) =>
    basicMetaRows.value.find((row) => row.label === label)
  ).filter((row): row is BasicMetaRow => Boolean(row?.value))

  const groups: BasicMetaRow[][] = []
  for (let i = 0; i < cells.length; i += 3) {
    groups.push(cells.slice(i, i + 3))
  }
  return groups
})

const basicMetaBlockRows = computed(() => basicMetaRows.value.filter((row) => row.multiline))

const basicMetaOtherRows = computed(() =>
  basicMetaRows.value.filter(
    (row) =>
      !row.multiline &&
      !BASIC_META_SINGLE_LINE_LABELS.includes(row.label as (typeof BASIC_META_SINGLE_LINE_LABELS)[number]) &&
      !BASIC_META_TABLE_LABELS.includes(row.label as (typeof BASIC_META_TABLE_LABELS)[number])
  )
)

const statsBarMax = computed(() => {
  let max = 0
  for (const point of statsChartPoints.value) {
    max = Math.max(max, point.visit)
  }
  return max
})

function niceAxisMax(value: number): number {
  if (value <= 0) return 5
  const raw = value * 1.05
  const exp = Math.floor(Math.log10(raw))
  const base = Math.pow(10, exp)
  const f = raw / base
  let nf: number
  if (f <= 1) nf = 1
  else if (f <= 2) nf = 2
  else if (f <= 5) nf = 5
  else nf = 10
  return nf * base
}

const statsYAxisMax = computed(() => niceAxisMax(statsBarMax.value))

const statsYAxisTicks = computed(() => {
  const max = statsYAxisMax.value
  const steps = 4
  return Array.from({ length: steps + 1 }, (_, i) => Math.round((max * i) / steps))
})

const statsYAxisTicksReversed = computed(() => [...statsYAxisTicks.value].reverse())

const statsXAxisLabel = computed(() => {
  if (statsRange.value === 'day') return '日期'
  if (statsRange.value === 'week') return '周次'
  return '月份'
})

function formatAxisValue(value: number): string {
  if (value >= 10000) {
    const v = value / 10000
    return `${Number.isInteger(v) ? v : v.toFixed(1)}万`
  }
  return String(value)
}

function statsBarHeight(value: number): string {
  const max = statsYAxisMax.value
  if (!value || max <= 0) return '0%'
  const pct = Math.min(100, (value / max) * 100)
  return `${pct}%`
}

async function fetchStatsChart() {
  const d = detail.value
  if (!d?.cstr) return

  statsLoading.value = true
  try {
    statsChartPoints.value = await fetchDatasetStatsSeries(d.cstr, statsRange.value, {
      visit: d.visitNum || 0,
      download: 0
    })
  } catch {
    statsChartPoints.value = []
  } finally {
    statsLoading.value = false
  }
}

const privacyIcon = computed(() => {
  const map: Record<string, string> = {
    open: 'mdi:lock-open-variant-outline',
    condition: 'mdi:account-key-outline',
    protect: 'mdi:shield-lock-outline',
    notOpen: 'mdi:lock-outline',
    unknown: 'mdi:help-circle-outline'
  }
  return map[detail.value?.privacyType || 'unknown']
})

const showApplyButton = computed(() => detail.value?.privacyType !== 'open')

const datasetSource = computed(() => {
  const publisher = detail.value?.publisher?.trim()
  if (!publisher || publisher === '未知来源') return null
  return resolveInformationSourceCard({
    source: publisher,
    articleUrl: detail.value?.datasetRemoteUrl || detail.value?.url
  })
})

const relatedNewsCoverFailed = ref(new Set<string>())
const relatedNewsItems = ref<RelatedNewsItem[]>([])
const relatedNewsLoading = ref(false)

function mapRelatedNewsItem(record: InformationRecord): RelatedNewsItem | null {
  if (!getInformationArticleUrl(record)) return null
  return {
    id: record.id,
    title: record.name,
    coverImage: getInformationThumbUrl(record),
    summaryText: informationSummary(record.description, 120),
    publisher: record.source || '—',
    publishedAt: formatInformationDate(record.updateAt),
    record
  }
}

async function fetchRelatedNews(cstr: string) {
  relatedNewsLoading.value = true
  try {
    const rows = await fetchInformationByCstr(cstr)
    relatedNewsItems.value = rows
      .map(mapRelatedNewsItem)
      .filter((item): item is RelatedNewsItem => Boolean(item))
  } catch {
    relatedNewsItems.value = []
  } finally {
    relatedNewsLoading.value = false
  }
}

function openRelatedNews(item: RelatedNewsItem) {
  openInformationArticleWindow(router, item.id, item.record)
}

function onRelatedNewsCoverError(id: string) {
  relatedNewsCoverFailed.value.add(id)
}

function goBackToList() {
  router.push({ name: 'AssetList' })
}

function isUserLoggedIn(): boolean {
  authStore.syncFromStorage()
  return authStore.isLoggedIn
}

function goLoginForDownload() {
  showLoginModal.value = true
}

function handleLoginSuccess() {
  authStore.syncFromStorage()
  if (!authStore.isLoggedIn) return
  void checkFavoriteStatus()
  void fetchFavoriteStatistics()
}

function resolveFavoriteUid(): string {
  return resolveApplicantUidFromUser(authStore.user) || authStore.user?.uid || authStore.user?.openId || ''
}

async function fetchFavoriteStatistics() {
  const cstr = detail.value?.cstr
  if (!cstr || !detail.value) return

  const count = await fetchDatasetFavoriteStatistics(cstr)
  if (count != null) {
    detail.value.followNum = count
  }
}

async function checkFavoriteStatus() {
  if (!authStore.isLoggedIn || !detail.value?.cstr) {
    isFavorited.value = false
    return
  }

  const uid = resolveFavoriteUid()
  if (!uid) {
    isFavorited.value = false
    return
  }

  favoriteLoading.value = true
  try {
    isFavorited.value = await checkDatasetFavorite(uid, detail.value.cstr)
  } finally {
    favoriteLoading.value = false
  }
}

async function toggleFavorite() {
  if (!isUserLoggedIn()) {
    showLoginModal.value = true
    return
  }

  const uid = resolveFavoriteUid()
  const cstr = detail.value?.cstr
  if (!uid || !cstr) return

  favoriteLoading.value = true
  try {
    const wasFavorited = isFavorited.value
    const ok = wasFavorited
      ? await removeDatasetFavorite(uid, cstr)
      : await saveDatasetFavorite(uid, cstr)

    if (!ok || !detail.value) return

    isFavorited.value = await checkDatasetFavorite(uid, cstr)
    await fetchFavoriteStatistics()
  } finally {
    favoriteLoading.value = false
  }
}

function scrollToEvalForm() {
  const el = document.getElementById(sectionIds.evalForm)
  if (!el) return
  el.scrollIntoView({ behavior: 'smooth', block: 'start' })
}


function openDatasetUrl() {
  const url = detail.value?.url?.trim()
  if (!url) return
  void trackApplyClick({
    uid: resolveApplicantUidFromUser(authStore.user),
    cstr: detail.value?.cstr || '',
    url
  })
  window.open(url, '_blank', 'noopener,noreferrer')
}

function applyUse() {
  openDatasetUrl()
}

async function fetchEvaluations(cstr: string) {
  if (!SHOW_DATASET_EVALUATION) {
    evaluations.value = []
    return
  }
  evaluationsLoading.value = true
  try {
    const res = await fetch(evaluationDatasetPath(cstr))
    const json = await res.json()
    if (json.code === 200 && Array.isArray(json.data)) {
      evaluations.value = json.data.map((item: Record<string, unknown>) => {
        const author = String(item.username || '匿名用户')
        return {
          author,
          affiliation: String(item.affiliation || ''),
          date: String(item.createTime || '').slice(0, 10),
          rating: Number(item.score) || 0,
          content: String(item.description || ''),
          avatarInitial: author.charAt(author.length - 1) || '匿',
          avatarColor: getAvatarColor(author)
        }
      })
    } else {
      evaluations.value = []
    }
  } catch {
    evaluations.value = []
  } finally {
    evaluationsLoading.value = false
  }
}

function clearEvalSuccessFeedback() {
  commentSuccess.value = ''
  evalSuccessToast.value = false
  if (evalSuccessTimer) {
    clearTimeout(evalSuccessTimer)
    evalSuccessTimer = null
  }
}

function showEvalSubmitSuccess() {
  commentError.value = ''
  commentSuccess.value = '评价已发布，可在右侧「数据评价」中查看'
  evalSuccessToast.value = true

  if (evalSuccessTimer) clearTimeout(evalSuccessTimer)
  evalSuccessTimer = setTimeout(() => {
    evalSuccessToast.value = false
    commentSuccess.value = ''
    evalSuccessTimer = null
  }, 3000)

  window.setTimeout(() => {
    document.getElementById(sectionIds.evaluation)?.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
  }, 200)
}

async function submitEvaluation() {
  if (!authStore.isLoggedIn) {
    commentError.value = '请先登录后再发表评价'
    return
  }
  if (newRating.value === 0) {
    commentError.value = '请选择评分'
    return
  }
  if (SHOW_DATASET_COMMENT && !newComment.value.trim()) {
    commentError.value = '请输入评价内容'
    return
  }

  const uid = resolveApplicantUidFromUser(authStore.user) || authStore.user?.uid || authStore.user?.openId || ''
  const cstr = detail.value?.cstr || ''
  if (!uid || !cstr) {
    commentError.value = '缺少必要信息'
    return
  }

  submittingComment.value = true
  commentError.value = ''
  commentSuccess.value = ''

  try {
    const result = await saveDatasetEvaluation(uid, cstr, SHOW_DATASET_COMMENT ? newComment.value : '', newRating.value)
    if (result.ok) {
      const name = authStore.displayName || '匿名用户'
      evaluations.value.unshift({
        author: name,
        affiliation: authStore.user?.affiliation || '',
        date: new Date().toISOString().slice(0, 10),
        rating: newRating.value,
        content: SHOW_DATASET_COMMENT ? newComment.value.trim() : '',
        avatarInitial: name.charAt(0) || '匿',
        avatarColor: getAvatarColor(name)
      })
      newRating.value = 0
      newComment.value = ''
      showEvalSubmitSuccess()
    } else {
      commentError.value = result.message || '提交评价失败'
    }
  } catch {
    commentError.value = '网络错误，请稍后重试'
  } finally {
    submittingComment.value = false
  }
}

async function fetchDetail() {
  const cstr = normalizeCstr((route.params.id as string) || '')
  if (!cstr) {
    error.value = '缺少资源标识'
    loading.value = false
    return
  }

  loading.value = true
  error.value = ''
  try {
    const res = await fetch(datasetOrderPath(cstr))
    const json = await res.json()
    if (json.code !== 200 || !json.data?.DataSet) {
      throw new Error(json.message || '获取资源详情失败')
    }
    detail.value = mapApiDataSetToCasdc(json.data.DataSet as Record<string, unknown>, cstr)
    await Promise.all([
      fetchEvaluations(cstr),
      fetchStatsChart(),
      fetchFavoriteStatistics(),
      fetchRelatedNews(cstr)
    ])
    await checkFavoriteStatus()
  } catch (e: unknown) {
    error.value = e instanceof Error ? e.message : '加载失败'
    detail.value = null
    relatedNewsItems.value = []
  } finally {
    loading.value = false
  }
}

watch(
  () => detail.value?.cstr,
  () => {
    relatedNewsCoverFailed.value = new Set()
    relatedNewsItems.value = []
  }
)

watch(
  () => route.params.id,
  () => {
    void fetchDetail()
  }
)

watch(statsRange, () => {
  void fetchStatsChart()
})

watch(
  () => [authStore.isLoggedIn, authStore.user?.uid, authStore.user?.openId, detail.value?.cstr] as const,
  () => {
    if (detail.value?.cstr) void checkFavoriteStatus()
  }
)

onMounted(() => {
  authStore.syncFromStorage()
  void fetchDetail()
})

onUnmounted(() => {
  clearEvalSuccessFeedback()
})
</script>

<style scoped>
.casdc-detail-page {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  background: var(--fs-bg);
  padding-top: calc(2.75rem + env(safe-area-inset-top, 0px));
  padding-bottom: calc(3.75rem + env(safe-area-inset-bottom, 0px));
  width: 100%;
  max-width: 100%;
  overflow-x: clip;
  box-sizing: border-box;
}

@media (min-width: 768px) {
  .casdc-detail-page {
    padding-top: 4rem;
    padding-bottom: 0;
  }
}

.casdc-mobile-bar {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: 50;
  display: flex;
  align-items: center;
  height: calc(2.75rem + env(safe-area-inset-top, 0px));
  padding: env(safe-area-inset-top, 0px) 0.75rem 0;
  background: rgba(255, 255, 255, 0.96);
  backdrop-filter: blur(16px);
  border-bottom: 1px solid rgba(226, 232, 240, 0.9);
  box-sizing: border-box;
}

/* Scoped display:flex overrides Tailwind md:hidden */
@media (min-width: 768px) {
  .casdc-mobile-bar {
    display: none;
  }
}

.casdc-mobile-bar__back {
  display: inline-flex;
  align-items: center;
  gap: 0.25rem;
  padding: 0.35rem 0.5rem;
  border: none;
  border-radius: 0.5rem;
  background: transparent;
  color: #334155;
  font-size: 0.875rem;
  font-weight: 600;
  cursor: pointer;
}

.casdc-mobile-bar__back:active {
  background: #f1f5f9;
}

.casdc-page-shell {
  width: 100%;
  max-width: 100%;
  margin-left: auto;
  margin-right: auto;
  padding-left: 0.75rem;
  padding-right: 0.75rem;
  box-sizing: border-box;
}

@media (min-width: 768px) {
  .casdc-page-shell {
    max-width: min(1400px, 100%);
    padding-left: 1.5rem;
    padding-right: 1.5rem;
  }
}

@media (min-width: 1280px) {
  .casdc-page-shell {
    max-width: min(1400px, calc(100% - 200px));
  }
}

.casdc-state-wrap {
  min-height: 60vh;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 1rem;
  color: var(--fs-text-muted);
}

/* —— topbox —— */
.casdc-topbox {
  min-height: 200px;
  background: linear-gradient(135deg, #1e3a8a 0%, #1e40af 50%, #0e7490 100%);
  background-size: cover;
  background-position: center;
  position: relative;
}

.casdc-topbox__mask {
  position: absolute;
  inset: 0;
  background: linear-gradient(180deg, rgba(15, 23, 42, 0.15) 0%, rgba(15, 23, 42, 0.45) 100%);
}

.casdc-breadcrumb {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.35rem;
  padding-top: 1rem;
  font-size: 0.8125rem;
  color: rgba(255, 255, 255, 0.85);
}

@media (min-width: 768px) {
  .casdc-breadcrumb {
    padding-top: 1.25rem;
  }
}

.casdc-breadcrumb button {
  background: none;
  border: none;
  color: inherit;
  cursor: pointer;
}

.casdc-breadcrumb button:hover {
  color: #fff;
}

.casdc-breadcrumb span {
  color: #fff;
  font-weight: 600;
}

/* —— base info —— */
.casdc-base-info {
  border-radius: var(--fs-radius-lg);
  padding: 1.5rem;
  margin-bottom: 1.5rem;
  width: 100%;
  max-width: 100%;
  box-sizing: border-box;
}

.casdc-jurisdiction {
  display: flex;
  flex-wrap: wrap;
  gap: 0.75rem;
  margin-bottom: 1.25rem;
  align-items: center;
}

.casdc-basic-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  margin-bottom: 1rem;
}

.casdc-basic-head .casdc-label-title {
  margin-bottom: 0;
}

.casdc-privacy {
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  padding: 0.25rem 0.65rem;
  border-radius: 999px;
  font-size: 0.75rem;
  font-weight: 700;
}

.casdc-privacy--open {
  background: #dcfce7;
  color: #15803d;
}

.casdc-privacy--condition {
  background: #dbeafe;
  color: #1d4ed8;
}

.casdc-privacy--protect {
  background: #fef3c7;
  color: #b45309;
}

.casdc-privacy--notOpen {
  background: #f1f5f9;
  color: #64748b;
}

.casdc-privacy--unknown {
  background: #f1f5f9;
  color: #475569;
}

.casdc-stat {
  display: inline-flex;
  align-items: center;
  gap: 0.25rem;
  font-size: 0.75rem;
  color: var(--fs-text-muted);
}

.casdc-stat--favorite {
  border: none;
  background: none;
  padding: 0.15rem 0.35rem;
  margin: -0.15rem -0.35rem;
  border-radius: 0.35rem;
  cursor: pointer;
  transition: background 0.15s ease, color 0.15s ease;
}

.casdc-stat--favorite:hover:not(:disabled) {
  background: #fef2f2;
  color: #dc2626;
}

.casdc-stat--favorite:disabled {
  opacity: 0.6;
  cursor: wait;
}

.casdc-stat__heart--active {
  color: #ef4444;
}

.casdc-stat--favorite-active {
  color: #dc2626;
}

.casdc-title-box {
  display: flex;
  gap: 1.25rem;
  margin-bottom: 1.25rem;
  align-items: flex-start;
}

.casdc-title-main {
  flex: 1 1 0;
  min-width: 0;
}

.casdc-cover {
  width: 7rem;
  height: 7rem;
  border-radius: var(--fs-radius);
  border: 1px solid var(--fs-border-subtle);
  background: #f8fafc;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  flex-shrink: 0;
}

.casdc-cover img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.casdc-title-main h1 {
  font-size: 1.5rem;
  font-weight: 800;
  color: var(--fs-text);
  line-height: 1.35;
  margin-bottom: 0.35rem;
  word-break: break-word;
  overflow-wrap: anywhere;
}

.casdc-title-en {
  font-size: 0.875rem;
  color: var(--fs-text-muted);
  margin-bottom: 0.5rem;
  word-break: break-word;
  overflow-wrap: anywhere;
}

.casdc-title-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 0.75rem;
  font-size: 0.75rem;
  color: var(--fs-text-secondary);
  margin-bottom: 0.75rem;
}

.casdc-authors {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 0.75rem;
}

.casdc-authors__label {
  font-size: 0.8125rem;
  font-weight: 600;
  color: var(--fs-text-muted);
  flex-shrink: 0;
}

.casdc-author-item {
  font-size: 0.8125rem;
  color: var(--fs-primary);
  background: var(--fs-primary-light);
  padding: 0.15rem 0.5rem;
  border-radius: 0.25rem;
}

.casdc-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  padding-top: 1rem;
  border-top: 1px solid var(--fs-border-subtle);
}

.casdc-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.35rem;
  padding: 0.55rem 1rem;
  border-radius: 0.5rem;
  font-size: 0.8125rem;
  font-weight: 700;
  cursor: pointer;
  transition: all var(--fs-duration) var(--fs-ease);
  border: 1px solid transparent;
}

.casdc-btn--primary {
  background: linear-gradient(135deg, #1e40af, #2563eb);
  color: #fff;
  box-shadow: 0 2px 8px rgba(37, 99, 235, 0.25);
}

.casdc-btn--analysis {
  background: linear-gradient(135deg, #0f766e, #14b8a6);
  color: #fff;
  box-shadow: 0 2px 8px rgba(20, 184, 166, 0.25);
}

.casdc-btn--analysis:hover {
  filter: brightness(1.05);
}

.casdc-files-section__head {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  flex-wrap: wrap;
  margin-bottom: 1rem;
}

.casdc-files-section__head .casdc-label-title {
  margin-bottom: 0;
}

.casdc-btn--compact {
  padding: 0.45rem 0.85rem;
  font-size: 0.75rem;
  flex-shrink: 0;
}

.casdc-btn--ghost {
  background: transparent;
  color: var(--fs-text-muted);
}

.casdc-link-btn {
  display: inline-flex;
  align-items: center;
  gap: 0.25rem;
  background: none;
  border: none;
  color: var(--fs-text-muted);
  cursor: pointer;
}

/* —— layout —— */
.casdc-info-content {
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  gap: 1.5rem;
  width: 100%;
  max-width: 100%;
  min-width: 0;
  box-sizing: border-box;
}

.casdc-left-content,
.casdc-right-content {
  min-width: 0;
  max-width: 100%;
  width: 100%;
  box-sizing: border-box;
}

.casdc-container-details {
  width: 100%;
  max-width: 100%;
  min-width: 0;
  box-sizing: border-box;
}

@media (min-width: 1024px) {
  .casdc-info-content {
    grid-template-columns: minmax(0, 1fr) minmax(280px, 360px);
  }
}

.casdc-eval-sidebar {
  align-self: start;
  width: 100%;
  box-sizing: border-box;
}

.casdc-eval-form-panel {
  scroll-margin-top: 5.5rem;
}

.casdc-eval-side__head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
  margin-bottom: 0.75rem;
}

.casdc-eval-side__head .casdc-side-title {
  margin-bottom: 0;
}

.casdc-eval-goto {
  display: inline-flex;
  align-items: center;
  gap: 0.15rem;
  border: none;
  background: none;
  padding: 0;
  font-size: 0.8125rem;
  font-weight: 700;
  color: var(--fs-primary);
  cursor: pointer;
  flex-shrink: 0;
}

.casdc-eval-goto:hover {
  text-decoration: underline;
}

@media (min-width: 1024px) {
  .casdc-eval-sidebar {
    position: sticky;
    top: 5.5rem;
    max-height: calc(100vh - 6.5rem);
    overflow-y: auto;
  }
}

.casdc-file-login-link {
  background: none;
  border: none;
  padding: 0;
  color: var(--fs-primary);
  font: inherit;
  cursor: pointer;
  text-decoration: underline;
}

.casdc-panel {
  border-radius: var(--fs-radius-lg);
  padding: 1.25rem 1.5rem;
  margin-bottom: 1rem;
  width: 100%;
  max-width: 100%;
  box-sizing: border-box;
  overflow-x: auto;
}

.casdc-label-title {
  font-size: 1rem;
  font-weight: 800;
  color: var(--fs-text);
  padding-left: 0.65rem;
  border-left: 3px solid var(--fs-primary);
  margin-bottom: 1rem;
}

/* 访问与下载统计 */
.casdc-stats-section__head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  flex-wrap: wrap;
  margin-bottom: 1rem;
}

.casdc-stats-section__head .casdc-label-title {
  margin-bottom: 0;
}

.casdc-stats-title {
  display: inline-flex;
  align-items: baseline;
  gap: 0.5rem;
}

.casdc-stats-title__value {
  font-size: 1.125rem;
  font-weight: 800;
  color: var(--fs-text);
}

.casdc-stats-tabs {
  display: inline-flex;
  gap: 0.35rem;
  padding: 0.2rem;
  background: #f1f5f9;
  border-radius: 999px;
}

.casdc-stats-tab {
  border: none;
  background: transparent;
  color: var(--fs-text-muted);
  font-size: 0.75rem;
  font-weight: 700;
  padding: 0.35rem 0.85rem;
  border-radius: 999px;
  cursor: pointer;
  transition: background 0.2s ease, color 0.2s ease;
}

.casdc-stats-tab--active {
  background: #fff;
  color: var(--fs-primary);
  box-shadow: 0 1px 3px rgba(15, 23, 42, 0.08);
}

.casdc-stats-summary {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 0.75rem;
  margin-bottom: 1rem;
}

.casdc-stats-summary__item {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  padding: 0.65rem 0.85rem;
  background: linear-gradient(135deg, #f8fafc 0%, #eef2ff 100%);
  border: 1px solid #e2e8f0;
  border-radius: var(--fs-radius-lg);
  font-size: 0.75rem;
  font-weight: 700;
  color: var(--fs-text-muted);
}

.casdc-stats-summary__item strong {
  margin-left: auto;
  font-size: 1rem;
  color: var(--fs-text);
}

.casdc-stats-chart-loading {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 200px;
}

.casdc-bar-chart__body {
  display: flex;
  align-items: flex-end;
  gap: 0.35rem;
}

.casdc-bar-chart__y-wrap {
  display: flex;
  flex-direction: column;
  align-items: center;
  flex-shrink: 0;
  width: 2.25rem;
  padding-bottom: 2.1rem;
}

.casdc-bar-chart__axis-title {
  font-size: 0.7rem;
  font-weight: 700;
  color: var(--fs-text-muted);
}

.casdc-bar-chart__axis-title--y {
  writing-mode: vertical-rl;
  transform: rotate(180deg);
  margin-bottom: 0.5rem;
  letter-spacing: 0.08em;
}

.casdc-bar-chart__axis-title--x {
  text-align: center;
  margin-top: 0.35rem;
  letter-spacing: 0.08em;
}

.casdc-bar-chart__y-axis {
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  align-items: flex-end;
  width: 100%;
  height: 160px;
}

.casdc-bar-chart__y-tick {
  font-size: 0.65rem;
  color: var(--fs-text-muted);
  line-height: 1;
}

.casdc-bar-chart__canvas {
  flex: 1;
  min-width: 0;
}

.casdc-bar-chart__plot-area {
  position: relative;
  height: 160px;
  border-left: 1px solid #94a3b8;
  border-bottom: 1px solid #94a3b8;
}

.casdc-bar-chart__grid {
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  pointer-events: none;
}

.casdc-bar-chart__grid-line {
  border-top: 1px dashed #e2e8f0;
  width: 100%;
}

.casdc-bar-chart__grid-line:first-child {
  border-top: none;
}

.casdc-bar-chart__plot {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 0.5rem;
  padding: 0 0.35rem;
}

.casdc-bar-chart__group {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: flex-end;
  height: 100%;
}

.casdc-bar-chart__bars {
  display: flex;
  align-items: flex-end;
  justify-content: center;
  gap: 0.25rem;
  width: 100%;
  height: 100%;
}

.casdc-bar-chart__bar {
  width: 0.65rem;
  min-height: 0;
  border-radius: 4px 4px 0 0;
  transition: height 0.35s ease;
}

.casdc-bar-chart__bar--visit {
  background: linear-gradient(180deg, #3b82f6, #6366f1);
}

.casdc-bar-chart__bar--download {
  background: linear-gradient(180deg, #10b981, #14b8a6);
}

.casdc-bar-chart__x-axis {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 0.5rem;
  margin-top: 0.35rem;
  padding: 0 0.35rem;
}

.casdc-bar-chart__x-tick {
  flex: 1;
  min-width: 0;
  font-size: 0.65rem;
  color: var(--fs-text-muted);
  text-align: center;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.casdc-bar-chart__legend {
  display: flex;
  align-items: center;
  justify-content: flex-start;
  flex-wrap: wrap;
  gap: 0.65rem 1rem;
  margin-bottom: 0.75rem;
  padding: 0.5rem 0.75rem;
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: var(--fs-radius);
  font-size: 0.75rem;
  color: var(--fs-text-muted);
  font-weight: 600;
}

.casdc-bar-chart__legend-title {
  margin-right: auto;
  font-size: 0.7rem;
  font-weight: 800;
  color: var(--fs-text);
  letter-spacing: 0.04em;
}

.casdc-bar-chart__legend-item {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  border: none;
  background: none;
  padding: 0.2rem 0.4rem;
  border-radius: 0.35rem;
  font: inherit;
  color: var(--fs-text-secondary);
  cursor: pointer;
  transition: opacity 0.2s ease, background 0.2s ease;
}

.casdc-bar-chart__legend-item:hover {
  background: #eef2ff;
}

.casdc-bar-chart__legend-item--inactive {
  opacity: 0.45;
}

.casdc-bar-chart__legend-item--inactive i {
  background: #cbd5e1 !important;
}

.casdc-bar-chart__legend-item i {
  display: inline-block;
  width: 0.5rem;
  height: 0.75rem;
  border-radius: 3px 3px 0 0;
  flex-shrink: 0;
}

.casdc-bar-chart__legend-item--visit i {
  background: linear-gradient(180deg, #3b82f6, #6366f1);
}

.casdc-bar-chart__legend-item--download i {
  background: linear-gradient(180deg, #10b981, #14b8a6);
}

.casdc-meta-line {
  display: flex;
  align-items: baseline;
  gap: 0.35rem;
  padding: 0.65rem 0;
  border-bottom: 1px solid #f1f5f9;
  font-size: 0.8125rem;
}

.casdc-meta-line__label {
  color: var(--fs-text-muted);
  font-weight: 600;
  flex-shrink: 0;
}

.casdc-meta-line__value {
  color: var(--fs-text);
  word-break: break-word;
}

.casdc-meta-table {
  width: 100%;
  border-collapse: collapse;
  margin: 0.75rem 0 1rem;
  font-size: 0.8125rem;
  table-layout: fixed;
}

.casdc-meta-table td {
  padding: 0.65rem 0.75rem;
  border: 1px solid #e2e8f0;
  vertical-align: middle;
  background: transparent;
}

.casdc-meta-table__cell {
  display: flex;
  align-items: baseline;
  flex-wrap: wrap;
  gap: 0.15rem;
  min-width: 0;
}

.casdc-meta-table__empty {
  border-color: #e2e8f0;
}

.casdc-meta-table__label {
  color: var(--fs-text-muted);
  font-weight: 600;
  flex-shrink: 0;
  white-space: nowrap;
}

.casdc-meta-table__value {
  color: var(--fs-text);
  word-break: break-word;
  min-width: 0;
}

.casdc-details-block {
  padding: 0.75rem 0;
  border-bottom: 1px solid #f1f5f9;
  font-size: 0.8125rem;
}

.casdc-details-block__label {
  color: var(--fs-text-muted);
  font-weight: 600;
  margin-bottom: 0.35rem;
}

.casdc-details-block__content {
  color: var(--fs-text);
  line-height: 1.7;
  white-space: pre-wrap;
  word-break: break-word;
}

.casdc-rich-text {
  white-space: normal;
}

.casdc-rich-text :deep(p) {
  margin: 0 0 0.75em;
}

.casdc-rich-text :deep(p:last-child) {
  margin-bottom: 0;
}

.casdc-rich-text :deep(ol),
.casdc-rich-text :deep(ul) {
  margin: 0.5em 0 0.75em;
  padding-left: 1.5em;
}

.casdc-rich-text :deep(li) {
  margin-bottom: 0.35em;
}

.casdc-rich-text :deep(strong) {
  font-weight: 700;
}

.casdc-details-list {
  display: flex;
  flex-direction: column;
  gap: 0;
}

.casdc-details-item {
  display: grid;
  grid-template-columns: 8.5rem 1fr;
  gap: 1rem;
  padding: 0.75rem 0;
  border-bottom: 1px solid #f1f5f9;
  font-size: 0.8125rem;
}

.casdc-details-title {
  color: var(--fs-text-muted);
  font-weight: 600;
}

.casdc-details-content {
  color: var(--fs-text);
  word-break: break-word;
}

.casdc-details-content.is-multiline {
  line-height: 1.7;
  white-space: pre-wrap;
}

.casdc-ext-link {
  color: var(--fs-primary);
  text-decoration: underline;
}

/* files */
.casdc-file-summary {
  display: flex;
  flex-wrap: wrap;
  gap: 1.5rem;
  font-size: 0.8125rem;
  color: var(--fs-text-muted);
  margin-bottom: 1rem;
}

.casdc-file-list {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.casdc-file-table-scroll {
  max-height: 360px;
  overflow: auto;
  border: 1px solid var(--fs-border-subtle);
  border-radius: 0.5rem;
}

.casdc-file-table {
  table-layout: fixed;
}

.casdc-file-table th,
.casdc-file-table td {
  vertical-align: middle;
  text-align: center;
}

.casdc-table.casdc-file-table th {
  text-align: center;
}

.casdc-file-table td:first-child {
  text-align: left;
  width: 46%;
}

.casdc-file-table th:first-child {
  width: 46%;
}

.casdc-file-table th:nth-child(2),
.casdc-file-table td:nth-child(2) {
  width: 14%;
}

.casdc-file-table th:nth-child(3),
.casdc-file-table td:nth-child(3) {
  width: 16%;
}

.casdc-file-table th:last-child,
.casdc-file-table td:last-child {
  width: 24%;
}

.casdc-file-table thead th {
  position: sticky;
  top: 0;
  z-index: 1;
  box-shadow: 0 1px 0 var(--fs-border-subtle);
}

.casdc-table-wrap {
  overflow-x: auto;
}

.casdc-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.8125rem;
}

.casdc-table th {
  background: #f8fafc;
  color: var(--fs-text-muted);
  font-weight: 700;
  text-align: left;
  padding: 0.65rem 0.75rem;
  border-bottom: 1px solid var(--fs-border-subtle);
}

.casdc-table.casdc-file-table th {
  text-align: center;
}

.casdc-table td {
  padding: 0.65rem 0.75rem;
  border-bottom: 1px solid #f1f5f9;
  color: var(--fs-text);
}

.casdc-file-name {
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  max-width: 100%;
  vertical-align: middle;
}

.casdc-file-download-btn {
  padding: 0.35rem 0.65rem;
  font-size: 0.75rem;
  vertical-align: middle;
}

.casdc-file-action-muted {
  color: var(--fs-text-muted);
}

.casdc-file-hint {
  margin-top: 0.75rem;
  font-size: 0.75rem;
  color: var(--fs-text-muted);
}

.casdc-empty-block {
  text-align: center;
  padding: 2.5rem 1rem;
  color: var(--fs-text-muted);
  font-size: 0.8125rem;
}

.casdc-empty-block.compact {
  padding: 1rem;
}

/* 数据评价 */
.casdc-eval-stars {
  display: flex;
  gap: 0.15rem;
  color: #f59e0b;
  justify-content: center;
  margin-top: 0.25rem;
}

.casdc-eval-stars--sm {
  justify-content: flex-end;
  font-size: 0.875rem;
}

.casdc-eval-stars--pick {
  justify-content: flex-start;
}

.casdc-eval-star-btn {
  padding: 0;
  border: none;
  background: none;
  cursor: pointer;
  font-size: 1.5rem;
  color: #cbd5e1;
  line-height: 1;
}

.casdc-eval-star-btn .casdc-eval-star--active,
.casdc-eval-star-btn:hover iconify-icon {
  color: #f59e0b;
}

.casdc-eval-side__count {
  margin: -0.15rem 0 0.75rem;
  font-size: 0.75rem;
  color: var(--fs-text-muted);
}

.casdc-side-state {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  padding: 1.5rem 0;
  font-size: 0.8125rem;
  color: var(--fs-text-muted);
}

.casdc-eval-list--sidebar {
  --casdc-eval-item-slot: 9rem;
  max-height: calc(2 * var(--casdc-eval-item-slot) + 0.75rem);
  overflow-y: auto;
  padding-right: 0.15rem;
  scrollbar-gutter: stable;
}

.casdc-eval-list--sidebar .casdc-eval-item {
  padding: 0.75rem;
}

.casdc-eval-list {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.casdc-eval-item {
  padding: 1rem;
  border: 1px solid var(--fs-border-subtle);
  border-radius: var(--fs-radius);
}

.casdc-eval-item__head {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 0.75rem;
  margin-bottom: 0.5rem;
}

.casdc-eval-item__user {
  display: flex;
  gap: 0.65rem;
  min-width: 0;
}

.casdc-eval-item__user strong {
  font-size: 0.8125rem;
  color: var(--fs-text);
}

.casdc-eval-item__user p {
  font-size: 0.75rem;
  color: var(--fs-text-muted);
  margin-top: 0.1rem;
}

.casdc-eval-item__meta {
  text-align: right;
  flex-shrink: 0;
}

.casdc-eval-item__meta time {
  display: block;
  font-size: 0.6875rem;
  color: var(--fs-text-muted);
  margin-top: 0.2rem;
}

.casdc-eval-item__content {
  font-size: 0.8125rem;
  color: var(--fs-text-secondary);
  line-height: 1.65;
}

.casdc-eval-avatar {
  width: 2.25rem;
  height: 2.25rem;
  border-radius: 999px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
  font-size: 0.75rem;
  font-weight: 700;
  flex-shrink: 0;
}

.casdc-eval-avatar--1 {
  background: linear-gradient(135deg, #3b82f6, #4f46e5);
}
.casdc-eval-avatar--2 {
  background: linear-gradient(135deg, #10b981, #0d9488);
}
.casdc-eval-avatar--3 {
  background: linear-gradient(135deg, #a855f7, #ec4899);
}
.casdc-eval-avatar--4 {
  background: linear-gradient(135deg, #f59e0b, #ea580c);
}
.casdc-eval-avatar--5 {
  background: linear-gradient(135deg, #06b6d4, #2563eb);
}
.casdc-eval-avatar--6 {
  background: linear-gradient(135deg, #6366f1, #7c3aed);
}

.casdc-eval-form__rating {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  margin-bottom: 0.75rem;
  font-size: 0.8125rem;
  color: var(--fs-text-muted);
}

.casdc-eval-textarea {
  width: 100%;
  padding: 0.65rem 0.75rem;
  font-size: 0.8125rem;
  border: 1px solid var(--fs-border-subtle);
  border-radius: 0.5rem;
  resize: vertical;
  margin-bottom: 0.5rem;
}

.casdc-eval-textarea:focus {
  outline: none;
  border-color: var(--fs-primary);
  box-shadow: 0 0 0 2px rgba(37, 99, 235, 0.15);
}

.casdc-eval-error {
  display: flex;
  align-items: center;
  gap: 0.35rem;
  font-size: 0.8125rem;
  color: #dc2626;
  margin-bottom: 0.5rem;
}

.casdc-eval-success {
  display: flex;
  align-items: center;
  gap: 0.35rem;
  font-size: 0.8125rem;
  color: #059669;
  margin-bottom: 0.5rem;
}

.casdc-toast {
  position: fixed;
  top: max(5.5rem, calc(env(safe-area-inset-top, 0) + 4.5rem));
  left: 50%;
  transform: translateX(-50%);
  z-index: 60;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  max-width: calc(100vw - 2rem);
  padding: 0.75rem 1rem;
  font-size: 0.875rem;
  font-weight: 600;
  color: #fff;
  border-radius: 0.5rem;
  box-shadow: 0 8px 24px rgba(15, 23, 42, 0.18);
}

.casdc-toast--success {
  background: linear-gradient(135deg, #059669, #10b981);
}

.casdc-toast-enter-active,
.casdc-toast-leave-active {
  transition: opacity 0.25s ease, transform 0.25s ease;
}

.casdc-toast-enter-from,
.casdc-toast-leave-to {
  opacity: 0;
  transform: translate(-50%, -0.5rem);
}

.casdc-eval-form__foot {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
}

.casdc-eval-form__foot p {
  font-size: 0.75rem;
  color: var(--fs-text-muted);
  max-width: 16rem;
}

.casdc-eval-login-hint {
  font-size: 0.8125rem;
  color: var(--fs-text-muted);
}

/* sidebar */
.casdc-right-content {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.casdc-side-card {
  width: 100%;
  box-sizing: border-box;
  border-radius: var(--fs-radius-lg);
  padding: 1rem 1.15rem;
}

.casdc-side-title {
  font-size: 0.875rem;
  font-weight: 800;
  margin-bottom: 0.75rem;
  color: var(--fs-text);
}

.casdc-side-empty {
  font-size: 0.8125rem;
  color: var(--fs-text-muted);
}

.casdc-related-news__empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  min-height: 8rem;
  padding: 1.5rem 0.75rem;
  text-align: center;
  color: var(--fs-text-muted);
  font-size: 0.8125rem;
}

.casdc-related-news__empty iconify-icon {
  font-size: 1.75rem;
  color: #cbd5e1;
}

.casdc-related-news__list {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.casdc-news-card {
  display: flex;
  align-items: stretch;
  gap: 0.65rem;
  padding: 0.75rem;
  border-radius: 0.75rem;
  border: 1px solid var(--fs-border-subtle);
  background: #fff;
}

.casdc-news-card__cover {
  flex-shrink: 0;
  width: 5.5rem;
  display: block;
  border-radius: 0.5rem;
  overflow: hidden;
  align-self: center;
}

.casdc-news-card__cover img {
  width: 100%;
  aspect-ratio: 16 / 9;
  display: block;
  object-fit: cover;
}

.casdc-news-card__body {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
}

.casdc-news-card__title {
  margin: 0;
  font-size: 0.8125rem;
  font-weight: 800;
  line-height: 1.45;
  color: var(--fs-text);
  overflow: hidden;
  text-overflow: ellipsis;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  line-clamp: 2;
  -webkit-box-orient: vertical;
}

.casdc-news-card__summary {
  margin: 0;
  font-size: 0.75rem;
  color: var(--fs-text-muted);
  line-height: 1.5;
  overflow: hidden;
  text-overflow: ellipsis;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  line-clamp: 2;
  -webkit-box-orient: vertical;
}

.casdc-news-card__cover--btn {
  padding: 0;
  border: none;
  background: none;
  cursor: pointer;
}

.casdc-news-card__title-btn {
  display: block;
  width: 100%;
  padding: 0;
  border: none;
  background: none;
  text-align: left;
  font: inherit;
  color: inherit;
  cursor: pointer;
  word-break: break-word;
  overflow-wrap: anywhere;
  white-space: normal;
}

.casdc-news-card__title-btn:hover {
  color: var(--fs-primary);
}

.casdc-news-card__title a {
  color: inherit;
  text-decoration: none;
}

.casdc-news-card__title a:hover {
  color: var(--fs-primary);
}

.casdc-news-card__dataset {
  margin: 0;
  font-size: 0.75rem;
  line-height: 1.5;
}

.casdc-news-card__dataset a {
  color: var(--fs-primary);
  font-weight: 600;
  text-decoration: none;
}

.casdc-news-card__dataset a:hover {
  text-decoration: underline;
}

.casdc-news-card__foot {
  display: flex;
  justify-content: space-between;
  gap: 0.5rem;
  padding-top: 0.35rem;
  border-top: 1px dashed var(--fs-border-subtle);
  font-size: 0.6875rem;
  color: var(--fs-text-muted);
}

.casdc-news-card__foot span {
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.casdc-news-card__foot time {
  flex-shrink: 0;
}

@media (max-width: 768px) {
  .casdc-base-info {
    padding: 1rem;
  }

  .casdc-panel {
    padding: 1rem;
  }

  .casdc-title-box {
    flex-direction: column;
    align-items: stretch;
    gap: 0.85rem;
  }

  .casdc-cover {
    width: 5.5rem;
    height: 5.5rem;
  }

  .casdc-title-main h1 {
    font-size: 1.15rem;
  }

  .casdc-jurisdiction {
    gap: 0.5rem;
  }

  .casdc-topbox {
    min-height: 120px;
  }

  .casdc-container-details {
    margin-top: -1rem;
    padding-bottom: 5rem;
  }

  .casdc-side-card {
    padding: 0.85rem 0.9rem;
    overflow: visible;
  }

  .casdc-details-item {
    grid-template-columns: 1fr;
    gap: 0.25rem;
  }

  .casdc-stats-section__head {
    flex-direction: column;
    align-items: stretch;
    gap: 0.75rem;
  }

  .casdc-stats-tabs {
    display: flex;
    width: 100%;
  }

  .casdc-stats-tab {
    flex: 1 1 0;
    text-align: center;
    padding: 0.4rem 0.35rem;
  }

  .casdc-stats-summary {
    grid-template-columns: 1fr;
  }

  .casdc-stats-summary__item {
    flex-wrap: wrap;
  }

  .casdc-stats-summary__item strong {
    margin-left: 0;
    width: 100%;
    margin-top: 0.15rem;
  }

  .casdc-bar-chart__body {
    gap: 0.35rem;
  }

  .casdc-bar-chart__y-wrap {
    width: 1.75rem;
  }

  .casdc-bar-chart__canvas {
    overflow-x: auto;
    -webkit-overflow-scrolling: touch;
    max-width: 100%;
  }

  .casdc-bar-chart__plot-area,
  .casdc-bar-chart__x-axis {
    min-width: max(100%, 280px);
  }

  .casdc-news-card {
    flex-direction: column;
    align-items: stretch;
    gap: 0.65rem;
  }

  .casdc-news-card__cover {
    width: 100%;
    align-self: stretch;
  }

  .casdc-news-card__cover img {
    aspect-ratio: 16 / 9;
    max-height: 9rem;
    width: 100%;
  }

  .casdc-news-card__title {
    -webkit-line-clamp: 4;
    line-clamp: 4;
    overflow: visible;
    display: block;
    text-overflow: unset;
  }

  .casdc-news-card__summary {
    -webkit-line-clamp: 4;
    line-clamp: 4;
  }

  .casdc-news-card__foot {
    flex-wrap: wrap;
  }

  .casdc-news-card__foot span {
    white-space: normal;
    overflow: visible;
    text-overflow: unset;
  }

  .casdc-file-table {
    min-width: 0;
  }

  .casdc-file-table-scroll {
    max-width: 100%;
  }

  .casdc-meta-table,
  .casdc-meta-table tbody,
  .casdc-meta-table tr,
  .casdc-meta-table td {
    display: block;
    width: 100%;
  }

  .casdc-meta-table tr + tr {
    margin-top: 0;
  }

  .casdc-meta-table td {
    border-top: none;
  }

  .casdc-meta-table tr {
    border-top: 1px solid #e2e8f0;
  }

  .casdc-meta-table__empty {
    display: none;
  }

  .casdc-meta-table__cell {
    flex-direction: column;
    align-items: flex-start;
    gap: 0.2rem;
  }
}
</style>
