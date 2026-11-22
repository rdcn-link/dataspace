package cn.tds.trading.service;

import cn.tds.common.domain.TdsOperation;
import cn.tds.trading.repository.TdsOperationRepository;
import lombok.AllArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.Instant;

/**
 * TdsOperationService Description
 *
 * @author 李国都
 * @version 1.0.0
 * <b>Creation Time:</b> 2025/12/22 15:18
 */
@Service
@AllArgsConstructor
public class TdsOperationService {

    private final TdsOperationRepository tdsOperationRepository;


    public void save(String uid, String oid, String sellerUsername, String title, String type, String pid, String opt, int status, String description) {
        tdsOperationRepository.save(new TdsOperation(null, Instant.now(), uid, oid, sellerUsername,title, type, pid, opt, status, description));

    }
}
