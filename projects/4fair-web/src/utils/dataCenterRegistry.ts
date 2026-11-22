import type { TpdcDatasetConfig } from '@/utils/tpdcDataConfigApi'
import { fetchTpdcDatasetConfigs, normalizeTpdcDatasetConfig } from '@/utils/tpdcDataConfigApi'
import {
  CHEM_STATIC_DATASETS,
  SCIDB_STATIC_DATASETS
} from '@/data/staticDataCenterDatasets'
import {
  resolveDatasetInfoFileByCenterId,
  resolveDataCenterNameByCenterId,
  toLocalDatasetInfoFileUrl
} from '@/utils/dataCenterAllApi'
import { fetchDataCenterDatasetsByName } from '@/utils/dataCenterJsonApi'

/** 数据中心节点定义（可继续扩展） */
export type DataCenterDef = {
  id: string
  name: string
  shortName: string
  /** 匹配用户 institution / orgName / affiliation / 枢纽名称 */
  keywords: string[]
  /** 静态配置路径（public 下）或占位；优先被接口 datasetInfoFile 覆盖 */
  configUrl: string
  /** 是否走本地 TPDC 可写 API（无 datasetInfoFile 时兜底） */
  useTpdcApi?: boolean
  /** 使用前端写死的演示数据集（无 datasetInfoFile 时兜底） */
  useStaticDatasets?: boolean
}

export const DATA_CENTERS: DataCenterDef[] = [
  {
    id: 'tpdc',
    name: '国家青藏高原科学数据中心',
    shortName: 'TPDC',
    keywords: [
      '国家青藏高原科学数据中心',
      '青藏高原科学数据中心',
      '国家青藏高原科学数据中心枢纽',
      'TPDC',
      'tpdc'
    ],
    configUrl: 'https://fairspace.cn/datasetFile/tpdc_data_config.json',
    useTpdcApi: true
  },
  {
    id: 'scidb',
    name: '科学数据银行',
    shortName: 'ScienceDB',
    keywords: ['科学数据银行', 'Science Data Bank', 'ScienceDB', 'scidb'],
    configUrl: '',
    useStaticDatasets: true
  },
  {
    id: 'chem',
    name: '中国科学院化学化工科学数据中心',
    shortName: 'ChemDC',
    keywords: [
      '中国科学院化学化工科学数据中心',
      '中国科学院化学工程科学数据中心',
      '化学化工科学数据中心',
      '化学工程科学数据中心',
      '化学化工',
      'ChemDC',
      'chem'
    ],
    configUrl: '',
    useStaticDatasets: true
  },
  {
    id: 'nbsdc',
    name: '国家基础学科公共科学数据中心',
    shortName: 'NBSDC',
    keywords: [
      '国家基础学科公共科学数据中心',
      '基础学科公共科学数据中心',
      '国家基础学科',
      'NBSDC',
      'nbsdc'
    ],
    configUrl: '',
    useStaticDatasets: true
  },
  {
    id: 'kiz',
    name: '中国科学院昆明动物研究所科学数据中心',
    shortName: 'KIZ',
    keywords: [
      '中国科学院昆明动物研究所科学数据中心',
      '昆明动物研究所',
      '昆明动物所',
      '昆明动物',
      'KIZDC',
      'kizdc'
    ],
    configUrl: '',
    useStaticDatasets: true
  }
]

export function matchDataCenter(
  input?: { institution?: string; orgName?: string; affiliation?: string } | null
): DataCenterDef | null {
  const text = [input?.institution, input?.orgName, input?.affiliation]
    .map((v) => String(v || '').trim())
    .filter(Boolean)
    .join(' ')
  if (!text) return null
  return (
    DATA_CENTERS.find((center) => center.keywords.some((keyword) => text.includes(keyword))) || null
  )
}

export function hasInstitutionInfo(
  input?: { institution?: string; orgName?: string; affiliation?: string } | null
): boolean {
  return Boolean(
    String(input?.institution || '').trim() ||
      String(input?.orgName || '').trim() ||
      String(input?.affiliation || '').trim()
  )
}

function staticDatasetsFor(center: DataCenterDef): TpdcDatasetConfig[] {
  if (center.id === 'scidb') return SCIDB_STATIC_DATASETS.map((d) => ({ ...d }))
  if (center.id === 'chem') return CHEM_STATIC_DATASETS.map((d) => ({ ...d }))
  return []
}

/** 从 datasetInfoFile（枢纽接口字段）拉取数据集列表 */
export async function fetchDatasetsFromInfoFile(fileUrl: string): Promise<TpdcDatasetConfig[]> {
  const local = toLocalDatasetInfoFileUrl(fileUrl)
  if (!local) throw new Error('数据集配置地址为空')

  const bust = `t=${Date.now()}`
  const url = `${local}${local.includes('?') ? '&' : '?'}${bust}`
  const res = await fetch(url, { headers: { Accept: 'application/json' } })
  if (!res.ok) throw new Error(`加载数据集配置失败（${res.status}）`)
  const data = await res.json()
  if (!Array.isArray(data)) throw new Error('数据集配置格式无效')
  return data.map((row) => normalizeTpdcDatasetConfig(row))
}

export async function fetchDataCenterDatasets(center: DataCenterDef): Promise<TpdcDatasetConfig[]> {
  // 优先：GET /tds-trading/order/dataCenter.json?dataCenterName=（空间枢纽名称）
  const dataCenterName = await resolveDataCenterNameByCenterId(center.id)
  if (dataCenterName) {
    try {
      return await fetchDataCenterDatasetsByName(dataCenterName)
    } catch {
      /* 回退旧链路 */
    }
  }

  // 回退：datasetInfoFile 静态 JSON
  const fromHub = await resolveDatasetInfoFileByCenterId(center.id)
  const fileUrl = fromHub || center.configUrl
  if (fileUrl) {
    try {
      return await fetchDatasetsFromInfoFile(fileUrl)
    } catch (e) {
      // TPDC 可再走专用读取链；其它中心有静态兜底
      if (!center.useTpdcApi && !center.useStaticDatasets) throw e
    }
  }

  if (center.useTpdcApi) {
    return fetchTpdcDatasetConfigs()
  }
  if (center.useStaticDatasets) {
    return staticDatasetsFor(center)
  }
  throw new Error(`未配置 ${center.name} 的数据集列表地址`)
}

export type DataCenterDatasetBundle = {
  center: DataCenterDef
  datasets: TpdcDatasetConfig[]
  error?: string
}

export async function fetchAllDataCenterBundles(): Promise<DataCenterDatasetBundle[]> {
  const results = await Promise.all(
    DATA_CENTERS.map(async (center) => {
      try {
        const datasets = await fetchDataCenterDatasets(center)
        return { center, datasets }
      } catch (e: unknown) {
        return {
          center,
          datasets: [] as TpdcDatasetConfig[],
          error: e instanceof Error ? e.message : '加载失败'
        }
      }
    })
  )
  return results
}
