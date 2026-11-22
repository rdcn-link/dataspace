package cn.tds.trading.repository;

import cn.tds.common.domain.DataSet;
import org.springframework.data.mongodb.repository.MongoRepository;

import java.util.List;

/**
 * @Author: 李国都
 * @CreateTime: 2025-10-30  10:03
 * @Description: TODO
 * @Version: 1.0
 */
public interface DataSetRepository extends MongoRepository<DataSet, String> {

    DataSet findByCstr(String cstr);

    DataSet findByCstrAndVersion(String cstr, String version);

    DataSet findTopByCstrOrderByVersionDesc(String cstr);

    Long countByShareMode(String dataValue);

    List<DataSet> findByUid(String uid);

    Long countBySource(String source);

    List<DataSet> findByCstrIn(List<String> cstrList);
}
