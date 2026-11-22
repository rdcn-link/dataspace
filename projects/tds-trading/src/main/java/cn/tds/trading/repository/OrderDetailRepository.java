package cn.tds.trading.repository;

import cn.tds.common.domain.OrderDetail;
import org.springframework.data.mongodb.repository.MongoRepository;

/**
 * OrderDetailRepository Description
 *
 * @author 李国都
 * @version 1.0.0
 * <b>Creation Time:</b> 2025/11/18 15:13
 */
public interface OrderDetailRepository extends MongoRepository<OrderDetail, String> {
}
