/** 服务详情页 URL（public/service-pages/detail.html，避开 /service 前端路由与 Nginx 403） */
export function getServiceDetailUrl(serviceName: string): string {
  const name = serviceName.trim()
  if (!name) return ''
  return `/service-pages/detail.html?service=${encodeURIComponent(name)}`
}

/** 在新窗口打开服务详情页 */
export function openServiceDetailInNewWindow(serviceName: string) {
  const url = getServiceDetailUrl(serviceName)
  if (!url) return
  window.open(url, '_blank', 'noopener,noreferrer')
}

/** 当前窗口跳转到服务详情页 */
export function navigateToServiceDetail(serviceName: string) {
  const url = getServiceDetailUrl(serviceName)
  if (!url) return
  window.location.href = url
}
