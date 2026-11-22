<template>
  <div ref="rootRef" class="auth-select">
    <span v-if="label" class="auth-select__label">
      {{ label }}
      <span v-if="required" class="auth-select__required" aria-hidden="true">*</span>
    </span>
    <button
      type="button"
      class="auth-select__trigger"
      :class="{
        'auth-select__trigger--open': open,
        'auth-select__trigger--focus': open,
        'auth-select__trigger--error': !!error
      }"
      :aria-expanded="open"
      aria-haspopup="listbox"
      :aria-invalid="error ? 'true' : undefined"
      @click="toggle"
      @blur="onBlur"
    >
      <iconify-icon v-if="icon" class="auth-select__icon" :icon="icon" aria-hidden="true" />
      <span class="auth-select__value" :class="{ 'auth-select__value--placeholder': !modelValue }">
        {{ modelValue || placeholder }}
      </span>
      <iconify-icon
        class="auth-select__chevron"
        :class="{ 'auth-select__chevron--open': open }"
        icon="mdi:chevron-down"
        aria-hidden="true"
      />
    </button>

    <Transition name="auth-select-drop">
      <div v-if="open" class="auth-select__panel" role="listbox">
        <button
          v-for="option in options"
          :key="option.value"
          type="button"
          role="option"
          class="auth-select__option"
          :class="{ 'auth-select__option--active': option.value === modelValue }"
          :aria-selected="option.value === modelValue"
          @mousedown.prevent
          @click="select(option.value)"
        >
          <span>{{ option.label }}</span>
          <iconify-icon
            v-if="option.value === modelValue"
            class="auth-select__check"
            icon="mdi:check"
            aria-hidden="true"
          />
        </button>
      </div>
    </Transition>
    <p v-if="error" class="auth-select__error">{{ error }}</p>
  </div>
</template>

<script setup lang="ts">
import { onMounted, onUnmounted, ref } from 'vue'

export type AuthSelectOption = {
  label: string
  value: string
}

withDefaults(
  defineProps<{
    modelValue: string
    options: AuthSelectOption[]
    label?: string
    placeholder?: string
    icon?: string
    required?: boolean
    error?: string
  }>(),
  {
    placeholder: '请选择',
    required: false,
    error: ''
  }
)

const emit = defineEmits<{
  'update:modelValue': [value: string]
  blur: []
}>()

const rootRef = ref<HTMLElement | null>(null)
const open = ref(false)

function toggle() {
  open.value = !open.value
}

function close() {
  open.value = false
}

function select(value: string) {
  emit('update:modelValue', value)
  close()
  emit('blur')
}

function onBlur() {
  emit('blur')
}

function onDocumentClick(e: MouseEvent) {
  if (!rootRef.value?.contains(e.target as Node)) {
    close()
  }
}

function onDocumentKeydown(e: KeyboardEvent) {
  if (e.key === 'Escape') {
    close()
  }
}

onMounted(() => {
  document.addEventListener('click', onDocumentClick)
  document.addEventListener('keydown', onDocumentKeydown)
})

onUnmounted(() => {
  document.removeEventListener('click', onDocumentClick)
  document.removeEventListener('keydown', onDocumentKeydown)
})
</script>

<style scoped>
.auth-select {
  position: relative;
  display: block;
}

.auth-select__label {
  display: block;
  margin-bottom: 0.35rem;
  font-size: 0.8125rem;
  font-weight: 600;
  color: var(--fs-text-secondary, #334155);
}

.auth-select__required {
  margin-left: 0.15rem;
  color: #dc2626;
}

.auth-select__trigger {
  display: flex;
  align-items: center;
  gap: 0.65rem;
  width: 100%;
  min-height: 3rem;
  padding: 0 1rem;
  border: 1px solid #dbeafe;
  border-radius: 999px;
  background: #f8fbff;
  cursor: pointer;
  text-align: left;
  transition:
    border-color var(--fs-duration, 200ms) ease,
    box-shadow var(--fs-duration, 200ms) ease,
    background var(--fs-duration, 200ms) ease;
}

.auth-select__trigger:hover {
  border-color: #bfdbfe;
  background: #fff;
}

.auth-select__trigger--focus,
.auth-select__trigger--open {
  border-color: #60a5fa;
  background: #fff;
  box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.12);
}

.auth-select__trigger--error {
  border-color: #f87171;
  background: #fff;
  box-shadow: 0 0 0 3px rgba(220, 38, 38, 0.1);
}

.auth-select__error {
  margin: 0.35rem 0 0 1rem;
  font-size: 0.75rem;
  line-height: 1.4;
  color: #dc2626;
}

.auth-select__icon {
  flex-shrink: 0;
  font-size: 1.125rem;
  color: #64748b;
}

.auth-select__value {
  flex: 1;
  min-width: 0;
  font-size: 0.9375rem;
  color: var(--fs-text, #0f172a);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.auth-select__value--placeholder {
  color: #94a3b8;
}

.auth-select__chevron {
  flex-shrink: 0;
  font-size: 1.125rem;
  color: #64748b;
  transition: transform var(--fs-duration, 200ms) ease;
}

.auth-select__chevron--open {
  transform: rotate(180deg);
  color: #2563eb;
}

.auth-select__panel {
  position: absolute;
  top: calc(100% + 0.45rem);
  left: 0;
  right: 0;
  z-index: 30;
  padding: 0.35rem;
  border: 1px solid #dbeafe;
  border-radius: 1rem;
  background: #fff;
  box-shadow:
    0 10px 28px rgba(30, 64, 175, 0.12),
    0 4px 12px rgba(15, 23, 42, 0.06);
  overflow: hidden;
}

.auth-select__option {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.5rem;
  width: 100%;
  padding: 0.7rem 0.85rem;
  border: none;
  border-radius: 0.75rem;
  background: transparent;
  color: #334155;
  font-size: 0.9375rem;
  text-align: left;
  cursor: pointer;
  transition:
    background var(--fs-duration, 200ms) ease,
    color var(--fs-duration, 200ms) ease;
}

.auth-select__option:hover {
  background: #eff6ff;
  color: #1d4ed8;
}

.auth-select__option--active {
  background: linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%);
  color: #1d4ed8;
  font-weight: 700;
}

.auth-select__check {
  flex-shrink: 0;
  font-size: 1rem;
  color: #2563eb;
}

.auth-select-drop-enter-active,
.auth-select-drop-leave-active {
  transition:
    opacity 0.18s ease,
    transform 0.18s ease;
}

.auth-select-drop-enter-from,
.auth-select-drop-leave-to {
  opacity: 0;
  transform: translateY(-6px) scale(0.98);
}
</style>
