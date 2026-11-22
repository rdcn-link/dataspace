# dataset-vfs-v2

面向科研数据空间的**动态数据集虚拟文件系统**（MongoDB 直连版）。

---

## 一、核心架构

### 数据流

```
访问虚拟路径 /fairspace/<datasetId>/V1/.../file.csv
      │
      ▼
 FUSE 内核拦截
      │
      ▼
 PathResolver.parse()
   → ROOT / DATASET_DIR / DEEP (纯字符串，零 I/O)
      │
      ▼
 MetadataClient (PyMongo)
   ├─ list_datasets()    → MongoDB distinct('datasetId')
   ├─ list_children()    → _load_filetree() + tree_walker.classify_children()
   └─ resolve()          → _load_filetree() + tree_walker.resolve_path()
      │
      ▼
 LRU+TTL Cache (datasetId → fileTree，60s)
      │
      ▼
 tree_walker（纯函数递归导航任意深度嵌套结构）
      │
      ▼
 realPath → os.open / os.read
```

### MongoDB 数据模型

集合：**`scidb_dataseek_filePath`**

```json
{
    "_id": ObjectId(...),
    "datasetId": "d9a3d7e17d9f487faaeddb621150b5c5",
    "fileTree": {
        "V1": [
            {
                "SADR_submission": [
                    {
                        "calibration_202405": [
                            { "algorithm_detection_202405．csv": "/mnt/sciencedbNew/.../50450.csv" }
                        ]
                    },
                    { "数据说明．txt": "/mnt/sciencedbNew/.../6067.txt" }
                ]
            }
        ]
    },
    "_class": "cn.tds.common.domain.ScidbDatasetFilePath"
}
```

**关键特征**：`fileTree` 是**任意深度嵌套**结构，三种节点类型：

| 节点 | 形态 | 含义 |
|------|------|------|
| **叶子** | `{filename: realPath}` | 实际文件，key 精确等于文件名 |
| **目录容器（list）** | `[{子节点1}, {子节点2}, ...]` | 有序子节点列表，每个元素是"子目录 dict"或"叶子 dict" |
| **目录容器（dict）** | `{dirname: 子节点}` | 命名字典目录 |

文件名可以是**全角 Unicode**（如 `．csv` 用 `U+FF0E`），匹配时**严格精确比较**，不做任何 Unicode 归一化。

---

## 二、项目结构

```
dataset-vfs-v2/
├── app/
│   ├── __init__.py
│   ├── main.py              # 入口（MongoDB 连接预检 + FUSE 挂载）
│   ├── filesystem.py        # FUSE Operations 实现，任意深度路径
│   ├── resolver.py          # 虚拟路径解析器（纯字符串，三角色：ROOT/DATASET_DIR/DEEP）
│   ├── tree_walker.py       # fileTree 递归导航（纯函数，可独立测试）⭐核心
│   ├── api_client.py        # PyMongo 直连 + LRU+TTL 文件树缓存
│   ├── cache.py             # 独立可测试的 LRU+TTL 缓存
│   ├── models.py            # PathRole + ParsedPath + DatasetInfo/FileInfo/ResolvedFile
│   └── config.py            # 环境变量配置
├── scripts/
│   ├── test_tree_walker.py      # 用真实 MongoDB 样例验证 tree_walker（8/8 通过）
│   └── test_mongodb_live.py     # 连接真实 MongoDB 验证端到端
├── Dockerfile
├── docker-compose.yml
├── requirements.txt
└── README.md
```

---

## 三、核心模块详解

### 3.1 tree_walker（最关键）

四个纯函数入口，零 I/O、零 DB 依赖：

| 函数 | 作用 | 调用时机 |
|------|------|---------|
| `walk_children(fileTree, segments)` | 列出当前层级直接子节点名（不区分类别） | readdir 辅助 |
| `classify_children(fileTree, segments)` | 列出直接子节点 `(name, is_dir)` 元组 | readdir 正式使用 |
| `resolve_path(fileTree, segments)` | 跟随 segments 到叶子返回 realPath | getattr/open |
| `tree_to_plain(fileTree)` | **扁平化**成 `{virtual_path: realPath}`（O(n) 内存，慎用） | 诊断 |

**迭代开发原则（来自 experience 276129）**：先钉死解析器逻辑，再集成 FUSE。本项目先基于用户提供的真实样例跑通 8 个测试，再往上搭。

### 3.2 MetadataClient

方法签名保持简单：

| 方法 | Mongo 操作 | 缓存 |
|------|-----------|------|
| `list_datasets()` | `distinct('datasetId')` | 全局单 key，60s |
| `_load_filetree(dataset_id)` | `find_one({datasetId: ...}, {_id:0, fileTree:1})` | datasetId → fileTree dict，LRU+TTL |
| `list_children(dataset_id, segments)` | `_load_filetree` + `tree_walker.classify_children` | 复用 fileTree 缓存 |
| `resolve(dataset_id, segments)` | `_load_filetree` + `tree_walker.resolve_path` | 复用 fileTree 缓存 |

### 3.3 FUSE layer

**getattr 路径分类**：

```
ROOT       /fairspace              → 返回目录 stat
DATASET_DIR /fairspace/<datasetId>  → 验证 dataset 存在，返回目录 stat
DEEP        /fairspace/<datasetId>/seg1/seg2/...
                ├─ 先 try resolve(segments) → 成功 = 叶子文件，返回文件 stat
                └─ 失败 → try list_children(segments) → 成功 = 中间目录，返回目录 stat
                                                     → 失败 = ENOENT
```

**readdir 统一入口**：

```
ROOT     → list_datasets()
其他所有 → list_children(dataset_id, segments)    # segments 在 DATASET_DIR 时为 []
```

**只读保证**：内核层 `ro=True` + 用户层所有 write 操作 `EPERM`。

---

## 四、部署

### 4.1 前置

- **Linux / WSL2** — FUSE 内核特性
- Docker Engine 24+
- 真实数据挂载在容器内的 `/mnt/sciencedbNew/`（MongoDB fileTree 里 realPath 指向的真实路径）

### 4.2 docker-compose

```bash
cd dataset-vfs-v2
docker compose up -d
```

**注意**：`/mnt/sciencedbNew` 必须先在宿主机上准备好并正确挂载真实数据。MongoDB 连接串已内置：

```
REPLACE_WITH_EXTERNAL_CONFIG
```

### 4.3 验收步骤

```bash
# 1. 容器启动
docker compose ps

# 2. 检查挂载
docker compose exec dataset-vfs findmnt /mnt/fairspace
# EXPECTED TARGET: fuse

# 3. 列根目录（列出 Mongo 里所有 datasetId）
docker compose exec dataset-vfs ls -1 /mnt/fairspace

# 4. 进入任意数据集
docker compose exec dataset-vfs ls -1 /mnt/fairspace/<datasetId>

# 5. 递归进入多层嵌套
docker compose exec dataset-vfs find /mnt/fairspace/<datasetId> -maxdepth 4

# 6. open + read 叶子文件
docker compose exec dataset-vfs python -c "
with open('/mnt/fairspace/<datasetId>/V1/.../file.csv', 'rb') as f:
    print(f.read(16))
"
```

### 4.4 环境变量

| 变量 | 默认 | 说明 |
|------|------|------|
| `MONGO_URI` | `REPLACE_WITH_EXTERNAL_CONFIG` | MongoDB 连接串 |
| `MONGO_DB` | `tds` | 数据库名 |
| `MONGO_COLLECTION` | `scidb_dataseek_filePath` | 集合名 |
| `MONGO_CONNECT_TIMEOUT_MS` | `5000` | 连接超时 |
| `MONGO_SOCKET_TIMEOUT_MS` | `10000` | Socket 超时 |
| `MONGO_MAX_POOL_SIZE` | `50` | 连接池大小 |
| `MOUNT_POINT` | `/mnt/fairspace` | FUSE 挂载点 |
| `VIRTUAL_ROOT` | `/fairspace` | 虚拟路径前缀 |
| `CACHE_TTL_SECONDS` | `60` | fileTree 缓存 TTL |
| `CACHE_MAX_SIZE` | `10000` | LRU 最大条目数 |
| `LOG_LEVEL` | `INFO` | 日志级别 |

---

## 五、无 FUSE 本地调试（Windows/Mac 适用）

```bash
# 1. 先验证 tree_walker 纯逻辑（基于真实样例）
pip install pymongo
PYTHONPATH="." python scripts/test_tree_walker.py
# 预期 8/8 通过

# 2. 连接真实 MongoDB 验证端到端
PYTHONPATH="." python scripts/test_mongodb_live.py
```

---

## 六、架构演进路线图

| 现状 | 演进方向 |
|------|---------|
| 每次 FUSE 操作 → 一次 Mongo `find_one` 加载完整 fileTree | 已优化：datasetId → fileTree LRU+TTL 缓存，热数据集全内存操作 |
| `list_datasets` 用 `distinct()`，数据集多时内存开销 | 改分页（`skip`/`limit`）或 MongoDB aggregation 管道 |
| `readdir` 每次调 `classify_children`（O(n) 遍历当前层级） | 足够快——当前层级最多几千子元素，Python dict 操作亚毫秒级 |
| `getattr(DEEP)` 先 resolve 失败再 list_children，两次树遍历 | 可合并为单次"同时判断叶子和子目录"的优化版本 |
| 真实文件 `stat` 直接代理 `os.stat(realPath)` | 可选：MongoDB 文档补充虚拟 stat 元数据，避免跨节点 stat |
| 数据库宕机时 FUSE 全 ENOENT | 熔断 + 降级到文件树缓存 |
| 写操作 | 暂不支持（需求明确只读） |

---

## 七、故障排查

| 现象 | 检查 |
|------|------|
| 容器启动后立即退出 | `docker compose logs` — 看 MongoDB 连接预检是否失败 |
| `findmnt /mnt/fairspace` 无 fuse | FUSE 没挂载 → 容器不是 privileged 或 /dev/fuse 没映射 |
| `ls /mnt/fairspace` 空 | Mongo 里没有 document 或 fileTree 全为空 |
| `find /mnt/fairspace/<dsId>` 报错 ENOENT | datasetId 错，或 fileTree 顶层节点名（如 V1）在 Mongo 里不匹配 |
| `open()` 报错 ENOENT 但 Mongo 能 resolve | 真实文件 `/mnt/sciencedbNew/...` 不存在，检查宿主机挂载 |
| 性能差 / 卡 | `LOG_LEVEL=DEBUG` 看 fileTree 缓存命中率；冷启动时第一个数据集会触发一次 Mongo `find_one` |
