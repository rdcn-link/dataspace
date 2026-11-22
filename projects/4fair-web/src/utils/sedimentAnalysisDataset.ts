/** 判断是否为雅鲁藏布江流域松散沉积物（空间分布）数据分析工具数据集 */

import { isSedimentProfileAnalysisDataset } from '@/utils/sedimentProfileAnalysisDataset'
import { isSedimentThicknessAnalysisDataset } from '@/utils/sedimentThicknessAnalysisDataset'
import { isFieldExpeditionAnalysisDataset } from '@/utils/fieldExpeditionAnalysisDataset'

const TITLE_EN_MARKERS = ['unconsolidated sediments', 'yarlung tsangpo']
const TITLE_ZH_MARKER = '雅鲁藏布江流域松散沉积物'
const SPATIAL_CSTR = '18406.11.SolidEar.tpdc.272442'

export function isSedimentAnalysisDataset(input: {
  name?: string | null
  nameEn?: string | null
  cstr?: string | null
}): boolean {
  if (isSedimentProfileAnalysisDataset(input)) return false
  if (isSedimentThicknessAnalysisDataset(input)) return false
  if (isFieldExpeditionAnalysisDataset(input)) return false

  const cstr = input.cstr || ''
  if (cstr.includes(SPATIAL_CSTR) || cstr.includes('272442')) return true

  const zh = input.name || ''
  if (zh.includes('实测剖面') || zh.includes('厚度标定') || zh.includes('野外科考')) return false
  if (zh.includes('空间分布') || zh.includes('沉积总量')) return true
  if (zh.includes(TITLE_ZH_MARKER)) return true

  const en = (input.nameEn || '').toLowerCase()
  return TITLE_EN_MARKERS.every((marker) => en.includes(marker))
}
