<template>
  <img
    :src="logoUrl"
    alt="费尔空间"
    class="brand-logo"
    :class="[sizeClass, { 'brand-logo--interactive': interactive }]"
  />
</template>

<script setup lang="ts">
import { computed } from 'vue'
import logoUrl from '@/assets/img/fairspace-logo.png'

const props = withDefaults(
  defineProps<{
    size?: 'sm' | 'md' | 'lg'
    interactive?: boolean
  }>(),
  {
    size: 'md',
    interactive: false
  }
)

const sizeClass = computed(() => {
  const map = {
    sm: 'brand-logo--sm',
    md: 'brand-logo--md',
    lg: 'brand-logo--lg'
  } as const
  return map[props.size]
})
</script>

<style scoped>
.brand-logo {
  display: block;
  object-fit: cover;
  flex-shrink: 0;
  border-radius: 0.75rem;
}

.brand-logo--sm {
  width: 2rem;
  height: 2rem;
}

.brand-logo--md {
  width: 2.25rem;
  height: 2.25rem;
}

.brand-logo--lg {
  width: 2.5rem;
  height: 2.5rem;
}

.brand-logo--interactive {
  box-shadow: 0 4px 14px rgba(37, 99, 235, 0.22);
  transition: transform var(--fs-duration, 200ms) var(--fs-ease, ease);
}

.brand-logo--interactive:hover {
  transform: scale(1.08);
}
</style>
