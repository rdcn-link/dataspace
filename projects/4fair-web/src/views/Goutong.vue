<template>
  <div class="goutong-page bg-slate-50 min-h-screen">
    <header class="bg-white border-b border-slate-200 h-16 sticky top-0 z-40">
      <div class="max-w-7xl mx-auto px-6 h-full flex items-center justify-between">
        <div class="flex items-center gap-2 cursor-pointer" @click="router.push('/')">
          <BrandLogo size="sm" />
          <span class="text-lg font-bold text-slate-800">费尔空间</span>
        </div>
      </div>
    </header>

    <main class="max-w-7xl mx-auto px-6 py-10">
      <h1 class="text-2xl font-bold text-slate-800 mb-6">沟通协作</h1>

      <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <!-- 聊天列表 -->
        <div class="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div class="p-4 border-b border-slate-100">
            <input placeholder="搜索联系人..." class="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"/>
          </div>
          <div class="divide-y divide-slate-100 max-h-[500px] overflow-y-auto">
            <div v-for="chat in chats" :key="chat.id" @click="selectChat(chat.id)" :class="`p-4 hover:bg-slate-50 cursor-pointer ${activeChat === chat.id ? 'bg-blue-50' : ''}`">
              <div class="flex items-center gap-3">
                <img :src="chat.avatar" class="w-12 h-12 rounded-full"/>
                <div class="flex-1 min-w-0">
                  <div class="flex items-center justify-between">
                    <h3 class="font-medium text-slate-900 truncate">{{ chat.name }}</h3>
                    <span class="text-xs text-slate-500">{{ chat.time }}</span>
                  </div>
                  <p class="text-sm text-slate-500 truncate">{{ chat.lastMessage }}</p>
                </div>
                <div v-if="chat.unread" class="w-5 h-5 bg-red-500 rounded-full flex items-center justify-center">
                  <span class="text-xs text-white">{{ chat.unread }}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- 聊天窗口 -->
        <div class="lg:col-span-2 bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col h-[600px]">
          <!-- 聊天头部 -->
          <div class="p-4 border-b border-slate-100 flex items-center justify-between">
            <div class="flex items-center gap-3">
              <img :src="currentChat?.avatar" class="w-10 h-10 rounded-full"/>
              <div>
                <h3 class="font-medium text-slate-900">{{ currentChat?.name }}</h3>
                <p class="text-xs text-slate-500">在线</p>
              </div>
            </div>
            <button class="text-slate-400 hover:text-slate-600">
              <iconify-icon class="text-xl" icon="mdi:dots-vertical"></iconify-icon>
            </button>
          </div>

          <!-- 消息列表 -->
          <div class="flex-1 overflow-y-auto p-4 space-y-4">
            <div v-for="msg in messages" :key="msg.id" :class="`flex ${msg.sender === 'me' ? 'justify-end' : 'justify-start'}`">
              <div :class="`max-w-[70%] rounded-2xl px-4 py-2 ${msg.sender === 'me' ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-900'}`">
                <p class="text-sm">{{ msg.content }}</p>
                <p :class="`text-xs mt-1 ${msg.sender === 'me' ? 'text-blue-100' : 'text-slate-500'}`">{{ msg.time }}</p>
              </div>
            </div>
          </div>

          <!-- 输入区 -->
          <div class="p-4 border-t border-slate-100">
            <div class="flex gap-2">
              <input v-model="inputMessage" class="flex-1 px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="输入消息..." @keyup.enter="sendMessage"/>
              <button @click="sendMessage" class="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">发送</button>
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
const activeChat = ref(1)
const inputMessage = ref('')

const chats = ref([
  { id: 1, name: '陈墨研', avatar: '/img/chen_moyan.jpg', lastMessage: '好的，我看看这个数据', time: '10:30', unread: 2 },
  { id: 2, name: '张三', avatar: '/img/qbliu.png', lastMessage: '数据集已经上传了', time: '昨天', unread: 0 },
  { id: 3, name: '李四', avatar: '/img/tianyao.png', lastMessage: '谢谢你的帮助', time: '周一', unread: 0 }
])

const messages = ref([
  { id: 1, sender: 'other', content: '你好，我想咨询一下关于泛癌数据库的使用问题', time: '10:25' },
  { id: 2, sender: 'me', content: '您好，请问有什么问题？', time: '10:26' },
  { id: 3, sender: 'other', content: '我想申请访问权限，需要什么流程？', time: '10:28' },
  { id: 4, sender: 'me', content: '您需要在平台上提交数据使用申请，说明研究目的和使用计划', time: '10:29' },
  { id: 5, sender: 'other', content: '好的，我看看这个数据', time: '10:30' }
])

const currentChat = computed(() => chats.value.find(c => c.id === activeChat.value))

const selectChat = (id: number) => {
  activeChat.value = id
}

const sendMessage = () => {
  if (!inputMessage.value.trim()) return
  messages.value.push({
    id: messages.value.length + 1,
    sender: 'me',
    content: inputMessage.value,
    time: new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })
  })
  inputMessage.value = ''
}
</script>

<style scoped>
.goutong-page {  }
</style>
