import { normalizeCstr } from '@/utils/cstrUrl'

function isOkCode(code: unknown): boolean {
  return code === 200 || code === 0 || code === '200'
}

/** 增加数据集下载量 GET /tds-trading/order/dataset.addDownloadCount?cstr= */
export async function addDatasetDownloadCount(cstr: string): Promise<boolean> {
  const id = normalizeCstr(cstr)
  if (!id) return false

  try {
    const res = await fetch(
      `/tds-trading/order/dataset.addDownloadCount?cstr=${encodeURIComponent(id)}`
    )
    if (!res.ok) return false
    const json = (await res.json()) as { code?: unknown }
    return isOkCode(json.code)
  } catch {
    return false
  }
}
