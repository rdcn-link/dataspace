/** 雅鲁藏布江流域典型松散沉积物实测剖面特征数据集（272507） */

const PROFILE_CSTR = '18406.11.SolidEar.tpdc.272507'
const TITLE_ZH_MARKER = '实测剖面特征'

export function isSedimentProfileAnalysisDataset(input: {
  name?: string | null
  nameEn?: string | null
  cstr?: string | null
}): boolean {
  const cstr = input.cstr || ''
  if (cstr.includes(PROFILE_CSTR) || cstr.includes('272507')) return true

  const zh = input.name || ''
  return zh.includes(TITLE_ZH_MARKER)
}
