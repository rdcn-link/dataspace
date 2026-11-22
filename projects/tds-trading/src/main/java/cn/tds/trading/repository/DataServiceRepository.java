package cn.tds.trading.repository;

import cn.tds.common.domain.DataService;
import org.springframework.data.mongodb.repository.MongoRepository;

/**
 * DataServiceRepository Description
 *
 * @author 李国都
 * @version 1.0.0
 * <b>Creation Time:</b> 2025/11/20 15:00
 */
public interface DataServiceRepository extends MongoRepository<DataService, String> {
    DataService findBySid(String cstr);
}
