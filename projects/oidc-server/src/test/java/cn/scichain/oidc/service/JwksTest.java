package cn.scichain.oidc.service;

import com.nimbusds.jose.JOSEException;
import com.nimbusds.jose.JWSAlgorithm;
import com.nimbusds.jose.jwk.*;
import com.nimbusds.jose.jwk.gen.ECKeyGenerator;
import com.nimbusds.jose.jwk.gen.OctetKeyPairGenerator;
import org.junit.jupiter.api.Assertions;
import org.junit.jupiter.api.Test;

import java.util.Set;

/**
 * JwksTest Json Web Key Set JWK 是一种以 JSON 格式来存储密钥的方法，JWKS 是用一个 JSON 对象表示的一组 JWK
 *
 * @author 郭志斌
 * @version oidc-server 1.0.0
 * <b> Creation Time:</b> 2025/4/21 16:36
 */
public class JwksTest {

    /**
     * KEY-ID 唯一标识 项目标识-算法名称-秘钥标识
     */
    private static final String KEY_ID = "oidc-ecc-kid1";

    /**
     * ES256 基于椭圆曲线加密算法实现 (推荐采用 Ed25519 安全性更高的现代椭圆签名算法实现)
     */
    @Test
    void testJwkEC() throws JOSEException {
        Curve point = Curve.P_256;

        ECKeyGenerator ecKeyGenerator = new ECKeyGenerator(point);
        // 设置业务范围，范围越小越安全（签名、验签、加密、解密及设备秘钥）
        ecKeyGenerator.keyOperations(
                Set.of(KeyOperation.SIGN, KeyOperation.VERIFY, KeyOperation.DECRYPT, KeyOperation.ENCRYPT,KeyOperation.DERIVE_KEY)
        ).keyID(KEY_ID).algorithm(JWSAlgorithm.ES256);

        ECKey ecKey = ecKeyGenerator.generate();
        Assertions.assertNotNull(ecKey);

        String json = ecKey.toJSONString();
        Assertions.assertNotNull(ecKey);

        System.out.println(json);

    }
    /**
     * 推荐 Ed25519 安全性更高的现代椭圆签名算法实现
     */
    @Test
    void testJwkEd25519() throws JOSEException {

        OctetKeyPair octetKeyPair = new OctetKeyPairGenerator(Curve.Ed25519)
                .keyOperations(Set.of(KeyOperation.SIGN, KeyOperation.VERIFY))
                .keyID(KEY_ID)
                .algorithm(JWSAlgorithm.Ed25519)
                .generate();
        Assertions.assertNotNull(octetKeyPair);

        String publicKey = octetKeyPair.toPublicJWK().toJSONString();
        System.out.println(publicKey);

        System.out.println(octetKeyPair.toJSONString());
    }
}
