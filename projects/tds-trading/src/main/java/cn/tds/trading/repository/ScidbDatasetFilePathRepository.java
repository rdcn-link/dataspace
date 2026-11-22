package cn.tds.trading.repository;

import cn.tds.common.domain.ScidbDatasetFilePath;
import org.springframework.data.mongodb.repository.MongoRepository;

/**
 * ScidbDatasetFilePath Repository
 *
 * @author 李国都
 * @version 1.0.0
 * <b>Creation Time:</b> 2026/9/11
 */
public interface ScidbDatasetFilePathRepository extends MongoRepository<ScidbDatasetFilePath, String> {

    ScidbDatasetFilePath findByDatasetId(String datasetId);
}
