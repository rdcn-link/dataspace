<template>
  <div class="agent-mgmt-page bg-slate-50 min-h-screen">
    <header class="bg-white border-b border-slate-200 h-16 sticky top-0 z-40">
      <div class="max-w-7xl mx-auto px-6 h-full flex items-center justify-between">
        <div class="flex items-center gap-2 cursor-pointer" @click="router.push('/')">
          <BrandLogo size="sm" />
          <span class="text-lg font-bold text-slate-800">费尔空间</span>
        </div>
      </div>
    </header>

    <main class="max-w-7xl mx-auto px-6 py-10">
      <div class="flex items-center justify-between mb-6">
        <h1 class="text-2xl font-bold text-slate-800">智能体管理</h1>
        <button @click="createAgent" class="btn-gradient text-white font-bold py-2 px-6 rounded-xl transition-all">
          创建智能体
        </button>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div v-for="agent in agents" :key="agent.id" class="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden hover:shadow-lg transition-all">
          <div class="p-6">
            <div class="flex items-center gap-3 mb-4">
              <div class="w-12 h-12 bg-gradient-to-tr from-blue-500 to-indigo-500 rounded-xl flex items-center justify-center">
                <iconify-icon class="text-white text-2xl" :icon="agent.icon"></iconify-icon>
              </div>
              <div>
                <h3 class="font-bold text-slate-900">{{ agent.name }}</h3>
                <p class="text-xs text-slate-500">{{ agent.category }}</p>
              </div>
            </div>
            <p class="text-sm text-slate-600 mb-4 line-clamp-2">{{ agent.description }}</p>
            <div class="flex items-center justify-between pt-4 border-t border-slate-100">
              <span class="text-xs text-slate-500">调用次数: {{ agent.calls }}</span>
              <div class="flex gap-2">
                <button @click="editAgent(agent.id)" class="px-3 py-1.5 text-sm text-slate-600 hover:bg-slate-100 rounded-lg">编辑</button>
                <button @click="deleteAgent(agent.id)" class="px-3 py-1.5 text-sm text-red-600 hover:bg-red-50 rounded-lg">删除</button>
              </div>
            </div>
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

const router = useRouter()

const agents = ref([
  { id: 1, name: '数据分析助手', category: '数据处理', icon: 'mdi:chart-line', description: '自动进行数据清洗、统计分析和可视化生成', calls: '1,234' },
  { id: 2, name: '文献检索助手', category: '知识发现', icon: 'mdi:book-search', description: '智能检索相关学术文献并生成综述摘要', calls: '856' },
  { id: 3, name: '代码生成助手', category: '开发工具', icon: 'mdi:code-tags', description: '根据需求自动生成数据处理和分析代码', calls: '2,456' }
])

const createAgent = () => {
  console.log('Creating new agent')
}

const editAgent = (id: number) => {
  console.log('Editing agent:', id)
}

const deleteAgent = (id: number) => {
  console.log('Deleting agent:', id)
}
</script>

<style scoped>
.agent-mgmt-page {
  }

.btn-gradient {
  background: linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%);
  transition: all 0.3s ease;
}

.btn-gradient:hover {
  opacity: 0.9;
  transform: scale(1.02);
}
</style>
