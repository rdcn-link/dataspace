import type { Router } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { peekPendingDatasetSeek, resumePendingDatasetSeek } from '@/utils/datasetSeekPending'

/** 登录成功后回跳地址校验：仅允许站内相对路径 */
export function resolvePostLoginPath(redirect?: unknown, fallback = '/'): string {
  if (typeof redirect !== 'string') return fallback
  let path = redirect.trim()
  // 兼容错误写成 ~/profile 等形式
  if (path.startsWith('~/')) path = `/${path.slice(2)}`
  else if (path === '~') path = '/'
  if (!path.startsWith('/') || path.startsWith('//')) return fallback
  if (path === '/login' || path.startsWith('/login?') || path.startsWith('/login/')) return fallback
  if (path === '/onboarding' || path.startsWith('/onboarding')) return fallback
  return path
}

/**
 * 登录成功后的最终跳转：首次登录需完善信息时先进入 onboarding（可跳过）
 */
export function resolvePostLoginNavigation(redirect?: unknown, fallback = '/'): string {
  const target = resolvePostLoginPath(redirect, fallback)
  const authStore = useAuthStore()
  authStore.syncFromStorage()
  if (!authStore.needsProfileCompletion()) return target
  const q = new URLSearchParams({ redirect: target })
  return `/onboarding?${q.toString()}`
}

/** 从当前页进入登录，并带上 redirect 以便登录后回到原页面 */
export function goLogin(router: Router, fromFullPath?: string) {
  const redirect = resolvePostLoginPath(fromFullPath, '')
  return router.push({
    name: 'Login',
    query: redirect ? { redirect } : undefined
  })
}

/**
 * 登录/onboarding 成功后的统一跳转：
 * 若存在待打开的数据智能探查，则当前页直接进入探查，不再回到列表页。
 */
export async function navigateAfterLogin(
  router: Router,
  redirect?: unknown,
  fallback = '/'
): Promise<void> {
  const authStore = useAuthStore()
  authStore.syncFromStorage()

  const pendingSeek = peekPendingDatasetSeek()
  if (pendingSeek && !authStore.needsProfileCompletion()) {
    const opened = await resumePendingDatasetSeek(authStore)
    if (opened) return
  }

  const redirectPath = resolvePostLoginPath(redirect, fallback)
  const target = resolvePostLoginNavigation(redirectPath, fallback)

  try {
    await router.replace(target)
  } catch {
    /* 下方硬跳转兜底 */
  }

  const name = router.currentRoute.value.name
  if (name === 'Login' || name === 'WechatScanLogin' || name === 'Register') {
    window.location.assign(target)
  }
}

/**
 * onboarding 跳过/提交完成后的统一跳转（含待处理探查恢复）
 */
export async function navigateAfterOnboarding(router: Router, redirect?: unknown): Promise<void> {
  const authStore = useAuthStore()
  authStore.syncFromStorage()

  if (peekPendingDatasetSeek()) {
    const opened = await resumePendingDatasetSeek(authStore)
    if (opened) return
  }

  const target = resolvePostLoginPath(redirect, '/')
  try {
    await router.replace(target)
  } catch {
    window.location.assign(target)
  }
}
