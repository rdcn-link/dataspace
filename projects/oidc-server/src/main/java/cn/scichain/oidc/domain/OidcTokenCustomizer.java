package cn.scichain.oidc.domain;

import org.springframework.security.oauth2.server.authorization.token.JwtEncodingContext;
import org.springframework.security.oauth2.server.authorization.token.OAuth2TokenCustomizer;

/**
 * ClaimsOIDCTokenCustomizer 扩展 OAuth2TokenCustomizer JWT ID_TOKEN 中携带信息
 *
 * @author 郭志斌
 * @version oidc-server 1.0.0
 * <b> Creation Time:</b> 2025/4/22 11:06
 */
public class OidcTokenCustomizer implements OAuth2TokenCustomizer<JwtEncodingContext> {
    @Override
    public void customize(JwtEncodingContext context) {

    }
}
