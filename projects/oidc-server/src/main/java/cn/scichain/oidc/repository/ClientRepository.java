package cn.scichain.oidc.repository;

import cn.scichain.oidc.domain.OidcClient;
import org.springframework.data.mongodb.repository.MongoRepository;

/**
 * ClientRepository Description
 *
 * @author 郭志斌
 * @version oidc-server 1.0.0
 * <b> Creation Time:</b> 2025/4/22 11:38
 */
public interface ClientRepository extends MongoRepository<OidcClient, String> {

    OidcClient findByClientId(String clientId);

}
