<template>
  <div class="service-page">
    <div class="bg-blob blob-1"></div>
    <div class="bg-blob blob-2"></div>

    <!-- 导航栏 -->
    <nav class="glass-nav fixed top-0 w-full z-50 hidden md:block">
      <div class="relative max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-2">
        <div class="flex items-center space-x-2 group cursor-pointer shrink-0 z-10" @click="router.push('/home')">
          <BrandLogo size="lg" interactive />
          <span class="text-lg sm:text-xl font-bold tracking-tight text-slate-900">费尔空间</span>
        </div>
        <SiteTopNavLinks />
        <div class="flex items-center space-x-2 sm:space-x-4 shrink-0 z-10">
          <UserCenterNavButton prefer-login-modal @need-login="showLoginModal = true" />
          <!-- 未登录 → 显示登录按钮 -->
          <template v-if="!authStore.isLoggedIn">
            <button @click="showLoginModal = true" class="btn-gradient text-white font-bold py-2 px-4 sm:px-5 rounded-xl transition-all text-sm">
              登录
            </button>
          </template>
          <!-- 已登录 → 显示用户欢迎信息（与主页一致） -->
          <template v-else>
            <span class="hidden sm:inline text-sm text-slate-600">欢迎您，{{ authStore.displayName }}</span>
            <button @click="handleLogout" class="text-xs text-slate-400 hover:text-red-500 transition-colors px-2 py-1">
              退出
            </button>
          </template>
        </div>
      </div>
    </nav>

    <main class="pt-4 md:pt-20 pb-4 max-w-7xl mx-auto px-6">
      <!-- Hero Section & Stats -->
      <section class="mb-10 text-center">
        <h1 class="text-5xl md:text-6xl font-extrabold mb-6 leading-tight tracking-tight">
          让科研回归 <span class="gradient-text">纯粹与高效</span>
        </h1>
        <p class="text-lg text-slate-500 max-w-2xl mx-auto mb-6 leading-relaxed">为您提供包罗万象的智能科研服务。</p>
        <div class="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
          <div class="bg-white/80 backdrop-blur-xl p-4 rounded-[1.25rem] border border-slate-100 shadow-xl shadow-blue-500/5">
            <div class="text-blue-600 mb-1.5">
              <iconify-icon class="text-2xl" icon="solar:layers-minimalistic-bold-duotone"></iconify-icon>
            </div>
            <div class="text-2xl font-extrabold text-slate-900 mb-0">8+</div>
            <div class="text-[10px] text-slate-400 font-bold uppercase tracking-widest">科研服务</div>
          </div>
          <div class="bg-white/80 backdrop-blur-xl p-4 rounded-[1.25rem] border border-slate-100 shadow-xl shadow-emerald-500/5">
            <div class="text-emerald-500 mb-1.5">
              <iconify-icon class="text-2xl" icon="solar:global-bold-duotone"></iconify-icon>
            </div>
            <div class="text-2xl font-extrabold text-slate-900 mb-0">4+</div>
            <div class="text-[10px] text-slate-400 font-bold uppercase tracking-widest">覆盖领域</div>
          </div>
          <div class="bg-white/80 backdrop-blur-xl p-4 rounded-[1.25rem] border border-slate-100 shadow-xl shadow-purple-500/5">
            <div class="text-purple-500 mb-1.5">
              <iconify-icon class="text-2xl" icon="solar:users-group-rounded-bold-duotone"></iconify-icon>
            </div>
            <div class="text-2xl font-extrabold text-slate-900 mb-0">52,491+</div>
            <div class="text-[10px] text-slate-400 font-bold uppercase tracking-widest">服务使用次数</div>
          </div>
        </div>
      </section>

      <div class="flex flex-col lg:flex-row gap-8 items-stretch" style="height: 665px">
        <!-- Service Selection Area -->
        <div class="lg:w-[380px] shrink-0 space-y-4 flex flex-col">
          <section id="research-services" class="flex-1 flex flex-col bg-white/40 backdrop-blur-md rounded-[24px] p-4 pb-2 border border-white/50 shadow-xl shadow-slate-200/50">
            <div class="flex items-center justify-between mb-3">
              <h2 class="text-lg font-bold text-slate-900 flex items-center">
                <span class="w-2 h-5 bg-blue-600 rounded-full mr-2"></span>科研服务
              </h2>
              <a class="visit-more-btn flex items-center" href="#" @click.prevent="router.push('/service/list')">
                查看更多
                <iconify-icon class="ml-1" icon="solar:arrow-right-linear"></iconify-icon>
              </a>
            </div>
            <div class="grid grid-cols-1 gap-6 flex-1">
              <div
                v-for="service in visibleServices"
                :key="service.id"
                class="tech-card bg-white/70 p-5 rounded-xl cursor-pointer group"
                @click="selectService(service)"
              >
                <div class="flex items-start justify-between mb-1">
                  <div :class="['w-10 h-10 rounded-lg flex items-center justify-center transition-all duration-300', service.iconBgClass, service.iconTextClass]">
                    <iconify-icon class="text-2xl" :icon="service.icon"></iconify-icon>
                  </div>
                  <span class="px-2 py-1 bg-slate-100 text-xs font-bold text-slate-400 rounded-full">{{ service.category }}</span>
                </div>
                <div>
                  <div class="flex items-center justify-between mb-1">
                    <h3 class="text-lg font-bold text-slate-800">{{ service.name }}</h3>
                    <a
                      href="#"
                      class="text-xs text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1"
                      @click.stop.prevent="openServiceDetail(service.name)"
                    >
                      查看详情
                      <iconify-icon class="text-sm" icon="solar:arrow-right-linear"></iconify-icon>
                    </a>
                  </div>
                  <p class="text-sm text-slate-500 leading-tight line-clamp-2">{{ service.description }}</p>
                  <div class="interaction-data !mt-2">
                    <span class="interaction-item !gap-1">
                      <iconify-icon class="text-red-400 text-xs" icon="solar:heart-bold-duotone"></iconify-icon>
                      {{ service.likes }}
                    </span>
                    <span class="interaction-item !gap-1">
                      <iconify-icon class="text-blue-400 text-xs" icon="solar:chat-round-dots-bold-duotone"></iconify-icon>
                      {{ service.comments }}
                    </span>
                  </div>
                  <div class="text-xs text-slate-500 mt-2">
                    服务来源：<span class="text-slate-700 font-medium">{{ service.source }}</span>
                  </div>
                </div>
              </div>
            </div>
          </section>
        </div>

        <!-- Chat Window -->
        <aside class="lg:flex-1 shrink-0 flex flex-col">
          <div class="bg-white rounded-[24px] border border-slate-100 shadow-xl overflow-hidden flex flex-col fixed-chat-container">
            <div class="px-6 py-4 border-b border-slate-50 bg-white flex items-center justify-between">
              <div class="flex items-center space-x-4">
                <div class="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center text-white text-xl shadow-lg shadow-blue-100">
                  <iconify-icon icon="solar:document-text-bold-duotone"></iconify-icon>
                </div>
                <div>
                  <h2 class="text-lg font-extrabold text-slate-900 leading-none mb-1">服务窗口</h2>
                </div>
              </div>
            </div>
            <div class="flex-1 overflow-y-auto p-6 space-y-6 bg-slate-50/50" ref="chatContainerRef">
              <div v-for="(msg, _idx) in chatMessages" :key="_idx">
                <div :class="['flex', msg.role === 'user' ? 'items-start justify-end' : 'items-start', 'space-x-3']">
                  <template v-if="msg.role === 'assistant'">
                    <div class="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white shrink-0 shadow-lg shadow-blue-100">
                      <iconify-icon class="text-xl" icon="solar:atom-bold-duotone"></iconify-icon>
                    </div>
                    <div class="chat-bubble-ai px-4 py-3 max-w-[90%] text-sm text-slate-700 leading-relaxed shadow-sm border border-white">
                      <div class="message-content" v-html="renderMarkdown(msg.content)"></div>
                    </div>
                  </template>
                  <template v-else>
                    <div class="chat-bubble-user px-4 py-3 max-w-[90%] text-sm leading-relaxed shadow-md font-medium">
                      {{ msg.content }}
                    </div>
                  </template>
                </div>
              </div>
              <div v-if="isTyping" class="flex items-start space-x-3">
                <div class="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white shrink-0 shadow-lg shadow-blue-100">
                  <iconify-icon class="text-xl" icon="solar:atom-bold-duotone"></iconify-icon>
                </div>
                <div class="chat-bubble-ai px-4 py-3 max-w-[90%] text-sm text-slate-700 leading-relaxed shadow-sm border border-white">
                  <div class="typing-indicator">
                    <span></span><span></span><span></span>
                  </div>
                </div>
              </div>
            </div>
            <div class="p-4 border-t border-slate-50 bg-white">
              <div id="filePreviewContainer" class="flex flex-wrap gap-2 mb-3">
                <div v-for="(file, _idx) in uploadedFiles" :key="_idx" class="relative">
                  <img v-if="file.isImage" :src="file.dataUrl" class="w-16 h-16 object-cover rounded-lg border border-slate-200" :alt="file.name"/>
                  <div v-else class="w-16 h-16 bg-slate-100 rounded-lg border border-slate-200 flex items-center justify-center">
                    <iconify-icon class="text-slate-500 text-xl" icon="solar:document-bold"></iconify-icon>
                  </div>
                  <button @click="removeFile(_idx)" class="absolute top-1 right-1 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center text-xs hover:bg-red-600 transition-colors">&times;</button>
                </div>
              </div>
              <div class="relative flex items-center">
                <textarea
                  v-model="chatInput"
                  class="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 pr-32 text-sm focus:outline-none focus:ring-4 focus:ring-blue-100 focus:border-blue-400 transition-all resize-none h-20 leading-relaxed font-medium"
                  placeholder="请输入..."
                  @keydown.enter.prevent="sendMessage"
                ></textarea>
                <button class="absolute right-24 bottom-3 p-2 bg-slate-100 text-slate-600 hover:bg-slate-200 hover:text-blue-600 transition-colors flex items-center rounded-lg" @click="fileInput?.click()">
                  <iconify-icon class="text-base" icon="carbon:attachment"></iconify-icon>
                </button>
                <input ref="fileInput" class="hidden" type="file" accept=".txt,.pdf,.doc,.docx,.jpg,.jpeg,.png" multiple @change="handleFileUpload"/>
                <button v-if="!isRunning" @click="sendMessage" class="absolute right-3 bottom-3 px-3 py-2 bg-blue-600 text-white rounded-xl flex items-center justify-center hover:bg-blue-700 transition-all shadow-lg shadow-blue-200">
                  <iconify-icon class="text-base mr-1" icon="solar:send-bold"></iconify-icon>
                  <span class="text-sm font-medium">发送</span>
                </button>
                <button v-else @click="stopGeneration" class="absolute right-3 bottom-3 w-8 h-8 bg-red-600 text-white rounded-xl flex items-center justify-center hover:bg-red-700 transition-all shadow-lg shadow-red-200">
                  <iconify-icon class="text-base" icon="solar:stop-circle-bold"></iconify-icon>
                </button>
              </div>
            </div>
          </div>
        </aside>
      </div>

      <!-- Scrolling Quality Dialogues -->
      <section class="mt-24 mb-8">
        <div class="max-w-7xl mx-auto px-6">
          <div class="flex items-center justify-between mb-6">
            <h2 class="text-xl font-bold text-slate-900 flex items-center">
              <span class="w-2 h-6 bg-purple-600 rounded-full mr-3"></span>他们都在问：
            </h2>
          </div>
          <div class="scrolling-history">
            <div class="scrolling-content">
              <template v-for="(item, _idx) in historyQuestions" :key="_idx">
                <div class="history-card">
                  <div class="flex items-center space-x-2 mb-2">
                    <span class="text-sm font-bold text-slate-700">{{ item.user }}</span>
                    <span class="text-xs text-slate-400">{{ item.time }}</span>
                  </div>
                  <p class="text-sm text-slate-500 line-clamp-2 italic">"{{ item.question }}"</p>
                  <div :class="['mt-2 text-xs font-bold', item.tagClass]">{{ item.tag }}</div>
                </div>
              </template>
              <template v-for="(item, _idx) in historyQuestions" :key="'dup-' + _idx">
                <div class="history-card">
                  <div class="flex items-center space-x-2 mb-2">
                    <span class="text-sm font-bold text-slate-700">{{ item.user }}</span>
                    <span class="text-xs text-slate-400">{{ item.time }}</span>
                  </div>
                  <p class="text-sm text-slate-500 line-clamp-2 italic">"{{ item.question }}"</p>
                  <div :class="['mt-2 text-xs font-bold', item.tagClass]">{{ item.tag }}</div>
                </div>
              </template>
            </div>
          </div>
        </div>
      </section>
    </main>

    <!-- 页脚 -->
    <AppFooter />

    <!-- 登录弹窗（与主页一致，使用实时微信二维码） -->
    <div v-if="showLoginModal" class="login-modal-overlay" @click="closeLoginModal">
      <div class="login-modal relative bg-white rounded-2xl shadow-2xl overflow-hidden max-w-3xl w-full mx-4 flex" @click.stop>
        <button
          type="button"
          aria-label="关闭"
          class="absolute top-4 right-4 z-10 flex h-8 w-8 items-center justify-center rounded-full transition-colors hover:bg-slate-100"
          @click="closeLoginModal"
        >
          <iconify-icon class="text-slate-400" icon="mdi:close"></iconify-icon>
        </button>
        <!-- 左侧二维码 -->
        <div class="w-1/2 p-8 flex flex-col items-center justify-center">
          <!-- 加载状态 -->
          <div v-if="qrStatus === 'loading'" class="flex flex-col items-center justify-center w-64 h-64">
            <iconify-icon class="text-4xl text-blue-500 animate-spin" icon="mdi:loading"></iconify-icon>
            <p class="text-sm text-slate-500 mt-4">正在获取二维码...</p>
          </div>

          <!-- 二维码 -->
          <div v-else-if="qrStatus === 'waiting'" class="flex flex-col items-center">
            <div class="qr-container border-2 border-slate-200 rounded-xl shadow-lg">
              <img
                alt="微信登录二维码"
                class="w-64 h-64 object-contain rounded-xl"
                :src="qrCodeUrl"
              />
            </div>
            <div class="flex items-center gap-2 mt-4">
              <span class="text-sm text-slate-400">二维码有效期</span>
              <span class="text-sm font-mono text-slate-600" :class="{ 'text-red-500': remainingSeconds < 30 }">
                {{ remainingSeconds }}s
              </span>
            </div>
          </div>

          <!-- 登录成功 -->
          <div v-else-if="qrStatus === 'confirmed'" class="flex flex-col items-center justify-center w-64 h-64">
            <iconify-icon class="text-7xl text-green-500 mb-4" icon="mdi:check-circle-outline"></iconify-icon>
            <p class="text-lg font-medium text-slate-800">登录成功</p>
            <p class="text-sm text-slate-400 mt-1">即将关闭...</p>
          </div>

          <!-- 过期 -->
          <div v-else-if="qrStatus === 'expired'" class="flex flex-col items-center justify-center w-64 h-64">
            <iconify-icon class="text-6xl text-slate-300 mb-4" icon="mdi:qrcode-scan"></iconify-icon>
            <p class="text-sm text-slate-500 mb-4">二维码已过期</p>
            <button @click="refreshQR" class="btn-gradient text-white font-bold py-2 px-6 rounded-xl transition-all text-sm hover:scale-105 active:scale-95">重新获取</button>
          </div>

          <!-- 错误 -->
          <div v-else-if="qrStatus === 'error'" class="flex flex-col items-center justify-center w-64 h-64">
            <iconify-icon class="text-6xl text-red-300 mb-4" icon="mdi:alert-circle-outline"></iconify-icon>
            <p class="text-sm text-red-500 mb-1 text-center">{{ qrErrorMessage }}</p>
            <button @click="refreshQR" class="btn-gradient text-white font-bold py-2 px-6 rounded-xl transition-all text-sm mt-2 hover:scale-105 active:scale-95">重试</button>
          </div>

          <p class="text-slate-700 font-medium text-center mt-6">请使用微信扫码完成登录/注册</p>
        </div>

        <!-- 右侧信息 -->
        <div class="w-1/2 p-8 flex flex-col justify-between">
          <div>
                        <div class="flex items-center space-x-2 mb-8">
              <BrandLogo size="lg" />
              <span class="text-xl font-bold text-slate-900">费尔空间</span>
            </div>
            <h2 class="text-2xl font-bold mb-2">微信扫码登录</h2>
            <p class="text-slate-500 text-sm mb-8">使用微信扫一扫完成登录</p>
            <ul class="text-sm text-slate-500 space-y-4 mb-8">
              <li class="flex items-center gap-3">
                <iconify-icon class="text-blue-600 text-xl" icon="mdi:account-plus-outline"></iconify-icon>
                <span>首次扫码将引导完成实名注册</span>
              </li>
              <li class="flex items-center gap-3">
                <iconify-icon class="text-blue-600 text-xl" icon="mdi:bell-outline"></iconify-icon>
                <span>审批、消息通知将通过微信实时推送</span>
              </li>
            </ul>
          </div>
          <div class="pt-6 border-t border-slate-100">
            <p class="text-xs text-slate-400 mb-3">
              登录即表示同意费尔空间相关的<a class="text-blue-600 hover:underline" href="/auth/agreement">《服务协议》</a> 和 <a class="text-blue-600 hover:underline" href="/auth/agreement">《隐私政策》</a>
            </p>
          </div>
        </div>
      </div>
    </div>

    <SiteBottomTabBar prefer-login-modal @need-login="showLoginModal = true" />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, nextTick, watch, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useWechatLogin } from '@/composables/useWechatLogin'
import { marked } from 'marked'
import AppFooter from '@/components/AppFooter.vue'
import BrandLogo from '@/components/BrandLogo.vue'
import SiteTopNavLinks from '@/components/SiteTopNavLinks.vue'
import SiteBottomTabBar from '@/components/SiteBottomTabBar.vue'
import UserCenterNavButton from '@/components/UserCenterNavButton.vue'
import { openServiceDetailInNewWindow } from '@/utils/openServiceDetail'
import {
  abortAguiRun,
  createAguiId,
  createAguiSession,
  postAguiRun,
  type AguiMessage
} from '@/utils/aguiApi'

const UPLOAD_API_BASE = ''

const router = useRouter()
const authStore = useAuthStore()
const showLoginModal = ref(false)
const chatInput = ref('')
const isTyping = ref(false)
const isRunning = ref(false)
const chatContainerRef = ref<HTMLElement | null>(null)
const fileInput = ref<HTMLInputElement | null>(null)

const {
  qrCodeUrl,
  status: qrStatus,
  errorMessage: qrErrorMessage,
  remainingSeconds,
  fetchQRCode,
  refresh: refreshQR,
  cleanup: cleanupQR
} = useWechatLogin({
  redirectPath: '/service',
  onSuccess: () => {
    showLoginModal.value = false
  }
})

// 打开弹窗时获取二维码，关闭时清理
watch(showLoginModal, (val) => {
  if (val) {
    fetchQRCode()
  } else {
    cleanupQR()
  }
})

const closeLoginModal = () => {
  showLoginModal.value = false
}

const handleLogout = () => {
  authStore.logout()
}

interface ChatMessage {
  id?: string
  role: string
  content: string
  images?: Record<string, string>
}

const chatMessages = ref<ChatMessage[]>([
  {
    role: 'assistant',
    content: '您好！我是费尔空间智能服务。\n\n您可以点击左侧的服务项目，或直接在这里向我提问。'
  }
])
const messageHistory = ref<AguiMessage[]>([])

let threadId = ''
let runId = ''

onMounted(() => {
  const session = createAguiSession()
  threadId = session.threadId
  runId = session.runId
})

interface UploadedFile {
  name: string
  dataUrl: string
  isImage: boolean
}

const uploadedFiles = ref<UploadedFile[]>([])
const uploadedImages = ref<Record<string, string>>({})

function renderMarkdown(content: string): string {
  if (!content) return ''
  try {
    return marked.parse(content) as string
  } catch {
    return content
  }
}

function scrollToBottom() {
  nextTick(() => {
    if (chatContainerRef.value) {
      chatContainerRef.value.scrollTop = chatContainerRef.value.scrollHeight
    }
  })
}

// Service data
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
  iconTextClass: string
}

const allServices: Service[] = [
  {
    id: 1, name: '化学物质智能检索', category: '化学', icon: 'mdi:molecule',
    description: '基于分子式快速识别化学物质信息与结构数据',
    likes: '12.4k', comments: '852', source: '化学物质基础数据库',
    iconBgClass: 'bg-indigo-50 text-indigo-600',
    iconTextClass: ''
  },
  {
    id: 2, name: '海洋生物智能识别', category: '海洋', icon: 'mdi:fish',
    description: '基于图像识别技术自动识别海洋生物种类',
    likes: '8.2k', comments: '421', source: '中国科学院南海海洋研究所科学数据中心',
    iconBgClass: 'bg-blue-50 text-blue-600',
    iconTextClass: ''
  },
  {
    id: 3, name: '单细胞数据集检索', category: '单细胞', icon: 'mdi:database-search',
    description: '多条件筛选获取高质量单细胞预训练数据集',
    likes: '15.1k', comments: '1.2k', source: 'bdbe.cn kun 单细胞可视化平台',
    iconBgClass: 'bg-green-50 text-green-600',
    iconTextClass: ''
  },
  {
    id: 4, name: '单细胞数据标准化', category: '数据', icon: 'mdi:chart-bell-curve',
    description: '消除测序偏差，实现高质量数据预处理',
    likes: '5.7k', comments: '318', source: 'bdbe.cn kun 单细胞可视化平台',
    iconBgClass: 'bg-orange-50 text-orange-600',
    iconTextClass: ''
  },
  {
    id: 5, name: '单细胞智能注释分析', category: '分析', icon: 'mdi:brain',
    description: '自动完成细胞类型识别与生物学功能注释',
    likes: '9.3k', comments: '562', source: 'bdbe.cn kun 单细胞可视化平台',
    iconBgClass: 'bg-purple-50 text-purple-600',
    iconTextClass: ''
  },
  {
    id: 6, name: '样本性别智能判定', category: '性别', icon: 'mdi:gender-male-female',
    description: '自动识别或纠正单细胞样本的性别信息',
    likes: '6.8k', comments: '297', source: 'bdbe.cn kun 单细胞可视化平台',
    iconBgClass: 'bg-cyan-50 text-cyan-600',
    iconTextClass: ''
  },
  {
    id: 7, name: 'OSGs数据可视化分析', category: '可视化', icon: 'mdi:chart-line',
    description: '提供OSGs整合数据的多维可视化展示',
    likes: '4.5k', comments: '186', source: 'bdbe.cn kun 单细胞可视化平台',
    iconBgClass: 'bg-red-50 text-red-600',
    iconTextClass: ''
  },
  {
    id: 8, name: '稳定表达基因分析', category: '基因', icon: 'mdi:chart-pie',
    description: '支持SEGs功能研究与对比分析可视化',
    likes: '11.2k', comments: '743', source: 'bdbe.cn kun 单细胞可视化平台',
    iconBgClass: 'bg-teal-50 text-teal-600',
    iconTextClass: ''
  }
]

const visibleServices = computed(() => {
  return allServices.slice(0, 3)
})

function openServiceDetail(serviceName: string) {
  openServiceDetailInNewWindow(serviceName)
}

function selectService(service: Service) {
  let prompt = ''
  switch (service.name) {
    case '化学物质智能检索':
      prompt = '请输入化学分子式进行检索分析'
      break
    case '海洋生物智能识别':
      prompt = '请上传海洋生物图片进行识别'
      break
    default:
      prompt = `请输入关于${service.name}的问题`
  }
  chatMessages.value.push({ role: 'assistant', content: prompt })
  scrollToBottom()
}

async function sendMessage() {
  const text = chatInput.value.trim()
  if ((!text && uploadedImages.value && Object.keys(uploadedImages.value).length === 0) || isRunning.value) return

  chatInput.value = ''
  isRunning.value = true

  uploadedFiles.value = []
  uploadedImages.value = {}

  chatMessages.value.push({ role: 'user', content: text })
  const userMessage: AguiMessage = {
    id: createAguiId('msg'),
    role: 'user',
    content: text
  }
  messageHistory.value.push(userMessage)

  isTyping.value = true
  scrollToBottom()

  let assistantContent = ''
  let currentMessageId: string | null = null

  try {
    await postAguiRun(
      {
        threadId,
        runId,
        messages: messageHistory.value
      },
      {
        onRunStarted: () => {},
        onTextMessageStart: (messageId: string) => {
          isTyping.value = false
          currentMessageId = messageId
          assistantContent = ''
        },
        onTextContent: (delta: string) => {
          if (assistantContent === '') {
            chatMessages.value.push({ role: 'assistant', content: delta })
          } else {
            const lastMsg = chatMessages.value[chatMessages.value.length - 1]
            if (lastMsg && lastMsg.role === 'assistant') {
              lastMsg.content += delta
            }
          }
          assistantContent += delta
          scrollToBottom()
        },
        onTextMessageEnd: () => {
          isTyping.value = false
          if (assistantContent) {
            messageHistory.value.push({
              id: currentMessageId || createAguiId('msg'),
              role: 'assistant',
              content: assistantContent
            })
          }
          scrollToBottom()
        },
        onError: (error: string) => {
          isTyping.value = false
          chatMessages.value.push({ role: 'assistant', content: `Error: ${error}` })
          scrollToBottom()
        },
        onRunFinished: () => {
          isTyping.value = false
        }
      }
    )
  } catch (error: any) {
    isTyping.value = false
    if (error.name === 'AbortError') {
      if (assistantContent) {
        messageHistory.value.push({
          id: currentMessageId || createAguiId('msg'),
          role: 'assistant',
          content: assistantContent + ' [stopped]'
        })
      }
    } else {
      chatMessages.value.push({ role: 'assistant', content: `请求失败: ${error.message || error}` })
      scrollToBottom()
    }
  } finally {
    isRunning.value = false
    isTyping.value = false
  }
}

function stopGeneration() {
  abortAguiRun()
}

async function handleFileUpload(event: Event) {
  const input = event.target as HTMLInputElement
  const files = input.files
  if (!files || files.length === 0) return

  let currentContent = chatInput.value

  for (const file of Array.from(files)) {
    currentContent += ` ${file.name} `
    try {
      const formData = new FormData()
      formData.append('file', file)

      const response = await fetch(`${UPLOAD_API_BASE}/upload`, {
        method: 'POST',
        body: formData
      })

      if (response.ok) {
        if (file.type.startsWith('image/')) {
          const reader = new FileReader()
          reader.onload = (e) => {
            const dataUrl = e.target?.result as string
            uploadedImages.value[file.name] = dataUrl
            uploadedFiles.value.push({ name: file.name, dataUrl, isImage: true })
          }
          reader.readAsDataURL(file)
        } else {
          uploadedFiles.value.push({ name: file.name, dataUrl: '', isImage: false })
        }
      }
    } catch (error) {
      console.error('File upload error:', error)
    }
  }

  chatInput.value = currentContent
  if (fileInput.value) {
    fileInput.value.value = ''
  }
}

function removeFile(idx: number) {
  const file = uploadedFiles.value[idx]
  if (file) {
    delete uploadedImages.value[file.name]
    const currentContent = chatInput.value
    chatInput.value = currentContent.replace(` ${file.name} `, ' ')
  }
  uploadedFiles.value.splice(idx, 1)
}

const historyQuestions = [
  { user: '李**', time: '10分钟前', question: '分析检索C6H6这个化学分子式。', tag: '# 化学物质智能检索', tagClass: 'text-indigo-600' },
  { user: '张**', time: '25分钟前', question: '请识别这张图片中的海洋生物种类。', tag: '# 海洋生物智能识别', tagClass: 'text-blue-600' },
  { user: '王**', time: '1小时前', question: '检索人类大脑皮层的单细胞数据集。', tag: '# 单细胞数据集检索', tagClass: 'text-green-600' },
  { user: '赵**', time: '2小时前', question: '对这组单细胞数据进行标准化处理。', tag: '# 单细胞数据标准化', tagClass: 'text-orange-600' },
  { user: '刘**', time: '3小时前', question: '分析这组细胞的类型和功能注释。', tag: '# 单细胞智能注释分析', tagClass: 'text-purple-600' },
  { user: '陈**', time: '4小时前', question: '判定这些样本的性别信息。', tag: '# 样本性别智能判定', tagClass: 'text-cyan-600' },
  { user: '杨**', time: '5小时前', question: '可视化分析OSGs整合数据。', tag: '# OSGs数据可视化分析', tagClass: 'text-red-600' },
  { user: '周**', time: '6小时前', question: '分析这组数据中的稳定表达基因。', tag: '# 稳定表达基因分析', tagClass: 'text-teal-600' }
]
</script>

<style scoped>
.service-page {
  min-height: 100vh;
  position: relative;
  overflow-x: hidden;
  padding-bottom: calc(3.75rem + env(safe-area-inset-bottom, 0px));
}

@media (min-width: 768px) {
  .service-page {
    padding-bottom: 0;
  }
}

.interaction-data {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-top: 8px;
  font-size: 11px;
  color: var(--fs-text-muted, #475569);
}
.interaction-item {
  display: flex;
  align-items: center;
  gap: 4px;
}
.visit-more-btn {
  background: rgba(59, 130, 246, 0.1);
  color: #2563eb;
  font-size: 12px;
  padding: 4px 12px;
  border-radius: 20px;
  font-weight: 600;
  transition: all 0.3s ease;
  border: 1px solid rgba(59, 130, 246, 0.2);
}
.visit-more-btn:hover {
  background: #2563eb;
  color: white;
  box-shadow: 0 4px 12px rgba(37, 99, 235, 0.2);
}
.fixed-chat-container {
  height: 100%;
  display: flex;
  flex-direction: column;
  background: rgba(255, 255, 255, 0.98);
  backdrop-filter: blur(20px);
  border: 2px solid transparent;
  background-clip: padding-box;
  position: relative;
  box-shadow: 0 20px 50px -12px rgba(59, 130, 246, 0.15);
  z-index: 10;
}
.fixed-chat-container::after {
  content: "";
  position: absolute;
  top: -2px; left: -2px; right: -2px; bottom: -2px;
  background: linear-gradient(135deg, #3b82f6, #8b5cf6, #db2777);
  border-radius: 26px;
  z-index: -1;
  opacity: 0.4;
  filter: blur(4px);
}
.chat-bubble-ai {
  background: #f1f5f9;
  border-radius: 0 16px 16px 16px;
  border: 1px solid #93c5fd;
}
.chat-bubble-user {
  background: #1e40af;
  color: white;
  border-radius: 16px 0 16px 16px;
}
.scrolling-history {
  display: flex;
  overflow: hidden;
  user-select: none;
  gap: 20px;
  padding: 20px 0;
}
.scrolling-content {
  display: flex;
  gap: 20px;
  animation: scroll 40s linear infinite;
}
@keyframes scroll {
  0% { transform: translateX(0); }
  100% { transform: translateX(-50%); }
}
.history-card {
  flex-shrink: 0;
  width: 300px;
  background: rgba(255, 255, 255, 0.6);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.4);
  border-radius: 16px;
  padding: 16px;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);
}
.typing-indicator {
  display: inline-flex;
  gap: 4px;
}
.typing-indicator span {
  width: 8px;
  height: 8px;
  background: #3b82f6;
  border-radius: 50%;
  animation: bounce 1.4s infinite;
}
.typing-indicator span:nth-child(2) { animation-delay: 0.2s; }
.typing-indicator span:nth-child(3) { animation-delay: 0.4s; }
@keyframes bounce {
  0%, 80%, 100% { transform: translateY(0); }
  40% { transform: translateY(-8px); }
}
.login-modal-overlay {
  display: flex;
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  backdrop-filter: blur(4px);
  z-index: 100;
  align-items: center;
  justify-content: center;
}
.login-modal {
  position: relative;
  animation: modalSlideIn 0.3s ease-out;
}

.login-modal-close {
  width: 2rem;
  height: 2rem;
  display: flex;
  align-items: center;
  justify-content: center;
  border: none;
  border-radius: 9999px;
  background: transparent;
  color: #94a3b8;
  font-size: 1.25rem;
  cursor: pointer;
  transition: background 0.15s, color 0.15s;
}

.login-modal-close:hover {
  background: #f1f5f9;
  color: #475569;
}
@keyframes modalSlideIn {
  from { opacity: 0; transform: scale(0.95) translateY(-10px); }
  to { opacity: 1; transform: scale(1) translateY(0); }
}
.qr-container {
  position: relative;
  overflow: hidden;
  border-radius: 0.75rem;
}
.qr-overlay {
  position: absolute;
  inset: 0;
  background: rgba(255, 255, 255, 0.95);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  opacity: 0;
  transition: opacity 0.3s ease;
  border-radius: 0.75rem;
}
.qr-container:hover .qr-overlay {
  opacity: 1;
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

.animate-spin {
  animation: spin 1s linear infinite;
}
</style>
