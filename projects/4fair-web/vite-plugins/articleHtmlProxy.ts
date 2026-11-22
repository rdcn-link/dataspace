import type { Connect, Plugin } from 'vite'

export async function proxyArticleHtml(target: string): Promise<{ status: number; body: string; contentType: string }> {
  if (!target || !/^https?:\/\//i.test(target)) {
    return { status: 400, body: 'invalid url', contentType: 'text/plain; charset=utf-8' }
  }

  const response = await fetch(target, {
    headers: {
      'User-Agent': 'FairSpaceArticleProxy/1.0',
      Accept: 'text/html,application/xhtml+xml,*/*'
    }
  })
  const text = await response.text()
  return {
    status: response.status,
    body: text,
    contentType: response.headers.get('content-type') || 'text/html; charset=utf-8'
  }
}

function createArticleHtmlProxyMiddleware(): Connect.NextHandleFunction {
  return async (req, res) => {
    try {
      const reqUrl = new URL(req.url || '', 'http://localhost')
      const target = reqUrl.searchParams.get('url')
      const { status, body, contentType } = await proxyArticleHtml(String(target || ''))
      res.statusCode = status
      res.setHeader('Content-Type', contentType)
      res.end(body)
    } catch {
      res.statusCode = 502
      res.end('article proxy failed')
    }
  }
}

function attachArticleHtmlProxy(middlewares: Connect.Server) {
  middlewares.use('/api/article-html', createArticleHtmlProxyMiddleware())
}

export function articleHtmlProxyPlugin(): Plugin {
  return {
    name: 'article-html-proxy',
    configureServer(server) {
      attachArticleHtmlProxy(server.middlewares)
    },
    configurePreviewServer(server) {
      attachArticleHtmlProxy(server.middlewares)
    }
  }
}
