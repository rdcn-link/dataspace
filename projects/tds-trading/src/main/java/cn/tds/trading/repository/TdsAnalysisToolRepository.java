package cn.tds.trading.repository;

import cn.tds.common.domain.AnalysisToolStatistics;
import cn.tds.common.domain.TdsAnalysisTool;
import org.springframework.data.mongodb.repository.MongoRepository;

/**
 * TdsAnalysisToolRepository Description
 *
 * @author 李国都
 * @version 1.0.0
 * <b>Creation Time:</b> 2026/8/3 15:27
 */
public interface TdsAnalysisToolRepository extends MongoRepository<TdsAnalysisTool, String> {



}
