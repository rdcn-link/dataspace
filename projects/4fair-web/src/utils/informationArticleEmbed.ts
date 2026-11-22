const DEFAULT_ARTICLE_PROXY_PATH = '/api/article-html'
const SHADOW_BODY_CLASS = 'fairspace-article-body'

const ARTICLE_PROXY_PATH = String(
  import.meta.env.VITE_ARTICLE_HTML_PROXY || DEFAULT_ARTICLE_PROXY_PATH
).trim() || DEFAULT_ARTICLE_PROXY_PATH

/** 与原文页面一致的外层容器 */
const ARTICLE_ROOT_SELECTORS = [
  '.rich_media_wrp',
  '.rich_media',
  '#img-content',
  '#js_content',
  '.rich_media_content',
  '.page_content',
  'article',
  'main',
  '.article',
  '.content'
]

export interface InformationArticleEmbed {
  html: string
  stylesheets: string[]
  inlineStyles: string[]
}

function resolveFetchTargets(url: string): string[] {
  const raw = String(url || '').trim()
  if (!raw) return []

  const targets: string[] = []
  const add = (value: string) => {
    const next = String(value || '').trim()
    if (next && !targets.includes(next)) targets.push(next)
  }

  add(`${ARTICLE_PROXY_PATH}?url=${encodeURIComponent(raw)}`)

  if (raw.startsWith('/') && !raw.startsWith('//')) {
    add(raw)
    return targets
  }

  try {
    const parsed = new URL(raw)
    const orderBase = String(import.meta.env.VITE_ORDER_API_BASE || import.meta.env.VITE_APP_PUBLIC_URL || '').trim()
    if (orderBase) {
      const apiOrigin = new URL(orderBase).origin
      if (parsed.origin === apiOrigin) {
        add(`${parsed.pathname}${parsed.search}${parsed.hash}`)
      }
    }
    if (parsed.origin === window.location.origin) {
      add(`${parsed.pathname}${parsed.search}${parsed.hash}`)
    }
    add(raw)
  } catch {
    add(raw)
  }

  return targets
}

function toAbsoluteUrl(value: string, baseUrl: string): string {
  if (!value || value.startsWith('data:') || value.startsWith('blob:') || value.startsWith('#')) {
    return value
  }
  if (/^(https?:)?\/\//i.test(value) || value.startsWith('mailto:') || value.startsWith('tel:')) {
    return value.startsWith('//') ? `${window.location.protocol}${value}` : value
  }
  try {
    return new URL(value, baseUrl).href
  } catch {
    return value
  }
}

function pickArticleRoot(doc: Document): HTMLElement {
  for (const selector of ARTICLE_ROOT_SELECTORS) {
    const node = doc.querySelector(selector)
    if (node instanceof HTMLElement) return node
  }
  return doc.body
}

function collectStylesheets(doc: Document, baseUrl: string): string[] {
  const urls: string[] = []
  doc.querySelectorAll<HTMLLinkElement>('link[rel="stylesheet"]').forEach((link) => {
    const href = link.getAttribute('href')
    if (!href) return
    const absolute = toAbsoluteUrl(href, baseUrl)
    if (!urls.includes(absolute)) urls.push(absolute)
  })
  return urls
}

function collectInlineStyles(doc: Document): string[] {
  const styles: string[] = []
  doc.querySelectorAll('style').forEach((node) => {
    const text = node.textContent?.trim()
    if (text) styles.push(text)
  })
  return styles
}

/** 将原文针对 html/body 的规则映射到 Shadow 内节点 */
function adaptDocumentLevelCss(css: string): string {
  return css
    .replace(/(^|[,{])\s*html\b/g, '$1:host')
    .replace(/(^|[,{])\s*body\b/g, `$1.${SHADOW_BODY_CLASS}`)
}

/** 远端 HTML 实际是站点 SPA 壳（文件不存在被 nginx try_files 回退） */
export function looksLikeSpaShell(raw: string): boolean {
  const lower = raw.toLowerCase()
  if (lower.includes('/@vite/client') || lower.includes('__nuxt') || lower.includes('ng-version=')) {
    return true
  }
  const hasAppRoot = lower.includes('id="app"') || lower.includes("id='app'")
  const hasBundledShell =
    lower.includes('/static/index-') ||
    lower.includes('fairspace-logo') ||
    lower.includes('费尔空间 - 可信科学数据空间')
  const hasArticleMarker =
    lower.includes('rich_media') ||
    lower.includes('js_content') ||
    lower.includes('page_content') ||
    lower.includes('article-content')
  return (hasAppRoot || hasBundledShell) && !hasArticleMarker
}

function isValidArticleRoot(root: HTMLElement, raw: string): boolean {
  if (looksLikeSpaShell(raw)) return false

  const text = (root.textContent || '').replace(/\s+/g, ' ').trim()
  if (text.length < 80) return false

  if (
    root.querySelector(
      'p, img, video, table, .rich_media_content, #js_content, .page_content, article, .article'
    )
  ) {
    return true
  }

  return text.length >= 200
}

function rewriteRelativeUrls(root: HTMLElement, baseUrl: string) {
  root.querySelectorAll<HTMLElement>('[src]').forEach((el) => {
    const src = el.getAttribute('src')
    if (!src) return
    el.setAttribute('src', toAbsoluteUrl(src, baseUrl))
  })

  root.querySelectorAll<HTMLAnchorElement>('a[href]').forEach((el) => {
    const href = el.getAttribute('href')
    if (!href || href.startsWith('javascript:')) return
    el.setAttribute('href', toAbsoluteUrl(href, baseUrl))
    el.setAttribute('target', '_blank')
    el.setAttribute('rel', 'noopener noreferrer')
  })

  root.querySelectorAll<HTMLImageElement>('img[srcset]').forEach((img) => {
    const srcset = img.getAttribute('srcset')
    if (!srcset) return
    const rewritten = srcset
      .split(',')
      .map((part) => {
        const chunks = part.trim().split(/\s+/)
        if (!chunks[0]) return part
        chunks[0] = toAbsoluteUrl(chunks[0], baseUrl)
        return chunks.join(' ')
      })
      .join(', ')
    img.setAttribute('srcset', rewritten)
  })
}

function sanitizeArticleRoot(root: HTMLElement) {
  root.querySelectorAll('script').forEach((node) => node.remove())
  root.querySelectorAll('style').forEach((node) => node.remove())
  root.querySelectorAll('link').forEach((node) => node.remove())
}

function parseArticleDocument(raw: string, baseUrl: string): InformationArticleEmbed {
  const doc = new DOMParser().parseFromString(raw, 'text/html')
  const root = pickArticleRoot(doc)
  if (!isValidArticleRoot(root, raw)) {
    throw new Error('文章内容无效')
  }
  rewriteRelativeUrls(root, baseUrl)
  sanitizeArticleRoot(root)

  return {
    html: root.outerHTML,
    stylesheets: collectStylesheets(doc, baseUrl),
    inlineStyles: collectInlineStyles(doc).map(adaptDocumentLevelCss)
  }
}

export function isInformationArticleEmbedVisible(host: HTMLElement | null | undefined): boolean {
  const shadow = host?.shadowRoot
  if (!shadow) return false
  const text = (shadow.textContent || '').replace(/\s+/g, ' ').trim()
  return text.length >= 50
}

export function clearInformationArticleShadow(host: HTMLElement | null | undefined) {
  if (!host?.shadowRoot) return
  host.shadowRoot.innerHTML = ''
}

export function renderInformationArticleShadow(
  host: HTMLElement,
  embed: InformationArticleEmbed
) {
  const shadow = host.shadowRoot || host.attachShadow({ mode: 'open' })
  shadow.innerHTML = ''

  const hostReset = document.createElement('style')
  hostReset.textContent = `
    :host {
      display: block;
      width: 100%;
      max-width: 100%;
      box-sizing: border-box;
      overflow-x: auto;
      color: initial;
      font: initial;
      line-height: initial;
      letter-spacing: initial;
      text-align: initial;
      font-style: initial;
      text-decoration: initial;
      text-transform: initial;
      word-break: break-word;
    }
    .${SHADOW_BODY_CLASS} {
      margin: 0;
      padding: 0;
      width: 100%;
      max-width: 100%;
      box-sizing: border-box;
      overflow-wrap: anywhere;
    }
  `
  shadow.appendChild(hostReset)

  embed.stylesheets.forEach((href) => {
    const link = document.createElement('link')
    link.rel = 'stylesheet'
    link.href = href
    shadow.appendChild(link)
  })

  embed.inlineStyles.forEach((css) => {
    const style = document.createElement('style')
    style.textContent = css
    shadow.appendChild(style)
  })

  // 放在原文样式之后，确保移动端宽度不被固定宽容器挤窄
  const responsiveOverride = document.createElement('style')
  responsiveOverride.textContent = `
    .${SHADOW_BODY_CLASS} img,
    .${SHADOW_BODY_CLASS} video,
    .${SHADOW_BODY_CLASS} iframe,
    .${SHADOW_BODY_CLASS} table,
    .${SHADOW_BODY_CLASS} pre {
      max-width: 100% !important;
      height: auto !important;
    }
    .${SHADOW_BODY_CLASS} .rich_media_area_primary,
    .${SHADOW_BODY_CLASS} .rich_media_wrp,
    .${SHADOW_BODY_CLASS} .rich_media,
    .${SHADOW_BODY_CLASS} .rich_media_content,
    .${SHADOW_BODY_CLASS} #js_content,
    .${SHADOW_BODY_CLASS} .page_content,
    .${SHADOW_BODY_CLASS} article,
    .${SHADOW_BODY_CLASS} .article,
    .${SHADOW_BODY_CLASS} .content {
      width: 100% !important;
      max-width: 100% !important;
      box-sizing: border-box !important;
    }
    @media (max-width: 640px) {
      .${SHADOW_BODY_CLASS} {
        font-size: 16px;
      }
    }
  `
  shadow.appendChild(responsiveOverride)

  const body = document.createElement('div')
  body.className = SHADOW_BODY_CLASS
  body.innerHTML = embed.html
  shadow.appendChild(body)
}

export async function fetchInformationArticleEmbed(url: string): Promise<InformationArticleEmbed> {
  const targets = resolveFetchTargets(url)
  let lastError: unknown

  for (const target of targets) {
    try {
      const res = await fetch(target, { credentials: 'omit', cache: 'no-store' })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const raw = await res.text()
      if (!raw.trim()) throw new Error('文章内容为空')
      if (looksLikeSpaShell(raw)) {
        throw new Error('原文地址无效（返回站点壳页面）')
      }

      const baseUrl = target.startsWith(ARTICLE_PROXY_PATH)
        ? url
        : new URL(target, window.location.origin).href

      return parseArticleDocument(raw, baseUrl)
    } catch (e) {
      lastError = e
    }
  }

  throw lastError instanceof Error ? lastError : new Error('加载文章内容失败')
}

/** 探测原文 HTML 是否可嵌入（避免 iframe 加载到 SPA 空白壳） */
export async function canEmbedInformationArticle(url: string): Promise<boolean> {
  const targets = resolveFetchTargets(url)
  for (const target of targets) {
    try {
      const res = await fetch(target, { credentials: 'omit', cache: 'no-store' })
      if (!res.ok) continue
      const raw = await res.text()
      if (!raw.trim() || looksLikeSpaShell(raw)) continue
      try {
        parseArticleDocument(raw, url)
        return true
      } catch {
        // 非可解析正文，但也不像 SPA 壳时仍允许 iframe 尝试
        return !looksLikeSpaShell(raw) && raw.length > 800
      }
    } catch {
      /* try next */
    }
  }
  return false
}

/** @deprecated 使用 fetchInformationArticleEmbed + Shadow DOM 渲染 */
export function clearInformationArticleAssets() {
  // 保留空实现，兼容旧调用
}
