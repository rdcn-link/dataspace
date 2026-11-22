package cn.scichain.oidc.domain;

import lombok.Getter;
import lombok.Setter;
import lombok.ToString;
import org.springframework.security.oauth2.core.AuthorizationGrantType;

/**
 * OAuthRequest OAUth 2 请求信息，密码模式实现，用于 Faird 认证
 *
 * @author 郭志斌
 * @version oidc-server 1.0.0
 * <b> Creation Time:</b> 2025/5/13 10:10
 */
@Getter
@Setter
@ToString
public class OAuthRequest {

    /**
     * 用户名
     */
    private  String username;

    /**
     * 密码
     */
    private  String password;

    /**
     * 授权模式 与 Faird 交互，只支持 password 模式
     */
    private  String grantType;


}
