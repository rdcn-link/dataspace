# 项目：S3 协议数据访问服务 MVP

## 一、项目背景

当前系统已经建设了数据探查智能体（AI-DATASEEK），部署在数据中心附近，用于对科学数据集进行在线探查、分析和处理。

现阶段数据实体文件可能存储在：

- 本地文件系统
- NAS
- 分布式文件系统
- 数据中心已有存储系统
- 其他逻辑存储环境

数据探查智能体不希望直接依赖数据中心内部复杂的文件路径，而希望通过统一的 **S3 协议**访问数据。

例如，希望最终能够通过类似下面的方式访问数据：

```text
s3://tpdc-bucket/v2026/temp.nc
```

其中：

```text
tpdc-bucket
    └── v2026
        └── temp.nc
```

对应数据中心中的真实文件：

```text
/mnt/tpdc-data/2026/temp.nc
```

本项目需要开发一个 **S3 协议服务 MVP**，作为数据探查智能体与数据中心实体文件之间的统一访问层。

------

# 二、MVP 核心目标

本项目不是开发完整的对象存储系统。

MVP 的核心目标只有一个：

> 将数据中心已有文件，通过标准 S3 API 暴露出来，使其他服务器上的数据探查智能体能够像访问对象存储一样访问这些文件。

即：

```text
数据探查智能体
       │
       │ S3 API
       ▼
┌─────────────────────┐
│   S3 Gateway MVP    │
│                     │
│ Bucket/Object       │
│        ↓            │
│ Virtual Mapping     │
│        ↓            │
│ Real File Path      │
└─────────┬───────────┘
          │
          ▼
数据中心已有文件系统
```

------

# 三、重要设计原则

## 3.1 不要把 MVP 做成完整对象存储

禁止一开始实现：

- 多副本
- 分布式存储
- 数据复制
- Erasure Coding
- 对象生命周期
- 对象版本控制
- Bucket Policy 全套实现
- Multipart Upload 全套复杂能力
- 分布式一致性
- 高可用集群
- Kubernetes
- Ceph
- 数据迁移
- 数据重新存储

MVP 只负责：

> S3 API → 虚拟对象路径 → 真实文件路径 → 文件读取

------

# 四、核心场景

假设数据中心存在真实文件：

```text
/mnt/tpdc-data/2026/temp.nc
```

希望通过 S3 暴露为：

```text
s3://tpdc-bucket/v2026/temp.nc
```

S3 客户端请求：

```text
GET /v2026/temp.nc
Host: s3.example.com
```

服务内部完成：

```text
bucket = tpdc-bucket

object = v2026/temp.nc

        ↓

查询映射关系

        ↓

/mnt/tpdc-data/2026/temp.nc

        ↓

读取文件

        ↓

返回 HTTP/S3 Response
```

------

# 五、不要假设 S3 Object Key 与真实文件路径完全一致

这是本项目非常重要的设计要求。

真实数据中心中可能存在：

```text
数据集A
    逻辑文件：
        /dataset/A/temp.nc

    实际文件：
        /mnt/storage/project/2026/08/abc123.nc
```

因此：

```text
s3://tpdc-bucket/dataset/A/temp.nc
```

不能简单理解为：

```text
/mnt/storage/project/2026/08/abc123.nc
```

需要增加：

```text
Virtual Mapping
```

即：

```text
S3 Object Key
      ↓
Virtual Mapping
      ↓
Real File Path
```

------

# 六、MVP 映射模型

建议使用 SQLite 保存映射关系。

数据库：

```text
s3_gateway.db
```

核心表：

```sql
CREATE TABLE object_mapping (
    id INTEGER PRIMARY KEY AUTOINCREMENT,

    bucket_name TEXT NOT NULL,

    object_key TEXT NOT NULL,

    real_path TEXT NOT NULL,

    size INTEGER,

    content_type TEXT,

    etag TEXT,

    enabled INTEGER DEFAULT 1,

    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,

    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,

    UNIQUE(bucket_name, object_key)
);
```

例如：

```text
bucket_name:
tpdc-bucket

object_key:
v2026/temp.nc

real_path:
/mnt/tpdc-data/2026/temp.nc
```

------

# 七、技术方案

推荐采用：

```text
Python 3.12
FastAPI
SQLite
boto3 / botocore
Docker
Docker Compose
```

但需要注意：

## 不要求自行从零实现完整 AWS Signature V4

S3 协议中的认证、请求解析等机制比较复杂。

优先选择成熟的 Python S3 协议相关库，实现标准 S3 API。

如果最终采用：

```text
FastAPI + boto3
```

需要确认是否能够真正提供标准 S3 Server API。

如果不能，应选择更适合作为 S3 Server 的成熟 Python S3 实现或协议库。

开发过程中必须实际使用：

```bash
aws s3
aws s3api
```

进行验证。

------

# 八、MVP 支持的 S3 API

第一阶段至少支持以下操作。

## 8.1 Bucket

支持：

```text
ListBuckets
HeadBucket
```

MVP 可以只配置固定 Bucket：

```text
tpdc-bucket
```

暂时不实现动态创建 Bucket。

------

# 九、Object API

必须支持：

```text
HeadObject
GetObject
```

重点是：

```text
GetObject
```

例如：

```bash
aws s3api get-object \
  --bucket tpdc-bucket \
  --key v2026/temp.nc \
  output.nc
```

必须能够成功读取真实文件。

------

# 十、支持对象列表

实现：

```text
ListObjectsV2
```

例如：

```bash
aws s3api list-objects-v2 \
  --bucket tpdc-bucket
```

返回：

```json
{
  "Contents": [
    {
      "Key": "v2026/temp.nc",
      "Size": 102400
    }
  ]
}
```

需要支持：

```text
prefix
max-keys
continuation-token
```

但 MVP 可以采用简单分页实现。

------

# 十一、对象元信息

对于：

```text
HeadObject
```

至少返回：

```text
Content-Length
Content-Type
ETag
Last-Modified
```

其中：

```text
Content-Length
```

从真实文件获取。

------

# 十二、Range 请求

这是科学数据场景非常重要的能力。

必须支持：

```http
Range: bytes=0-1023
```

例如：

```bash
curl \
  -H "Range: bytes=0-1023" \
  https://s3.example.com/v2026/temp.nc
```

返回：

```text
206 Partial Content
```

并设置：

```text
Content-Range
Content-Length
Accept-Ranges: bytes
```

原因：

很多科学数据文件，例如：

```text
.nc
.h5
.hdf5
.tif
.zip
```

并不希望每次访问都下载整个文件。

因此 MVP 必须支持 HTTP Range。

------

# 十三、文件类型

至少支持：

```text
.nc
.h5
.hdf5
.tif
.tiff
.csv
.json
.txt
.zip
.tar
.gz
```

未知类型：

```text
application/octet-stream
```

Content-Type 可以根据文件扩展名自动判断。

------

# 十四、认证

MVP 实现简单的 S3 Access Key / Secret Key。

例如：

```text
S3_ACCESS_KEY=tpdc-access
S3_SECRET_KEY=change-me
```

客户端：

```bash
aws configure
```

填写：

```text
AWS Access Key ID:
tpdc-access

AWS Secret Access Key:
change-me

Default region:
us-east-1
```

服务需要能够识别 AWS Signature V4。

------

# 十五、认证设计

不要把：

```text
Access Key
Secret Key
```

硬编码到代码中。

通过环境变量配置：

```env
S3_ACCESS_KEY=tpdc-access
S3_SECRET_KEY=change-me
S3_REGION=us-east-1
```

未来可以扩展为：

```text
用户
 ↓
Access Key
 ↓
权限
 ↓
Bucket/Object
```

但 MVP 暂时只需要一个 Access Key。

------

# 十六、只读设计

MVP 默认：

```text
READ ONLY
```

只支持：

```text
GET
HEAD
LIST
```

明确禁止：

```text
PUT
POST
DELETE
```

即：

```text
S3 Gateway
    │
    ├── GET       ✓
    ├── HEAD      ✓
    ├── LIST      ✓
    │
    ├── PUT       ✗
    ├── DELETE    ✗
    └── COPY      ✗
```

返回：

```text
405 Method Not Allowed
```

或者符合 S3 语义的错误响应。

------

# 十七、数据安全要求

必须防止 Path Traversal。

例如客户端不能通过：

```text
../../etc/passwd
```

访问宿主机文件。

禁止：

```text
../
```

以及任何能够跳出合法映射目标的路径。

重要原则：

> S3 Object Key 只能通过数据库 Mapping 映射到真实文件，不允许客户端直接提交真实文件路径。

错误：

```text
GET /mnt/tpdc-data/2026/temp.nc
```

正确：

```text
GET /v2026/temp.nc

        ↓

SQLite Mapping

        ↓

/mnt/tpdc-data/2026/temp.nc
```

------

# 十八、Docker Compose 部署

整个服务必须支持：

```bash
docker compose up -d
```

直接启动。

目录建议：

```text
s3-gateway-mvp/
├── docker-compose.yml
├── .env.example
├── Dockerfile
├── requirements.txt
├── README.md
│
├── app/
│   ├── main.py
│   ├── config.py
│   ├── database.py
│   ├── models.py
│   ├── s3_server.py
│   ├── mapping.py
│   ├── auth.py
│   └── utils.py
│
├── data/
│   └── s3_gateway.db
│
├── config/
│   └── mapping.json
│
└── tests/
    ├── test_health.py
    ├── test_object.py
    ├── test_range.py
    └── test_security.py
```

可以根据实际技术选型调整目录结构。

------

# 十九、Docker Compose

提供：

```yaml
services:
  s3-gateway:
    build: .
    container_name: s3-gateway
    restart: unless-stopped

    ports:
      - "9000:9000"

    environment:
      S3_ACCESS_KEY: ${S3_ACCESS_KEY}
      S3_SECRET_KEY: ${S3_SECRET_KEY}
      S3_REGION: ${S3_REGION:-us-east-1}

    volumes:
      - ./data:/app/data
      - /mnt/tpdc-data:/data:ro

    healthcheck:
      ...
```

注意：

真实数据目录：

```text
/mnt/tpdc-data
```

必须以：

```text
read-only
```

方式挂载：

```text
/mnt/tpdc-data:/data:ro
```

S3 Gateway 只能读取数据。

------

# 二十、真实路径与容器路径

例如宿主机：

```text
/mnt/tpdc-data/2026/temp.nc
```

容器内部：

```text
/data/2026/temp.nc
```

因此数据库中建议保存：

```text
/data/2026/temp.nc
```

而不是：

```text
/mnt/tpdc-data/2026/temp.nc
```

这样服务内部不会依赖宿主机路径。

映射：

```text
宿主机

/mnt/tpdc-data
        │
        │ Docker read-only mount
        ▼
容器

/data
```

数据库：

```text
real_path=/data/2026/temp.nc
```

------

# 二十一、数据初始化

提供初始化脚本：

```bash
docker compose exec s3-gateway python -m app.init_data
```

例如：

```bash
python -m app.init_data \
  --bucket tpdc-bucket \
  --key v2026/temp.nc \
  --path /data/2026/temp.nc
```

初始化之后：

```text
s3://tpdc-bucket/v2026/temp.nc
```

即可访问：

```text
/data/2026/temp.nc
```

------

# 二十二、批量扫描功能

MVP 可以额外提供一个非常简单的：

```text
scan
```

功能。

例如：

```bash
docker compose exec s3-gateway \
  python -m app.scan \
  --root /data/2026 \
  --bucket tpdc-bucket \
  --prefix v2026/
```

扫描：

```text
/data/2026/
```

自动生成：

```text
object_mapping
```

例如：

```text
/data/2026/temp.nc
/data/2026/rain.nc
/data/2026/station.csv
```

映射：

```text
s3://tpdc-bucket/v2026/temp.nc
s3://tpdc-bucket/v2026/rain.nc
s3://tpdc-bucket/v2026/station.csv
```

注意：

扫描功能属于辅助功能，不要让它成为 S3 服务运行的前置条件。

------

# 二十三、健康检查

实现：

```text
GET /health
```

返回：

```json
{
  "status": "ok",
  "service": "s3-gateway",
  "version": "0.1.0"
}
```

Docker：

```yaml
healthcheck:
  test:
    - CMD
    - curl
    - -f
    - http://localhost:9000/health
```

------

# 二十四、日志

日志至少记录：

```text
时间
Access Key
Bucket
Object Key
HTTP Method
Status
File Size
Response Time
Client IP
```

例如：

```text
2026-09-22 10:20:31
GET
tpdc-bucket
v2026/temp.nc
206
1024 bytes
23ms
10.0.1.20
```

但不要记录：

```text
Secret Key
```

------

# 二十五、测试文件

项目启动时自动创建测试文件：

```text
test-data/
├── temp.nc
├── test.txt
├── data.json
└── sample.bin
```

其中：

```text
test.txt
```

内容：

```text
S3 Gateway MVP Test
```

建立：

```text
s3://tpdc-bucket/test/test.txt
```

映射：

```text
/data/test.txt
```

------

# 二十六、必须提供的测试方式

README 必须完整说明。

## 1. 启动

```bash
cp .env.example .env

docker compose build

docker compose up -d
```

检查：

```bash
docker compose ps
```

------

# 二十七、健康检查

```bash
curl http://localhost:9000/health
```

应该返回：

```json
{
  "status": "ok"
}
```

------

# 二十八、AWS CLI 测试

配置：

```bash
aws configure
```

然后：

```bash
aws --endpoint-url http://localhost:9000 \
    s3api list-buckets
```

测试：

```bash
aws --endpoint-url http://localhost:9000 \
    s3api list-objects-v2 \
    --bucket tpdc-bucket
```

测试下载：

```bash
aws --endpoint-url http://localhost:9000 \
    s3api get-object \
    --bucket tpdc-bucket \
    --key test/test.txt \
    downloaded.txt
```

验证：

```bash
cat downloaded.txt
```

------

# 二十九、Range 测试

使用：

```bash
curl \
  -H "Range: bytes=0-99" \
  http://localhost:9000/test/test.txt
```

必须能够返回：

```text
206 Partial Content
```

------

# 三十、安全测试

测试：

```text
../../etc/passwd
```

例如：

```bash
curl \
  http://localhost:9000/../../etc/passwd
```

不能访问宿主机文件。

还需要测试：

```text
../
..%2F
%2e%2e%2f
```

以及其他常见路径穿越形式。

------

# 三十一、核心验收标准

项目完成后必须满足以下条件。

## 功能

### 1

能够通过 Docker Compose 启动：

```bash
docker compose up -d
```

### 2

能够通过 S3 API：

```text
ListBuckets
ListObjectsV2
HeadObject
GetObject
```

### 3

能够读取真实数据中心文件。

### 4

支持 Range。

### 5

支持 AWS Signature V4。

### 6

默认只读。

### 7

支持虚拟路径映射。

### 8

支持 SQLite 保存映射关系。

### 9

支持健康检查。

### 10

支持 Docker healthcheck。

------

# 三十二、最终目录结构

最终应该形成类似：

```text
s3-gateway-mvp/
│
├── docker-compose.yml
├── Dockerfile
├── requirements.txt
├── .env.example
├── README.md
│
├── app/
│   ├── __init__.py
│   ├── main.py
│   ├── config.py
│   ├── database.py
│   ├── models.py
│   ├── mapping.py
│   ├── auth.py
│   ├── s3_server.py
│   ├── init_data.py
│   └── scan.py
│
├── data/
│   └── s3_gateway.db
│
└── tests/
    ├── test_health.py
    ├── test_bucket.py
    ├── test_object.py
    ├── test_range.py
    └── test_security.py
```

------

# 三十三、代码质量要求

这是一个 MVP，但不要写成一次性 Demo。

要求：

- 模块化
- 配置与代码分离
- 不硬编码密码
- 不硬编码真实数据路径
- 使用环境变量
- 使用 SQLite
- 统一异常处理
- 统一日志
- 类型提示
- README 完整
- Docker Compose 一键启动
- 提供测试脚本

不要为了追求复杂架构引入：

```text
Kubernetes
Redis
Kafka
MySQL
PostgreSQL
Ceph
Elasticsearch
```

MVP 不需要。

------

# 三十四、未来扩展方向

代码结构需要给未来扩展留下空间，但当前不要实现。

未来可能扩展：

```text
                    S3 Gateway
                         │
            ┌────────────┼────────────┐
            │            │            │
        TPDC数据中心   化学所       科学数据银行
            │            │            │
        本地文件系统   对象存储     数据库/文件系统
```

未来可能支持：

```text
多数据中心
多 Bucket
多 Access Key
细粒度权限
数据集级权限
临时 Token
Presigned URL
对象版本
审计日志
数据空间盒子
```

其中：

```text
S3 Gateway
```

未来可以成为：

```text
数据空间盒子
        │
        ├── Metadata Service
        ├── File Service
        ├── S3 Service
        ├── Dataset Seek Service
        ├── Permission Service
        └── Health Service
```

但本次 MVP **不要提前实现这些复杂模块**。

------

# 三十五、特别要求：先验证技术路线

在正式大量编码之前，请先判断：

> 当前选定的 Python 技术栈是否真的能够作为一个 S3 Server，对外提供标准 S3 API，并被 AWS CLI 正常访问。

不要出现：

```text
FastAPI HTTP API
```

伪装成：

```text
S3 API
```

必须真实支持：

```text
AWS S3 Client
        ↓
S3 API
        ↓
S3 Gateway
```

如果当前方案无法完整支持 S3 Server，请立即调整技术方案。

可以选择更成熟的 S3 Server 实现，但是仍然必须满足：

```text
Docker Compose
+
只读
+
虚拟文件映射
+
已有文件系统
+
Range
+
AWS CLI
```

------

# 三十六、开发流程

严格按照以下步骤执行：

## Step 1

分析 S3 Server 技术方案。

## Step 2

确定技术栈。

## Step 3

建立项目目录。

## Step 4

实现最小 S3 Server。

## Step 5

实现 Bucket。

## Step 6

实现 Object Mapping。

## Step 7

实现 GetObject。

## Step 8

实现 Range。

## Step 9

实现 AWS Signature V4。

## Step 10

实现 Docker。

## Step 11

实现 Docker Compose。

## Step 12

准备测试数据。

## Step 13

使用 AWS CLI 测试。

## Step 14

测试安全问题。

## Step 15

完善 README。

------

# 三十七、最终输出要求

开发完成后，请输出：

### 1. 技术架构说明

说明：

```text
S3 Client
    ↓
S3 Gateway
    ↓
Virtual Mapping
    ↓
Real File
```

### 2. 完整项目代码

### 3. Dockerfile

### 4. docker-compose.yml

### 5. .env.example

### 6. SQLite 初始化脚本

### 7. 测试数据

### 8. 自动化测试

### 9. README

### 10. 完整启动命令

最终必须做到：

```bash
git clone ...
cd s3-gateway-mvp

cp .env.example .env

docker compose up -d
```

然后：

```bash
aws --endpoint-url http://localhost:9000 \
    s3api list-buckets
```

以及：

```bash
aws --endpoint-url http://localhost:9000 \
    s3api get-object \
    --bucket tpdc-bucket \
    --key v2026/temp.nc \
    temp.nc
```

能够成功获取真实数据中心文件。

------

# 三十八、最终目标

本项目最终形成一个轻量级：

> **面向数据空间盒子的只读 S3 数据访问服务 MVP**

它不负责存储数据，而负责：

```text
统一协议
    ↓
统一虚拟路径
    ↓
统一访问入口
    ↓
映射数据中心真实文件
    ↓
通过 S3 协议提供数据
```

最终让数据探查智能体不需要关心：

```text
数据到底存在哪个服务器
数据到底是什么目录结构
数据中心内部是什么存储系统
真实文件绝对路径是什么
```

智能体只需要知道：

```text
S3 Endpoint
Bucket
Object Key
```

例如：

```text
Endpoint:
https://s3.tpdc.example.cn

Bucket:
tpdc-bucket

Object:
v2026/temp.nc
```

即可访问数据。