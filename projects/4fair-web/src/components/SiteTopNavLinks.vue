<template>
  <div class="hidden md:flex absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 items-center space-x-5 lg:space-x-8 text-base font-bold text-slate-600">
    <a
      v-for="item in items"
      :key="item.key"
      :class="
        active === item.key
          ? 'text-blue-600 border-b-2 border-blue-600 pb-0.5 cursor-pointer'
          : 'hover:text-blue-600 transition-colors cursor-pointer'
      "
      @click="router.push(item.path)"
    >
      {{ item.label }}
    </a>
  </div>
</template>

<script setup lang="ts">
import { useRouter } from 'vue-router'

withDefaults(
  defineProps<{
    active?: 'headlines' | 'assets' | 'hubs' | ''
  }>(),
  { active: '' }
)

const router = useRouter()

/** 服务速递暂不开放，不在导航展示 */
const items = [
  { key: 'headlines' as const, label: '头条资讯', path: '/headlines' },
  { key: 'assets' as const, label: '数据目录', path: '/assets' },
  { key: 'hubs' as const, label: '空间枢纽', path: '/spatial-hubs' }
]
</script>
