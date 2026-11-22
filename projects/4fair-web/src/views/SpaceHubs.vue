<template>
  <div class="hubs-page">
    <nav class="glass-nav fixed top-0 w-full z-50 hidden md:block">
      <div class="relative max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-2">
        <div class="flex items-center space-x-2 group cursor-pointer shrink-0 z-10" @click="router.push('/home')">
          <BrandLogo size="md" interactive />
          <span class="text-lg sm:text-xl font-bold tracking-tight text-slate-900">费尔空间</span>
        </div>
        <SiteTopNavLinks active="hubs" />
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

    <main class="hubs-main">
      <header class="hubs-head">
        <div class="hubs-head__top">
          <h1>空间枢纽</h1>
          <span class="hubs-head__count">共 {{ hubs.length }} 个枢纽</span>
        </div>
        <div class="hubs-head__filters">
          <div class="hubs-search">
            <iconify-icon icon="mdi:magnify" class="hubs-search__icon" />
            <input
              v-model="searchQuery"
              type="text"
              placeholder="搜索枢纽名称、单位、领域、类型…"
              class="hubs-search__input"
            />
          </div>
          <select v-model="selectedSubject" class="hubs-filter__select">
            <option value="">全部学科领域</option>
            <option v-for="s in subjectOptions" :key="s" :value="s">{{ s }}</option>
          </select>
          <select v-model="selectedDataType" class="hubs-filter__select">
            <option value="">全部数据类型</option>
            <option v-for="t in dataTypeOptions" :key="t" :value="t">{{ t }}</option>
          </select>
        </div>
      </header>

      <div v-if="loading" class="hubs-state">
        <iconify-icon icon="mdi:loading" class="animate-spin text-3xl text-blue-600" />
        <p>正在加载枢纽信息…</p>
      </div>

      <div v-else-if="error" class="hubs-state hubs-state--error">
        <p>{{ error }}</p>
        <button type="button" class="hubs-retry" @click="load">重新加载</button>
      </div>

      <div v-else-if="!hubs.length" class="hubs-state">
        <p>暂无空间枢纽</p>
      </div>

      <div v-else class="hubs-split">
          <aside class="hubs-nav">
            <div v-if="!filteredHubs.length" class="hubs-nav__empty">无匹配枢纽</div>
            <ul v-else class="hubs-nav__list">
              <li
                v-for="hub in filteredHubs"
                :key="hub.id"
                class="hubs-nav__item"
                :class="{ 'hubs-nav__item--active': hub.id === selectedHubId }"
                @click="selectedHubId = hub.id"
              >
                <span class="hubs-nav__name">{{ hub.name }}</span>
                <span class="hubs-nav__org">{{ hub.orgName }}</span>
              </li>
            </ul>
          </aside>

          <section class="hubs-detail-wrap">
            <HubDetailPanel v-if="selectedHub" :hub="selectedHub" />
            <div v-else class="hubs-state">
              <p>请选择一个枢纽</p>
            </div>
          </section>
        </div>
    </main>

    <AppFooter />
    <SiteBottomTabBar active="hubs" />
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { goLogin } from '@/utils/loginRedirect'
import BrandLogo from '@/components/BrandLogo.vue'
import SiteTopNavLinks from '@/components/SiteTopNavLinks.vue'
import SiteBottomTabBar from '@/components/SiteBottomTabBar.vue'
import UserCenterNavButton from '@/components/UserCenterNavButton.vue'
import AppFooter from '@/components/AppFooter.vue'
import HubDetailPanel from '@/components/HubDetailPanel.vue'
import { useAuthStore } from '@/stores/auth'
import type { SpaceHubNode, EnrichedHub, HubStats } from '@/data/spaceHubs'
import { DATA_CENTERS } from '@/utils/dataCenterRegistry'
import { fetchDataCenterAll } from '@/utils/dataCenterAllApi'
import { fetchSpaceHubStatistics } from '@/utils/spaceHubStatisticsApi'


const router = useRouter()
const authStore = useAuthStore()

const hubs = ref<SpaceHubNode[]>([])
const loading = ref(true)
const error = ref('')
const statsByHubId = ref<Record<string, HubStats>>({})


const searchQuery = ref('')
const selectedSubject = ref('')
const selectedDataType = ref('')
const selectedHubId = ref('')


function todayDateLabel(): string {
  const d = new Date()
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

function resolveStatisticsSource(hub: SpaceHubNode): string {
  if (hub.statisticsSource?.trim()) return hub.statisticsSource.trim()
  if (hub.dataCenterId) {
    const center = DATA_CENTERS.find((c) => c.id === hub.dataCenterId)
    if (center?.name) return center.name
  }
  return ''
}

const enrichedHubs = computed<EnrichedHub[]>(() =>
  hubs.value.map((hub) => {
    const stats = statsByHubId.value[hub.id]
    return {
      ...hub,
      datasetsLabel: stats?.datasetsLabel ?? '—',
      onlineToolsLabel: stats?.onlineToolsLabel ?? '—',
      serviceCount: stats?.serviceCount ?? hub.serviceCount,
      resolvedUpdatedAt: todayDateLabel()
    }
  })
)

const subjectOptions = computed(() => {
  const set = new Set<string>()
  for (const h of hubs.value) for (const s of h.subjects) set.add(s)
  return Array.from(set).sort()
})

const dataTypeOptions = computed(() => {
  const set = new Set<string>()
  for (const h of hubs.value) for (const t of h.dataTypes) set.add(t)
  return Array.from(set).sort()
})

const filteredHubs = computed<EnrichedHub[]>(() => {
  const q = searchQuery.value.trim().toLowerCase()
  const subj = selectedSubject.value
  const dt = selectedDataType.value
  return enrichedHubs.value.filter((h) => {

    if (subj && !h.subjects.includes(subj)) return false
    if (dt && !h.dataTypes.includes(dt)) return false
    if (q) {
      const hay = [h.name, h.orgName, ...h.subjects, ...h.dataTypes].join(' ').toLowerCase()
      if (!hay.includes(q)) return false
    }
    return true
  })
})

const selectedHub = computed<EnrichedHub | null>(() => {
  if (!filteredHubs.value.length) return null
  return filteredHubs.value.find((h) => h.id === selectedHubId.value) ?? filteredHubs.value[0]
})


watch(filteredHubs, (list) => {
  if (!list.length) return
  if (!list.some((h) => h.id === selectedHubId.value)) {
    selectedHubId.value = list[0].id
  }
})


function goToLogin() {
  void goLogin(router, router.currentRoute.value.fullPath)
}

function handleLogout() {
  authStore.logout()
  void goLogin(router, router.currentRoute.value.fullPath)
}

async function loadDynamicStats(list: SpaceHubNode[]) {
  await Promise.all(
    list.map(async (hub) => {
      const source = resolveStatisticsSource(hub)
      if (!source) return
      try {
        const data = await fetchSpaceHubStatistics(source)
        if (!data) return
        statsByHubId.value[hub.id] = {
          datasetsLabel: `${data.dataSet} 个`,
          onlineToolsLabel: `${data.analysisTool} 项`,
          serviceCount: data.analysisToolStatistics
        }
      } catch {
        /* keep fallbacks */
      }
    })
  )
}

async function load() {
  loading.value = true
  error.value = ''
  try {
    const list = await fetchDataCenterAll()
    const visible = list.filter((h) => h.isAccess === 1)
    hubs.value = visible
    await loadDynamicStats(visible)
  } catch (e: unknown) {
    hubs.value = []
    error.value = e instanceof Error ? e.message : '加载失败'
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  authStore.syncFromStorage()
  void load()
})
</script>

<style scoped>
.hubs-page {
  min-height: 100vh;
  background:
    radial-gradient(ellipse 80% 50% at 10% -10%, rgba(37, 99, 235, 0.08), transparent 55%),
    radial-gradient(ellipse 60% 40% at 90% 0%, rgba(14, 116, 144, 0.07), transparent 50%),
    #f4f7fb;
  padding-bottom: calc(3.75rem + env(safe-area-inset-bottom, 0px));
}

@media (min-width: 768px) {
  .hubs-page {
    padding-bottom: 0;
  }
}

.hubs-main {
  max-width: 68rem;
  margin: 0 auto;
  padding: 1.25rem 1.25rem 3rem;
}

@media (min-width: 768px) {
  .hubs-main {
    padding-top: 5.5rem;
  }
}

.hubs-head {
  margin-bottom: 1.5rem;
}

.hubs-head__top {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 1rem;
}

.hubs-head h1 {
  margin: 0;
  font-size: 1.65rem;
  font-weight: 800;
  color: #0f172a;
  letter-spacing: -0.02em;
}

.hubs-head__count {
  font-size: 0.8125rem;
  font-weight: 600;
  color: #64748b;
  white-space: nowrap;
}

.hubs-head__filters {
  display: flex;
  gap: 0.75rem;
  margin-top: 0.85rem;
  flex-wrap: wrap;
}

.hubs-search {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  height: 2.25rem;
  padding: 0 0.75rem;
  border: 1px solid #e2e8f0;
  border-radius: 0.5rem;
  background: #fff;
  flex: 1 1 16rem;
  min-width: 12rem;
}

.hubs-search__icon {
  color: #94a3b8;
  font-size: 1.1rem;
  flex-shrink: 0;
}

.hubs-search__input {
  width: 100%;
  border: 0;
  outline: 0;
  font-size: 0.8125rem;
  color: #0f172a;
  background: transparent;
}

.hubs-filter__select {
  height: 2.25rem;
  padding: 0 0.75rem;
  border: 1px solid #e2e8f0;
  border-radius: 0.5rem;
  background: #fff;
  font-size: 0.8125rem;
  color: #0f172a;
  cursor: pointer;
  min-width: 8rem;
}

.hubs-filter__select:focus {
  outline: 0;
  border-color: #93c5fd;
  box-shadow: 0 0 0 1px rgba(59, 130, 246, 0.15);
}

.hubs-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 0.75rem;
  min-height: 14rem;
  padding: 2rem;
  border-radius: 1rem;
  background: #fff;
  border: 1px solid #e2e8f0;
  color: #64748b;
}

.hubs-state--error {
  color: #b91c1c;
}

.hubs-retry {
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

.hubs-split {
  display: flex;
  gap: 1.5rem;
  align-items: flex-start;
}

.hubs-nav {
  width: 20rem;
  flex-shrink: 0;
  background: #fff;
  border: 1px solid rgba(15, 23, 42, 0.06);
  border-radius: 1rem;
  box-shadow: 0 10px 30px rgba(15, 23, 42, 0.04);
  display: flex;
  flex-direction: column;
  max-height: calc(100vh - 8rem);
  position: sticky;
  top: 5.5rem;
  overflow: hidden;
}

.hubs-nav__list {
  list-style: none;
  margin: 0;
  padding: 0.5rem 0;
  overflow-y: auto;
  overscroll-behavior: contain;
  flex: 1 1 auto;
  min-height: 0;
}

.hubs-nav__list::-webkit-scrollbar {
  width: 5px;
}

.hubs-nav__list::-webkit-scrollbar-thumb {
  background: #cbd5e1;
  border-radius: 999px;
}

.hubs-nav__item {
  padding: 0.6rem 1rem;
  cursor: pointer;
  border-left: 3px solid transparent;
  transition: background 0.15s ease, border-color 0.15s ease;
  display: flex;
  flex-direction: column;
  gap: 0.15rem;
}

.hubs-nav__item:hover {
  background: #f8fafc;
}

.hubs-nav__item--active {
  background: #eff6ff;
  border-left-color: #2563eb;
}

.hubs-nav__name {
  font-size: 0.8125rem;
  font-weight: 700;
  color: #0f172a;
  line-height: 1.35;
}

.hubs-nav__item--active .hubs-nav__name {
  color: #1d4ed8;
}

.hubs-nav__org {
  font-size: 0.75rem;
  color: #64748b;
  line-height: 1.3;
}

.hubs-nav__empty {
  padding: 2rem 1rem;
  text-align: center;
  font-size: 0.8125rem;
  color: #94a3b8;
}

.hubs-detail-wrap {
  flex: 1 1 auto;
  min-width: 0;
}


</style>
