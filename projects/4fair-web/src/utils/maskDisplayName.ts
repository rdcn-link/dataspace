/**
 * 按常见市场规则脱敏展示用户名称
 * - 中文 2 字：张*
 * - 3 字及以上：保留首尾，中间用 *（如 高亚宁 → 高*宁）
 * - 邮箱：首字符 + ***@域名
 * - 手机：前 3 + **** + 后 4
 */
export function maskDisplayName(name: string): string {
  const raw = String(name ?? '').trim()
  if (!raw) return '匿名用户'
  if (raw === '匿名用户') return raw

  if (raw.includes('@')) {
    const at = raw.indexOf('@')
    const local = raw.slice(0, at)
    const domain = raw.slice(at + 1)
    if (!local) return `***@${domain}`
    return `${local.charAt(0)}***@${domain}`
  }

  if (/^1[3-9]\d{9}$/.test(raw)) {
    return `${raw.slice(0, 3)}****${raw.slice(-4)}`
  }

  const chars = Array.from(raw)
  const len = chars.length
  if (len <= 1) return '*'
  if (len === 2) return `${chars[0]}*`
  return `${chars[0]}${'*'.repeat(len - 2)}${chars[len - 1]}`
}
