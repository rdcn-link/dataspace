<template>
  <div class="audit-log-page bg-slate-50 min-h-screen">
    <header class="bg-white border-b border-slate-200 h-16 sticky top-0 z-40">
      <div class="max-w-7xl mx-auto px-6 h-full flex items-center justify-between">
        <div class="flex items-center gap-2 cursor-pointer" @click="router.push('/')">
          <BrandLogo size="sm" />
          <span class="text-lg font-bold text-slate-800">费尔空间</span>
        </div>
      </div>
    </header>

    <main class="max-w-7xl mx-auto px-6 py-10">
      <h1 class="text-2xl font-bold text-slate-800 mb-6">审计日志</h1>

      <div class="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <!-- 筛选栏 -->
        <div class="p-4 border-b border-slate-100 flex flex-wrap gap-4">
          <input v-model="filters.user" placeholder="用户名" class="px-4 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"/>
          <select v-model="filters.action" class="px-4 py-2 border border-slate-200 rounded-lg text-sm bg-white">
            <option value="">全部操作</option>
            <option value="login">登录</option>
            <option value="download">下载</option>
            <option value="view">查看</option>
            <option value="apply">申请</option>
          </select>
          <input v-model="filters.date" type="date" class="px-4 py-2 border border-slate-200 rounded-lg text-sm"/>
          <button @click="resetFilters" class="px-4 py-2 text-sm text-slate-600 hover:bg-slate-100 rounded-lg">重置</button>
        </div>

        <!-- 日志列表 -->
        <div class="overflow-x-auto">
          <table class="w-full">
            <thead class="bg-slate-50 border-b border-slate-100">
              <tr>
                <th class="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">时间</th>
                <th class="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">用户</th>
                <th class="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">操作</th>
                <th class="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">资源</th>
                <th class="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">IP地址</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-100">
              <tr v-for="log in filteredLogs" :key="log.id" class="hover:bg-slate-50">
                <td class="px-6 py-4 whitespace-nowrap text-sm text-slate-600">{{ log.timestamp }}</td>
                <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-900">{{ log.user }}</td>
                <td class="px-6 py-4 whitespace-nowrap">
                  <span :class="`px-2 py-1 text-xs font-bold rounded ${getActionClass(log.action)}`">{{ log.actionLabel }}</span>
                </td>
                <td class="px-6 py-4 text-sm text-slate-600">{{ log.resource }}</td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-slate-500">{{ log.ip }}</td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- 分页 -->
        <div class="p-4 border-t border-slate-100 flex items-center justify-between">
          <p class="text-sm text-slate-500">共 {{ logs.length }} 条记录</p>
          <div class="flex gap-2">
            <button class="px-3 py-1.5 text-sm border border-slate-200 rounded-lg hover:bg-slate-50">上一页</button>
            <button class="px-3 py-1.5 text-sm bg-blue-600 text-white rounded-lg">1</button>
            <button class="px-3 py-1.5 text-sm border border-slate-200 rounded-lg hover:bg-slate-50">2</button>
            <button class="px-3 py-1.5 text-sm border border-slate-200 rounded-lg hover:bg-slate-50">下一页</button>
          </div>
        </div>
      </div>
    </main>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, reactive } from 'vue'
import { useRouter } from 'vue-router'
import BrandLogo from '@/components/BrandLogo.vue'

const router = useRouter()

const filters = reactive({ user: '', action: '', date: '' })

const logs = ref([
  { id: 1, timestamp: '2026-04-21 10:30:25', user: '陈墨研', action: 'download', actionLabel: '下载', resource: '泛癌多组学数据库', ip: '192.168.1.100' },
  { id: 2, timestamp: '2026-04-21 09:15:42', user: '张三', action: 'view', actionLabel: '查看', resource: '人类肠道微生物组数据', ip: '192.168.1.101' },
  { id: 3, timestamp: '2026-04-20 16:45:10', user: '李四', action: 'apply', actionLabel: '申请', resource: '青藏高原监测数据', ip: '192.168.1.102' },
  { id: 4, timestamp: '2026-04-20 14:20:33', user: '王五', action: 'login', actionLabel: '登录', resource: '-', ip: '192.168.1.103' }
])

const filteredLogs = computed(() => {
  return logs.value.filter(log => {
    if (filters.user && !log.user.includes(filters.user)) return false
    if (filters.action && log.action !== filters.action) return false
    return true
  })
})

const getActionClass = (action: string) => {
  const classes: Record<string, string> = {
    download: 'bg-blue-100 text-blue-700',
    view: 'bg-green-100 text-green-700',
    apply: 'bg-yellow-100 text-yellow-700',
    login: 'bg-slate-100 text-slate-700'
  }
  return classes[action] || 'bg-slate-100 text-slate-700'
}

const resetFilters = () => {
  filters.user = ''
  filters.action = ''
  filters.date = ''
}
</script>

<style scoped>
.audit-log-page {  }
</style>
