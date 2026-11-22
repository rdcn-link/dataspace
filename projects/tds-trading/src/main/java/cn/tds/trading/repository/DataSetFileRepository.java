package cn.tds.trading.repository;

import cn.tds.common.domain.DataSet;
import cn.tds.common.domain.DataSetFile;
import org.springframework.data.mongodb.repository.MongoRepository;

/**
 * DataSetFileRepository Description
 *
 * @author 李国都
 * @version 1.0.0
 * <b>Creation Time:</b> 2026/6/15 17:48
 */
public interface DataSetFileRepository extends MongoRepository<DataSetFile, String> {


}
