/** 雅鲁藏布江流域松散沉积物野外科考记录及照片数据集（271453） */

const EXPEDITION_CSTR = '18406.11.Geogra.tpdc.271453'
const TITLE_ZH_MARKER = '野外科考'

export function isFieldExpeditionAnalysisDataset(input: {
  name?: string | null
  nameEn?: string | null
  cstr?: string | null
}): boolean {
  const cstr = input.cstr || ''
  if (cstr.includes(EXPEDITION_CSTR) || cstr.includes('271453')) return true

  const zh = input.name || ''
  if (zh.includes(TITLE_ZH_MARKER)) return true

  const en = (input.nameEn || '').toLowerCase()
  return en.includes('photograph dataset') && en.includes('scientific expedition')
}
