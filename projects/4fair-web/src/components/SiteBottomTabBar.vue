<template>
  <nav class="site-bottom-tabs md:hidden" aria-label="主导航">
    <button
      v-for="item in items"
      :key="item.key"
      type="button"
      class="site-bottom-tabs__item"
      :class="{ 'site-bottom-tabs__item--active': item.active }"
      @click="item.onClick()"
    >
      <iconify-icon :icon="item.icon" class="site-bottom-tabs__icon" aria-hidden="true"></iconify-icon>
      <span class="site-bottom-tabs__label">{{ item.label }}</span>
    </button>
  </nav>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { goLogin } from '@/utils/loginRedirect'
import { isMobileBrowser, isWeChatBrowser } from '@/utils/wechatOAuth'

const props = withDefaults(
  defineProps<{
    active?: 'headlines' | 'assets' | 'hubs' | ''
    preferLoginModal?: boolean
  }>(),
  {
    active: '',
    preferLoginModal: false
  }
)

const emit = defineEmits<{
  needLogin: []
}>()

const router = useRouter()
const route = useRoute()
const authStore = useAuthStore()

const profileActive = computed(
  () => route.path === '/profile' || route.path.startsWith('/profile/')
)

/** 服务速递暂不开放，不在底部导航展示 */
const items = computed(() => [
  {
    key: 'headlines',
    label: '头条资讯',
    icon: 'mdi:newspaper-variant-outline',
    active: props.active === 'headlines',
    onClick: () => go('/headlines')
  },
  {
    key: 'assets',
    label: '数据目录',
    icon: 'mdi:database-outline',
    active: props.active === 'assets',
    onClick: () => go('/assets')
  },
  {
    key: 'hubs',
    label: '空间枢纽',
    icon: 'mdi:hub-outline',
    active: props.active === 'hubs',
    onClick: () => go('/spatial-hubs')
  },
  {
    key: 'profile',
    label: '用户中心',
    icon: 'mdi:account-circle-outline',
    active: profileActive.value,
    onClick: openPersonalSpace
  }
])

/**
 * 底部 Tab 仅移动端展示。手机非微信 → 进 /login 引导；PC 不拦截。
 */
function go(to: string) {
  if (isMobileBrowser() && !isWeChatBrowser()) {
    void goLogin(router, to)
    return
  }
  if (router.currentRoute.value.path === to) return
  router.push(to)
}

function openPersonalSpace() {
  if (isMobileBrowser() && !isWeChatBrowser()) {
    void goLogin(router, '/profile')
    return
  }
  if (authStore.isLoggedIn) {
    void router.push('/profile')
    return
  }
  if (props.preferLoginModal) {
    emit('needLogin')
    return
  }
  void goLogin(router, '/profile')
}
</script>

<style scoped>
.site-bottom-tabs {
  position: fixed;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 50;
  display: flex;
  align-items: stretch;
  justify-content: space-around;
  gap: 0.2rem;
  min-height: 3.5rem;
  padding: 0.4rem 0.4rem calc(0.4rem + env(safe-area-inset-bottom, 0px));
  background: rgba(255, 255, 255, 0.97);
  backdrop-filter: blur(16px);
  border-top: 1px solid rgba(226, 232, 240, 0.95);
  box-shadow: 0 -6px 20px rgba(15, 23, 42, 0.06);
}

/* Scoped display:flex overrides Tailwind md:hidden — hide on desktop explicitly */
@media (min-width: 768px) {
  .site-bottom-tabs {
    display: none;
  }
}

.site-bottom-tabs__item {
  flex: 1 1 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 0.12rem;
  min-width: 0;
  padding: 0.35rem 0.15rem;
  border: none;
  border-radius: 0.65rem;
  background: transparent;
  color: #64748b;
  cursor: pointer;
  transition: color 0.15s, background 0.15s;
}

.site-bottom-tabs__item:active {
  background: rgba(241, 245, 249, 0.9);
}

.site-bottom-tabs__item--active {
  color: #2563eb;
  background: rgba(37, 99, 235, 0.08);
}

.site-bottom-tabs__icon {
  font-size: 1.3rem;
  line-height: 1;
}

.site-bottom-tabs__label {
  font-size: 0.6875rem;
  font-weight: 700;
  line-height: 1.2;
  white-space: nowrap;
}
</style>
