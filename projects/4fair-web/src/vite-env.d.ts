/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_WECHAT_APP_ID?: string
  readonly VITE_WECHAT_OAUTH_SCOPE?: string
  readonly VITE_WECHAT_OAUTH_SERVER_SESSION?: string
  readonly VITE_WECHAT_API_BASE?: string
  /** 科学数据银行静态资源根地址，封面图默认 https://www.scidb.cn/static */
  readonly VITE_SCIDB_STATIC_BASE?: string
  /** 手机扫码可访问的站点根地址，如 https://fairspace.cn */
  readonly VITE_APP_PUBLIC_URL?: string
  /** TPDC 数据集配置完整 URL，默认 https://fairspace.cn/datasetFile/tpdc_data_config.json */
  readonly VITE_TPDC_DATA_CONFIG_URL?: string
  /** 本地代理拉取配置时的源站，默认 https://fairspace.cn */
  readonly VITE_TPDC_DATA_CONFIG_ORIGIN?: string
  /** 数据探查服务源站，默认 https://dataseek.tpdc.ac.cn */
  readonly VITE_DATASET_SEEK_ORIGIN?: string
  /** 数据探查提交完整 URL；默认走同域 /api/v1/datasets/submissions */
  readonly VITE_DATASET_SEEK_API_URL?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}

declare module 'iconify-icon'

declare module '*.jpg' {
  const src: string
  export default src
}

declare module '*.png' {
  const src: string
  export default src
}

declare module '*.svg' {
  const src: string
  export default src
}
