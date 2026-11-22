<template>
  <div class="detail-page bg-slate-50 min-h-screen">
    <nav class="glass-nav fixed top-0 w-full z-50">
      <div class="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
        <div class="flex items-center space-x-2 group cursor-pointer" @click="router.push('/home')">
          <BrandLogo size="lg" interactive />
          <span class="text-xl font-bold tracking-tight text-slate-900">费尔空间</span>
        </div>
        <div class="hidden md:flex items-center space-x-8 text-base font-bold text-slate-600">
          <a @click="router.push('/headlines')" class="hover:text-blue-600 transition-colors cursor-pointer">头条资讯</a>
          <a @click="router.push('/assets')" class="hover:text-blue-600 transition-colors cursor-pointer">数据目录</a>
          <a @click="router.push('/spatial-hubs')" class="hover:text-blue-600 transition-colors cursor-pointer">空间枢纽</a>
        </div>
        <div class="flex items-center space-x-4">
          <button @click="goToLogin" class="btn-gradient text-white font-bold py-2 px-5 rounded-xl transition-all text-sm">
            登录
          </button>
        </div>
      </div>
    </nav>

    <main class="max-w-4xl mx-auto px-6 pt-16 pb-10">
      <div class="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div class="p-8">
          <h1 class="text-2xl font-bold text-slate-900 mb-4">{{ detail.title }}</h1>
          <p class="text-slate-600 leading-relaxed mb-6">{{ detail.description }}</p>

          <div class="space-y-6">
            <section v-for="(section, idx) in detail.sections" :key="idx">
              <h2 class="text-lg font-bold text-slate-900 mb-3">{{ section.title }}</h2>
              <p class="text-slate-600">{{ section.content }}</p>
            </section>
          </div>

          <div class="mt-8 pt-6 border-t border-slate-100 flex gap-4">
            <button @click="goBack" class="px-6 py-2 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors">返回</button>
            <button @click="takeAction" class="btn-gradient text-white px-6 py-2 rounded-lg transition-all">执行操作</button>
          </div>
        </div>
      </div>
    </main>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import BrandLogo from '@/components/BrandLogo.vue'
import { goLogin } from '@/utils/loginRedirect'

const router = useRouter()

function goToLogin() {
  void goLogin(router, router.currentRoute.value.fullPath)
}

const detail = ref({
  title: '详情页面',
  description: '这是详细信息页面，展示完整的内容描述。',
  sections: [
    { title: '概述', content: '这里是概述内容...' },
    { title: '详细信息', content: '这里是详细信息内容...' },
    { title: '相关说明', content: '这里是相关说明内容...' }
  ]
})

const goBack = () => router.back()
const takeAction = () => console.log('Taking action')
</script>

<style scoped>
.detail-page {  }
.btn-gradient {
  background: linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%);
  transition: all 0.3s ease;
}
.btn-gradient:hover { opacity: 0.9; transform: scale(1.02); }
</style>
