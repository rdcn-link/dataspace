# 手机端微信开放平台授权登录（openid 登录）接入文档

> 适用场景：**手机端浏览器**打开前端登录页，点击"微信登录"按钮，唤起微信完成授权，最终拿到用户 openid 建立登录态。
> 与现有"PC 扫码登录"（公众号带参二维码 + 轮询）是两套独立流程，互不影响。

---

## 1. 整体流程

```
手机浏览器登录页 ──点击"微信登录"──▶ GET /wechat/oauthUrl?redirect=登录页地址
                                        │ 302
                                        ▼
   https://open.weixin.qq.com/connect/oauth2/authorize
        ?appid=开放平台网站应用AppID
        &redirect_uri=REPLACE_WITH_EXTERNAL_CONFIG
        &response_type=code
        &scope=snsapi_login
        &state=UUID.回跳地址(base64url)
        #wechat_redirect

   手机端微信官方授权页：唤起微信 / 展示二维码引导（微信内打开则直接授权）
                                        │ 用户授权后 302
                                        ▼
   GET /wechat/oauthCallback?code=xxx&state=xxx
        ├─ 校验 state（解析出前端回跳地址，校验域名白名单）
        ├─ code 换 openid（api.weixin.qq.com/sns/oauth2/access_token，code 一次性）
        ├─ 按 serviceOpenId 查询用户，不存在则自动注册（status=APPROVE）
        └─ 302 回跳前端：{redirect}?openid=xxx   （失败回跳 ?error=xxx）

   前端拿到 openid → 调 /user/findbyopenid?openId=xxx&type=0 拉取用户信息 → 建立登录态
```

**核心约定：与扫码登录一致，不签发 token。** 后端回调只负责把微信授权 code 兑换为 openid 并自动注册用户，openid 交给前端自行建立登录态。这样前端无需维护 token，与现有扫码登录的前端用法保持一致。

---

## 2. 微信侧配置清单（必须，无法绕过）

| 序号 | 事项 | 说明 |
| --- | --- | --- |
| 1 | **确认/注册开放平台网站应用** | 在 [open.weixin.qq.com](https://open.weixin.qq.com) 确认 `REPLACE_WITH_EXTERNAL_CONFIG` 是否已开通"网站应用"。**公众号 AppID 与开放平台网站应用 AppID 是两套体系**，若该 AppID 未注册网站应用，需注册获取新 AppID/Secret 填入后端配置 |
| 2 | **配置授权回调域名** | 开放平台后台 → 网站应用 → 开发者账号 → **授权回调域名**填 `REPLACE_WITH_EXTERNAL_CONFIG`（域名级，与扫码登录的公众号服务器配置互不影响） |
| 3 | **域名可达** | 确保 `REPLACE_WITH_EXTERNAL_CONFIG` 公网可访问到 oidc-server（现有扫码登录走 cpolar 内网穿透 `2190cc94.r6.cpolar.cn`，正式域名需确认代理/路由已配置） |

> 说明：本流程使用开放平台网站应用授权（scope=`snsapi_login`）。公众号网页授权（`snsapi_userinfo`）只能在**微信内置浏览器**中完成，手机普通浏览器打开会提示"请在微信客户端中打开"，无法唤起微信，因此不适用于本场景。

---

## 3. 后端配置与接口说明（已在 oidc-server 实现）

### 3.1 配置项（`WeChatConfig.java`）

```java
// 开放平台网站应用 AppID/Secret
// TODO 确认 REPLACE_WITH_EXTERNAL_CONFIG 是否已开通"开放平台网站应用"，
//      若未开通需注册网站应用后替换为新的 AppID/Secret
public static final String WECHAT_OAUTH_APPID  = WECHAT_SERVICE_APPID;
public static final String WECHAT_OAUTH_SECRET = WECHAT_SERVICE_SECRET;

// 授权回调地址（必须与开放平台后台"授权回调域名"一致）
public static final String WECHAT_OAUTH_REDIRECT_URI = "REPLACE_WITH_EXTERNAL_CONFIG";

// 开放平台网站应用授权 scope（固定值）
public static final String WECHAT_OAUTH_SCOPE = "snsapi_login";

// 前端登录页回跳域名白名单（防开放重定向），逗号分隔
public static final String WECHAT_OAUTH_FRONT_DOMAINS = "REPLACE_WITH_EXTERNAL_CONFIG";
```

### 3.2 接口一：授权入口

```
GET /wechat/oauthUrl?redirect={前端登录页地址}
```

- `redirect`：可选，授权成功后的前端回跳地址（域名须在 `WECHAT_OAUTH_FRONT_DOMAINS` 白名单内）；缺省用白名单第一个域名。
- 行为：校验 redirect 域名 → 生成 `state = UUID.base64url(redirect)` → **302** 到微信开放平台授权页。

### 3.3 接口二：授权回调

```
GET /wechat/oauthCallback?code={微信回调code}&state={授权时的state}
```

- 校验 state 并解析前端回跳地址 → 用 code 调微信 `sns/oauth2/access_token` 换 openid（code 一次性）→ 按 `serviceOpenId` 查/建用户（**自动注册、status=APPROVE、角色 ROLE_USER**）→ **302** 回跳前端。
- 成功：`{redirect}?openid=xxx`
- 失败：`{redirect}?error=错误原因`

### 3.4 权限

`/wechat/**` 已在 `WebSecurityConfig` 中 `permitAll`，无需改动。

---

## 4. 完整前端示例代码（单文件 `login.html`）

登录页与回调处理合一，前端人员可直接使用或仿照。

```html
<!DOCTYPE html>
<html lang="zh-CN">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
<title>微信登录</title>
<style>
  *{margin:0;padding:0;box-sizing:border-box}
  body{font-family:-apple-system,BlinkMacSystemFont,"PingFang SC","Microsoft YaHei",sans-serif;
       background:linear-gradient(135deg,#07c160,#06ad56);min-height:100vh;display:flex;
       align-items:center;justify-content:center}
  .card{width:320px;background:#fff;border-radius:16px;padding:40px 28px 32px;
        box-shadow:0 12px 32px rgba(0,0,0,.18);text-align:center}
  .logo{width:64px;height:64px;border-radius:50%;background:#07c160;margin:0 auto 16px;
        display:flex;align-items:center;justify-content:center;color:#fff;font-size:30px}
  h1{font-size:20px;color:#1a1a1a;margin-bottom:8px}
  p.sub{font-size:13px;color:#999;margin-bottom:28px}
  .btn-wechat{display:block;width:100%;padding:14px 0;border:none;border-radius:8px;
              background:#07c160;color:#fff;font-size:16px;cursor:pointer}
  .btn-wechat:active{opacity:.85}
  .tip{margin-top:16px;font-size:12px;color:#bbb;line-height:1.6}
  .hidden{display:none}
  .uid{color:#07c160;font-size:14px;word-break:break-all;margin:8px 0}
</style>
</head>
<body>
<div class="card">
  <div id="loginBox">
    <div class="logo">微</div>
    <h1>微信登录</h1>
    <p class="sub">点击下方按钮，唤起微信完成授权</p>
    <button class="btn-wechat" id="btnWechat">微信登录</button>
    <p class="tip">将跳转至微信授权页面，请按提示完成授权</p>
  </div>
  <div id="successBox" class="hidden">
    <div class="logo" style="background:#09bb07">✓</div>
    <h1>登录成功</h1>
    <p class="sub">openid：<span class="uid" id="openidText"></span></p>
    <p class="sub">uid：<span class="uid" id="uidText"></span></p>
    <p class="sub">昵称：<span class="uid" id="nameText"></span></p>
    <button class="btn-wechat" id="btnClear" style="background:#999">退出演示</button>
  </div>
</div>

<script>
(function () {
  // ====== 配置 ======
  var BACKEND = 'https://REPLACE_WITH_EXTERNAL_CONFIG';                 // 后端 oidc-server 地址
  var FRONT_PAGE = location.origin + location.pathname;   // 授权成功后回跳地址（本页）

  // ====== 页面加载：处理回调结果 ======
  var params = new URLSearchParams(location.search);
  var openid = params.get('openid');

  if (openid) {
    // 授权成功：保存 openid 并拉取用户信息
    localStorage.setItem('wechat_openid', openid);
    history.replaceState({}, '', FRONT_PAGE);             // 清除地址栏中的 openid
    fetch(BACKEND + '/user/findbyopenid?openId=' + encodeURIComponent(openid) + '&type=0')
      .then(function (r) { return r.json(); })
      .then(function (res) {                              // res.data 为 OidcUser 对象
        localStorage.setItem('wechat_uid', res.data ? res.data.uid : '');
        localStorage.setItem('wechat_name', res.data ? res.data.name : '');
        showSuccess(openid, res.data);
      })
      .catch(function () { showSuccess(openid, null); });
  } else if (params.get('error')) {
    alert('微信授权失败：' + params.get('error'));
  } else if (localStorage.getItem('wechat_openid')) {
    // 已登录过：直接展示
    showSuccess(localStorage.getItem('wechat_openid'), {
      uid: localStorage.getItem('wechat_uid'),
      name: localStorage.getItem('wechat_name')
    });
  }

  // ====== 微信登录按钮：由后端生成授权地址并跳转 ======
  document.getElementById('btnWechat').addEventListener('click', function () {
    location.href = BACKEND + '/wechat/oauthUrl?redirect=' + encodeURIComponent(FRONT_PAGE);
  });

  document.getElementById('btnClear').addEventListener('click', function () {
    localStorage.removeItem('wechat_openid');
    localStorage.removeItem('wechat_uid');
    localStorage.removeItem('wechat_name');
    location.reload();
  });

  function showSuccess(oid, user) {
    document.getElementById('loginBox').classList.add('hidden');
    document.getElementById('successBox').classList.remove('hidden');
    document.getElementById('openidText').textContent = oid;
    document.getElementById('uidText').textContent = (user && user.uid) ? user.uid : '';
    document.getElementById('nameText').textContent = (user && user.name) ? user.name : '';
  }
})();
</script>
</body>
</html>
```

### 前端接入要点

1. **发起登录**：按钮点击跳 `BACKEND + '/wechat/oauthUrl?redirect=' + encodeURIComponent(当前登录页URL)`，后端负责跳微信。
2. **接收结果**：授权成功后微信会 302 回跳到 `redirect` 参数指定的地址并携带 `openid`（或失败携带 `error`），前端在页面加载时解析 URL 参数即可。
3. **拉取用户信息**：调已有接口 `GET /user/findbyopenid?openId=xxx&type=0`（`type=0` 表示公众号/serviceOpenId），返回 `{code, message, data, timestamp}`，`data` 为用户对象。
4. **登录态**：将 `openid`（及可选 uid/name）存入 localStorage 或交给业务框架，此后以 openid 标识用户。

> 若前端页面与后端不同域，请将页面域名加入 `WECHAT_OAUTH_FRONT_DOMAINS` 白名单，并确保回调接口可跨域或通过网关同域代理。

---

## 5. 注意事项

1. **"唤起微信"的行为由微信官方控制**：手机普通浏览器打开 `snsapi_login` 授权页时，微信会展示移动端授权引导页（二维码 + "打开微信扫一扫"，部分机型/浏览器会通过 `weixin://` 协议尝试唤起微信 App）。网页无法 100% 强制拉起微信 App 完成授权；真正的"唤起 App 授权"是开放平台**移动应用 + OpenSDK** 的能力（仅限原生 App）。若必须在微信内获得最佳体验，可让用户在微信内置浏览器中打开登录页，此时直接进入授权。
2. **code 一次性使用**：换取后立即失效，失败时需重新走授权流程。
3. **state 防 CSRF**：回调必须校验 state（本项目 state 内编码了前端回跳地址并校验域名白名单，防止开放重定向）。
4. **开放平台网站应用需要审核**：网站应用需在开放平台通过审核后才能正常使用 `snsapi_login` 授权。
5. **与扫码登录共用 AppID 的前提**：`WECHAT_OAUTH_APPID` 与公众号扫码使用的 AppID 可以是同一个（同一主体下，AppID 同时具备公众号权限与开放平台网站应用权限时），**前提是它确实在开放平台注册了网站应用**，否则会授权失败（错误信息如"redirect_uri 域名与后台配置不一致"或"appid 不存在"）。

---

## 6. 常见问题

| 现象 | 排查 |
| --- | --- |
| 授权页报"redirect_uri 域名与后台配置不一致" | 开放平台后台"授权回调域名"未配置或未包含 `REPLACE_WITH_EXTERNAL_CONFIG` |
| 报"appid 不存在" / "无权限" | `WECHAT_OAUTH_APPID` 未注册开放平台网站应用 |
| 手机浏览器打开授权页提示"请在微信客户端中打开" | 使用的不是 `snsapi_login`（确认 scope 配置）或 AppID 是公众号而非网站应用 |
| 回调接口 500 / 502 | `REPLACE_WITH_EXTERNAL_CONFIG` 未正确代理到 oidc-server（10002 端口） |
| 授权成功后未回跳前端 | 检查前端 `redirect` 域名是否在白名单，前端需允许 URL 参数被解析 |
