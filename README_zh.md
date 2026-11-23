# Dataspace · 科诺空间

[English](README.md)

面向科学数据的可信数据空间源码：发现数据、运行可复用应用、协同数据中心计算，以及发布经过用户同意的分析产品。

## 源码目录

| 目录 | 职责 |
|---|---|
| projects/conet-web | 当前网站前端、会话/API 网关、用户中心 |
| projects/conet-server | Scala 应用托管和 Node.js 元数据/业务接口 |
| projects/oidc-server | Java 身份服务、微信登录后端 |
| projects/tds-trading | Java 数据申请、审批、元数据业务接口 |
| projects/4fair-web | 关联参考前端，不是当前公开门户 |
| projects/ai-dataseek | 数据智能探查服务 |
| projects/dataset-vfs、projects/s3-gateway | 关联文件访问服务 |
| projects/data-robots | 数据机器人管理服务 |
| services | 科学分析算子、运行程序及源码配置清单 |

先阅读[部署说明](docs/deployment_zh.md)、[配置说明](docs/configuration_zh.md)、[发布范围](docs/source-scope_zh.md)和[检查记录](docs/validation_zh.md)。各工程 README 提供构建、协议和开发说明。本仓库是源码，不是数据库导出或可直接恢复的生产备份。

不包含生产数据库连接、大模型 API Key、微信密钥、私钥、账号放行名单、数据库备份、算子 ZIP 包、实体科学数据或历史成果存储。代码依赖的公开界面资源和明确的合成开发样例予以保留。运行时的受保护配置需独立提供。

保留各工程及上游已有的许可和版权声明。公开仓库不代替各组件的许可条款，本次整理未额外声明统一许可证。
