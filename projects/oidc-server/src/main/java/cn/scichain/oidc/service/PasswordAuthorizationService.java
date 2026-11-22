package cn.scichain.oidc.service;

import cn.opendatachain.common.crypto.sm.SM2Utils;
import cn.scichain.oidc.Constants;
import cn.scichain.oidc.domain.*;
import cn.scichain.oidc.exception.OidcException;
import cn.scichain.oidc.util.AuthorizationUtils;
import cn.scichain.oidc.util.UUID5;
import cn.scichain.oidc.util.WebResponseBuilder;
import cn.tds.common.domain.OidcUser;
import com.google.common.collect.Maps;
import lombok.extern.slf4j.Slf4j;
import org.apache.commons.codec.digest.DigestUtils;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.oauth2.core.AuthorizationGrantType;
import org.springframework.security.oauth2.core.endpoint.OAuth2ParameterNames;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.Map;

/**
 * PasswordAuthorizationService OAuth2 密码模式授权服务
 *
 * @author 郭志斌
 * @version oidc-server 1.0.0
 * <b> Creation Time:</b> 2025/5/13 14:07
 */
@Slf4j
@Service
public class PasswordAuthorizationService {

    private final MongoClientService mongoClientService;

    private final MongoUserDetailsService mongoUserDetailsService;

    private final MongoOAuth2AuthorizationService mongoOAuth2AuthorizationService;

    private final PasswordEncoder passwordEncoder;

    private final SM2Utils sm2Utils;

    public PasswordAuthorizationService(MongoClientService mongoClientService, MongoUserDetailsService mongoUserDetailsService, MongoOAuth2AuthorizationService mongoOAuth2AuthorizationService, PasswordEncoder passwordEncoder, SM2Utils sm2Utils) {
        this.mongoClientService = mongoClientService;
        this.mongoUserDetailsService = mongoUserDetailsService;
        this.mongoOAuth2AuthorizationService = mongoOAuth2AuthorizationService;
        this.passwordEncoder = passwordEncoder;
        this.sm2Utils = sm2Utils;
    }

    /**
     * 密码模式授权
     *
     * @param authorization 请求头信息
     * @param oAuthRequest  请求参数
     * @return WebResponse
     */
    public WebResponse authenticate(String authorization, OAuthRequest oAuthRequest) {
        // 验证请求头信息
        if(null == authorization || authorization.isEmpty()){
            throw new OidcException("Request Header Authorization is null");
        }
        log.debug("Request Header Authorization: {}", authorization);
        // 验证请求参数
        if(null == oAuthRequest || null == oAuthRequest.getUsername() || null == oAuthRequest.getPassword() || null == oAuthRequest.getGrantType()){
            throw new OidcException("OAuth2 Request Body is null");
        }

        if(!Constants.AuthorizationGrantType.PASSWORD.equals(oAuthRequest.getGrantType())){
            throw new OidcException("invalid OAuth2 Grant Type");
        }

        log.debug("OAuth2 Request Body: {}", oAuthRequest);

        Map<String, String> map = AuthorizationUtils.basicParser(authorization);
        //验证客户端信息
        log.debug("client info is : {}",map);
        log.debug("client id is : {}",map.get(OAuth2ParameterNames.CLIENT_ID));
        OidcClient oidcClient = mongoClientService.findByOidcClientId(map.get(OAuth2ParameterNames.CLIENT_ID));
        log.debug("saved client is : {}",oidcClient);
        if(null == oidcClient){
            return WebResponseBuilder.build(ResponseCode.UNAUTHORIZED);
        }

        if(!map.get(OAuth2ParameterNames.CLIENT_SECRET).equals(oidcClient.getClientSecret())){
            throw new OidcException("invalid Client");
        }

        //验证用户信息
        cn.tds.common.domain.OidcUser oidcUser = mongoUserDetailsService.findUserByUsername(oAuthRequest.getUsername());
        log.debug("user info is : {}",oidcUser);
        if(null == oidcUser || oidcUser.getStatus() != TdsStatus.APPROVE.getCode()){
            return  WebResponseBuilder.build(ResponseCode.UNAUTHORIZED);
        }

//        log.debug("save pwd is : {}",oidcUser.getPassword());
//        log.debug("request user info is : {}",oAuthRequest.getUsername() + Constants.COLON + oidcUser.getPassword());
//        log.debug("check pwd is : {}",DigestUtils.sha3_256Hex(oAuthRequest.getUsername() + Constants.COLON + oAuthRequest.getPassword()));
//        if (!oidcUser.getPassword().equals(DigestUtils.sha3_256Hex(oAuthRequest.getUsername() + Constants.COLON + oAuthRequest.getPassword()))) {
//            return  WebResponseBuilder.build(ResponseCode.UNAUTHORIZED);
//        }

        //TODO 更新数据库密码加密方式
        if(!oAuthRequest.getPassword().equals(sm2Utils.decryptToString(oidcUser.getPassword(),oidcUser.getPrivateKey()))){
            return  WebResponseBuilder.build(ResponseCode.UNAUTHORIZED);
        }

        //生成 Token 信息并保存返回
        OidcAuthorization oidcAuthorization = mongoOAuth2AuthorizationService.findByRegisteredClientIdAndPrincipalName(oidcClient.getClientId(), oidcUser.getUsername());

        if(null == oidcAuthorization){
            oidcAuthorization = buildToken(oidcClient, oidcUser);
            // 保存认证信息
            mongoOAuth2AuthorizationService.saveOidcAuthorization(oidcAuthorization);
        }

        log.debug("oidcAuthorization info is : {}",oidcAuthorization);

        return WebResponseBuilder.build(ResponseCode.SUCCESS,oidcAuthorization.getToken());
    }

    /**
     * 获取用户信息
     *
     * @param authorization 请求头信息
     * @return WebResponse
     */
    public WebResponse userinfo(String authorization) {
        // 验证请求头信息
        if(null == authorization || authorization.isEmpty()){
            throw new OidcException("Request Header Authorization is null");
        }
        log.debug("Request Header Authorization: {}", authorization);

        String token = AuthorizationUtils.bearerTokenParser(authorization);
        log.debug("token is : {}",token);
        OidcAuthorization oidcAuthorization = mongoOAuth2AuthorizationService.findByToken(token);
        log.debug("OidcAuthorization info is : {}",oidcAuthorization);
        if(null == oidcAuthorization){
            return  WebResponseBuilder.build(ResponseCode.UNAUTHORIZED);
        }

        //获取用户扩展信息
        OidcUser oidcUser = mongoUserDetailsService.findUserByUsername(oidcAuthorization.getPrincipalName());
        log.debug("user info is : {}",oidcUser);

        Map<String, Object> userInfo = Maps.newHashMap();
        userInfo.put("username",oidcUser.getUsername());
        userInfo.put("name",oidcUser.getName());
        userInfo.put("role",oidcUser.getAuthorities());
        userInfo.put("type",oidcUser.getType());
        userInfo.put("uid",oidcUser.getUid());

        return WebResponseBuilder.build(ResponseCode.SUCCESS,userInfo);

    }

    /**
     * 构建用户认证信息
     * @param oidcClient 注册客户端信息
     * @param oidcUser 用户认证信息
     * @return OidcAuthorization
     */
    private OidcAuthorization buildToken(OidcClient oidcClient, cn.tds.common.domain.OidcUser oidcUser){
        OidcAuthorization oidcAuthorization = new OidcAuthorization();

        oidcAuthorization.setRegisteredClientId(oidcClient.getClientId());
        oidcAuthorization.setPrincipalName(oidcUser.getUsername());
        oidcAuthorization.setAuthorizationGrantType(AuthorizationGrantType.PASSWORD);
        oidcAuthorization.setAuthorizedScopes(oidcClient.getScopes());

        oidcAuthorization.setToken(UUID5.fromString(oidcClient.getClientId() + Constants.DOT +oidcUser.getUsername()).toString());
        oidcAuthorization.setTokenIssuedAt(Instant.now());
        oidcAuthorization.setTokenExpiresAt(null);

        oidcAuthorization.setRefreshToken(DigestUtils.sha3_256Hex(oidcAuthorization.getToken()));
        oidcAuthorization.setRefreshTokenIssuedAt(Instant.now());

        return oidcAuthorization;
    }

}
