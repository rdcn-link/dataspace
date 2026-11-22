/** 枢纽数据集列表 GET /tds-trading/order/dataCenter.json?dataCenterName= */

import {
  normalizeTpdcDatasetConfig,
  type TpdcDatasetConfig
} from '@/utils/tpdcDataConfigApi'

export type DataCenterJsonPayload = {
  id: string
  name: string
  json: unknown[]
  syncTime?: string
}

function isOkCode(code: unknown): boolean {
  return code === 200 || code === 0 || code === '200'
}

function asRecord(v: unknown): Record<string, unknown> | null {
  return v && typeof v === 'object' ? (v as Record<string, unknown>) : null
}

function pickString(...vals: unknown[]): string {
  for (const v of vals) {
    if (typeof v === 'string' && v.trim()) return v.trim()
  }
  return ''
}

/** 接口 json 单条 → 归一化数据集（兼容 params / dataRoot 等字段） */
export function mapDataCenterJsonDataset(raw: unknown): TpdcDatasetConfig {
  const base = raw && typeof raw === 'object' ? { ...(raw as Record<string, unknown>) } : {}

  if (Array.isArray(base.params)) {
    for (const block of base.params) {
      const rec = asRecord(block)
      if (!rec) continue
      if (rec['时间尺度'] && !base['时间尺度']) base['时间尺度'] = rec['时间尺度']
      if (rec['指标类型'] && !base['指标类型']) base['指标类型'] = rec['指标类型']
    }
    delete base.params
  }

  const dataRoot = pickString(base.dataRoot, base.data_root)
  if (!pickString(base.storage_directory, base.storageDirectory) && dataRoot) {
    base.storage_directory = dataRoot
  }

  return normalizeTpdcDatasetConfig(base)
}

/**
 * GET /tds-trading/order/dataCenter.json?dataCenterName=
 * @see https://fairspace.cn/tds-trading/order/dataCenter.json
 */
export async function fetchDataCenterJson(dataCenterName: string): Promise<DataCenterJsonPayload> {
  const name = String(dataCenterName || '').trim()
  if (!name) throw new Error('缺少空间枢纽名称')

  const res = await fetch(
    `/tds-trading/order/dataCenter.json?dataCenterName=${encodeURIComponent(name)}`,
    { headers: { Accept: 'application/json' } }
  )
  if (!res.ok) throw new Error(`枢纽数据集请求失败（${res.status}）`)

  const json = (await res.json()) as unknown
  const root = asRecord(json)
  if (!root || !isOkCode(root.code)) {
    throw new Error(pickString(root?.message) || '枢纽数据集返回异常')
  }

  const data = asRecord(root.data) || root
  const list = Array.isArray(data.json) ? data.json : []
  return {
    id: pickString(data.id),
    name: pickString(data.name, name),
    json: list,
    syncTime: pickString(data.syncTime)
  }
}

/** 拉取枢纽数据集列表（已归一化） */
export async function fetchDataCenterDatasetsByName(
  dataCenterName: string
): Promise<TpdcDatasetConfig[]> {
  const payload = await fetchDataCenterJson(dataCenterName)
  return payload.json.map((row) => mapDataCenterJsonDataset(row))
}
