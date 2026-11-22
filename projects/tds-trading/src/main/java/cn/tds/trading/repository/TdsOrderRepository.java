package cn.tds.trading.repository;

import cn.tds.common.domain.TdsOrder;
import org.springframework.data.mongodb.repository.MongoRepository;

/**
 * TdsOrderRepository Description
 *
 * @author 李国都
 * @version 1.0.0
 * <b>Creation Time:</b> 2025/11/10 17:06
 */
public interface TdsOrderRepository extends MongoRepository<TdsOrder, String> {
    TdsOrder findByOid(String oid);

    long countDistinctBuyerUsernameBy();
}
