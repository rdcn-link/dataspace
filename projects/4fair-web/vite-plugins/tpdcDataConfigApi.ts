import fs from 'node:fs/promises'
import path from 'node:path'
import type { Connect, Plugin } from 'vite'

const API_PREFIX = '/api/tpdc-data-config'
const CONFIG_REL = path.join('public', 'tpdc_data_config.json')

export type TpdcDatasetConfig = {
  dataSetUuid: string
  dataSetName: string
  dataSetPicture?: string
  introductionZh?: string
  byteSize?: string
  updateAt?: string
  dataSetOther?: string
  时间尺度?: Record<string, string>
  指标类型?: Record<string, string>
  tools?: string[]
  [key: string]: unknown
}

function configPath(root: string) {
  return path.resolve(root, CONFIG_REL)
}

async function readConfig(root: string): Promise<TpdcDatasetConfig[]> {
  const raw = await fs.readFile(configPath(root), 'utf8')
  const parsed = JSON.parse(raw)
  if (!Array.isArray(parsed)) throw new Error('tpdc_data_config.json 必须是数组')
  return parsed as TpdcDatasetConfig[]
}

async function writeConfig(root: string, list: TpdcDatasetConfig[]) {
  const file = configPath(root)
  const text = `${JSON.stringify(list, null, '\t')}\n`
  const tmp = `${file}.${process.pid}.${Date.now()}.tmp`

  // Windows 下文件可能带只读属性（EPERM），写入前先尝试去掉
  try {
    await fs.chmod(file, 0o666)
  } catch {
    // 文件不存在时忽略
  }

  await fs.writeFile(tmp, text, 'utf8')
  try {
    await fs.copyFile(tmp, file)
  } catch (err) {
    const code = (err as NodeJS.ErrnoException)?.code
    if (code === 'EPERM' || code === 'EACCES') {
      try {
        await fs.chmod(file, 0o666)
      } catch {
        // ignore
      }
      await fs.writeFile(file, text, 'utf8')
    } else {
      throw err
    }
  } finally {
    await fs.unlink(tmp).catch(() => {})
  }
}

function readBody(req: Connect.IncomingMessage): Promise<string> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = []
    req.on('data', (chunk) => chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk)))
    req.on('end', () => resolve(Buffer.concat(chunks).toString('utf8')))
    req.on('error', reject)
  })
}

function sendJson(res: Connect.ServerResponse, status: number, data: unknown) {
  res.statusCode = status
  res.setHeader('Content-Type', 'application/json; charset=utf-8')
  res.end(JSON.stringify(data))
}

function normalizeItem(input: unknown): TpdcDatasetConfig {
  if (!input || typeof input !== 'object') throw new Error('请求体无效')
  const row = input as Record<string, unknown>
  const dataSetUuid = String(row.dataSetUuid || '').trim()
  const dataSetName = String(row.dataSetName || '').trim()
  if (!dataSetUuid) throw new Error('dataSetUuid 不能为空')
  if (!dataSetName) throw new Error('dataSetName 不能为空')

  const next: TpdcDatasetConfig = {
    dataSetUuid,
    dataSetName
  }

  const optionalStrings = [
    'dataSetPicture',
    'introductionZh',
    'byteSize',
    'updateAt',
    'dataSetOther'
  ] as const
  for (const key of optionalStrings) {
    if (row[key] != null && String(row[key]).trim()) {
      next[key] = String(row[key]).trim()
    }
  }

  for (const key of ['时间尺度', '指标类型'] as const) {
    const value = row[key]
    if (value && typeof value === 'object' && !Array.isArray(value)) {
      const map: Record<string, string> = {}
      for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
        const kk = String(k || '').trim()
        if (!kk) continue
        map[kk] = String(v ?? '').trim()
      }
      if (Object.keys(map).length) next[key] = map
    }
  }

  if (Array.isArray(row.tools)) {
    next.tools = row.tools
      .map((id) => String(id || '').trim())
      .filter(Boolean)
  }

  return next
}

function createMiddleware(root: string): Connect.NextHandleFunction {
  return async (req, res, next) => {
    const url = req.url || ''
    if (!url.startsWith(API_PREFIX)) {
      next()
      return
    }

    try {
      const method = (req.method || 'GET').toUpperCase()
      const parsedUrl = new URL(url, 'http://localhost')
      const uuidParam = decodeURIComponent(parsedUrl.pathname.slice(API_PREFIX.length).replace(/^\//, ''))

      if (method === 'GET' && !uuidParam) {
        const list = await readConfig(root)
        sendJson(res, 200, { code: 0, data: list })
        return
      }

      if (method === 'POST' && !uuidParam) {
        const body = JSON.parse((await readBody(req)) || '{}')
        const item = normalizeItem(body)
        const list = await readConfig(root)
        if (list.some((row) => row.dataSetUuid === item.dataSetUuid)) {
          sendJson(res, 409, { code: 409, message: 'dataSetUuid 已存在' })
          return
        }
        list.push(item)
        await writeConfig(root, list)
        sendJson(res, 200, { code: 0, data: item })
        return
      }

      if ((method === 'PUT' || method === 'PATCH') && uuidParam) {
        const body = JSON.parse((await readBody(req)) || '{}')
        const item = normalizeItem({ ...body, dataSetUuid: body.dataSetUuid || uuidParam })
        const list = await readConfig(root)
        const idx = list.findIndex((row) => row.dataSetUuid === uuidParam)
        if (idx < 0) {
          sendJson(res, 404, { code: 404, message: '未找到该数据集' })
          return
        }
        if (item.dataSetUuid !== uuidParam && list.some((row) => row.dataSetUuid === item.dataSetUuid)) {
          sendJson(res, 409, { code: 409, message: '新的 dataSetUuid 已存在' })
          return
        }
        list[idx] = item
        await writeConfig(root, list)
        sendJson(res, 200, { code: 0, data: item })
        return
      }

      if (method === 'DELETE' && uuidParam) {
        const list = await readConfig(root)
        const next = list.filter((row) => row.dataSetUuid !== uuidParam)
        if (next.length === list.length) {
          sendJson(res, 404, { code: 404, message: '未找到该数据集' })
          return
        }
        await writeConfig(root, next)
        sendJson(res, 200, { code: 0, data: true })
        return
      }

      sendJson(res, 405, { code: 405, message: 'Method Not Allowed' })
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : '服务器错误'
      const friendly =
        /EPERM|EACCES|operation not permitted|permission denied/i.test(message)
          ? '无法写入配置文件（可能被设为只读或被占用）。请取消 public/tpdc_data_config.json 的只读属性后重试。'
          : message
      sendJson(res, 500, { code: 500, message: friendly })
    }
  }
}

export function tpdcDataConfigApiPlugin(): Plugin {
  return {
    name: 'tpdc-data-config-api',
    configureServer(server) {
      server.middlewares.use(createMiddleware(server.config.root))
    },
    configurePreviewServer(server) {
      server.middlewares.use(createMiddleware(server.config.root))
    }
  }
}
