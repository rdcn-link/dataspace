package cn.scichain.oidc.service;

import org.springframework.security.oauth2.server.authorization.OAuth2AuthorizationConsent;
import org.springframework.security.oauth2.server.authorization.OAuth2AuthorizationConsentService;

/**
 * OIDCAuthorizationConsentService Description
 *
 * @author 郭志斌
 * @version oidc-server 1.0.0
 * <b> Creation Time:</b> 2025/4/22 15:42
 */
public class MongoAuthorizationConsentService implements OAuth2AuthorizationConsentService {
    @Override
    public void save(OAuth2AuthorizationConsent authorizationConsent) {

    }

    @Override
    public void remove(OAuth2AuthorizationConsent authorizationConsent) {

    }

    @Override
    public OAuth2AuthorizationConsent findById(String registeredClientId, String principalName) {
        return null;
    }
}
