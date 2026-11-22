package cn.scichain.oidc.domain;

import lombok.Data;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;
import org.springframework.security.oauth2.core.AuthorizationGrantType;
import org.springframework.security.oauth2.core.ClientAuthenticationMethod;
import org.springframework.security.oauth2.server.authorization.settings.ClientSettings;
import org.springframework.security.oauth2.server.authorization.settings.TokenSettings;

import java.time.Instant;
import java.util.Set;

/**
 * OidcClient Description
 *
 * @author 郭志斌
 * @version oidc-server 1.0.0
 * <b> Creation Time:</b> 2025/5/13 14:26
 */
@Data
@Document(collection = "oidc-client")
public class OidcClient {

    @Id
    private String id;

    /**
     * 客户端id
     */
    private String clientId;

    /**
     * 用户id
     */
    private String uid;

    /**
     * client 签发时间
     */
    private Instant clientIdIssuedAt;

    /**
     * 客户端密钥
     */
    private String clientSecret;

    /**
     * client 秘钥过期时间 null则无过期
     */
    private Instant clientSecretExpiresAt;

    /**
     * 客户端名称
     */
    private String clientName;

    /**
     * 客户端认证方式,多个由逗号分隔 client_secret_basic,client_secret_post
     */
    private Set<ClientAuthenticationMethod> clientAuthenticationMethods;

    /**
     * OAuth 2.1 授权支持的方式，多个由逗号分隔 authorization_code,refresh_token
     */
    private Set<AuthorizationGrantType> authorizationGrantTypes;

    /**
     * OAuth2 认证后回调uri， 一般传递code, 多个由逗号分隔
     */
    private Set<String> redirectUris;

    /**
     * OAuth2 退出时 post 的客户端重定向 uri，可选
     */
    private Set<String> postLogoutRedirectUris;

    /**
     * OIDC scope 值, 多个由逗号分隔 openid,profile,email
     */
    private Set<String> scopes;

    /**
     * 客户端的各类设置
     *
     * @see org.springframework.security.oauth2.server.authorization.settings.ClientSettings
     */
    private ClientSettings clientSettings;

    /**
     * Token的各类设置
     *
     * @see org.springframework.security.oauth2.server.authorization.settings.TokenSettings
     */
    private TokenSettings tokenSettings;

    /**
     * 状态
     */
    private int status;
}
