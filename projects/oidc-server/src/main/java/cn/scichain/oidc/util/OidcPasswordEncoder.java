package cn.scichain.oidc.util;

import org.springframework.security.crypto.password.PasswordEncoder;

/**
 * OidcPasswordEncoder Description
 *
 * @author 郭志斌
 * @version oidc-server 1.0.0
 * <b> Creation Time:</b> 2025/5/15 15:38
 */
public class OidcPasswordEncoder implements PasswordEncoder {
    @Override
    public String encode(CharSequence rawPassword) {
        return null;
    }

    @Override
    public boolean matches(CharSequence rawPassword, String encodedPassword) {
        return false;
    }
}
