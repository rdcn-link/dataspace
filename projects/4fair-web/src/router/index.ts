import { createRouter, createWebHistory } from 'vue-router'
import type { RouteRecordRaw } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { resolvePostLoginNavigation } from '@/utils/loginRedirect'
import { needsOpenInWechatPrompt } from '@/utils/mobileWechatGate'
import { isMobileBrowser, isWeChatBrowser } from '@/utils/wechatOAuth'

const routes: RouteRecordRaw[] = [
  {
    path: '/',
    redirect: { name: 'InformationList' }
  },
  {
    path: '/home',
    name: 'Index',
    component: () => import('@/views/Index.vue')
  },
  {
    path: '/login',
    name: 'Login',
    component: () => import('@/views/Login.vue')
  },
  {
    path: '/register',
    name: 'Register',
    component: () => import('@/views/Register.vue')
  },
  {
    path: '/onboarding',
    name: 'Onboarding',
    component: () => import('@/views/Onboarding.vue')
  },
  {
    path: '/service',
    name: 'ServiceIndex',
    component: () => import('@/views/ServiceIndex.vue')
  },
  {
    path: '/service/list',
    name: 'ServiceList',
    component: () => import('@/views/ServiceList.vue')
  },
  {
    path: '/assets',
    name: 'AssetList',
    component: () => import('@/views/AssetList.vue')
  },
  {
    path: '/analysis-datasets',
    name: 'AnalysisDatasets',
    component: () => import('@/views/AnalysisDatasets.vue')
  },
  {
    path: '/analysis-datasets/:uuid',
    name: 'AnalysisDatasetDetail',
    component: () => import('@/views/AnalysisDatasetDetail.vue')
  },
  {
    path: '/data-centers',
    name: 'DataCentersHub',
    component: () => import('@/views/DataCentersHub.vue')
  },
  {
    path: '/spatial-hubs',
    name: 'SpaceHubs',
    component: () => import('@/views/SpaceHubs.vue')
  },
  {
    path: '/consultation',
    redirect: { name: 'InformationList' }
  },
  {
    path: '/headlines',
    name: 'InformationList',
    component: () => import('@/views/InformationList.vue')
  },
  {
    path: '/headlines/:id',
    name: 'InformationDetail',
    component: () => import('@/views/InformationDetail.vue'),
    props: true
  },
  /** 青藏高原 CO₂ 通量数据集 · 数据分析工具（须在 AssetDetail 之前注册） */
  {
    path: '/assets/detail/:id(.+)/analysis',
    name: 'DatasetCo2Analysis',
    component: () => import('@/views/DatasetCo2Analysis.vue'),
    props: true
  },
  /** 雅鲁藏布江野外科考记录数据集 · 数据分析工具 */
  {
    path: '/assets/detail/:id(.+)/field-expedition-analysis',
    name: 'DatasetFieldExpeditionAnalysis',
    component: () => import('@/views/DatasetFieldExpeditionAnalysis.vue'),
    props: true
  },
  /** 雅鲁藏布江松散沉积物厚度标定图集 · 数据分析工具 */
  {
    path: '/assets/detail/:id(.+)/sediment-thickness-analysis',
    name: 'DatasetSedimentThicknessAnalysis',
    component: () => import('@/views/DatasetSedimentThicknessAnalysis.vue'),
    props: true
  },
  /** 雅鲁藏布江松散沉积物实测剖面数据集 · 数据分析工具 */
  {
    path: '/assets/detail/:id(.+)/sediment-profile-analysis',
    name: 'DatasetSedimentProfileAnalysis',
    component: () => import('@/views/DatasetSedimentProfileAnalysis.vue'),
    props: true
  },
  /** 雅鲁藏布江松散沉积物数据集 · 数据分析工具 */
  {
    path: '/assets/detail/:id(.+)/sediment-analysis',
    name: 'DatasetSedimentAnalysis',
    component: () => import('@/views/DatasetSedimentAnalysis.vue'),
    props: true
  },
  /** 数据速递列表 → 详情（CSTR 可含 `/`，如 31253.11.10.5281/zenodo.4001022） */
  {
    path: '/assets/detail/:id(.+)',
    name: 'AssetDetail',
    component: () => import('@/views/AssetDetail.vue'),
    props: true
  },
  {
    path: '/data/:id(.+)',
    name: 'DataDetail',
    component: () => import('@/views/DataDetail.vue')
  },
  {
    path: '/intent/apply',
    name: 'IntentApply',
    component: () => import('@/views/IntentApply.vue')
  },
  {
    path: '/intent/apply-old',
    name: 'OldIntentApply',
    component: () => import('@/views/oldIntentApply.vue')
  },
  {
    path: '/intent/apply-new',
    name: 'IntentApplyNew',
    component: () => import('@/views/IntentApplyNew.vue')
  },
  {
    path: '/intent/mgmt',
    name: 'IntentMgmt',
    component: () => import('@/views/IntentMgmt.vue')
  },
  {
    path: '/auth/agreement',
    name: 'AuthAgreement',
    component: () => import('@/views/AuthAgreement.vue')
  },
  {
    path: '/auth/mgmt',
    name: 'AuthMgmt',
    component: () => import('@/views/AuthMgmt.vue')
  },
  {
    path: '/agent/mgmt',
    name: 'AgentMgmt',
    component: () => import('@/views/AgentMgmt.vue')
  },
  {
    path: '/workflow',
    name: 'Workflow',
    component: () => import('@/views/Workflow.vue')
  },
  {
    path: '/export/apply',
    name: 'ExportApply',
    component: () => import('@/views/ExportApply.vue')
  },
  {
    path: '/messages',
    name: 'Messages',
    component: () => import('@/views/Messages.vue')
  },
  {
    path: '/profile',
    name: 'Profile',
    component: () => import('@/views/Profile.vue')
  },
  {
    path: '/publish/asset',
    name: 'PublishAsset',
    component: () => import('@/views/PublishAsset.vue')
  },
  {
    path: '/audit/log',
    name: 'AuditLog',
    component: () => import('@/views/AuditLog.vue')
  },
  {
    path: '/detail/:id',
    name: 'Detail',
    component: () => import('@/views/Detail.vue')
  },
  {
    path: '/oidc-server/wechat/h5',
    name: 'WechatH5',
    redirect: { name: 'WechatScanLogin' }
  },
  {
    path: '/w/:state',
    name: 'WechatOAuthShort',
    component: () => import('@/views/WechatOAuthShort.vue')
  },
  {
    path: '/wx/login',
    name: 'WechatScanLogin',
    component: () => import('@/views/WechatScanLogin.vue')
  },
  {
    path: '/oidc-server/wechat/login',
    redirect: { name: 'WechatScanLogin' }
  },
  {
    path: '/oidc-server/wechat/auth',
    name: 'WechatAuth',
    redirect: { name: 'WechatScanLogin' }
  },
  {
    path: '/wx/oauth',
    name: 'WechatOAuth',
    component: () => import('@/views/WechatOAuthH5.vue')
  },
  {
    /** 旧回调路径：本地 Vite 可打开；生产 Nginx 会 403，授权须用 /wx/oauth */
    path: '/oidc-server/wechat/oauth',
    redirect: { name: 'WechatOAuth' }
  },
  {
    path: '/oidc-server/user/share',
    name: 'UserShare',
    component: () => import('@/views/UserShare.vue')
  },
  {
    path: '/goutong',
    name: 'Goutong',
    component: () => import('@/views/Goutong.vue')
  },
  {
    path: '/m/apply-approval',
    name: 'MobileApplyApproval',
    component: () => import('@/views/MobileApplyApproval.vue')
  },
  {
    path: '/m/apply-audit',
    name: 'MobileApplyAudit',
    component: () => import('@/views/MobileApplyAudit.vue')
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes,
  scrollBehavior(to, _from, savedPosition) {
    if (to.name === 'Index') {
      return { top: 0, left: 0 }
    }
    if (savedPosition) {
      return savedPosition
    }
    return { top: 0, left: 0 }
  }
})

// 公开路由（无需登录即可访问）
/** 离开页面后仍保留组件状态（筛选、分页、滚动等） */
export const KEEP_ALIVE_VIEW_NAMES = ['AssetList']

export const PUBLIC_ROUTE_NAMES = new Set<string>([
  'Login',
  'Register',
  'Onboarding',
  'WechatH5',
  'WechatAuth',
  'WechatScanLogin',
  'WechatOAuthShort',
  'WechatOAuth',
  'AuthAgreement',
  'Index',
  'ServiceIndex',
  'ServiceList',
  'AssetList',
  'AnalysisDatasets',
  'AnalysisDatasetDetail',
  'SpaceHubs',
  'InformationList',
  'InformationDetail',
  'AssetDetail',
  'DatasetCo2Analysis',
  'DatasetSedimentAnalysis',
  'DatasetSedimentProfileAnalysis',
  'DatasetSedimentThicknessAnalysis',
  'DatasetFieldExpeditionAnalysis',
  'DataDetail',
  'UserShare',
  'IntentApplyNew',
  'MobileApplyApproval',
  'MobileApplyAudit'
])

/** 静态资源路径：不做登录校验（避免图标/封面被踢到登录页） */
export function isPublicStaticAssetPath(path: string): boolean {
  const p = String(path || '').split('?')[0]
  if (!p) return false
  if (p.startsWith('/images/')) return true
  if (p.startsWith('/datasetFile/')) return true
  if (p.startsWith('/static/')) return true
  if (p.startsWith('/cover')) return true
  if (p.startsWith('/fairspace-logo')) return true
  return /\.(svg|png|jpe?g|gif|webp|ico|css|js|mjs|map|woff2?|ttf|eot)$/i.test(p)
}

/**
 * 移动端非微信：仅允许停留在登录引导页 / 微信相关页，其余一律引导「请在微信中打开」
 */
export { OPEN_IN_WECHAT_ALLOW_ROUTE_NAMES as MOBILE_NON_WECHAT_ALLOW_NAMES } from '@/utils/mobileWechatGate'
export { needsOpenInWechatPrompt as shouldForceOpenInWeChat } from '@/utils/mobileWechatGate'

router.beforeEach((to, _from, next) => {
  const authStore = useAuthStore()
  authStore.syncFromStorage()

  // 静态图标等资源路径一律放行，不做登录跳转
  if (isPublicStaticAssetPath(to.path)) {
    return next()
  }

  // 移动端非微信：任意业务页 → 登录页「请在微信中打开」引导
  if (needsOpenInWechatPrompt(to.name)) {
    return next({
      name: 'Login',
      query: { redirect: to.fullPath },
      replace: true
    })
  }

  if (
    !authStore.isLoggedIn &&
    (to.name === 'Login' || to.name === 'WechatScanLogin')
  ) {
    authStore.tryRestoreAfterLogout()
  }

  const loggedIn = authStore.isLoggedIn

  if (PUBLIC_ROUTE_NAMES.has(to.name as string)) {
    if (loggedIn && to.name === 'Login') {
      // 移动端非微信需停留展示引导，不可因已登录而跳走（否则会与上方门禁互相重定向）
      if (isMobileBrowser() && !isWeChatBrowser()) {
        return next()
      }
      return next(resolvePostLoginNavigation(to.query.redirect, '/'))
    }
    if (loggedIn && to.name === 'Register') {
      return next(resolvePostLoginNavigation(to.query.redirect, '/'))
    }
    return next()
  }

  if (!loggedIn) {
    return next({ name: 'Login', query: { redirect: to.fullPath } })
  }

  next()
})

export default router
