/**
 * 生产环境文章 HTML 代理（供 Nginx 反代）
 *
 * 启动: node scripts/article-html-proxy.mjs
 * Nginx:
 *   location /api/article-html {
 *     proxy_pass http://127.0.0.1:19088;
 *   }
 */
import http from 'node:http'

const PORT = Number(process.env.ARTICLE_HTML_PROXY_PORT || 19088)

async function proxyArticleHtml(target) {
  if (!target || !/^https?:\/\//i.test(target)) {
    return { status: 400, body: 'invalid url' }
  }

  const response = await fetch(target, {
    headers: {
      'User-Agent': 'FairSpaceArticleProxy/1.0',
      Accept: 'text/html,application/xhtml+xml,*/*'
    }
  })
  return {
    status: response.status,
    body: await response.text(),
    contentType: response.headers.get('content-type') || 'text/html; charset=utf-8'
  }
}

const server = http.createServer(async (req, res) => {
  if (!req.url?.startsWith('/api/article-html')) {
    res.statusCode = 404
    res.end('not found')
    return
  }

  try {
    const reqUrl = new URL(req.url, 'http://localhost')
    const target = reqUrl.searchParams.get('url')
    const { status, body, contentType } = await proxyArticleHtml(String(target || ''))
    res.statusCode = status
    res.setHeader('Content-Type', contentType)
    res.end(body)
  } catch {
    res.statusCode = 502
    res.end('article proxy failed')
  }
})

server.listen(PORT, () => {
  console.log(`article html proxy listening on :${PORT}`)
})
