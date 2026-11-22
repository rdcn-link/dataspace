package cn.scichain.oidc.util;

import cn.scichain.oidc.Constants;
import cn.scichain.oidc.exception.OidcException;
import com.google.common.collect.Maps;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.oauth2.core.endpoint.OAuth2ParameterNames;

import java.nio.charset.Charset;
import java.nio.charset.StandardCharsets;
import java.util.Base64;
import java.util.Map;

/**
 * AuthorizationUtils 用于用户认证的工具类
 *
 * @author 郭志斌
 * @version oidc-server 1.0.0
 * <b> Creation Time:</b> 2025/5/13 10:49
 */
@Slf4j
public final class AuthorizationUtils {

    private AuthorizationUtils() {
    }

    /**
     * 默认字符字符集
     */
    public static final Charset DEFAULT_CHARSET = StandardCharsets.UTF_8;

    /**
     * 字节数组转换为字符串
     *
     * @param bytes 原字节数据
     * @return 转换后的字符串
     */
    public static String toString(byte[] bytes) {
        return null != bytes ? new String(bytes, DEFAULT_CHARSET) : "";
    }

    /**
     * 验证客户端信息,authorization: Basic Base64(clientId:secret)
     *
     * @param authorization 请求头信息
     * @return Map<String, String>
     */
    public static Map<String, String> basicParser(String authorization) {

        // authorization: Basic Base64(clientId:secret)
        if (!authorization.startsWith(Constants.AuthenticationType.HTTP_BASIC_PREFIX)) {
            throw new OidcException("http basic request header error");
        }

        log.info("basic string is : {}",authorization.substring(Constants.AuthenticationType.HTTP_BASIC_PREFIX.length()));

        String clientInfo = toString(Base64.getDecoder().decode(authorization.substring(Constants.AuthenticationType.HTTP_BASIC_PREFIX.length())));

        if (!clientInfo.contains(Constants.COLON)) {
            throw new OidcException("invalid request header : authorization");
        }

        String[] temp = clientInfo.split(Constants.COLON);
        Map<String, String> header = Maps.newHashMap();
        header.put(OAuth2ParameterNames.CLIENT_ID, temp[0]);
        header.put(OAuth2ParameterNames.CLIENT_SECRET, temp[1]);

        return header;
    }

    /**
     * 验证令牌信息,authorization: Bearer token
     * @param authorization
     * @return String
     */
    public static String bearerTokenParser(String authorization) {
        if (!authorization.startsWith(Constants.AuthenticationType.HTTP_BEARER_PREFIX)) {
            throw new OidcException("http bearer request header error");
        }
        return authorization.substring(Constants.AuthenticationType.HTTP_BEARER_PREFIX.length());
    }

}
