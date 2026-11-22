package cn.scichain.oidc.repository;

import cn.tds.common.domain.OidcUser;
import org.springframework.data.mongodb.repository.MongoRepository;

/**
 * @Author: 李国都
 * @CreateTime: 2025-10-29  10:17
 * @Description: TODO
 * @Version: 1.0
 */
public interface UserRepository extends MongoRepository<OidcUser, String> {
    OidcUser findByUsername(String username);

    OidcUser findByServiceOpenId(String openId);
    OidcUser findByAppOpenId(String openId);

    OidcUser findByUid(String uid);
}
