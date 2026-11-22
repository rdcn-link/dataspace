<template>
  <span
    class="information-source-logo"
    :class="{ 'information-source-logo--fallback': showFallback }"
    :style="showFallback ? { background: fallbackBackground } : undefined"
  >
    <img
      v-if="!showFallback"
      :src="logoUrl"
      :alt="`${name} logo`"
      class="information-source-logo__img"
      loading="lazy"
      decoding="async"
      @error="onImageError"
    />
    <span v-else class="information-source-logo__initial" aria-hidden="true">{{ fallbackInitial }}</span>
  </span>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'

const props = defineProps<{
  name: string
  logoUrl: string
}>()

const showFallback = ref(false)

const fallbackInitial = computed(() => {
  const text = String(props.name || '').trim()
  if (!text) return '数'
  return text.replace(/^国家/, '').slice(0, 1) || '数'
})

const fallbackBackground = computed(() => {
  const palette = [
    'linear-gradient(135deg, #0ea5e9, #2563eb)',
    'linear-gradient(135deg, #10b981, #0d9488)',
    'linear-gradient(135deg, #8b5cf6, #6366f1)',
    'linear-gradient(135deg, #f59e0b, #ea580c)',
    'linear-gradient(135deg, #ec4899, #db2777)'
  ]
  let hash = 0
  for (const ch of props.name) {
    hash = (hash + ch.charCodeAt(0)) % 997
  }
  return palette[hash % palette.length]
})

function onImageError() {
  showFallback.value = true
}

watch(
  () => props.logoUrl,
  () => {
    showFallback.value = false
  }
)
</script>

<style scoped>
.information-source-logo {
  flex-shrink: 0;
  width: 2.5rem;
  height: 2.5rem;
  border-radius: 0.65rem;
  overflow: hidden;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  box-sizing: border-box;
}

.information-source-logo__img {
  width: 100%;
  height: 100%;
  object-fit: contain;
  display: block;
  background: #fff;
}

.information-source-logo--fallback {
  border: none;
}

.information-source-logo__initial {
  color: #fff;
  font-size: 1rem;
  font-weight: 800;
  line-height: 1;
}
</style>
