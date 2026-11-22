package cn.tds.trading.repository;

import cn.tds.common.domain.OrderComplaint;
import org.springframework.data.mongodb.repository.MongoRepository;

/**
 * OrderComplaintRepository Description
 *
 * @author 李国都
 * @version 1.0.0
 * <b>Creation Time:</b> 2025/11/20 15:47
 */
public interface OrderComplaintRepository extends MongoRepository<OrderComplaint, String> {
}
