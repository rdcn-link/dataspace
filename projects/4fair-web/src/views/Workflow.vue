<template>
  <div class="workflow-page bg-slate-50 min-h-screen">
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
        <h1 class="text-2xl font-bold text-slate-800">工作流管理</h1>
        <button @click="createWorkflow" class="btn-gradient text-white font-bold py-2 px-6 rounded-xl transition-all">
          新建工作流
        </button>
      </div>

      <div class="space-y-4">
        <div v-for="workflow in workflows" :key="workflow.id" class="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden hover:shadow-lg transition-all">
          <div class="p-6">
            <div class="flex items-start justify-between">
              <div class="flex-1">
                <div class="flex items-center gap-2 mb-2">
                  <h3 class="font-bold text-slate-900">{{ workflow.name }}</h3>
                  <span :class="`px-2 py-0.5 text-xs font-bold rounded ${getStatusClass(workflow.status)}`">
                    {{ workflow.status }}
                  </span>
                </div>
                <p class="text-sm text-slate-600 mb-3">{{ workflow.description }}</p>
                <div class="flex items-center gap-6 text-xs text-slate-500">
                  <span>创建时间: {{ workflow.createdAt }}</span>
                  <span>运行次数: {{ workflow.runs }}</span>
                  <span>最后运行: {{ workflow.lastRun }}</span>
                </div>
              </div>
              <div class="flex gap-2">
                <button @click="runWorkflow(workflow.id)" class="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700">运行</button>
                <button @click="editWorkflow(workflow.id)" class="px-4 py-2 text-sm text-slate-600 hover:bg-slate-100 rounded-lg">编辑</button>
                <button @click="deleteWorkflow(workflow.id)" class="px-4 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg">删除</button>
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

const workflows = ref([
  { id: 1, name: '数据预处理流程', description: '自动进行数据清洗、格式转换和质量检查', status: '就绪', createdAt: '2026-03-15', runs: '45', lastRun: '2026-04-20' },
  { id: 2, name: '基因组分析流程', description: '从原始测序数据到变异检测的完整分析流程', status: '运行中', createdAt: '2026-03-20', runs: '23', lastRun: '2026-04-21' },
  { id: 3, name: '统计分析报告', description: '自动生成描述性统计和可视化图表', status: '已暂停', createdAt: '2026-04-01', runs: '12', lastRun: '2026-04-18' }
])

const getStatusClass = (status: string) => {
  const classes: Record<string, string> = {
    '就绪': 'bg-green-100 text-green-700',
    '运行中': 'bg-blue-100 text-blue-700',
    '已暂停': 'bg-yellow-100 text-yellow-700',
    '失败': 'bg-red-100 text-red-700'
  }
  return classes[status] || 'bg-slate-100 text-slate-700'
}

const createWorkflow = () => console.log('Creating workflow')
const runWorkflow = (id: number) => console.log('Running workflow:', id)
const editWorkflow = (id: number) => console.log('Editing workflow:', id)
const deleteWorkflow = (id: number) => console.log('Deleting workflow:', id)
</script>

<style scoped>
.workflow-page {
  }

.btn-gradient {
  background: linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%);
  transition: all 0.3s ease;
}

.btn-gradient:hover { opacity: 0.9; transform: scale(1.02); }
</style>
