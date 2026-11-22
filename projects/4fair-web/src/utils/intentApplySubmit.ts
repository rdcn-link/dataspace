import {
  parseApplyScenarioType,
  type ApplyScenarioType,
  type IntentApplyThesisForm
} from '@/constants/intentApplyScenarios'

/** 与后端 @RequestParam(name = "file") MultipartFile file 一致 */
export const ORDER_APPLICATION_FILE_FIELD = 'file'

/** order.save 固定业务类型：数据集申请 */
export const INTENT_ORDER_SAVE_TYPE = 'Dataset' as const

export type IntentOrderSavePayload = {
  username: string
  openId: string
  uid: string
  cstr: string
  /** 附件上传接口返回的 data；快数通免签时可不传 */
  fid?: string
  /** 应用场景：快数通=1，其余=0 */
  applyType: ApplyScenarioType
  purpose: string
  description: string
  method: string
  deadline: number
  reason: string
} & Partial<IntentApplyThesisForm>

export type IntentOrderSaveRequestBody = IntentOrderSavePayload & {
  type: typeof INTENT_ORDER_SAVE_TYPE
}

type ApiResponse = {
  code: number
  message?: string
  msg?: string
  data?: unknown
}

async function parseApiResponse(res: Response): Promise<ApiResponse> {
  const text = await res.text()
  if (!text?.trim()) {
    if (!res.ok) {
      throw new Error(`HTTP ${res.status}`)
    }
    return { code: 200 }
  }
  const json = JSON.parse(text) as ApiResponse
  if (!res.ok && json.code == null) {
    throw new Error(json.message || json.msg || `HTTP ${res.status}`)
  }
  return json
}

/**
 * 申请附件自动上传（选文件后立即调用）
 * POST /tds-trading/order/order.applicationFile/{uid}
 * @param uid 路径参数 @PathVariable String uid
 * @param type 表单参数 @RequestParam Integer type（快数通=1，其余=0）
 * @param file 表单参数 @RequestParam MultipartFile file
 */
export async function uploadIntentApplicationFile(
  uid: string,
  type: ApplyScenarioType,
  file: File
): Promise<ApiResponse> {
  const formData = new FormData()
  formData.append('type', String(type))
  formData.append(ORDER_APPLICATION_FILE_FIELD, file, file.name)

  const res = await fetch(
    `/tds-trading/order/order.applicationFile/${encodeURIComponent(uid.trim())}`,
    {
      method: 'POST',
      body: formData
    }
  )
  return parseApiResponse(res)
}

export function toApplyScenarioType(value: string): ApplyScenarioType {
  const parsed = parseApplyScenarioType(value)
  if (parsed === null) {
    throw new Error('无效的应用场景 type')
  }
  return parsed
}

/** 查询用户是否已通过快数通认证：code=200 则本次免附件 */
export async function fetchOrderHasKst(uid: string): Promise<ApiResponse> {
  const res = await fetch(
    `/tds-trading/order/order.hasKst?uid=${encodeURIComponent(uid.trim())}`
  )
  return parseApiResponse(res)
}

/** 上传成功响应中的 data 即为 fid */
export function extractUploadFid(data: unknown): string {
  if (typeof data === 'string' && data.trim()) {
    return data.trim()
  }
  throw new Error('附件上传成功但未返回文件标识')
}

/** 提交申请业务数据（JSON，不含附件） */
export async function submitIntentOrder(
  payload: IntentOrderSavePayload
): Promise<ApiResponse> {
  const body: IntentOrderSaveRequestBody = {
    ...payload,
    type: INTENT_ORDER_SAVE_TYPE
  }
  const res = await fetch('/tds-trading/order/order.save', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  })
  return parseApiResponse(res)
}

/** dataset.apply 数据集申请提交 payload */
export type DatasetApplyPayload = {
  uid: string
  dataSetId: string
  dataSetUpdateTime: string
  researchProject: string
  instructions: string
  commitment: string
  startTime: string
  endTime: string
}

/** 提交数据集使用申请（POST /tds-trading/order/dataset.apply） */
export async function submitDatasetApply(
  payload: DatasetApplyPayload
): Promise<ApiResponse> {
  const res = await fetch('/tds-trading/order/dataset.apply', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  })
  return parseApiResponse(res)
}

/**
 * 完整提交流程：附件已上传则仅 order.save，否则先上传再保存
 */
export async function submitIntentApplication(
  payload: IntentOrderSavePayload,
  file: File | null,
  options: {
    alreadyUploaded: boolean
    fid?: string
    /** 快数通免签：跳过附件上传 */
    skipAttachment?: boolean
  }
): Promise<ApiResponse> {
  if (options.skipAttachment) {
    const { fid: _omit, ...rest } = payload
    const saveJson = await submitIntentOrder(rest)
    if (saveJson.code !== 200) {
      throw new Error(saveJson.message || saveJson.msg || '提交申请失败')
    }
    return saveJson
  }

  let fid = options.fid?.trim() || payload.fid?.trim()

  if (!options.alreadyUploaded || !fid) {
    if (!file) {
      throw new Error('请上传附件')
    }
    const uploadJson = await uploadIntentApplicationFile(
      payload.uid,
      payload.applyType,
      file
    )
    if (uploadJson.code !== 200) {
      throw new Error(uploadJson.message || uploadJson.msg || '附件上传失败')
    }
    fid = extractUploadFid(uploadJson.data)
  }

  if (!fid) {
    throw new Error('缺少附件标识，请重新上传附件')
  }

  const saveJson = await submitIntentOrder({ ...payload, fid })
  if (saveJson.code !== 200) {
    throw new Error(saveJson.message || saveJson.msg || '提交申请失败')
  }
  return saveJson
}
