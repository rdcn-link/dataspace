<template>
  <div class="co2-analysis-page">
    <nav class="glass-nav fixed top-0 w-full z-50">
      <div class="co2-page-shell h-16 flex items-center justify-between">
        <div class="flex items-center space-x-2 group cursor-pointer" @click="router.push('/home')">
          <BrandLogo size="lg" interactive />
          <span class="text-xl font-bold tracking-tight text-slate-900">费尔空间</span>
        </div>
        <div class="hidden md:flex items-center space-x-8 text-base font-bold text-slate-600">
          <a class="hover:text-blue-600 transition-colors cursor-pointer" @click="router.push('/headlines')">头条资讯</a>
          <a class="text-blue-600 border-b-2 border-blue-600 pb-0.5 cursor-pointer" @click="router.push('/assets')">数据目录</a>
          <a class="hover:text-blue-600 transition-colors cursor-pointer" @click="router.push('/spatial-hubs')">空间枢纽</a>
        </div>
        <div class="flex items-center gap-3">
          <button type="button" class="co2-link-btn" @click="goBackToDetail">
            <iconify-icon icon="mdi:arrow-left"></iconify-icon>
            返回详情
          </button>
          <UserCenterNavButton />
        </div>
      </div>
    </nav>

    <main class="co2-page-shell co2-main">
      <header class="co2-header tech-card">
        <div class="co2-header__icon">
          <iconify-icon icon="mdi:chart-line"></iconify-icon>
        </div>
        <div>
          <p class="co2-header__eyebrow">数据分析工具</p>
          <h1>青藏高原 15 站涡动通量分析图</h1>
          <p class="co2-header__desc">
            左侧选择观测站点，右侧查看该站点的通量与气象要素分析图表。
          </p>
        </div>
      </header>

      <div class="co2-workspace tech-card">
        <aside class="co2-station-panel">
          <h2 class="co2-panel-title">观测站点</h2>
          <ul class="co2-station-list" role="listbox" aria-label="观测站点">
            <li v-for="station in stations" :key="station.id">
              <button
                type="button"
                role="option"
                class="co2-station-btn"
                :class="{ 'co2-station-btn--active': selectedStationId === station.id }"
                :aria-selected="selectedStationId === station.id"
                @click="selectStation(station.id)"
              >
                <iconify-icon icon="mdi:map-marker-radius"></iconify-icon>
                <span>{{ station.name }}</span>
              </button>
            </li>
          </ul>
        </aside>

        <section class="co2-figure-panel">
          <div class="co2-figure-panel__head">
            <h2 class="co2-panel-title">{{ selectedStation?.name }}</h2>
            <div v-if="pngFigures.length" class="co2-figure-tabs" role="tablist">
              <button
                v-for="(fig, idx) in pngFigures"
                :key="fig.filename"
                type="button"
                role="tab"
                class="co2-figure-tab"
                :class="{ 'co2-figure-tab--active': selectedFigureIndex === idx }"
                :aria-selected="selectedFigureIndex === idx"
                @click="selectedFigureIndex = idx"
              >
                {{ fig.label }}
              </button>
            </div>
          </div>

          <div v-if="currentPng" class="co2-figure-viewer">
            <div class="co2-figure-viewer__toolbar">
              <span class="co2-figure-viewer__label">{{ currentPng.label }}</span>
              <button
                type="button"
                class="co2-icon-btn"
                title="新窗口打开"
                @click="openFigure(currentPng.filename)"
              >
                <iconify-icon icon="mdi:open-in-new"></iconify-icon>
              </button>
            </div>
            <div class="co2-figure-viewer__frame">
              <img
                :src="figureUrl(currentPng.filename)"
                :alt="`${selectedStation?.name} - ${currentPng.label}`"
                loading="lazy"
              />
            </div>
            <div v-if="pngFigures.length > 1" class="co2-figure-nav">
              <button
                type="button"
                class="co2-nav-btn"
                :disabled="selectedFigureIndex <= 0"
                @click="selectedFigureIndex -= 1"
              >
                <iconify-icon icon="mdi:chevron-left"></iconify-icon>
                上一张
              </button>
              <span class="co2-figure-nav__count font-num">
                {{ selectedFigureIndex + 1 }} / {{ pngFigures.length }}
              </span>
              <button
                type="button"
                class="co2-nav-btn"
                :disabled="selectedFigureIndex >= pngFigures.length - 1"
                @click="selectedFigureIndex += 1"
              >
                下一张
                <iconify-icon icon="mdi:chevron-right"></iconify-icon>
              </button>
            </div>
          </div>

          <p v-else class="co2-empty">该站点暂无可预览的图表</p>

          <div v-if="htmlFigures.length" class="co2-interactive">
            <h3 class="co2-interactive__title">交互图表</h3>
            <div class="co2-interactive__links">
              <a
                v-for="fig in htmlFigures"
                :key="fig.filename"
                :href="figureUrl(fig.filename)"
                target="_blank"
                rel="noopener noreferrer"
                class="co2-interactive__link"
              >
                <iconify-icon icon="mdi:chart-timeline-variant"></iconify-icon>
                {{ fig.label }}
              </a>
            </div>
          </div>
        </section>
      </div>
    </main>

    <AppFooter />
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import AppFooter from '@/components/AppFooter.vue'
import BrandLogo from '@/components/BrandLogo.vue'
import UserCenterNavButton from '@/components/UserCenterNavButton.vue'
import { CO2_STATIONS, co2FigureUrl } from '@/data/co2-analysis/stations'

defineOptions({ name: 'DatasetCo2Analysis' })

const route = useRoute()
const router = useRouter()

const stations = CO2_STATIONS
const selectedStationId = ref(stations[0]?.id ?? '')
const selectedFigureIndex = ref(0)

const selectedStation = computed(() =>
  stations.find((s) => s.id === selectedStationId.value) ?? stations[0]
)

const pngFigures = computed(() =>
  (selectedStation.value?.figures ?? []).filter((f) => f.kind === 'png')
)

const htmlFigures = computed(() =>
  (selectedStation.value?.figures ?? []).filter((f) => f.kind === 'html')
)

const currentPng = computed(() => pngFigures.value[selectedFigureIndex.value] ?? null)

function figureUrl(filename: string) {
  return co2FigureUrl(selectedStationId.value, filename)
}

function selectStation(id: string) {
  selectedStationId.value = id
  selectedFigureIndex.value = 0
}

function goBackToDetail() {
  const id = route.params.id as string
  if (id) {
    router.push({ name: 'AssetDetail', params: { id } })
  } else {
    router.push('/assets')
  }
}

function openFigure(filename: string) {
  window.open(figureUrl(filename), '_blank', 'noopener,noreferrer')
}

watch(selectedStationId, () => {
  selectedFigureIndex.value = 0
})
</script>

<style scoped>
.co2-analysis-page {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  background: var(--fs-bg, #f8fafc);
}

.co2-page-shell {
  max-width: 1280px;
  margin: 0 auto;
  padding-left: 1.5rem;
  padding-right: 1.5rem;
}

.co2-main {
  flex: 1;
  padding-top: 5.5rem;
  padding-bottom: 2.5rem;
}

.co2-link-btn {
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  font-size: 0.875rem;
  color: #475569;
  background: transparent;
  border: none;
  cursor: pointer;
  padding: 0.35rem 0.5rem;
  border-radius: 0.5rem;
  transition: color 0.15s, background 0.15s;
}

.co2-link-btn:hover {
  color: #2563eb;
  background: #eff6ff;
}

.co2-header {
  display: flex;
  gap: 1rem;
  align-items: flex-start;
  padding: 1.25rem 1.5rem;
  margin-bottom: 1.25rem;
}

.co2-header__icon {
  width: 3rem;
  height: 3rem;
  border-radius: 0.875rem;
  background: linear-gradient(135deg, #3b82f6, #6366f1);
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.5rem;
  flex-shrink: 0;
}

.co2-header__eyebrow {
  font-size: 0.75rem;
  font-weight: 700;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: #3b82f6;
  margin-bottom: 0.25rem;
}

.co2-header h1 {
  font-size: 1.25rem;
  font-weight: 800;
  color: #0f172a;
  line-height: 1.35;
}

.co2-header__desc {
  margin-top: 0.35rem;
  font-size: 0.875rem;
  color: #64748b;
}

.co2-workspace {
  display: grid;
  grid-template-columns: 240px minmax(0, 1fr);
  gap: 0;
  min-height: 560px;
  overflow: hidden;
}

.co2-station-panel {
  border-right: 1px solid #e2e8f0;
  padding: 1rem 0.75rem;
  background: #f8fafc;
}

.co2-panel-title {
  font-size: 0.875rem;
  font-weight: 800;
  color: #334155;
  padding: 0 0.5rem 0.75rem;
}

.co2-station-list {
  list-style: none;
  margin: 0;
  padding: 0;
  max-height: calc(100vh - 280px);
  overflow-y: auto;
}

.co2-station-btn {
  width: 100%;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  text-align: left;
  padding: 0.6rem 0.75rem;
  border: none;
  border-radius: 0.625rem;
  background: transparent;
  color: #475569;
  font-size: 0.875rem;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.15s, color 0.15s;
}

.co2-station-btn:hover {
  background: #e2e8f0;
  color: #1e293b;
}

.co2-station-btn--active {
  background: #dbeafe;
  color: #1d4ed8;
}

.co2-figure-panel {
  padding: 1rem 1.25rem 1.25rem;
  display: flex;
  flex-direction: column;
  min-width: 0;
}

.co2-figure-panel__head {
  margin-bottom: 0.75rem;
}

.co2-figure-tabs {
  display: flex;
  flex-wrap: wrap;
  gap: 0.4rem;
  margin-top: 0.65rem;
}

.co2-figure-tab {
  border: 1px solid #e2e8f0;
  background: #fff;
  color: #64748b;
  font-size: 0.75rem;
  font-weight: 600;
  padding: 0.35rem 0.65rem;
  border-radius: 999px;
  cursor: pointer;
  transition: all 0.15s;
}

.co2-figure-tab:hover {
  border-color: #93c5fd;
  color: #2563eb;
}

.co2-figure-tab--active {
  background: #2563eb;
  border-color: #2563eb;
  color: #fff;
}

.co2-figure-viewer {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-height: 0;
}

.co2-figure-viewer__toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 0.5rem;
}

.co2-figure-viewer__label {
  font-size: 0.875rem;
  font-weight: 700;
  color: #334155;
}

.co2-icon-btn {
  border: none;
  background: #f1f5f9;
  color: #475569;
  width: 2rem;
  height: 2rem;
  border-radius: 0.5rem;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  justify-content: center;
}

.co2-icon-btn:hover {
  background: #e2e8f0;
  color: #2563eb;
}

.co2-figure-viewer__frame {
  flex: 1;
  min-height: 360px;
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 0.75rem;
  overflow: auto;
  display: flex;
  align-items: flex-start;
  justify-content: center;
  padding: 0.75rem;
}

.co2-figure-viewer__frame img {
  max-width: 100%;
  height: auto;
  display: block;
}

.co2-figure-nav {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 1rem;
  margin-top: 0.75rem;
}

.co2-nav-btn {
  display: inline-flex;
  align-items: center;
  gap: 0.25rem;
  border: 1px solid #e2e8f0;
  background: #fff;
  color: #475569;
  font-size: 0.8125rem;
  font-weight: 600;
  padding: 0.4rem 0.75rem;
  border-radius: 0.5rem;
  cursor: pointer;
}

.co2-nav-btn:hover:not(:disabled) {
  border-color: #93c5fd;
  color: #2563eb;
}

.co2-nav-btn:disabled {
  opacity: 0.45;
  cursor: not-allowed;
}

.co2-figure-nav__count {
  font-size: 0.8125rem;
  color: #64748b;
}

.co2-empty {
  color: #94a3b8;
  font-size: 0.875rem;
  padding: 2rem 0;
  text-align: center;
}

.co2-interactive {
  margin-top: 1rem;
  padding-top: 1rem;
  border-top: 1px dashed #e2e8f0;
}

.co2-interactive__title {
  font-size: 0.8125rem;
  font-weight: 700;
  color: #64748b;
  margin-bottom: 0.5rem;
}

.co2-interactive__links {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.co2-interactive__link {
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  font-size: 0.8125rem;
  font-weight: 600;
  color: #2563eb;
  background: #eff6ff;
  padding: 0.45rem 0.75rem;
  border-radius: 0.5rem;
  text-decoration: none;
}

.co2-interactive__link:hover {
  background: #dbeafe;
}

@media (max-width: 900px) {
  .co2-workspace {
    grid-template-columns: 1fr;
  }

  .co2-station-panel {
    border-right: none;
    border-bottom: 1px solid #e2e8f0;
  }

  .co2-station-list {
    display: flex;
    flex-wrap: wrap;
    gap: 0.35rem;
    max-height: none;
  }

  .co2-station-btn {
    width: auto;
  }
}
</style>
