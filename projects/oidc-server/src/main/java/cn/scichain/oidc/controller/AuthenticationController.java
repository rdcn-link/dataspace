package cn.scichain.oidc.controller;

import cn.scichain.oidc.domain.OAuthRequest;
import cn.scichain.oidc.domain.ResponseCode;
import cn.scichain.oidc.domain.WebResponse;
import cn.scichain.oidc.service.PasswordAuthorizationService;
import cn.scichain.oidc.util.AuthorizationUtils;
import cn.scichain.oidc.util.WebResponseBuilder;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.security.oauth2.core.oidc.OidcScopes;
import org.springframework.web.bind.annotation.*;

/**
 * AuthenticationController 认证服务控制器，实现标准 OAuth 2.0 密码模式 及 OIDC 认证服务
 *
 * @author 郭志斌
 * @version oidc-server 1.0.0
 * <b> Creation Time:</b> 2025/5/13 9:13
 */
@Tag(name="CONET 用户认证开放接口")
//@CrossOrigin
@RestController
public class AuthenticationController {

    private final PasswordAuthorizationService passwordAuthorizationService;

    public AuthenticationController(PasswordAuthorizationService passwordAuthorizationService) {
        this.passwordAuthorizationService = passwordAuthorizationService;
    }

    /**
     * 认证服务
     *
     * @param authorization 请求头中的 Authorization
     * @param oAuthRequest  请求体中的参数
     * @return WebResponse
     */
    @Operation(summary = "用户认证服务接口")
    @PostMapping("/oauth/token")
    public WebResponse authenticate(@RequestHeader("Authorization") String authorization, @RequestBody OAuthRequest oAuthRequest) {
        return passwordAuthorizationService.authenticate(authorization, oAuthRequest);
    }

    /**
     * 获取用户信息
     *
     * @param authorization 请求头中的 Authorization
     * @return WebResponse
     */
    @Operation(summary = "获取用户信息服务接口")
    @GetMapping("/oauth/userinfo")
    public WebResponse userinfo(@RequestHeader("Authorization") String authorization) {
        return passwordAuthorizationService.userinfo(authorization);
    }

    /**
     * 测试接口 - 返回当时服务器时间戳
     * @return WebResponse
     */
    @GetMapping("/oauth/test")
    public WebResponse test(){
        return WebResponseBuilder.build(ResponseCode.SUCCESS,System.currentTimeMillis());
    }

}
