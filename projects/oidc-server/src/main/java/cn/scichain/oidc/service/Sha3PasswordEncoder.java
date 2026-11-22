package cn.scichain.oidc.service;

import org.apache.commons.codec.digest.DigestUtils;
import org.springframework.security.crypto.password.PasswordEncoder;


/**
 * Sha3PasswordEncoder Description
 *
 * @author 郭志斌
 * @version oidc-server 1.0.0
 * <b> Creation Time:</b> 2025/11/3 16:28
 */
public class Sha3PasswordEncoder implements PasswordEncoder {
    @Override
    public String encode(CharSequence rawPassword) {
        return DigestUtils.sha3_256Hex(rawPassword.toString());
    }

    @Override
    public boolean matches(CharSequence rawPassword, String encodedPassword) {
        return encodedPassword.equals(DigestUtils.sha3_256Hex(rawPassword.toString()));
    }

    public String builder(String username,String password,String type){
        return username + "." + password + "." + type;
    }
}
