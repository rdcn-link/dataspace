<template>
  <div class="register-page">
    <div class="bg-blob blob-1"></div>
    <div class="bg-blob blob-2"></div>

    <div class="register-card">
      <div class="register-card__head">
        <BrandLogo size="lg" />
        <span class="register-card__brand">费尔空间</span>
      </div>

      <h1 class="register-card__title">用户注册</h1>

      <form class="register-form" @submit.prevent="handleSubmit">
        <AuthFormField
          v-model="form.username"
          icon="mdi:account-outline"
          placeholder="请输入邮箱账号"
          type="email"
          autocomplete="username"
        />
        <AuthFormField
          v-model="form.password"
          icon="mdi:lock-open-outline"
          placeholder="请输入密码"
          type="password"
          autocomplete="new-password"
        />
        <AuthFormField
          v-model="form.confirmPassword"
          icon="mdi:lock-outline"
          placeholder="请再次输入密码"
          type="password"
          autocomplete="new-password"
        />
        <AuthFormField
          v-model="form.name"
          icon="mdi:message-text-outline"
          placeholder="请输入您的真实姓名(中文)"
        />
        <AuthSelectField
          v-model="form.source"
          icon="mdi:briefcase-outline"
          placeholder="请选择机构类型"
          :options="orgTypeOptions"
        />
        <AuthFormField
          v-model="form.phone"
          icon="mdi:cellphone"
          placeholder="请输入11位手机号"
          type="tel"
          autocomplete="tel"
        />
        <AuthFormField
          v-model="form.affiliation"
          icon="mdi:bank-outline"
          placeholder="请输入真实单位名称"
        />
        <AuthFormField
          v-model="form.address"
          icon="mdi:map-marker-outline"
          placeholder="请输入单位通讯地址"
        />

        <label class="register-agreement">
          <input v-model="form.agreed" type="checkbox" class="register-agreement__check" />
          <span>
            我已阅读并接受
            <router-link to="/auth/agreement" class="register-link">《国家基础学科公共科学数据中心用户服务协议》</router-link>
          </span>
        </label>

        <p v-if="errorMessage" class="register-message register-message--error">
          <iconify-icon icon="mdi:alert-circle-outline"></iconify-icon>
          {{ errorMessage }}
        </p>
        <p v-if="successMessage" class="register-message register-message--success">
          <iconify-icon icon="mdi:check-circle-outline"></iconify-icon>
          {{ successMessage }}
        </p>

        <button type="submit" class="register-submit" :disabled="submitting">
          <iconify-icon v-if="submitting" class="animate-spin" icon="mdi:loading"></iconify-icon>
          {{ submitting ? '注册中…' : '注册' }}
        </button>
      </form>

      <p class="register-footer">
        已有帐号？
        <router-link :to="loginLink" class="register-link">立即登录</router-link>
      </p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, reactive, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import BrandLogo from '@/components/BrandLogo.vue'
import AuthFormField from '@/components/AuthFormField.vue'
import AuthSelectField from '@/components/AuthSelectField.vue'
import { registerAccount, type OrgType } from '@/utils/accountAuth'
import { useAuthStore } from '@/stores/auth'
import { resolvePostLoginPath } from '@/utils/loginRedirect'

const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()

const orgTypes: OrgType[] = ['科研院所', '高校', '政府机构', '企业', '其他']
const orgTypeOptions = orgTypes.map((item) => ({ label: item, value: item }))

const form = reactive({
  username: '',
  password: '',
  confirmPassword: '',
  name: '',
  source: '科研院所' as OrgType,
  phone: '',
  affiliation: '',
  address: '',
  agreed: false
})

const submitting = ref(false)
const errorMessage = ref('')
const successMessage = ref('')

const loginLink = computed(() => {
  const redirect = route.query.redirect
  if (typeof redirect === 'string' && redirect) {
    return { name: 'Login', query: { redirect } }
  }
  return { name: 'Login' }
})

function validateForm(): string | null {
  const email = form.username.trim()
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return '请输入有效的邮箱账号'
  }
  if (!/^(?=.*[A-Za-z])(?=.*\d).{8,}$/.test(form.password)) {
    return '密码至少 8 位，且包含字母和数字'
  }
  if (form.password !== form.confirmPassword) {
    return '两次输入的密码不一致'
  }
  if (!/^[\u4e00-\u9fa5·]{2,20}$/.test(form.name.trim())) {
    return '请输入有效的中文姓名'
  }
  if (!/^1\d{10}$/.test(form.phone.trim())) {
    return '请输入 11 位手机号'
  }
  if (!form.affiliation.trim()) {
    return '请输入单位名称'
  }
  if (!form.address.trim()) {
    return '请输入通讯地址'
  }
  if (!form.agreed) {
    return '请先阅读并同意用户服务协议'
  }
  return null
}

async function handleSubmit() {
  errorMessage.value = ''
  successMessage.value = ''

  const validationError = validateForm()
  if (validationError) {
    errorMessage.value = validationError
    return
  }

  submitting.value = true
  try {
    const result = await registerAccount({
      username: form.username.trim(),
      password: form.password,
      name: form.name.trim(),
      source: form.source,
      phone: form.phone.trim(),
      affiliation: form.affiliation.trim(),
      address: form.address.trim()
    })

    if (result.uid || result.token) {
      authStore.applyAccountAuth(result)
      await router.replace(resolvePostLoginPath(route.query.redirect, '/'))
      return
    }

    successMessage.value = '注册成功，请登录'
    setTimeout(() => {
      void router.push(loginLink.value)
    }, 900)
  } catch (e: unknown) {
    errorMessage.value = e instanceof Error ? e.message : '注册失败，请稍后重试'
  } finally {
    submitting.value = false
  }
}
</script>

<style scoped>
.register-page {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 2rem 1rem;
  position: relative;
  overflow: visible;
  background: linear-gradient(135deg, #f8fafc 0%, #eff6ff 50%, #f5f3ff 100%);
}

.register-card {
  width: min(100%, 34rem);
  padding: 2rem 2rem 1.5rem;
  border-radius: 1.5rem;
  background: rgba(255, 255, 255, 0.96);
  border: 1px solid #e2e8f0;
  box-shadow: 0 20px 50px rgba(30, 64, 175, 0.08);
  overflow: visible;
}

.register-card__head {
  display: flex;
  align-items: center;
  gap: 0.65rem;
  margin-bottom: 1.25rem;
}

.register-card__brand {
  font-size: 1.125rem;
  font-weight: 800;
  color: #0f172a;
}

.register-card__title {
  margin: 0 0 1.25rem;
  text-align: center;
  font-size: 1.75rem;
  font-weight: 800;
  color: #0f172a;
}

.register-form {
  display: flex;
  flex-direction: column;
  gap: 0.85rem;
}

.register-agreement {
  display: flex;
  align-items: flex-start;
  gap: 0.5rem;
  margin-top: 0.25rem;
  font-size: 0.8125rem;
  line-height: 1.6;
  color: #64748b;
}

.register-agreement__check {
  margin-top: 0.2rem;
  flex-shrink: 0;
}

.register-message {
  display: flex;
  align-items: center;
  gap: 0.35rem;
  font-size: 0.8125rem;
}

.register-message--error {
  color: #dc2626;
}

.register-message--success {
  color: #059669;
}

.register-submit {
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
  transition: opacity 0.2s ease, transform 0.2s ease;
}

.register-submit:hover:not(:disabled) {
  transform: translateY(-1px);
}

.register-submit:disabled {
  opacity: 0.72;
  cursor: not-allowed;
}

.register-footer {
  margin: 1.25rem 0 0;
  text-align: center;
  font-size: 0.875rem;
  color: #64748b;
}

.register-link {
  color: #2563eb;
  text-decoration: none;
}

.register-link:hover {
  text-decoration: underline;
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
</style>
