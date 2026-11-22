/** 侧边栏「数据领域」树节点（path 为筛选参数 subject：新接口为 code，旧接口为分号路径） */
export type SubjectTreeNode = {
  /** 筛选参数 subject */
  path: string
  label: string
  datasetNumber: number
  depth: number
  children: SubjectTreeNode[]
}

export type SubjectFlatRow = {
  name: string
  datasetNumber: number
}

export type SubjectStatisticsItem = {
  /** 传给 dataset.page 的 subject 参数 */
  filterKey: string
  label: string
  datasetNumber: number
}

function extractStatisticsRows(data: unknown): Record<string, unknown>[] {
  if (data == null) return []
  if (Array.isArray(data)) return data as Record<string, unknown>[]
  if (typeof data !== 'object') return []

  const o = data as Record<string, unknown>
  if (Array.isArray(o.rows)) return o.rows as Record<string, unknown>[]
  if (Array.isArray(o.list)) return o.list as Record<string, unknown>[]
  if (Array.isArray(o.records)) return o.records as Record<string, unknown>[]
  if (Array.isArray(o.data)) return o.data as Record<string, unknown>[]

  const skip = new Set(['total', 'code', 'message', 'success', 'datasetNumber', 'datesetNumber'])
  return Object.entries(o)
    .filter(([k]) => !skip.has(k))
    .map(([k, v]) => {
      if (typeof v === 'number' || (typeof v === 'string' && v !== '' && !Number.isNaN(Number(v)))) {
        return { _id: k, datasetNumber: v }
      }
      return v
    })
    .filter((v): v is Record<string, unknown> => !!v && typeof v === 'object' && !Array.isArray(v))
}

function readCount(raw: Record<string, unknown>): number {
  const c =
    raw.datesetNumber ??
    raw.datasetNumber ??
    raw.count ??
    raw.total ??
    raw.num ??
    raw.datasetCount ??
    raw.value ??
    raw.size ??
    0
  return Number(c) || 0
}

/** 解析 /tds-trading/order/subject.datasetStatistics 返回（支持新 code+nameZh 与旧分号路径） */
export function parseSubjectStatisticsData(data: unknown): SubjectStatisticsItem[] {
  const rows = extractStatisticsRows(data)
  const result: SubjectStatisticsItem[] = []

  for (const raw of rows) {
    const nameZh = String(raw.nameZh || raw.name_zh || '').trim()
    const code = String(raw.code || '').trim()
    const count = readCount(raw)

    if (nameZh && code) {
      result.push({ filterKey: code, label: nameZh, datasetNumber: count })
      continue
    }

    const legacyPath = String(
      raw._id ?? raw.subject ?? raw.subjectName ?? raw.name ?? raw.label ?? raw.key ?? raw.field ?? ''
    ).trim()
    if (!legacyPath) continue

    const label = String(raw.label ?? raw.subjectName ?? legacyPath).trim() || legacyPath
    result.push({ filterKey: legacyPath, label, datasetNumber: count })
  }

  return result
}

export function sumSubjectStatistics(items: SubjectStatisticsItem[]): number {
  return items.reduce((sum, item) => sum + item.datasetNumber, 0)
}

/** 由领域统计构建侧边栏树 */
export function buildSubjectTreeFromStatistics(items: SubjectStatisticsItem[]): SubjectTreeNode[] {
  const usesCodeList = items.length > 0 && items.every((item) => !item.filterKey.includes(';'))

  if (usesCodeList) {
    return items
      .map((item) => ({
        path: item.filterKey,
        label: item.label,
        datasetNumber: item.datasetNumber,
        depth: 0,
        children: [] as SubjectTreeNode[]
      }))
      .sort(
        (a, b) =>
          b.datasetNumber - a.datasetNumber || a.label.localeCompare(b.label, 'zh-CN')
      )
  }

  return buildSubjectTree(
    items.map((item) => ({
      name: item.filterKey,
      datasetNumber: item.datasetNumber
    }))
  )
}

type MutableNode = {
  label: string
  path: string
  leafCount: number
  children: Map<string, MutableNode>
}

function sumSubtree(node: MutableNode): number {
  let total = node.leafCount
  for (const child of node.children.values()) {
    total += sumSubtree(child)
  }
  return total
}

function mapToTree(m: Map<string, MutableNode>, depth: number): SubjectTreeNode[] {
  return [...m.values()]
    .map((n) => {
      const children = mapToTree(n.children, depth + 1)
      return {
        path: n.path,
        label: n.label,
        datasetNumber: sumSubtree(n),
        depth,
        children
      }
    })
    .sort(
      (a, b) =>
        b.datasetNumber - a.datasetNumber || a.label.localeCompare(b.label, 'zh-CN')
    )
}

/**
 * 将接口返回的扁平 _id（分号分级）合并为树
 * 例：「地球科学;海洋科学;海洋地质学」→ 三级节点
 */
export function buildSubjectTree(rows: SubjectFlatRow[]): SubjectTreeNode[] {
  const root = new Map<string, MutableNode>()

  for (const row of rows) {
    const parts = row.name
      .split(';')
      .map((s) => s.trim())
      .filter(Boolean)
    if (!parts.length) continue

    let map = root
    const pathParts: string[] = []

    for (let i = 0; i < parts.length; i++) {
      const label = parts[i]
      pathParts.push(label)
      const path = pathParts.join(';')

      if (!map.has(label)) {
        map.set(label, {
          label,
          path,
          leafCount: 0,
          children: new Map()
        })
      }

      const node = map.get(label)!
      if (i === parts.length - 1) {
        node.leafCount += row.datasetNumber
      }
      map = node.children
    }
  }

  return mapToTree(root, 0)
}

/** 默认展开前两级，避免初次加载全部折叠 */
export function collectDefaultExpandedPaths(
  nodes: SubjectTreeNode[],
  maxDepth = 1
): string[] {
  const paths: string[] = []
  const walk = (list: SubjectTreeNode[]) => {
    for (const n of list) {
      if (n.depth < maxDepth && n.children.length > 0) {
        paths.push(n.path)
        walk(n.children)
      }
    }
  }
  walk(nodes)
  return paths
}
