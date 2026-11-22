package cn.scichain.oidc.controller;

import cn.scichain.oidc.domain.*;
import cn.scichain.oidc.service.MongoClientService;
import cn.scichain.oidc.util.WebResponseBuilder;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

/**
 * OidcClientController Description
 *
 * @author 郭志斌
 * @version oidc-server 1.0.0
 * <b> Creation Time:</b> 2025/5/14 15:45
 */
@RestController
//@CrossOrigin
public class OidcClientController {

    private final MongoClientService mongoClientService;

    public OidcClientController(MongoClientService mongoClientService) {
        this.mongoClientService = mongoClientService;
    }

    /**
     * 获取OidcClient信息
     *
     * @param clientId
     * @return WebResponse
     */
    @GetMapping("/client.info")
    public WebResponse getOidcClient(String clientId) {
        return WebResponseBuilder.build(ResponseCode.SUCCESS, mongoClientService.findByOidcClientId(clientId));
    }

    /**
     * 保存OidcClient信息
     *
     * @param oidcClient 注册客户端信息
     * @return WebResponse
     */
    @PostMapping("/client.save")
    public WebResponse saveClient(@RequestBody OidcClient oidcClient){
        return WebResponseBuilder.build(ResponseCode.SUCCESS, mongoClientService.saveOidcClient(oidcClient));
    }

    /**
     * 获取OidcClient列表
     *
     * @param page
     * @param pageSize
     * @return WebResponse
     */
    @GetMapping("/client.page")
    public WebResponse clientPage(@RequestParam(name = "page", defaultValue = "1") int page,
                                  @RequestParam(name = "pageSize", defaultValue = "10") int pageSize){
        return mongoClientService.clientPage(page, pageSize);
    }

    /**
     * 删除OidcClient
     *
     * @param id mongodb ObjectId
     * @return WebResponse
     */
    @DeleteMapping("/client.delete")
    public WebResponse deleteClient(String id){
        return mongoClientService.clientStatus(id, TdsStatus.DELETE);
    }

    /**
     * 审核OidcClient
     *
     * @param tdsAudit 审核对象
     * @return WebResponse
     */
    @PostMapping("/client.audit")
    public WebResponse auditClient(@RequestBody TdsAudit tdsAudit){
        return mongoClientService.clientStatus(tdsAudit.getId(), TdsStatus.getByCode(tdsAudit.getStatus()));
    }

    @PostMapping("/client.verify")
    public ResponseEntity<Integer> verifyClient(@RequestParam String id, @RequestParam String secret){
        return mongoClientService.verifyClient(id,secret);
    }
}
