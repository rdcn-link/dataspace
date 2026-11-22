package cn.tds.trading.repository;

import cn.tds.common.domain.TdsOperation;
import org.springframework.data.mongodb.repository.MongoRepository;

/**
 * TdsOperationRepository Description
 *
 * @author 李国都
 * @version 1.0.0
 * <b>Creation Time:</b> 2025/12/22 15:16
 */
public interface TdsOperationRepository extends MongoRepository<TdsOperation, String> {
}
