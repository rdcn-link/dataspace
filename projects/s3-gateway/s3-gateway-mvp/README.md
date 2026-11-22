# S3 Gateway MVP

> 面向数据空间盒子的只读 S3 数据访问服务 MVP

将数据中心已有文件通过标准 S3 API 暴露出来，使数据探查智能体能够像访问对象存储一样访问这些文件。

## 架构

```
S3 Client (AWS CLI / boto3)
        │
        │ S3 API (SigV4)
        ▼
┌─────────────────────┐
│   S3 Gateway MVP    │
│   (FastAPI)         │
│                     │
│ Bucket/Object       │
│        ↓            │
│ Virtual Mapping     │
│   (SQLite)          │
│        ↓            │
│ Real File Path      │
└─────────┬───────────┘
          │
          ▼
   数据中心文件系统 (只读挂载)
```

## 核心特性

- **标准 S3 API**: 支持 ListBuckets、HeadBucket、ListObjectsV2、HeadObject、GetObject
- **AWS Signature V4 认证**: 完整实现 SigV4 签名验证
- **虚拟路径映射**: S3 Object Key → 真实文件路径（通过 SQLite）
- **Range 请求**: 支持 HTTP Range，科学数据按需读取
- **只读设计**: 禁止 PUT/POST/DELETE，返回 405
- **路径穿越防护**: 防止 `../` 等攻击
- **Docker Compose 一键部署**

## 快速开始

### 1. 启动服务

```bash
cp .env.example .env

docker compose build

docker compose up -d
```

检查服务状态：

```bash
docker compose ps
```

### 2. 健康检查

```bash
curl http://localhost:9000/health
```

返回：

```json
{
  "status": "ok",
  "service": "s3-gateway",
  "version": "0.1.0"
}
```

### 3. 配置 AWS CLI

```bash
aws configure
```

填写：

```
AWS Access Key ID: tpdc-access
AWS Secret Access Key: change-me
Default region: us-east-1
Default output format: json
```

### 4. 使用 S3 API

**ListBuckets:**

```bash
aws --endpoint-url http://localhost:9000 s3api list-buckets
```

**ListObjectsV2:**

```bash
aws --endpoint-url http://localhost:9000 \
    s3api list-objects-v2 \
    --bucket tpdc-bucket
```

**HeadObject:**

```bash
aws --endpoint-url http://localhost:9000 \
    s3api head-object \
    --bucket tpdc-bucket \
    --key test/test.txt
```

**GetObject:**

```bash
aws --endpoint-url http://localhost:9000 \
    s3api get-object \
    --bucket tpdc-bucket \
    --key test/test.txt \
    downloaded.txt

cat downloaded.txt
```

### 5. Range 请求测试

```bash
curl -H "Range: bytes=0-9" \
     http://localhost:9000/test/test.txt
```

返回 `206 Partial Content`。

### 6. 安全测试

```bash
# 路径穿越 - 应被拒绝
curl http://localhost:9000/../../etc/passwd

# 只读 - PUT 应返回 405
curl -X PUT http://localhost:9000/test/test.txt -d "data"
```

## 添加映射

### 单条添加

```bash
docker compose exec s3-gateway \
    python -m app.init_data \
    --bucket tpdc-bucket \
    --key v2026/temp.nc \
    --path /data/2026/temp.nc
```

### 批量扫描

```bash
docker compose exec s3-gateway \
    python -m app.scan \
    --root /data/2026 \
    --bucket tpdc-bucket \
    --prefix v2026/
```

## 环境变量

| 变量 | 默认值 | 说明 |
|------|--------|------|
| `S3_ACCESS_KEY` | `tpdc-access` | S3 Access Key |
| `S3_SECRET_KEY` | `change-me` | S3 Secret Key |
| `S3_REGION` | `us-east-1` | S3 Region |
| `S3_PORT` | `9000` | 服务端口 |
| `S3_DB_PATH` | `/app/data/s3_gateway.db` | SQLite 数据库路径 |
| `S3_DATA_ROOT` | `/data` | 数据根目录 |
| `S3_BUCKET_NAME` | `tpdc-bucket` | 默认 Bucket |
| `S3_ENABLE_AUTH` | `true` | 是否启用认证 |
| `S3_LOG_LEVEL` | `INFO` | 日志级别 |

## 支持的 S3 API

| API | 方法 | 路径 | 说明 |
|-----|------|------|------|
| ListBuckets | GET | `/` | 列出所有 Bucket |
| HeadBucket | HEAD | `/{bucket}` | 检查 Bucket 是否存在 |
| ListObjectsV2 | GET | `/{bucket}?list-type=2` | 列出对象 |
| HeadObject | HEAD | `/{bucket}/{key}` | 获取对象元信息 |
| GetObject | GET | `/{bucket}/{key}` | 下载对象（支持 Range） |

## 支持的文件类型

`.nc` `.h5` `.hdf5` `.tif` `.tiff` `.csv` `.json` `.txt` `.zip` `.tar` `.gz`

未知类型返回 `application/octet-stream`。

## 运行测试

```bash
# 在项目目录下
pip install -r requirements.txt
pytest tests/ -v
```

## 目录结构

```
s3-gateway-mvp/
├── docker-compose.yml
├── Dockerfile
├── entrypoint.sh
├── requirements.txt
├── .env.example
├── README.md
│
├── app/
│   ├── __init__.py
│   ├── main.py          # FastAPI 入口
│   ├── config.py        # 配置管理
│   ├── database.py      # SQLite 数据库
│   ├── models.py        # 数据模型
│   ├── mapping.py       # 路径映射服务
│   ├── auth.py          # AWS SigV4 认证
│   ├── s3_server.py     # S3 API 路由
│   ├── utils.py         # 工具函数
│   ├── init_data.py     # 单条映射初始化
│   ├── scan.py          # 批量扫描
│   └── setup_test_data.py  # 测试数据初始化
│
├── config/
│   └── mapping.json     # 映射配置
│
├── data/
│   └── s3_gateway.db    # SQLite (自动生成)
│
├── test-data/
│   ├── test.txt
│   ├── data.json
│   ├── sample.bin
│   └── temp.nc
│
└── tests/
    ├── test_health.py
    ├── test_bucket.py
    ├── test_object.py
    ├── test_range.py
    └── test_security.py
```

## 挂载真实数据中心数据

修改 `docker-compose.yml` 的 volumes：

```yaml
volumes:
  - ./data:/app/data
  - /mnt/tpdc-data:/data:ro    # 只读挂载真实数据
```

数据库中保存容器内路径 `/data/2026/temp.nc`，而非宿主机路径。

## 设计原则

- **只读**: 默认禁止所有写操作
- **虚拟映射**: S3 Object Key 不等于真实文件路径
- **安全**: 防止路径穿越，不暴露内部路径
- **轻量**: 不引入 Kubernetes/Redis/MySQL 等复杂依赖
- **标准**: 兼容 AWS S3 API，AWS CLI 可直接访问