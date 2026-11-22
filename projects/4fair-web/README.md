# 费尔空间 - Vue3 前端项目

> 从静态HTML页面自动转换的 Vue3 + Vite 前端项目

## 项目说明

本项目是从 `D:\workspace\workspace_ai\tds-agent\src\main\resources\static\service` 目录下的20个HTML页面全自动转换而来的独立Vue3前端项目。

**转换原则：**
- ✅ 1:1 还原所有UI设计和样式
- ✅ 保留所有原有交互逻辑
- ✅ 完美支持移动端适配
- ✅ 采用 Vue3 组合式 API `<script setup>`
- ✅ 自动生成路由配置
- ✅ 工程化标准结构

## 项目结构

```
tds-agent-web/
├── public/                    # 静态资源目录
│   └── favicon.ico
├── src/
│   ├── assets/               # 项目资源
│   │   └── img/              # 图片资源（从源项目复制）
│   ├── components/           # 公共组件
│   ├── router/
│   │   └── index.js          # 路由配置（20条路由）
│   ├── styles/
│   │   └── main.css          # 全局样式
│   ├── views/                # 页面组件（20个）
│   │   ├── Login.vue         # 登录页
│   │   ├── Onboarding.vue    # 完善个人信息
│   │   ├── Index.vue         # 主页
│   │   ├── ServiceIndex.vue  # 服务大厅
│   │   ├── AssetList.vue     # 数据速递列表
│   │   ├── DataDetail.vue    # 数据详情
│   │   ├── Detail.vue        # 通用详情页
│   │   ├── IntentApply.vue   # 发起申请
│   │   ├── IntentMgmt.vue    # 数据申请管理
│   │   ├── AuthAgreement.vue # 授权协议
│   │   ├── AuthMgmt.vue      # 授权管理
│   │   ├── AgentMgmt.vue     # Agent管理
│   │   ├── Workflow.vue      # 工作流
│   │   ├── ExportApply.vue   # 导出申请
│   │   ├── Messages.vue      # 消息中心
│   │   ├── Profile.vue       # 个人中心
│   │   ├── PublishAsset.vue  # 发布数据集
│   │   ├── AuditLog.vue      # 审计日志
│   │   ├── WechatH5.vue      # 微信H5登录
│   │   └── Goutong.vue       # 沟通页面
│   ├── App.vue               # 根组件
│   └── main.js               # 入口文件
├── index.html                # HTML入口
├── package.json              # 依赖配置
├── vite.config.js            # Vite配置
└── README.md                 # 项目文档
```

## 技术栈

| 技术 | 版本 | 用途 |
|------|------|------|
| Vue | 3.4.21 | 核心框架 |
| Vue Router | 4.3.0 | 路由管理 |
| Pinia | 2.1.7 | 状态管理 |
| Vite | 5.1.6 | 构建工具 |
| Tailwind CSS | 3.4.1 | 原子化CSS（CDN） |
| Iconify | 2.1.0 | 图标库（CDN） |
| ECharts | 5.4.3 | 图表库（CDN） |

## 快速开始

### 1. 安装依赖

```bash
cd D:\workspace\workspace_ai\tds-agent-web
npm install
```

### 2. 启动开发服务器

```bash
npm run dev
```

浏览器将自动打开 http://localhost:3000

### 3. 构建生产版本

```bash
npm run build
```

构建产物将输出到 `dist/` 目录

### 4. 预览生产构建

```bash
npm run preview
```

## 路由列表

| 路径 | 组件 | 说明 |
|------|------|------|
| `/` | - | 重定向到登录页 |
| `/login` | Login | 微信扫码登录 |
| `/onboarding` | Onboarding | 完善个人信息 |
| `/index` | Index | 主页 |
| `/service-index` | ServiceIndex | 服务大厅 |
| `/asset-list` | AssetList | 数据速递列表 |
| `/data-detail/:id?` | DataDetail | 数据详情 |
| `/detail/:id?` | Detail | 通用详情页 |
| `/intent-apply` | IntentApply | 发起数据申请 |
| `/intent-mgmt` | IntentMgmt | 数据申请管理 |
| `/auth-agreement` | AuthAgreement | 授权协议签署 |
| `/auth-mgmt` | AuthMgmt | 授权管理 |
| `/agent-mgmt` | AgentMgmt | Agent访问管理 |
| `/workflow` | Workflow | 工作流画布 |
| `/export-apply` | ExportApply | 导出申请 |
| `/messages` | Messages | 消息中心 |
| `/profile` | Profile | 个人资料 |
| `/publish-asset` | PublishAsset | 发布数据集 |
| `/audit-log` | AuditLog | 审计日志 |
| `/wechat-h5` | WechatH5 | 微信H5登录 |
| `/goutong` | Goutong | 沟通页面 |

## 移动端适配

项目已完全适配移动端：

- ✅ 响应式布局（flex + grid + rem）
- ✅ viewport meta 配置
- ✅ 触摸友好的交互设计
- ✅ 移动端字体大小调整
- ✅ 自适应导航栏

## 注意事项

### 图片资源

需要将源目录的图片复制到 `src/assets/img/`：

```bash
# 从源目录复制图片
xcopy "D:\workspace\workspace_ai\tds-agent\src\main\resources\static\service\img\*" "src\assets\img\" /E /Y
```

### CDN依赖

以下库通过CDN引入（在 `index.html` 中）：
- Tailwind CSS
- Iconify Icons
- ECharts

如需本地化，可执行：
```bash
npm install tailwindcss @iconify/vue echarts
```

### API接口

当前所有API调用均为模拟实现，实际使用时需要：
1. 配置后端API地址
2. 创建 `src/api/` 目录封装请求
3. 使用 axios 或 fetch 进行HTTP请求

## 开发规范

### 组件命名
- 文件名：PascalCase（如 `DataDetail.vue`）
- 组件名：与文件名一致

### 代码风格
- 使用 `<script setup>` 语法
- 使用组合式API
- Scoped CSS避免样式污染

### 路由规范
- 每个页面对应一个路由
- 路由meta中配置页面标题
- 使用懒加载提升性能

## 常见问题

### Q: 如何添加新页面？
A: 
1. 在 `src/views/` 创建 `.vue` 文件
2. 在 `src/router/index.js` 添加路由配置

### Q: 如何修改主题色？
A: 修改 `src/styles/main.css` 中的颜色变量，或直接修改Tailwind类名

### Q: 如何配置代理？
A: 在 `vite.config.js` 中添加：
```js
server: {
  proxy: {
    '/api': 'http://localhost:8080'
  }
}
```

## 许可证

MIT License

---

**生成时间**: 2026-04-21  
**转换工具**: 手动转换 + AI辅助  
**源文件数量**: 20个HTML页面  
**目标框架**: Vue 3.4 + Vite 5.1
