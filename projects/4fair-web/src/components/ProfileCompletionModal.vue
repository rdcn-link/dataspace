<template>
  <div v-if="modelValue" class="profile-modal-overlay">
    <div class="profile-modal" role="dialog" aria-modal="true" aria-labelledby="profile-modal-title" @click.stop>
      <button type="button" class="profile-modal__close" aria-label="关闭" @click="close">
        <iconify-icon icon="mdi:close" />
      </button>

      <div class="profile-modal__head">
        <BrandLogo size="md" />
        <span class="profile-modal__brand">费尔空间</span>
      </div>

      <h2 id="profile-modal-title" class="profile-modal__title">完善用户信息</h2>
      <p class="profile-modal__subtitle">
        申请数据前请补充手机号、邮箱与真实姓名（仅校验格式）
      </p>

      <form class="profile-modal__form" novalidate @submit.prevent="handleSubmit">
        <AuthFormField
          v-model="form.phone"
          icon="mdi:cellphone"
          placeholder="请输入手机号"
          type="tel"
          autocomplete="tel"
          maxlength="11"
          required
          :error="fieldErrors.phone"
          @blur="touchField('phone')"
        />
        <AuthFormField
          v-model="form.email"
          icon="mdi:email-outline"
          placeholder="请输入邮箱"
          type="email"
          autocomplete="email"
          required
          :error="fieldErrors.email"
          @blur="touchField('email')"
        />
        <AuthFormField
          v-model="form.realName"
          icon="mdi:account-outline"
          placeholder="请输入真实姓名"
          autocomplete="off"
          required
          :error="fieldErrors.realName"
          @blur="touchField('realName')"
        />
        <AuthFormField
          v-model="form.field"
          icon="mdi:flask-outline"
          placeholder="研究领域（选填）"
          :error="fieldErrors.field"
          @blur="touchField('field')"
        />
        <AuthFormField
          v-model="form.orgName"
          icon="mdi:office-building-outline"
          placeholder="单位（选填）"
          :error="fieldErrors.orgName"
          @blur="touchField('orgName')"
        />

        <p v-if="errorMessage" class="profile-modal__message profile-modal__message--error">
          <iconify-icon icon="mdi:alert-circle-outline" />
          {{ errorMessage }}
        </p>

        <button type="submit" class="profile-modal__submit" :disabled="submitting">
          <iconify-icon v-if="submitting" class="animate-spin" icon="mdi:loading" />
          {{ submitting ? '提交中…' : '完成' }}
        </button>
      </form>
    </div>
  </div>
</template>

<script setup lang="ts">
import { reactive, ref, watch } from 'vue'
import BrandLogo from '@/components/BrandLogo.vue'
import AuthFormField from '@/components/AuthFormField.vue'
import { updateUserProfile } from '@/utils/accountAuth'
import { useAuthStore } from '@/stores/auth'

type FormField = 'phone' | 'email' | 'realName' | 'field' | 'orgName'
const requiredFields: FormField[] = ['phone', 'email', 'realName']
const formFields: FormField[] = ['phone', 'email', 'realName', 'field', 'orgName']

const props = defineProps<{
  modelValue: boolean
  initialPhone?: string
  initialEmail?: string
  initialRealName?: string
  initialField?: string
  initialOrgName?: string
}>()

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  completed: []
}>()

const authStore = useAuthStore()

const form = reactive({
  phone: '',
  email: '',
  realName: '',
  field: '',
  orgName: ''
})

const fieldErrors = reactive<Record<FormField, string>>({
  phone: '',
  email: '',
  realName: '',
  field: '',
  orgName: ''
})

const touched = reactive<Record<FormField, boolean>>({
  phone: false,
  email: false,
  realName: false,
  field: false,
  orgName: false
})

const submitting = ref(false)
const errorMessage = ref('')
const submitted = ref(false)

watch(
  () => props.modelValue,
  (open) => {
    if (!open) return
    errorMessage.value = ''
    submitted.value = false
    formFields.forEach((field) => {
      touched[field] = false
      fieldErrors[field] = ''
    })
    form.phone = String(props.initialPhone || '').trim()
    form.email = String(props.initialEmail || '').trim()
    form.realName = String(props.initialRealName || '').trim()
    form.field = String(props.initialField || '').trim()
    form.orgName = String(props.initialOrgName || '').trim()
  },
  { immediate: true }
)

watch(
  form,
  () => {
    if (form.phone && !/^\d*$/.test(form.phone)) {
      form.phone = form.phone.replace(/\D/g, '').slice(0, 11)
    }
    formFields.forEach((field) => {
      if (touched[field]) fieldErrors[field] = validateField(field)
    })
    if (submitted.value) errorMessage.value = getFirstFieldError()
  },
  { deep: true }
)

function close() {
  emit('update:modelValue', false)
}

function validateField(field: FormField): string {
  switch (field) {
    case 'phone': {
      const phone = form.phone.trim()
      if (!phone) return '请输入手机号'
      if (!/^1\d{10}$/.test(phone)) return '请输入 11 位手机号'
      return ''
    }
    case 'email': {
      const email = form.email.trim()
      if (!email) return '请输入邮箱'
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return '请输入正确的邮箱格式'
      return ''
    }
    case 'realName': {
      const name = form.realName.trim()
      if (!name) return '请输入真实姓名'
      if (name.length < 2 || name.length > 32) return '真实姓名长度为 2-32 个字符'
      return ''
    }
    case 'field':
    case 'orgName':
      return ''
    default:
      return ''
  }
}

function getFirstFieldError(): string {
  for (const field of requiredFields) {
    const message = fieldErrors[field]
    if (message) return message
  }
  return ''
}

function touchField(field: FormField) {
  touched[field] = true
  fieldErrors[field] = validateField(field)
  if (submitted.value) errorMessage.value = getFirstFieldError()
}

function validateForm(): boolean {
  submitted.value = true
  requiredFields.forEach((field) => {
    touched[field] = true
    fieldErrors[field] = validateField(field)
  })
  errorMessage.value = getFirstFieldError()
  return !errorMessage.value
}

async function handleSubmit() {
  errorMessage.value = ''
  if (!validateForm()) return

  const openId = authStore.user?.openId
  const uid = String(authStore.user?.uid || '').trim()
  if (!openId) {
    errorMessage.value = '登录状态已失效，请重新登录'
    return
  }

  submitting.value = true
  try {
    const email = form.email.trim()
    const realName = form.realName.trim()
    const result = await updateUserProfile({
      openId,
      uid: uid || undefined,
      username: email,
      email,
      phone: form.phone.trim(),
      name: realName,
      nickName: realName,
      field: form.field.trim(),
      orgName: form.orgName.trim(),
      address: ''
    })
    authStore.applyAccountAuth({
      ...result,
      username: result.username || email,
      name: result.name || realName,
      phone: result.phone || form.phone.trim()
    })
    if (authStore.user) {
      authStore.user.openId = openId
      authStore.setUser({ ...authStore.user, openId })
    }
    await authStore.fetchUserInfo(openId)
    close()
    emit('completed')
  } catch (e: unknown) {
    errorMessage.value = e instanceof Error ? e.message : '提交失败，请稍后重试'
  } finally {
    submitting.value = false
  }
}
</script>

<style scoped>
.profile-modal-overlay {
  position: fixed;
  inset: 0;
  z-index: 120;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1rem;
  background: rgba(15, 23, 42, 0.45);
  backdrop-filter: blur(4px);
}

.profile-modal {
  position: relative;
  width: min(100%, 34rem);
  max-height: min(92vh, 720px);
  overflow: auto;
  padding: 1.75rem 1.75rem 1.25rem;
  border-radius: 1.25rem;
  background: #fff;
  border: 1px solid #e2e8f0;
  box-shadow: 0 24px 60px rgba(15, 23, 42, 0.18);
}

.profile-modal__close {
  position: absolute;
  top: 0.85rem;
  right: 0.85rem;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 2rem;
  height: 2rem;
  border: none;
  border-radius: 999px;
  background: transparent;
  color: #94a3b8;
  cursor: pointer;
}

.profile-modal__close:hover {
  background: #f1f5f9;
  color: #64748b;
}

.profile-modal__head {
  display: flex;
  align-items: center;
  gap: 0.55rem;
  margin-bottom: 1rem;
}

.profile-modal__brand {
  font-size: 1rem;
  font-weight: 800;
  color: #0f172a;
}

.profile-modal__title {
  margin: 0 0 0.35rem;
  text-align: center;
  font-size: 1.5rem;
  font-weight: 800;
  color: #0f172a;
}

.profile-modal__subtitle {
  margin: 0 0 1rem;
  text-align: center;
  font-size: 0.8125rem;
  color: #64748b;
  line-height: 1.55;
}

.profile-modal__form {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.profile-modal__message {
  display: flex;
  align-items: center;
  gap: 0.35rem;
  font-size: 0.8125rem;
}

.profile-modal__message--error {
  color: #dc2626;
}

.profile-modal__submit {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.35rem;
  width: 100%;
  min-height: 2.75rem;
  margin-top: 0.25rem;
  border: none;
  border-radius: 999px;
  background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%);
  color: #fff;
  font-size: 0.9375rem;
  font-weight: 700;
  cursor: pointer;
}

.profile-modal__submit:disabled {
  opacity: 0.72;
  cursor: not-allowed;
}

.animate-spin {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}
</style>
