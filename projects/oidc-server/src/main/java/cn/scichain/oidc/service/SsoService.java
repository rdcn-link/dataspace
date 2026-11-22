package cn.scichain.oidc.service;

import cn.opendatachain.common.core.OdcResponse;
import cn.opendatachain.common.core.OdcResponseBuilder;
import cn.scichain.oidc.domain.ResponseCode;
import cn.scichain.oidc.domain.WebResponse;
import cn.scichain.oidc.exception.OidcException;
import cn.scichain.oidc.util.WebResponseBuilder;
import cn.tds.common.domain.OidcUser;
import cn.scichain.oidc.repository.UserRepository;
import com.nimbusds.jose.JOSEException;
import com.nimbusds.jose.JWSAlgorithm;
import com.nimbusds.jose.JWSHeader;
import com.nimbusds.jose.JWSSigner;
import com.nimbusds.jose.JWSVerifier;
import com.nimbusds.jose.crypto.MACSigner;
import com.nimbusds.jose.crypto.MACVerifier;
import com.nimbusds.jwt.JWTClaimsSet;
import com.nimbusds.jwt.SignedJWT;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.text.ParseException;
import java.util.Date;
import java.util.HashMap;
import java.util.Map;

/**
 * SsoService 单点登录服务，将 uid 包装为 JWT Token
 * <p>
 * 签发的 JWT 使用 HS256（HMAC-SHA256）对称签名，网关使用相同的密钥进行无状态校验，
 * 校验通过后取出 uid 放入请求头透传给下游服务。
 * <p>
 * 本服务不做账号密码认证，仅由前端在用户身份确认后调用，换取用于跳转的 SSO Token。
 *
 * @author oidc-server
 * @version oidc-server 0.4.0
 */
@Slf4j
@Service
public class SsoService {

    private final UserRepository userRepository;

    @Value("${sso.jwt.secret}")
    private String jwtSecret;

    @Value("${sso.jwt.expiration:86400}")
    private long jwtExpiration;

    public SsoService(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    /**
     * 根据 uid 签发 SSO JWT Token
     *
     * @param uid 用户唯一标识
     * @return WebResponse，data 中携带 accessToken、tokenType、expiresIn、uid
     */
    public OdcResponse generateTokenByUid(String uid) {
        if (uid == null || uid.isBlank()) {
            throw new OidcException("uid 不能为空");
        }

        OidcUser oidcUser = userRepository.findByUid(uid);
        if (oidcUser == null) {
            return OdcResponseBuilder.buildFailure("用户不存在");
        }

        String accessToken = generateToken(oidcUser);

        Map<String, Object> result = new HashMap<>();
        result.put("accessToken", accessToken);
        result.put("tokenType", "Bearer");
        result.put("expiresIn", jwtExpiration);
        result.put("uid", oidcUser.getUid());

        return OdcResponseBuilder.buildSuccess(result);
    }

    /**
     * 生成 HS256 签名的 JWT，Claims 中携带 uid
     */
    private String generateToken(OidcUser oidcUser) {
        try {
            JWSSigner signer = new MACSigner(jwtSecret);

            JWTClaimsSet claimsSet = new JWTClaimsSet.Builder()
                    .subject(oidcUser.getUid())
                    .claim("uid", oidcUser.getUid())
                    .issueTime(new Date())
                    .expirationTime(new Date(System.currentTimeMillis() + jwtExpiration * 1000))
                    .build();

            SignedJWT signedJWT = new SignedJWT(new JWSHeader(JWSAlgorithm.HS256), claimsSet);
            signedJWT.sign(signer);

            return signedJWT.serialize();
        } catch (JOSEException e) {
            log.error("SSO JWT signing failed", e);
            throw new OidcException("SSO JWT signing failed", e);
        }
    }


    //根据uid获取用户信息
    public OidcUser getUsernameAndNameByUid(String uid) {
        if (uid == null || uid.isBlank()) {
            throw new OidcException("uid 不能为空");
        }
        OidcUser oidcUser = userRepository.findByUid(uid);
        if (oidcUser == null) {
            throw new OidcException("用户不存在");
        }
        return oidcUser;
    }

    /**
     * 从 Authorization 头中提取 JWT Token
     * <p>
     * 兼容两种格式：
     * <ul>
     *   <li>{@code Bearer xxx}（标准格式，Bearer 后有空格）→ 取空格后的部分</li>
     *   <li>{@code xxx}（直接传 token）→ 取整个值</li>
     * </ul>
     *
     * @param authorization Authorization 头值
     * @return JWT 字符串，为空时返回 null
     */
    public String extractToken(String authorization) {
        if (authorization == null || authorization.isBlank()) {
            return null;
        }
        String prefix = "Bearer ";
        if (authorization.startsWith(prefix)) {
            return authorization.substring(prefix.length());
        }
        return authorization;
    }

    /**
     * 校验 JWT Token 并返回 uid
     * <p>
     * 使用 sso.jwt.secret 校验 HS256 签名，校验过期时间，成功后提取 uid。
     *
     * @param token JWT 字符串
     * @return uid，校验失败返回 null
     */
    public String parseToken(String token) {
        if (token == null || token.isBlank()) {
            return null;
        }
        try {
            SignedJWT signedJWT = SignedJWT.parse(token);

            // 校验签名
            JWSVerifier verifier = new MACVerifier(jwtSecret);
            if (!signedJWT.verify(verifier)) {
                log.warn("SSO Token 签名校验失败");
                return null;
            }

            JWTClaimsSet claims = signedJWT.getJWTClaimsSet();

            // 校验过期时间
            Date expiration = claims.getExpirationTime();
            if (expiration != null && expiration.before(new Date())) {
                log.warn("SSO Token 已过期, exp={}", expiration);
                return null;
            }

            // 优先取 uid claim，没有则取 sub
            String uid = claims.getStringClaim("uid");
            if (uid == null || uid.isBlank()) {
                uid = claims.getSubject();
            }
            return uid;
        } catch (ParseException | JOSEException e) {
            log.error("SSO Token 解析失败", e);
            return null;
        }
    }





}
