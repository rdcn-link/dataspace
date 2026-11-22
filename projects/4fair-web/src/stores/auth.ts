/**
 * 认证状态管理 (Pinia Store)
 *
 * 微信扫码登录 → 获取 openId → 调用 /oidc-server/user/user.findbyopenid
 * username 不为空则资料已完善，否则跳转补充资料页。
 *
 * 本地会话：localStorage 多标签页共享；登录当日有效，隔天需重新登录。
 * 主动退出：清除全部用户数据。
 */
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import {
  clearLogoutSnapshot,
  clearAuthStorage,
  clearAuthToken,
  ensureAuthSessionOrClear,
  readAuthUserRaw,
  readProfileCompleteFlag,
  writeAuthUserRaw,
  writeAuthToken,
  writeProfileCompleteFlag,
  touchAuthSessionExpiry,
  tryRestoreFromLogoutSnapshot
} from '@/utils/authSession'
import type { AccountAuthResult } from '@/utils/accountAuth'
import { loginAccount } from '@/utils/accountAuth'

export interface UserInfo {
  id: string
  nickname: string
  avatar?: string
  openId?: string
  /** 邮箱账号；findbyopenid 的 username 不为空表示已完善资料 */
  loginName?: string
  /** 用户唯一标识，用于下载等业务接口 */
  uid?: string
  /** 展示名（部分页面/接口可能单独返回） */
  displayName?: string
  affiliation?: string
  phone?: string
  source?: string
}

function isPublicBrowseLocation(): boolean {
  const raw = window.location.pathname || '/'
  const p = raw.replace(/\/+$/, '') || '/'
  if (p === '/' || p === '/service' || p === '/service/list' || p === '/assets') return true
  if (/^\/data\/[^/]+$/.test(p)) return true
  return false
}

function isUsernamePresent(value: unknown): boolean {
  if (value == null) return false
  const text = String(value).trim()
  return text !== '' && text.toLowerCase() !== 'null'
}

export const useAuthStore = defineStore('auth', () => {
  // ---------- State ----------
  const user = ref<UserInfo | null>(null)
  /** 会话代数：退出或重新登录时递增，用于忽略过期的用户信息请求 */
  let authSessionEpoch = 0

  function bumpAuthSessionEpoch(): number {
    authSessionEpoch += 1
    return authSessionEpoch
  }

  function isAuthSessionCurrent(epoch: number): boolean {
    return epoch === authSessionEpoch
  }

  function syncFromStorage() {
    if (!ensureAuthSessionOrClear()) {
      if (user.value !== null) user.value = null
      return
    }
    try {
      const raw = readAuthUserRaw()
      if (!raw) {
        if (user.value !== null) user.value = null
        return
      }

      const next = JSON.parse(raw) as UserInfo
      const prev = user.value
      if (
        prev?.uid === next?.uid &&
        prev?.openId === next?.openId &&
        prev?.id === next?.id &&
        prev?.nickname === next?.nickname
      ) {
        return
      }
      user.value = next
    } catch {
      if (user.value !== null) user.value = null
    }
  }

  /** 退出后 1 小时内进入登录流程时，尝试自动恢复会话（仅兼容历史快照，主动退出已不再写入） */
  function tryRestoreAfterLogout(): boolean {
    if (user.value) return true
    if (!tryRestoreFromLogoutSnapshot()) return false
    syncFromStorage()
    return !!user.value
  }

  syncFromStorage()

  // ---------- Getters ----------
  const isLoggedIn = computed(() => !!user.value)

  const displayName = computed(() => {
    return user.value?.nickname || user.value?.openId || ''
  })

  /**
   * 微信首次登录需完善信息：手机号 / 邮箱 / 用户名称（仅格式校验，可跳过）
   * 已跳过或已填写 username 则不再提示
   */
  function needsProfileCompletion(): boolean {
    if (!user.value?.openId) return false
    if (readProfileCompleteFlag()) return false
    return !isUsernamePresent(user.value.loginName)
  }

  function markProfileComplete() {
    writeProfileCompleteFlag(true)
  }

  function clearProfileComplete() {
    writeProfileCompleteFlag(false)
  }

  // ---------- Actions ----------

  /** 通过微信 openId 登录，并查询用户是否已完善资料 */
  async function loginWithOpenId(openId: string) {
    bumpAuthSessionEpoch()
    // 清除过期的 Bearer token，避免后续请求 401 误清微信登录态
    clearAuthToken()
    const userInfo: UserInfo = {
      id: openId,
      nickname: openId,
      openId,
      /** 接口未返回 uid 前，用 openId 作为上传/申请路径标识 */
      uid: openId
    }
    user.value = userInfo
    writeAuthUserRaw(JSON.stringify(userInfo))
    touchAuthSessionExpiry()
    clearLogoutSnapshot()
    clearProfileComplete()
    await fetchUserInfo(openId)
  }

  /**
   * 调用 /oidc-server/user/user.findbyopenid?openId=xxx
   * - data 为 null / 无 username → 新用户，需进入完善信息（可跳过）
   * - username 有值 → 老用户，资料已完善
   */
  async function fetchUserInfo(openId: string): Promise<boolean> {
    const epoch = authSessionEpoch
    if (!openId || !isAuthSessionCurrent(epoch)) return false

    try {
      const res = await fetch(
        `/oidc-server/user/user.findbyopenid?openId=${encodeURIComponent(openId)}&type=0`
      )
      const json = (await res.json()) as Record<string, unknown>

      if (!isAuthSessionCurrent(epoch) || !readAuthUserRaw()) return false

      const rawData = json.data
      // 新用户常见：{ code:200, data:null }
      if (rawData == null || typeof rawData !== 'object') {
        user.value = {
          ...(user.value || {}),
          id: openId,
          nickname: user.value?.nickname || openId,
          loginName: '',
          openId: user.value?.openId || openId,
          uid: user.value?.uid || openId
        }
        writeAuthUserRaw(JSON.stringify(user.value))
        clearProfileComplete()
        return false
      }

      const data = rawData as Record<string, unknown>
      const hasUsername = isUsernamePresent(data.username)
      const username = hasUsername ? String(data.username).trim() : ''
      const resolvedUid = String(data.uid || data.userId || '').trim()
      const displayName =
        String(data.name || data.realName || data.nickName || data.nickname || '').trim() ||
        username ||
        user.value?.nickname ||
        openId

      if (!isAuthSessionCurrent(epoch) || !readAuthUserRaw()) return false

      user.value = {
        ...(user.value || {}),
        id: String(data.id || data.userId || openId),
        nickname: displayName,
        loginName: username,
        openId: user.value?.openId || openId,
        uid: resolvedUid || user.value?.uid || openId,
        affiliation: data.orgName
          ? String(data.orgName)
          : data.affiliation
            ? String(data.affiliation)
            : user.value?.affiliation,
        phone: data.phone ? String(data.phone) : user.value?.phone,
        source: data.occupation
          ? String(data.occupation)
          : data.certType
            ? String(data.certType)
            : data.source
              ? String(data.source)
              : user.value?.source
      }
      writeAuthUserRaw(JSON.stringify(user.value))

      if (!isAuthSessionCurrent(epoch)) {
        user.value = null
        return false
      }

      if (hasUsername) {
        markProfileComplete()
      } else {
        clearProfileComplete()
      }

      return hasUsername
    } catch {
      // 查询失败时仍允许登录，并引导完善信息（可跳过）
      if (isAuthSessionCurrent(epoch)) {
        if (user.value) {
          user.value = { ...user.value, loginName: user.value.loginName || '' }
          writeAuthUserRaw(JSON.stringify(user.value))
        }
        clearProfileComplete()
      }
      return false
    }
  }

  /** 设置完整的用户信息 */
  function setUser(userInfo: UserInfo) {
    user.value = userInfo
    writeAuthUserRaw(JSON.stringify(userInfo))
    clearLogoutSnapshot()
  }

  /** 账号密码登录成功后写入会话 */
  function applyAccountAuth(result: AccountAuthResult) {
    bumpAuthSessionEpoch()
    const uid = result.uid || result.username
    const userInfo: UserInfo = {
      id: uid,
      uid,
      nickname: result.name || result.username,
      loginName: result.username,
      affiliation: result.affiliation,
      phone: result.phone,
      source: result.source,
      displayName: result.name || result.username,
      openId: user.value?.openId
    }
    setUser(userInfo)
    touchAuthSessionExpiry()
    markProfileComplete()
    if (result.token) {
      writeAuthToken(result.token)
    }
  }

  /** 邮箱 + 密码登录 */
  async function loginWithPassword(username: string, password: string) {
    const result = await loginAccount({ username, password })
    applyAccountAuth(result)
    return result
  }

  /** 主动退出：清除全部本地用户数据（不保留恢复快照） */
  function logout() {
    bumpAuthSessionEpoch()
    clearAuthStorage()
    user.value = null
    syncFromStorage()

    if (!isPublicBrowseLocation()) {
      window.location.href = '/'
    }
  }

  return {
    user,
    isLoggedIn,
    displayName,
    loginWithOpenId,
    fetchUserInfo,
    setUser,
    applyAccountAuth,
    loginWithPassword,
    needsProfileCompletion,
    markProfileComplete,
    logout,
    syncFromStorage,
    tryRestoreAfterLogout
  }
})
