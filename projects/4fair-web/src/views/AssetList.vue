<template>
  <div class="asset-list-page bg-slate-50 min-h-screen pb-[calc(3.75rem+env(safe-area-inset-bottom,0px))] md:pb-0">
    <!-- Header (glass-nav) -->
    <nav class="glass-nav fixed top-0 w-full z-50 hidden md:block">
      <div class="relative max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-2">
        <div class="flex items-center space-x-2 group cursor-pointer shrink-0 z-10" @click="router.push('/home')">
          <BrandLogo size="lg" interactive />
          <span class="text-lg sm:text-xl font-bold tracking-tight text-slate-900">费尔空间</span>
        </div>
        <SiteTopNavLinks active="assets" />
        <div class="flex items-center space-x-2 sm:space-x-4 shrink-0 z-10">
          <UserCenterNavButton />
          <template v-if="!authStore.isLoggedIn">
            <button @click="goToLogin" class="btn-gradient text-white font-bold py-2 px-4 sm:px-5 rounded-xl transition-all text-sm">登录</button>
          </template>
          <template v-else>
            <!-- 消息通知按钮 -->
            <button 
              @click="showNoticeModal = true" 
              class="relative p-2 hover:bg-slate-100 rounded-lg transition-colors"
              title="消息通知"
            >
              <iconify-icon icon="mdi:bell-outline" class="text-lg text-slate-600"></iconify-icon>
              <span 
                v-if="unreadCount > 0" 
                class="absolute -top-0.5 -right-0.5 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center"
              >
                {{ unreadCount > 99 ? '99+' : unreadCount }}
              </span>
            </button>
            <span class="hidden sm:inline text-sm text-slate-600">欢迎您，{{ authStore.displayName }}</span>
            <button @click="handleLogout" class="text-xs text-slate-400 hover:text-red-500 transition-colors px-2 py-1">退出</button>
          </template>
        </div>
      </div>
    </nav>

    <main class="max-w-7xl mx-auto px-6 pt-4 md:pt-20 pb-10">
      <div class="flex flex-col md:flex-row gap-8">
        <!-- 侧边栏筛选：数据领域（可滚动）+ 访问级别（固定底部） -->
        <aside class="asset-sidebar md:w-72 shrink-0">
          <div class="asset-sidebar__panel">
            <section class="asset-sidebar__section asset-sidebar__section--subject">
              <header class="asset-sidebar__head asset-sidebar__head--toggle" @click="subjectCollapsed = !subjectCollapsed">
                <h3 class="asset-sidebar__title">数据领域</h3>
                <span v-if="!subjectsLoading && subjectTree.length" class="asset-sidebar__badge font-num">
                  {{ subjectStats.length }} 项
                </span>
                <iconify-icon :icon="subjectCollapsed ? 'mdi:chevron-right' : 'mdi:chevron-down'" class="asset-sidebar__toggle" />
              </header>

              <div v-if="subjectsLoading" class="asset-sidebar__state">
                <iconify-icon class="text-xl animate-spin text-blue-500" icon="mdi:loading"></iconify-icon>
                <span>加载领域…</span>
              </div>
              <p v-else-if="subjectsError" class="asset-sidebar__error">{{ subjectsError }}</p>
              <div v-else v-show="!subjectCollapsed" class="asset-sidebar__scroll asset-sidebar__scroll--subject">
                <SubjectTreeFilter
                  v-if="subjectTree.length > 0"
                  v-model="subjectPick"
                  :nodes="subjectTree"
                  :expanded-paths="expandedSubjectPaths"
                  @toggle-expand="toggleSubjectExpand"
                />
                <p v-else class="text-xs text-slate-400 py-2 text-center">暂无领域统计</p>
              </div>
            </section>

            <div class="asset-sidebar__divider" role="separator"></div>

            <section class="asset-sidebar__section asset-sidebar__section--datacenter">
              <header class="asset-sidebar__head asset-sidebar__head--toggle" @click="dataCenterCollapsed = !dataCenterCollapsed">
                <h3 class="asset-sidebar__title">数据中心</h3>
                <iconify-icon :icon="dataCenterCollapsed ? 'mdi:chevron-right' : 'mdi:chevron-down'" class="asset-sidebar__toggle" />
              </header>
              <div v-if="dataCentersLoading" class="asset-sidebar__state">
                <iconify-icon class="text-xl animate-spin text-blue-500" icon="mdi:loading"></iconify-icon>
                <span>加载中心…</span>
              </div>
              <div v-else v-show="!dataCenterCollapsed" class="asset-sidebar__scroll asset-sidebar__scroll--datacenter">
                <label class="asset-sidebar__level-item">
                  <input v-model="selectedDataCenter" value="全部" name="datacenter" type="radio" class="text-blue-600 shrink-0" />
                  <span>全部</span>
                </label>
                <label v-for="dc in dataCenterList" :key="dc.name" class="asset-sidebar__level-item">
                  <input v-model="selectedDataCenter" :value="dc.name" name="datacenter" type="radio" class="text-blue-600 shrink-0" />
                  <span>{{ dc.name }}</span>
                </label>
              </div>
            </section>

            <div class="asset-sidebar__divider" role="separator"></div>

            <section class="asset-sidebar__section asset-sidebar__section--level">
              <header class="asset-sidebar__head">
                <h3 class="asset-sidebar__title">访问级别</h3>
              </header>
              <div class="asset-sidebar__level-list">
                <label
                  v-for="level in accessLevels"
                  :key="level"
                  class="asset-sidebar__level-item"
                >
                  <input
                    v-model="selectedLevel"
                    :value="level"
                    name="level"
                    type="radio"
                    class="text-blue-600 shrink-0"
                  />
                  <span>{{ level }}</span>
                </label>
              </div>
            </section>
          </div>
        </aside>

        <!-- 列表内容 -->
        <div class="flex-1 space-y-6">
          <!-- 搜索栏 -->
          <div class="bg-white p-4 rounded-2xl border border-slate-200 mb-6">
            <div class="flex flex-col md:flex-row gap-3">
              <div class="flex-1">
                <input
                  v-model="searchQuery"
                  type="text"
                  placeholder="请输入数据集名称或关键字"
                  class="w-full px-4 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  @keyup.enter="handleSearch"
                />
              </div>
              <button @click="handleSearch" class="px-6 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors">搜索</button>
            </div>
          </div>

          <!-- 存在未发布/未授权数据集时提示 -->
          <!-- <div
            v-if="showUnpublishedHint"
            class="dataset-open-hint"
            role="alert"
            aria-live="polite"
          >
            <button
              type="button"
              class="dataset-open-hint__btn"
              @click="openMyDatasetsModal"
            >
              <span class="dataset-open-hint__icon-wrap" aria-hidden="true">
                <iconify-icon icon="mdi:shield-alert-outline" class="dataset-open-hint__icon" />
              </span>
              <span class="dataset-open-hint__body">
                <span class="dataset-open-hint__badge">待授权</span>
                <span class="dataset-open-hint__text">您有暂未授权的数据集</span>
              </span>
              <span class="dataset-open-hint__action">
                去设置
                <iconify-icon icon="mdi:chevron-right" class="dataset-open-hint__arrow" />
              </span>
            </button>
          </div> -->

          <!-- 统计和排序 -->
          <div class="flex items-center justify-between mb-2">
            <p class="text-sm text-slate-500">
              找到 <span class="text-slate-900 font-bold font-num tabular-nums">{{ total }}</span> 个相关数据集
            </p>
            <!-- <select v-model="sortBy" @change="handleSortChange" class="px-3 py-1.5 border border-slate-200 rounded-lg text-xs bg-white outline-none">
              <option value="_id">全部</option>
              <option value="viewCount">热门数据</option>
              <option value="publishAt">最新上线</option>
            </select> -->
          </div>

          <!-- 加载状态 -->
          <div v-if="loading" class="text-center py-20 text-slate-400">
            <iconify-icon class="text-6xl mb-4 animate-spin" icon="mdi:loading"></iconify-icon>
            <p>正在加载数据集...</p>
          </div>

          <!-- 错误状态 -->
          <div v-else-if="error" class="text-center py-20">
            <iconify-icon class="text-6xl text-red-300 mb-4" icon="mdi:alert-circle-outline"></iconify-icon>
            <p class="text-slate-500 mb-4">{{ error }}</p>
            <button @click="fetchDatasets" class="px-6 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors">重新加载</button>
          </div>

          <!-- 资产卡片列表 -->
          <template v-else>
            <div
              v-for="asset in datasets"
              :key="asset.id"
              class="bg-white rounded-2xl border border-slate-200 p-6 flex gap-6 hover:shadow-lg transition-all"
            >
              <!-- 封面图 -->
              <div class="w-32 h-32 shrink-0 rounded-xl overflow-hidden bg-slate-100 flex items-center justify-center">
                <img
                  v-if="asset.coverUrl"
                  :src="asset.coverUrl"
                  :alt="asset.title"
                  class="w-full h-full object-cover"
                  @error="asset.coverUrl = ''"
                />
                <iconify-icon v-else class="text-4xl text-slate-300" icon="mdi:database"></iconify-icon>
              </div>
              <div class="flex-1 min-w-0">
                <div class="flex items-start justify-between gap-3 mb-2">
                  <div class="flex items-center gap-2 flex-wrap min-w-0">
                    <span :class="`px-2 py-0.5 text-[10px] font-bold rounded ${getLevelClass(asset.level)}`">{{ asset.level }}</span>
                    <span class="px-2 py-0.5 bg-slate-100 text-slate-600 text-[10px] font-bold rounded">{{ asset.subject }}</span>
                    <span class="text-[10px] text-slate-400">更新于 {{ asset.updatedAt }}</span>
                  </div>
                  <DataSeekButton disabled />
                </div>
                <h3
                  class="text-lg font-bold text-slate-800 mb-2 cursor-pointer hover:text-blue-600 transition-colors"
                  @click="openDetailInNewTab(asset)"
                >
                  {{ asset.title }}
                </h3>
                <p class="text-xs text-slate-500 line-clamp-2 mb-4">{{ asset.description }}</p>
                <div class="flex items-center justify-between flex-wrap gap-2">
                  <div class="flex gap-4 items-center flex-wrap">
                    <div class="flex items-center gap-1 text-[10px] text-slate-400">
                      <iconify-icon icon="mdi:office-building-marker"></iconify-icon>
                      {{ asset.source }}
                    </div>
                    <div class="flex items-center gap-1 text-[10px] text-slate-400">
                      <iconify-icon icon="mdi:database-outline"></iconify-icon>
                      {{ asset.dataSize }}
                    </div>
                    <div class="flex items-center gap-1 text-[10px] text-slate-400">
                      <iconify-icon icon="mdi:file-document-outline"></iconify-icon>
                      {{ asset.fileNumber }} 个文件
                    </div>
                  </div>
                  <div class="flex gap-2 shrink-0">
                    <button
                      type="button"
                      class="px-4 py-1.5 border border-slate-300 text-slate-700 bg-white text-xs font-bold rounded hover:border-blue-500 hover:text-blue-600 transition-colors"
                      @click.stop="handleDataApply(asset)"
                    >
                      数据申请
                    </button>
                    <button
                      type="button"
                      class="px-4 py-1.5 bg-slate-900 text-white text-xs font-bold rounded hover:bg-slate-800 transition-colors"
                      @click.stop="viewDetail(asset)"
                    >
                      查看详情
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <!-- 空状态 -->
            <div v-if="datasets.length === 0" class="text-center py-20 text-slate-400">
              <iconify-icon class="text-6xl mb-4" icon="mdi:database-search-off"></iconify-icon>
              <p>未找到匹配的数据集</p>
            </div>

            <!-- 分页器（有数据即展示，单页时按钮禁用） -->
            <div
              v-if="total > 0"
              class="mt-8 pt-6 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-4"
            >
              <p class="text-sm text-slate-500 order-2 sm:order-1">
                共 <span class="font-semibold text-slate-900 font-num tabular-nums">{{ total }}</span> 条，每页 <span class="font-num">{{ pageSize }}</span> 条 · 第
                <span class="font-semibold text-slate-900 font-num tabular-nums">{{ currentPage }}</span> / <span class="font-num">{{ totalPages }}</span> 页
              </p>
              <div class="flex items-center justify-center gap-1.5 order-1 sm:order-2 flex-wrap">
                <button
                  type="button"
                  class="px-3 py-1.5 text-sm font-medium border border-slate-200 rounded-lg text-slate-600 hover:border-blue-500 hover:text-blue-600 transition-colors disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:border-slate-200 disabled:hover:text-slate-600"
                  :disabled="currentPage <= 1"
                  @click="changePage(1)"
                >
                  主页
                </button>
                <button
                  type="button"
                  class="w-9 h-9 flex items-center justify-center border border-slate-200 rounded-lg text-slate-500 hover:border-blue-500 hover:text-blue-600 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                  :disabled="currentPage <= 1"
                  @click="changePage(currentPage - 1)"
                  aria-label="上一页"
                >
                  <iconify-icon icon="mdi:chevron-left"></iconify-icon>
                </button>
                <button
                  v-for="p in displayedPages"
                  :key="p"
                  type="button"
                  class="min-w-[2.25rem] h-9 px-2 flex items-center justify-center border rounded-lg text-sm font-medium transition-colors"
                  :class="p === currentPage ? 'border-blue-500 bg-blue-50 text-blue-600' : 'border-slate-200 text-slate-600 hover:border-blue-500 hover:text-blue-600'"
                  @click="changePage(p)"
                >
                  {{ p }}
                </button>
                <button
                  type="button"
                  class="w-9 h-9 flex items-center justify-center border border-slate-200 rounded-lg text-slate-500 hover:border-blue-500 hover:text-blue-600 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                  :disabled="currentPage >= totalPages"
                  @click="changePage(currentPage + 1)"
                  aria-label="下一页"
                >
                  <iconify-icon icon="mdi:chevron-right"></iconify-icon>
                </button>
                <button
                  type="button"
                  class="px-3 py-1.5 text-sm font-medium border border-slate-200 rounded-lg text-slate-600 hover:border-blue-500 hover:text-blue-600 transition-colors disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:border-slate-200 disabled:hover:text-slate-600"
                  :disabled="currentPage >= totalPages"
                  @click="changePage(totalPages)"
                >
                  末页
                </button>
                <span class="w-px h-6 bg-slate-200 mx-1 hidden sm:block" aria-hidden="true"></span>
                <div class="flex items-center gap-1.5 pl-1">
                  <span class="text-sm text-slate-500 whitespace-nowrap">跳至</span>
                  <input
                    v-model="jumpPageInput"
                    type="number"
                    min="1"
                    :max="totalPages"
                    inputmode="numeric"
                    placeholder="页码"
                    class="pagination-jump-input w-14 h-9 px-2 text-center text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-num tabular-nums"
                    @keyup.enter="jumpToPage"
                  />
                  <button
                    type="button"
                    class="px-3 py-1.5 text-sm font-medium border border-slate-200 rounded-lg text-slate-600 hover:border-blue-500 hover:text-blue-600 transition-colors"
                    @click="jumpToPage"
                  >
                    跳转
                  </button>
                </div>
              </div>
            </div>
          </template>
        </div>
      </div>
    </main>

    <AppFooter />
    <NoticeDrawer v-model="showNoticeModal" />
    <ProfileCompletionModal
      v-model="showProfileModal"
      :initial-phone="profileInitial.phone"
      :initial-email="profileInitial.email"
      :initial-real-name="profileInitial.realName"
      :initial-field="profileInitial.field"
      :initial-org-name="profileInitial.orgName"
      @completed="onProfileModalCompleted"
    />
    <DatasetApplicationModal
      v-model="showApplicationModal"
      :dataset="applicationDataset"
      :applicant="applicationApplicant"
      :uid="applicationUid"
      @submitted="onApplicationSubmitted"
    />
    <SiteBottomTabBar active="assets" />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, reactive, onMounted, onActivated, onDeactivated, watch, nextTick } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import SubjectTreeFilter from '@/components/SubjectTreeFilter.vue'
import BrandLogo from '@/components/BrandLogo.vue'
import AppFooter from '@/components/AppFooter.vue'
import SiteBottomTabBar from '@/components/SiteBottomTabBar.vue'
import SiteTopNavLinks from '@/components/SiteTopNavLinks.vue'
import UserCenterNavButton from '@/components/UserCenterNavButton.vue'
import DataSeekButton from '@/components/DataSeekButton.vue'
import ProfileCompletionModal from '@/components/ProfileCompletionModal.vue'
import DatasetApplicationModal, {
  type DatasetApplicationTarget
} from '@/components/DatasetApplicationModal.vue'
import { resolveApplicantUidFromUser } from '@/utils/resolveApplicantUid'
import {
  fetchUserContactByUid,
  type UserContactSnapshot
} from '@/utils/userCenterApi'
import {
  buildSubjectTreeFromStatistics,
  parseSubjectStatisticsData,
  type SubjectTreeNode
} from '@/utils/subjectTree'

defineOptions({ name: 'AssetList' })
import { useAuthStore } from '@/stores/auth'
import { goLogin } from '@/utils/loginRedirect'
import { openAssetDetailInNewTab } from '@/utils/openAssetDetail'
import { parseNameZhLabel, resolveScidbStaticUrl, formatShareModeLabel } from '@/utils/casdcDetailMapper'
import { stripHtml } from '@/utils/richText'
import { useMyDatasetsModal } from '@/composables/useMyDatasetsModal'
import { useNoticeList } from '@/composables/useNoticeList'
import NoticeDrawer from '@/components/NoticeDrawer.vue'

const router = useRouter()
const route = useRoute()
const authStore = useAuthStore()
const { visible: myDatasetsModalVisible } = useMyDatasetsModal()

// ----- 状态 -----
const loading = ref(false)
const error = ref('')
const datasets = ref<any[]>([])
const total = ref(0)
const currentPage = ref(1)
const pageSize = ref(10)
const jumpPageInput = ref('')
const searchQuery = ref('')
const sortBy = ref('updateAt')
/** 领域：none=不按领域；否则为单个 _id */
const subjectPick = ref<'none' | string>('none')
const selectedLevel = ref('全部')
const selectedDataCenter = ref('全部')
const dataCenterList = ref<{ name: string; datasetNumber: number }[]>([])
const dataCentersLoading = ref(false)
const subjectCollapsed = ref(false)
const dataCenterCollapsed = ref(false)

const subjectStats = ref<{ name: string; datasetNumber: number }[]>([])
const subjectTree = ref<SubjectTreeNode[]>([])
const expandedSubjectPaths = ref<Set<string>>(new Set())
const subjectsLoading = ref(false)
const subjectsError = ref('')

/** 是否存在未发布数据集（null=未查询） */
const hasUnpublished = ref<boolean | null>(null)

const accessLevels = ['全部', '开放共享', '审核使用', '受控使用']

/** 侧边栏访问级别 → 接口 shareMode */
const accessLevelShareModeMap: Record<string, string> = {
  开放共享: 'PUBLIC'
}

function resolveShareModeQuery(level: string): string | null {
  if (level === '全部') return null
  return accessLevelShareModeMap[level] ?? level
}

// ===== 消息通知（右侧抽屉）=====
const showNoticeModal = ref(false)
const { unreadCount } = useNoticeList()

type AssetCardItem = ReturnType<typeof mapApiRecord>

const showProfileModal = ref(false)
const showApplicationModal = ref(false)
const applicationDataset = ref<DatasetApplicationTarget | null>(null)
const applicationApplicant = reactive({
  name: '',
  email: '',
  phone: '',
  orgName: ''
})
const applicationUid = ref('')
const profileInitial = reactive({
  phone: '',
  email: '',
  realName: '',
  field: '',
  orgName: ''
})
const pendingApplyAsset = ref<AssetCardItem | null>(null)
const applyOpening = reactive<Record<string, boolean>>({})

// ----- 数据领域统计 -----
async function fetchSubjectStatistics() {
  subjectsLoading.value = true
  subjectsError.value = ''
  try {
    const res = await fetch('/tds-trading/order/subject.datasetStatistics')
    const json = await res.json()
    if (json.code !== 200) throw new Error(json.message || '获取领域统计失败')

    const items = parseSubjectStatisticsData(json.data)
    subjectStats.value = items.map((item) => ({
      name: item.label,
      datasetNumber: item.datasetNumber
    }))
    subjectTree.value = buildSubjectTreeFromStatistics(items)
    expandedSubjectPaths.value = new Set()
  } catch (e: any) {
    subjectsError.value = e?.message || '网络错误'
    subjectStats.value = []
    subjectTree.value = []
    expandedSubjectPaths.value = new Set()
  } finally {
    subjectsLoading.value = false
  }
}

function subjectQueryParam(): string | null {
  if (subjectPick.value === 'none') return null
  return subjectPick.value
}

watch(subjectPick, () => {
  currentPage.value = 1
  syncRouteQuery()
  fetchDatasets()
})

function toggleSubjectExpand(path: string) {
  const next = new Set(expandedSubjectPaths.value)
  if (next.has(path)) next.delete(path)
  else next.add(path)
  expandedSubjectPaths.value = next
}

watch(selectedLevel, () => {
  currentPage.value = 1
  syncRouteQuery()
  fetchDatasets()
})

watch(selectedDataCenter, () => {
  currentPage.value = 1
  syncRouteQuery()
  fetchDatasets()
})

async function fetchDataCenterStatistics() {
  dataCentersLoading.value = true
  try {
    const res = await fetch('/tds-trading/order/datacenter.datasetStatistics')
    const json = await res.json()
    if (json.code === 200 && Array.isArray(json.data)) {
      dataCenterList.value = json.data
        .map((d: any) => ({
          name: String(d._id || '').trim(),
          datasetNumber: Number(d.datesetNumber || 0)
        }))
        .filter((d: { name: string }) => d.name)
    }
  } catch {
    /* 静默 */
  } finally {
    dataCentersLoading.value = false
  }
}

// ----- API 调用 -----
async function fetchDatasets() {
  loading.value = true
  error.value = ''
  try {
    const params = new URLSearchParams({
      page: String(currentPage.value),
      pageSize: String(pageSize.value),
      sort: sortBy.value,
    })
    const kw = searchQuery.value.trim()
    if (kw) {
      params.set('keyword', kw)
      params.set('titleZh', kw)
    }
    const subjectStr = subjectQueryParam()
    if (subjectStr) {
      params.set('subject', subjectStr)
    }
    const shareMode = resolveShareModeQuery(selectedLevel.value)
    if (shareMode) {
      params.set('shareMode', shareMode)
    }
    if (selectedDataCenter.value !== '全部') {
      params.set('source', selectedDataCenter.value)
    }
    const res = await fetch(`/tds-trading/order/dataset.page?${params.toString()}`)
    const json = await res.json()
    if (json.code === 200 && json.data) {
      datasets.value = (json.data.rows || []).map(mapApiRecord)
      total.value = json.data.total || 0
    } else {
      throw new Error(json.message || '获取数据集失败')
    }
  } catch (e: any) {
    error.value = e.message || '网络错误，请检查连接'
    datasets.value = []
    total.value = 0
  } finally {
    loading.value = false
  }
}

// ----- 计算属性 -----
const totalPages = computed(() => Math.max(1, Math.ceil(total.value / pageSize.value)))

const displayedPages = computed(() => {
  const pages: number[] = []
  const tp = totalPages.value
  const cp = currentPage.value
  let start = Math.max(1, cp - 2)
  let end = Math.min(tp, cp + 2)
  if (end - start < 4) {
    if (start === 1) end = Math.min(tp, start + 4)
    else start = Math.max(1, end - 4)
  }
  for (let i = start; i <= end; i++) pages.push(i)
  return pages
})

function readRouteKeyword(): string {
  return String(route.query.keyword || '').trim()
}

function readRoutePage(): number {
  const n = Number.parseInt(String(route.query.page || '1'), 10)
  return Number.isFinite(n) && n > 0 ? n : 1
}

function syncRouteQuery() {
  const next: Record<string, string> = {}
  const kw = searchQuery.value.trim()
  if (kw) next.keyword = kw
  if (currentPage.value > 1) next.page = String(currentPage.value)

  const curKw = readRouteKeyword()
  const curPage = readRoutePage()
  if (curKw === (next.keyword || '') && curPage === (next.page ? Number(next.page) : 1)) return

  router.replace({ path: route.path, query: next })
}

function applyRouteState(): boolean {
  let changed = false
  const kw = readRouteKeyword()
  if (kw !== searchQuery.value.trim()) {
    searchQuery.value = kw
    changed = true
  }
  const page = readRoutePage()
  if (page !== currentPage.value) {
    currentPage.value = page
    changed = true
  }
  if (changed) fetchDatasets()
  return changed
}

// ----- 事件处理 -----
function handleSearch() {
  currentPage.value = 1
  syncRouteQuery()
  fetchDatasets()
}

function changePage(page: number) {
  if (page < 1 || page > totalPages.value) return
  currentPage.value = page
  syncRouteQuery()
  fetchDatasets()
  window.scrollTo({ top: 0, behavior: 'smooth' })
}

function jumpToPage() {
  const raw = String(jumpPageInput.value).trim()
  if (!raw) return
  const n = Number.parseInt(raw, 10)
  if (!Number.isFinite(n)) return
  changePage(Math.min(totalPages.value, Math.max(1, n)))
  jumpPageInput.value = ''
}

function openDetailInNewTab(asset: { cstr?: string; id?: string }) {
  openAssetDetailInNewTab(router, asset)
}

function viewDetail(asset: any) {
  openDetailInNewTab(asset)
}

async function resolveApplyUid(): Promise<string> {
  authStore.syncFromStorage()
  let uid = resolveApplicantUidFromUser(authStore.user)
  const openId = String(authStore.user?.openId || '').trim()
  if (openId && (!uid || uid === openId)) {
    await authStore.fetchUserInfo(openId)
    uid = String(authStore.user?.uid || '').trim()
  }
  if (!uid || (openId && uid === openId)) {
    throw new Error('未获取到用户 uid，请重新登录后再试')
  }
  return uid
}

function fillApplicantFromContact(contact: UserContactSnapshot | null | undefined) {
  applicationApplicant.name = contact?.name || ''
  applicationApplicant.email = contact?.email || contact?.username || ''
  applicationApplicant.phone = contact?.phone || ''
  applicationApplicant.orgName = contact?.orgName || ''
}

function toApplicationDataset(asset: AssetCardItem): DatasetApplicationTarget {
  return {
    id: String(asset.id || '').trim(),
    cstr: String(asset.cstr || asset.id || '').trim(),
    title: asset.title,
    level: asset.level,
    subject: asset.subject,
    source: asset.source,
    dataSize: asset.dataSize,
    fileNumber: asset.fileNumber,
    updatedAt: asset.updatedAt
  }
}

function openApplicationModal(asset: AssetCardItem, contact?: UserContactSnapshot | null, uid?: string) {
  applicationDataset.value = toApplicationDataset(asset)
  fillApplicantFromContact(contact)
  applicationUid.value = uid || resolveApplicantUidFromUser(authStore.user)
  showApplicationModal.value = true
}

function onApplicationSubmitted() {
  applicationDataset.value = null
  applicationUid.value = ''
  fillApplicantFromContact(null)
}

function proceedToIntentApply(asset: AssetCardItem, contact?: UserContactSnapshot | null, uid?: string) {
  openApplicationModal(asset, contact, uid)
}

async function onProfileModalCompleted() {
  const asset = pendingApplyAsset.value
  pendingApplyAsset.value = null
  if (!asset) return
  try {
    const uid = await resolveApplyUid()
    const contact = await fetchUserContactByUid(uid)
    proceedToIntentApply(asset, contact, uid)
  } catch (e: unknown) {
    window.alert(e instanceof Error ? e.message : '加载用户信息失败，请稍后重试')
  }
}

async function handleDataApply(asset: AssetCardItem) {
  const key = String(asset.cstr || asset.id || '').trim()
  if (!key || applyOpening[key]) return

  authStore.syncFromStorage()
  if (!authStore.isLoggedIn) {
    void goLogin(router, router.currentRoute.value.fullPath)
    return
  }

  applyOpening[key] = true
  try {
    const uid = await resolveApplyUid()
    const contact = await fetchUserContactByUid(uid)
    if (!contact?.complete) {
      pendingApplyAsset.value = asset
      profileInitial.phone = contact?.phone || ''
      profileInitial.email = contact?.email || contact?.username || ''
      profileInitial.realName = contact?.name || ''
      profileInitial.field = contact?.field || ''
      profileInitial.orgName = contact?.orgName || ''
      showProfileModal.value = true
      return
    }
    proceedToIntentApply(asset, contact, uid)
  } catch (e: unknown) {
    window.alert(e instanceof Error ? e.message : '数据申请准备失败，请稍后重试')
  } finally {
    applyOpening[key] = false
  }
}

/** keep-alive 返回列表时恢复滚动位置 */
const savedScrollY = ref(0)
onDeactivated(() => {
  savedScrollY.value = window.scrollY
})
onActivated(() => {
  applyRouteState()
  nextTick(() => {
    window.scrollTo(0, savedScrollY.value)
  })
})

function goToLogin() {
  void goLogin(router, router.currentRoute.value.fullPath)
}

function handleLogout() {
  authStore.logout()
}

// ----- 辅助函数 -----
function formatFileSize(bytes: number | string): string {
  const b = Number(bytes)
  if (!b || b <= 0) return '未知'
  const units = ['B', 'KB', 'MB', 'GB', 'TB']
  let i = 0
  let size = b
  while (size >= 1024 && i < units.length - 1) {
    size /= 1024
    i++
  }
  return `${size.toFixed(i === 0 ? 0 : 1)} ${units[i]}`
}

function formatDate(dateStr: string): string {
  if (!dateStr) return ''
  return dateStr.substring(0, 10)
}

function mapLevel(shareMode: string): string {
  return formatShareModeLabel(shareMode) || '开放访问'
}

const getLevelClass = (level: string) => {
  const classes: Record<string, string> = {
    '开放共享': 'bg-green-100 text-green-700',
    '开放访问': 'bg-green-100 text-green-700',
    '审核使用': 'bg-blue-100 text-blue-700',
    '受控使用': 'bg-red-100 text-red-700'
  }
  return classes[level] || 'bg-slate-100 text-slate-700'
}

// 将 API 记录映射为卡片数据
function mapApiRecord(item: any) {
  return {
    id: item.id,
    cstr: item.cstr || item.id,
    title: item.titleZh || '无标题',
    description: stripHtml(item.introductionZh || '') || '暂无描述',
    level: mapLevel(item.shareMode),
    subject: parseNameZhLabel(item.subject) || '其他',
    source: item.source || '未知来源',
    dataSize: formatFileSize(item.byteSize),
    fileNumber: item.fileNumber || 0,
    coverUrl: resolveScidbStaticUrl(item.coverUrl || ''),
    updatedAt: formatDate(item.updateAt),
    authors: item.authors || '',
    url: item.url || ''
  }
}

function resolveHasUnpublished(res: unknown): boolean {
  if (res === null || res === undefined) return false
  if (typeof res === 'boolean') return res
  if (typeof res !== 'object') return Boolean(res)
  const body = res as Record<string, unknown>
  if (typeof body.data === 'boolean') return body.data
  const data = body.data
  if (data && typeof data === 'object') {
    const nested = data as Record<string, unknown>
    if (typeof nested.hasUnpublished === 'boolean') return nested.hasUnpublished
    if (typeof nested.unpublished === 'boolean') return nested.unpublished
  }
  if (typeof body.hasUnpublished === 'boolean') return body.hasUnpublished
  if (body.code === 200 && body.data !== undefined) {
    return resolveHasUnpublished(body.data)
  }
  return false
}

async function fetchHasUnpublished() {
  const uid = authStore.user?.uid
  if (!authStore.isLoggedIn || !uid) {
    hasUnpublished.value = false
    return
  }

  try {
    const res = await fetch(
      `/tds-trading/order/dataset.hasUnpublished?uid=${encodeURIComponent(uid)}`
    )
    const json = await res.json()
    if (json.code !== undefined && json.code !== 200 && json.code !== 0) {
      hasUnpublished.value = false
      return
    }
    hasUnpublished.value = resolveHasUnpublished(json)
  } catch {
    hasUnpublished.value = false
  }
}

watch(
  () => [authStore.isLoggedIn, authStore.user?.uid] as const,
  () => {
    fetchHasUnpublished()
  },
  { immediate: true }
)

watch(myDatasetsModalVisible, (visible, wasVisible) => {
  if (wasVisible && !visible) {
    fetchHasUnpublished()
  }
})

// ----- 初始化 -----
function initAssetListFromRoute() {
  const kw = readRouteKeyword()
  if (kw) searchQuery.value = kw
  currentPage.value = readRoutePage()
}

onMounted(() => {
  initAssetListFromRoute()
  void fetchSubjectStatistics()
  void fetchDataCenterStatistics()
  void fetchDatasets()
})
</script>

<style scoped>
@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

.animate-spin {
  animation: spin 1s linear infinite;
}

/* 未授权数据集提示条 */
.dataset-open-hint {
  margin-bottom: 14px;
}

.dataset-open-hint__btn {
  width: 100%;
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 14px 16px;
  text-align: left;
  border: 1px solid #fbbf24;
  border-left: 4px solid #d97706;
  border-radius: 12px;
  background: linear-gradient(105deg, #fffbeb 0%, #fff7ed 55%, #ffffff 100%);
  box-shadow:
    0 0 0 1px rgba(251, 191, 36, 0.25),
    0 4px 14px rgba(217, 119, 6, 0.14);
  cursor: pointer;
  transition:
    border-color 0.2s ease,
    box-shadow 0.2s ease,
    background 0.2s ease;
}

.dataset-open-hint__btn:hover {
  border-color: #f59e0b;
  background: linear-gradient(105deg, #fef3c7 0%, #ffedd5 50%, #fffbeb 100%);
  box-shadow:
    0 0 0 1px rgba(245, 158, 11, 0.35),
    0 6px 18px rgba(217, 119, 6, 0.2);
}

.dataset-open-hint__btn:focus-visible {
  outline: 2px solid #2563eb;
  outline-offset: 2px;
}

.dataset-open-hint__icon-wrap {
  flex-shrink: 0;
  width: 44px;
  height: 44px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 12px;
  background: #fef3c7;
  border: 1px solid #fde68a;
}

.dataset-open-hint__icon {
  font-size: 1.625rem;
  color: #d97706;
}

.dataset-open-hint__body {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.dataset-open-hint__badge {
  align-self: flex-start;
  padding: 2px 8px;
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.04em;
  color: #92400e;
  background: #fde68a;
  border: 1px solid #fcd34d;
  border-radius: 999px;
}

.dataset-open-hint__text {
  font-size: 14px;
  font-weight: 600;
  line-height: 1.45;
  color: #78350f;
}

.dataset-open-hint__action {
  flex-shrink: 0;
  display: inline-flex;
  align-items: center;
  gap: 2px;
  padding: 8px 14px;
  font-size: 14px;
  font-weight: 700;
  color: #ffffff;
  background: linear-gradient(135deg, #1e40af 0%, #2563eb 100%);
  border-radius: 10px;
  box-shadow: 0 2px 8px rgba(37, 99, 235, 0.35);
  transition: opacity 0.2s ease, transform 0.2s ease;
}

.dataset-open-hint__btn:hover .dataset-open-hint__action {
  opacity: 0.95;
  transform: translateX(2px);
}

.dataset-open-hint__arrow {
  font-size: 1.125rem;
}

@media (max-width: 640px) {
  .dataset-open-hint__btn {
    flex-wrap: wrap;
    gap: 10px;
  }

  .dataset-open-hint__action {
    width: 100%;
    justify-content: center;
  }
}

.pagination-jump-input::-webkit-outer-spin-button,
.pagination-jump-input::-webkit-inner-spin-button {
  -webkit-appearance: none;
  margin: 0;
}

.pagination-jump-input {
  -moz-appearance: textfield;
  appearance: textfield;
}

/* —— 侧边筛选：分区 + 领域树独立滚动 —— */
.asset-sidebar__panel {
  display: flex;
  flex-direction: column;
  background: #fff;
  border: 1px solid var(--fs-border-subtle, #e2e8f0);
  border-radius: 1rem;
  box-shadow: var(--fs-card-shadow, 0 1px 3px rgba(15, 23, 42, 0.08));
}

@media (min-width: 768px) {
  .asset-sidebar__panel {
    position: sticky;
    top: 5.5rem;
    max-height: calc(100vh - 6.5rem);
    overflow-y: auto;
  }
}

.asset-sidebar__section {
  padding: 1rem 1rem 0.875rem;
  flex-shrink: 0;
}

.asset-sidebar__section--subject {
  padding-bottom: 0.75rem;
}

.asset-sidebar__section--datacenter {
  flex-shrink: 0;
  padding-top: 0.875rem;
  padding-bottom: 0.75rem;
}

.asset-sidebar__head--toggle {
  cursor: pointer;
  user-select: none;
}

.asset-sidebar__toggle {
  font-size: 1rem;
  color: #94a3b8;
  flex-shrink: 0;
}

.asset-sidebar__scroll--subject {
  max-height: 9rem;
}

.asset-sidebar__scroll--datacenter {
  max-height: 8rem;
}

.asset-sidebar__section--level {
  flex-shrink: 0;
  padding-top: 0.875rem;
  padding-bottom: 1rem;
  background: #f8fafc;
}

.asset-sidebar__head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.5rem;
  margin-bottom: 0.625rem;
}

.asset-sidebar__title {
  font-size: 0.875rem;
  font-weight: 700;
  color: #0f172a;
}

.asset-sidebar__badge {
  font-size: 0.6875rem;
  font-weight: 600;
  color: #64748b;
  background: #f1f5f9;
  padding: 0.15rem 0.45rem;
  border-radius: 999px;
  white-space: nowrap;
}

.asset-sidebar__divider {
  flex-shrink: 0;
  height: 1px;
  margin: 0 1rem;
  background: linear-gradient(90deg, transparent, #cbd5e1 12%, #cbd5e1 88%, transparent);
}

.asset-sidebar__scroll {

  overflow-x: hidden;
  overflow-y: auto;
  overscroll-behavior: contain;
  padding-right: 0.25rem;
  margin-right: -0.125rem;
}

.asset-sidebar__scroll::-webkit-scrollbar {
  width: 5px;
}

.asset-sidebar__scroll::-webkit-scrollbar-thumb {
  background: #cbd5e1;
  border-radius: 999px;
}

.asset-sidebar__scroll::-webkit-scrollbar-thumb:hover {
  background: #94a3b8;
}

.asset-sidebar__state {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.8125rem;
  color: #94a3b8;
  padding: 1rem 0;
}

.asset-sidebar__error {
  font-size: 0.75rem;
  color: #dc2626;
  padding: 0.5rem 0;
}

.asset-sidebar__level-list {
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
}

.asset-sidebar__level-item {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.8125rem;
  color: #475569;
  cursor: pointer;
  padding: 0.35rem 0.5rem;
  border-radius: 0.375rem;
  transition: background 0.15s ease, color 0.15s ease;
}

.asset-sidebar__level-item:hover {
  background: #fff;
  color: #2563eb;
}

@media (max-width: 767px) {
  .asset-sidebar__panel {
    max-height: none;
  }

}

</style>
