package cn.tds.trading.repository;

import cn.tds.common.domain.AccessConnector;
import org.springframework.data.mongodb.repository.MongoRepository;

import java.util.List;

/**
 * @Author: 李国都
 * @CreateTime: 2025-10-30  16:08
 * @Description: TODO
 * @Version: 1.0
 */
public interface ConnectorRepository extends MongoRepository<AccessConnector, String> {

    AccessConnector findByCid(String cid);

    AccessConnector findByUid(String uid);

    List<AccessConnector> findAccessConnectorByTopic(String topic);

    //AccessConnector findFirstById(String id);
}
