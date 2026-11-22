<template>
  <label class="auth-field">
    <span v-if="label" class="auth-field__label">
      {{ label }}
      <span v-if="required" class="auth-field__required" aria-hidden="true">*</span>
    </span>
    <div
      class="auth-field__wrap"
      :class="{
        'auth-field__wrap--focus': focused,
        'auth-field__wrap--error': !!error
      }"
    >
      <iconify-icon v-if="icon" class="auth-field__icon" :icon="icon" aria-hidden="true" />
      <slot>
        <input
          :type="type"
          class="auth-field__input"
          :placeholder="placeholder"
          :value="modelValue"
          :autocomplete="autocomplete"
          :disabled="disabled"
          :required="required"
          :maxlength="maxlength"
          :aria-invalid="error ? 'true' : undefined"
          @input="onInput"
          @focus="focused = true"
          @blur="onBlur"
        />
      </slot>
    </div>
    <p v-if="error" class="auth-field__error">{{ error }}</p>
  </label>
</template>

<script setup lang="ts">
import { ref } from 'vue'

withDefaults(
  defineProps<{
    modelValue?: string
    label?: string
    placeholder?: string
    icon?: string
    type?: string
    autocomplete?: string
    disabled?: boolean
    required?: boolean
    error?: string
    maxlength?: number | string
  }>(),
  {
    modelValue: '',
    type: 'text',
    autocomplete: 'off',
    disabled: false,
    required: false,
    error: ''
  }
)

const emit = defineEmits<{
  'update:modelValue': [value: string]
  blur: []
}>()

const focused = ref(false)

function onInput(e: Event) {
  emit('update:modelValue', (e.target as HTMLInputElement).value)
}

function onBlur() {
  focused.value = false
  emit('blur')
}
</script>

<style scoped>
.auth-field {
  display: block;
}

.auth-field__label {
  display: block;
  margin-bottom: 0.35rem;
  font-size: 0.8125rem;
  font-weight: 600;
  color: var(--fs-text-secondary, #334155);
}

.auth-field__required {
  margin-left: 0.15rem;
  color: #dc2626;
}

.auth-field__wrap {
  display: flex;
  align-items: center;
  gap: 0.65rem;
  min-height: 3rem;
  padding: 0 1rem;
  border: 1px solid #dbeafe;
  border-radius: 999px;
  background: #f8fbff;
  transition:
    border-color var(--fs-duration, 200ms) ease,
    box-shadow var(--fs-duration, 200ms) ease,
    background var(--fs-duration, 200ms) ease;
}

.auth-field__wrap--focus {
  border-color: #60a5fa;
  background: #fff;
  box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.12);
}

.auth-field__wrap--error {
  border-color: #f87171;
  background: #fff;
  box-shadow: 0 0 0 3px rgba(220, 38, 38, 0.1);
}

.auth-field__wrap--error.auth-field__wrap--focus {
  border-color: #ef4444;
  box-shadow: 0 0 0 3px rgba(220, 38, 38, 0.14);
}

.auth-field__error {
  margin: 0.35rem 0 0 1rem;
  font-size: 0.75rem;
  line-height: 1.4;
  color: #dc2626;
}

.auth-field__icon {
  flex-shrink: 0;
  font-size: 1.125rem;
  color: #64748b;
}

.auth-field__input,
.auth-field__wrap :deep(select) {
  flex: 1;
  min-width: 0;
  border: none;
  background: transparent;
  font-size: 0.9375rem;
  color: var(--fs-text, #0f172a);
  outline: none;
}

.auth-field__input::placeholder {
  color: #94a3b8;
}

.auth-field__wrap :deep(select) {
  cursor: pointer;
  appearance: none;
}
</style>
