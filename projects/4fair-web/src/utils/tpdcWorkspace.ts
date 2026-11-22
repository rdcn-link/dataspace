/** Pangeo / 工具市场入口（按数据集 UUID 作为 folder_id） */
export const TPDC_WORKSPACE_BASE =
  (import.meta.env.VITE_TPDC_WORKSPACE_BASE as string | undefined)?.trim() ||
  'http://10.0.82.136:8082'

export function tpdcWorkspaceUrl(folderId: string): string {
  const id = String(folderId || '').trim()
  const base = TPDC_WORKSPACE_BASE.replace(/\/$/, '')
  const url = new URL(base.includes('://') ? base : `http://${base}`)
  if (id) url.searchParams.set('folder_id', id)
  return url.toString()
}
