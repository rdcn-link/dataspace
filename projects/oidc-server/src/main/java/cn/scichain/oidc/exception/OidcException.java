package cn.scichain.oidc.exception;

/**
 * OidcException Description
 *
 * @author 郭志斌
 * @version oidc-server 1.0.0
 * <b> Creation Time:</b> 2025/5/13 9:54
 */
public class OidcException extends RuntimeException{

    /**
     * 构造函数
     * @param message 异常信息
     */
    public OidcException(String message){
        super(message);
    }

    /**
     * 构造函数
     * @param message 错误信息
     * @param cause 错误原因
     */
    public OidcException(String message, Throwable cause){
        super(message, cause);
    }

    /**
     * 构造函数
     * @param cause 错误原因
     */
    public OidcException(Throwable cause){
        super(cause);
    }
}
