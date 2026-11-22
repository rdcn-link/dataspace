package cn.scichain.oidc.config;

import org.springframework.context.annotation.Configuration;

/**
 * WeChatConfig Description
 *
 * @author 李国都
 * @version 1.0.0
 * <b>Creation Time:</b> 2026/4/30 15:02
 */
@Configuration
public class WeChatConfig {

    public static final String WECHAT_SERVICE_APPID = System.getenv("WECHAT_SERVICE_APPID");
    public static final String WECHAT_SERVICE_SECRET = System.getenv("WECHAT_SERVICE_SECRET");

    public static final String WECHAT_APP_APPID = System.getenv("WECHAT_APP_APPID");

    public static final String WECHAT_APP_SECRET= System.getenv("WECHAT_APP_SECRET");

    public static final String WECHAT_URL = System.getenv("WECHAT_URL");

    public static final String WECHAT_ENCODING_AES_KEY = System.getenv("WECHAT_ENCODING_AES_KEY");

    /**
     * 开放平台网站应用 OAuth2 授权配置
     * 注意：网站应用 AppID 与公众号 AppID 是两套体系。
     * TODO 确认 WECHAT_SERVICE_APPID 是否已开通"开放平台网站应用"，
     *      若未开通需在 open.weixin.qq.com 注册网站应用后，替换为网站应用 AppID/Secret
     */
    public static final String WECHAT_OAUTH_APPID = WECHAT_SERVICE_APPID;
    public static final String WECHAT_OAUTH_SECRET = WECHAT_SERVICE_SECRET;

    /**
     * 授权回调地址，必须与开放平台后台配置的"授权回调域名"一致
     */
    public static final String WECHAT_OAUTH_REDIRECT_URI = System.getenv("WECHAT_OAUTH_REDIRECT_URI");

    /**
     * 开放平台网站应用授权 scope
     */
    public static final String WECHAT_OAUTH_SCOPE = "snsapi_login";

    /**
     * 前端登录页回跳域名白名单（防开放重定向），逗号分隔
     */
    public static final String WECHAT_OAUTH_FRONT_DOMAINS = System.getenv("WECHAT_OAUTH_FRONT_DOMAINS");
}
