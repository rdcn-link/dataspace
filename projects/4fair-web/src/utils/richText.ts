/** 是否包含 HTML 标签 */
export function hasHtmlTags(raw: string): boolean {
  return /<[a-z][\s\S]*?>/i.test(String(raw || '').trim())
}

/** 去除 HTML 标签，用于列表摘要等纯文本展示 */
export function stripHtml(raw: string): string {
  return String(raw || '')
    .replace(/<br\s*\/?>/gi, ' ')
    .replace(/<\/p>/gi, ' ')
    .replace(/<\/li>/gi, ' ')
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/&amp;/gi, '&')
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/\s+/g, ' ')
    .trim()
}
