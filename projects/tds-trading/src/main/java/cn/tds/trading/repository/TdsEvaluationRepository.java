package cn.tds.trading.repository;

import cn.tds.common.domain.TdsEvaluation;
import org.springframework.data.mongodb.repository.MongoRepository;

import java.util.List;

/**
 * TdsEvaluationRepository Description
 *
 * @author 李国都
 * @version 1.0.0
 * <b>Creation Time:</b> 2025/11/19 13:55
 */
public interface TdsEvaluationRepository extends MongoRepository<TdsEvaluation, String> {

    List<TdsEvaluation> findByCstrOrderByCreateAtDesc(String cstr);

    List<TdsEvaluation> findByUidOrderByCreateAtDesc(String uid);
}
