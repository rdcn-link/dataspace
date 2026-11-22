package cn.scichain.oidc.util;

import javax.crypto.Cipher;
import javax.crypto.spec.IvParameterSpec;
import javax.crypto.spec.SecretKeySpec;
import java.nio.charset.StandardCharsets;
import java.util.Arrays;
import java.util.Base64;

/**
 * 微信消息加解密（安全模式）
 *
 * @author 李国都
 */
public class WeChatMsgCryptUtil {

    private static final int KEY_LENGTH = 32;

    /**
     * 解密微信安全模式下推送的加密消息
     *
     * @param encrypt        XML 中的 Encrypt 节点内容
     * @param encodingAesKey 微信公众平台配置的 EncodingAESKey（43位）
     * @param appId          公众号 AppID
     */
    public static String decryptMsg(String encrypt, String encodingAesKey, String appId) throws Exception {
        byte[] aesKey = Base64.getDecoder().decode(encodingAesKey + "=");
        byte[] encrypted = Base64.getDecoder().decode(encrypt);

        Cipher cipher = Cipher.getInstance("AES/CBC/NoPadding");
        cipher.init(Cipher.DECRYPT_MODE, new SecretKeySpec(aesKey, "AES"), new IvParameterSpec(aesKey, 0, 16));
        byte[] plain = cipher.doFinal(encrypted);

        int pad = plain[plain.length - 1] & 0xff;
        if (pad < 1 || pad > KEY_LENGTH) {
            pad = 0;
        }
        plain = Arrays.copyOfRange(plain, 0, plain.length - pad);

        int msgLen = ((plain[16] & 0xff) << 24)
                | ((plain[17] & 0xff) << 16)
                | ((plain[18] & 0xff) << 8)
                | (plain[19] & 0xff);

        String msg = new String(plain, 20, msgLen, StandardCharsets.UTF_8);
        String decryptAppId = new String(plain, 20 + msgLen, plain.length - 20 - msgLen, StandardCharsets.UTF_8);

        if (!appId.equals(decryptAppId)) {
            throw new IllegalStateException("解密后 appid 不匹配: " + decryptAppId);
        }
        return msg;
    }
}
