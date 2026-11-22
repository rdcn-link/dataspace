package cn.tds.trading.repository;

import cn.tds.common.domain.Dictionary;
import org.springframework.data.mongodb.repository.MongoRepository;

/**
 * @Author: 李国都
 * @CreateTime: 2025-10-28  15:03
 * @Description: TODO
 * @Version: 1.0
 */
public interface DictRepository extends MongoRepository<Dictionary, String> {
    Dictionary findByCode(String code);

}
