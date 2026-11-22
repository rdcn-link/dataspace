/** 规范化 CSTR（兼容历史 %2F 链接） */
export function normalizeCstr(raw: string): string {
  const s = String(raw ?? '').trim()
  if (!s) return ''
  try {
    return decodeURIComponent(s)
  } catch {
    return s
  }
}

/** CSTR 用于 URL 路径：保留 `/`，不做 encodeURIComponent */
export function assetDetailPath(cstr: string): string {
  const id = normalizeCstr(cstr)
  if (!id) return ''
  return `/assets/detail/${id}`
}

export function datasetOrderPath(cstr: string): string {
  const id = normalizeCstr(cstr)
  if (!id) return ''
  return `/tds-trading/order/dataset/?cstr=${id}`
}

export function evaluationDatasetPath(cstr: string): string {
  const id = normalizeCstr(cstr)
  if (!id) return ''
  return `/tds-trading/order/evaluation.dataset/${id}`
}

/** 数据集访问/下载统计 */
export function datasetStatisticsPath(cstr: string, range: string): string {
  const id = normalizeCstr(cstr)
  if (!id) return ''
  return `/tds-trading/order/dataset.statistics?cstr=${id}&range=${range}`
}

/** 数据集开放文件列表 / 下载地址 */
export function datasetGetDownloadUrlPath(cstr: string): string {
  const id = normalizeCstr(cstr)
  if (!id) return ''
  return `/tds-trading/order/dataset.getDownloadUrl?cstr=${id}`
}

/** 增加数据集下载量 */
export function datasetAddDownloadCountPath(cstr: string): string {
  const id = normalizeCstr(cstr)
  if (!id) return ''
  return `/tds-trading/order/dataset.addDownloadCount?cstr=${encodeURIComponent(id)}`
}

/** 统计收藏量 */
export function favoriteStatisticsPath(cstr: string): string {
  const id = normalizeCstr(cstr)
  if (!id) return ''
  return `/tds-trading/order/favorite.statistics?cstr=${encodeURIComponent(id)}`
}
