<template>
  <div class="auth-mgmt-page bg-slate-50 min-h-screen">
    <header class="bg-white border-b border-slate-200 h-16 sticky top-0 z-40">
      <div class="max-w-7xl mx-auto px-6 h-full flex items-center justify-between">
        <div class="flex items-center gap-2 cursor-pointer" @click="router.push('/')">
          <BrandLogo size="sm" />
          <span class="text-lg font-bold text-slate-800">费尔空间</span>
        </div>
      </div>
    </header>

    <main class="max-w-7xl mx-auto px-6 py-10">
      <h1 class="text-2xl font-bold text-slate-800 mb-6">授权管理</h1>

      <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
        <!-- 我授予的权限 -->
        <div class="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div class="p-6 border-b border-slate-100">
            <h2 class="text-lg font-bold text-slate-900">我授予的权限</h2>
            <p class="text-sm text-slate-500 mt-1">您已授权给其他用户的数据访问权限</p>
          </div>
          <div class="divide-y divide-slate-100">
            <div v-for="grant in grantedPermissions" :key="grant.id" class="p-4 hover:bg-slate-50">
              <div class="flex items-start justify-between">
                <div>
                  <h3 class="font-medium text-slate-900">{{ grant.dataset }}</h3>
                  <p class="text-sm text-slate-600 mt-1">授予: {{ grant.grantee }}</p>
                  <p class="text-xs text-slate-500 mt-1">有效期至: {{ grant.expiresAt }}</p>
                </div>
                <button @click="revokeGrant(grant.id)" class="text-red-600 hover:text-red-700 text-sm">
                  撤销
                </button>
              </div>
            </div>
          </div>
        </div>

        <!-- 我获得的权限 -->
        <div class="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div class="p-6 border-b border-slate-100">
            <h2 class="text-lg font-bold text-slate-900">我获得的权限</h2>
            <p class="text-sm text-slate-500 mt-1">其他用户授予您的数据访问权限</p>
          </div>
          <div class="divide-y divide-slate-100">
            <div v-for="perm in myPermissions" :key="perm.id" class="p-4 hover:bg-slate-50">
              <div class="flex items-start justify-between">
                <div>
                  <h3 class="font-medium text-slate-900">{{ perm.dataset }}</h3>
                  <p class="text-sm text-slate-600 mt-1">来自: {{ perm.grantor }}</p>
                  <p class="text-xs text-slate-500 mt-1">有效期至: {{ perm.expiresAt }}</p>
                </div>
                <button @click="viewData(perm.datasetId)" class="text-blue-600 hover:text-blue-700 text-sm">
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
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import BrandLogo from '@/components/BrandLogo.vue'

const router = useRouter()

const grantedPermissions = ref([
  { id: 1, dataset: '我的研究数据集 A', grantee: '张三', expiresAt: '2026-12-31' },
  { id: 2, dataset: '实验数据 B', grantee: '李四', expiresAt: '2026-10-15' }
])

const myPermissions = ref([
  { id: 1, dataset: '泛癌多组学整合分析数据库', grantor: '国家基因中心', expiresAt: '2026-09-30', datasetId: 1 },
  { id: 2, dataset: '人类肠道微生物组数据', grantor: '微生物研究所', expiresAt: '2026-11-20', datasetId: 2 }
])

const revokeGrant = (id: number) => {
  console.log('Revoking grant:', id)
}

const viewData = (datasetId: number) => {
  router.push(`/data/${datasetId}`)
}
</script>

<style scoped>
.auth-mgmt-page {
  }
</style>
