package cn.scichain.oidc.domain;

import lombok.Data;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;
import org.springframework.security.oauth2.core.AuthorizationGrantType;
import org.springframework.security.oauth2.core.OAuth2Token;
import org.springframework.security.oauth2.server.authorization.OAuth2Authorization;
import org.springframework.security.oauth2.server.authorization.token.OAuth2TokenGenerator;

import java.time.Instant;
import java.util.Map;
import java.util.Set;

/**
 * OidcAuthorization Description
 *
 * @author 郭志斌
 * @version oidc-server 1.0.0
 * <b> Creation Time:</b> 2025/5/14 16:59
 */
@Data
@Document(collection = "oidc-authorization")
public class OidcAuthorization {

    @Id
    private String id;

    /**
     * 存储的注册客户端id
     */
    private String registeredClientId;

    /**
     * 存储的认证用户名
     */
    private String principalName;

    /**
     * 存储的授权类型
     */
    private AuthorizationGrantType authorizationGrantType;

    /**
     * 存储的授权范围
     */
    private Set<String> authorizedScopes;

    /**
     * 存储的token
     */
    private String token;

    /**
     * 存储的token创建时间
     */
    private Instant tokenIssuedAt;

    /**
     * 存储的token过期时间
     */
    private Instant tokenExpiresAt;

    /**
     * 存储的刷新token
     */
    private String refreshToken;

    /**
     * 存储的刷新token创建时间
     */
    private Instant refreshTokenIssuedAt;


}
