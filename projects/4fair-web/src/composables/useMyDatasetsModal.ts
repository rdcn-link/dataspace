import { ref } from 'vue'

const visible = ref(false)

/** 首次登录引导已展示（关闭弹框后写入） */
export const MY_DATASETS_INTRO_KEY = 'tds_my_datasets_intro_v1'

/** 分享页扫码绑定成功后，跳转主页需打开数据集弹框 */
export const MY_DATASETS_OPEN_AFTER_BIND_KEY = 'tds_open_my_datasets_after_bind'

export function useMyDatasetsModal() {
  function open() {
    visible.value = true
  }

  function close() {
    visible.value = false
  }

  function hasSeenIntro(): boolean {
    return localStorage.getItem(MY_DATASETS_INTRO_KEY) === '1'
  }

  function markIntroSeen() {
    localStorage.setItem(MY_DATASETS_INTRO_KEY, '1')
  }

  /** 首次登录且已有 uid 时自动打开（仅一次） */
  function tryOpenOnFirstLogin(uid?: string) {
    if (!uid || hasSeenIntro() || visible.value) return
    open()
  }

  /** 分享页 bindUser 成功并跳转主页前调用 */
  function markOpenAfterBind() {
    sessionStorage.setItem(MY_DATASETS_OPEN_AFTER_BIND_KEY, '1')
  }

  /** 消费待打开标记并弹出（不受首次引导限制） */
  function tryOpenAfterBind(uid?: string) {
    if (!uid || sessionStorage.getItem(MY_DATASETS_OPEN_AFTER_BIND_KEY) !== '1') return false
    sessionStorage.removeItem(MY_DATASETS_OPEN_AFTER_BIND_KEY)
    open()
    return true
  }

  /** 登录后：优先处理分享页绑定跳转，否则首次登录引导 */
  function tryOpenAfterLogin(uid?: string) {
    if (!uid || visible.value) return
    if (tryOpenAfterBind(uid)) return
    tryOpenOnFirstLogin(uid)
  }

  return {
    visible,
    open,
    close,
    hasSeenIntro,
    markIntroSeen,
    tryOpenOnFirstLogin,
    markOpenAfterBind,
    tryOpenAfterBind,
    tryOpenAfterLogin
  }
}
