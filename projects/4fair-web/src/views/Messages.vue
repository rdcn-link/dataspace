<template>
  <div class="messages-page bg-slate-50 min-h-screen">
    <header class="bg-white border-b border-slate-200 h-16 sticky top-0 z-40">
      <div class="max-w-7xl mx-auto px-6 h-full flex items-center justify-between">
        <div class="flex items-center gap-2 cursor-pointer" @click="router.push('/')">
          <BrandLogo size="sm" />
          <span class="text-lg font-bold text-slate-800">费尔空间</span>
        </div>
      </div>
    </header>

    <main class="max-w-4xl mx-auto px-6 py-10">
      <h1 class="text-2xl font-bold text-slate-800 mb-6">消息中心</h1>

      <div class="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div class="p-4 border-b border-slate-100 flex items-center justify-between">
          <div class="flex gap-2">
            <button v-for="tab in tabs" :key="tab.value" @click="activeTab = tab.value" :class="`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${activeTab === tab.value ? 'bg-blue-100 text-blue-700' : 'text-slate-600 hover:bg-slate-100'}`">
              {{ tab.label }}
            </button>
          </div>
        </div>

        <div class="divide-y divide-slate-100">
          <div v-for="msg in filteredMessages" :key="msg.id" class="p-4 hover:bg-slate-50 transition-colors cursor-pointer" @click="readMessage(msg.id)">
            <div class="flex items-start gap-3">
              <div :class="`w-10 h-10 rounded-full flex items-center justify-center ${getTypeClass(msg.type)}`">
                <iconify-icon class="text-xl" :icon="msg.icon"></iconify-icon>
              </div>
              <div class="flex-1">
                <div class="flex items-center justify-between mb-1">
                  <h3 :class="`font-medium ${msg.read ? 'text-slate-700' : 'text-slate-900 font-bold'}`">{{ msg.title }}</h3>
                  <span class="text-xs text-slate-500">{{ msg.time }}</span>
                </div>
                <p class="text-sm text-slate-600 line-clamp-2">{{ msg.content }}</p>
              </div>
              <div v-if="!msg.read" class="w-2 h-2 bg-blue-600 rounded-full mt-2"></div>
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
  { label: '未读', value: 'unread' },
  { label: '系统通知', value: 'system' },
  { label: '审批结果', value: 'approval' }
]

const messages = ref([
  { id: 1, type: 'approval', icon: 'mdi:check-circle', title: '数据使用申请已通过', content: '您申请的"泛癌多组学整合分析数据库"已通过审批，现在可以访问数据。', time: '10分钟前', read: false },
  { id: 2, type: 'system', icon: 'mdi:bell', title: '系统维护通知', content: '平台将于本周六凌晨2:00-4:00进行系统维护，期间可能无法访问。', time: '2小时前', read: true },
  { id: 3, type: 'approval', icon: 'mdi:close-circle', title: '数据导出申请被拒绝', content: '您申请的数据导出请求已被拒绝，原因：导出数据量过大，请联系管理员。', time: '昨天', read: true }
])

const filteredMessages = computed(() => {
  if (activeTab.value === 'all') return messages.value
  if (activeTab.value === 'unread') return messages.value.filter(m => !m.read)
  return messages.value.filter(m => m.type === activeTab.value)
})

const getTypeClass = (type: string) => {
  const classes: Record<string, string> = {
    system: 'bg-blue-100 text-blue-600',
    approval: 'bg-green-100 text-green-600'
  }
  return classes[type] || 'bg-slate-100 text-slate-600'
}

const readMessage = (id: number) => {
  const msg = messages.value.find(m => m.id === id)
  if (msg) msg.read = true
}
</script>

<style scoped>
.messages-page {  }
</style>
