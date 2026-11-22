package cn.scichain.oidc;

/**
 * Constants
 *
 * @author 郭志斌
 * @version oidc-server 1.0.0
 * <b> Creation Time:</b> 2025/5/13 10:33
 */
public final class Constants {

    /**
     * 冒号 - 英文
     */
    public static final String COLON = ":";
    /**
     * 句号 - 英文
     */
    public static final String DOT = ".";

    /**
     * 授权类型
     */
    public static final class AuthorizationGrantType{

        /**
         * OAuth 2.0 密码授权
         * @see <a href="https://tools.ietf.org/html/rfc6749#section-4.3">Resource Owner Password Credentials Grant</a>
         * @see org.springframework.security.oauth2.core.AuthorizationGrantType 其他认证方式类型
         */
        public static final String PASSWORD = "password";
    }

    /**
     * 认证方式
     */
    public static final class AuthenticationType{

        /**
         * Basic 认证
         */
        public static final String HTTP_BASIC_PREFIX = "Basic ";

        /**
         * Bearer 认证
         */
        public static final String HTTP_BEARER_PREFIX = "Bearer ";


    }
}
