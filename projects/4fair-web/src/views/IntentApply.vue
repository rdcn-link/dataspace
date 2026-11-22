<template>
  <div class="intent-apply-page min-h-screen flex items-center justify-center p-4" style="background: rgba(30, 41, 59, 0.5);">
    <div class="bg-white max-w-2xl w-full rounded-2xl shadow-2xl overflow-hidden animate-fade-in-up">
      <!-- 头部 -->
      <div class="p-6 border-b border-slate-100 flex items-center justify-between">
        <h2 class="text-xl font-bold text-slate-800">发起申请</h2>
        <button @click="goBack" class="text-slate-400 hover:text-slate-600 transition-colors">
          <iconify-icon class="text-2xl" icon="mdi:close"></iconify-icon>
        </button>
      </div>

      <!-- 数据摘要 -->
      <div class="p-6 bg-slate-50 border-b border-slate-100 flex gap-4">
        <div class="w-16 h-16 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shrink-0">
          <iconify-icon class="text-3xl text-white/80" icon="mdi:database"></iconify-icon>
        </div>
        <div>
          <p class="text-xs text-blue-600 font-bold mb-1 uppercase tracking-wider">数据摘要</p>
          <h3 v-if="datasetLoading" class="text-sm text-slate-500">正在加载数据集信息…</h3>
          <h3 v-else-if="datasetLoadError" class="text-sm text-amber-700">{{ datasetLoadError }}</h3>
          <h3 v-else class="text-sm font-bold text-slate-800">{{ datasetTitle || '—' }}</h3>
          <p v-if="!datasetLoading && !datasetLoadError" class="text-xs text-slate-500 mt-1">
            提供方：{{ datasetPublisher }} · 访问级别：{{ datasetLevel }}
          </p>
        </div>
      </div>

      <!-- 表单 -->
      <form @submit.prevent="handleSubmit" class="p-8 space-y-6">
        <IntentApplyKstExemptNotice v-if="kstExempt" variant="pc" />

        <!-- 应用场景 -->
        <div class="space-y-2">
          <label class="text-sm font-bold text-slate-700 flex items-center gap-1">
            应用场景 <span class="text-red-500">*</span>
          </label>
          <select
            v-model="form.scenarioKey"
            class="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none text-sm text-slate-800"
            required
          >
            <option value="" disabled>请选择</option>
            <option v-for="item in applyScenarios" :key="item.key" :value="item.key">
              {{ item.label }}
            </option>
          </select>
        </div>

        <IntentApplyKstFields
          v-if="showKstFields"
          v-model="form.kst"
          variant="pc"
        />

        <IntentApplyProjectFields
          v-if="showProjectFields"
          v-model="form.project"
          variant="pc"
        />

        <IntentApplyAlgorithmFields
          v-if="showAlgorithmFields"
          v-model="form.algorithm"
          variant="pc"
        />

        <IntentApplyCompetitionFields
          v-if="showCompetitionFields"
          v-model="form.competition"
          variant="pc"
        />

        <IntentApplyThesisFields
          v-if="showThesisFields"
          v-model="form.thesis"
          variant="pc"
        />

        <!-- 上传附件 -->
        <div class="space-y-2">
          <label class="text-sm font-bold text-slate-700 flex items-center gap-1">
            上传附件 <span v-if="attachmentRequired" class="text-red-500">*</span>
          </label>
          <p
            v-if="isKuaishutongSelected && kstChecking"
            class="text-xs text-slate-500"
          >
            正在查询快数通认证状态…
          </p>
          <template v-else>
          <input
            ref="attachmentInputRef"
            type="file"
            class="hidden"
            :accept="desktopAttachmentAccept"
            @change="onAttachmentChange"
          />
          <button
            type="button"
            class="w-full flex items-center justify-center gap-2 px-4 py-3 border-2 border-dashed border-slate-200 rounded-lg text-sm text-slate-600 hover:bg-slate-50 hover:border-blue-300 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
            :disabled="attachmentUploading"
            @click="triggerPickAttachment"
          >
            <iconify-icon
              v-if="attachmentUploading"
              class="animate-spin text-xl text-blue-500"
              icon="mdi:loading"
            ></iconify-icon>
            <iconify-icon v-else icon="mdi:cloud-upload-outline" class="text-xl text-slate-400"></iconify-icon>
            <span>{{ attachmentUploading ? '正在上传…' : attachmentFile ? '重新选择附件' : '点击选择文件' }}</span>
          </button>
          <div
            v-if="attachmentFile"
            class="flex items-center justify-between gap-2 px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-700"
          >
            <span class="min-w-0 truncate">{{ attachmentFile.name }}</span>
            <button
              type="button"
              class="shrink-0 text-blue-600 hover:underline text-xs disabled:opacity-50"
              :disabled="attachmentUploading"
              @click="clearAttachment"
            >
              移除
            </button>
          </div>
          <p v-if="attachmentUploading" class="text-xs text-blue-600">正在上传附件，请稍候…</p>
          <p v-else-if="attachmentUploaded" class="text-xs text-emerald-600">附件已上传</p>
          <p v-if="attachmentError" class="text-xs text-amber-700">{{ attachmentError }}</p>
          <p class="text-xs text-amber-800/90">{{ INTENT_APPLY_ATTACHMENT_STAMP_NOTE }}</p>
          <p class="text-xs text-slate-400">选择文件后将自动上传；仅支持 1 个文件，不超过 30MB</p>
          </template>
        </div>

        <!-- 使用目的 -->
        <div class="space-y-4">
          <label class="text-sm font-bold text-slate-700 flex items-center gap-1">
            使用目的 <span class="text-red-500">*</span>
          </label>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
            <label
              v-for="purpose in purposes"
              :key="purpose.value"
              class="flex items-center gap-2 p-3 border rounded-lg cursor-pointer transition-colors"
              :class="form.purpose === purpose.value ? 'border-blue-400 bg-blue-50' : 'border-slate-200 hover:border-blue-400'"
            >
              <input type="radio" :value="purpose.value" v-model="form.purpose" class="text-blue-600 focus:ring-blue-500" />
              <span class="text-sm text-slate-700">{{ purpose.label }}</span>
            </label>
          </div>

          <!-- 其他用途输入框 -->
          <div class="space-y-2">
            <label class="text-xs text-slate-600 font-medium">其他用途</label>
            <input
              v-model="form.customPurpose"
              type="text"
              class="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition-all"
              placeholder="请填写您的具体使用目的..."
            />
          </div>

          <div class="space-y-2">
            <label class="text-xs text-slate-600 font-medium flex items-center gap-1">
              研究方向 <span class="text-red-500">*</span>
            </label>
            <textarea
              v-model="form.description"
              class="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition-all"
              placeholder="请输入研究方向"
              rows="2"
              required
            ></textarea>
          </div>

          <div class="flex items-center gap-2 text-xs text-slate-500 bg-blue-50 p-3 rounded-lg">
            <iconify-icon icon="mdi:information-outline" class="text-blue-500 shrink-0"></iconify-icon>
            <span>选择使用目的后，系统将自动生成申请理由，您也可在上方填写研究方向。</span>
          </div>
        </div>

        <!-- 使用方式和时长 -->
        <div class="space-y-6">
          <div class="space-y-2">
            <label class="text-sm font-bold text-slate-700">
              数据使用方式 <span class="text-red-500">*</span>
            </label>
            <div class="flex flex-wrap gap-3">
              <label class="flex items-center gap-2 cursor-pointer">
                <input type="radio" value="local" v-model="form.usageMode" class="text-blue-600 focus:ring-blue-500" />
                <span class="text-sm text-slate-700">下载至本地离线分析</span>
              </label>
              <label class="flex items-center gap-2 cursor-pointer">
                <input type="radio" value="sandbox" v-model="form.usageMode" class="text-blue-600 focus:ring-blue-500" />
                <span class="text-sm text-slate-700">使用平台安全沙箱分析</span>
              </label>
            </div>
          </div>

          <!-- 申请时长 -->
          <div class="space-y-4">
            <label class="text-sm font-bold text-slate-700">
              申请时长 <span class="text-red-500">*</span>
            </label>
            <div class="space-y-3">
              <div class="flex flex-wrap gap-3">
                <label
                  v-for="duration in durations"
                  :key="duration.value"
                  class="flex items-center gap-2 cursor-pointer"
                >
                  <input type="radio" :value="duration.value" v-model="form.duration" class="text-blue-600 focus:ring-blue-500" />
                  <span class="text-sm text-slate-700">{{ duration.label }}</span>
                </label>
              </div>

              <!-- 自定义日期 -->
              <div v-if="form.duration === 'custom'" class="space-y-2">
                <div class="space-y-1">
                  <label class="text-xs text-slate-500">开始日期</label>
                  <input
                    v-model="form.startDate"
                    type="date"
                    class="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                </div>
                <div class="space-y-1">
                  <label class="text-xs text-slate-500">结束日期</label>
                  <input
                    v-model="form.endDate"
                    type="date"
                    class="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- 确认协议 -->
        <div class="pt-4">
          <label class="flex items-start gap-3 cursor-pointer group">
            <input type="checkbox" v-model="form.agreed" class="mt-1 rounded text-blue-600 focus:ring-blue-500" />
            <span class="text-xs text-slate-500 leading-relaxed group-hover:text-slate-700 transition-colors">
              我确认以上信息真实有效，并同意将联系方式、机构背景等必要信息披露给数据提供方，以便其进行合规性审核。
            </span>
          </label>
        </div>

        <!-- 操作按钮 -->
        <div class="pt-6 border-t border-slate-100 flex gap-4">
          <button type="button" @click="goBack" class="flex-1 py-3 border border-slate-200 text-slate-600 rounded-xl font-bold text-center hover:bg-slate-50 transition-colors">
            取消
          </button>
          <button
            type="submit"
            :disabled="!form.agreed || submitting"
            class="flex-1 py-3 bg-blue-600 text-white rounded-xl font-bold shadow-lg shadow-blue-200 hover:bg-blue-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            <iconify-icon v-if="submitting" class="animate-spin" icon="mdi:loading"></iconify-icon>
            {{ submitting ? '提交中...' : '提交申请' }}
          </button>
        </div>
      </form>
    </div>

    <!-- 提交成功 Toast -->
    <div
      v-if="showSuccessToast"
      class="fixed top-1/4 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-emerald-500 text-white px-6 py-3 rounded-lg shadow-lg flex items-center gap-2 z-50"
    >
      <iconify-icon icon="mdi:check-circle"></iconify-icon>
      <span>提交成功</span>
    </div>

    <!-- 提交失败 Toast -->
    <div
      v-if="showErrorToast"
      class="fixed top-1/4 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-red-500 text-white px-6 py-3 rounded-lg shadow-lg flex items-center gap-2 z-50"
      @click="showErrorToast = false"
    >
      <iconify-icon icon="mdi:alert-circle"></iconify-icon>
      <span>{{ errorMessage }}</span>
    </div>

    <!-- 微信公众平台二维码弹窗 -->
    <div
      v-if="showWechatModal"
      class="fixed inset-0 bg-black/50 z-50 flex items-center justify-center"
      @click="closeWechatModal"
    >
      <div class="bg-white rounded-2xl p-8 max-w-md w-full mx-4" @click.stop>
        <div class="flex items-center justify-between mb-6">
          <h3 class="text-xl font-bold text-slate-900">请微信扫码关注'费尔空间'公众号</h3>
          <button @click="closeWechatModal" class="text-slate-400 hover:text-slate-600">
            <iconify-icon icon="mdi:close"></iconify-icon>
          </button>
        </div>
        <div class="text-center mb-6">
          <div class="flex justify-center mb-4">
            <img :src="qrCodeImg" alt="费尔空间公众号" class="w-48 h-48 object-cover" />
          </div>
          <p class="text-sm text-slate-600">扫码关注后，审批消息会自动推送至微信</p>
        </div>
        <div class="text-center">
          <button @click="closeWechatModal" class="px-6 py-2 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 transition-colors">
            关闭
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, watch, onMounted, computed, toRef } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { fetchDatasetSummaryByCstr } from '@/utils/datasetSummary'
import { submitIntentApplication } from '@/utils/intentApplySubmit'
import { resolveApplicantUidFromUser } from '@/utils/resolveApplicantUid'
import {
  INTENT_APPLY_SCENARIOS,
  createEmptyThesisForm,
  getApplyTypeForScenarioKey,
  getThesisFieldsForSubmit,
  isKuaishutongScenarioKey,
  isProjectScenarioKey,
  isAlgorithmScenarioKey,
  isCompetitionScenarioKey,
  isThesisScenarioKey,
  isValidScenarioKey,
  validateThesisFormIfRequired
} from '@/constants/intentApplyScenarios'
import IntentApplyThesisFields from '@/components/intent-apply/IntentApplyThesisFields.vue'
import IntentApplyKstFields from '@/components/intent-apply/IntentApplyKstFields.vue'
import IntentApplyProjectFields from '@/components/intent-apply/IntentApplyProjectFields.vue'
import IntentApplyAlgorithmFields from '@/components/intent-apply/IntentApplyAlgorithmFields.vue'
import { createEmptyProjectForm } from '@/constants/intentApplyProjectForm'
import { createEmptyAlgorithmForm } from '@/constants/intentApplyAlgorithmForm'
import IntentApplyCompetitionFields from '@/components/intent-apply/IntentApplyCompetitionFields.vue'
import { createEmptyCompetitionForm } from '@/constants/intentApplyCompetitionForm'
import IntentApplyKstExemptNotice from '@/components/intent-apply/IntentApplyKstExemptNotice.vue'
import { createEmptyKstForm } from '@/constants/intentApplyKstForm'
import { useIntentApplyKstExempt } from '@/composables/useIntentApplyKstExempt'
import {
  INTENT_APPLY_ATTACHMENT_ACCEPT_DESKTOP,
  INTENT_APPLY_ATTACHMENT_STAMP_NOTE
} from '@/constants/intentApplyAttachment'

const desktopAttachmentAccept = INTENT_APPLY_ATTACHMENT_ACCEPT_DESKTOP
import { useIntentApplyAttachment } from '@/composables/useIntentApplyAttachment'
import qrCodeImg from '@/assets/img/qr_code.jpg'

const applyScenarios = INTENT_APPLY_SCENARIOS

const router = useRouter()
const route = useRoute()
const authStore = useAuthStore()

const datasetTitle = ref((route.query.title as string) || '')
const datasetPublisher = ref((route.query.publisher as string) || '')
const datasetLevel = ref((route.query.level as string) || '')
const datasetLoading = ref(false)
const datasetLoadError = ref('')

function readQueryString(key: string): string {
  const q = route.query[key]
  if (typeof q === 'string') return q.trim()
  if (Array.isArray(q) && q[0]) return String(q[0]).trim()
  return ''
}

const datasetCstr = ref(readQueryString('cstr'))

function syncQueryFromRoute() {
  datasetCstr.value = readQueryString('cstr')
  const title = readQueryString('title')
  const publisher = readQueryString('publisher')
  const level = readQueryString('level')
  if (title) datasetTitle.value = title
  if (publisher) datasetPublisher.value = publisher
  if (level) datasetLevel.value = level
}

watch(() => route.query, syncQueryFromRoute, { deep: true })

let datasetFetchSeq = 0

async function fetchDatasetSummary() {
  const cstr = datasetCstr.value.trim()
  if (!cstr) {
    datasetLoadError.value = '缺少数据集标识（CSTR）'
    return
  }

  const seq = ++datasetFetchSeq
  datasetLoading.value = true
  datasetLoadError.value = ''

  try {
    const summary = await fetchDatasetSummaryByCstr(cstr)
    if (seq !== datasetFetchSeq) return
    if (!summary) {
      datasetLoadError.value = '未找到该数据集'
      return
    }
    datasetCstr.value = summary.cstr
    datasetTitle.value = summary.title
    datasetPublisher.value = summary.publisher
    datasetLevel.value = summary.level
  } catch (e: unknown) {
    if (seq !== datasetFetchSeq) return
    datasetLoadError.value =
      e instanceof Error ? e.message : '加载数据集信息失败，请稍后重试'
  } finally {
    if (seq === datasetFetchSeq) datasetLoading.value = false
  }
}

watch(datasetCstr, (cstr) => {
  if (cstr.trim()) void fetchDatasetSummary()
})

onMounted(() => {
  authStore.syncFromStorage()
  syncQueryFromRoute()
  void fetchDatasetSummary()
})

// 从 auth store 获取用户信息
const username = ref(authStore.user?.loginName || authStore.user?.openId || '')
const openId = ref(authStore.user?.openId || '')

const purposes = [
  { label: '学术研究', value: 'academic_research' },
  { label: '教学用途', value: 'teaching' }
]

const durations = [
  { label: '一个月', value: '1_month' },
  { label: '三个月', value: '3_month' },
  { label: '六个月', value: '6_month' },
  { label: '一年', value: '1_year' },
  { label: '其他', value: 'custom' }
]

const form = reactive({
  scenarioKey: '',
  kst: createEmptyKstForm(),
  project: createEmptyProjectForm(),
  algorithm: createEmptyAlgorithmForm(),
  competition: createEmptyCompetitionForm(),
  thesis: createEmptyThesisForm(),
  purpose: 'academic_research',
  customPurpose: '',
  description: '',
  usageMode: 'local',
  duration: '1_month',
  startDate: '',
  endDate: '',
  agreed: false
})

const showKstFields = computed(() => isKuaishutongScenarioKey(form.scenarioKey))
const showProjectFields = computed(() => isProjectScenarioKey(form.scenarioKey))
const showAlgorithmFields = computed(() => isAlgorithmScenarioKey(form.scenarioKey))
const showCompetitionFields = computed(() => isCompetitionScenarioKey(form.scenarioKey))
const showThesisFields = computed(() => isThesisScenarioKey(form.scenarioKey))

watch(
  () => form.scenarioKey,
  (key) => {
    if (!isKuaishutongScenarioKey(key)) {
      Object.assign(form.kst, createEmptyKstForm())
    }
    if (!isProjectScenarioKey(key)) {
      Object.assign(form.project, createEmptyProjectForm())
    }
    if (!isAlgorithmScenarioKey(key)) {
      Object.assign(form.algorithm, createEmptyAlgorithmForm())
    }
    if (!isCompetitionScenarioKey(key)) {
      Object.assign(form.competition, createEmptyCompetitionForm())
    }
    if (!isThesisScenarioKey(key)) {
      Object.assign(form.thesis, createEmptyThesisForm())
    }
  }
)

function getApplicantUidForUpload(): string {
  return resolveApplicantUidFromUser(authStore.user)
}

const {
  attachmentInputRef,
  attachmentFile,
  attachmentError,
  attachmentUploading,
  attachmentUploaded,
  attachmentFid,
  triggerPickAttachment,
  clearAttachment,
  onAttachmentChange,
  uploadCurrentFile
} = useIntentApplyAttachment({
  getApplicantUid: getApplicantUidForUpload,
  getScenarioType: () => {
    const type = getApplyTypeForScenarioKey(form.scenarioKey)
    return type === null ? '' : String(type)
  },
  scenarioRef: toRef(form, 'scenarioKey')
})

const isKuaishutongSelected = computed(() =>
  isKuaishutongScenarioKey(form.scenarioKey)
)

const { kstChecking, kstExempt } = useIntentApplyKstExempt({
  scenarioKey: toRef(form, 'scenarioKey'),
  getApplicantUid: getApplicantUidForUpload,
  onExempt: clearAttachment
})

const attachmentRequired = computed(() => !kstExempt.value)

const showSuccessToast = ref(false)
const showErrorToast = ref(false)
const errorMessage = ref('')
const submitting = ref(false)
const showWechatModal = ref(false)

/** 将前端 duration 映射为 deadline 数字 */
function mapDeadline(duration: string): number {
  const map: Record<string, number> = {
    '1_month': 1,
    '3_month': 3,
    '6_month': 6,
    '1_year': 12
  }
  return map[duration] || 0
}

function goBack() {
  router.push('/assets')
}

async function handleSubmit() {
  if (!form.agreed || submitting.value) return

  if (!datasetCstr.value) {
    errorMessage.value = '缺少数据集标识（CSTR），请从数据详情或数据速递列表重新发起申请'
    showErrorToast.value = true
    return
  }

  if (datasetLoading.value || datasetLoadError.value || !datasetTitle.value) {
    errorMessage.value = datasetLoadError.value || '数据集信息加载中，请稍候'
    showErrorToast.value = true
    return
  }

  if (!isValidScenarioKey(form.scenarioKey)) {
    errorMessage.value = '请选择应用场景'
    showErrorToast.value = true
    return
  }

  const thesisError = validateThesisFormIfRequired(form.scenarioKey, form.thesis)
  if (thesisError) {
    errorMessage.value = thesisError
    showErrorToast.value = true
    return
  }

  if (!form.description.trim()) {
    errorMessage.value = '请填写研究方向'
    showErrorToast.value = true
    return
  }

  const submitUid = getApplicantUidForUpload()
  if (!submitUid) {
    errorMessage.value = '缺少用户标识，请先登录后再上传附件'
    showErrorToast.value = true
    return
  }

  const skipAttachment = kstExempt.value
  if (isKuaishutongSelected.value && kstChecking.value) {
    errorMessage.value = '正在查询快数通认证状态，请稍候'
    showErrorToast.value = true
    return
  }

  if (!skipAttachment) {
    if (!attachmentFile.value) {
      errorMessage.value = '请上传附件'
      showErrorToast.value = true
      return
    }

    if (!attachmentUploaded.value) {
      const uploaded = await uploadCurrentFile()
      if (!uploaded) {
        errorMessage.value = attachmentError.value || '附件上传失败，请重试'
        showErrorToast.value = true
        return
      }
    }

    if (attachmentError.value) {
      errorMessage.value = attachmentError.value
      showErrorToast.value = true
      return
    }

    if (!attachmentFid.value.trim()) {
      errorMessage.value = '附件未上传成功，请重新选择文件'
      showErrorToast.value = true
      return
    }
  }

  submitting.value = true
  showErrorToast.value = false

  const payload = {
    username: username.value,
    openId: openId.value || submitUid,
    uid: submitUid,
    cstr: datasetCstr.value,
    ...(skipAttachment ? {} : { fid: attachmentFid.value.trim() }),
    applyType: getApplyTypeForScenarioKey(form.scenarioKey)!,
    purpose: form.customPurpose || form.purpose,
    description: form.description.trim(),
    method: form.usageMode,
    deadline: mapDeadline(form.duration),
    reason: '',
    ...getThesisFieldsForSubmit(form.scenarioKey, form.thesis)
  }

  try {
    const json = await submitIntentApplication(payload, attachmentFile.value, {
      alreadyUploaded: attachmentUploaded.value,
      fid: attachmentFid.value,
      skipAttachment
    })
    if (json.code === 200) {
      clearAttachment()
      // 提交成功
      showSuccessToast.value = true
      setTimeout(() => {
        showSuccessToast.value = false
        showWechatModal.value = true
      }, 2000)
    } else {
      throw new Error(json.message || '提交申请失败')
    }
  } catch (e: any) {
    errorMessage.value = e.message || '网络错误，请稍后重试'
    showErrorToast.value = true
  } finally {
    submitting.value = false
  }
}

function closeWechatModal() {
  showWechatModal.value = false
  router.push('/assets')
}
</script>

<style scoped>
.intent-apply-page {
  }

.animate-fade-in-up {
  animation: fadeInUp 0.3s ease-out;
}

@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(10px) scale(0.98);
  }
  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}
</style>
