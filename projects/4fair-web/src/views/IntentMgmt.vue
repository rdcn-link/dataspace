<template>
  <div class="intent-mgmt-page bg-slate-50 min-h-screen">
    <header class="bg-white border-b border-slate-200 h-16 sticky top-0 z-40">
      <div class="max-w-7xl mx-auto px-6 h-full flex items-center justify-between">
        <div class="flex items-center gap-2 cursor-pointer" @click="router.push('/')">
          <BrandLogo size="sm" />
          <span class="text-lg font-bold text-slate-800">费尔空间</span>
        </div>
      </div>
    </header>

    <main class="max-w-7xl mx-auto px-6 py-10">
      <h1 class="text-2xl font-bold text-slate-800 mb-6">我的申请</h1>

      <div class="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div class="p-4 border-b border-slate-100 flex items-center justify-between">
          <div class="flex gap-2">
            <button
              v-for="tab in tabs"
              :key="tab.value"
              @click="activeTab = tab.value"
              :class="`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${activeTab === tab.value ? 'bg-blue-100 text-blue-700' : 'text-slate-600 hover:bg-slate-100'}`"
            >
              {{ tab.label }}
            </button>
          </div>
        </div>

        <div class="divide-y divide-slate-100">
          <div v-for="application in filteredApplications" :key="application.id" class="p-6 hover:bg-slate-50 transition-colors">
            <div class="flex items-start justify-between">
              <div class="flex-1">
                <div class="flex items-center gap-2 mb-2">
                  <h3 class="font-bold text-slate-900">{{ application.dataset }}</h3>
                  <span :class="`px-2 py-0.5 text-xs font-bold rounded ${getStatusClass(application.status)}`">
                    {{ application.status }}
                  </span>
                </div>
                <p class="text-sm text-slate-600 mb-2">{{ application.purpose }}</p>
                <div class="flex items-center gap-4 text-xs text-slate-500">
                  <span>申请时间: {{ application.createdAt }}</span>
                  <span>使用期限: {{ application.duration }}个月</span>
                </div>
              </div>
              <div class="flex gap-2">
                <button v-if="application.status === '待审批'" @click="withdraw(application.id)" class="px-4 py-2 text-sm text-slate-600 hover:bg-slate-100 rounded-lg transition-colors">
                  撤回
                </button>
                <button v-if="application.status === '已通过'" @click="viewData(application.id)" class="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                  查看数据
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import BrandLogo from '@/components/BrandLogo.vue'

const router = useRouter()
const activeTab = ref('all')

const tabs = [
  { label: '全部', value: 'all' },
  { label: '待审批', value: 'pending' },
  { label: '已通过', value: 'approved' },
  { label: '已拒绝', value: 'rejected' }
]

const applications = ref([
  {
    id: 1,
    dataset: '泛癌多组学整合分析数据库 (v3.0)',
    purpose: '用于肿瘤免疫治疗相关研究',
    status: '待审批',
    createdAt: '2026-04-15',
    duration: 12
  },
  {
    id: 2,
    dataset: '人类肠道微生物组多样性数据集',
    purpose: '肠道菌群与代谢疾病关联分析',
    status: '已通过',
    createdAt: '2026-04-10',
    duration: 6
  },
  {
    id: 3,
    dataset: '青藏高原地表径流长期监测数据集',
    purpose: '气候变化对水资源影响评估',
    status: '已拒绝',
    createdAt: '2026-04-05',
    duration: 3
  }
])

const filteredApplications = computed(() => {
  if (activeTab.value === 'all') return applications.value
  const statusMap: Record<string, string> = {
    pending: '待审批',
    approved: '已通过',
    rejected: '已拒绝'
  }
  return applications.value.filter(app => app.status === statusMap[activeTab.value])
})

const getStatusClass = (status: string) => {
  const classes: Record<string, string> = {
    '待审批': 'bg-yellow-100 text-yellow-700',
    '已通过': 'bg-green-100 text-green-700',
    '已拒绝': 'bg-red-100 text-red-700'
  }
  return classes[status] || 'bg-slate-100 text-slate-700'
}

const withdraw = (id: number) => {
  console.log('Withdrawing application:', id)
}

const viewData = (id: number) => {
  router.push(`/data/${id}`)
}
</script>

<style scoped>
.intent-mgmt-page {
  }
</style>
