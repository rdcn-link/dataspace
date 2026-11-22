import type { DataCenterDef } from '@/utils/dataCenterRegistry'

export function normalizeRole(role?: string | null): string {
  return String(role || '').trim()
}

/** 超级管理员 */
export function isSuperAdmin(role?: string | null): boolean {
  const r = normalizeRole(role)
  return Boolean(r) && /超级管理员/.test(r)
}

/**
 * 机构管理员（普通管理员，不含超级管理员）
 * 兼容：管理员 / 机构管理员 等
 */
export function isInstitutionAdmin(role?: string | null): boolean {
  const r = normalizeRole(role)
  if (!r || isSuperAdmin(r)) return false
  return /管理员/.test(r)
}

export type DataCenterAccess = {
  /** 可进入数据中心节点页 */
  canAccess: boolean
  /** 超级管理员 → 总节点；机构管理员入口已关闭 */
  mode: 'all' | 'institution' | 'none'
  /** 侧栏文案 */
  menuLabel: string
  /** 匹配到的机构中心（预留） */
  center: DataCenterDef | null
}

export function resolveDataCenterAccess(profile?: {
  role?: string
  institution?: string
  orgName?: string
  affiliation?: string
} | null): DataCenterAccess {
  if (!profile) {
    return { canAccess: false, mode: 'none', menuLabel: '', center: null }
  }

  // 仅超级管理员显示「总数据中心节点」；机构管理员不展示「数据分析」节点
  if (isSuperAdmin(profile.role)) {
    return {
      canAccess: true,
      mode: 'all',
      menuLabel: '总数据中心节点',
      center: null
    }
  }

  return { canAccess: false, mode: 'none', menuLabel: '', center: null }
}
