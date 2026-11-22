package cn.tds.trading.config;

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

    public static final String WECHAT_APPID = System.getenv("WECHAT_APPID");
    public static final String WECHAT_SECRET = System.getenv("WECHAT_SECRET");

    public static final String WECHAT_URL = System.getenv("WECHAT_URL");
}
