/**
 * 申请按钮点击埋点：POST /tds-trading/order/order.apply.click
 */
export async function trackApplyClick(params: {
  uid: string
  cstr: string
  url: string
}): Promise<void> {
  const uid = params.uid.trim()
  const cstr = params.cstr.trim()
  const url = params.url.trim()
  if (!cstr || !url) return

  try {
    await fetch('/tds-trading/order/order.apply.click', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ uid, cstr, url })
    })
  } catch {
    /* 埋点失败不阻塞跳转 */
  }
}
