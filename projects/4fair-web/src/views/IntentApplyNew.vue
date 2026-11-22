<template>
  <div
    class="intent-apply-new-page"
    :class="{ 'intent-apply-new-page--wechat': isWeChat }"
  >
    <div class="intent-apply-new-page__scroll">
      <div v-if="canShowApplyPage" class="intent-apply-new-page__card animate-fade-in-up">
        <!-- 头部 -->
        <header class="intent-apply-new-page__header">
          <h2 class="intent-apply-new-page__title">发起申请</h2>
        </header>

        <!-- 数据摘要（按 cstr 拉取） -->
        <section class="intent-apply-new-page__summary">
          <div class="intent-apply-new-page__summary-icon">
            <iconify-icon class="text-3xl text-white/80" icon="mdi:database"></iconify-icon>
          </div>
          <div class="min-w-0 flex-1">
            <p class="intent-apply-new-page__summary-label">数据摘要</p>
            <template v-if="datasetLoading">
              <p class="intent-apply-new-page__summary-title intent-apply-new-page__summary-title--muted">
                正在加载数据集信息…
              </p>
            </template>
            <template v-else-if="datasetLoadError">
              <p class="intent-apply-new-page__summary-title intent-apply-new-page__summary-title--err">
                {{ datasetLoadError }}
              </p>
            </template>
            <template v-else>
              <h3 class="intent-apply-new-page__summary-title">{{ datasetTitle }}</h3>
              <p class="intent-apply-new-page__summary-meta">
                提供方：{{ datasetPublisher }} · {{ datasetLevel }}
              </p>
            </template>
          </div>
        </section>

        <!-- 表单 -->
        <form v-if="canShowApplyForm" class="intent-apply-new-page__form" @submit.prevent="handleSubmit">
          <IntentApplyKstExemptNotice v-if="kstExempt" variant="h5" />

          <div class="intent-apply-new-page__section">
            <label class="intent-apply-new-page__label">
              应用场景 <span class="text-red-500">*</span>
            </label>
            <select
              v-model="form.scenarioKey"
              class="intent-apply-new-page__input intent-apply-new-page__select"
              required
            >
              <option value="" disabled>请选择</option>
              <option
                v-for="item in applyScenarios"
                :key="item.key"
                :value="item.key"
              >
                {{ item.label }}
              </option>
            </select>
          </div>

          <div v-if="showKstFields" class="intent-apply-new-page__section intent-apply-new-page__section--flush">
            <IntentApplyKstFields v-model="form.kst" variant="h5" />
          </div>

          <div v-if="showProjectFields" class="intent-apply-new-page__section intent-apply-new-page__section--flush">
            <IntentApplyProjectFields v-model="form.project" variant="h5" />
          </div>

          <div v-if="showAlgorithmFields" class="intent-apply-new-page__section intent-apply-new-page__section--flush">
            <IntentApplyAlgorithmFields v-model="form.algorithm" variant="h5" />
          </div>

          <div v-if="showCompetitionFields" class="intent-apply-new-page__section intent-apply-new-page__section--flush">
            <IntentApplyCompetitionFields v-model="form.competition" variant="h5" />
          </div>

          <div v-if="showThesisFields" class="intent-apply-new-page__section intent-apply-new-page__section--flush">
            <IntentApplyThesisFields v-model="form.thesis" variant="h5" />
          </div>

          <div class="intent-apply-new-page__section">
            <label class="intent-apply-new-page__label">
              上传附件 <span v-if="attachmentRequired" class="text-red-500">*</span>
            </label>
            <p
              v-if="isKuaishutongSelected && kstChecking"
              class="intent-apply-new-page__upload-hint"
            >
              正在查询快数通认证状态…
            </p>
            <template v-else-if="!kstExempt">
            <!-- 微信 H5：分文件/图片/任意，避免 iOS 只弹出相册 -->
            <input
              ref="attachmentInputDocRef"
              type="file"
              class="hidden"
              :accept="wechatDocAccept"
              @change="onAttachmentChange"
            />
            <input
              ref="attachmentInputImageRef"
              type="file"
              class="hidden"
              :accept="wechatImageAccept"
              @change="onAttachmentChange"
            />
            <input
              ref="attachmentInputRef"
              type="file"
              class="hidden"
              :accept="wechatAnyAccept"
              @change="onAttachmentChange"
            />
            <button
              type="button"
              class="intent-apply-new-page__upload-btn"
              :disabled="attachmentUploading"
              @click="triggerPickAttachment"
            >
              <iconify-icon
                v-if="attachmentUploading"
                class="animate-spin text-lg"
                icon="mdi:loading"
              ></iconify-icon>
              <iconify-icon v-else icon="mdi:paperclip" class="text-lg"></iconify-icon>
              <span>{{ attachmentUploading ? '正在上传…' : attachmentFile ? '重新选择' : '选择文件' }}</span>
            </button>
            <p v-if="attachmentFile" class="intent-apply-new-page__attachment-name">
              <span class="min-w-0 truncate">{{ attachmentFile.name }}</span>
              <button
                type="button"
                class="intent-apply-new-page__attachment-remove"
                :disabled="attachmentUploading"
                @click="clearAttachment"
              >
                移除
              </button>
            </p>
            <p v-if="attachmentUploading" class="intent-apply-new-page__attachment-ok">正在上传附件，请稍候…</p>
            <p v-else-if="attachmentUploaded" class="intent-apply-new-page__attachment-ok">附件已上传</p>
            <p v-if="attachmentError" class="intent-apply-new-page__attachment-err">{{ attachmentError }}</p>
            <p class="intent-apply-new-page__upload-hint intent-apply-new-page__upload-hint--stamp">
              {{ INTENT_APPLY_ATTACHMENT_STAMP_NOTE }}
            </p>
            <p class="intent-apply-new-page__upload-hint">
              选择后将自动上传；仅 1 个文件，不超过 30MB。微信内请点「文档/文件」从聊天或手机存储选取。
            </p>
            </template>
          </div>

          <div class="intent-apply-new-page__section">
            <label class="intent-apply-new-page__label">
              使用目的 <span class="text-red-500">*</span>
            </label>
            <div class="intent-apply-new-page__option-grid">
              <label
                v-for="purpose in purposes"
                :key="purpose.value"
                class="intent-apply-new-page__option"
                :class="{ 'intent-apply-new-page__option--active': form.purpose === purpose.value }"
              >
                <input
                  type="radio"
                  class="intent-apply-new-page__radio"
                  :value="purpose.value"
                  v-model="form.purpose"
                />
                <span>{{ purpose.label }}</span>
              </label>
            </div>

            <label class="intent-apply-new-page__sub-label">其他用途</label>
            <input
              v-model="form.customPurpose"
              type="text"
              class="intent-apply-new-page__input"
              placeholder="请填写您的具体使用目的..."
              enterkeyhint="done"
            />

            <label class="intent-apply-new-page__sub-label">
              研究方向 <span class="text-red-500">*</span>
            </label>
            <textarea
              v-model="form.description"
              class="intent-apply-new-page__textarea"
              placeholder="请输入研究方向"
              rows="3"
              required
            ></textarea>

            <p class="intent-apply-new-page__hint">
              <iconify-icon icon="mdi:information-outline" class="shrink-0 text-blue-500"></iconify-icon>
              <span>选择使用目的后，系统将自动生成申请理由，您也可在上方填写研究方向。</span>
            </p>
          </div>

          <div class="intent-apply-new-page__section">
            <label class="intent-apply-new-page__label">
              数据使用方式 <span class="text-red-500">*</span>
            </label>
            <div class="intent-apply-new-page__stack">
              <label
                class="intent-apply-new-page__option intent-apply-new-page__option--block"
                :class="{ 'intent-apply-new-page__option--active': form.usageMode === 'local' }"
              >
                <input type="radio" class="intent-apply-new-page__radio" value="local" v-model="form.usageMode" />
                <span>下载至本地离线分析</span>
              </label>
              <label
                class="intent-apply-new-page__option intent-apply-new-page__option--block"
                :class="{ 'intent-apply-new-page__option--active': form.usageMode === 'sandbox' }"
              >
                <input type="radio" class="intent-apply-new-page__radio" value="sandbox" v-model="form.usageMode" />
                <span>使用平台安全沙箱分析</span>
              </label>
            </div>
          </div>

          <div class="intent-apply-new-page__section">
            <label class="intent-apply-new-page__label">
              申请时长 <span class="text-red-500">*</span>
            </label>
            <div class="intent-apply-new-page__duration-grid">
              <label
                v-for="duration in durations"
                :key="duration.value"
                class="intent-apply-new-page__option intent-apply-new-page__option--duration"
                :class="{ 'intent-apply-new-page__option--active': form.duration === duration.value }"
              >
                <input
                  type="radio"
                  class="intent-apply-new-page__radio"
                  :value="duration.value"
                  v-model="form.duration"
                />
                <span>{{ duration.label }}</span>
              </label>
            </div>

            <div v-if="form.duration === 'custom'" class="intent-apply-new-page__date-grid">
              <div>
                <label class="intent-apply-new-page__sub-label">开始日期</label>
                <input v-model="form.startDate" type="date" class="intent-apply-new-page__input" />
              </div>
              <div>
                <label class="intent-apply-new-page__sub-label">结束日期</label>
                <input v-model="form.endDate" type="date" class="intent-apply-new-page__input" />
              </div>
            </div>
          </div>

          <label class="intent-apply-new-page__agree">
            <input v-model="form.agreed" type="checkbox" class="intent-apply-new-page__checkbox" />
            <span>
              我确认以上信息真实有效，并同意将联系方式、机构背景等必要信息披露给数据提供方，以便其进行合规性审核。
            </span>
          </label>

          <!-- 占位：避免内容被底部按钮遮挡 -->
          <div class="intent-apply-new-page__form-spacer" aria-hidden="true"></div>
        </form>
      </div>
    </div>

    <!-- 底部固定操作栏（手机 / 微信） -->
    <footer v-if="canShowApplyForm" class="intent-apply-new-page__footer">
      <button type="button" class="intent-apply-new-page__btn intent-apply-new-page__btn--ghost" @click="goBack">
        取消
      </button>
      <button
        type="button"
        class="intent-apply-new-page__btn intent-apply-new-page__btn--primary"
        :disabled="!form.agreed || submitting"
        @click="handleSubmit"
      >
        <iconify-icon v-if="submitting" class="animate-spin" icon="mdi:loading"></iconify-icon>
        {{ submitting ? '提交中...' : '提交申请' }}
      </button>
    </footer>

    <!-- Toast -->
    <div v-if="showSuccessToast" class="intent-apply-new-page__toast intent-apply-new-page__toast--ok">
      <iconify-icon icon="mdi:check-circle"></iconify-icon>
      <span>提交成功</span>
    </div>
    <div
      v-if="showErrorToast"
      class="intent-apply-new-page__toast intent-apply-new-page__toast--err"
      @click="showErrorToast = false"
    >
      <iconify-icon icon="mdi:alert-circle"></iconify-icon>
      <span>{{ errorMessage }}</span>
    </div>

    <!-- 微信授权中 -->
    <div
      v-if="oauthBusy()"
      class="intent-apply-new-page__oauth-loading"
      aria-live="polite"
    >
      <iconify-icon class="animate-spin text-3xl text-green-600" icon="mdi:loading"></iconify-icon>
      <p class="intent-apply-new-page__oauth-loading-text">
        {{
          oauthPhase === 'redirecting'
            ? '正在跳转微信授权…'
            : oauthPhase === 'exchanging'
              ? '正在校验身份…'
              : oauthPhase === 'binding'
                ? '正在绑定用户…'
                : '正在获取微信授权…'
        }}
      </p>
    </div>

    <!-- 校验失败 -->
    <Teleport to="body">
      <div
        v-if="showVerifyFailModal"
        class="oauth-code-modal"
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="intent-verify-fail-title"
        @click.self="closeVerifyFailModal"
      >
        <div class="oauth-code-modal__panel" @click.stop>
          <div class="oauth-code-modal__head">
            <iconify-icon class="text-3xl text-red-500" icon="mdi:alert-circle-outline"></iconify-icon>
            <h2 id="intent-verify-fail-title" class="oauth-code-modal__title">校验失败</h2>
            <p class="oauth-code-modal__subtitle">{{ verifyFailMessage }}</p>
          </div>
          <div class="oauth-code-modal__actions">
            <button type="button" class="oauth-code-modal__btn oauth-code-modal__btn--primary w-full" @click="closeVerifyFailModal">
              知道了
            </button>
          </div>
        </div>
      </div>
    </Teleport>

    <!-- 公众号引导（微信内：长按识别；非微信：扫码） -->
    <div
      v-if="showWechatModal"
      class="intent-apply-new-page__overlay"
      @click="closeWechatModal"
    >
      <div class="intent-apply-new-page__modal" @click.stop>
        <div class="intent-apply-new-page__modal-head">
          <h3 class="intent-apply-new-page__modal-title">
            {{ isWeChat ? '关注「费尔空间」公众号' : '请微信扫码关注「费尔空间」公众号' }}
          </h3>
        </div>
        <div class="intent-apply-new-page__modal-body">
          <img :src="qrCodeImg" alt="费尔空间公众号" class="intent-apply-new-page__qr" />
          <p class="intent-apply-new-page__modal-tip">
            {{
              isWeChat
                ? '长按识别二维码关注公众号，审批结果将推送至微信'
                : '扫码关注后，审批消息会自动推送至微信'
            }}
          </p>
        </div>
        <button type="button" class="intent-apply-new-page__btn intent-apply-new-page__btn--ghost w-full" @click="closeWechatModal">
          知道了
        </button>
      </div>
    </div>

    <!-- 微信内选择附件方式 -->
    <div
      v-if="showWechatPickMenu"
      class="intent-apply-new-page__pick-mask"
      @click.self="closeWechatPickMenu"
    >
      <div class="intent-apply-new-page__pick-sheet" role="dialog" aria-label="选择附件">
        <p class="intent-apply-new-page__pick-title">选择附件来源</p>
        <button
          type="button"
          class="intent-apply-new-page__pick-item"
          @click="pickWechatDocument"
        >
          文档 / 文件（PDF、Word 等）
        </button>
        <button
          type="button"
          class="intent-apply-new-page__pick-item"
          @click="pickWechatAnyFile"
        >
          从微信聊天或手机存储选择
        </button>
        <button
          type="button"
          class="intent-apply-new-page__pick-item"
          @click="pickWechatImage"
        >
          图片（相册 / 拍照）
        </button>
        <button
          type="button"
          class="intent-apply-new-page__pick-item intent-apply-new-page__pick-item--cancel"
          @click="closeWechatPickMenu"
        >
          取消
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, watch, onMounted, computed, toRef } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { isWeChatBrowser } from '@/utils/wechatOAuth'
import type { IntentApplyQuery } from '@/utils/intentApply'
import { fetchDatasetSummaryByCstr } from '@/utils/datasetSummary'
import { submitIntentApplication } from '@/utils/intentApplySubmit'
import { resolveApplicantUid } from '@/utils/resolveApplicantUid'
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
  INTENT_APPLY_ATTACHMENT_ACCEPT_WECHAT_ANY,
  INTENT_APPLY_ATTACHMENT_ACCEPT_WECHAT_DOC,
  INTENT_APPLY_ATTACHMENT_ACCEPT_WECHAT_IMAGE,
  INTENT_APPLY_ATTACHMENT_STAMP_NOTE
} from '@/constants/intentApplyAttachment'
import { useIntentApplyAttachment } from '@/composables/useIntentApplyAttachment'
import { useIntentApplyWechatOAuth } from '@/composables/useIntentApplyWechatOAuth'
import qrCodeImg from '@/assets/img/qr_code.jpg'

const applyScenarios = INTENT_APPLY_SCENARIOS

const router = useRouter()
const route = useRoute()
const authStore = useAuthStore()

const isWeChat = computed(() => isWeChatBrowser())

const datasetTitle = ref('')
const datasetPublisher = ref('')
const datasetLevel = ref('')
const datasetLoading = ref(false)
const datasetLoadError = ref('')

function readQueryString(key: string): string {
  const q = route.query[key]
  if (typeof q === 'string') return q.trim()
  if (Array.isArray(q) && q[0]) return String(q[0]).trim()
  return ''
}

const datasetCstr = ref(readQueryString('cstr'))
const uidParam = ref(readQueryString('uid') || authStore.user?.uid || '')

function syncQueryParams() {
  datasetCstr.value = readQueryString('cstr')
  const qUid = readQueryString('uid')
  if (qUid) uidParam.value = qUid
  else if (!uidParam.value) {
    uidParam.value = resolveApplicantUid(
      authStore.user?.uid,
      authStore.user?.openId,
      authStore.user?.id
    )
  }

  const title = readQueryString('title')
  const publisher = readQueryString('publisher')
  const level = readQueryString('level')
  if (title) datasetTitle.value = title
  if (publisher) datasetPublisher.value = publisher
  if (level) datasetLevel.value = level
}

watch(() => route.query, syncQueryParams, { deep: true })

let datasetFetchSeq = 0

async function fetchDatasetSummary() {
  const cstr = datasetCstr.value.trim()
  if (!cstr) {
    datasetLoadError.value = '缺少数据集标识（CSTR），请重新扫码'
    datasetTitle.value = ''
    datasetPublisher.value = ''
    datasetLevel.value = ''
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
    if (!datasetTitle.value) {
      const title = readQueryString('title')
      const publisher = readQueryString('publisher')
      const level = readQueryString('level')
      if (title) datasetTitle.value = title
      if (publisher) datasetPublisher.value = publisher
      if (level) datasetLevel.value = level
    }
  } finally {
    if (seq === datasetFetchSeq) {
      datasetLoading.value = false
    }
  }
}

const username = ref(authStore.user?.loginName || authStore.user?.openId || '')
const openId = ref(authStore.user?.openId || authStore.user?.uid || uidParam.value)

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

const showSuccessToast = ref(false)
const showErrorToast = ref(false)
const errorMessage = ref('')
const submitting = ref(false)
const showWechatModal = ref(false)

function onOAuthParamsRestored(params: IntentApplyQuery) {
  uidParam.value = params.uid
  datasetCstr.value = params.cstr
  if (params.title) datasetTitle.value = params.title
  if (params.publisher) datasetPublisher.value = params.publisher
  if (params.level) datasetLevel.value = params.level
  void fetchDatasetSummary()
}

function onOAuthOpenIdReady(oid: string) {
  openId.value = oid
}

function isOAuthDisabled(): boolean {
  const q = route.query.wx_auth
  if (q === '0' || q === 'false') return true
  if (Array.isArray(q) && (q[0] === '0' || q[0] === 'false')) return true
  return false
}

const {
  phase: oauthPhase,
  wechatOpenId,
  showVerifyFailModal,
  verifyFailMessage,
  oauthBusy,
  oauthVerified,
  applyAccessDenied,
  closeVerifyFailModal,
  initWechatOAuth
} = useIntentApplyWechatOAuth({
  getApplyParams,
  onParamsRestored: onOAuthParamsRestored,
  onOpenIdReady: onOAuthOpenIdReady
})

function getApplicantUidForUpload(): string {
  return resolveApplicantUid(
    uidParam.value,
    wechatOpenId.value,
    openId.value,
    authStore.user?.uid,
    authStore.user?.openId,
    authStore.user?.id
  )
}

function getApplyParams(): IntentApplyQuery {
  return {
    uid: getApplicantUidForUpload(),
    cstr: datasetCstr.value,
    title: datasetTitle.value,
    publisher: datasetPublisher.value,
    level: datasetLevel.value
  }
}

const wechatDocAccept = INTENT_APPLY_ATTACHMENT_ACCEPT_WECHAT_DOC
const wechatImageAccept = INTENT_APPLY_ATTACHMENT_ACCEPT_WECHAT_IMAGE
const wechatAnyAccept = INTENT_APPLY_ATTACHMENT_ACCEPT_WECHAT_ANY

const {
  attachmentInputRef,
  attachmentInputDocRef,
  attachmentInputImageRef,
  attachmentFile,
  attachmentError,
  attachmentUploading,
  attachmentUploaded,
  attachmentFid,
  showWechatPickMenu,
  triggerPickAttachment,
  pickWechatDocument,
  pickWechatImage,
  pickWechatAnyFile,
  closeWechatPickMenu,
  clearAttachment,
  onAttachmentChange,
  uploadCurrentFile
} = useIntentApplyAttachment({
  getApplicantUid: getApplicantUidForUpload,
  getScenarioType: () => {
    const type = getApplyTypeForScenarioKey(form.scenarioKey)
    return type === null ? '' : String(type)
  },
  scenarioRef: toRef(form, 'scenarioKey'),
  wechatPickMenu: true
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

/** 仅微信扫码页：非微信环境不展示；微信内须完成绑定校验 */
const canShowApplyPage = computed(() => {
  if (!isWeChat.value) return false
  if (applyAccessDenied()) return false
  if (isOAuthDisabled()) return true
  return oauthVerified()
})

const canShowApplyForm = computed(() => canShowApplyPage.value && !datasetLoadError.value)

watch(datasetCstr, (cstr) => {
  if (cstr.trim()) void fetchDatasetSummary()
})

watch(oauthPhase, (p) => {
  if (p === 'ready' && datasetCstr.value.trim()) {
    void fetchDatasetSummary()
  }
})

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
  if (window.history.length > 1) {
    router.back()
  } else {
    router.push(isWeChat.value ? '/' : '/assets')
  }
}

async function handleSubmit() {
  if (!form.agreed || submitting.value) return

  if (isWeChat.value && !oauthVerified()) {
    errorMessage.value = '请先完成微信身份校验后再提交'
    showErrorToast.value = true
    return
  }

  const submitUid = getApplicantUidForUpload()
  if (!submitUid) {
    errorMessage.value =
      '缺少用户标识，请通过详情页二维码进入，或先完成微信授权/登录'
    showErrorToast.value = true
    return
  }

  if (!datasetCstr.value) {
    errorMessage.value = '缺少数据集标识（CSTR），请从数据详情页重新进入'
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
    openId: openId.value || wechatOpenId.value || submitUid,
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
      showSuccessToast.value = true
      setTimeout(() => {
        showSuccessToast.value = false
        showWechatModal.value = true
      }, 1500)
    } else {
      throw new Error(json.message || '提交申请失败')
    }
  } catch (e: unknown) {
    errorMessage.value = e instanceof Error ? e.message : '网络错误，请稍后重试'
    showErrorToast.value = true
  } finally {
    submitting.value = false
  }
}

function closeWechatModal() {
  showWechatModal.value = false
  goBack()
}

onMounted(() => {
  authStore.syncFromStorage()
  syncQueryParams()
  if (!readQueryString('uid') && !uidParam.value.trim()) {
    const resolved = resolveApplicantUid(
      authStore.user?.uid,
      authStore.user?.openId,
      authStore.user?.id
    )
    if (resolved) uidParam.value = resolved
  }
  void fetchDatasetSummary()
  void initWechatOAuth()
})
</script>

<style scoped>
.intent-apply-new-page {
  position: fixed;
  inset: 0;
  width: 100%;
  height: 100%;
  height: 100dvh;
  background: #fff;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.intent-apply-new-page--wechat {
  background: #fff;
}

.intent-apply-new-page__scroll {
  flex: 1 1 auto;
  min-height: 0;
  overflow-x: hidden;
  overflow-y: auto;
  -webkit-overflow-scrolling: touch;
  overscroll-behavior-y: contain;
  padding-top: env(safe-area-inset-top, 0);
}

.intent-apply-new-page__card {
  width: 100%;
  max-width: none;
  margin: 0;
  background: #fff;
  border-radius: 0;
  box-shadow: none;
}

.intent-apply-new-page__header {
  padding: 14px 16px;
  border-bottom: 1px solid #e2e8f0;
  background: #fff;
}

.intent-apply-new-page__title {
  font-size: 1.0625rem;
  font-weight: 700;
  color: #1e293b;
  margin: 0;
}

.intent-apply-new-page__summary {
  display: flex;
  gap: 12px;
  padding: 16px;
  background: #f8fafc;
  border-bottom: 1px solid #e2e8f0;
}

.intent-apply-new-page__summary-icon {
  width: 56px;
  height: 56px;
  border-radius: 0;
  background: linear-gradient(135deg, #3b82f6, #4f46e5);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.intent-apply-new-page__summary-label {
  font-size: 0.6875rem;
  font-weight: 700;
  color: #2563eb;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  margin-bottom: 4px;
}

.intent-apply-new-page__summary-title {
  font-size: 0.875rem;
  font-weight: 700;
  color: #1e293b;
  line-height: 1.4;
  word-break: break-word;
}

.intent-apply-new-page__summary-title--muted {
  font-weight: 500;
  color: #64748b;
}

.intent-apply-new-page__summary-title--err {
  font-weight: 500;
  color: #b45309;
}

.intent-apply-new-page__summary-meta {
  font-size: 0.75rem;
  color: #64748b;
  margin-top: 4px;
  line-height: 1.5;
}

.intent-apply-new-page__form {
  padding: 16px;
}

.intent-apply-new-page__section {
  margin-bottom: 24px;
}

.intent-apply-new-page__label {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 0.875rem;
  font-weight: 700;
  color: #334155;
  margin-bottom: 12px;
}

.intent-apply-new-page__sub-label {
  display: block;
  font-size: 0.75rem;
  font-weight: 500;
  color: #64748b;
  margin: 12px 0 6px;
}

.intent-apply-new-page__input,
.intent-apply-new-page__textarea {
  width: 100%;
  padding: 12px 14px;
  font-size: 16px;
  line-height: 1.5;
  color: #1e293b;
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 0;
  outline: none;
  -webkit-appearance: none;
  appearance: none;
}

.intent-apply-new-page__input:focus,
.intent-apply-new-page__textarea:focus,
.intent-apply-new-page__select:focus {
  border-color: #3b82f6;
  box-shadow: none;
}

.intent-apply-new-page__select {
  appearance: none;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%2364748b' stroke-width='2'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E");
  background-repeat: no-repeat;
  background-position: right 12px center;
  padding-right: 36px;
}

.intent-apply-new-page__upload-btn {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  width: 100%;
  min-height: 48px;
  padding: 12px 14px;
  font-size: 0.875rem;
  color: #334155;
  background: #f8fafc;
  border: 1px dashed #cbd5e1;
  cursor: pointer;
}

.intent-apply-new-page__upload-hint {
  margin-top: 8px;
  font-size: 0.75rem;
  color: #94a3b8;
}

.intent-apply-new-page__upload-hint--stamp {
  color: #b45309;
}

.intent-apply-new-page__attachment-name {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  margin-top: 8px;
  padding: 10px 12px;
  font-size: 0.8125rem;
  color: #334155;
  background: #f1f5f9;
  border: 1px solid #e2e8f0;
}

.intent-apply-new-page__attachment-remove {
  flex-shrink: 0;
  font-size: 0.75rem;
  color: #2563eb;
  background: none;
  border: none;
  cursor: pointer;
}

.intent-apply-new-page__attachment-ok {
  margin-top: 6px;
  font-size: 0.75rem;
  color: #16a34a;
}

.intent-apply-new-page__attachment-err {
  margin-top: 6px;
  font-size: 0.75rem;
  color: #b45309;
}

.intent-apply-new-page__upload-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.intent-apply-new-page__pick-mask {
  position: fixed;
  inset: 0;
  z-index: 200;
  display: flex;
  align-items: flex-end;
  background: rgba(15, 23, 42, 0.45);
}

.intent-apply-new-page__pick-sheet {
  width: 100%;
  padding: 12px 12px calc(12px + env(safe-area-inset-bottom, 0px));
  background: #f8fafc;
  border-radius: 16px 16px 0 0;
}

.intent-apply-new-page__pick-title {
  margin: 4px 8px 10px;
  font-size: 0.8125rem;
  color: #64748b;
  text-align: center;
}

.intent-apply-new-page__pick-item {
  display: block;
  width: 100%;
  margin-bottom: 8px;
  padding: 14px 16px;
  font-size: 1rem;
  color: #0f172a;
  text-align: center;
  background: #fff;
  border: none;
  border-radius: 12px;
  cursor: pointer;
}

.intent-apply-new-page__pick-item--cancel {
  margin-top: 4px;
  color: #64748b;
  background: transparent;
}

.intent-apply-new-page__textarea {
  resize: vertical;
  min-height: 88px;
}

.intent-apply-new-page__option-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px;
}

.intent-apply-new-page__stack {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.intent-apply-new-page__duration-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 10px;
}

@media (min-width: 400px) {
  .intent-apply-new-page__duration-grid {
    grid-template-columns: repeat(3, 1fr);
  }
}

.intent-apply-new-page__option {
  display: flex;
  align-items: center;
  gap: 10px;
  min-height: 48px;
  padding: 12px 14px;
  border: 1px solid #e2e8f0;
  border-radius: 0;
  background: #fff;
  font-size: 0.875rem;
  color: #334155;
  cursor: pointer;
  -webkit-tap-highlight-color: transparent;
  user-select: none;
}

.intent-apply-new-page__option--block {
  width: 100%;
}

.intent-apply-new-page__option--duration {
  justify-content: center;
  flex-direction: column;
  gap: 6px;
  text-align: center;
  padding: 10px 8px;
}

.intent-apply-new-page__option--active {
  border-color: #60a5fa;
  background: #eff6ff;
  color: #1d4ed8;
}

.intent-apply-new-page__radio,
.intent-apply-new-page__checkbox {
  width: 18px;
  height: 18px;
  flex-shrink: 0;
  accent-color: #2563eb;
}

.intent-apply-new-page__hint {
  display: flex;
  gap: 8px;
  align-items: flex-start;
  margin-top: 12px;
  padding: 12px;
  font-size: 0.75rem;
  line-height: 1.5;
  color: #64748b;
  background: #eff6ff;
  border-radius: 0;
  border: 1px solid #dbeafe;
}

.intent-apply-new-page__date-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
  margin-top: 12px;
}

.intent-apply-new-page__agree {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  font-size: 0.75rem;
  line-height: 1.6;
  color: #64748b;
  cursor: pointer;
  -webkit-tap-highlight-color: transparent;
}

.intent-apply-new-page__form-spacer {
  height: 16px;
}

.intent-apply-new-page__footer {
  flex-shrink: 0;
  display: flex;
  gap: 0;
  padding: 0;
  padding-bottom: env(safe-area-inset-bottom, 0);
  background: #fff;
  border-top: 1px solid #e2e8f0;
}

.intent-apply-new-page__btn {
  flex: 1;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  min-height: 52px;
  padding: 0 16px;
  font-size: 1rem;
  font-weight: 700;
  border-radius: 0;
  border: none;
  -webkit-tap-highlight-color: transparent;
}

.intent-apply-new-page__btn--ghost {
  color: #475569;
  background: #fff;
  border: none;
  border-right: 1px solid #e2e8f0;
}

.intent-apply-new-page__btn--primary {
  color: #fff;
  background: #2563eb;
  box-shadow: none;
}

.intent-apply-new-page__btn--primary:disabled {
  opacity: 0.5;
}

.intent-apply-new-page__toast {
  position: fixed;
  top: max(16px, env(safe-area-inset-top, 0));
  left: 50%;
  transform: translateX(-50%);
  z-index: 60;
  display: flex;
  align-items: center;
  gap: 8px;
  max-width: calc(100vw - 32px);
  padding: 12px 16px;
  font-size: 0.875rem;
  color: #fff;
  border-radius: 0;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.12);
}

.intent-apply-new-page__toast--ok {
  background: #10b981;
}

.intent-apply-new-page__toast--err {
  background: #ef4444;
}

.intent-apply-new-page__overlay {
  position: fixed;
  inset: 0;
  z-index: 50;
  display: flex;
  align-items: flex-end;
  justify-content: center;
  padding: 0;
  background: rgba(0, 0, 0, 0.5);
}

@media (min-width: 640px) {
  .intent-apply-new-page__overlay {
    align-items: center;
    padding: 16px;
  }
}

.intent-apply-new-page__modal {
  width: 100%;
  max-width: 24rem;
  padding: 20px;
  padding-bottom: max(20px, env(safe-area-inset-bottom, 0));
  background: #fff;
  border-radius: 0;
}

@media (min-width: 640px) {
  .intent-apply-new-page__modal {
    padding-bottom: 20px;
  }
}

.intent-apply-new-page__modal-head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 16px;
}

.intent-apply-new-page__modal-title {
  font-size: 1rem;
  font-weight: 700;
  line-height: 1.4;
  color: #0f172a;
}

.intent-apply-new-page__modal-body {
  text-align: center;
  margin-bottom: 16px;
}

.intent-apply-new-page__qr {
  width: min(12rem, 70vw);
  height: min(12rem, 70vw);
  margin: 0 auto 12px;
  object-fit: cover;
  border-radius: 0;
}

.intent-apply-new-page__modal-tip {
  font-size: 0.875rem;
  line-height: 1.5;
  color: #64748b;
}

.intent-apply-new-page__oauth-loading {
  position: fixed;
  inset: 0;
  z-index: 55;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 12px;
  background: rgba(255, 255, 255, 0.92);
}

.intent-apply-new-page__oauth-loading-text {
  font-size: 0.875rem;
  color: #64748b;
}

.oauth-code-modal {
  position: fixed;
  inset: 0;
  z-index: 1000;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1.25rem;
  background: rgba(15, 23, 42, 0.55);
  backdrop-filter: blur(4px);
}

.oauth-code-modal__panel {
  width: 100%;
  max-width: 22rem;
  background: #fff;
  border-radius: 0;
  box-shadow: 0 8px 24px rgba(15, 23, 42, 0.15);
  overflow: hidden;
  animation: oauth-modal-in 0.28s ease-out;
}

@keyframes oauth-modal-in {
  from {
    opacity: 0;
    transform: scale(0.94) translateY(8px);
  }
  to {
    opacity: 1;
    transform: scale(1) translateY(0);
  }
}

.oauth-code-modal__head {
  padding: 1.25rem 1.25rem 0.75rem;
  text-align: center;
}

.oauth-code-modal__title {
  margin-top: 0.5rem;
  font-size: 1.125rem;
  font-weight: 700;
  color: #0f172a;
}

.oauth-code-modal__subtitle {
  margin-top: 0.25rem;
  font-size: 0.8125rem;
  color: #64748b;
}

.oauth-code-modal__body {
  padding: 0.75rem 1.25rem 1rem;
}

.oauth-code-modal__label {
  font-size: 0.75rem;
  font-weight: 600;
  color: #64748b;
}

.oauth-code-modal__code {
  margin-top: 0.375rem;
  padding: 0.75rem;
  font-size: 0.8125rem;
  line-height: 1.5;
  word-break: break-all;
  color: #0f172a;
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 0;
  user-select: all;
}

.oauth-code-modal__code--sm {
  font-size: 0.75rem;
}

.oauth-code-modal__hint {
  margin-top: 0.5rem;
  font-size: 0.75rem;
  color: #94a3b8;
}

.oauth-code-modal__copy-hint {
  margin-top: 0.375rem;
  font-size: 0.75rem;
  color: #16a34a;
}

.oauth-code-modal__warn {
  margin-top: 0.25rem;
  font-size: 0.75rem;
  line-height: 1.5;
  color: #b45309;
}

.oauth-code-modal__err-block {
  margin-top: 0.75rem;
  padding: 0.75rem;
  background: #fffbeb;
  border: 1px solid #fcd34d;
}

.oauth-code-modal__err-step {
  font-size: 0.8125rem;
  font-weight: 600;
  line-height: 1.5;
  color: #92400e;
}

.oauth-code-modal__actions {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  padding: 0 1.25rem 1.25rem;
}

.oauth-code-modal__actions .oauth-code-modal__btn {
  min-width: calc(50% - 0.25rem);
}

.oauth-code-modal__actions .oauth-code-modal__btn.w-full {
  min-width: 100%;
}

.oauth-code-modal__btn {
  flex: 1;
  padding: 0.625rem 1rem;
  font-size: 0.875rem;
  font-weight: 600;
  border-radius: 0;
  border: none;
  cursor: pointer;
}

.oauth-code-modal__btn--secondary {
  color: #334155;
  background: #f1f5f9;
}

.oauth-code-modal__btn--primary {
  color: #fff;
  background: linear-gradient(135deg, #16a34a 0%, #059669 100%);
}

.animate-fade-in-up {
  animation: fadeInUp 0.3s ease-out;
}

@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes spin {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

.animate-spin {
  animation: spin 1s linear infinite;
}
</style>

