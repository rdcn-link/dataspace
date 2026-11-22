package cn.scichain.oidc.service;

import cn.opendatachain.common.util.CodecUtils;
import cn.opendatachain.common.util.OdcUtils;
import cn.scichain.oidc.util.UUID5;
import com.google.common.hash.Hashing;
import org.junit.jupiter.api.Test;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.crypto.scrypt.SCryptPasswordEncoder;

import java.util.Base64;

/**
 * PwdTest Description
 *
 * @author 郭志斌
 * @version oidc-server 1.0.0
 * <b> Creation Time:</b> 2025/5/13 15:42
 */
public class PwdTest {

    @Test
    void test() {
        BCryptPasswordEncoder bCryptPasswordEncoder = new BCryptPasswordEncoder();

        //SCryptPasswordEncoder sCryptPasswordEncoder = new SCryptPasswordEncoder();

        String pwd = bCryptPasswordEncoder.encode("user1@cnic.cn");

        System.out.println(pwd);
    }


    @Test
    void test0() {
        String encodePwd = "$2a$10$sUkrFTXGNeOqpN9B0wYRS.5YbqIo.U7cLUUbL9m0bFjDoRuwahCOi";
        BCryptPasswordEncoder bCryptPasswordEncoder = new BCryptPasswordEncoder();

        String encode = bCryptPasswordEncoder.encode("admin#U*Q!.");
        System.out.println(encode);

        boolean flag = bCryptPasswordEncoder.matches("admin#U*Q!.", encodePwd);
        System.out.println(flag);
    }

    @Test
    void test1() {

        String basic = "Basic " + Base64.getUrlEncoder().encodeToString("tds-trading:7c534f4d40d55236b553c642f0117521".getBytes());

        System.out.println(basic);

        System.out.println(OdcUtils.toString(CodecUtils.decodeBase64("dGRzLXRyYWRpbmc6N2M1MzRmNGQ0MGQ1NTIzNmI1NTNjNjQyZjAxMTc1MjE=")));

        // 用户认证
        //Basic ZmFpcmQtY2xpZW50MTp0Y3FpNTRjbnAzY2V3ajk0bmQ5dW9wMnE=

        // 获取用户信息
        //Bearer cc1126b4-497f-56a7-ab52-5ee9c366ce17
    }
    @Test
    void test2(){
        String s1 = UUID5.fromString("client1.user1").toString();
        System.out.println(s1);

        //9a79274c-9574-5d04-9c79-cb8ea44cb0d6
    }

    @Test
    void test3(){
        var hash = Hashing.murmur3_128().hashString("faird-client", java.nio.charset.StandardCharsets.UTF_8).toString();
        System.out.println(hash);
    }

    @Test
    void test4(){
        String cstr = "CSTR:16666.11.nbsdc.EJiyYIlh";

        System.out.println(cstr.substring(5));
    }

    @Test
    void test5(){
        String size = "43.08GB";

        String s = size.substring(0,size.length() -2);

        String type = size.substring(size.length() -2);

        System.out.println(s);
        System.out.println(type);
    }

    @Test
    void test6(){
        String user = "gscloud@tds.cn";
        String pwd = Hashing.crc32c().hashUnencodedChars(user).toString();
        System.out.println(pwd);
    }

}
