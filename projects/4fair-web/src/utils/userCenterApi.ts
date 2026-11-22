import { readAuthToken } from '@/utils/authSession'
import { parseKeywords, resolveScidbStaticUrl } from '@/utils/casdcDetailMapper'
import { datasetOrderPath } from '@/utils/cstrUrl'
import type { OrgType } from '@/utils/accountAuth'
import { stripHtml } from '@/utils/richText'

export type UserProfileDetail = {
  uid: string
  username: string
  nickName: string
  name: string
  phone: string
  email: string
  organization: string
  occupation: string
  orgName: string
  institution: string
  role: string
  address: string
  affiliation: string
  createTime: string
  country: string
  education: string
  title: string
  field: string
}

export type DatasetCardItem = {
  id: string
  cstr: string
  title: string
  description: string
  coverUrl: string
  subject: string
  updatedAt: string
  extra?: string
}

export type OrderApplicationItem = {
  id: string
  cstr: string
  title: string
  purpose: string
  status: string
  statusKey: string
  createdAt: string
  deadline: string
}

export type EvaluationItem = {
  id: string
  cstr: string
  title: string
  score: number
  content: string
  createdAt: string
}

/** 机构名下数据集评论 */
export type InstitutionCommentItem = {
  id: string
  cstr: string
  datasetTitle: string
  content: string
  score: number
  userName: string
  createdAt: string
}

export type AuditDatasetItem = {
  id: string
  cstr: string
  title: string
  status: string
  statusLabel: string
  updatedAt: string
  keywords: string[]
}

export type DatasetOverviewRow = {
  id: string
  cstr: string
  title: string
  statusLabel: string
  published: boolean
  visitNum: number
  downloadNum: number
  favoriteNum: number
  evaluationNum: number
  updatedAt: string
}

export type DatasetOverviewSummary = {
  datasetCount: number
  visitTotal: number
  downloadTotal: number
  favoriteTotal: number
  evaluationTotal: number
}

export type PageList<T> = {
  rows: T[]
  total: number
}

function isOkCode(code: unknown): boolean {
  return code === 200 || code === 0 || code === '200'
}

export type UserContactSnapshot = {
  uid: string
  phone: string
  email: string
  name: string
  username: string
  field: string
  orgName: string
  /** phone 与 username（邮箱）均非空 */
  complete: boolean
}

/** 联系方式中的邮箱：接口存于 username，email 仅作兜底 */
export function resolveContactEmailFromUserRecord(data: {
  username?: unknown
  loginName?: unknown
  email?: unknown
}): string {
  return String(data.username ?? data.loginName ?? data.email ?? '').trim()
}

/** 依据 user.findbyuid 返回的 phone / username 判断是否已完善联系方式 */
export function isUserContactProfileComplete(data: {
  phone?: unknown
  email?: unknown
  username?: unknown
  loginName?: unknown
}): boolean {
  const phone = String(data.phone ?? '').trim()
  const email = resolveContactEmailFromUserRecord(data)
  return Boolean(phone && email)
}

/** 真实姓名：不使用 nickName / username / openId 等系统标识回填 */
export function resolveRealNameFromUserRecord(data: Record<string, unknown>): string {
  const username = String(data.username || data.loginName || '').trim()
  const nickName = String(data.nickName || data.nickname || '').trim()
  const openId = String(data.openId || data.serviceOpenId || '').trim()
  const uid = String(data.uid || data.userId || '').trim()
  const rawName = String(data.name || data.realName || '').trim()
  if (!rawName) return ''
  if (username && rawName === username) return ''
  if (nickName && rawName === nickName) return ''
  if (openId && rawName === openId) return ''
  if (uid && rawName === uid) return ''
  if (/^tds_\d+$/i.test(rawName)) return ''
  return rawName
}

/**
 * GET /oidc-server/user/user.findbyuid?uid=
 * @see https://fairspace.cn/oidc-server/user/user.findbyuid
 */
export async function fetchUserContactByUid(uid: string): Promise<UserContactSnapshot | null> {
  const id = String(uid || '').trim()
  if (!id) return null

  const res = await fetch(`/oidc-server/user/user.findbyuid?uid=${encodeURIComponent(id)}`, {
    headers: { Accept: 'application/json' }
  })
  const json = (await res.json().catch(() => null)) as Record<string, unknown> | null
  if (!json || !isOkCode(json.code)) return null

  const data =
    json.data && typeof json.data === 'object' ? (json.data as Record<string, unknown>) : null
  if (!data) return null

  const phone = String(data.phone || '').trim()
  const username = String(data.username || data.loginName || '').trim()
  const email = resolveContactEmailFromUserRecord(data)
  const name = resolveRealNameFromUserRecord(data)
  const field = String(data.field || data.researchArea || data.researchField || '').trim()
  const orgName = String(data.orgName || data.organization || data.affiliation || '').trim()

  return {
    uid: String(data.uid || data.userId || id).trim(),
    phone,
    email,
    name,
    username,
    field,
    orgName,
    complete: isUserContactProfileComplete({ phone, username, email: data.email, loginName: data.loginName })
  }
}

function extractPageRows(data: unknown): { rows: Record<string, unknown>[]; total: number } {
  if (data == null) return { rows: [], total: 0 }
  if (Array.isArray(data)) {
    return { rows: data as Record<string, unknown>[], total: data.length }
  }
  if (typeof data !== 'object') return { rows: [], total: 0 }
  const obj = data as Record<string, unknown>
  const rows = (obj.rows || obj.list || obj.records || obj.content || []) as Record<string, unknown>[]
  const total = Number(obj.total ?? obj.totalElements)
  return {
    rows: Array.isArray(rows) ? rows : [],
    total: Number.isFinite(total) ? total : rows.length
  }
}

function formatDate(raw: unknown): string {
  if (!raw) return '—'
  const s = String(raw).trim()
  if (!s) return '—'
  return s.length >= 10 ? s.slice(0, 19).replace('T', ' ') : s
}

function mapOrderStatus(raw: unknown): { label: string; key: string } {
  const text = String(raw ?? '').trim()
  if (!text) return { label: '未知', key: 'unknown' }
  if (/通过|批准|成功|9/.test(text)) return { label: '已通过', key: 'approved' }
  if (/拒绝|驳回|失败/.test(text)) return { label: '已拒绝', key: 'rejected' }
  if (/待|审|0|1|2/.test(text) && !/通过|拒绝/.test(text)) {
    return { label: text.includes('待') ? text : '待审批', key: 'pending' }
  }
  return { label: text, key: 'unknown' }
}

function mapApplyStatus(raw: unknown): { label: string; key: string } {
  const n = Number(raw)
  if (n === 1) return { label: '已通过', key: 'approved' }
  if (n === 2) return { label: '已驳回', key: 'rejected' }
  return { label: '待审批', key: 'pending' }
}

function mapDatasetStatus(status: unknown): { label: string; published: boolean } {
  const n = Number(status)
  if (n === 9) return { label: '已发布', published: true }
  if (n === 0 || status === '0') return { label: '待审核', published: false }
  const text = String(status ?? '').trim()
  if (!text) return { label: '未发布', published: false }
  if (/发布|通过|9/.test(text)) return { label: '已发布', published: true }
  if (/审|待/.test(text)) return { label: '审核中', published: false }
  return { label: text, published: false }
}

function pickCardTitle(d: Record<string, unknown>): string {
  const title = String(d.titleZh || d.title || d.name || d.datasetTitle || '').trim()
  return title || '无标题'
}

function pickCardDescription(d: Record<string, unknown>): string {
  const raw = String(d.introductionZh || d.description || d.introduction || '').trim()
  if (!raw) return '暂无描述'
  return stripHtml(raw)
}

/** 收藏/订单等记录中嵌套的 dataset 展开为卡片字段 */
function unwrapNestedDataset(item: Record<string, unknown>): Record<string, unknown> {
  const nestedKeys = ['dataset', 'dataSet', 'dataSetInfo', 'datasetInfo', 'dataSetVo', 'dataSetDTO']
  let nested: Record<string, unknown> | null = null
  for (const key of nestedKeys) {
    const value = item[key]
    if (value && typeof value === 'object' && !Array.isArray(value)) {
      nested = value as Record<string, unknown>
      break
    }
  }

  const cstr = String(item.cstr || nested?.cstr || nested?.id || item.id || '').trim()
  const favoriteAt = item.createTime || item.createAt || item.favoriteTime

  if (!nested) {
    return { ...item, cstr: cstr || item.cstr }
  }

  return {
    ...nested,
    cstr: cstr || String(nested.cstr || nested.id || ''),
    favoriteCreateTime: favoriteAt,
    favoriteId: item.id
  }
}

async function fetchDatasetDetail(cstr: string): Promise<Record<string, unknown> | null> {
  const path = datasetOrderPath(cstr)
  if (!path) return null

  try {
    const res = await fetch(path)
    const json = await res.json()
    if (!isOkCode(json.code) || !json.data || typeof json.data !== 'object') return null

    const body = json.data as Record<string, unknown>
    const ds = body.DataSet || body.dataSet || body.dataset
    if (ds && typeof ds === 'object') return ds as Record<string, unknown>
    return body
  } catch {
    return null
  }
}

function isPlaceholderDatasetCard(card: DatasetCardItem): boolean {
  return card.title === '无标题' || card.description === '暂无描述' || !card.coverUrl
}

function mapDatasetCard(item: Record<string, unknown>, extra?: string): DatasetCardItem {
  const d = unwrapNestedDataset(item)
  return {
    id: String(d.favoriteId || d.id || d.cstr || ''),
    cstr: String(d.cstr || d.id || ''),
    title: pickCardTitle(d),
    description: pickCardDescription(d),
    coverUrl: resolveScidbStaticUrl(String(d.coverUrl || d.dataSetLogoUrl || d.bannerUrl || '')),
    subject: String(d.subject || d.subjectZh || ''),
    updatedAt: formatDate(
      d.updateAt || d.updateTime || d.favoriteCreateTime || d.createAt || d.createTime
    ),
    extra
  }
}

export async function fetchUserProfileDetail(uid: string, openId?: string): Promise<UserProfileDetail | null> {
  let data: Record<string, unknown> | null = null

  if (uid) {
    try {
      const res = await fetch(`/oidc-server/user/user.findbyuid?uid=${encodeURIComponent(uid)}`)
      const json = await res.json()
      if (isOkCode(json.code) && json.data && typeof json.data === 'object') {
        data = json.data as Record<string, unknown>
      }
    } catch {
      /* fallback to openId */
    }
  }

  if (!data && openId) {
    try {
      const res = await fetch(
        `/oidc-server/user/user.findbyopenid?openId=${encodeURIComponent(openId)}&type=0`
      )
      const json = await res.json()
      if (isOkCode(json.code)) {
        const body = (json.data || json) as Record<string, unknown>
        if (body && typeof body === 'object') data = body
      }
    } catch {
      /* ignore */
    }
  }

  if (!data) return null

  const username = String(data.username || data.loginName || data.email || '').trim()
  const orgName = String(data.orgName || data.organization || '').trim()
  const affiliation = String(data.affiliation || '').trim()

  const orgTypes = ['科研院所', '高校', '政府机构', '企业', '其他']
  const rawOccupation = String(data.occupation || '').trim()
  const rawOrganization = String(data.certType || data.source || '').trim()
  let organization = rawOrganization
  let occupation = rawOccupation
  if (!organization && orgTypes.includes(rawOccupation)) {
    organization = rawOccupation
    occupation = ''
  }

  return {
    uid: String(data.uid || data.userId || uid || '').trim(),
    username,
    nickName: String(data.nickName || data.nickname || data.displayName || username).trim(),
    name: String(data.name || data.realName || '').trim(),
    phone: String(data.phone || '').trim(),
    email: String(data.email || username || '').trim(),
    organization,
    occupation,
    orgName: orgName || affiliation,
    institution: String(data.institution || '').trim(),
    role: String(data.role || data.userRole || '').trim(),
    address: String(data.address || '').trim(),
    affiliation: affiliation || orgName,
    createTime: formatDate(data.createTime || data.createAt || data.registerTime),
    country: String(data.country || data.countryRegion || data.locale || '').trim(),
    education: String(data.education || data.degree || '').trim(),
    title: String(data.title || data.jobTitle || data.professionalTitle || '').trim(),
    field: String(
      data.field || data.researchArea || data.researchField || data.focusArea || ''
    ).trim()
  }
}

function mapDatasetStatusLabel(status: unknown): { label: string; published: boolean } {
  const mapped = mapDatasetStatus(status)
  return { label: mapped.label, published: mapped.published }
}

function mapDatasetOverviewRow(item: Record<string, unknown>): DatasetOverviewRow {
  const statusInfo = mapDatasetStatusLabel(item.status)
  return {
    id: String(item.id || ''),
    cstr: String(item.cstr || item.id || ''),
    title: pickCardTitle(item),
    statusLabel: statusInfo.label,
    published: statusInfo.published,
    visitNum: Number(item.visitNum ?? item.viewCount) || 0,
    downloadNum: Number(item.downloadNum ?? item.downloadCount ?? item.downloadTimes) || 0,
    favoriteNum: Number(item.followNum ?? item.favoriteCount) || 0,
    evaluationNum:
      Number(item.evaluationNum ?? item.evaluationCount ?? item.commentCount ?? item.scoreNum) || 0,
    updatedAt: formatDate(item.updateAt || item.publishAt || item.createAt || item.submitAt)
  }
}

function summarizeOverviewRows(rows: DatasetOverviewRow[]): DatasetOverviewSummary {
  return rows.reduce(
    (acc, row) => {
      acc.datasetCount += 1
      acc.visitTotal += row.visitNum
      acc.downloadTotal += row.downloadNum
      acc.favoriteTotal += row.favoriteNum
      acc.evaluationTotal += row.evaluationNum
      return acc
    },
    {
      datasetCount: 0,
      visitTotal: 0,
      downloadTotal: 0,
      favoriteTotal: 0,
      evaluationTotal: 0
    }
  )
}

function mapInstitutionStatistics(data: Record<string, unknown>): DatasetOverviewSummary {
  const pick = (keys: string[]) => {
    for (const key of keys) {
      const value = Number(data[key])
      if (Number.isFinite(value)) return value
    }
    return 0
  }
  return {
    datasetCount: pick(['datasetCount', 'count', 'total', 'datasetNum', 'dataSetCount']),
    visitTotal: pick(['visitNum', 'visitCount', 'viewCount', 'browseCount', 'visitTotal', 'visit']),
    downloadTotal: pick(['downloadNum', 'downloadCount', 'downloadTotal', 'download']),
    favoriteTotal: pick(['favoriteNum', 'favoriteCount', 'followNum', 'likeCount', 'favoriteTotal', 'favorite']),
    evaluationTotal: pick([
      'evaluationNum',
      'evaluationCount',
      'commentCount',
      'evaluationTotal',
      'scoreNum',
      'comment'
    ])
  }
}

/** 按机构获取浏览/下载/收藏/评论汇总 */
export async function fetchInstitutionCountStatistics(
  institution: string
): Promise<DatasetOverviewSummary> {
  const name = institution.trim()
  if (!name) throw new Error('机构名称不能为空')

  const params = new URLSearchParams({ institution: name })
  const res = await fetch(`/tds-trading/order/institution.countStatistics?${params}`)
  const json = await res.json()
  if (!isOkCode(json.code)) {
    throw new Error(String(json.message || json.msg || '获取机构统计失败'))
  }

  const raw = json.data ?? json
  if (raw && typeof raw === 'object' && !Array.isArray(raw)) {
    return mapInstitutionStatistics(raw as Record<string, unknown>)
  }
  return mapInstitutionStatistics({})
}

function mapInstitutionCommentItem(item: Record<string, unknown>): InstitutionCommentItem {
  const dataset = unwrapNestedDataset(item)
  return {
    id: String(item.id || item.evaluationId || item.commentId || `${item.cstr}-${item.createdAt}`),
    cstr: String(item.cstr || dataset.cstr || ''),
    datasetTitle: String(
      item.datasetTitle ||
        dataset.titleZh ||
        item.titleZh ||
        item.title ||
        item.name ||
        item.cstr ||
        '数据集'
    ),
    content: String(item.content || item.description || item.comment || item.remark || ''),
    score: Number(item.score || item.rating || item.star) || 0,
    userName: String(
      item.userName || item.nickName || item.nickname || item.name || item.evaluator || '匿名用户'
    ),
    createdAt: formatDate(item.createdAt || item.createTime || item.createAt)
  }
}

/** 按机构分页获取评论列表 */
export async function fetchInstitutionComments(
  institution: string,
  page = 1,
  pageSize = 10
): Promise<PageList<InstitutionCommentItem>> {
  const name = institution.trim()
  if (!name) throw new Error('机构名称不能为空')

  const params = new URLSearchParams({
    institution: name,
    page: String(page),
    pageSize: String(pageSize)
  })
  const res = await fetch(`/tds-trading/order/institution.comment?${params}`)
  const json = await res.json()
  if (!isOkCode(json.code)) {
    throw new Error(String(json.message || json.msg || '获取评论失败'))
  }

  const { rows, total } = extractPageRows(json.data)
  return {
    rows: rows.map((item) => mapInstitutionCommentItem(item)),
    total
  }
}

/** 拉取用户名下数据集列表（不含逐条补全统计） */
export async function fetchDataCenterDatasetRows(uid: string): Promise<DatasetOverviewRow[]> {
  const all: DatasetOverviewRow[] = []
  let page = 1
  const pageSize = 50
  let total = Number.POSITIVE_INFINITY

  while (all.length < total && page <= 40) {
    const params = new URLSearchParams({
      uid,
      page: String(page),
      pageSize: String(pageSize),
      sort: 'updateAt'
    })
    const res = await fetch(`/tds-trading/order/dataset.byUid?${params}`)
    const json = await res.json()
    if (!isOkCode(json.code)) {
      throw new Error(String(json.message || json.msg || '获取数据集列表失败'))
    }

    const { rows, total: apiTotal } = extractPageRows(json.data)
    total = apiTotal
    all.push(...rows.map((item) => mapDatasetOverviewRow(item)))
    if (rows.length < pageSize) break
    page += 1
  }

  return all
}

/** 拉取数据中心名下全部数据集并汇总浏览/下载/收藏/评价 */
export async function fetchDataCenterDatasetOverview(
  uid: string,
  institution?: string
): Promise<{
  rows: DatasetOverviewRow[]
  summary: DatasetOverviewSummary
}> {
  const rowsPromise = fetchDataCenterDatasetRows(uid)
  const summaryPromise = institution?.trim()
    ? fetchInstitutionCountStatistics(institution).catch(() => null)
    : Promise.resolve(null)

  const [rows, apiSummary] = await Promise.all([rowsPromise, summaryPromise])
  return {
    rows,
    summary: apiSummary ?? summarizeOverviewRows(rows)
  }
}

export async function fetchFavoriteDatasets(
  uid: string,
  page = 1,
  pageSize = 10
): Promise<PageList<DatasetCardItem>> {
  const params = new URLSearchParams({
    uid,
    page: String(page),
    pageSize: String(pageSize)
  })
  const res = await fetch(`/tds-trading/order/favorite.page?${params}`)
  const json = await res.json()
  if (!isOkCode(json.code)) {
    throw new Error(String(json.message || json.msg || '获取收藏列表失败'))
  }

  const { rows, total } = extractPageRows(json.data)
  const initial = rows.map((item) => mapDatasetCard(item))

  const enriched = await Promise.all(
    initial.map(async (card, index) => {
      if (!isPlaceholderDatasetCard(card)) return card

      const cstr = card.cstr || String(rows[index]?.cstr || '')
      if (!cstr) return card

      const detail = await fetchDatasetDetail(cstr)
      if (!detail) return card

      return mapDatasetCard({
        ...unwrapNestedDataset(rows[index] || {}),
        ...detail,
        cstr
      })
    })
  )

  return {
    rows: enriched,
    total
  }
}

export type DatasetApplyRecord = {
  id: string
  dataSetId: string
  dataSetTitle: string
  dataSetSource: string
  username: string
  researchProject: string
  instructions: string
  commitment: string
  startTime: string
  endTime: string
  applyTime: string
  auditOpinion: string
  status: { label: string; key: string }
}

function mapDatasetApplyRecord(item: Record<string, unknown>): DatasetApplyRecord {
  return {
    id: String(item.id || item._id || ''),
    dataSetId: String(item.dataSetId || item.datasetId || ''),
    dataSetTitle: String(item.dataSetTitle || item.datasetTitle || item.title || ''),
    dataSetSource: String(item.dataSetSource || item.source || ''),
    username: String(item.username || item.userName || ''),
    researchProject: String(item.researchProject || ''),
    instructions: String(item.instructions || ''),
    commitment: String(item.commitment || item.useCommitment || item.dataUseCommitment || item.pledge || item.promise || ''),
    startTime: String(item.startTime || '').slice(0, 10),
    endTime: String(item.endTime || '').slice(0, 10),
    applyTime: formatDate(item.applyTime || item.createTime || item.createdAt || item.createAt),
    auditOpinion: String(item.auditOpinion || item.opinion || item.approveOpinion || ''),
    status: mapApplyStatus(item.status || item.state || item.approveStatus)
  }
}

export async function fetchDatasetApplyList(
  uid: string,
  page = 1,
  pageSize = 10
): Promise<PageList<DatasetApplyRecord>> {
  const params = new URLSearchParams({
    uid,
    page: String(page),
    pageSize: String(pageSize)
  })
  const res = await fetch(`/tds-trading/order/dataset.apply.listByUser?${params}`)
  const json = await res.json()
  if (!isOkCode(json.code)) {
    throw new Error(String(json.message || json.msg || '获取数据申请列表失败'))
  }
  const { rows, total } = extractPageRows(json.data)
  return {
    rows: rows.map(mapDatasetApplyRecord),
    total
  }
}

export async function fetchDatasetAuditList(
  uid: string,
  page = 1,
  pageSize = 10
): Promise<PageList<DatasetApplyRecord>> {
  const params = new URLSearchParams({
    uid,
    page: String(page),
    pageSize: String(pageSize)
  })
  const res = await fetch(`/tds-trading/order/dataset.approval.listByUser?${params}`)
  const json = await res.json()
  if (!isOkCode(json.code)) {
    throw new Error(String(json.message || json.msg || '获取审批列表失败'))
  }
  const { rows, total } = extractPageRows(json.data)
  return {
    rows: rows.map(mapDatasetApplyRecord),
    total
  }
}

export async function auditDatasetApply(params: {
  applyId: string
  uid: string
  reason: string
  status: number
}): Promise<void> {
  const formData = new FormData()
  formData.append('applyId', params.applyId)
  formData.append('uid', params.uid)
  formData.append('reason', params.reason)
  formData.append('status', String(params.status))
  const res = await fetch('/tds-trading/order/dataset.apply.Approval', {
    method: 'POST',
    body: formData
  })
  const json = await res.json()
  if (!isOkCode(json.code)) {
    throw new Error(String(json.message || json.msg || '审批失败'))
  }
}

function mapEvaluationItem(item: Record<string, unknown>): EvaluationItem {
  const dataset = unwrapNestedDataset(item)
  return {
    id: String(item.id || item.evaluationId || `${item.cstr}-${item.createdAt || item.createTime}`),
    cstr: String(item.cstr || dataset.cstr || ''),
    title: String(
      item.name ||
        dataset.titleZh ||
        item.titleZh ||
        item.datasetTitle ||
        item.title ||
        item.cstr ||
        '数据集'
    ),
    score: Number(item.score || item.rating) || 0,
    content: String(item.description || item.content || ''),
    createdAt: formatDate(item.createdAt || item.createTime || item.createAt)
  }
}

export async function fetchUserEvaluations(
  uid: string,
  page = 1,
  pageSize = 10
): Promise<PageList<EvaluationItem>> {
  const params = new URLSearchParams({
    uid,
    page: String(page),
    pageSize: String(pageSize)
  })

  const res = await fetch(`/tds-trading/order/evaluation.user.page?${params}`)
  const json = await res.json()
  if (!isOkCode(json.code)) {
    throw new Error(String(json.message || json.msg || '获取评价列表失败'))
  }

  const { rows, total } = extractPageRows(json.data)
  return {
    rows: rows.map((item) => mapEvaluationItem(item)),
    total
  }
}

export async function fetchUserOrders(
  uid: string,
  page = 1,
  pageSize = 10
): Promise<PageList<OrderApplicationItem>> {
  const params = new URLSearchParams({
    uid,
    page: String(page),
    pageSize: String(pageSize)
  })

  const token = readAuthToken()
  if (token) params.set('authorization', token)

  const res = await fetch(`/tds-trading/order/order.page?${params}`)
  const json = await res.json()
  if (!isOkCode(json.code)) {
    throw new Error(String(json.message || json.msg || '获取订单列表失败'))
  }

  const { rows, total } = extractPageRows(json.data)
  return {
    rows: rows.map((item) => {
      const status = mapOrderStatus(item.status || item.auditStatus || item.orderStatus)
      return {
        id: String(item.id || item.orderId || ''),
        cstr: String(item.cstr || ''),
        title: String(item.titleZh || item.datasetTitle || item.title || item.cstr || '数据集申请'),
        purpose: String(item.purpose || item.description || item.reason || ''),
        status: status.label,
        statusKey: status.key,
        createdAt: formatDate(item.createTime || item.createAt),
        deadline: item.deadline ? `${item.deadline} 个月` : '—'
      }
    }),
    total
  }
}

export async function fetchAuditDatasets(
  uid: string,
  page = 1,
  pageSize = 20
): Promise<PageList<AuditDatasetItem>> {
  const params = new URLSearchParams({
    uid,
    page: String(page),
    pageSize: String(pageSize),
    sort: 'updateAt',
    status: '0'
  })

  const res = await fetch(`/tds-trading/order/dataset.byUid?${params}`)
  const json = await res.json()
  if (!isOkCode(json.code)) {
    throw new Error(String(json.message || json.msg || '获取审核数据集失败'))
  }

  const { rows, total } = extractPageRows(json.data)
  return {
    rows: rows.map((item) => {
      const mapped = mapDatasetStatus(item.status)
      return {
        id: String(item.id || ''),
        cstr: String(item.cstr || item.id || ''),
        title: String(item.titleZh || '无标题'),
        status: String(item.status ?? ''),
        statusLabel: mapped.label,
        updatedAt: formatDate(item.updateAt || item.publishAt || item.createAt),
        keywords: parseKeywords(item.keywordsZh)
      }
    }),
    total
  }
}

export function profileToEditForm(profile: UserProfileDetail): {
  username: string
  email: string
  nickName: string
  name: string
  organization: OrgType | ''
  occupation: string
  country: string
  phone: string
  title: string
  education: string
  field: string
  orgName: string
  address: string
} {
  const orgTypes: OrgType[] = ['科研院所', '高校', '政府机构', '企业', '其他']
  const organization = orgTypes.find((t) => t === profile.organization) || ''
  return {
    username: profile.username,
    email: profile.email,
    nickName: profile.nickName,
    name: profile.name,
    organization,
    occupation: profile.occupation,
    country: profile.country,
    phone: profile.phone,
    title: profile.title,
    education: profile.education,
    field: profile.field,
    orgName: profile.orgName,
    address: profile.address
  }
}
