package cn.scichain.oidc.controller;

import cn.opendatachain.common.core.OdcResponse;
import cn.opendatachain.common.core.OdcResponseBuilder;
import cn.scichain.oidc.service.SsoService;
import cn.tds.common.domain.OidcUser;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.HashMap;
import java.util.Map;

/**
 * SsoController 单点登录控制器
 * <p>
 * 提供两个接口：
 * <ul>
 *   <li>{@code POST /sso/token} — 根据 uid 签发 SSO JWT Token（供项目A/前端调用）</li>
 *   <li>{@code POST /sso/uid} — 解析 Authorization 头中的 Token 并返回 uid（供项目B调用）</li>
 * </ul>
 * <p>
 * Token 的解析工作在本服务（oidc-server）完成，不依赖网关解析：
 * 项目B 携带 Token 请求网关 → 网关透传请求到 oidc-server → /sso/uid 解析 Authorization 头中的 Token → 返回 uid。
 * <p>
 * 网关的 SsoTokenFilter 解析功能保留但默认不启用（protected-paths 留空），
 * 如需网关层校验可重新配置 gateway.sso.protected-paths。
 *
 * @author oidc-server
 * @version oidc-server 0.4.0
 */
@Tag(name = "单点登录")
@RestController
@RequestMapping("/sso")
public class SsoController {

    private final SsoService ssoService;

    public SsoController(SsoService ssoService) {
        this.ssoService = ssoService;
    }

    /**
     * 根据 uid 签发 SSO JWT Token
     * <p>
     * 项目A/前端在用户身份确认后调用此接口换取 Token，用于跨系统跳转携带。
     *
     * @param uid 用户唯一标识
     * @return OdcResponse，data 中携带 accessToken、tokenType、expiresIn、uid
     */
    @Operation(summary = "根据uid签发SSO Token")
    @PostMapping("/token")
    public OdcResponse token(@RequestParam String uid) {
        return ssoService.generateTokenByUid(uid);
    }

    /**
     * 解析 Token 获取 uid 及用户信息
     * <p>
     * 供项目B 调用。从请求头 Authorization 中提取 Token，由 oidc-server 自行校验解析。
     * <p>
     * Token 格式兼容：
     * <ul>
     *   <li>{@code Authorization: Bearer xxx}（标准格式）</li>
     *   <li>{@code Authorization: xxx}（直接传 token）</li>
     * </ul>
     *
     * @param request HTTP 请求，用于读取 Authorization 头
     * @return OdcResponse，data 中携带 uid、username、name；Token 无效时返回失败
     */
    @Operation(summary = "解析Token获取uid及用户信息")
    @PostMapping("/uid")
    public OdcResponse uid(HttpServletRequest request) {
        // 从 Authorization 头提取 Token
        String token = ssoService.extractToken(request.getHeader("Authorization"));
        if (token == null || token.isBlank()) {
            return OdcResponseBuilder.buildFailure("Authorization 头缺少有效的 Token");
        }

        // 校验并解析 Token，获取 uid
        String uid = ssoService.parseToken(token);
        if (uid == null) {
            return OdcResponseBuilder.buildFailure("Token 无效或已过期");
        }

        // 根据 uid 查询用户信息
        OidcUser user = ssoService.getUsernameAndNameByUid(uid);

        Map<String, Object> result = new HashMap<>();
        result.put("uid", uid);
        result.put("username", user.getUsername());
        result.put("name", user.getName());
        return OdcResponseBuilder.buildSuccess(result);
    }
}
