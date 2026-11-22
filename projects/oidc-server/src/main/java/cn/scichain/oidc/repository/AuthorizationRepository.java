package cn.scichain.oidc.repository;

import cn.scichain.oidc.domain.OidcAuthorization;
import org.springframework.data.mongodb.repository.MongoRepository;

/**
 * AuthorizationRepository Description
 *
 * @author 郭志斌
 * @version oidc-server 1.0.0
 * <b> Creation Time:</b> 2025/5/15 9:47
 */
public interface AuthorizationRepository extends MongoRepository<OidcAuthorization, String> {

    OidcAuthorization findByToken(String token);

    OidcAuthorization findByRegisteredClientIdAndPrincipalName(String registeredClientId, String principalName);

}
