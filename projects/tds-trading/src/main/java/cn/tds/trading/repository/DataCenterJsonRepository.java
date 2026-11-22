package cn.tds.trading.repository;

import cn.tds.common.domain.DataCenter;
import cn.tds.common.domain.DataCenterJson;
import org.springframework.data.mongodb.repository.MongoRepository;

import java.util.Optional;

/**
 * DataCenterJsonRepository Description
 *
 * @author 李国都
 * @version 1.0.0
 * <b>Creation Time:</b> 2026/8/27 15:30
 */
public interface DataCenterJsonRepository extends MongoRepository<DataCenterJson, String> {


    Optional<DataCenterJson> findByName(String name);

}
