/** 与 Pangeo 工具市场（Home.vue buildAllAnalysisTools）对齐的工具目录 */
export type AnalysisToolOption = {
  id: string
  label: string
  desc: string
  kind: 'nc' | 'excel' | 'csv' | 'xml' | 'txt' | 'json'
  icon: string
}

export const ANALYSIS_TOOL_CATALOG: AnalysisToolOption[] = [
  {
    id: 'plot:spatial_mean',
    label: '区域平均时间序列分析',
    desc: '通用基础：对选区或全场空间平均，生成变量随时间变化的曲线，适配各类格点 NC。',
    kind: 'nc',
    icon: 'mdi:chart-line'
  },
  {
    id: 'plot:point',
    label: '单格点序列/剖面分析',
    desc: '提取单个经纬度格点的时间序列或剖面，便于定点对比分析。',
    kind: 'nc',
    icon: 'mdi:crosshairs-gps'
  },
  {
    id: 'plot:reduce_last_dim',
    label: '沿末维剖面分析',
    desc: '沿数据末维做剖面统计，快速查看某一维上的结构与变化。',
    kind: 'nc',
    icon: 'mdi:chart-bar'
  },
  {
    id: 'explore',
    label: '时空交互分析',
    desc: '在 Jupyter / Voila 中交互浏览时空数据，支持缩放、切片等探索操作。',
    kind: 'nc',
    icon: 'mdi:layers-triple-outline'
  },
  {
    id: 'map_tool',
    label: '地图工具',
    desc: '在地图上浏览与叠加空间数据图层，支持缩放、定位与图层切换。',
    kind: 'nc',
    icon: 'mdi:map'
  },
  {
    id: 'map',
    label: 'NetCDF在线分析',
    desc: '地图底图叠加 NetCDF 等网格图层，支持时间轴浏览，在弹框中查看。',
    kind: 'nc',
    icon: 'mdi:map-outline'
  },
  {
    id: 'lab',
    label: 'JupyterLab工具',
    desc: '打开完整 JupyterLab 环境，用笔记本代码做自定义分析与出图。',
    kind: 'nc',
    icon: 'mdi:console'
  },
  {
    id: 'excel_preview',
    label: 'Excel 预览',
    desc: '快速查看表格前若干行与列结构，确认字段内容后再继续分析。',
    kind: 'excel',
    icon: 'mdi:file-excel-outline'
  },
  {
    id: 'excel_viz',
    label: 'Excel 可视化分析',
    desc: '用 PyGWalker 自动出图，可切换图表类型与坐标轴、颜色字段。',
    kind: 'excel',
    icon: 'mdi:chart-scatter-plot'
  },
  {
    id: 'csv_preview',
    label: 'CSV 预览',
    desc: '预览 CSV 前若干行，核对编码、列名与数值是否正确。',
    kind: 'csv',
    icon: 'mdi:table'
  },
  {
    id: 'csv_viz',
    label: 'CSV 可视化分析',
    desc: '根据表格列自动生成统计图表，快速了解数值分布与对比关系。',
    kind: 'csv',
    icon: 'mdi:chart-timeline-variant'
  },
  {
    id: 'xml_preview',
    label: 'XML 预览',
    desc: '格式化展示 XML 文本结构，便于核对标签与层级内容。',
    kind: 'xml',
    icon: 'mdi:code-tags'
  },
  {
    id: 'txt_preview',
    label: 'TXT 预览',
    desc: '直接预览纯文本前若干行，适合日志与说明类文件。',
    kind: 'txt',
    icon: 'mdi:file-document-outline'
  },
  {
    id: 'json_preview',
    label: 'JSON 预览',
    desc: '格式化预览 JSON，并尽可能解析嵌套结构以便阅读。',
    kind: 'json',
    icon: 'mdi:code-json'
  }
]

export function analysisToolLabel(id: string): string {
  return ANALYSIS_TOOL_CATALOG.find((t) => t.id === id)?.label || id
}

export function resolveAnalysisTools(toolIds?: string[] | null): AnalysisToolOption[] {
  if (!Array.isArray(toolIds) || !toolIds.length) return []
  return toolIds
    .map((id) => String(id || '').trim())
    .filter(Boolean)
    .map((id) => {
      const found = ANALYSIS_TOOL_CATALOG.find((t) => t.id === id)
      return (
        found || {
          id,
          label: id,
          desc: '',
          kind: 'nc' as const,
          icon: 'mdi:toolbox-outline'
        }
      )
    })
}
