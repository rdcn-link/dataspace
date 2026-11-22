package cn.scichain.oidc.repository;

import cn.scichain.oidc.domain.LoginTicket;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.Date;
import java.util.List;
import java.util.Optional;

/**
 * LoginTicket Repository
 *
 * @author 李国都
 * @version 1.0.0
 * <b>Creation Time:</b> 2026/5/6 9:44
 */
@Repository
public interface LoginTicketRepository extends MongoRepository<LoginTicket, String> {

    /**
     * 根据ticketId查找凭证
     */
    LoginTicket findByLoginToken(String loginToken);

    /**
     * 根据状态查找凭证列表
     */
    List<LoginTicket> findByStatus(Integer status);

    /**
     * 查找已过期的凭证
     */
    List<LoginTicket> findByExpireTimeBefore(Date expireTime);

    /**
     * 根据openId查找凭证
     */
    List<LoginTicket> findByOpenId(String openId);

    /**
     * 根据ticketId和状态查找
     */
    Optional<LoginTicket> findByLoginTokenAndStatus(String loginToken, Integer status);
}
