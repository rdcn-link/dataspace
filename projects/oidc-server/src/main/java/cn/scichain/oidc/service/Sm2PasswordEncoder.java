package cn.scichain.oidc.service;

/**
 * Sm2PasswordEncoder Description
 *
 * @author 郭志斌
 * @version oidc-server 1.0.0
 * <b> Creation Time:</b> 2025/11/3 16:27
 */
public class Sm2PasswordEncoder implements org.springframework.security.crypto.password.PasswordEncoder{
    @Override
    public String encode(CharSequence rawPassword) {
        return null;
    }

    @Override
    public boolean matches(CharSequence rawPassword, String encodedPassword) {
        return false;
    }
}
