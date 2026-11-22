<template>
  <div class="sediment-analysis-page">
    <nav class="glass-nav fixed top-0 w-full z-50">
      <div class="sediment-page-shell h-16 flex items-center justify-between">
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
          <button type="button" class="sediment-link-btn" @click="goBackToDetail">
            <iconify-icon icon="mdi:arrow-left"></iconify-icon>
            返回详情
          </button>
          <UserCenterNavButton />
        </div>
      </div>
    </nav>

    <main class="sediment-page-shell sediment-main">
      <header class="sediment-header tech-card">
        <div class="sediment-header__icon">
          <iconify-icon icon="mdi:camera-outline"></iconify-icon>
        </div>
        <div>
          <p class="sediment-header__eyebrow">数据分析工具</p>
          <h1>雅鲁藏布江流域松散沉积物野外科考分析图</h1>
          <p class="sediment-header__desc">
            野外科考记录及照片相关分析图表。
          </p>
        </div>
      </header>

      <section class="sediment-figure-panel tech-card">
        <div v-if="figures.length > 1" class="sediment-figure-tabs" role="tablist">
          <button
            v-for="(fig, idx) in figures"
            :key="fig.filename"
            type="button"
            role="tab"
            class="sediment-figure-tab"
            :class="{ 'sediment-figure-tab--active': selectedIndex === idx }"
            :aria-selected="selectedIndex === idx"
            @click="selectedIndex = idx"
          >
            {{ fig.label }}
          </button>
        </div>

        <div v-if="currentFigure" class="sediment-figure-viewer">
          <div class="sediment-figure-viewer__toolbar">
            <span class="sediment-figure-viewer__label">{{ currentFigure.label }}</span>
            <button
              type="button"
              class="sediment-icon-btn"
              title="新窗口打开"
              @click="openFigure(currentFigure.filename)"
            >
              <iconify-icon icon="mdi:open-in-new"></iconify-icon>
            </button>
          </div>
          <div class="sediment-figure-viewer__frame">
            <img
              :src="figureUrl(currentFigure.filename)"
              :alt="currentFigure.label"
              loading="lazy"
            />
          </div>
          <div v-if="figures.length > 1" class="sediment-figure-nav">
            <button
              type="button"
              class="sediment-nav-btn"
              :disabled="selectedIndex <= 0"
              @click="selectedIndex -= 1"
            >
              <iconify-icon icon="mdi:chevron-left"></iconify-icon>
              上一张
            </button>
            <span class="sediment-figure-nav__count font-num">
              {{ selectedIndex + 1 }} / {{ figures.length }}
            </span>
            <button
              type="button"
              class="sediment-nav-btn"
              :disabled="selectedIndex >= figures.length - 1"
              @click="selectedIndex += 1"
            >
              下一张
              <iconify-icon icon="mdi:chevron-right"></iconify-icon>
            </button>
          </div>
        </div>
      </section>
    </main>

    <AppFooter />
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import AppFooter from '@/components/AppFooter.vue'
import BrandLogo from '@/components/BrandLogo.vue'
import UserCenterNavButton from '@/components/UserCenterNavButton.vue'
import {
  FIELD_EXPEDITION_FIGURES,
  fieldExpeditionFigureUrl
} from '@/data/field-expedition-analysis/figures'

defineOptions({ name: 'DatasetFieldExpeditionAnalysis' })

const route = useRoute()
const router = useRouter()

const figures = FIELD_EXPEDITION_FIGURES
const selectedIndex = ref(0)

const currentFigure = computed(() => figures[selectedIndex.value] ?? null)

function figureUrl(filename: string) {
  return fieldExpeditionFigureUrl(filename)
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
</script>

<style scoped>
.sediment-analysis-page {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  background: var(--fs-bg, #f8fafc);
}

.sediment-page-shell {
  max-width: 1280px;
  margin: 0 auto;
  padding-left: 1.5rem;
  padding-right: 1.5rem;
}

.sediment-main {
  flex: 1;
  padding-top: 5.5rem;
  padding-bottom: 2.5rem;
}

.sediment-link-btn {
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

.sediment-link-btn:hover {
  color: #2563eb;
  background: #eff6ff;
}

.sediment-header {
  display: flex;
  gap: 1rem;
  align-items: flex-start;
  padding: 1.25rem 1.5rem;
  margin-bottom: 1.25rem;
}

.sediment-header__icon {
  width: 3rem;
  height: 3rem;
  border-radius: 0.875rem;
  background: linear-gradient(135deg, #0f766e, #14b8a6);
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.5rem;
  flex-shrink: 0;
}

.sediment-header__eyebrow {
  font-size: 0.75rem;
  font-weight: 700;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: #0d9488;
  margin-bottom: 0.25rem;
}

.sediment-header h1 {
  font-size: 1.25rem;
  font-weight: 800;
  color: #0f172a;
  line-height: 1.35;
}

.sediment-header__desc {
  margin-top: 0.35rem;
  font-size: 0.875rem;
  color: #64748b;
}

.sediment-figure-panel {
  padding: 1rem 1.25rem 1.25rem;
}

.sediment-figure-tabs {
  display: flex;
  flex-wrap: wrap;
  gap: 0.4rem;
  margin-bottom: 0.75rem;
}

.sediment-figure-tab {
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

.sediment-figure-tab:hover {
  border-color: #5eead4;
  color: #0d9488;
}

.sediment-figure-tab--active {
  background: #0d9488;
  border-color: #0d9488;
  color: #fff;
}

.sediment-figure-viewer__toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 0.5rem;
}

.sediment-figure-viewer__label {
  font-size: 0.875rem;
  font-weight: 700;
  color: #334155;
}

.sediment-icon-btn {
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

.sediment-icon-btn:hover {
  background: #e2e8f0;
  color: #0d9488;
}

.sediment-figure-viewer__frame {
  min-height: 420px;
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 0.75rem;
  overflow: auto;
  display: flex;
  align-items: flex-start;
  justify-content: center;
  padding: 0.75rem;
}

.sediment-figure-viewer__frame img {
  max-width: 100%;
  height: auto;
  display: block;
}

.sediment-figure-nav {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 1rem;
  margin-top: 0.75rem;
}

.sediment-nav-btn {
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

.sediment-nav-btn:hover:not(:disabled) {
  border-color: #5eead4;
  color: #0d9488;
}

.sediment-nav-btn:disabled {
  opacity: 0.45;
  cursor: not-allowed;
}

.sediment-figure-nav__count {
  font-size: 0.8125rem;
  color: #64748b;
}
</style>
