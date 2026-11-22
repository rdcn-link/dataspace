<template>
  <div class="publish-asset-page bg-slate-50 min-h-screen">
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
          <h1 class="text-2xl font-bold text-slate-800">发布数据资产</h1>
          <p class="text-slate-500 text-sm mt-1">分享您的研究成果，促进科研协作</p>
        </div>

        <form @submit.prevent="handleSubmit" class="p-8 space-y-6">
          <div>
            <label class="block text-sm font-medium text-slate-700 mb-2">数据集名称 <span class="text-red-500">*</span></label>
            <input v-model="form.title" class="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none" placeholder="请输入数据集名称"/>
          </div>

          <div>
            <label class="block text-sm font-medium text-slate-700 mb-2">领域分类 <span class="text-red-500">*</span></label>
            <select v-model="form.category" class="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none">
              <option value="">请选择领域</option>
              <option value="life-science">生命科学</option>
              <option value="medicine">医学</option>
              <option value="environment">环境科学</option>
              <option value="physics">物理/化学</option>
            </select>
          </div>

          <div>
            <label class="block text-sm font-medium text-slate-700 mb-2">访问级别 <span class="text-red-500">*</span></label>
            <select v-model="form.accessLevel" class="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none">
              <option value="open">开放访问 - 任何人可下载</option>
              <option value="review">审核使用 - 需审批后访问</option>
              <option value="controlled">受控使用 - 仅限沙箱环境分析</option>
            </select>
          </div>

          <div>
            <label class="block text-sm font-medium text-slate-700 mb-2">数据描述 <span class="text-red-500">*</span></label>
            <textarea v-model="form.description" rows="4" class="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none" placeholder="请详细描述数据集的内容、来源、用途等"></textarea>
          </div>

          <div>
            <label class="block text-sm font-medium text-slate-700 mb-2">上传文件</label>
            <div class="border-2 border-dashed border-slate-200 rounded-xl p-8 text-center hover:bg-slate-50 transition-colors cursor-pointer" @click="triggerUpload">
              <iconify-icon class="text-4xl text-slate-400 mb-2" icon="mdi:cloud-upload-outline"></iconify-icon>
              <p class="text-sm text-slate-600">点击或拖拽文件到此处上传</p>
              <p class="text-xs text-slate-400 mt-1">支持 CSV、JSON、Parquet、HDF5 等格式</p>
              <input ref="fileInput" type="file" class="hidden" multiple @change="handleFileUpload"/>
            </div>
          </div>

          <div class="pt-6 border-t border-slate-100">
            <button type="submit" class="w-full bg-blue-600 text-white py-3 rounded-xl font-bold shadow-lg shadow-blue-200 hover:bg-blue-700 hover:shadow-xl transition-all">
              提交发布
            </button>
            <p class="text-center text-xs text-slate-400 mt-4">提交后将进入审核流程，预计 2-3 个工作日完成审核</p>
          </div>
        </form>
      </div>
    </main>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue'
import { useRouter } from 'vue-router'
import BrandLogo from '@/components/BrandLogo.vue'

const router = useRouter()
const fileInput = ref<HTMLInputElement | null>(null)

const form = reactive({
  title: '',
  category: '',
  accessLevel: '',
  description: ''
})

const triggerUpload = () => fileInput.value?.click()

const handleFileUpload = (event: Event) => {
  const target = event.target as HTMLInputElement
  if (target.files) {
    console.log('Files selected:', Array.from(target.files).map(f => f.name))
  }
}

const handleSubmit = () => {
  console.log('Publishing asset:', form)
  router.push('/assets')
}
</script>

<style scoped>
.publish-asset-page {  }
</style>
