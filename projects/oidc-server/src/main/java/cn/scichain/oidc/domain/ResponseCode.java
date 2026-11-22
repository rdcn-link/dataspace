package cn.scichain.oidc.domain;

import cn.scichain.oidc.exception.OidcException;

/**
 * ResponseCode 网络响应状态码
 *
 * @author 郭志斌
 * @version oidc-server 1.0.0
 * <b> Creation Time:</b> 2025/5/13 9:46
 */
public enum ResponseCode {

    /**
     * 处理完成
     */
    SUCCESS(200, "Processing Completed"),

    /**
     * 系统异常
     */
    FAILURE(500, "System Exception"),

    /**
     * 未授权访问
     */
    UNAUTHORIZED(401,"Unauthorized");

    /**
     * 状态码
     */
    private int code;

    /**
     * 状态码描述
     */
    private String message;

    ResponseCode(int code, String message) {
        this.code = code;
        this.message = message;
    }

    public int getCode() {
        return code;
    }

    public String getMessage() {
        return message;
    }

    public static ResponseCode getResponseCode(int code) {
        for (ResponseCode responseCode : ResponseCode.values()) {
            if (responseCode.getCode() == code) {
                return responseCode;
            }
        }
        throw new OidcException("invalid response code");
    }

}
