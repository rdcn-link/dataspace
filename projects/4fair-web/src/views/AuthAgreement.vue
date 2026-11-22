<template>
  <div class="auth-agreement-page bg-slate-50 min-h-screen">
    <header class="bg-white border-b border-slate-200 h-16 sticky top-0 z-40">
      <div class="max-w-7xl mx-auto px-6 h-full flex items-center justify-between">
        <div class="flex items-center gap-2 cursor-pointer" @click="router.push('/')">
          <BrandLogo size="sm" />
          <span class="text-lg font-bold text-slate-800">费尔空间</span>
        </div>
      </div>
    </header>

    <main class="max-w-4xl mx-auto px-6 py-10">
      <div class="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div class="p-8 border-b border-slate-100">
          <h1 class="text-2xl font-bold text-slate-800">服务协议与隐私政策</h1>
        </div>

        <div class="p-8 space-y-8 max-h-[60vh] overflow-y-auto">
          <section>
            <h2 class="text-xl font-bold text-slate-900 mb-4">一、服务协议</h2>
            <div class="prose prose-slate max-w-none">
              <p class="text-slate-600 leading-relaxed">欢迎使用费尔空间数据协作平台。本协议是您与费尔空间之间关于使用本平台服务所达成的协议。</p>
              <h3 class="text-lg font-bold text-slate-800 mt-4 mb-2">1. 服务内容</h3>
              <p class="text-slate-600">费尔空间提供科研数据的存储、管理、共享和协作服务，包括但不限于数据上传、数据检索、数据分析等功能。</p>
              <h3 class="text-lg font-bold text-slate-800 mt-4 mb-2">2. 用户义务</h3>
              <p class="text-slate-600">用户应遵守相关法律法规，不得利用本平台从事违法活动，应保护账户安全，不得分享他人账户信息。</p>
            </div>
          </section>

          <section>
            <h2 class="text-xl font-bold text-slate-900 mb-4">二、隐私政策</h2>
            <div class="prose prose-slate max-w-none">
              <p class="text-slate-600 leading-relaxed">我们非常重视您的隐私保护。本隐私政策说明了我们如何收集、使用、存储和保护您的个人信息。</p>
              <h3 class="text-lg font-bold text-slate-800 mt-4 mb-2">1. 信息收集</h3>
              <p class="text-slate-600">我们收集的信息包括注册信息（姓名、邮箱、机构）、使用数据（访问记录、操作日志）等。</p>
              <h3 class="text-lg font-bold text-slate-800 mt-4 mb-2">2. 信息使用</h3>
              <p class="text-slate-600">我们使用收集的信息来提供服务、改进功能、发送通知以及进行安全防护。</p>
            </div>
          </section>
        </div>

        <div class="p-8 border-t border-slate-100 bg-slate-50">
          <label class="flex items-center gap-2 mb-4">
            <input v-model="agreed" type="checkbox" class="rounded text-blue-600"/>
            <span class="text-sm text-slate-700">我已阅读并同意上述服务协议和隐私政策</span>
          </label>
          <button
            @click="handleAgree"
            :disabled="!agreed"
            class="w-full bg-blue-600 text-white py-3 rounded-xl font-bold shadow-lg shadow-blue-200 hover:bg-blue-700 hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            同意并继续
          </button>
        </div>
      </div>
    </main>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import BrandLogo from '@/components/BrandLogo.vue'

const router = useRouter()
const agreed = ref(false)

const handleAgree = () => {
  if (agreed.value) {
    router.back()
  }
}
</script>

<style scoped>
.auth-agreement-page {
  }
</style>
