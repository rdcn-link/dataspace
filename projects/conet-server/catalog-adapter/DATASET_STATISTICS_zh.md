# 数据集使用统计

原始数据集卡片与详情页按收藏、浏览、下载的顺序显示统计。

收藏量读取 `tds.tds-favorite`。下载量读取既有 `tds.tds-dataset.downloadCount`，由原 TDS 下载流程维护（`order/dataset.addDownloadCount`）。提交申请或打开智能探查不算下载。外部下载需要现有回调或反馈更新 TDS 计数。

浏览量由元数据中的历史浏览量与 `conet.dataset_statistics` 中持久化的增量相加得到。统计记录的 `_id` 为具体版本的元数据 ID，`viewCount` 仅保存科诺空间新增浏览。目录数据库连接保持只读，不复制、覆盖或重复增加历史元数据计数。

`POST /api/metadata/platform/datasets/{metadataId}/views` 接受空 JSON 对象。后端验证指定版本已发布后原子增加业务统计。支持匿名浏览，沿用网关同源检查。客户端不能指定次数、用户标识或修改其他字段。普通 GET/HEAD 元数据查询不会计数。

浏览器在一次页面生命周期内对每个数据集计数一次，收藏或评论引发的刷新不重复计数。重新加载页面计为新的一次浏览。这是页面浏览次数，不是独立访客数。本次未改变原有元数据浏览字段的热门排序规则。
