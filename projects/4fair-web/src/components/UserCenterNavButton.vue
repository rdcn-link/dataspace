<script setup lang="ts">
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { goLogin } from '@/utils/loginRedirect'

const props = withDefaults(
  defineProps<{
    /** 当前在个人中心页时高亮 */
    active?: boolean
    /** 未登录时触发登录弹窗，而非跳转登录页 */
    preferLoginModal?: boolean
  }>(),
  {
    active: false,
    preferLoginModal: false
  }
)

const emit = defineEmits<{
  needLogin: []
}>()

const router = useRouter()
const authStore = useAuthStore()

function handleClick() {
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

<template>
  <button
    type="button"
    class="p-2 rounded-lg transition-colors"
    :class="active ? 'bg-blue-50 text-blue-600' : 'hover:bg-slate-100 text-slate-600'"
    title="个人中心"
    aria-label="个人中心"
    @click="handleClick"
  >
    <iconify-icon icon="mdi:account-circle-outline" class="text-lg" />
  </button>
</template>
