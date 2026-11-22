/**
 * 本地登录会话：使用 localStorage，同域名下多标签页共享登录态。
 * - 登录当日有效，跨自然日（隔天）需重新登录
 * - 主动退出：清除全部认证数据
 */

const AUTH_USER_KEY = 'auth_user'
const AUTH_TOKEN_KEY = 'auth_token'
const AUTH_SESSION_EXPIRES_AT_KEY = 'auth_session_expires_at'
const AUTH_SESSION_LOGIN_DAY_KEY = 'auth_session_login_day'
const AUTH_PROFILE_COMPLETE_KEY = 'auth_profile_complete'
const AUTH_LOGOUT_SNAPSHOT_KEY = 'auth_logout_snapshot'

const ACTIVE_AUTH_KEYS = [
  AUTH_USER_KEY,
  AUTH_TOKEN_KEY,
  AUTH_SESSION_EXPIRES_AT_KEY,
  AUTH_SESSION_LOGIN_DAY_KEY,
  AUTH_PROFILE_COMPLETE_KEY
] as const

/** @deprecated 兼容旧版迁移 */
const AUTH_KEYS = [...ACTIVE_AUTH_KEYS, AUTH_LOGOUT_SNAPSHOT_KEY] as const

/** 退出登录后可自动恢复的时长（毫秒） */
const LOGOUT_RESTORE_TTL_MS = 60 * 60 * 1000

type LogoutSnapshot = {
  user: string
  token: string | null
  profileComplete: boolean
  expiresAt: number
}

export function readAuthUserRaw(): string | null {
  return localStorage.getItem(AUTH_USER_KEY)
}

export function writeAuthUserRaw(value: string): void {
  localStorage.setItem(AUTH_USER_KEY, value)
}

export function readAuthToken(): string | null {
  return localStorage.getItem(AUTH_TOKEN_KEY)
}

export function writeAuthToken(token: string): void {
  localStorage.setItem(AUTH_TOKEN_KEY, token)
}

export function clearAuthToken(): void {
  localStorage.removeItem(AUTH_TOKEN_KEY)
}

export function readProfileCompleteFlag(): boolean {
  return localStorage.getItem(AUTH_PROFILE_COMPLETE_KEY) === '1'
}

export function writeProfileCompleteFlag(complete: boolean): void {
  if (complete) {
    localStorage.setItem(AUTH_PROFILE_COMPLETE_KEY, '1')
  } else {
    localStorage.removeItem(AUTH_PROFILE_COMPLETE_KEY)
  }
}

/** 登录成功时清除退出恢复快照（已进入正常登录态） */
export function clearLogoutSnapshot(): void {
  localStorage.removeItem(AUTH_LOGOUT_SNAPSHOT_KEY)
}

/** 清除 localStorage + sessionStorage 中的当前登录态 */
function clearActiveAuthStorageEverywhere(): void {
  ACTIVE_AUTH_KEYS.forEach((key) => {
    localStorage.removeItem(key)
    sessionStorage.removeItem(key)
  })
}

/** 仅清除当前登录态，保留退出后 1 小时内的恢复快照 */
export function clearActiveAuthStorage(): void {
  clearActiveAuthStorageEverywhere()
}

/** 清除所有认证相关数据（含退出恢复快照） */
export function clearAuthStorage(): void {
  clearActiveAuthStorage()
  clearLogoutSnapshot()
}

/** @deprecated 兼容旧引用，行为同 clearAuthStorage */
export const clearAuthLocalStorage = clearAuthStorage

function formatLocalDateKey(date = new Date()): string {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

export function readAuthSessionLoginDay(): string | null {
  return localStorage.getItem(AUTH_SESSION_LOGIN_DAY_KEY)
}

/** 登录成功时记录当天日期，会话仅在登录当日有效 */
export function touchAuthSessionExpiry(): void {
  localStorage.setItem(AUTH_SESSION_LOGIN_DAY_KEY, formatLocalDateKey())
  localStorage.removeItem(AUTH_SESSION_EXPIRES_AT_KEY)
}

function isAuthSessionLoginDayValid(): boolean {
  const loginDay = readAuthSessionLoginDay()
  if (!loginDay) return false
  return loginDay === formatLocalDateKey()
}

function readLogoutSnapshot(): LogoutSnapshot | null {
  const raw = localStorage.getItem(AUTH_LOGOUT_SNAPSHOT_KEY)
  if (!raw) return null
  try {
    const snapshot = JSON.parse(raw) as LogoutSnapshot
    if (!snapshot?.user || !Number.isFinite(snapshot.expiresAt)) {
      clearLogoutSnapshot()
      return null
    }
    return snapshot
  } catch {
    clearLogoutSnapshot()
    return null
  }
}

/** 退出登录前保存会话，供 1 小时内自动恢复 */
export function saveLogoutSnapshot(fallbackUserRaw?: string | null): void {
  const user = readAuthUserRaw() || fallbackUserRaw || null

  if (user) {
    const snapshot: LogoutSnapshot = {
      user,
      token: readAuthToken(),
      profileComplete: readProfileCompleteFlag(),
      expiresAt: Date.now() + LOGOUT_RESTORE_TTL_MS
    }
    localStorage.setItem(AUTH_LOGOUT_SNAPSHOT_KEY, JSON.stringify(snapshot))
  } else {
    clearLogoutSnapshot()
  }

  // 无论是否有快照，都清除当前登录态（含 sessionStorage 残留）
  clearActiveAuthStorageEverywhere()
}

/** 退出后 1 小时内：将快照恢复为当前登录态 */
export function tryRestoreFromLogoutSnapshot(): boolean {
  const snapshot = readLogoutSnapshot()
  if (!snapshot) return false

  if (Date.now() >= snapshot.expiresAt) {
    clearLogoutSnapshot()
    return false
  }

  writeAuthUserRaw(snapshot.user)
  if (snapshot.token) {
    writeAuthToken(snapshot.token)
  } else {
    localStorage.removeItem(AUTH_TOKEN_KEY)
  }
  writeProfileCompleteFlag(snapshot.profileComplete)
  touchAuthSessionExpiry()
  return true
}

/**
 * 启动时迁移：若旧版 sessionStorage 中仍有登录态，提升到 localStorage；
 * 随后清除 sessionStorage 中的认证字段，避免多标签页状态不一致。
 */
export function migrateLegacyAuthStorage(): void {
  pruneExpiredLogoutSnapshot()

  // 已退出（含 1 小时恢复窗口内）：禁止用 session 旧数据「复活」登录态
  if (localStorage.getItem(AUTH_LOGOUT_SNAPSHOT_KEY)) {
    clearActiveAuthStorageEverywhere()
    return
  }

  // 仅清理 session 残留
  AUTH_KEYS.forEach((key) => sessionStorage.removeItem(key))
  localStorage.removeItem(AUTH_SESSION_EXPIRES_AT_KEY)
  ensureAuthSessionOrClear()
}

/** @deprecated 兼容旧引用 */
export const migrateLegacyAuthFromLocalStorage = migrateLegacyAuthStorage

/**
 * 同步本地会话：跨自然日自动清除登录态；不在此处自动恢复（由进入登录页时触发）。
 * @returns false 表示会话已过期并已清除
 */
export function ensureAuthSessionOrClear(): boolean {
  pruneExpiredLogoutSnapshot()

  if (!readAuthUserRaw()) {
    localStorage.removeItem(AUTH_SESSION_LOGIN_DAY_KEY)
    localStorage.removeItem(AUTH_SESSION_EXPIRES_AT_KEY)
    return true
  }

  if (!isAuthSessionLoginDayValid()) {
    const loginDay = readAuthSessionLoginDay()
    if (!loginDay) {
      // 兼容：已有用户信息但缺少当日会话标记时补写，避免 sync 误清登录态
      touchAuthSessionExpiry()
      return true
    }
    clearActiveAuthStorageEverywhere()
    clearLogoutSnapshot()
    return false
  }

  return true
}

function pruneExpiredLogoutSnapshot(): void {
  const snapshot = readLogoutSnapshot()
  if (snapshot && Date.now() >= snapshot.expiresAt) {
    clearLogoutSnapshot()
  }
}
