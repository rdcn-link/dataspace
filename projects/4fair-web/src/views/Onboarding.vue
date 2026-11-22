<template>
  <div class="onboarding-page">
    <div class="bg-blob blob-1"></div>
    <div class="bg-blob blob-2"></div>

    <div class="onboarding-card">
      <div class="onboarding-card__head">
        <BrandLogo size="lg" />
        <span class="onboarding-card__brand">费尔空间</span>
      </div>

      <h1 class="onboarding-card__title">完善用户信息</h1>
      <p class="onboarding-card__subtitle">
        检测到您是新用户，请补充手机号、邮箱与用户姓名（仅校验格式；也可跳过继续使用）
      </p>

      <form class="onboarding-form" novalidate @submit.prevent="handleSubmit">
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
          v-model="form.nickName"
          icon="mdi:account-outline"
          placeholder="请输入用户姓名"
          required
          :error="fieldErrors.nickName"
          @blur="touchField('nickName')"
        />

        <p v-if="errorMessage" class="onboarding-message onboarding-message--error">
          <iconify-icon icon="mdi:alert-circle-outline"></iconify-icon>
          {{ errorMessage }}
        </p>

        <button type="submit" class="onboarding-submit" :disabled="submitting">
          <iconify-icon v-if="submitting" class="animate-spin" icon="mdi:loading"></iconify-icon>
          {{ submitting ? '提交中…' : '完成并继续' }}
        </button>

        <button type="button" class="onboarding-skip" :disabled="submitting" @click="handleSkip">
          暂时跳过，继续使用
        </button>
      </form>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, reactive, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import BrandLogo from '@/components/BrandLogo.vue'
import AuthFormField from '@/components/AuthFormField.vue'
import { completeWechatProfile } from '@/utils/accountAuth'
import { useAuthStore } from '@/stores/auth'
import { resolvePostLoginPath, navigateAfterOnboarding } from '@/utils/loginRedirect'

const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()

type FormField = 'phone' | 'email' | 'nickName'

const formFields: FormField[] = ['phone', 'email', 'nickName']

const form = reactive({
  phone: '',
  email: '',
  nickName: ''
})

const fieldErrors = reactive<Record<FormField, string>>({
  phone: '',
  email: '',
  nickName: ''
})

const touched = reactive<Record<FormField, boolean>>({
  phone: false,
  email: false,
  nickName: false
})

const submitting = ref(false)
const errorMessage = ref('')
const submitted = ref(false)

watch(
  form,
  () => {
    if (form.phone && !/^\d*$/.test(form.phone)) {
      form.phone = form.phone.replace(/\D/g, '').slice(0, 11)
    }
    formFields.forEach((field) => {
      if (touched[field]) {
        fieldErrors[field] = validateField(field)
      }
    })
    if (submitted.value) {
      errorMessage.value = getFirstFieldError()
    }
  },
  { deep: true }
)

onMounted(() => {
  if (!authStore.isLoggedIn || !authStore.user?.openId) {
    void router.replace({ name: 'Login', query: route.query })
    return
  }
  if (!authStore.needsProfileCompletion()) {
    void router.replace(resolveRedirect())
    return
  }
  if (authStore.user?.loginName) {
    form.email = authStore.user.loginName
  }
  if (authStore.user?.nickname && authStore.user.nickname !== authStore.user.openId) {
    form.nickName = authStore.user.nickname
  }
  if (authStore.user?.phone) {
    form.phone = authStore.user.phone
  }
})

function resolveRedirect(): string {
  return resolvePostLoginPath(route.query.redirect, '/')
}

/** 仅格式校验，不做真实性核验 */
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
    case 'nickName': {
      const name = form.nickName.trim()
      if (!name) return '请输入用户姓名'
      if (name.length < 2 || name.length > 32) return '用户姓名长度为 2-32 个字符'
      return ''
    }
    default:
      return ''
  }
}

function getFirstFieldError(): string {
  for (const field of formFields) {
    const message = fieldErrors[field]
    if (message) return message
  }
  return ''
}

function touchField(field: FormField) {
  touched[field] = true
  fieldErrors[field] = validateField(field)
  if (submitted.value) {
    errorMessage.value = getFirstFieldError()
  }
}

function validateForm(): boolean {
  submitted.value = true
  formFields.forEach((field) => {
    touched[field] = true
    fieldErrors[field] = validateField(field)
  })
  errorMessage.value = getFirstFieldError()
  return !errorMessage.value
}

async function handleSkip() {
  authStore.markProfileComplete()
  await navigateAfterOnboarding(router, resolveRedirect())
}

async function handleSubmit() {
  errorMessage.value = ''
  if (!validateForm()) return

  const openId = authStore.user?.openId
  if (!openId) {
    errorMessage.value = '登录状态已失效，请重新登录'
    return
  }

  submitting.value = true
  try {
    const result = await completeWechatProfile({
      openId,
      email: form.email.trim(),
      phone: form.phone.trim(),
      nickName: form.nickName.trim()
    })
    authStore.applyAccountAuth({
      ...result,
      username: result.username || form.email.trim(),
      name: result.name || form.nickName.trim(),
      phone: result.phone || form.phone.trim()
    })
    // 保留微信 openId，避免被 applyAccountAuth 覆盖后丢失
    if (authStore.user) {
      authStore.user.openId = openId
      authStore.setUser({ ...authStore.user, openId })
    }
    await authStore.fetchUserInfo(openId)
    authStore.markProfileComplete()
    await navigateAfterOnboarding(router, resolveRedirect())
  } catch (e: unknown) {
    errorMessage.value = e instanceof Error ? e.message : '提交失败，请稍后重试'
  } finally {
    submitting.value = false
  }
}
</script>

<style scoped>
.onboarding-page {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 2rem 1rem;
  position: relative;
  overflow: visible;
  background: linear-gradient(135deg, #f8fafc 0%, #eff6ff 50%, #f5f3ff 100%);
}

.onboarding-card {
  width: min(100%, 34rem);
  padding: 2rem 2rem 1.5rem;
  border-radius: 1.5rem;
  background: rgba(255, 255, 255, 0.96);
  border: 1px solid #e2e8f0;
  box-shadow: 0 20px 50px rgba(30, 64, 175, 0.08);
}

.onboarding-card__head {
  display: flex;
  align-items: center;
  gap: 0.65rem;
  margin-bottom: 1.25rem;
}

.onboarding-card__brand {
  font-size: 1.125rem;
  font-weight: 800;
  color: #0f172a;
}

.onboarding-card__title {
  margin: 0 0 0.35rem;
  text-align: center;
  font-size: 1.75rem;
  font-weight: 800;
  color: #0f172a;
}

.onboarding-card__subtitle {
  margin: 0 0 1.25rem;
  text-align: center;
  font-size: 0.875rem;
  color: #64748b;
  line-height: 1.55;
}

.onboarding-form {
  display: flex;
  flex-direction: column;
  gap: 0.85rem;
}

.onboarding-message {
  display: flex;
  align-items: center;
  gap: 0.35rem;
  font-size: 0.8125rem;
}

.onboarding-message--error {
  color: #dc2626;
}

.onboarding-submit {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.35rem;
  width: 100%;
  min-height: 3rem;
  margin-top: 0.35rem;
  border: none;
  border-radius: 999px;
  background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%);
  color: #fff;
  font-size: 1rem;
  font-weight: 700;
  cursor: pointer;
  box-shadow: 0 8px 20px rgba(37, 99, 235, 0.28);
}

.onboarding-submit:disabled {
  opacity: 0.72;
  cursor: not-allowed;
}

.onboarding-skip {
  width: 100%;
  min-height: 2.75rem;
  border: none;
  background: transparent;
  color: #64748b;
  font-size: 0.875rem;
  font-weight: 600;
  cursor: pointer;
}

.onboarding-skip:hover:not(:disabled) {
  color: #2563eb;
}

.onboarding-skip:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.bg-blob {
  position: fixed;
  width: 500px;
  height: 500px;
  background: radial-gradient(circle, rgba(59, 130, 246, 0.08) 0%, rgba(139, 92, 246, 0.05) 50%, rgba(255, 255, 255, 0) 100%);
  border-radius: 50%;
  z-index: -1;
  filter: blur(60px);
  pointer-events: none;
}

.blob-1 {
  top: -100px;
  right: -100px;
}

.blob-2 {
  bottom: -100px;
  left: -100px;
}

.animate-spin {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}
</style>
