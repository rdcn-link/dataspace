import { ref, watch, type Ref } from 'vue'
import {
  INTENT_APPLY_ATTACHMENT_MAX_BYTES,
  parseApplyScenarioType
} from '@/constants/intentApplyScenarios'
import {
  isAllowedIntentApplyAttachmentName,
  intentApplyAttachmentTypeHint
} from '@/constants/intentApplyAttachment'
import { isValidApplyScenario } from '@/utils/resolveApplicantUid'
import {
  extractUploadFid,
  uploadIntentApplicationFile
} from '@/utils/intentApplySubmit'
import { isWeChatBrowser } from '@/utils/wechatOAuth'

export function useIntentApplyAttachment(options: {
  getApplicantUid: () => string
  getScenarioType: () => string
  /** 应用场景变更且已选文件时尝试补传 */
  scenarioRef: Ref<string>
  /** 微信 H5：弹出「文件 / 图片」选择，避免只出现相册 */
  wechatPickMenu?: boolean
}) {
  const attachmentInputRef = ref<HTMLInputElement | null>(null)
  const attachmentInputDocRef = ref<HTMLInputElement | null>(null)
  const attachmentInputImageRef = ref<HTMLInputElement | null>(null)
  const showWechatPickMenu = ref(false)
  const attachmentFile = ref<File | null>(null)
  const attachmentError = ref('')
  const attachmentUploading = ref(false)
  const attachmentUploaded = ref(false)
  /** 上传接口返回的 data，提交 order.save 时作为 fid */
  const attachmentFid = ref('')

  function resetUploadState() {
    attachmentUploaded.value = false
    attachmentFid.value = ''
  }

  function clearAttachment() {
    attachmentFile.value = null
    attachmentError.value = ''
    resetUploadState()
    if (attachmentInputRef.value) attachmentInputRef.value.value = ''
    if (attachmentInputDocRef.value) attachmentInputDocRef.value.value = ''
    if (attachmentInputImageRef.value) attachmentInputImageRef.value.value = ''
  }

  function closeWechatPickMenu() {
    showWechatPickMenu.value = false
  }

  function validateBeforeUpload(): boolean {
    const uid = options.getApplicantUid().trim()
    if (!uid) {
      attachmentError.value = '缺少用户标识，无法上传'
      return false
    }
    const type = options.getScenarioType()
    if (!isValidApplyScenario(type)) {
      attachmentError.value = '请先选择应用场景'
      return false
    }
    return true
  }

  function triggerPickAttachment() {
    if (!validateBeforeUpload()) return
    attachmentError.value = ''
    if (options.wechatPickMenu && isWeChatBrowser()) {
      showWechatPickMenu.value = true
      return
    }
    attachmentInputRef.value?.click()
  }

  function pickWechatDocument() {
    closeWechatPickMenu()
    attachmentInputDocRef.value?.click()
  }

  function pickWechatImage() {
    closeWechatPickMenu()
    attachmentInputImageRef.value?.click()
  }

  function pickWechatAnyFile() {
    closeWechatPickMenu()
    attachmentInputRef.value?.click()
  }

  async function uploadCurrentFile(): Promise<boolean> {
    const file = attachmentFile.value
    if (!file) return false
    if (!validateBeforeUpload()) return false

    const uid = options.getApplicantUid().trim()
    const typeInt = parseApplyScenarioType(options.getScenarioType())
    if (typeInt === null) {
      attachmentError.value = '请先选择应用场景'
      return false
    }

    attachmentUploading.value = true
    attachmentError.value = ''
    resetUploadState()

    try {
      const json = await uploadIntentApplicationFile(uid, typeInt, file)
      if (json.code !== 200) {
        throw new Error(json.message || json.msg || '附件上传失败')
      }
      attachmentFid.value = extractUploadFid(json.data)
      attachmentUploaded.value = true
      return true
    } catch (e: unknown) {
      attachmentError.value = e instanceof Error ? e.message : '附件上传失败'
      return false
    } finally {
      attachmentUploading.value = false
    }
  }

  async function onAttachmentChange(event: Event) {
    const input = event.target as HTMLInputElement
    const fileList = input.files
    attachmentError.value = ''
    resetUploadState()

    if (!fileList?.length) {
      attachmentFile.value = null
      return
    }

    if (fileList.length > 1) {
      attachmentError.value = '仅支持上传 1 个文件'
      attachmentFile.value = null
      input.value = ''
      return
    }

    const file = fileList[0]
    if (!isAllowedIntentApplyAttachmentName(file.name)) {
      attachmentError.value = `不支持该文件类型。${intentApplyAttachmentTypeHint()}`
      attachmentFile.value = null
      input.value = ''
      return
    }
    if (file.size > INTENT_APPLY_ATTACHMENT_MAX_BYTES) {
      attachmentError.value = '附件不能超过 30MB'
      attachmentFile.value = null
      input.value = ''
      return
    }

    attachmentFile.value = file
    await uploadCurrentFile()
  }

  watch(options.scenarioRef, () => {
    if (
      attachmentFile.value &&
      !attachmentUploaded.value &&
      !attachmentUploading.value
    ) {
      void uploadCurrentFile()
    }
  })

  return {
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
  }
}
