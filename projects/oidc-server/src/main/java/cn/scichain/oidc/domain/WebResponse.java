package cn.scichain.oidc.domain;

import lombok.Getter;
import lombok.Setter;
import lombok.ToString;

/**
 * WebResponse 网络请求响应信息
 *
 * @author 郭志斌
 * @version oidc-server 1.0.0
 * <b> Creation Time:</b> 2025/5/13 9:21
 */
@Getter
@Setter
@ToString
public class WebResponse {

    public WebResponse(){

    }

    public WebResponse(int code, Object data, String message, long timestamp) {
        this.code = code;
        this.data = data;
        this.message = message;
        this.timestamp = timestamp;
    }

    /**
     * 响应状态码
     */
    private int code;

    /**
     * 响应数据
     */
    private Object data;

    /**
     * 响应信息
     */
    private String message;

    /**
     * 响应时间
     */
    private long timestamp;
}
