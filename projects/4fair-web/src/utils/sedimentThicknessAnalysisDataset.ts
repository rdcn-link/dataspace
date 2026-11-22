/** 雅鲁藏布江流域松散沉积物类型及其厚度标定图集（272508） */

const THICKNESS_CSTR = '18406.11.SolidEar.tpdc.272508'
const TITLE_ZH_MARKER = '厚度标定图集'

export function isSedimentThicknessAnalysisDataset(input: {
  name?: string | null
  nameEn?: string | null
  cstr?: string | null
}): boolean {
  const cstr = input.cstr || ''
  if (cstr.includes(THICKNESS_CSTR) || cstr.includes('272508')) return true

  const zh = input.name || ''
  return zh.includes(TITLE_ZH_MARKER)
}
