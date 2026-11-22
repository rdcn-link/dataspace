# SSO 单点登录接口文档

> 版本：oidc-server 0.4.0 / tds-gateway 0.1.0
> 更新日期：2026-08-14

本文档描述基于 JWT 的单点登录（SSO）方案，由 `oidc-server` 签发 Token，由 `tds-gateway` 全局过滤器解析校验，仅对配置的保护路径生效。

---

## 一、整体流程

```
┌─────────┐   1. POST /sso/token?uid=xxx   ┌────────────┐
│ 项目A   │ ─────────────────────────────▶ │ oidc-server│
│ (前端)  │ ◀───────────────────────────── │  /sso/token│
│         │   2. 返回 accessToken          └────────────┘
│         │
│         │   3. 把 Token 传递给项目B（URL 参数或 Header）
│         ▼
┌─────────┐   4. 携带 Token 请求网关        ┌────────────┐
│ 项目B   │ ─────────────────────────────▶ │ tds-gateway│
│         │                                │ SsoToken   │
│         │                                │  Filter    │
│         │                                └─────┬──────┘
│         │                                      │ 5. 解析 Token，校验有效性
│         │                                      │    把 uid 注入 X-TdsUid 头
│         │                                      ▼
│         │   6. 转发请求（带 X-TdsUid 头）  ┌────────────┐
│         │ ◀────────────────────────────── │ oidc-server│
│         │   7. /sso/uid 读头返回 uid      │  /sso/uid  │
└─────────┘                                  └────────────┘
```

| 步骤 | 说明 |
|---|---|
| 1 | 项目A 调用 `POST /sso/token?uid=xxx` 换取 SSO Token |
| 2 | `oidc-server` 校验 uid 存在，签发 HS256 JWT，返回 `accessToken` |
| 3 | 项目A 把 Token 传递给项目B（URL 参数 `?token=xxx` 或 Header `Authorization: Bearer ${ACCESS_TOKEN}`） |
| 4 | 项目B 携带 Token 请求网关（请求 oidc-server 的 `/sso/uid` 接口） |
| 5 | 网关 SsoTokenFilter 解析 Token 校验有效性，通过后把 `uid` 注入 `X-TdsUid` 请求头 |
| 6 | 网关把带 `X-TdsUid` 头的请求转发到 oidc-server 的 `/sso/uid` 接口 |
| 7 | `/sso/uid` 接口读取 `X-TdsUid` 头，返回 uid 给项目B |

> **关键点**：Token 解析工作全部由网关完成，oidc-server 的 `/sso/uid` 接口本身不做 Token 解析，仅读取网关注入的请求头。

---

## 二、oidc-server 接口

### 2.1 签发 SSO Token

根据用户 `uid` 签发 JWT Token，供前端跨系统跳转携带。

#### 请求

| 项 | 值 |
|---|---|
| Method | `POST` |
| Path | `/sso/token` |
| Content-Type | `application/x-www-form-urlencoded` |
| 认证 | 无（公开接口） |

#### 请求参数

| 参数名 | 位置 | 类型 | 必填 | 说明 |
|---|---|---|---|---|
| `uid` | query / form | string | 是 | 用户唯一标识，由微信扫码登录流程产生 |

#### 请求示例

```http
POST /sso/token?uid=U202608140001 HTTP/1.1
Host: oidc-server-host:10002
Content-Type: application/x-www-form-urlencoded
```

#### 响应格式

统一响应体 `OdcResponse`：

```json
{
  "code": 200,
  "data": { },
  "message": "Processing Completed",
  "timestamp": 1755148800000
}
```

| 字段 | 类型 | 说明 |
|---|---|---|
| `code` | int | 状态码，见 [错误码说明](#四错误码说明) |
| `data` | object / null | 业务数据，结构见下 |
| `message` | string | 状态描述 |
| `timestamp` | long | 服务器时间戳（毫秒） |

#### 成功响应（code=200）

`data` 字段结构：

| 字段 | 类型 | 说明 |
|---|---|---|
| `accessToken` | string | JWT Token 字符串，HS256 签名 |
| `tokenType` | string | 固定值 `Bearer` |
| `expiresIn` | long | Token 有效期（秒），默认 `86400`（24 小时） |
| `uid` | string | 用户唯一标识 |

```json
{
  "code": 200,
  "data": {
    "accessToken": "EXAMPLE_TOKEN签名",
    "tokenType": "Bearer",
    "expiresIn": 86400,
    "uid": "U202608140001"
  },
  "message": "Processing Completed",
  "timestamp": 1755148800000
}
```

#### 失败响应

**uid 不存在（code=500）**

```json
{
  "code": 500,
  "data": null,
  "message": "用户不存在",
  "timestamp": 1755148800000
}
```

**uid 为空（code=500）**

```json
{
  "code": 500,
  "data": null,
  "message": "uid 不能为空",
  "timestamp": 1755148800000
}
```

#### JWT Token 结构

Token 为标准 JWT，Header + Payload + Signature，使用 HS256 签名。

**Header：**
```json
{
  "alg": "HS256"
}
```

**Payload Claims：**

| Claim | 说明 | 示例 |
|---|---|---|
| `sub` | Subject，等于 uid | `U202608140001` |
| `uid` | 用户唯一标识 | `U202608140001` |
| `iat` | 签发时间（Unix 秒） | `1755148800` |
| `exp` | 过期时间（Unix 秒） | `1755235200` |

> 签名密钥由配置项 `sso.jwt.secret` 指定，`oidc-server` 与 `tds-gateway` 必须保持一致。

---

### 2.2 获取 uid（从请求头）

从请求头 `X-TdsUid` 中读取 uid 并返回。**供项目B 调用**，Token 的解析工作由网关完成。

> **重要**：本接口本身不做 Token 解析。它依赖网关 SsoTokenFilter 在转发前把 uid 注入 `X-TdsUid` 请求头。因此本接口路径必须配置在网关的 `gateway.sso.protected-paths` 中，且项目B 请求时必须携带有效 Token。

#### 请求

| 项 | 值 |
|---|---|
| Method | `POST` |
| Path | `/sso/uid` |
| 认证 | 需携带有效 Token（由网关校验） |

#### 请求参数

无。uid 由网关从 Token 中解析后注入 `X-TdsUid` 请求头。

#### 请求示例

项目B 通过网关请求本接口，携带 Token：

```http
POST /sso/uid HTTP/1.1
Host: gateway-host:11000
Authorization: Bearer ${ACCESS_TOKEN}
```

或通过 URL 参数携带 Token（适用于页面跳转）：

```
POST http://gateway-host:11000/sso/uid?token=EXAMPLE_TOKEN
```

#### 成功响应（code=200）

`data` 字段结构：

| 字段 | 类型 | 说明 |
|---|---|---|
| `uid` | string | 从 `X-TdsUid` 请求头读取的用户唯一标识 |

```json
{
  "code": 200,
  "data": {
    "uid": "U202608140001"
  },
  "message": "Processing Completed",
  "timestamp": 1755148800000
}
```

#### 失败响应

| 场景 | 触发位置 | HTTP 状态 | 响应 |
|---|---|---|---|
| 未携带 Token / Token 无效 / Token 过期 | **网关** | 401 | `{"code":401,"message":"..."}` |
| 请求未经过网关（无 X-TdsUid 头） | oidc-server | 200 | `{"code":500,"message":"未获取到uid，请确认请求经过网关且Token有效"}` |

> 说明：当请求经过网关且 Token 有效时，网关会注入 `X-TdsUid` 头，接口正常返回 uid；当请求未经过网关直接访问 oidc-server 时，接口读不到该头，返回 500 错误。

#### 工作原理

```
项目B 请求
    │
    │ POST /sso/uid
    │ Authorization: Bearer ${ACCESS_TOKEN}
    ▼
┌─────────────┐
│ tds-gateway │  1. 匹配保护路径 /sso/uid
│ SsoToken    │  2. 提取 Token，校验签名+过期
│ Filter      │  3. 解析出 uid
│             │  4. 注入 X-TdsUid 头，转发
└──────┬──────┘
       │ POST /sso/uid
       │ X-TdsUid: U202608140001
       ▼
┌─────────────┐
│ oidc-server │  5. 读取 X-TdsUid 头
│ /sso/uid    │  6. 返回 {"uid":"U202608140001"}
└─────────────┘
```

---

## 三、tds-gateway 网关行为说明

网关通过全局过滤器 `SsoTokenFilter` 对配置的保护路径进行 Token 校验，非保护路径直接放行（下游服务使用明文 Header 传递用户信息）。

### 3.1 配置项

在 `tds-gateway/src/main/resources/application.properties` 中配置：

| 配置项 | 说明 | 默认值 | 示例 |
|---|---|---|---|
| `sso.jwt.secret` | HS256 签名密钥，必须与 oidc-server 一致 | 无 | `${SSO_JWT_SECRET}` |
| `gateway.sso.protected-paths` | 需要校验 Token 的路径（Ant 模式，逗号分隔），留空则所有路径都放行 | 空 | `/tds-collection/**,/tds-trading/**` |

### 3.2 Token 获取顺序

过滤器按以下顺序尝试获取 Token：

1. **请求头** `Authorization: Bearer <token>`
2. **URL 查询参数** `?token=<token>`（方便前端跳转时通过 URL 携带）

### 3.3 校验逻辑

| 步骤 | 说明 |
|---|---|
| 1. 路径判断 | 请求路径不在 `protected-paths` 中 → 直接放行 |
| 2. 提取 Token | 按上述顺序获取 Token；获取不到 → 返回 401 |
| 3. 签名校验 | 用 `sso.jwt.secret` 校验 HS256 签名；失败 → 返回 401 |
| 4. 过期校验 | 校验 `exp` 是否过期；过期 → 返回 401 |
| 5. 提取 uid | 从 `uid` claim 取值（取不到则取 `sub`） |
| 6. 透传 | 移除客户端可能伪造的 `X-TdsUid` 头，写入解析出的真实 uid，放行到下游 |

### 3.4 下游服务接收的 Header

校验通过后，网关会向下游服务请求中注入以下 Header：

| Header 名 | 说明 |
|---|---|
| `X-TdsUid` | 从 Token 中解析出的用户 uid |

> 下游服务通过读取 `X-TdsUid` 获取当前登录用户，无需自行解析 Token。

### 3.5 网关 401 响应

校验失败时，网关直接返回 HTTP 401，不转发到下游服务。

**HTTP 状态码：** `401 Unauthorized`

**Content-Type：** `application/json`

**响应体：**

```json
{
  "code": 401,
  "message": "缺少有效的认证Token"
}
```

或

```json
{
  "code": 401,
  "message": "Token无效或已过期"
}
```

| message | 触发条件 |
|---|---|
| `缺少有效的认证Token` | 请求中未携带 Token（既无 Authorization 头，也无 token 参数） |
| `Token无效或已过期` | Token 签名校验失败、格式错误或已过期 |

---

## 四、错误码说明

### 4.1 oidc-server 响应码

| code | 含义 | 触发场景 | message |
|---|---|---|---|
| `200` | 处理完成 | `/sso/token` 签发成功、`/sso/uid` 读头成功 | `Processing Completed` |
| `500` | 系统异常 | `/sso/token`：uid 不存在 / uid 为空 | `用户不存在` / `uid 不能为空` |
| `500` | 系统异常 | `/sso/uid`：请求未经过网关（无 X-TdsUid 头） | `未获取到uid，请确认请求经过网关且Token有效` |

### 4.2 tds-gateway HTTP 状态码

| HTTP Status | 触发场景 | 响应体 message |
|---|---|---|
| `401` | 保护路径未携带 Token | `缺少有效的认证Token` |
| `401` | Token 签名无效 / 格式错误 / 已过期 | `Token无效或已过期` |
| `403` | 域名白名单校验失败（由 DomainWhitelistFilter 返回） | `Forbidden` |
| `200` | 校验通过，放行到下游 | 下游服务响应 |

---

## 五、使用示例

### 5.1 前端换取 Token

```bash
curl -X POST "http://oidc-server-host:10002/sso/token?uid=U202608140001"
```

### 5.2 携带 Token 访问下游（Header 方式）

```bash
curl -X GET "http://gateway-host:11000/tds-collection/dataset/list" \
  -H "Authorization: Bearer ${ACCESS_TOKEN}"
```

### 5.3 携带 Token 访问下游（URL 参数方式，适用于页面跳转）

```
https://gateway-host:11000/tds-collection/dataset/list?token=EXAMPLE_TOKEN
```

### 5.4 项目B 通过网关获取 uid

项目B 携带 Token 请求网关（网关已配置 `/sso/uid` 为保护路径）：

```bash
curl -X POST "http://gateway-host:11000/sso/uid" \
  -H "Authorization: Bearer ${ACCESS_TOKEN}"
```

成功响应：

```json
{
  "code": 200,
  "data": {
    "uid": "U202608140001"
  },
  "message": "Processing Completed",
  "timestamp": 1755148800000
}
```

Java 调用示例（项目B）：

```java
// 项目B 通过网关调用 oidc-server 的 /sso/uid 接口
// 网关会解析 Token，把 uid 注入 X-TdsUid 头转发到 oidc-server
HttpHeaders headers = new HttpHeaders();
headers.set("Authorization", "Bearer " + token);

HttpEntity<Void> entity = new HttpEntity<>(headers);
ResponseEntity<OdcResponse> resp = restTemplate.postForEntity(
    "http://gateway-host:11000/sso/uid",
    entity,
    OdcResponse.class
);

if (resp.getStatusCode() == HttpStatus.OK
        && resp.getBody() != null
        && resp.getBody().getCode() == 200) {
    Map<String, Object> data = (Map<String, Object>) resp.getBody().getData();
    String uid = (String) data.get("uid");
    // 使用 uid 进行业务处理
} else if (resp.getStatusCode() == HttpStatus.UNAUTHORIZED) {
    // Token 无效或过期，网关返回 401
}
```

### 5.5 其他下游服务获取 uid（经过网关的场景）

其他经过网关的下游服务，直接从请求头读取 `X-TdsUid`：

```java
@GetMapping("/dataset/list")
public Object list(HttpServletRequest request) {
    String uid = request.getHeader("X-TdsUid");
    // ...
}
```

---

## 六、配置参考

### 6.1 oidc-server `application.properties`

```properties
# SSO JWT Configuration
# HS256 签名密钥（至少 32 字节），需与 tds-gateway 保持一致
sso.jwt.secret=${SSO_JWT_SECRET}
# JWT 过期时间（秒），默认 24 小时
sso.jwt.expiration=86400
```

### 6.2 tds-gateway `application.properties`

```properties
# SSO 单点登录配置
# HS256 签名密钥（至少 32 字节），需与 oidc-server 保持一致
sso.jwt.secret=${SSO_JWT_SECRET}
# SSO 保护路径（Ant 模式，逗号分隔），仅这些路径需要解析校验 JWT Token
# 未配置时所有路径均放行（使用明文传递用户信息）
gateway.sso.protected-paths=/tds-collection/**,/tds-trading/**,/tds-auth/**
```

---

## 七、注意事项

1. **密钥一致性**：`sso.jwt.secret` 在 `oidc-server` 与 `tds-gateway` 必须完全一致，否则网关校验必然失败。
2. **密钥强度**：HS256 要求密钥至少 32 字节（256 位），建议使用足够长的随机字符串。
3. **Token 传递方式**：页面跳转建议用 URL 参数 `?token=xxx`；AJAX 请求建议用 `Authorization: Bearer ${ACCESS_TOKEN}` 头。
4. **保护路径配置**：`gateway.sso.protected-paths` 留空时所有路径都不校验 Token；仅填写需要 SSO 保护的路径。
5. **uid 伪造防护**：网关在校验通过后会先移除客户端可能伪造的 `X-TdsUid` 头，再写入 Token 中解析出的真实 uid，下游服务可信任该 Header。
6. **非保护路径**：未配置在 `protected-paths` 中的路径，网关不做 Token 校验，下游服务通过明文 Header 自行传递用户信息（保持原有逻辑）。
