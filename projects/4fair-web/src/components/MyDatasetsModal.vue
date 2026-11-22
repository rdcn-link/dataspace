<template>
  <Teleport to="body">
    <Transition name="mds-fade">
      <div
        v-if="visible"
        class="mds-overlay"
        role="dialog"
        aria-modal="true"
        aria-labelledby="mds-title"
        @click.self="handleClose"
      >
        <div  class="mds-panel" @click.stop>
          <!-- 顶栏 -->
          <header class="mds-header">
            <div class="mds-header__left">
              <span class="mds-header__logo">
                <iconify-icon icon="mdi:database-outline" />
              </span>
              <div>
                <h2 id="mds-title" class="mds-header__title">
                  我的<span class="mds-gradient-text">数据集</span>
                </h2>
                <p class="mds-header__sub">勾选未发布条目，一键提交发布审批</p>
              </div>
            </div>
            <div class="mds-header__actions">
              <button
                type="button"
                class="mds-btn-ghost"
                :disabled="!datasets.some((d) => !d.published) || loading"
                @click="toggleSelectAll"
              >
                {{ allSelectableSelected ? '取消全选' : '全选' }}
              </button>
              <button
                type="button"
                class="mds-btn-close"
                aria-label="关闭"
                @click="handleClose"
              >
                <iconify-icon icon="mdi:close" />
              </button>
            </div>
          </header>

          <p class="mds-stats">
            共 <strong>{{ total }}</strong> 条
            <template v-if="totalPages > 1">
              · 第 <strong>{{ currentPage }}</strong> / {{ totalPages }} 页
            </template>
            <span v-if="selectedIds.size" class="mds-stats__hint">
              · 已选 <strong>{{ selectedIds.size }}</strong> 项
            </span>
          </p>

          <!-- 列表 -->
          <div class="mds-body">
            <div v-if="loading && !datasets.length" class="mds-state">
              <iconify-icon class="mds-state__spin" icon="mdi:loading" />
              <p>正在加载数据集…</p>
            </div>

            <div v-else-if="listError" class="mds-state mds-state--error">
              <iconify-icon icon="mdi:alert-circle-outline" />
              <p>{{ listError }}</p>
            </div>

            <div v-else-if="!datasets.length" class="mds-state">
              <iconify-icon icon="mdi:folder-open-outline" class="mds-state__empty-icon" />
              <p>暂无数据集</p>
            </div>

            <ul v-else class="mds-list">
              <li
                v-for="item in datasets"
                :key="item.id"
                class="mds-card"
                :class="{
                  'mds-card--selected': !item.published && selectedIds.has(item.id),
                  'mds-card--published': item.published
                }"
                @click="toggleSelect(item.id)"
              >
                <span
                  class="mds-badge"
                  :class="item.published ? 'mds-badge--ok' : 'mds-badge--pending'"
                >
                  {{ item.statusLabel }}
                </span>

                <span class="mds-check" aria-hidden="true">
                  <iconify-icon v-if="selectedIds.has(item.id)" icon="mdi:check" />
                </span>

                <h3 class="mds-card__title">{{ item.title }}</h3>

                <div class="mds-card__kw">
                  <span
                    v-for="(kw, i) in item.keywords.length ? item.keywords : ['无关键字']"
                    :key="i"
                    class="mds-kw"
                  >
                    {{ kw }}
                  </span>
                </div>

                <p class="mds-card__date">
                  <iconify-icon icon="mdi:calendar-outline" />
                  {{ item.date }}
                </p>
              </li>
            </ul>

            <nav
              v-if="totalPages > 1 && datasets.length"
              class="mds-pagination"
              aria-label="数据集分页"
            >
              <button
                type="button"
                class="mds-page-btn"
                :disabled="currentPage <= 1 || loading"
                @click="goPage(currentPage - 1)"
              >
                上一页
              </button>
              <div class="mds-page-nums">
                <button
                  v-for="p in pageList"
                  :key="p"
                  type="button"
                  class="mds-page-num"
                  :class="{ 'mds-page-num--active': p === currentPage }"
                  :disabled="loading"
                  @click="goPage(p)"
                >
                  {{ p }}
                </button>
              </div>
              <button
                type="button"
                class="mds-page-btn"
                :disabled="currentPage >= totalPages || loading"
                @click="goPage(currentPage + 1)"
              >
                下一页
              </button>
            </nav>
          </div>

          <!-- 底栏 -->
          <footer class="mds-footer">
            <div class="mds-footer__info">
              <strong>已选 {{ selectedIds.size }} 项</strong>
              <span>勾选后点击发布</span>
            </div>
            <button
              type="button"
              class="mds-btn-publish"
              :disabled="selectedIds.size === 0 || publishing || loading"
              @click="handlePublish"
            >
              {{ publishing ? '发布中…' : '发布' }}
            </button>
          </footer>
        </div>

        <!-- 结果提示 -->
        <Transition name="mds-fade">
          <div v-if="toast.open" class="mds-toast-layer" @click.self="toast.open = false">
            <div class="mds-toast">
              <iconify-icon
                :icon="toast.ok ? 'mdi:check-circle' : 'mdi:alert-circle'"
                :class="toast.ok ? 'mds-toast__icon--ok' : 'mds-toast__icon--err'"
              />
              <h3>{{ toast.title }}</h3>
              <p>{{ toast.message }}</p>
              <button type="button" class="mds-btn-publish mds-btn-publish--block" @click="toast.open = false">
                知道了
              </button>
            </div>
          </div>
        </Transition>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import { computed, reactive, ref, watch } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { useMyDatasetsModal, MY_DATASETS_INTRO_KEY } from '@/composables/useMyDatasetsModal'

const LIST_API = '/tds-trading/order/dataset.byUid'
const PUBLISH_API = '/tds-trading/order/dataset.batchApprove'
const PAGE_SIZE = 20

interface DatasetRow {
  id: string
  cstr: string
  title: string
  keywords: string[]
  date: string
  published: boolean
  statusLabel: string
}

const authStore = useAuthStore()
const { visible, close, markIntroSeen } = useMyDatasetsModal()

const datasets = ref<DatasetRow[]>([])
const selectedIds = ref(new Set<string>())
const currentPage = ref(1)
const total = ref(0)
const loading = ref(false)
const publishing = ref(false)
const listError = ref('')

const totalPages = computed(() =>
  Math.max(1, Math.ceil(total.value / PAGE_SIZE))
)

const pageList = computed(() => {
  const pages: number[] = []
  const max = totalPages.value
  const cur = currentPage.value
  let start = Math.max(1, cur - 2)
  let end = Math.min(max, start + 4)
  start = Math.max(1, end - 4)
  for (let i = start; i <= end; i++) pages.push(i)
  return pages
})

const toast = reactive({
  open: false,
  ok: true,
  title: '',
  message: ''
})

const ownerUid = computed(() => authStore.user?.uid || '')

const allSelectableSelected = computed(() => {
  const selectable = datasets.value.filter((d) => !d.published && d.id)
  if (!selectable.length) return false
  return selectable.every((d) => selectedIds.value.has(d.id))
})

function parseKeywords(raw: unknown): string[] {
  if (!raw) return []
  return String(raw)
    .split(/[；;、,，\s]+/)
    .map((s) => s.trim())
    .filter(Boolean)
    .slice(0, 5)
}

function isPublishedStatus(status: unknown) {
  return Number(status) === 9
}

function mapRecord(item: Record<string, unknown>): DatasetRow {
  const status = item.status
  const published = isPublishedStatus(status)
  return {
    id: String(item.id || ''),
    cstr: String(item.cstr || item.id || ''),
    title: String(item.titleZh || '无标题'),
    keywords: parseKeywords(item.keywordsZh),
    date: String(
      item.publishAt || item.updateAt || item.createAt || item.submitAt || '—'
    ),
    published,
    statusLabel: published ? '已发布' : '未发布'
  }
}

function showToast(title: string, message: string, ok = true) {
  toast.title = title
  toast.message = message
  toast.ok = ok
  toast.open = true
}

function handleClose() {
  if (!localStorage.getItem(MY_DATASETS_INTRO_KEY)) {
    markIntroSeen()
  }
  close()
  toast.open = false
}

function toggleSelect(id: string) {
  const item = datasets.value.find((d) => d.id === id)
  if (!item || item.published) return
  const next = new Set(selectedIds.value)
  if (next.has(id)) next.delete(id)
  else next.add(id)
  selectedIds.value = next
}

function toggleSelectAll() {
  const selectable = datasets.value.filter((d) => !d.published && d.id)
  if (!selectable.length) return
  if (allSelectableSelected.value) {
    selectedIds.value = new Set()
  } else {
    selectedIds.value = new Set(selectable.map((d) => d.id))
  }
}

function goPage(page: number) {
  if (page < 1 || page > totalPages.value || page === currentPage.value || loading.value) {
    return
  }
  fetchDatasets(page)
}

async function fetchDatasets(page: number, resetSelection = false) {
  if (loading.value) return
  if (!ownerUid.value) {
    listError.value = '未获取到用户 UID，请重新登录后再试'
    return
  }

  loading.value = true
  listError.value = ''

  try {
    const params = new URLSearchParams({
      page: String(page),
      pageSize: String(PAGE_SIZE),
      sort: 'updateAt',
      uid: ownerUid.value,
      status: '0'
    })
    const res = await fetch(`${LIST_API}?${params.toString()}`)
    const json = await res.json()
    if (json.code !== 200 || !json.data) {
      throw new Error(json.message || json.msg || '获取列表失败')
    }

    const rows = ((json.data.rows || []) as Record<string, unknown>[]).map(mapRecord)

    datasets.value = rows
    if (resetSelection) {
      selectedIds.value = new Set()
    }

    rows.forEach((d) => {
      if (d.published) selectedIds.value.delete(d.id)
    })

    total.value = Number(json.data.total) || rows.length
    currentPage.value = page
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : '加载失败'
    datasets.value = []
    listError.value = msg
  } finally {
    loading.value = false
  }
}

async function handlePublish() {
  const idList = datasets.value
    .filter((d) => !d.published && selectedIds.value.has(d.id))
    .map((d) => String(d.id))
    .filter(Boolean)

  if (!idList.length) return

  publishing.value = true
  try {
    const res = await fetch(PUBLISH_API, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(idList)
    })
    const json = await res.json()
    if (json.code === 200 || json.success) {
      showToast('发布成功', `已提交 ${idList.length} 个数据集`)
      selectedIds.value = new Set()
      await fetchDatasets(1, true)
    } else {
      throw new Error(json.message || json.msg || '发布失败')
    }
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : '请稍后重试'
    showToast('发布失败', msg, false)
  } finally {
    publishing.value = false
  }
}

watch(visible, (open) => {
  if (open) {
    document.body.style.overflow = 'hidden'
    currentPage.value = 1
    fetchDatasets(1, true)
  } else {
    document.body.style.overflow = ''
  }
})
</script>

<style scoped>
/* 费尔空间：蓝紫渐变 + 玻璃卡片（对齐 Index / UserShare） */
.mds-overlay {
  position: fixed;
  inset: 0;
  z-index: 200;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 16px;
  padding-bottom: calc(16px + env(safe-area-inset-bottom, 0));
  background: rgba(15, 23, 42, 0.45);
  backdrop-filter: blur(6px);
}

.mds-panel {
  width: 100%;
  max-width: 440px;
  max-height: min(88dvh, 720px);
  display: flex;
  flex-direction: column;
  background: var(--fs-card-bg, #ffffff);
  border: 1px solid var(--fs-card-border, #cbd5e1);
  border-radius: 1.25rem;
  box-shadow: var(--fs-card-shadow-lg, 0 16px 40px rgba(30, 64, 175, 0.12));
  overflow: hidden;
  animation: mdsSlideUp 0.32s cubic-bezier(0.4, 0, 0.2, 1);
}

@keyframes mdsSlideUp {
  from {
    opacity: 0;
    transform: translateY(16px) scale(0.98);
  }
  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

.mds-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
  padding: 16px 16px 10px;
  border-bottom: 1px solid rgba(241, 245, 249, 0.9);
  background: rgba(255, 255, 255, 0.65);
  backdrop-filter: blur(12px);
}

.mds-header__left {
  display: flex;
  gap: 10px;
  min-width: 0;
}

.mds-header__logo {
  width: 44px;
  height: 44px;
  flex-shrink: 0;
  border-radius: 12px;
  background: linear-gradient(135deg, #1e40af 0%, #2563eb 55%, #0891b2 100%);
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 26px;
  box-shadow: 0 6px 16px rgba(59, 130, 246, 0.35);
}

.mds-header__logo iconify-icon {
  font-size: 26px;
}

.mds-header__title {
  margin: 0;
  font-size: 1.125rem;
  font-weight: 800;
  letter-spacing: -0.03em;
  color: #0f172a;
  line-height: 1.2;
}

.mds-header__sub {
  margin: 2px 0 0;
  font-size: 11px;
  color: #64748b;
  line-height: 1.35;
}

.mds-gradient-text {
  background: linear-gradient(135deg, #2563eb 0%, #7c3aed 50%, #db2777 100%);
  -webkit-background-clip: text;
  background-clip: text;
  -webkit-text-fill-color: transparent;
}

.mds-header__actions {
  display: flex;
  align-items: center;
  gap: 6px;
  flex-shrink: 0;
}

.mds-btn-ghost {
  font-size: 12px;
  font-weight: 600;
  color: #2563eb;
  background: #eff6ff;
  border: 1px solid #dbeafe;
  padding: 6px 10px;
  border-radius: 8px;
  cursor: pointer;
  transition: background 0.15s, border-color 0.15s;
}

.mds-btn-ghost:hover:not(:disabled) {
  background: #dbeafe;
}

.mds-btn-ghost:disabled {
  opacity: 0.45;
  cursor: not-allowed;
}

.mds-btn-close {
  width: 36px;
  height: 36px;
  border: none;
  border-radius: 10px;
  background: #f1f5f9;
  color: #64748b;
  font-size: 21px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background 0.15s, color 0.15s;
}

.mds-btn-close iconify-icon {
  font-size: 21px;
}

.mds-btn-close:hover {
  background: #e2e8f0;
  color: #0f172a;
}

.mds-stats {
  margin: 0;
  padding: 8px 16px;
  font-size: 12px;
  color: #64748b;
  background: rgba(239, 246, 255, 0.5);
  border-bottom: 1px solid #f1f5f9;
}

.mds-stats strong {
  color: #0f172a;
  font-weight: 700;
}

.mds-stats__hint {
  color: #2563eb;
}

.mds-body {
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  overscroll-behavior: contain;
  padding: 12px 14px;
  -webkit-overflow-scrolling: touch;
}

.mds-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 40px 16px;
  text-align: center;
  font-size: 13px;
  color: #64748b;
  gap: 10px;
}

.mds-state--error {
  color: #dc2626;
}

.mds-state__spin {
  font-size: 32px;
  color: #3b82f6;
  animation: mdsSpin 0.9s linear infinite;
}

.mds-state__empty-icon {
  font-size: 46px;
  color: #cbd5e1;
}

@keyframes mdsSpin {
  to {
    transform: rotate(360deg);
  }
}

.mds-list {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.mds-card {
  position: relative;
  padding: 12px 12px 12px 40px;
  border-radius: 12px;
  border: 1.5px solid var(--fs-card-border, #cbd5e1);
  background: var(--fs-card-bg, #ffffff);
  box-shadow: var(--fs-card-shadow, 0 1px 2px rgba(15, 23, 42, 0.07));
  cursor: pointer;
  transition:
    border-color 0.15s,
    background 0.15s,
    box-shadow 0.15s;
}

.mds-card:hover:not(.mds-card--published) {
  border-color: #93c5fd;
  box-shadow: 0 4px 12px -4px rgba(59, 130, 246, 0.2);
}

.mds-card--selected {
  border-color: #3b82f6;
  background: linear-gradient(135deg, #eff6ff 0%, #f5f3ff 100%);
  box-shadow: 0 0 0 1px rgba(59, 130, 246, 0.2);
}

.mds-card--published {
  border-style: dashed;
  border-color: #cbd5e1;
  background: #f8fafc;
  cursor: not-allowed;
  opacity: 0.92;
}

.mds-badge {
  position: absolute;
  top: 10px;
  right: 10px;
  font-size: 10px;
  font-weight: 700;
  padding: 3px 8px;
  border-radius: 6px;
  line-height: 1.2;
}

.mds-badge--ok {
  background: #dcfce7;
  color: #166534;
}

.mds-badge--pending {
  background: #fef3c7;
  color: #92400e;
}

.mds-check {
  position: absolute;
  left: 12px;
  top: 14px;
  width: 20px;
  height: 20px;
  border-radius: 6px;
  border: 2px solid #cbd5e1;
  background: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 14px;
  color: #fff;
  transition: all 0.15s;
}

.mds-card--selected .mds-check {
  border-color: #2563eb;
  background: linear-gradient(135deg, #3b82f6, #8b5cf6);
}

.mds-card--published .mds-check {
  background: #e2e8f0;
  border-color: #cbd5e1;
}

.mds-card__title {
  margin: 0 48px 8px 0;
  font-size: 14px;
  font-weight: 700;
  line-height: 1.4;
  color: #0f172a;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.mds-card--published .mds-card__title {
  color: #475569;
  font-weight: 600;
}

.mds-card__kw {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-bottom: 8px;
}

.mds-kw {
  font-size: 10px;
  font-weight: 500;
  color: #475569;
  background: #f1f5f9;
  padding: 2px 8px;
  border-radius: 6px;
  max-width: 100%;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.mds-card--selected .mds-kw {
  background: rgba(255, 255, 255, 0.75);
}

.mds-card__date {
  margin: 0;
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 11px;
  color: #64748b;
}

.mds-pagination {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  margin-top: 12px;
  padding-top: 4px;
  flex-wrap: wrap;
}

.mds-page-btn {
  padding: 6px 12px;
  font-size: 12px;
  font-weight: 600;
  color: #475569;
  background: #fff;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  cursor: pointer;
  transition: background 0.15s, border-color 0.15s, color 0.15s;
}

.mds-page-btn:hover:not(:disabled) {
  border-color: #93c5fd;
  color: #2563eb;
  background: #eff6ff;
}

.mds-page-btn:disabled {
  opacity: 0.45;
  cursor: not-allowed;
}

.mds-page-nums {
  display: flex;
  align-items: center;
  gap: 4px;
}

.mds-page-num {
  min-width: 32px;
  height: 32px;
  padding: 0 6px;
  font-size: 12px;
  font-weight: 600;
  color: #64748b;
  background: #fff;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.15s;
}

.mds-page-num:hover:not(:disabled):not(.mds-page-num--active) {
  border-color: #93c5fd;
  color: #2563eb;
}

.mds-page-num--active {
  color: #fff;
  border-color: #3b82f6;
  background: linear-gradient(135deg, #3b82f6, #6366f1);
  box-shadow: 0 2px 8px rgba(59, 130, 246, 0.35);
}

.mds-page-num:disabled {
  cursor: not-allowed;
}

.mds-footer {
  flex-shrink: 0;
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 16px;
  padding-bottom: calc(12px + env(safe-area-inset-bottom, 0));
  border-top: 1px solid #e2e8f0;
  background: rgba(255, 255, 255, 0.92);
  backdrop-filter: blur(12px);
}

.mds-footer__info {
  flex: 1;
  min-width: 0;
  font-size: 11px;
  color: #64748b;
  line-height: 1.35;
}

.mds-footer__info strong {
  display: block;
  font-size: 14px;
  color: #0f172a;
  font-weight: 700;
}

.mds-btn-publish {
  flex-shrink: 0;
  padding: 11px 22px;
  font-size: 14px;
  font-weight: 700;
  color: #fff;
  border: none;
  border-radius: 12px;
  cursor: pointer;
  background: linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%);
  box-shadow: 0 8px 20px -6px rgba(59, 130, 246, 0.45);
  transition: transform 0.15s, opacity 0.15s, box-shadow 0.15s;
}

.mds-btn-publish:hover:not(:disabled) {
  transform: translateY(-1px);
  box-shadow: 0 12px 24px -8px rgba(59, 130, 246, 0.5);
}

.mds-btn-publish:disabled {
  opacity: 0.45;
  cursor: not-allowed;
  transform: none;
  box-shadow: none;
}

.mds-btn-publish--block {
  width: 100%;
  margin-top: 4px;
}

.mds-toast-layer {
  position: fixed;
  inset: 0;
  z-index: 210;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px;
  background: rgba(15, 23, 42, 0.35);
}

.mds-toast {
  width: 100%;
  max-width: 300px;
  padding: 22px 20px;
  text-align: center;
  background: #fff;
  border-radius: 16px;
  box-shadow: 0 20px 40px -12px rgba(15, 23, 42, 0.2);
}

.mds-toast iconify-icon {
  font-size: 46px;
}

.mds-toast__icon--ok {
  color: #10b981;
}

.mds-toast__icon--err {
  color: #ef4444;
}

.mds-toast h3 {
  margin: 10px 0 6px;
  font-size: 16px;
  font-weight: 800;
  color: #0f172a;
}

.mds-toast p {
  margin: 0 0 16px;
  font-size: 13px;
  color: #64748b;
  line-height: 1.5;
}

.mds-fade-enter-active,
.mds-fade-leave-active {
  transition: opacity 0.22s ease;
}

.mds-fade-enter-from,
.mds-fade-leave-to {
  opacity: 0;
}

@media (min-width: 768px) {
  .mds-panel {
    max-width: 480px;
  }

  .mds-header__title {
    font-size: 1.25rem;
  }
}
</style>
