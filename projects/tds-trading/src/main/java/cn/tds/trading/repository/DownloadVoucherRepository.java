package cn.tds.trading.repository;

import cn.tds.common.domain.DownloadVoucher;
import org.springframework.data.mongodb.repository.MongoRepository;

import java.util.List;

/**
 * DownloadVoucherRepository Description
 *
 * @author 李国都
 * @version 1.0.0
 * <b>Creation Time:</b> 2026/5/8 17:12
 */
public interface DownloadVoucherRepository extends MongoRepository<DownloadVoucher, String> {

    DownloadVoucher findByCode(String code);

    DownloadVoucher findByOid(String oid);

    List<DownloadVoucher> findByBuyerUid(String buyerUid);

    List<DownloadVoucher> findBySellerUid(String sellerUid);

    List<DownloadVoucher> findByCstr(String cstr);
}
