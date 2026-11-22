<template>
  <div class="dch-page">
    <nav class="glass-nav fixed top-0 w-full z-50 hidden md:block">
      <div class="relative max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-2">
        <div class="flex items-center space-x-2 group cursor-pointer shrink-0 z-10" @click="router.push('/home')">
          <BrandLogo size="md" interactive />
          <span class="text-lg sm:text-xl font-bold tracking-tight text-slate-900">费尔空间</span>
        </div>
        <SiteTopNavLinks />
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

    <main class="dch-main">
      <header class="dch-head">
        <div>
          <p class="dch-head__eyebrow">{{ access.mode === 'all' ? '超级管理员' : '机构管理员' }}</p>
          <h1>{{ pageTitle }}</h1>
          <p>{{ pageSubtitle }}</p>
        </div>
        <div class="dch-head__actions">
          <button type="button" class="dch-btn dch-btn--ghost" @click="router.push('/profile')">
            返回用户中心
          </button>
          <button type="button" class="dch-btn" :disabled="loading" @click="load">
            <iconify-icon :icon="loading ? 'mdi:loading' : 'mdi:refresh'" :class="{ 'animate-spin': loading }" />
            刷新
          </button>
        </div>
      </header>

      <div v-if="gateError" class="dch-state dch-state--error">
        <p>{{ gateError }}</p>
        <button type="button" class="dch-btn" @click="router.push('/profile')">返回用户中心</button>
      </div>

      <template v-else>
        <div v-if="loading && !bundles.length" class="dch-state">
          <iconify-icon icon="mdi:loading" class="animate-spin text-3xl text-blue-600" />
          <p>正在加载数据中心信息…</p>
        </div>
        <div v-else-if="loadError" class="dch-state dch-state--error">
          <p>{{ loadError }}</p>
          <button type="button" class="dch-btn" @click="load">重新加载</button>
        </div>
        <div v-else-if="!bundles.length" class="dch-state">
          <p>暂无数据中心节点</p>
        </div>

        <div v-else class="dch-centers">
          <section v-for="bundle in bundles" :key="bundle.center.id" class="dch-center">
            <header class="dch-center__head">
              <div>
                <h2>{{ bundle.center.name }}</h2>
                <p>{{ bundle.center.shortName }} · 共 {{ bundle.datasets.length }} 个数据集</p>
              </div>
              <span class="dch-center__badge">数据中心节点</span>
            </header>

            <p v-if="bundle.error" class="dch-center__error">{{ bundle.error }}</p>

            <div v-else-if="!bundle.datasets.length" class="dch-center__empty">该中心暂无数据集配置</div>

            <div v-else class="dch-grid">
              <article
                v-for="item in bundle.datasets"
                :key="`${bundle.center.id}-${item.external_id}`"
                class="dch-card"
                role="link"
                tabindex="0"
                @click="openWorkspace(item)"
                @keydown.enter.prevent="openWorkspace(item)"
              >
                <div class="dch-card__cover">
                  <img
                    v-if="item.dataSetPicture"
                    :src="item.dataSetPicture"
                    :alt="item.name"
                    @error="onCoverError(item)"
                  />
                  <iconify-icon v-else icon="mdi:database" class="text-3xl text-slate-300" />
                </div>
                <div class="dch-card__body">
                  <h3>{{ item.name }}</h3>
                  <p>{{ item.summary || '暂无简介' }}</p>
                  <div class="dch-card__meta">
                    <span>更新：{{ item.updateAt || '—' }}</span>
                    <span>{{ formatByteSize(item.byteSize) }}</span>
                    <span>工具：{{ (item.tools || []).length }}</span>
                  </div>
                  <p class="dch-card__uuid">{{ item.external_id }}</p>
                </div>
              </article>
            </div>
          </section>
        </div>
      </template>
    </main>

    <AppFooter />
    <SiteBottomTabBar />
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { goLogin } from '@/utils/loginRedirect'
import BrandLogo from '@/components/BrandLogo.vue'
import AppFooter from '@/components/AppFooter.vue'
import SiteBottomTabBar from '@/components/SiteBottomTabBar.vue'
import SiteTopNavLinks from '@/components/SiteTopNavLinks.vue'
import UserCenterNavButton from '@/components/UserCenterNavButton.vue'
import { useAuthStore } from '@/stores/auth'
import { resolveDataCenterAccess } from '@/utils/dataCenterAccess'
import {
  fetchAllDataCenterBundles,
  fetchDataCenterDatasets,
  type DataCenterDatasetBundle
} from '@/utils/dataCenterRegistry'
import { resolveApplicantUidFromUser } from '@/utils/resolveApplicantUid'
import { fetchUserProfileDetail, type UserProfileDetail } from '@/utils/userCenterApi'
import {
  formatByteSize,
  type TpdcDatasetConfig
} from '@/utils/tpdcDataConfigApi'
import { tpdcWorkspaceUrl } from '@/utils/tpdcWorkspace'

const router = useRouter()
const authStore = useAuthStore()

const profile = ref<UserProfileDetail | null>(null)
const bundles = ref<DataCenterDatasetBundle[]>([])
const loading = ref(false)
const gateError = ref('')
const loadError = ref('')

const access = computed(() => resolveDataCenterAccess(profile.value))

const pageTitle = computed(() =>
  access.value.mode === 'all' ? '总数据中心节点' : access.value.center?.name || '数据分析'
)

const pageSubtitle = computed(() =>
  access.value.mode === 'all'
    ? '汇总展示各数据中心节点下的数据集信息'
    : '展示当前机构数据中心节点下的数据集信息'
)

function onCoverError(item: TpdcDatasetConfig) {
  item.dataSetPicture = ''
}

function openWorkspace(item: TpdcDatasetConfig) {
  window.open(tpdcWorkspaceUrl(item.external_id), '_blank', 'noopener,noreferrer')
}

function goToLogin() {
  void goLogin(router, router.currentRoute.value.fullPath)
}

function handleLogout() {
  authStore.logout()
  void goLogin(router, router.currentRoute.value.fullPath)
}

async function ensureProfile() {
  authStore.syncFromStorage()
  if (!authStore.isLoggedIn) {
    gateError.value = '请先登录后再访问数据中心节点'
    return false
  }
  const uid = resolveApplicantUidFromUser(authStore.user)
  if (!uid) {
    gateError.value = '无法识别当前用户'
    return false
  }
  const data = await fetchUserProfileDetail(uid, authStore.user?.openId || '')
  if (!data) {
    gateError.value = '未获取到用户信息'
    return false
  }
  profile.value = data
  const next = resolveDataCenterAccess(data)
  if (!next.canAccess) {
    gateError.value = '当前账号无权访问数据中心节点（需超级管理员，或管理员且填写机构信息）'
    return false
  }
  gateError.value = ''
  return true
}

async function load() {
  loading.value = true
  loadError.value = ''
  try {
    const ok = await ensureProfile()
    if (!ok) {
      bundles.value = []
      return
    }
    if (access.value.mode === 'all') {
      bundles.value = await fetchAllDataCenterBundles()
      return
    }
    const center = access.value.center
    if (!center) {
      const name =
        profile.value?.institution?.trim() ||
        profile.value?.orgName?.trim() ||
        profile.value?.affiliation?.trim() ||
        '当前机构'
      bundles.value = [
        {
          center: {
            id: 'unregistered',
            name,
            shortName: '机构中心',
            keywords: [],
            configUrl: ''
          },
          datasets: [],
          error: '该机构尚未接入数据集配置，请联系平台管理员'
        }
      ]
      return
    }
    try {
      const datasets = await fetchDataCenterDatasets(center)
      bundles.value = [{ center, datasets }]
    } catch (e: unknown) {
      bundles.value = [
        {
          center,
          datasets: [],
          error: e instanceof Error ? e.message : '加载失败'
        }
      ]
    }
  } catch (e: unknown) {
    bundles.value = []
    loadError.value = e instanceof Error ? e.message : '加载失败'
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  void load()
})
</script>

<style scoped>
.dch-page {
  min-height: 100vh;
  background: #f8fafc;
  padding-bottom: calc(3.75rem + env(safe-area-inset-bottom, 0px));
}

@media (min-width: 768px) {
  .dch-page {
    padding-bottom: 0;
  }
}

.dch-main {
  max-width: 72rem;
  margin: 0 auto;
  padding: 1rem 1rem 2.5rem;
}

@media (min-width: 768px) {
  .dch-main {
    padding: 5.5rem 1.5rem 3rem;
  }
}

.dch-head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 1rem;
  margin-bottom: 1.25rem;
}

.dch-head__eyebrow {
  margin: 0 0 0.25rem;
  font-size: 0.75rem;
  font-weight: 700;
  color: #64748b;
}

.dch-head h1 {
  margin: 0;
  font-size: 1.5rem;
  font-weight: 800;
  color: #0f172a;
}

.dch-head p {
  margin: 0.3rem 0 0;
  font-size: 0.875rem;
  color: #64748b;
}

.dch-head__actions {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.dch-btn {
  display: inline-flex;
  align-items: center;
  gap: 0.3rem;
  height: 2.25rem;
  padding: 0 0.85rem;
  border-radius: 0.65rem;
  background: #2563eb;
  color: #fff;
  font-size: 0.8125rem;
  font-weight: 600;
}

.dch-btn:disabled {
  opacity: 0.6;
}

.dch-btn--ghost {
  background: #fff;
  border: 1px solid #e2e8f0;
  color: #475569;
}

.dch-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 0.75rem;
  min-height: 14rem;
  border-radius: 1rem;
  background: #fff;
  border: 1px solid #e2e8f0;
  color: #94a3b8;
  font-size: 0.875rem;
}

.dch-state--error {
  color: #dc2626;
}

.dch-centers {
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
}

.dch-center {
  background: #fff;
  border: 1px solid #e2e8f0;
  border-radius: 1rem;
  padding: 1rem 1.1rem 1.15rem;
  box-shadow: 0 8px 24px rgba(15, 23, 42, 0.04);
}

.dch-center__head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 0.75rem;
  margin-bottom: 0.9rem;
}

.dch-center__head h2 {
  margin: 0;
  font-size: 1.05rem;
  font-weight: 800;
  color: #0f172a;
}

.dch-center__head p {
  margin: 0.25rem 0 0;
  font-size: 0.8125rem;
  color: #64748b;
}

.dch-center__badge {
  flex-shrink: 0;
  padding: 0.2rem 0.55rem;
  border-radius: 999px;
  background: #eff6ff;
  color: #2563eb;
  font-size: 0.6875rem;
  font-weight: 700;
}

.dch-center__error,
.dch-center__empty {
  padding: 1.25rem;
  border-radius: 0.75rem;
  background: #f8fafc;
  color: #94a3b8;
  font-size: 0.875rem;
  text-align: center;
}

.dch-center__error {
  color: #dc2626;
  background: #fef2f2;
}

.dch-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
  gap: 0.85rem;
}

.dch-card {
  display: flex;
  flex-direction: column;
  border: 1px solid #e2e8f0;
  border-radius: 0.85rem;
  overflow: hidden;
  background: #fff;
  cursor: pointer;
  transition: box-shadow 0.18s, transform 0.18s;
}

.dch-card:hover {
  box-shadow: 0 10px 24px rgba(37, 99, 235, 0.1);
  transform: translateY(-2px);
}

.dch-card__cover {
  height: 120px;
  background: #f1f5f9;
  display: flex;
  align-items: center;
  justify-content: center;
}

.dch-card__cover img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.dch-card__body {
  padding: 0.85rem;
}

.dch-card__body h3 {
  margin: 0;
  font-size: 0.9rem;
  font-weight: 700;
  color: #0f172a;
  line-height: 1.4;
}

.dch-card__body > p {
  margin: 0.4rem 0 0;
  font-size: 0.75rem;
  color: #64748b;
  line-height: 1.5;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.dch-card__meta {
  display: flex;
  flex-wrap: wrap;
  gap: 0.45rem 0.7rem;
  margin-top: 0.65rem;
  font-size: 0.6875rem;
  color: #94a3b8;
}

.dch-card__uuid {
  margin: 0.45rem 0 0;
  font-size: 0.625rem;
  color: #cbd5e1;
  word-break: break-all;
  font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
}
</style>
