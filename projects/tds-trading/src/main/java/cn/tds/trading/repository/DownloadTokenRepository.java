package cn.tds.trading.repository;

import cn.tds.common.domain.DownloadToken;
import org.springframework.data.mongodb.repository.MongoRepository;

import java.util.Optional;

/**
 * DownloadTokenRepository Description
 *
 * @author 李国都
 * @version 1.0.0
 * <b>Creation Time:</b> 2026/11/6
 */
public interface DownloadTokenRepository extends MongoRepository<DownloadToken, String> {

    Optional<DownloadToken> findByToken(String token);

    java.util.List<DownloadToken> findByUid(String uid);

    java.util.List<DownloadToken> findByDatasetOid(String datasetOid);

}
