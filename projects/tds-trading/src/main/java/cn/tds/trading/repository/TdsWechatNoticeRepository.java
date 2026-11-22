package cn.tds.trading.repository;

import cn.tds.common.domain.TdsWechatNotice;
import org.springframework.data.mongodb.repository.MongoRepository;

import java.util.List;

/**
 * TdsWechatNoticeRepository Description
 *
 * @author 李国都
 * @version 1.0.0
 * <b>Creation Time:</b> 2026/5/11 10:09
 */
public interface TdsWechatNoticeRepository extends MongoRepository<TdsWechatNotice, String> {

    List<TdsWechatNotice> findByUidOrderByCreateAtDesc(String uid);
}
