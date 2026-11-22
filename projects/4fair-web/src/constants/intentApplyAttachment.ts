/** PC 浏览器：扩展名 accept */
export const INTENT_APPLY_ATTACHMENT_ACCEPT_DESKTOP =
  '.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.zip,.rar,.7z,.jpg,.jpeg,.png'

/**
 * 微信内置浏览器须用 MIME，扩展名 + image 混写时 iOS 常只出现「拍摄/相册」
 * @see https://developers.weixin.qq.com/doc/offiaccount/OA_Web_Apps/JS-SDK.html
 */
export const INTENT_APPLY_ATTACHMENT_ACCEPT_WECHAT_DOC =
  'application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-powerpoint,application/vnd.openxmlformats-officedocument.presentationml.presentation,text/plain,application/zip,application/x-rar-compressed,application/x-7z-compressed,application/octet-stream'

export const INTENT_APPLY_ATTACHMENT_ACCEPT_WECHAT_IMAGE =
  'image/jpeg,image/png,image/gif,image/webp,image/*'

/** 微信内兜底：允许任意类型，由前端校验后缀 */
export const INTENT_APPLY_ATTACHMENT_ACCEPT_WECHAT_ANY = '*/*'

const ALLOWED_EXT = new Set([
  'pdf',
  'doc',
  'docx',
  'xls',
  'xlsx',
  'ppt',
  'pptx',
  'txt',
  'zip',
  'rar',
  '7z',
  'jpg',
  'jpeg',
  'png'
])

export function getIntentApplyAttachmentExtension(name: string): string {
  const i = name.lastIndexOf('.')
  if (i < 0) return ''
  return name.slice(i + 1).toLowerCase()
}

export function isAllowedIntentApplyAttachmentName(name: string): boolean {
  const ext = getIntentApplyAttachmentExtension(name)
  return ext !== '' && ALLOWED_EXT.has(ext)
}

export function intentApplyAttachmentTypeHint(): string {
  return '支持 PDF、Word、Excel、PPT、TXT、ZIP 及 JPG/PNG，不超过 30MB'
}

/** 上传附件说明：盖章件 */
export const INTENT_APPLY_ATTACHMENT_STAMP_NOTE =
  '本附件为盖章附件，请上传已加盖公章的PDF文件。'
