/** 判断是否为支持 CO₂ 数据分析工具的数据集（青藏高原 15 站涡动通量） */

const TITLE_MARKERS = ['eddy fluxes', 'tibetan plateau', 'land-atmosphere interaction']

export function isCo2AnalysisDataset(input: {
  name?: string | null
  nameEn?: string | null
  cstr?: string | null
}): boolean {
  const text = `${input.nameEn || ''} ${input.name || ''}`.toLowerCase()
  return TITLE_MARKERS.every((marker) => text.includes(marker))
}
