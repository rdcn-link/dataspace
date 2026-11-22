/**
 * 账号密码注册 / 登录 / 微信完善资料（/oidc-server/user/user.register、/oidc-server/user/user.login、/oidc-server/user/user.updateUser）
 */

export type OrgType = '科研院所' | '高校' | '政府机构' | '企业' | '其他'

export type RegisterPayload = {
  username: string
  password: string
  name: string
  source: OrgType
  phone: string
  affiliation: string
  address: string
  openId?: string
}

export type LoginPayload = {
  username: string
  password: string
}

export type AccountAuthResult = {
  uid: string
  username: string
  name: string
  affiliation?: string
  phone?: string
  source?: string
  token?: string
}

type ApiJson = {
  code?: number
  message?: string
  msg?: string
  data?: Record<string, unknown>
  success?: boolean
}

function isOk(json: ApiJson): boolean {
  if (json.success === true) return true
  if (json.code === 200 || json.code === 0) return true
  return false
}

function pickMessage(json: ApiJson, fallback: string): string {
  return String(json.message || json.msg || fallback)
}

function mapAuthData(raw: Record<string, unknown>): AccountAuthResult {
  const uid = String(raw.uid || raw.userId || raw.id || '').trim()
  const username = String(raw.username || raw.loginName || raw.email || '').trim()
  const name = String(raw.name || raw.realName || raw.nickname || raw.username || '').trim()

  return {
    uid,
    username,
    name,
    affiliation: raw.orgName
      ? String(raw.orgName)
      : raw.affiliation
        ? String(raw.affiliation)
        : undefined,
    phone: raw.phone ? String(raw.phone) : undefined,
    source: raw.occupation
      ? String(raw.occupation)
      : raw.certType
        ? String(raw.certType)
        : raw.source
          ? String(raw.source)
          : undefined,
    token: raw.token ? String(raw.token) : raw.accessToken ? String(raw.accessToken) : undefined
  }
}

async function postUserApi<T>(
  path: string,
  body: T,
  options?: { requireUserFields?: boolean }
): Promise<AccountAuthResult> {
  const res = await fetch(path, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify(body)
  })

  let json: ApiJson = {}
  try {
    json = (await res.json()) as ApiJson
  } catch {
    if (!res.ok) {
      throw new Error(`请求失败 (${res.status})`)
    }
  }

  if (!res.ok && !isOk(json)) {
    throw new Error(pickMessage(json, `请求失败 (${res.status})`))
  }

  if (!isOk(json)) {
    throw new Error(pickMessage(json, '操作失败'))
  }

  const data = (json.data || json) as Record<string, unknown>
  const result = mapAuthData(data)

  if (options?.requireUserFields !== false && !result.uid && !result.username) {
    throw new Error('接口未返回有效的用户信息')
  }

  return result
}

export type WechatProfilePayload = {
  openId: string
  /** 邮箱（作账号，仅格式校验） */
  email: string
  /** 手机号（仅格式校验） */
  phone: string
  /** 用户名称 */
  nickName: string
}

export type UpdateUserRequestBody = {
  serviceOpenId: string
  username: string
  name: string
  address: string
  orgName: string
  phone: string
  email?: string
  nickName?: string
  country?: string
  education?: string
  title?: string
  occupation?: string
  field?: string
  affiliation?: string
  /** 微信完善资料等场景仍可能使用 */
  certType?: OrgType
}

export type UpdateProfilePayload = {
  openId?: string
  uid?: string
  username: string
  name: string
  organization?: OrgType | string
  occupation?: string
  phone: string
  orgName: string
  address: string
  email?: string
  nickName?: string
  country?: string
  education?: string
  title?: string
  field?: string
  affiliation?: string
}

export async function registerAccount(payload: RegisterPayload): Promise<AccountAuthResult> {
  return postUserApi('/oidc-server/user/user.register', payload)
}

/** 微信首次登录完善信息：手机号 + 邮箱 + 用户名称（仅格式校验） */
export async function completeWechatProfile(payload: WechatProfilePayload): Promise<AccountAuthResult> {
  const email = payload.email.trim()
  const nickName = payload.nickName.trim()
  const phone = payload.phone.trim()
  const body: UpdateUserRequestBody = {
    serviceOpenId: payload.openId,
    username: email,
    email,
    name: nickName,
    nickName,
    phone,
    address: '',
    orgName: ''
  }

  const result = await postUserApi('/oidc-server/user/user.updateUser', body, { requireUserFields: false })

  return {
    uid: result.uid || payload.openId,
    username: result.username || email,
    name: result.name || nickName,
    affiliation: result.affiliation || '',
    phone: result.phone || phone,
    source: result.source || '',
    token: result.token
  }
}

export async function loginAccount(payload: LoginPayload): Promise<AccountAuthResult> {
  return postUserApi('/oidc-server/user/user.login', payload)
}

/** 更新用户资料（账号登录与微信用户通用） */
export async function updateUserProfile(payload: UpdateProfilePayload): Promise<AccountAuthResult> {
  const serviceOpenId = String(payload.openId || payload.uid || '').trim()
  const body: UpdateUserRequestBody = {
    serviceOpenId,
    username: payload.username,
    name: payload.name,
    occupation: String(payload.occupation || '').trim(),
    certType: payload.organization
      ? (String(payload.organization).trim() as OrgType)
      : undefined,
    address: payload.address,
    orgName: payload.orgName,
    phone: payload.phone,
    email: payload.email?.trim() || payload.username,
    nickName: payload.nickName?.trim(),
    country: payload.country?.trim(),
    education: payload.education?.trim(),
    title: payload.title?.trim(),
    field: payload.field?.trim(),
    affiliation: payload.affiliation?.trim() || payload.orgName
  }

  const result = await postUserApi('/oidc-server/user/user.updateUser', body, { requireUserFields: false })

  return {
    uid: result.uid || payload.uid || serviceOpenId,
    username: result.username || payload.username,
    name: result.name || payload.name,
    affiliation: result.affiliation || payload.orgName,
    phone: result.phone || payload.phone,
    source: result.source || String(payload.organization || payload.occupation || ''),
    token: result.token
  }
}
