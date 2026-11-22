<template>
  <Teleport to="body">
    <Transition name="notice-fade">
      <div
        v-if="modelValue"
        class="notice-drawer-overlay"
        aria-hidden="true"
        @click="close"
      />
    </Transition>

    <Transition name="notice-slide">
      <aside
        v-if="modelValue"
        class="notice-drawer"
        role="dialog"
        aria-modal="true"
        aria-labelledby="notice-drawer-title"
        @click.stop
      >
        <header class="notice-drawer__header">
          <div>
            <h2 id="notice-drawer-title" class="notice-drawer__title">
              <iconify-icon icon="mdi:bell-outline" />
              消息通知
            </h2>
            <p v-if="drawerUnreadCount > 0" class="notice-drawer__sub">
              {{ drawerUnreadCount }} 条未读
            </p>
          </div>
          <button
            type="button"
            class="notice-drawer__close"
            aria-label="关闭"
            @click="close"
          >
            <iconify-icon icon="mdi:close" />
          </button>
        </header>

        <div ref="bodyRef" class="notice-drawer__body" @scroll="onBodyScroll">
          <div v-if="noticeLoading && !notices.length" class="notice-drawer__state">
            <iconify-icon class="notice-drawer__spin" icon="mdi:loading" />
            <p>加载中…</p>
          </div>

          <div v-else-if="noticeError && !notices.length" class="notice-drawer__state notice-drawer__state--error">
            <iconify-icon icon="mdi:alert-circle-outline" />
            <p>{{ noticeError }}</p>
            <button type="button" class="notice-drawer__retry" @click="fetchNotices">
              重新加载
            </button>
          </div>

          <div v-else-if="!notices.length && !noticeLoading" class="notice-drawer__state">
            <iconify-icon icon="mdi:bell-off-outline" class="notice-drawer__empty-icon" />
            <p>暂无消息</p>
          </div>

          <template v-else>
            <ul class="notice-drawer__list">
              <li
                v-for="(notice, idx) in notices"
                :key="notice.id"
                class="notice-drawer__item"
                :class="{
                  'notice-drawer__item--unread': notice.unread,
                  'notice-drawer__item--marking': markingIds.has(notice.id)
                }"
                @click="markAsRead(idx)"
              >
                <span class="notice-drawer__item-icon">
                  <iconify-icon :icon="notice.icon || 'mdi:information-outline'" />
                </span>
                <div class="notice-drawer__item-main">
                  <div class="notice-drawer__item-head">
                    <span class="notice-drawer__item-title">{{ notice.title }}</span>
                    <span class="notice-drawer__item-time">{{ notice.time }}</span>
                  </div>
                  <p class="notice-drawer__item-content">{{ notice.content }}</p>
                </div>
                <span v-if="notice.unread" class="notice-drawer__dot" aria-hidden="true" />
              </li>
            </ul>

            <div v-if="noticeLoadingMore" class="notice-drawer__load-more">
              <iconify-icon class="notice-drawer__spin" icon="mdi:loading" />
              <span>加载更多…</span>
            </div>
            <p
              v-else-if="!hasMoreNotices && notices.length"
              class="notice-drawer__no-more"
            >
              已加载全部 {{ noticeTotal }} 条
            </p>
          </template>
        </div>

        <footer v-if="drawerUnreadCount > 0" class="notice-drawer__footer">
          <button
            type="button"
            class="notice-drawer__read-all"
            :disabled="markingRead"
            @click="markAllAsRead"
          >
            <iconify-icon v-if="markingRead" class="notice-drawer__read-all-spin" icon="mdi:loading" />
            {{ markingRead ? '处理中…' : '全部标为已读' }}
          </button>
        </footer>
      </aside>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import { onUnmounted, ref, watch } from 'vue'
import { useNoticeList } from '@/composables/useNoticeList'

const modelValue = defineModel<boolean>({ default: false })
const bodyRef = ref<HTMLElement | null>(null)

const {
  notices,
  noticeLoading,
  noticeLoadingMore,
  noticeError,
  noticeTotal,
  hasMoreNotices,
  markingRead,
  markingIds,
  drawerUnreadCount,
  fetchNotices,
  loadMoreNotices,
  fetchHasUnread,
  markAsRead,
  markAllAsRead
} = useNoticeList()

function close() {
  modelValue.value = false
}

function onBodyScroll() {
  const el = bodyRef.value
  if (!el || noticeLoading.value || noticeLoadingMore.value || !hasMoreNotices.value) {
    return
  }
  const threshold = 56
  if (el.scrollTop + el.clientHeight >= el.scrollHeight - threshold) {
    void loadMoreNotices()
  }
}

watch(modelValue, (open) => {
  if (open) {
    document.body.style.overflow = 'hidden'
    void fetchNotices()
    void fetchHasUnread()
  } else {
    document.body.style.overflow = ''
    void fetchHasUnread()
  }
})

onUnmounted(() => {
  document.body.style.overflow = ''
})
</script>

<style scoped>
.notice-drawer-overlay {
  position: fixed;
  inset: 0;
  z-index: 110;
  background: rgba(15, 23, 42, 0.45);
  backdrop-filter: blur(2px);
}

.notice-drawer {
  position: fixed;
  top: 0;
  right: 0;
  z-index: 111;
  width: min(400px, 100vw);
  height: 100%;
  height: 100dvh;
  display: flex;
  flex-direction: column;
  background: linear-gradient(180deg, #ffffff 0%, #f8fafc 100%);
  box-shadow: -12px 0 40px -8px rgba(15, 23, 42, 0.18);
  border-left: 1px solid var(--fs-card-border, #cbd5e1);
}

.notice-drawer__header {
  flex-shrink: 0;
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
  padding: 18px 18px 14px;
  border-bottom: 1px solid #f1f5f9;
  background: rgba(255, 255, 255, 0.9);
}

.notice-drawer__title {
  margin: 0;
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 18px;
  font-weight: 800;
  color: #0f172a;
}

.notice-drawer__title iconify-icon {
  font-size: 26px;
  color: #2563eb;
}

.notice-drawer__sub {
  margin: 4px 0 0;
  font-size: 12px;
  color: #64748b;
}

.notice-drawer__close {
  width: 36px;
  height: 36px;
  border: none;
  border-radius: 10px;
  background: #f1f5f9;
  color: #64748b;
  font-size: 23px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background 0.15s, color 0.15s;
}

.notice-drawer__close iconify-icon {
  font-size: 23px;
}

.notice-drawer__close:hover {
  background: #e2e8f0;
  color: #0f172a;
}

.notice-drawer__body {
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  overscroll-behavior: contain;
  padding: 12px 14px;
  -webkit-overflow-scrolling: touch;
}

.notice-drawer__state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 48px 16px;
  text-align: center;
  font-size: 13px;
  color: #64748b;
  gap: 12px;
}

.notice-drawer__spin {
  font-size: 36px;
  color: #3b82f6;
  animation: noticeSpin 0.9s linear infinite;
}

.notice-drawer__empty-icon {
  font-size: 54px;
  color: #cbd5e1;
}

.notice-drawer__state--error iconify-icon {
  font-size: 46px;
  color: #f59e0b;
}

.notice-drawer__retry {
  margin-top: 4px;
  padding: 8px 16px;
  font-size: 13px;
  font-weight: 600;
  color: #2563eb;
  background: #eff6ff;
  border: 1px solid #dbeafe;
  border-radius: 8px;
  cursor: pointer;
}

.notice-drawer__retry:hover {
  background: #dbeafe;
}

@keyframes noticeSpin {
  to {
    transform: rotate(360deg);
  }
}

.notice-drawer__list {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.notice-drawer__load-more {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 14px 12px 18px;
  font-size: 13px;
  color: #64748b;
}

.notice-drawer__no-more {
  margin: 0;
  padding: 12px 12px 16px;
  text-align: center;
  font-size: 12px;
  color: #94a3b8;
}

.notice-drawer__item {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  padding: 12px;
  border-radius: 12px;
  border: 1px solid var(--fs-card-border, #cbd5e1);
  background: #fff;
  box-shadow: var(--fs-card-shadow, 0 1px 2px rgba(15, 23, 42, 0.07));
  cursor: pointer;
  transition:
    background 0.15s,
    border-color 0.15s,
    box-shadow 0.15s;
}

.notice-drawer__item:hover {
  background: #f8fafc;
  border-color: #94a3b8;
  box-shadow: var(--fs-card-shadow-md, 0 2px 8px rgba(15, 23, 42, 0.08));
}

.notice-drawer__item--unread {
  border-color: #bfdbfe;
  background: linear-gradient(135deg, #eff6ff 0%, #ffffff 100%);
  box-shadow: 0 0 0 1px rgba(59, 130, 246, 0.12);
}

.notice-drawer__item--marking {
  opacity: 0.7;
  pointer-events: none;
}

.notice-drawer__item-icon {
  width: 40px;
  height: 40px;
  flex-shrink: 0;
  border-radius: 50%;
  background: #eff6ff;
  color: #2563eb;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 23px;
}

.notice-drawer__item-main {
  flex: 1;
  min-width: 0;
}

.notice-drawer__item-head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 8px;
  margin-bottom: 4px;
}

.notice-drawer__item-title {
  font-size: 14px;
  font-weight: 600;
  color: #0f172a;
  line-height: 1.35;
}

.notice-drawer__item-time {
  flex-shrink: 0;
  font-size: 11px;
  color: #94a3b8;
}

.notice-drawer__item-content {
  margin: 0;
  font-size: 13px;
  color: #64748b;
  line-height: 1.45;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.notice-drawer__dot {
  width: 8px;
  height: 8px;
  margin-top: 6px;
  flex-shrink: 0;
  border-radius: 50%;
  background: #ef4444;
}

.notice-drawer__footer {
  flex-shrink: 0;
  padding: 12px 16px;
  padding-bottom: calc(12px + env(safe-area-inset-bottom, 0));
  border-top: 1px solid #f1f5f9;
  background: rgba(255, 255, 255, 0.95);
}

.notice-drawer__read-all {
  width: 100%;
  padding: 11px;
  font-size: 14px;
  font-weight: 600;
  color: #2563eb;
  background: #eff6ff;
  border: 1px solid #dbeafe;
  border-radius: 10px;
  cursor: pointer;
  transition: background 0.15s;
}

.notice-drawer__read-all:hover:not(:disabled) {
  background: #dbeafe;
}

.notice-drawer__read-all:disabled {
  opacity: 0.65;
  cursor: not-allowed;
}

.notice-drawer__read-all {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
}

.notice-drawer__read-all-spin {
  font-size: 1.125rem;
  animation: noticeSpin 0.9s linear infinite;
}

.notice-fade-enter-active,
.notice-fade-leave-active {
  transition: opacity 0.25s ease;
}

.notice-fade-enter-from,
.notice-fade-leave-to {
  opacity: 0;
}

.notice-slide-enter-active,
.notice-slide-leave-active {
  transition: transform 0.28s cubic-bezier(0.4, 0, 0.2, 1);
}

.notice-slide-enter-from,
.notice-slide-leave-to {
  transform: translateX(100%);
}
</style>
