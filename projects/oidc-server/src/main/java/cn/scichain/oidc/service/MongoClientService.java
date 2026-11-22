package cn.scichain.oidc.service;

import cn.scichain.oidc.domain.OidcClient;
import cn.scichain.oidc.domain.ResponseCode;
import cn.scichain.oidc.domain.TdsStatus;
import cn.scichain.oidc.domain.WebResponse;
import cn.scichain.oidc.exception.OidcException;
import cn.scichain.oidc.repository.ClientRepository;
import cn.scichain.oidc.util.WebResponseBuilder;
import com.google.common.collect.Maps;
import com.google.common.collect.Sets;
import com.google.common.hash.Hashing;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.data.mongodb.core.query.Criteria;
import org.springframework.data.mongodb.core.query.Query;
import org.springframework.http.ResponseEntity;
import org.springframework.security.oauth2.core.AuthorizationGrantType;
import org.springframework.security.oauth2.core.ClientAuthenticationMethod;
import org.springframework.security.oauth2.core.oidc.OidcScopes;
import org.springframework.security.oauth2.server.authorization.client.RegisteredClient;
import org.springframework.security.oauth2.server.authorization.client.RegisteredClientRepository;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.List;
import java.util.Map;
import java.util.Optional;

/**
 * ClientService OIDC 客户端服务，实现 RegisteredClientRepository 接口
 *
 * @author 郭志斌
 * @version oidc-server 1.0.0
 * <b> Creation Time:</b> 2025/4/22 15:37
 */
@Service
public class MongoClientService implements RegisteredClientRepository {

    private final ClientRepository clientRepository;

    private final MongoTemplate mongoTemplate;

    public MongoClientService(ClientRepository clientRepository, MongoTemplate mongoTemplate) {
        this.clientRepository = clientRepository;
        this.mongoTemplate = mongoTemplate;
    }

    //TODO 对象转换 OidcClient - RegisteredClient

    @Override
    public void save(RegisteredClient registeredClient) {

    }

    @Override
    public RegisteredClient findById(String id) {
        return null;
    }

    @Override
    public RegisteredClient findByClientId(String clientId) {
        return null;
    }

    public OidcClient findByOidcClientId(String clientId) {
        return clientRepository.findByClientId(clientId);
    }

    public OidcClient saveOidcClient(OidcClient oidcClient) {

        // 查重复
        OidcClient client = clientRepository.findByClientId(oidcClient.getClientId());

        if(null !=  client){
            throw new OidcException("The client has been registered");
        }

        // 注册时自动生成密钥
        oidcClient.setClientSecret(Hashing.murmur3_128().hashString(oidcClient.getClientId(), java.nio.charset.StandardCharsets.UTF_8).toString());
        oidcClient.setClientIdIssuedAt(Instant.now());
        oidcClient.setClientSecretExpiresAt(null);
        oidcClient.setAuthorizationGrantTypes(Sets.newHashSet(AuthorizationGrantType.PASSWORD));
        oidcClient.setClientAuthenticationMethods(Sets.newHashSet(ClientAuthenticationMethod.CLIENT_SECRET_BASIC));
        oidcClient.setRedirectUris(null);
        oidcClient.setPostLogoutRedirectUris(null);
        oidcClient.setScopes(Sets.newHashSet(OidcScopes.OPENID, OidcScopes.EMAIL));
        oidcClient.setClientSettings(null);
        oidcClient.setTokenSettings(null);

        return clientRepository.save(oidcClient);
    }

    public WebResponse clientPage(int page, int pageSize) {
        Query query = new Query();
        query.addCriteria(Criteria.where("status").gt(TdsStatus.DELETE.getCode()));

        Pageable pageable = PageRequest.of(page - 1, pageSize);

        long count = mongoTemplate.count(query, OidcClient.class, "oidc-client");
        List<OidcClient> clientList =
                mongoTemplate.find(query.with(pageable), OidcClient.class, "oidc-client");

        Map<String, Object> map = Maps.newHashMap();
        map.put("total", count);
        map.put("page", page);
        map.put("pageSize", pageSize);
        map.put("rows", clientList);

        return WebResponseBuilder.build(ResponseCode.SUCCESS, map);
    }

    public WebResponse clientStatus(String id,TdsStatus  status) {
        Optional<OidcClient> byId = clientRepository.findById(id);

        if(byId.isPresent()) {
            OidcClient oidcClient = byId.get();
            oidcClient.setStatus(status.getCode());
            clientRepository.save(oidcClient);
        }

        return WebResponseBuilder.build(ResponseCode.SUCCESS);
    }

    public ResponseEntity<Integer> verifyClient(String id, String secret) {
        OidcClient byClientId = clientRepository.findByClientId(id);

        if(null != byClientId && byClientId.getClientSecret().equals(secret)) {
            return ResponseEntity.ok(200);
        }else {
            return ResponseEntity.ok(500);
        }

    }
}
