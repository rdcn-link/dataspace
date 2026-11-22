package cn.scichain.oidc.domain;

import lombok.Data;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import java.util.Date;

/**
 * LoginTicket Description
 *
 * @author 李国都
 * @version 1.0.0
 * <b>Creation Time:</b> 2026/5/6 9:44
 */
@Data
@Document(collection = "login-ticket")
public class LoginTicket {

    @Id
    private String id;

    private String loginToken;      // 凭证ID（用于轮询查询）
    private String openId;        // 微信openId（扫码后获取）
    private Integer status;       // 0:未扫码,1:已扫码待确认,2:已确认,3:已过期
    private String token;         // JWT token（登录成功后生成）
    private Date createTime;
    private Date expireTime;      // 过期时间（通常5分钟）
    private Date confirmTime;     // 确认登录时间
}
