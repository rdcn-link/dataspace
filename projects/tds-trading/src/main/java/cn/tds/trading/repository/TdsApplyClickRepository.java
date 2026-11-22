package cn.tds.trading.repository;

import cn.tds.common.domain.TdsApplyClick;
import cn.tds.common.domain.TdsApplyFile;
import org.springframework.data.mongodb.repository.MongoRepository;

/**
 * TdsApplyClickRepository Description
 *
 * @author 李国都
 * @version 1.0.0
 * <b>Creation Time:</b> 2026/5/29 13:41
 */
public interface TdsApplyClickRepository extends MongoRepository<TdsApplyClick, String> {
}
