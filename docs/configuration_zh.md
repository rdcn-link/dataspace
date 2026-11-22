# 配置说明

[English](configuration.md)

真实配置放在 Git 仓库之外，仅允许服务账号读取，不能放在前端网站目录下。

- 元数据接口：MONGO_URI 用于读取原有 tds 元数据；CONET_REGISTRY_MONGO_URI 用于独立 conet 业务库。分别配置最小权限账号。TDS_TRADING_URL 指向已有业务接口；CONET_COMPUTE_CONFIG 指向中心计算审批配置；CONET_NETWORK_CONFIG 指向受保护的节点连接配置。
- 网站网关：CONET_ACCESS_CONFIG 指向 access.json；CONET_SERVER_URL、CONET_CATALOG_URL 指向内网后端。publicOrigin 必须与公开 HTTPS 域名一致。keyFile 引用随机生成的 32 字节十六进制会话密钥；registryFile 指向归属和发布状态文件。管理员 UID、账号角色映射、临时放行名单均属部署数据，不能写入源码。
- OIDC 和 TDS：必须提供 MONGO_URI。OIDC 还需 SSO_JWT_SECRET（至少 32 字节，与使用方一致）及 WeChatConfig.java 使用的 WECHAT_* 环境变量。公众号、小程序、网站 OAuth 的标识和密钥分别配置。密钥没有源码兜底值。本次仅对公开副本移除原来写死的 Mongo/微信配置并改为环境变量，未修改正在运行的服务器。
- AI 相关服务：把 .env.example 复制为仓库外的 .env，再填入模型和存储密钥。对外开放前检查该工程的认证边界；关联探查服务的独立运行默认设置不能代替门户网关。
- 路径：部分旧科学运行程序仍默认 /mnt/data/conet；部署时需建立对应目录，或明确适配配置。CONET_ANALYSIS_SOURCE_DIRECTORY 可以覆盖通用分析清单目录，源码副本默认读取 services/scientific-analysis。

示例密钥为空或占位符；localhost 数据库地址仅用于说明，不指向线上。不要把真实凭据填回已跟踪的说明文件。浏览器用户角色与 DACP 服务间身份认证是不同层次，DACP 运行仍需单独生成令牌和证书。
