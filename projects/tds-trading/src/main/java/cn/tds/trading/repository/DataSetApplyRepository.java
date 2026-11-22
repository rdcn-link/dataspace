package cn.tds.trading.repository;

import cn.tds.common.domain.DataSetApply;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.data.mongodb.repository.Query;

import java.util.Date;
import java.util.Optional;

/**
 * DataSetApplyRepository Description
 *
 * @author 李国都
 * @version 1.0.0
 * <b>Creation Time:</b> 2026/8/28 10:57
 */
public interface DataSetApplyRepository extends MongoRepository<DataSetApply, String> {

    Page<DataSetApply> findByUid(String uid, Pageable pageable);


    Page<DataSetApply> findByDataSetSourceUid(String uid, Pageable pageable);

    /**
     * 查询 uid 与 dataSetId 同时匹配，且 endTime 晚于指定时间的一条申请记录
     * （用于判断用户对某数据集是否仍在授权有效期内）
     */
    @Query("{ 'uid': ?0, 'dataSetId': ?1, 'endTime': { $gt: ?2 }, 'status': '1' }")
    Optional<DataSetApply> findValidApply(String uid, String dataSetId, Date now);

}
