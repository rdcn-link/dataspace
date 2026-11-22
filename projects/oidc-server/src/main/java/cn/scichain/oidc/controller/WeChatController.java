package cn.scichain.oidc.controller;

import cn.opendatachain.common.core.OdcResponse;
import cn.opendatachain.common.core.OdcResponseBuilder;
import cn.opendatachain.common.exception.OdcException;
import cn.scichain.oidc.config.WeChatConfig;
import cn.scichain.oidc.http.MyClient;
import cn.scichain.oidc.service.WeChatService;
import com.alibaba.fastjson.JSONObject;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.annotation.Resource;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.servlet.http.HttpSession;
import lombok.AllArgsConstructor;
import lombok.extern.log4j.Log4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.io.BufferedReader;
import java.io.IOException;
import java.net.URLEncoder;
import java.net.http.HttpResponse;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.util.Arrays;
import java.util.Base64;
import java.util.HashMap;
import java.util.Map;
import java.util.UUID;

import static org.reflections.Reflections.log;

/**
 * WeChatController Description
 *
 * @author 李国都
 * @version 1.0.0
 * <b>Creation Time:</b> 2026/4/29 10:03
 */
@RestController
@Tag(name = "微信")
@RequestMapping("/wechat")
public class WeChatController {

    // 替换成你在微信公众平台配置的 Token
    private static final String WECHAT_TOKEN = "omniSpace2026";

    private String url = "REPLACE_WITH_EXTERNAL_CONFIG";

    @Resource
    private MyClient myClient;

    @Autowired
    private WeChatService weChatService;


    @GetMapping("/receive")
    public String wxSignatureCheck(
            @RequestParam(value = "signature") String signature,
            @RequestParam(value = "timestamp") String timestamp,
            @RequestParam(value = "nonce") String nonce,
            @RequestParam(value = "echostr") String echostr) {

        System.out.println("收到微信效验请求，signature: " + signature);
        System.out.println("收到微信效验请求，timestamp: " + timestamp);
        System.out.println("收到微信效验请求，nonce: " + nonce);
        System.out.println("收到微信效验请求，echostr: " + echostr);

//         验证签名
        if (checkSignature(signature, timestamp, nonce)) {
            System.out.println("签名验证成功，返回 echostr");
            return echostr;
        } else {
            System.out.println("签名验证失败");
            return "error";
        }
    }


    @GetMapping("/wxLogin")
    public Map<String, String> wxLoginPage() {
        Map<String, String> map = weChatService.generateQRCode();
        return map;
    }

    @PostMapping("/receive")
    public String wechatCallback(HttpServletRequest request) {
        try {
            // 读取请求体
            StringBuilder sb = new StringBuilder();
            try (BufferedReader reader = request.getReader()) {
                String line;
                while ((line = reader.readLine()) != null) {
                    sb.append(line);
                }
            }
            String body = sb.toString();

            // 安全模式下校验消息签名 msg_signature
            String msgSignature = request.getParameter("msg_signature");
            String timestamp = request.getParameter("timestamp");
            String nonce = request.getParameter("nonce");
            if (msgSignature != null && !checkMsgSignature(msgSignature, timestamp, nonce, body)) {
                log.error("微信消息签名校验失败");
                return "";
            }

            return weChatService.handleWechatEvent(body);
        } catch (Exception e) {
            log.error("处理微信回调失败", e);
            System.out.println("处理微信回调失败");
            return "";
        }
    }


    @GetMapping("/code2session")
    public String code2Session(@RequestParam("code") String code) {
        JSONObject resp = myClient.code2Session(WeChatConfig.WECHAT_APP_APPID, WeChatConfig.WECHAT_APP_SECRET, code);
        return resp.getString("openid");
    }

    @GetMapping("/code2openidByService")
    public OdcResponse code2openidByService(@RequestParam("code") String code) {
        JSONObject resp = myClient.getOAuth2AccessToken(WeChatConfig.WECHAT_SERVICE_APPID, WeChatConfig.WECHAT_SERVICE_SECRET, code);
        return OdcResponseBuilder.buildSuccess(resp.getString("openid"));
    }

    /**
     * 微信开放平台网站应用授权入口
     * 手机浏览器访问后 302 到微信授权页，授权后回跳 /wechat/oauthCallback
     *
     * @param redirect 授权成功后前端回跳地址（域名须在白名单 WECHAT_OAUTH_FRONT_DOMAINS 内）
     */
    @GetMapping("/oauthUrl")
    public void oauthUrl(@RequestParam(required = false) String redirect, HttpServletResponse response) throws IOException {
        if (org.apache.commons.lang3.StringUtils.isBlank(redirect)) {
            redirect = "https://" + WeChatConfig.WECHAT_OAUTH_FRONT_DOMAINS.split(",")[0].trim();
        }
        if (!checkFrontDomain(redirect)) {
            response.sendError(HttpServletResponse.SC_BAD_REQUEST, "redirect 域名不在白名单");
            return;
        }
        // state 携带前端回跳地址（base64url 编码），防 CSRF 与开放重定向
        String state = UUID.randomUUID().toString().replace("-", "") + "."
                + Base64.getUrlEncoder().withoutPadding().encodeToString(redirect.getBytes(StandardCharsets.UTF_8));
        response.sendRedirect(weChatService.buildOAuthAuthorizeUrl(state));
    }

    /**
     * 微信开放平台网站应用授权回调
     * code 换 openid → 自动注册/查询用户 → 302 回跳前端携带 openid（与扫码登录一致，不签发 token）
     */
    @GetMapping("/oauthCallback")
    public void oauthCallback(@RequestParam("code") String code,
                              @RequestParam("state") String state,
                              HttpServletResponse response) throws IOException {
        String redirect = parseRedirectFromState(state);
        if (org.apache.commons.lang3.StringUtils.isBlank(redirect) || !checkFrontDomain(redirect)) {
            redirect = "https://" + WeChatConfig.WECHAT_OAUTH_FRONT_DOMAINS.split(",")[0].trim();
        }
        try {
            JSONObject resp = myClient.getOAuth2AccessToken(WeChatConfig.WECHAT_OAUTH_APPID, WeChatConfig.WECHAT_OAUTH_SECRET, code);
            String openid = resp.getString("openid");
            if (org.apache.commons.lang3.StringUtils.isBlank(openid)) {
                String errmsg = resp.getString("errmsg");
                response.sendRedirect(redirect + separator(redirect) + "error=" + URLEncoder.encode(errmsg == null ? "授权失败" : errmsg, "UTF-8"));
                return;
            }
            weChatService.getOrCreateUserByOpenId(openid);
            response.sendRedirect(redirect + separator(redirect) + "openid=" + URLEncoder.encode(openid, "UTF-8"));
        } catch (Exception e) {
            log.error("微信开放平台授权回调处理失败", e);
            response.sendRedirect(redirect + separator(redirect) + "error=" + URLEncoder.encode(e.getMessage() == null ? "授权失败" : e.getMessage(), "UTF-8"));
        }
    }

    /**
     * 从 state 中解析前端回跳地址，格式：UUID.base64url(redirect)
     */
    private String parseRedirectFromState(String state) {
        if (state == null) {
            return null;
        }
        int idx = state.indexOf('.');
        if (idx < 0 || idx == state.length() - 1) {
            return null;
        }
        try {
            return new String(Base64.getUrlDecoder().decode(state.substring(idx + 1)), StandardCharsets.UTF_8);
        } catch (Exception e) {
            return null;
        }
    }

    /**
     * 校验回跳地址域名是否在白名单
     */
    private boolean checkFrontDomain(String url) {
        try {
            java.net.URI uri = java.net.URI.create(url);
            String host = uri.getHost();
            if (host == null) {
                return false;
            }
            for (String domain : WeChatConfig.WECHAT_OAUTH_FRONT_DOMAINS.split(",")) {
                if (domain.trim().equalsIgnoreCase(host)) {
                    return true;
                }
            }
            return false;
        } catch (Exception e) {
            return false;
        }
    }

    private String separator(String redirect) {
        return redirect.contains("?") ? "&" : "?";
    }


    @GetMapping("/status/{loginToken}")
    public Map<String, Object> checkLoginStatus(@PathVariable String loginToken) {
        Map<String, Object> data = weChatService.checkLoginStatus(loginToken);
        return data;
    }

    @GetMapping("/bindUser")
    public OdcResponse bindUser(@RequestParam String openid,
                                @RequestParam String uid) {
        return weChatService.bindUser(openid,uid);
    }




    /**
     * 安全模式下校验消息签名：sha1(sort(token, timestamp, nonce, encrypt))
     */
    private boolean checkMsgSignature(String msgSignature, String timestamp, String nonce, String requestBody) {
        java.util.regex.Matcher m = java.util.regex.Pattern
                .compile("<Encrypt><!\\[CDATA\\[(.*?)\\]\\]></Encrypt>", java.util.regex.Pattern.DOTALL)
                .matcher(requestBody);
        if (!m.find()) {
            return false;
        }
        String encrypt = m.group(1);
        String[] arr = {WECHAT_TOKEN, timestamp, nonce, encrypt};
        Arrays.sort(arr);
        return sha1(String.join("", arr)).equals(msgSignature);
    }

    private boolean checkSignature(String signature, String timestamp, String nonce) {
        String[] arr = {WECHAT_TOKEN, timestamp, nonce};
        // 排序
        Arrays.sort(arr);
        // 拼接字符串
        StringBuilder content = new StringBuilder();
        for (String s : arr) {
            content.append(s);
        }

        // SHA1 加密
        String tmpStr = sha1(content.toString());
        return tmpStr != null && tmpStr.equals(signature);
    }

    private String sha1(String str) {
        try {
            MessageDigest md = MessageDigest.getInstance("SHA-1");
            byte[] digest = md.digest(str.getBytes());
            StringBuilder hexStr = new StringBuilder();
            for (byte b : digest) {
                hexStr.append(String.format("%02x", b));
            }
            return hexStr.toString();
        } catch (NoSuchAlgorithmException e) {
            e.printStackTrace();
            return null;
        }
    }
}