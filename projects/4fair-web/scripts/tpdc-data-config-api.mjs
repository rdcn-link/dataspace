/**
 * 生产环境 TPDC 数据集配置读写 API（供 Nginx 反代）
 *
 * 原因：本地 Vite 中间件只在 npm run dev 生效；线上静态站点对 PUT/POST 会返回 405。
 *
 * 启动:
 *   node scripts/tpdc-data-config-api.mjs
 *
 * 环境变量:
 *   TPDC_CONFIG_API_PORT   默认 19089
 *   TPDC_CONFIG_FILE       配置文件绝对路径
 *                          默认优先 dist/tpdc_data_config.json，其次 public/
 *
 * Nginx 示例:
 *   location /api/tpdc-data-config {
 *     proxy_pass http://127.0.0.1:19089;
 *     proxy_http_version 1.1;
 *     proxy_set_header Host $host;
 *     proxy_set_header X-Real-IP $remote_addr;
 *     proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
 *     proxy_set_header X-Forwarded-Proto $scheme;
 *   }
 *
 * 注意:
 *   1) 进程用户必须对配置文件有写权限
 *   2) 修改后写入的是服务器上的 JSON 文件；若多机部署需共享存储或改为数据库
 */
import fs from 'node:fs/promises'
import http from 'node:http'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ROOT = path.resolve(__dirname, '..')
const PORT = Number(process.env.TPDC_CONFIG_API_PORT || 19089)
const API_PREFIX = '/api/tpdc-data-config'

async function resolveConfigFile() {
  if (process.env.TPDC_CONFIG_FILE) {
    return path.resolve(process.env.TPDC_CONFIG_FILE)
  }
  const candidates = [
    path.join(ROOT, 'dist', 'tpdc_data_config.json'),
    path.join(ROOT, 'public', 'tpdc_data_config.json')
  ]
  for (const file of candidates) {
    try {
      await fs.access(file)
      return file
    } catch {
      // try next
    }
  }
  // 默认写到 dist（部署目录）
  return candidates[0]
}

const CONFIG_FILE = await resolveConfigFile()

async function readConfig() {
  const raw = await fs.readFile(CONFIG_FILE, 'utf8')
  const parsed = JSON.parse(raw)
  if (!Array.isArray(parsed)) throw new Error('tpdc_data_config.json 必须是数组')
  return parsed
}

async function writeConfig(list) {
  const text = `${JSON.stringify(list, null, '\t')}\n`
  const tmp = `${CONFIG_FILE}.${process.pid}.${Date.now()}.tmp`
  try {
    await fs.chmod(CONFIG_FILE, 0o666)
  } catch {
    // ignore
  }
  await fs.writeFile(tmp, text, 'utf8')
  try {
    await fs.copyFile(tmp, CONFIG_FILE)
  } catch (err) {
    if (err?.code === 'EPERM' || err?.code === 'EACCES') {
      try {
        await fs.chmod(CONFIG_FILE, 0o666)
      } catch {
        // ignore
      }
      await fs.writeFile(CONFIG_FILE, text, 'utf8')
    } else {
      throw err
    }
  } finally {
    await fs.unlink(tmp).catch(() => {})
  }
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = []
    req.on('data', (chunk) => chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk)))
    req.on('end', () => resolve(Buffer.concat(chunks).toString('utf8')))
    req.on('error', reject)
  })
}

function sendJson(res, status, data) {
  res.statusCode = status
  res.setHeader('Content-Type', 'application/json; charset=utf-8')
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,PATCH,DELETE,OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Accept')
  res.end(JSON.stringify(data))
}

function rowId(row) {
  return String(row?.external_id || row?.dataSetUuid || '').trim()
}

function normalizeItem(input) {
  if (!input || typeof input !== 'object') throw new Error('请求体无效')
  const external_id = String(input.external_id || input.dataSetUuid || '').trim()
  const name = String(input.name || input.dataSetName || '').trim()
  if (!external_id) throw new Error('external_id 不能为空')
  if (!name) throw new Error('name 不能为空')

  const next = { external_id, name }
  const summary = String(input.summary || input.introductionZh || '').trim()
  if (summary) next.summary = summary
  for (const key of ['dataSetPicture', 'byteSize', 'updateAt', 'dataSetOther', 'keywords', 'storage_directory']) {
    if (input[key] != null && String(input[key]).trim()) next[key] = String(input[key]).trim()
  }
  for (const key of ['时间尺度', '指标类型']) {
    const value = input[key]
    if (value && typeof value === 'object' && !Array.isArray(value)) {
      const map = {}
      for (const [k, v] of Object.entries(value)) {
        const kk = String(k || '').trim()
        if (!kk) continue
        map[kk] = String(v ?? '').trim()
      }
      if (Object.keys(map).length) next[key] = map
    }
  }
  if (Array.isArray(input.tools)) {
    next.tools = input.tools.map((id) => String(id || '').trim()).filter(Boolean)
  }
  return next
}

const server = http.createServer(async (req, res) => {
  const url = req.url || ''
  if (req.method === 'OPTIONS') {
    sendJson(res, 204, { code: 0 })
    return
  }

  if (!url.startsWith(API_PREFIX)) {
    res.statusCode = 404
    res.end('not found')
    return
  }

  try {
    const method = (req.method || 'GET').toUpperCase()
    const parsedUrl = new URL(url, 'http://localhost')
    const uuidParam = decodeURIComponent(parsedUrl.pathname.slice(API_PREFIX.length).replace(/^\//, ''))

    if (method === 'GET' && !uuidParam) {
      sendJson(res, 200, { code: 0, data: await readConfig() })
      return
    }

    if (method === 'POST' && !uuidParam) {
      const body = JSON.parse((await readBody(req)) || '{}')
      const item = normalizeItem(body)
      const list = await readConfig()
      if (list.some((row) => rowId(row) === item.external_id)) {
        sendJson(res, 409, { code: 409, message: 'external_id 已存在' })
        return
      }
      list.push(item)
      await writeConfig(list)
      sendJson(res, 200, { code: 0, data: item })
      return
    }

    if ((method === 'PUT' || method === 'PATCH') && uuidParam) {
      const body = JSON.parse((await readBody(req)) || '{}')
      const item = normalizeItem({
        ...body,
        external_id: body.external_id || body.dataSetUuid || uuidParam
      })
      const list = await readConfig()
      const idx = list.findIndex((row) => rowId(row) === uuidParam)
      if (idx < 0) {
        sendJson(res, 404, { code: 404, message: '未找到该数据集' })
        return
      }
      if (item.external_id !== uuidParam && list.some((row) => rowId(row) === item.external_id)) {
        sendJson(res, 409, { code: 409, message: '新的 external_id 已存在' })
        return
      }
      list[idx] = item
      await writeConfig(list)
      sendJson(res, 200, { code: 0, data: item })
      return
    }

    if (method === 'DELETE' && uuidParam) {
      const list = await readConfig()
      const next = list.filter((row) => rowId(row) !== uuidParam)
      if (next.length === list.length) {
        sendJson(res, 404, { code: 404, message: '未找到该数据集' })
        return
      }
      await writeConfig(next)
      sendJson(res, 200, { code: 0, data: true })
      return
    }

    sendJson(res, 405, { code: 405, message: 'Method Not Allowed' })
  } catch (e) {
    const message = e instanceof Error ? e.message : '服务器错误'
    const friendly = /EPERM|EACCES|permission/i.test(message)
      ? `无法写入配置文件：${CONFIG_FILE}（请检查读写权限）`
      : message
    sendJson(res, 500, { code: 500, message: friendly })
  }
})

server.listen(PORT, '127.0.0.1', () => {
  console.log(`[tpdc-data-config-api] listening on 127.0.0.1:${PORT}`)
  console.log(`[tpdc-data-config-api] config file: ${CONFIG_FILE}`)
})
