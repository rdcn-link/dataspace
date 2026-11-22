import { datasetGetDownloadUrlPath, normalizeCstr } from '@/utils/cstrUrl'

export type DatasetFileItem = {
  name: string
  type: string
  size: string
  isFolder: boolean
  downloadUrl?: string
}

function formatFileSize(bytes: number | string): string {
  const b = Number(bytes)
  if (!b || b <= 0) return '未知'
  const units = ['B', 'KB', 'MB', 'GB', 'TB']
  let i = 0
  let size = b
  while (size >= 1024 && i < units.length - 1) {
    size /= 1024
    i++
  }
  return `${size.toFixed(i === 0 ? 0 : 1)} ${units[i]}`
}

function getChildren(item: Record<string, unknown>): unknown[] {
  const raw = item.children ?? item.childList ?? item.child ?? item.fileList ?? item.files
  return Array.isArray(raw) ? raw : []
}

function extractFileName(item: Record<string, unknown>): string {
  return String(
    item.fileName ?? item.name ?? item.title ?? item.file_name ?? item.label ?? ''
  ).trim()
}

function isFolderNode(item: Record<string, unknown>, children: unknown[]): boolean {
  if (item.isDirectory === true || item.isDir === true || item.directory === true) return true
  if (item.isFolder === true || item.folder === true) return true
  if (item.isFile === false) return true

  const type = String(item.type ?? item.fileType ?? '').toLowerCase()
  if (type === 'folder' || type === 'dir' || type === 'directory') return true
  if (item.fileType === 1 || item.fileType === '1') return true

  if (children.length > 0) {
    const hasSize = item.byteSize != null || item.fileSize != null || item.size != null
    if (!hasSize) return true
  }

  return false
}

function extractFileType(item: Record<string, unknown>, isFolder: boolean): string {
  if (isFolder) return '文件夹'

  const raw = String(item.suffix ?? item.fileSuffix ?? item.format ?? '').trim()
  if (raw) return raw.replace(/^\./, '').toUpperCase()

  const type = String(item.fileType ?? item.type ?? '').trim()
  if (type && !/^\d+$/.test(type)) return type.toUpperCase()

  const name = extractFileName(item)
  const dot = name.lastIndexOf('.')
  if (dot > 0) return name.slice(dot + 1).toUpperCase()

  return '文件'
}

function extractFileSize(item: Record<string, unknown>, isFolder: boolean): string {
  const raw = item.byteSize ?? item.fileSize ?? item.size
  if (raw === undefined || raw === null || raw === '') {
    return isFolder ? '-' : '未知'
  }
  return formatFileSize(raw as number | string)
}

function extractDownloadUrl(item: Record<string, unknown>): string | undefined {
  const url = String(item.downloadUrl ?? item.download_url ?? item.url ?? '').trim()
  return url || undefined
}

function isOkCode(code: unknown): boolean {
  return code === 200 || code === 0 || code === '200'
}

function mapDatasetFileRecord(item: Record<string, unknown>): DatasetFileItem | null {
  const children = getChildren(item)
  const isFolder = isFolderNode(item, children)
  const name = extractFileName(item) || (isFolder ? '文件夹' : '未命名文件')

  return {
    name,
    type: extractFileType(item, isFolder),
    size: extractFileSize(item, isFolder),
    isFolder,
    downloadUrl: isFolder ? undefined : extractDownloadUrl(item)
  }
}

function parseFlatFileRecords(data: unknown[]): DatasetFileItem[] {
  const result: DatasetFileItem[] = []

  for (const node of data) {
    if (!node || typeof node !== 'object') continue
    const item = node as Record<string, unknown>
    const children = getChildren(item)

    if (children.length) {
      result.push(...flattenFiles([item]))
      continue
    }

    const mapped = mapDatasetFileRecord(item)
    if (mapped) result.push(mapped)
  }

  return result
}

function flattenFiles(nodes: unknown[]): DatasetFileItem[] {
  const result: DatasetFileItem[] = []

  for (const node of nodes) {
    if (!node || typeof node !== 'object') continue
    const item = node as Record<string, unknown>
    const children = getChildren(item)
    const mapped = mapDatasetFileRecord(item)
    if (!mapped) continue

    result.push(mapped)

    if (children.length) {
      result.push(...flattenFiles(children))
    }
  }

  return result
}

/** 解析 dataset.getDownloadUrl 返回的文件树/列表 */
export function parseDatasetFileList(data: unknown): DatasetFileItem[] {
  if (!data) return []
  if (Array.isArray(data)) {
    const flat = parseFlatFileRecords(data)
    return flat.length ? flat : flattenFiles(data)
  }

  if (typeof data === 'object') {
    const o = data as Record<string, unknown>
    const list = o.fileList ?? o.files ?? o.children ?? o.childList ?? o.list ?? o.rows
    if (Array.isArray(list)) {
      const flat = parseFlatFileRecords(list)
      return flat.length ? flat : flattenFiles(list)
    }
    if (extractFileName(o) || getChildren(o).length) return flattenFiles([o])
  }

  return []
}

export async function fetchDatasetFileList(cstr: string): Promise<DatasetFileItem[]> {
  const id = normalizeCstr(cstr)
  if (!id) return []

  try {
    const res = await fetch(datasetGetDownloadUrlPath(id))
    if (!res.ok) return []

    const json = await res.json()
    if (!isOkCode(json.code)) return []

    return parseDatasetFileList(json.data)
  } catch {
    return []
  }
}
