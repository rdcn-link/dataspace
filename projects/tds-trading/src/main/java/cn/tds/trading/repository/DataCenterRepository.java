package cn.tds.trading.repository;

import cn.tds.common.domain.DataCenter;
import org.springframework.data.mongodb.repository.MongoRepository;

import java.util.List;

/**
 * DataCenterRepository Description
 *
 * @author 李国都
 * @version 1.0.0
 * <b>Creation Time:</b> 2025/12/11 15:52
 */
public interface DataCenterRepository extends MongoRepository<DataCenter, String> {
    DataCenter findByDataCenterName(String dataCenterName);

    DataCenter findFirstBySource(String source);

    List<DataCenter> findAllByOrderBySortDesc();

}
