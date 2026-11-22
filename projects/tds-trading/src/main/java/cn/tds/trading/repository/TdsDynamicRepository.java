package cn.tds.trading.repository;

import cn.tds.common.domain.AccessConnector;
import cn.tds.common.domain.TdsDynamic;
import org.springframework.data.mongodb.repository.MongoRepository;

import java.util.List;

/**
 * TdsDynamicRepository Description
 *
 * @author 李国都
 * @version 1.0.0
 * <b>Creation Time:</b> 2026/1/6 9:46
 */

public interface TdsDynamicRepository extends MongoRepository<TdsDynamic, String> {

    /**
     * 根据创建时间倒序取前 10 条
     */
    List<TdsDynamic> findTop10ByOrderByUpdateAtDesc();
}
