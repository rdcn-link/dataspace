package cn.tds.trading.repository;

import cn.tds.common.domain.AnalysisToolStatistics;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.mongodb.repository.MongoRepository;

import java.util.Date;
import java.util.List;
import java.util.Optional;

/**
 * AnalysisToolStatisticsRepository Description
 *
 * @author 李国都
 * @version 1.0.0
 * <b>Creation Time:</b> 2026/7/9 14:24
 */
public interface AnalysisToolStatisticsRepository extends MongoRepository<AnalysisToolStatistics, String> {

    boolean existsByUserIdAndToolIdAndSource(String userId, String toolId, String source);


    Long countBySource(String source);

    //根据根据来源以及根据创建时间倒序查询
    Optional<AnalysisToolStatistics> findFirstBySourceOrderByCreateAtDesc(String source);

    List<AnalysisToolStatistics> findAnalysisToolStatisticsBySourceAndCreateAtBetweenOrderByCreateAtDesc(String source, Date startTime, Date endTime);

    Page<AnalysisToolStatistics> findBySourceAndCreateAtBetweenOrderByCreateAtDesc(String source, Date startTime, Date endTime, Pageable pageable);
}