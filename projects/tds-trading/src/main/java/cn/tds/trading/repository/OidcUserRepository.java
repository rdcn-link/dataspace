package cn.tds.trading.repository;

import cn.tds.common.domain.OidcUser;
import org.springframework.data.mongodb.repository.MongoRepository;

import java.util.List;

/**
 * @Author: 李国都
 * @CreateTime: 2025-10-29  10:17
 * @Description: TODO
 * @Version: 1.0
 */
public interface OidcUserRepository extends MongoRepository<OidcUser, String> {
    OidcUser findByUsername(String username);

    OidcUser findByUid(String uid);


    OidcUser findByServiceOpenId(String openId);



}
