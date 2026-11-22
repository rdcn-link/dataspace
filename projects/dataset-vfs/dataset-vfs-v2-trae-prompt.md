# dataset-vfs-v2 动态数据集虚拟文件系统实现 Prompt

## 项目目标

实现一个面向科研数据空间的数据虚拟访问层。

背景：

-   数据集实体文件已经存在于数据中心服务器。
-   真实文件绝对路径不固定，没有统一规律。
-   未来规模约30万个数据集，每个数据集包含数千到上万个实体文件。
-   分析服务（DataSeek）不能依赖真实路径。

目标：

提供统一虚拟目录：

    /fairspace

        /dataset001

            snow.nc

            temperature.nc

DataSeek 只访问：

    /fairspace/dataset001/snow.nc

由虚拟文件系统动态解析真实文件。

------------------------------------------------------------------------

# 核心原则

禁止启动时加载全部文件映射。

不要：

    启动
     ↓
    读取全部文件
     ↓
    加载内存
     ↓
    生成目录

必须：

    访问虚拟路径
     ↓
    FUSE捕获
     ↓
    调用Metadata API
     ↓
    获取真实路径
     ↓
    读取真实文件

------------------------------------------------------------------------

# 技术栈

-   Python 3.12
-   fusepy
-   libfuse2
-   FastAPI
-   SQLite（开发阶段）
-   PostgreSQL（未来）

项目结构：

    dataset-vfs-v2/

    app/
     ├── main.py
     ├── filesystem.py
     ├── resolver.py
     ├── api_client.py
     ├── models.py
     └── config.py

    mock_metadata_service/
     └── api.py

    Dockerfile
    docker-compose.yml
    README.md

------------------------------------------------------------------------

# Metadata API设计

## 查询数据集

GET:

    /api/datasets

返回：

``` json
[
 {
  "datasetId":"DS001",
  "name":"snow dataset"
 }
]
```

------------------------------------------------------------------------

## 查询数据集文件

GET:

    /api/datasets/{datasetId}/files

返回：

``` json
[
 {
  "fileName":"snow.nc"
 }
]
```

------------------------------------------------------------------------

## 解析真实路径

GET:

    /api/file/resolve

参数：

    datasetId
    fileName

返回：

``` json
{
 "virtualPath":"/fairspace/DS001/snow.nc",
 "realPath":"/mnt/test/snow.nc"
}
```

------------------------------------------------------------------------

# FUSE要求

实现：

    getattr()
    readdir()
    open()
    read()
    release()

路径：

    /fairspace

    /fairspace/{datasetId}

    /fairspace/{datasetId}/{filename}

逻辑：

-   readdir根目录调用数据集接口。
-   readdir数据集目录调用文件列表接口。
-   open文件时调用resolve接口。
-   禁止写操作，只读。

------------------------------------------------------------------------

# 缓存

增加：

-   LRU缓存
-   TTL 60秒

缓存：

    virtualPath -> realPath

减少接口压力。

------------------------------------------------------------------------

# Docker要求

提供：

    docker-compose.yml

包含：

    dataset-vfs
    metadata-service

dataset-vfs：

需要：

    /dev/fuse
    privileged=true

挂载：

    /mnt/fairspace

测试真实数据：

    /mnt/test

------------------------------------------------------------------------

# 测试要求

创建：

    /mnt/test/snow.nc

虚拟访问：

    /fairspace/DS001/snow.nc

验证：

``` python
open("/fairspace/DS001/snow.nc")
```

能够读取真实文件。

------------------------------------------------------------------------

# 验收标准

启动：

    docker compose up -d

检查：

    findmnt /fairspace

应该看到：

    fuse

执行：

    ls /fairspace

返回数据集。

执行：

    ls /fairspace/DS001

返回：

    snow.nc

执行：

``` python
open("/fairspace/DS001/snow.nc")
```

实际读取：

    /mnt/test/snow.nc

------------------------------------------------------------------------

# 开发要求

请直接生成完整项目代码，不要只输出设计说明。

必须提供：

1.  完整代码文件。
2.  README部署文档。
3.  docker-compose配置。
4.  测试脚本。
5.  Linux运行验证步骤。

代码必须考虑：

-   30万个数据集。
-   亿级实体文件。
-   不一次性加载所有目录。
-   后续可替换真实Metadata服务。
