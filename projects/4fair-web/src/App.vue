<template>
  <div id="app" class="fairspace-app">
    <OpenInWechatPrompt v-if="showOpenInWechat" :access-url="wechatAccessUrl" />
    <div v-show="!showOpenInWechat" class="fairspace-app__main">
      <router-view v-slot="{ Component, route: viewRoute }">
        <keep-alive :include="KEEP_ALIVE_VIEW_NAMES">
          <component
            :is="Component"
            :key="viewRoute.name === 'AssetDetail' ? viewRoute.fullPath : String(viewRoute.name ?? viewRoute.path)"
          />
        </keep-alive>
      </router-view>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import OpenInWechatPrompt from '@/components/OpenInWechatPrompt.vue'
import { KEEP_ALIVE_VIEW_NAMES, PUBLIC_ROUTE_NAMES, isPublicStaticAssetPath } from '@/router'
import { needsOpenInWechatPrompt } from '@/utils/mobileWechatGate'
import { getPublicSiteOrigin } from '@/utils/wechatOAuth'

const AUTH_USER_STORAGE_KEY = 'auth_user'

const authStore = useAuthStore()
const router = useRouter()
const route = useRoute()

/** 视口 / 旋转时重算移动端环境 */
const mobileEnvTick = ref(0)

const showOpenInWechat = computed(() => {
  void mobileEnvTick.value
  return needsOpenInWechatPrompt(route.name)
})

const wechatAccessUrl = computed(() => {
  const origin = getPublicSiteOrigin() || (typeof window !== 'undefined' ? window.location.origin : '')
  const redirect = route.fullPath && route.name !== 'Login' ? route.fullPath : '/'
  return `${origin}/login?redirect=${encodeURIComponent(redirect)}`
})

function refreshMobileEnv() {
  mobileEnvTick.value += 1
}

function onVisibilityChange() {
  if (document.visibilityState !== 'visible') return
  refreshMobileEnv()
  authStore.syncFromStorage()
  if (!authStore.isLoggedIn) {
    const current = router.currentRoute.value
    if (isPublicStaticAssetPath(current.path)) return
    const name = current.name as string
    if (name && !PUBLIC_ROUTE_NAMES.has(name)) {
      window.location.href = `/login?redirect=${encodeURIComponent(current.fullPath)}`
      return
    }
  }
  if (authStore.isLoggedIn && authStore.user?.openId) {
    void authStore.fetchUserInfo(authStore.user.openId)
  }
}

function onAuthStorageChange(event: StorageEvent) {
  if (
    event.key !== AUTH_USER_STORAGE_KEY &&
    event.key !== 'auth_token' &&
    event.key !== 'auth_session_login_day' &&
    event.key !== null
  ) {
    return
  }
  authStore.syncFromStorage()
}

let mediaQuery: MediaQueryList | null = null

onMounted(() => {
  document.addEventListener('visibilitychange', onVisibilityChange)
  window.addEventListener('storage', onAuthStorageChange)
  window.addEventListener('resize', refreshMobileEnv)
  window.addEventListener('orientationchange', refreshMobileEnv)
  try {
    mediaQuery = window.matchMedia('(max-width: 767px)')
    mediaQuery.addEventListener('change', refreshMobileEnv)
  } catch {
    /* ignore */
  }
  refreshMobileEnv()
  if (authStore.isLoggedIn && authStore.user?.openId) {
    void authStore.fetchUserInfo(authStore.user.openId)
  }
})

onUnmounted(() => {
  document.removeEventListener('visibilitychange', onVisibilityChange)
  window.removeEventListener('storage', onAuthStorageChange)
  window.removeEventListener('resize', refreshMobileEnv)
  window.removeEventListener('orientationchange', refreshMobileEnv)
  mediaQuery?.removeEventListener('change', refreshMobileEnv)
})
</script>
