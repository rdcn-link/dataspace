<template>
  <div class="service-list-page bg-slate-50 min-h-screen pb-[calc(3.75rem+env(safe-area-inset-bottom,0px))] md:pb-0">
    <!-- Header (glass-nav, consistent) -->
    <nav class="glass-nav fixed top-0 w-full z-50 hidden md:block">
      <div class="relative max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-2">
        <div class="flex items-center space-x-2 group cursor-pointer shrink-0 z-10" @click="router.push('/home')">
          <BrandLogo size="lg" interactive />
          <span class="text-lg sm:text-xl font-bold tracking-tight text-slate-900">费尔空间</span>
        </div>
        <SiteTopNavLinks />
        <div class="flex items-center space-x-2 sm:space-x-4 shrink-0 z-10">
          <UserCenterNavButton />
          <template v-if="!authStore.isLoggedIn">
            <button @click="goToLogin" class="btn-gradient text-white font-bold py-2 px-4 sm:px-5 rounded-xl transition-all text-sm">
              登录
            </button>
          </template>
          <template v-else>
            <span class="hidden sm:inline text-sm text-slate-600">欢迎您，{{ authStore.displayName }}</span>
            <button @click="handleLogout" class="text-xs text-slate-400 hover:text-red-500 transition-colors px-2 py-1">
              退出
            </button>
          </template>
        </div>
      </div>
    </nav>

    <main class="max-w-7xl mx-auto px-6 pt-4 md:pt-16 pb-10">
      <div class="flex flex-col md:flex-row gap-8">
        <!-- 侧边栏筛选 -->
        <aside class="md:w-64 shrink-0 space-y-6">
          <div class="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
            <h3 class="text-sm font-bold text-slate-800 mb-4">服务领域</h3>
            <div class="space-y-2">
              <label v-for="field in fields" :key="field.name" class="flex items-center gap-2 text-sm text-slate-600 cursor-pointer hover:text-blue-600">
                <input v-model="selectedFields" :value="field.name" type="checkbox" class="rounded text-blue-600" />
                {{ field.name }} ({{ field.count }})
              </label>
            </div>

            <h3 class="text-sm font-bold text-slate-800 mb-4 mt-8">所属机构</h3>
            <div class="space-y-2">
              <label v-for="inst in institutions" :key="inst.name" class="flex items-center gap-2 text-sm text-slate-600 cursor-pointer hover:text-blue-600">
                <input v-model="selectedInstitutions" :value="inst.name" type="checkbox" class="rounded text-blue-600" />
                {{ inst.name }} ({{ inst.count }})
              </label>
            </div>
          </div>
        </aside>

        <!-- 列表内容 -->
        <div class="flex-1 space-y-6">
          <!-- 搜索栏 -->
          <div class="bg-white p-4 rounded-2xl border border-slate-200 mb-6">
            <div class="flex flex-col md:flex-row gap-3">
              <div class="flex-1">
                <input
                  v-model="searchQuery"
                  type="text"
                  placeholder="请输入服务名称或关键字"
                  class="w-full px-4 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <button @click="handleSearch" class="px-6 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors">搜索</button>
            </div>
          </div>

          <!-- 统计 -->
          <div class="flex items-center justify-between mb-2">
            <p class="text-sm text-slate-500">找到 <span class="text-slate-800 font-bold">{{ filteredServices.length }}</span> 个相关服务</p>
          </div>

          <!-- 服务卡片列表 -->
          <div
            v-for="service in filteredServices"
            :key="service.id"
            class="bg-white rounded-2xl border border-slate-200 overflow-hidden hover:shadow-lg transition-all group cursor-pointer"
            @click="goToDetail(service)"
          >
            <div class="flex items-center">
              <div class="shrink-0 flex items-center justify-center pl-6 py-6 pr-4">
                <div
                  :class="['service-card-icon', service.iconBgClass]"
                >
                  <iconify-icon class="service-card-icon__glyph" :icon="service.icon"></iconify-icon>
                </div>
              </div>
              <div class="flex-1 p-6">
                <div class="flex items-center gap-2 mb-2">
                  <span class="px-2 py-0.5 bg-slate-100 text-[10px] font-bold text-slate-500 rounded">{{ service.category }}</span>
                </div>
                <div class="flex items-center justify-between gap-3 mb-2">
                  <h3 class="text-lg font-bold text-slate-800 group-hover:text-blue-600 transition-colors">
                    {{ service.name }}
                  </h3>
                  <a
                    href="#"
                    class="text-xs text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1 shrink-0"
                    @click.stop.prevent="openServiceDetail(service.name)"
                  >
                    查看详情
                    <iconify-icon class="text-sm" icon="solar:arrow-right-linear"></iconify-icon>
                  </a>
                </div>
                <p class="text-sm text-slate-500 mb-3 line-clamp-2">{{ service.description }}</p>
                <div class="flex items-center justify-between">
                  <div class="flex items-center gap-2">
                    <span class="text-xs text-slate-500">来源：</span>
                    <span class="text-xs text-slate-700 font-medium">{{ service.source }}</span>
                  </div>
                  <div class="flex items-center gap-4 text-xs text-slate-500">
                    <span class="flex items-center gap-1"><iconify-icon class="text-red-400" icon="solar:heart-bold-duotone"></iconify-icon> {{ service.likes }}</span>
                    <span class="flex items-center gap-1"><iconify-icon class="text-blue-400" icon="solar:chat-round-dots-bold-duotone"></iconify-icon> {{ service.comments }}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- 空状态 -->
          <div v-if="filteredServices.length === 0" class="text-center py-20 text-slate-400">
            <iconify-icon class="text-6xl mb-4" icon="mdi:database-search-off"></iconify-icon>
            <p>未找到匹配的服务</p>
          </div>
        </div>
      </div>
    </main>
    <AppFooter />
    <SiteBottomTabBar />
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import BrandLogo from '@/components/BrandLogo.vue'
import AppFooter from '@/components/AppFooter.vue'
import SiteBottomTabBar from '@/components/SiteBottomTabBar.vue'
import SiteTopNavLinks from '@/components/SiteTopNavLinks.vue'
import UserCenterNavButton from '@/components/UserCenterNavButton.vue'
import { useAuthStore } from '@/stores/auth'
import { goLogin } from '@/utils/loginRedirect'
import { openServiceDetailInNewWindow } from '@/utils/openServiceDetail'

const router = useRouter()
const authStore = useAuthStore()
const searchQuery = ref('')
const selectedFields = ref<string[]>([])
const selectedInstitutions = ref<string[]>([])

interface Service {
  id: number
  name: string
  category: string
  icon: string
  description: string
  likes: string
  comments: string
  source: string
  iconBgClass: string
}

const allServices: Service[] = [
  { id: 1, name: '化学物质智能检索', category: '化学', icon: 'mdi:molecule', description: '基于分子式快速识别化学物质信息与结构数据。支持多种化学格式导入导出，提供全面的化学物质检索与分析功能，帮助科研人员快速获取准确的化学信息。', likes: '12.4k', comments: '852', source: '化学物质基础数据库', iconBgClass: 'bg-indigo-100 text-indigo-600' },
  { id: 2, name: '海洋生物智能识别', category: '海洋', icon: 'mdi:fish', description: '基于图像识别技术自动识别海洋生物种类。利用深度学习算法对海洋生物图片进行精准分类和识别，支持多种海洋生物种类的快速鉴定。', likes: '8.2k', comments: '421', source: '中国科学院南海海洋研究所科学数据中心', iconBgClass: 'bg-blue-100 text-blue-600' },
  { id: 3, name: '单细胞数据集检索', category: '单细胞', icon: 'mdi:database-search', description: '多条件筛选获取高质量单细胞预训练数据集。提供丰富的单细胞测序数据集检索功能，支持按组织、疾病、平台等多维度筛选。', likes: '15.1k', comments: '1.2k', source: 'bdbe.cn kun 单细胞可视化平台', iconBgClass: 'bg-green-100 text-green-600' },
  { id: 4, name: '单细胞数据标准化', category: '数据', icon: 'mdi:chart-bell-curve', description: '消除测序偏差，实现高质量数据预处理。提供标准化的单细胞数据处理流程，包括质量控制、标准化、批次校正等关键步骤。', likes: '5.7k', comments: '318', source: 'bdbe.cn kun 单细胞可视化平台', iconBgClass: 'bg-orange-100 text-orange-600' },
  { id: 5, name: '单细胞智能注释分析', category: '分析', icon: 'mdi:brain', description: '自动完成细胞类型识别与生物学功能注释。基于AI的智能注释系统，快速准确地识别细胞类型并进行功能富集分析。', likes: '9.3k', comments: '562', source: 'bdbe.cn kun 单细胞可视化平台', iconBgClass: 'bg-purple-100 text-purple-600' },
  { id: 6, name: '样本性别智能判定', category: '性别', icon: 'mdi:gender-male-female', description: '自动识别或纠正单细胞样本的性别信息。通过基因表达特征智能判定样本性别，支持性别信息校验和纠正。', likes: '6.8k', comments: '297', source: 'bdbe.cn kun 单细胞可视化平台', iconBgClass: 'bg-cyan-100 text-cyan-600' },
  { id: 7, name: 'OSGs数据可视化分析', category: '可视化', icon: 'mdi:chart-line', description: '提供OSGs整合数据的多维可视化展示。支持多种图表类型和交互式探索，帮助研究人员直观理解数据特征和模式。', likes: '4.5k', comments: '186', source: 'bdbe.cn kun 单细胞可视化平台', iconBgClass: 'bg-red-100 text-red-600' },
  { id: 8, name: '稳定表达基因分析', category: '基因', icon: 'mdi:chart-pie', description: '支持SEGs功能研究与对比分析可视化。提供稳定表达基因的鉴定、功能注释和跨样本对比分析功能。', likes: '11.2k', comments: '743', source: 'bdbe.cn kun 单细胞可视化平台', iconBgClass: 'bg-teal-100 text-teal-600' }
]

const fields = computed(() => {
  const map = new Map<string, number>()
  allServices.forEach(s => {
    map.set(s.category, (map.get(s.category) || 0) + 1)
  })
  return Array.from(map.entries()).map(([name, count]) => ({ name, count }))
})

const institutions = computed(() => {
  const map = new Map<string, number>()
  allServices.forEach(s => {
    map.set(s.source, (map.get(s.source) || 0) + 1)
  })
  return Array.from(map.entries()).map(([name, count]) => ({ name, count }))
})

const filteredServices = computed(() => {
  return allServices.filter(service => {
    if (searchQuery.value) {
      const q = searchQuery.value.toLowerCase()
      if (!service.name.toLowerCase().includes(q) && !service.description.toLowerCase().includes(q)) {
        return false
      }
    }
    if (selectedFields.value.length > 0 && !selectedFields.value.includes(service.category)) {
      return false
    }
    if (selectedInstitutions.value.length > 0 && !selectedInstitutions.value.includes(service.source)) {
      return false
    }
    return true
  })
})

function handleSearch() {
}

function goToDetail(service: Service) {
  openServiceDetailInNewWindow(service.name)
}

function openServiceDetail(serviceName: string) {
  openServiceDetailInNewWindow(serviceName)
}

function goToLogin() {
  void goLogin(router, router.currentRoute.value.fullPath)
}

function handleLogout() {
  authStore.logout()
}
</script>

<style scoped>
.service-list-page {
}

.service-card-icon {
  width: 6rem;
  height: 6rem;
  border-radius: 0.75rem;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.service-card-icon__glyph {
  font-size: 2.25rem;
  line-height: 1;
}
</style>
