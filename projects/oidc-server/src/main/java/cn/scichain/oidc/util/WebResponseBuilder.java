package cn.scichain.oidc.util;

import cn.scichain.oidc.domain.ResponseCode;
import cn.scichain.oidc.domain.WebResponse;

/**
 * WebResponseBuilder 处理网络请求响应信息的工具类
 *
 * @author 郭志斌
 * @version oidc-server 1.0.0
 * <b> Creation Time:</b> 2025/5/13 9:26
 */
public final class WebResponseBuilder {

    private WebResponseBuilder() {

    }

    /**
     * 构建WebResponse
     *
     * @param code    响应码
     * @param data    响应数据
     * @param message 响应信息
     * @return WebResponse
     */
    public static WebResponse build(final int code, final Object data, final String message) {
        return new WebResponse(code, data, message, System.currentTimeMillis());
    }

    /**
     * 构建WebResponse
     *
     * @param responseCode 响应码
     * @param data         响应数据
     * @return WebResponse
     */
    public static WebResponse build(final ResponseCode responseCode, final Object data) {
        return build(responseCode.getCode(), data, responseCode.getMessage());
    }

    /**
     * 构建WebResponse
     *
     * @param responseCode 响应码
     * @return WebResponse
     */
    public static WebResponse build(final ResponseCode responseCode) {
        return build(responseCode.getCode(), null, responseCode.getMessage());
    }


}
