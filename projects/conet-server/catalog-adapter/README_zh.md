# 元数据与应用后端

Node.js 22（`mongodb` 6.22.0）在`127.0.0.1:8871`为独立前端提供接口。`MONGO_URI`只读访问`tds`已发布元数据；`CONET_REGISTRY_MONGO_URI`写入独立`conet`业务数据库。进程不修改身份、角色记录。受保护连接值不进入前端和交付压缩包。`TDS_TRADING_URL`默认`http://127.0.0.1:10013`。

元数据列表、详情、搜索和已登记中心说明保持只读。中心名称使用实际字段`data_center_name`和`org_name`；登记不能证明计算已接入。统一业务入口为`/api/metadata/platform`，集合、版本、任务幂等、资源标识、四种独立节点状态、校验与部署边界见[登记契约与验收](../../../platform-registry/README_zh.md)。

`services.json`是60项平台设计的不可变版本发布源，定义变化必须提升版本。MongoDB统一登记平台设计、已验证应用与用户贡献；未安装并验证的方法必须明确标记未验证。用户应用复用App Builder编译器及Union执行器，每次任务冻结定义与流程。模拟运行和旧Job草稿已经停用，不再作为平行任务存储。

`application-plugins.mjs`发现本地`application-plugins/*.mjs`。插件导出唯一`serviceId`、`registryAdapter: {handle, artifacts}`及验证能力。领域处理器实现`/template`、`/sources`、`/runs`、`/cases`、`/cases/{id}/prefill`、`/runs/{id}`和明确允许的成果文件名；这些是内部插件契约，公开客户端使用统一的`/applications/{id}/tasks`。登记层将领域任务、成果映射为Mongo记录，不嵌入格式分支；插件负责校验、排队、科学执行、取消/重启语义和输出结构。中断记录不能静默恢复或标记成功。

前端通过`applicationClient`引用本地`/application-plugins/<name>.js`，拒绝外部模块地址。`loadDetail(service,host,context)`沿用既有导航、样式和绘制工具；必须区分可复用应用与具体案例，以按钮和弹框配置新任务，保留历史并解释不可用资源和方法。

NPP和旬降水保留既有领域插件及原有真实记录。清单应用使用`/mnt/data/conet/downloaded-validation/applications.json`配置，任务隔离于`/mnt/data/conet/catalog-integration/scientific-runs/{application}/{uuid}`，使用不可变的`conet_downloaded_analysis`算子。来源冻结完整SHA256，由所属节点通过DACP/Union执行`read_item`及分析。明确发布`bin`字节表示，将物理格式解释交给领域算子，不让通用目录提前猜测表格类型或展开容器；领域大小和结构限制仍然生效。当前任务策略为900秒，遵守既有Union上限，客户端等待时间不会扩大服务器许可。

成果包括表格、图像、来源和参数快照、作业/状态证据及下载。表格预览应用会返回所选表格内容，正式中心须明确授权这一成果范围。格式画像只能作为格式识别应用的验收，不能代替其他科学方法。Origin OPJ分析须等待已验证解析器恢复数值轴、样品和单位后才能开放。

按要求暂时屏蔽工程验证阶段的用户控制。数据中心限制依据用户本轮授权放行，记录`formalApproval:false`，不冒充正式中心批准。对外正式开放前仍须恢复归属、发布/下载控制及真实中心约定。

领域验证与边界见[清单数据应用](../../../service-design/downloaded-validation/README_zh.md)。数据准备不修改原始元数据与文件，不执行压缩包内代码；任务成果不能覆盖其他任务。检查包括`node --test platform-contracts.test.mjs`、真实输入直接检查、DACP执行/数值/参数变化/拒绝检查及浏览器检查。证据位于`/mnt/data/conet/tool-audit/platform-registry/`和`/mnt/data/conet/tool-audit/downloaded-validation/`。

## 当前用户中心与发布控制（2026-11-18）

当 `computationApprovalsEnabled` 启用时，前文工程验证模式说明不再适用：新分析使用真实登录身份及数据集计算审批，成果发布仍须明确同意。用户中心按可信 UID 限定个人列表与统计，复用 TDS 数据集业务，计算审批和下载审批保留各自记录。应用评价、收藏、审计及机器人状态采用独立 `conet` 集合，见[用户中心接口、部署与验证](../../../user-center/README_zh.md)及[应用展示](../../../application-refinement/README_zh.md)。正式入口不得绕过会话网关访问私有目录或机器人接口。

## 产品登记（2026-11-18）

`product-registry.mjs` 增加 `conet.products`、`conet.product_events`，将明确同意的任务发布登记为固定快照，并衔接原有真实托管产品。公开预览、登录且按许可下载、创建者撤回及个人管理共用此登记。成果实体保留原适配器存储，读取检查 SHA256；不等同于自动托管到 DACP，见[契约与证据](../../../products-integration/README_zh.md)。

## 节点管理

`node-management.mjs` 将原TDS中心关联到独立 `conet.node_profiles`、`node_events`，不改写原中心/审批记录。公开目录与管理员维护接口分离；监测读取真实远端DACP/Union观测，各中心未绑定自身成员前明确使用82.136示例。见[接口与验收](../../../node-management/README_zh.md)。

## 具体记录的详情查询

修复详情路由变量遮蔽导致的503，保留具体记录ID与已发布状态校验。见[回归与线上核验](../../../catalog-detail-fix/README_zh.md)。

## 统一目录列表

已发布原始记录与明确同意发布的产品通过catalog-list.mjs提供分类分页。见[接口与核验](../../../catalog-layout/README_zh.md)。

## 新增真实数据应用与分类计数

15项应用及运行时适配在82.136验证，成果按用户决定保持私有。目录计数只包含已发布资源。见[批次验收](../../../dataset-batch-20261118/README_zh.md)及[分类数量](../../../catalog-counts/README_zh.md)。

## App Builder使用统计与排序

统计采用持久化的已观测执行事件，不再累加计划算子引用。应用展示顺序通过MongoDB sortOrder由管理员维护，已验证精选优先。见[计数规则、排序与验收](../../../appbuilder-refinement/README_zh.md)。

