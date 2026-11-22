package cn.tds.trading.repository;

import cn.tds.common.domain.TdsAnalysisToolEvaluation;
import org.springframework.data.mongodb.repository.MongoRepository;

import java.util.List;

/**
 * TdsAnalysisToolEvaluationRepository Description
 *
 * @author 李国都
 * @version 1.0.0
 * <b>Creation Time:</b> 2026/8/3
 */
public interface TdsAnalysisToolEvaluationRepository extends MongoRepository<TdsAnalysisToolEvaluation, String> {

    List<TdsAnalysisToolEvaluation> findByToolId(String toolId);

}
