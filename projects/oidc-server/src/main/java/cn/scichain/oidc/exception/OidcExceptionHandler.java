package cn.scichain.oidc.exception;

import cn.scichain.oidc.domain.ResponseCode;
import cn.scichain.oidc.domain.WebResponse;
import cn.scichain.oidc.util.WebResponseBuilder;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

/**
 * OidcExceptionHandler Description
 *
 * @author 郭志斌
 * @version oidc-server 1.0.0
 * <b> Creation Time:</b> 2025/5/15 11:07
 */
@RestControllerAdvice
public class OidcExceptionHandler {

    /**
     * 处理OidcException
     *
     * @param e
     * @return WebResponse
     */
    @ExceptionHandler(OidcException.class)
    public WebResponse handleException(Exception e) {
        return WebResponseBuilder.build(ResponseCode.FAILURE.getCode(),null,  e.getMessage());
    }

}
