import { computed, ref, watch } from 'vue'
import { useAuthStore } from '@/stores/auth'

const NOTICE_LIST_API = '/tds-trading/order/order.noticeByUid'
const NOTICE_SINGLE_READ_API = '/tds-trading/order/notice.singlerRead'
const NOTICE_GLOBAL_READ_API = '/tds-trading/order/notice.globalRead'
const NOTICE_HAS_UNREAD_API = '/tds-trading/order/notice.hasUnread'

export interface NoticeItem {
  id: string
  title: string
  content: string
  time: string
  unread: boolean
  icon: string
}

const NOTICE_PAGE_SIZE = 10

const notices = ref<NoticeItem[]>([])
const noticeLoading = ref(false)
const noticeLoadingMore = ref(false)
const noticeError = ref('')
const noticePage = ref(1)
const noticeTotal = ref(0)
const markingRead = ref(false)
const markingIds = ref(new Set<string>())
/** 头部铃铛角标未读数（来自 hasUnread 接口） */
const unreadBadgeCount = ref(0)
let prefetchWatchStarted = false

function parseUnreadCountFromResponse(data: unknown, body: Record<string, unknown>): number {
  if (typeof data === 'number' && Number.isFinite(data)) {
    return Math.max(0, Math.floor(data))
  }
  if (typeof data === 'boolean') {
    return data ? 1 : 0
  }
  if (data && typeof data === 'object') {
    const o = data as Record<string, unknown>
    if (typeof o.count === 'number') return Math.max(0, Math.floor(o.count))
    if (typeof o.total === 'number') return Math.max(0, Math.floor(o.total))
    if (typeof o.unread === 'number') return Math.max(0, Math.floor(o.unread))
    if (typeof o.hasUnread === 'boolean') return o.hasUnread ? 1 : 0
  }
  if (typeof body.hasUnread === 'boolean') {
    return body.hasUnread ? 1 : 0
  }
  return 0
}

function isSuccessCode(code: unknown): boolean {
  return code === 200 || code === 0 || code === '200'
}

function extractNoticeRows(data: unknown): Record<string, unknown>[] {
  if (data == null) return []
  if (Array.isArray(data)) return data as Record<string, unknown>[]
  if (typeof data !== 'object') return []
  const obj = data as Record<string, unknown>
  if (Array.isArray(obj.rows)) return obj.rows as Record<string, unknown>[]
  if (Array.isArray(obj.list)) return obj.list as Record<string, unknown>[]
  if (Array.isArray(obj.records)) return obj.records as Record<string, unknown>[]
  return []
}

function extractNoticeTotal(data: unknown, rowCount: number): number {
  if (typeof data === 'object' && data !== null) {
    const total = (data as Record<string, unknown>).total
    if (typeof total === 'number' && Number.isFinite(total)) {
      return Math.max(0, Math.floor(total))
    }
  }
  return rowCount
}

function mergeNoticeRows(rows: NoticeItem[]) {
  const seen = new Set(notices.value.map((n) => n.id))
  for (const row of rows) {
    if (!seen.has(row.id)) {
      notices.value.push(row)
      seen.add(row.id)
    }
  }
}

function formatTime(timeStr: string) {
  const date = new Date(timeStr)
  if (Number.isNaN(date.getTime())) return timeStr
  const now = new Date()
  const diff = now.getTime() - date.getTime()

  if (diff < 60000) return '刚刚'
  if (diff < 3600000) return `${Math.floor(diff / 60000)}分钟前`
  if (diff < 86400000) return `${Math.floor(diff / 3600000)}小时前`
  if (diff < 604800000) return `${Math.floor(diff / 86400000)}天前`

  return date.toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  })
}

function getNoticeIcon(name: string, type?: string | number) {
  const text = `${name} ${type ?? ''}`
  if (/拒绝|驳回|失败/.test(text)) return 'mdi:alert-circle-outline'
  if (/通过|成功|批准/.test(text)) return 'mdi:check-circle-outline'
  if (/待审|审核中|处理中/.test(text)) return 'mdi:clock-outline'
  if (/系统|公告/.test(text)) return 'mdi:information-outline'
  return 'mdi:bell-outline'
}

function resolveUnread(item: Record<string, unknown>): boolean {
  // 后端 status：1=已读，0=未读
  if (item.status === 1 || item.status === '1') return false
  if (item.status === 0 || item.status === '0') return true

  if (item.readStatus === 0 || item.readStatus === false) return true
  if (item.readStatus === 1 || item.readStatus === true) return false
  if (typeof item.isRead === 'boolean') return !item.isRead
  if (item.read === false) return true
  if (item.read === true) return false

  return true
}

function mapNoticeRecord(item: Record<string, unknown>): NoticeItem {
  const title = String(item.name || item.title || item.subject || '系统通知')
  const content = String(
    item.description || item.content || item.message || item.remark || ''
  )
  const rawTime = item.createAt || item.createTime || item.updateAt || item.time
  const time = rawTime ? formatTime(String(rawTime)) : ''

  return {
    id: String(item.id || item.oid || `${title}-${rawTime}`),
    title,
    content,
    time,
    unread: resolveUnread(item),
    icon: getNoticeIcon(title, item.type as string | number | undefined)
  }
}

export function useNoticeList() {
  const authStore = useAuthStore()

  /** 头部铃铛数字（接口） */
  const unreadCount = computed(() => unreadBadgeCount.value)
  /** 抽屉内列表未读条数（本地列表） */
  const drawerUnreadCount = computed(() => notices.value.filter((n) => n.unread).length)
  const hasMoreNotices = computed(() => notices.value.length < noticeTotal.value)

  function resetNoticeListState() {
    notices.value = []
    noticePage.value = 1
    noticeTotal.value = 0
    noticeError.value = ''
  }

  async function fetchHasUnread() {
    const uid = authStore.user?.uid?.trim()
    if (!uid) {
      unreadBadgeCount.value = 0
      return
    }

    try {
      const res = await fetch(`${NOTICE_HAS_UNREAD_API}?uid=${encodeURIComponent(uid)}`)
      const json = await res.json()
      if (!isSuccessCode(json?.code)) {
        unreadBadgeCount.value = 0
        return
      }
      unreadBadgeCount.value = parseUnreadCountFromResponse(json.data, json as Record<string, unknown>)
    } catch {
      unreadBadgeCount.value = 0
    }
  }

  async function fetchNoticePage(page: number, append: boolean) {
    const uid = authStore.user?.uid?.trim()
    if (!uid) {
      resetNoticeListState()
      return
    }

    if (append) {
      if (noticeLoadingMore.value || noticeLoading.value || !hasMoreNotices.value) return
      noticeLoadingMore.value = true
    } else {
      noticeLoading.value = true
      noticeError.value = ''
    }

    try {
      const params = new URLSearchParams({
        uid,
        page: String(page),
        pageSize: String(NOTICE_PAGE_SIZE)
      })
      const res = await fetch(`${NOTICE_LIST_API}?${params.toString()}`)
      const json = await res.json()

      if (!isSuccessCode(json?.code)) {
        if (!append) {
          notices.value = []
          noticeError.value = String(json?.message || json?.msg || '获取消息失败')
        }
        return
      }

      const rawRows = extractNoticeRows(json.data)
      const mapped = rawRows.map(mapNoticeRecord)
      noticeTotal.value = extractNoticeTotal(json.data, mapped.length)
      noticePage.value = page

      if (append) {
        mergeNoticeRows(mapped)
        if (!mapped.length) {
          noticeTotal.value = notices.value.length
        }
      } else {
        notices.value = mapped
        void fetchHasUnread()
      }
    } catch {
      if (!append) {
        notices.value = []
        noticeError.value = '网络异常，请稍后重试'
      }
    } finally {
      if (append) {
        noticeLoadingMore.value = false
      } else {
        noticeLoading.value = false
      }
    }
  }

  async function fetchNotices() {
    resetNoticeListState()
    await fetchNoticePage(1, false)
  }

  async function loadMoreNotices() {
    if (!hasMoreNotices.value || noticeLoadingMore.value || noticeLoading.value) return
    await fetchNoticePage(noticePage.value + 1, true)
  }

  async function requestSingleRead(uid: string, noticeId: string): Promise<boolean> {
    const params = new URLSearchParams({
      uid,
      noticeId
    })
    const res = await fetch(`${NOTICE_SINGLE_READ_API}?${params.toString()}`)
    const json = await res.json()
    return isSuccessCode(json?.code)
  }

  async function markAsRead(index: number) {
    const item = notices.value[index]
    if (!item?.unread || markingIds.value.has(item.id)) return

    const uid = authStore.user?.uid?.trim()
    if (!uid) {
      item.unread = false
      return
    }

    markingIds.value.add(item.id)
    try {
      const ok = await requestSingleRead(uid, item.id)
      if (ok) {
        item.unread = false
        void fetchHasUnread()
      }
    } catch {
      /* 保留未读，用户可再次点击重试 */
    } finally {
      markingIds.value.delete(item.id)
    }
  }

  async function requestGlobalRead(uid: string): Promise<boolean> {
    const params = new URLSearchParams({ uid })
    const res = await fetch(`${NOTICE_GLOBAL_READ_API}?${params.toString()}`)
    const json = await res.json()
    return isSuccessCode(json?.code)
  }

  async function markAllAsRead() {
    const uid = authStore.user?.uid?.trim()
    const unreadItems = notices.value.filter((n) => n.unread)
    if (!unreadItems.length) return

    if (!uid) {
      unreadItems.forEach((n) => {
        n.unread = false
      })
      return
    }

    markingRead.value = true
    try {
      const ok = await requestGlobalRead(uid)
      if (ok) {
        notices.value.forEach((n) => {
          n.unread = false
        })
        unreadBadgeCount.value = 0
        void fetchHasUnread()
      }
    } catch {
      /* 失败时保持未读，可重试 */
    } finally {
      markingRead.value = false
    }
  }

  if (!prefetchWatchStarted) {
    prefetchWatchStarted = true
    watch(
      () => authStore.user?.uid,
      (uid) => {
        if (uid) void fetchHasUnread()
        else {
          resetNoticeListState()
          unreadBadgeCount.value = 0
        }
      },
      { immediate: true }
    )
  }

  return {
    notices,
    noticeLoading,
    noticeLoadingMore,
    noticeError,
    noticeTotal,
    hasMoreNotices,
    markingRead,
    markingIds,
    unreadCount,
    drawerUnreadCount,
    fetchNotices,
    loadMoreNotices,
    fetchHasUnread,
    markAsRead,
    markAllAsRead
  }
}
