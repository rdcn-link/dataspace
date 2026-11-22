<template>
  <div class="export-apply-page bg-slate-50 min-h-screen">
    <header class="bg-white border-b border-slate-200 h-16 sticky top-0 z-40">
      <div class="max-w-7xl mx-auto px-6 h-full flex items-center justify-between">
        <div class="flex items-center gap-2 cursor-pointer" @click="router.push('/')">
          <BrandLogo size="sm" />
          <span class="text-lg font-bold text-slate-800">费尔空间</span>
        </div>
      </div>
    </header>

    <main class="max-w-3xl mx-auto px-6 py-10">
      <div class="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div class="p-8 border-b border-slate-100">
          <h1 class="text-2xl font-bold text-slate-800">数据导出申请</h1>
          <p class="text-slate-500 text-sm mt-1">申请将分析结果或授权数据导出到本地</p>
        </div>

        <form @submit.prevent="handleSubmit" class="p-8 space-y-6">
          <div>
            <label class="block text-sm font-medium text-slate-700 mb-2">数据集名称</label>
            <input v-model="form.dataset" class="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none" readonly/>
          </div>

          <div>
            <label class="block text-sm font-medium text-slate-700 mb-2">导出格式 <span class="text-red-500">*</span></label>
            <select v-model="form.format" class="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none">
              <option value="csv">CSV</option>
              <option value="xlsx">Excel (XLSX)</option>
              <option value="json">JSON</option>
              <option value="parquet">Parquet</option>
            </select>
          </div>

          <div>
            <label class="block text-sm font-medium text-slate-700 mb-2">导出原因 <span class="text-red-500">*</span></label>
            <textarea v-model="form.reason" rows="4" class="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none" placeholder="请说明数据导出的用途和后续处理计划"></textarea>
          </div>

          <div class="pt-6 border-t border-slate-100">
            <button type="submit" class="w-full bg-blue-600 text-white py-3 rounded-xl font-bold shadow-lg shadow-blue-200 hover:bg-blue-700 hover:shadow-xl transition-all">
              提交申请
            </button>
            <p class="text-center text-xs text-slate-400 mt-4">预计 1-3 个工作日内完成审批</p>
          </div>
        </form>
      </div>
    </main>
  </div>
</template>

<script setup lang="ts">
import { reactive } from 'vue'
import { useRouter } from 'vue-router'
import BrandLogo from '@/components/BrandLogo.vue'

const router = useRouter()

const form = reactive({
  dataset: '泛癌多组学整合分析数据库 (v3.0)',
  format: 'csv',
  reason: ''
})

const handleSubmit = () => {
  console.log('Export application submitted:', form)
  router.push('/messages')
}
</script>

<style scoped>
.export-apply-page {  }
</style>
