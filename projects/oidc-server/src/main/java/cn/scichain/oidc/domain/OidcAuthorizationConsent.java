package cn.scichain.oidc.domain;

import lombok.Data;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;
import org.springframework.security.core.GrantedAuthority;

import java.util.Set;

/**
 * OidcAuthorizationConsent Description
 *
 * @author 郭志斌
 * @version oidc-server 1.0.0
 * <b> Creation Time:</b> 2025/5/16 14:30
 */
@Data
@Document(collection = "oidc-authorization-consent")
public class OidcAuthorizationConsent {

    @Id
    private String id;

    /**
     * clientId
     */
    private String registeredClientId;

    /**
     * principalName
     */
    private String principalName;

    /**
     * authorities 授权信息
     */
    private Set<GrantedAuthority> authorities;
}
