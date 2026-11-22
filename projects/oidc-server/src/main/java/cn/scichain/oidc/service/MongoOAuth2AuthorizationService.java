package cn.scichain.oidc.service;

import cn.scichain.oidc.domain.OidcAuthorization;
import cn.scichain.oidc.repository.AuthorizationRepository;
import org.springframework.security.oauth2.server.authorization.OAuth2Authorization;
import org.springframework.security.oauth2.server.authorization.OAuth2AuthorizationService;
import org.springframework.security.oauth2.server.authorization.OAuth2TokenType;
import org.springframework.stereotype.Service;

/**
 * MongoOAuth2AuthorizationService Description
 *
 * @author 郭志斌
 * @version oidc-server 1.0.0
 * <b> Creation Time:</b> 2025/4/22 16:07
 */
@Service
public class MongoOAuth2AuthorizationService implements OAuth2AuthorizationService {

    private final AuthorizationRepository authorizationRepository;

    public MongoOAuth2AuthorizationService(AuthorizationRepository authorizationRepository) {
        this.authorizationRepository = authorizationRepository;
    }

    @Override
    public void save(OAuth2Authorization authorization) {

    }

    @Override
    public void remove(OAuth2Authorization authorization) {

    }

    @Override
    public OAuth2Authorization findById(String id) {
        return null;
    }

    @Override
    public OAuth2Authorization findByToken(String token, OAuth2TokenType tokenType) {
        return null;
    }

    public OidcAuthorization findByToken(String token) {
        return authorizationRepository.findByToken(token);
    }

    public OidcAuthorization findByRegisteredClientIdAndPrincipalName(String registeredClientId, String principalName) {
        return authorizationRepository.findByRegisteredClientIdAndPrincipalName(registeredClientId, principalName);
    }

    public OidcAuthorization saveOidcAuthorization(OidcAuthorization authorization) {
        return authorizationRepository.save(authorization);
    }


}
