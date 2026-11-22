import type { useAuthStore } from '@/stores/auth'
import type { TpdcDatasetConfig } from '@/utils/tpdcDataConfigApi'
import {
  assertDatasetSeekPageUrl,
  navigateDatasetSeekWindow,
  openSeekPlaceholderWindow,
  showSeekOpenError,
  submitDatasetSeek
} from '@/utils/datasetSeekApi'

const PENDING_DATASET_SEEK_KEY = 'fairspace_pending_dataset_seek'

export type PendingDatasetSeek = {
  center: string
  dataset: TpdcDatasetConfig
}

type AuthStore = ReturnType<typeof useAuthStore>

export function savePendingDatasetSeek(center: string, dataset: TpdcDatasetConfig): void {
  if (typeof sessionStorage === 'undefined') return
  const externalId = String(dataset.external_id || '').trim()
  if (!externalId) return
  try {
    sessionStorage.setItem(
      PENDING_DATASET_SEEK_KEY,
      JSON.stringify({
        center: String(center || 'tpdc').trim() || 'tpdc',
        dataset
      } satisfies PendingDatasetSeek)
    )
  } catch {
    /* ignore */
  }
}

export function peekPendingDatasetSeek(): PendingDatasetSeek | null {
  if (typeof sessionStorage === 'undefined') return null
  try {
    const raw = sessionStorage.getItem(PENDING_DATASET_SEEK_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as PendingDatasetSeek
    if (!parsed?.dataset?.external_id) return null
    return parsed
  } catch {
    return null
  }
}

export function takePendingDatasetSeek(): PendingDatasetSeek | null {
  const pending = peekPendingDatasetSeek()
  if (!pending) return null
  try {
    sessionStorage.removeItem(PENDING_DATASET_SEEK_KEY)
  } catch {
    /* ignore */
  }
  return pending
}

export function clearPendingDatasetSeek(): void {
  if (typeof sessionStorage === 'undefined') return
  try {
    sessionStorage.removeItem(PENDING_DATASET_SEEK_KEY)
  } catch {
    /* ignore */
  }
}

async function resolveCurrentUserUid(authStore: AuthStore): Promise<string> {
  authStore.syncFromStorage()
  let uid = String(authStore.user?.uid || '').trim()
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

/**
 * 打开数据智能探查。
 * preferSameTab=true：登录成功后在当前页跳转（避免弹窗被拦）；
 * 否则优先新窗口，失败时回退到当前页。
 */
export async function openDatasetSeekFlow(
  dataset: TpdcDatasetConfig,
  authStore: AuthStore,
  options?: { preferSameTab?: boolean; center?: string }
): Promise<void> {
  const uid = await resolveCurrentUserUid(authStore)
  const preferSameTab = !!options?.preferSameTab
  const center = String(options?.center || 'tpdc').trim() || 'tpdc'
  const externalId = String(dataset.external_id || '').trim()

  if (preferSameTab) {
    const { seekUrl } = await submitDatasetSeek(dataset, undefined, uid, center)
    const url = assertDatasetSeekPageUrl(seekUrl, center, externalId)
    window.location.assign(url)
    return
  }

  const newWin = openSeekPlaceholderWindow()
  if (!newWin) {
    // 弹窗被拦：当前页直接进入探查
    const { seekUrl } = await submitDatasetSeek(dataset, undefined, uid, center)
    window.location.assign(assertDatasetSeekPageUrl(seekUrl, center, externalId))
    return
  }

  try {
    const { seekUrl } = await submitDatasetSeek(dataset, undefined, uid, center)
    navigateDatasetSeekWindow(newWin, seekUrl, center, externalId)
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : '数据智能探查打开失败'
    showSeekOpenError(newWin, message)
    throw new Error(message)
  }
}

/** 登录/onboarding 完成后恢复待处理的探查并打开 */
export async function resumePendingDatasetSeek(authStore: AuthStore): Promise<boolean> {
  const pending = takePendingDatasetSeek()
  if (!pending) return false

  authStore.syncFromStorage()
  if (!authStore.isLoggedIn) {
    savePendingDatasetSeek(pending.center, pending.dataset)
    return false
  }

  try {
    // 登录后不在用户手势内，新窗口常被拦 → 当前页直接进入探查
    await openDatasetSeekFlow(pending.dataset, authStore, {
      preferSameTab: true,
      center: pending.center
    })
    return true
  } catch {
    savePendingDatasetSeek(pending.center, pending.dataset)
    return false
  }
}
