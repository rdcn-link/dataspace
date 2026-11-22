import type { Router } from 'vue-router'
import type { InformationRecord } from '@/utils/informationApi'

const cacheKey = (id: string) => `information:item:${id}`

export function cacheInformationItem(record: InformationRecord) {
  const id = String(record.id || '').trim()
  if (!id) return
  try {
    sessionStorage.setItem(cacheKey(id), JSON.stringify(record))
  } catch {
    // ignore quota errors
  }
}

export function readCachedInformationItem(id: string): InformationRecord | null {
  const target = String(id || '').trim()
  if (!target) return null
  try {
    const raw = sessionStorage.getItem(cacheKey(target))
    return raw ? (JSON.parse(raw) as InformationRecord) : null
  } catch {
    return null
  }
}

/** 在项目内新窗口打开资讯详情（保留站点顶栏，正文区 iframe 加载 HTML） */
export function openInformationArticleWindow(
  router: Router,
  id: string,
  record?: InformationRecord
) {
  const target = String(id || '').trim()
  if (!target) return
  if (record) cacheInformationItem(record)
  const { href } = router.resolve({
    name: 'InformationDetail',
    params: { id: target }
  })
  window.open(href, '_blank', 'noopener,noreferrer')
}
