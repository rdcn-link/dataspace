package cn.scichain.oidc.domain;

import lombok.Data;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;
import org.springframework.security.core.GrantedAuthority;

import java.time.Instant;
import java.util.Set;

/**
 * OidcUser Description
 *
 * @author 郭志斌
 * @version oidc-server 1.0.0
 * <b> Creation Time:</b> 2025/5/13 14:26
 */
@Data
@Document(collection = "oidc-user")
public class OidcUser {

    /**
     * 用户id
     */
    @Id
    private String id;

    /**
     * 密码
     */
    private String password;

    /**
     * 用户名 - 邮箱
     */
    private String username;

    /**
     * OpenId
     */
    private String openId;

    /**
     * 用户权限
     */
    private Set<String> authorities;

    /**
     * 账号是否启用
     */
    private boolean enabled;

    /**
     * 用户注册时间
     */
    private Instant userIssuedAt;

    /**
     * 用户来源 - 系统名称
     */
    private String source;

    // 可信数据空间扩展信息

    /**
     * 用户类型 user:用户 org:组织机构 - 枚举
     */
    private String type;

    /**
     *  姓名/组织机构名称
     */
    private String name;

    /**
     *  用户/组织机构唯一标识 DID
     */
    private String uid;

    /**
     *  证件类型/组织类型
     */
    private String certType;

    /**
     *  证件号码/组织机构代码
     */
    private String certNo;

    /**
     *  组织机构联系人
     */
    private String contacts;

    /**
     *  手机号
     */
    private String phone;

    /**
     *  DID 秘钥算法，默认为 SM2
     */
    private String algorithm;

    /**
     *  公钥
     */
    private String publicKey;

    /**
     *  私钥
     */
    private String privateKey;

    /**
     *  状态
     */
    private int status;


}
