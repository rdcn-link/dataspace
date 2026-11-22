package cn.tds.trading.repository;

import cn.tds.common.domain.TdsApplyFile;
import org.springframework.data.mongodb.repository.MongoRepository;

import java.util.List;

/**
 * TdsApplyFileRepository Description
 *
 * @author 李国都
 * @version 1.0.0
 * <b>Creation Time:</b> 2026/5/26 15:46
 */
public interface TdsApplyFileRepository extends MongoRepository<TdsApplyFile, String> {

    List<TdsApplyFile> findByFid(String fid);

    List<TdsApplyFile> findByFidAndType(String fid, String type);

    void deleteByFid(String fid);
}
