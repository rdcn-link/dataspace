import { formatShareModeLabel } from '@/utils/casdcDetailMapper'
import { datasetOrderPath } from '@/utils/cstrUrl'

export type DatasetSummary = {
  title: string
  publisher: string
  level: string
  cstr: string
}

function mapShareMode(shareMode: string): string {
  return formatShareModeLabel(shareMode) || '开放访问'
}

/** 按 CSTR 拉取数据集摘要（与 DataDetail 详情接口一致） */
export async function fetchDatasetSummaryByCstr(cstr: string): Promise<DatasetSummary | null> {
  const id = cstr.trim()
  if (!id) return null

  const res = await fetch(datasetOrderPath(id))
  if (!res.ok) {
    throw new Error(`HTTP ${res.status}`)
  }
  const json = await res.json()
  if (json.code !== 200 || !json.data?.DataSet) {
    throw new Error(json.message || '获取数据集信息失败')
  }

  const d = json.data.DataSet
  return {
    cstr: d.cstr || d.id || id,
    title: d.titleZh || '无标题',
    publisher: d.source || '未知来源',
    level: mapShareMode(d.shareMode)
  }
}
