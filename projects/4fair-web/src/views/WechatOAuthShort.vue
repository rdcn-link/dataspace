<template>
  <div class="min-h-screen flex items-center justify-center bg-slate-50">
    <iconify-icon class="text-3xl text-green-500 animate-spin" icon="mdi:loading"></iconify-icon>
    <p class="text-slate-500 text-sm mt-3">正在打开微信授权…</p>
  </div>
</template>

<script setup lang="ts">
import { onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'

const route = useRoute()
const router = useRouter()

onMounted(() => {
  const raw = route.params.state
  const state = typeof raw === 'string' ? raw : Array.isArray(raw) ? raw[0] : ''
  const intent =
    route.query.intent === 'login' ||
    (Array.isArray(route.query.intent) && route.query.intent[0] === 'login')
      ? 'login'
      : undefined
  const redirect =
    typeof route.query.redirect === 'string' && route.query.redirect
      ? route.query.redirect
      : undefined

  if (!state) {
    router.replace({ name: 'WechatScanLogin' })
    return
  }

  router.replace({
    name: 'WechatOAuth',
    query: {
      state,
      ...(intent ? { intent } : {}),
      ...(redirect ? { redirect } : {})
    }
  })
})
</script>
