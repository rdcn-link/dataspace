<template>
  <button
    type="button"
    class="data-seek-btn"
    :class="{ 'data-seek-btn--lg': size === 'lg' }"
    :disabled="disabled"
    :title="disabled ? '数据智能探查功能即将上线' : '数据智能探查'"
  >
    <img
      class="data-seek-btn__icon"
      src="/images/analysis-tools/d9380dd23e9d6a7135057e9b926b8e75.png"
      alt=""
      :width="size === 'lg' ? 22 : 18"
      :height="size === 'lg' ? 22 : 18"
    />
    <span>数据智能探查</span>
  </button>
</template>

<script setup lang="ts">
withDefaults(
  defineProps<{
    disabled?: boolean
    size?: 'md' | 'lg'
  }>(),
  {
    disabled: false,
    size: 'md'
  }
)
</script>

<style scoped>
.data-seek-btn {
  flex-shrink: 0;
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  height: 1.9rem;
  padding: 0 0.7rem 0 0.4rem;
  border: 1px solid #bfdbfe;
  border-radius: 999px;
  background: #eff6ff;
  color: #1d4ed8;
  font-size: 0.75rem;
  font-weight: 700;
  line-height: 1;
  cursor: pointer;
  transition: background 0.15s, border-color 0.15s, color 0.15s;
}

.data-seek-btn--lg {
  height: 2.45rem;
  gap: 0.45rem;
  padding: 0 1.05rem 0 0.55rem;
  font-size: 0.875rem;
  border-radius: 999px;
}

.data-seek-btn--lg .data-seek-btn__icon {
  width: 1.4rem;
  height: 1.4rem;
  border-radius: 0.35rem;
}

.data-seek-btn:hover:not(:disabled) {
  background: #dbeafe;
  border-color: #93c5fd;
  color: #1e40af;
}

.data-seek-btn:disabled {
  opacity: 0.45;
  cursor: not-allowed;
  border-color: #e2e8f0;
  background: #f8fafc;
  color: #94a3b8;
}

.data-seek-btn:disabled .data-seek-btn__icon {
  filter: grayscale(1);
  opacity: 0.75;
}

.data-seek-btn__icon {
  width: 1.15rem;
  height: 1.15rem;
  border-radius: 0.28rem;
  object-fit: cover;
  flex-shrink: 0;
}
</style>
