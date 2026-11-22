import { assetDetailPath } from '@/utils/cstrUrl'

/** 在新标签页打开数据集详情（/assets/detail/:cstr，CSTR 中的 `/` 不编码） */
export function openAssetDetailInNewTab(
  _router: unknown,
  asset: { cstr?: string; id?: string }
) {
  const id = asset.cstr || asset.id || ''
  const href = assetDetailPath(id)
  if (!href) return
  window.open(href, '_blank', 'noopener,noreferrer')
}
