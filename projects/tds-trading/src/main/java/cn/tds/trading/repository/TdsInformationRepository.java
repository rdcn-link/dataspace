package cn.tds.trading.repository;

import cn.tds.common.domain.TdsInformation;
import org.springframework.data.mongodb.repository.MongoRepository;

import java.util.List;

/**
 * TdsInformationRepository Description
 *
 * @author 李国都
 * @version 1.0.0
 * <b>Creation Time:</b> 2026/6/26 15:01
 */
public interface TdsInformationRepository extends MongoRepository<TdsInformation, String> {

    List<TdsInformation> findByCstr(String cstr);


    TdsInformation findFirstByIsSendOrderByUpdateAtAsc(String isSend);

}
