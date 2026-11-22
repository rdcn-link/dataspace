import { defineConfig, loadEnv } from 'vite'
import vue from '@vitejs/plugin-vue'
import path from 'path'
import { articleHtmlProxyPlugin } from './vite-plugins/articleHtmlProxy'
import { tpdcDataConfigApiPlugin } from './vite-plugins/tpdcDataConfigApi'

export default defineConfig(({ mode }) => {
  // 根据 mode 加载对应 .env 文件（development / production）
  const env = loadEnv(mode, process.cwd(), '')

  /** 本地主后端（长耗时流式等） */
  const localMainBackend = 'http://localhost:8080'
  const localMainProxy = {
    target: localMainBackend,
    changeOrigin: true,
    timeout: 600000
  } as const

  /** 微信登录弹框 API（与 tds-agent-web1 一致：wxLogin / status 直连后端） */
  const wechatApiTarget = env.VITE_WECHAT_API_BASE || 'https://fairspace.cn'
  const wechatApiProxy = {
    target: wechatApiTarget,
    changeOrigin: true,
    timeout: 30000
  } as const

  return {
    plugins: [
      vue({
        template: {
          compilerOptions: {
            isCustomElement: (tag) => tag === 'iconify-icon'
          }
        }
      }),
      articleHtmlProxyPlugin(),
      tpdcDataConfigApiPlugin()
    ],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src')
      }
    },
    build: {
      // 构建产物目录勿用默认 assets，否则与前端路由 /assets（数据速递）在 Nginx 上冲突导致 403
      // 服务详情静态页放在 public/service-pages/，勿用 public/service/，否则与 /service 路由冲突 403
      assetsDir: 'static',
      rollupOptions: {
        output: {
          manualChunks(id) {
            if (!id.includes('node_modules')) return
            if (id.includes('marked')) return 'marked'
            if (id.includes('axios')) return 'axios'
          }
        }
      }
    },
    server: {
      port: 9587,
      open: true,
      proxy: {
        '/agui': localMainProxy,
        '/tds-agent': {
          target: env.VITE_AGUI_API_BASE || 'https://fairspace.cn',
          changeOrigin: true,
          timeout: 600000
        },
        '/upload': localMainProxy,
        '/service-hall': localMainProxy,
        '^/oidc-server/wechat/wxLogin': wechatApiProxy,
        '^/oidc-server/wechat/bindUser': wechatApiProxy, 
        '^/oidc-server/wechat/code2session': wechatApiProxy,
        '^/oidc-server/wechat/code2openidByService': wechatApiProxy,
        '^/oidc-server/wechat/status': wechatApiProxy,
        '^/oidc-server/wechat/receive': wechatApiProxy,
        '/wechat': {
          ...wechatApiProxy,
          bypass(req) {
            const pathOnly = (req.url || '').split('?')[0]
            // 前端页面路由走 SPA；API 已由上方 ^/oidc-server/wechat/wxLogin 等规则优先匹配
            if (
              pathOnly === '/oidc-server/wechat/login' ||
              pathOnly === '/oidc-server/wechat/auth' ||
              pathOnly === '/oidc-server/wechat/oauth' ||
              pathOnly === '/oidc-server/wechat/h5' ||
              pathOnly === '/wx/oauth' ||
              pathOnly === '/wx/login' ||
              pathOnly.startsWith('/w/')
            ) {
              return '/index.html'
            }
          }
        },
        '/tds-trading/order': {
          // 生产网关按 Origin 校验：只放行 https://fairspace.cn，本地 Origin 会 403
          target: env.VITE_ORDER_API_BASE || 'https://fairspace.cn',
          changeOrigin: true,
          timeout: 30000,
          headers: {
            Origin: 'https://fairspace.cn',
            Referer: 'https://fairspace.cn/'
          }
        },
        // 数据集封面：接口返回 /cover/... 或 /cover2026/... 相对路径
        '^/cover': {
          target: env.VITE_SCIDB_STATIC_BASE || 'https://www.scidb.cn/static',
          changeOrigin: true,
          timeout: 30000
        },
        // TPDC 在线分析数据集配置（仅代理线上，不读 public 本地文件）
        '/__remote/tpdc_data_config.json': {
          target: env.VITE_TPDC_DATA_CONFIG_ORIGIN || 'https://fairspace.cn',
          changeOrigin: true,
          timeout: 30000,
          rewrite: () => '/datasetFile/tpdc_data_config.json'
        },
        // 数据探查提交：同域 /api/v1/datasets → 探查服务（不跟随 307，避免跳到门户）
        '/api/v1/datasets': {
          target: env.VITE_DATASET_SEEK_ORIGIN || 'https://dataseek.tpdc.ac.cn',
          changeOrigin: true,
          secure: false,
          timeout: 60000,
          followRedirects: false
        },
        // chem/scidb 数据探查提交：本地代理到测试源站（生产由门户 Nginx /api/dataset-seek/ 反代）
        '/api/dataset-seek': {
          target: env.VITE_DATASET_SEEK_TEST_ORIGIN || 'http://39.106.98.67:7000',
          changeOrigin: true,
          secure: false,
          timeout: 60000,
          followRedirects: false,
          rewrite: (path: string) => path.replace(/^\/api\/dataset-seek/, '/api/v1/datasets')
        },
        // 兼容更旧前缀
        '/dataset-chat-api': {
          target: env.VITE_DATASET_SEEK_ORIGIN || 'https://dataseek.tpdc.ac.cn',
          changeOrigin: true,
          secure: false,
          timeout: 60000,
          followRedirects: false,
          rewrite: (path: string) => path.replace(/^\/dataset-chat-api/, '')
        },
        // 分析工具 toolLogo：/datasetFile/coverUrl/...
        '/datasetFile': {
          target: env.VITE_AGUI_API_BASE || 'https://fairspace.cn',
          changeOrigin: true,
          timeout: 30000
        },
        '/oidc-server/sso': {
          target: env.VITE_USER_API_BASE || 'https://fairspace.cn',
          changeOrigin: true,
          timeout: 30000
        },
        '/oidc-server/user': {
          target: env.VITE_USER_API_BASE || 'https://fairspace.cn',
          changeOrigin: true,
          timeout: 30000,
          bypass(req) {
            const pathOnly = (req.url || '').split('?')[0]
            // 前端页面路由，不走接口代理
            if (pathOnly === '/oidc-server/user/share' || pathOnly.endsWith('/user/share')) {
              return '/index.html'
            }
          }
        },
        '/user': {
          target: env.VITE_USER_API_BASE,
          changeOrigin: true,
          timeout: 30000,
          bypass(req) {
            const path = (req.url || '').split('?')[0]
            // 与后端 /oidc-server/user/* 接口同前缀的前端页面，须返回 SPA 入口，否则会被代理成接口请求并 403
            if (path === '/oidc-server/user/share') return '/index.html'
          }
        }
      }
    }
  }
})
