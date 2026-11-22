package cn.tds.trading.repository;

import cn.tds.common.domain.TdsFavorite;
import org.springframework.data.mongodb.repository.MongoRepository;

import java.util.List;
import java.util.Optional;

public interface TdsFavoriteRepository extends MongoRepository<TdsFavorite, String> {

    List<TdsFavorite> findByUidOrderByCreateAtDesc(String uid);

    Optional<TdsFavorite> findByUidAndCstr(String uid, String cstr);

    void deleteByUidAndCstr(String uid, String cstr);

    Long countBySource(String source);
}
