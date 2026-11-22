package cn.scichain.oidc.controller;

import cn.opendatachain.common.core.OdcResponse;
import cn.opendatachain.common.core.OdcResponseBuilder;
import cn.scichain.oidc.domain.ResponseCode;
import cn.scichain.oidc.domain.WebResponse;
import cn.scichain.oidc.service.MongoUserDetailsService;
import cn.scichain.oidc.util.WebResponseBuilder;
import cn.tds.common.core.RequestUser;
import cn.tds.common.core.TdsProperties;
import cn.tds.common.core.TdsStatus;
import cn.tds.common.domain.OidcUser;
import cn.tds.common.domain.TdsRole;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.AllArgsConstructor;
import org.springframework.web.bind.annotation.*;

/**
 * DictController Description
 *
 * @author 李国都
 * @version 1.0.0
 * <b>Creation Time:</b> 2025/10/29 10:15
 */
@RestController
@AllArgsConstructor
@Tag(name = "用户")
@RequestMapping("/user")
//@CrossOrigin
public class OidcUserController {

    private final MongoUserDetailsService oidcUserDictService;

    /**
     * 保存用户信息
     * @param user
     * @return OdcResponse
     */
    @Operation(summary = "保存用户信息")
    @PostMapping("/user.save")
    public OdcResponse saveOidcUser(@RequestBody RequestUser user) {
        return oidcUserDictService.saveUser(user);
    }

    /**
     * 分页查询用户信息
     * @param page
     * @param pageSize
     * @return OdcResponse
     */
    @Operation(summary = "分页查询用户信息")
    @GetMapping("/user.page")
    public OdcResponse pageUser(@RequestParam(name = "page", defaultValue = "1") int page,
                                @RequestParam(name = "pageSize", defaultValue = "10") int pageSize,
                                @RequestParam(name = "name",required = false) String name){
        return oidcUserDictService.pageUser(page, pageSize,name, TdsProperties.UserType.USER);
    }

    /**
     * 分页查询组织机构信息
     * @param page
     * @param pageSize
     * @param name
     * @return OdcResponse
     */
    @Operation(summary = "分页查询组织机构信息")
    @GetMapping("/org.page")
    public OdcResponse pageOrg(@RequestParam(name = "page", defaultValue = "1") int page,
                               @RequestParam(name = "pageSize", defaultValue = "10") int pageSize,
                               @RequestParam(name = "name", required = false) String name){
        return oidcUserDictService.pageUser(page, pageSize,name, TdsProperties.UserType.ORG);
    }

    /**
     * 修改用户角色
     * @param id
     * @param tdsRole
     * @return OdcResponse
     */
    @Operation(summary = "修改用户角色")
    @PostMapping("/user.updaterole")
    public OdcResponse updateRole(@RequestParam String id,@RequestBody TdsRole tdsRole){
        return oidcUserDictService.updateRole(id,tdsRole);
    }

    @Operation(summary = "修改密码")
    @PostMapping("/user.updatepwd")
    public OdcResponse updatePwd(@RequestParam String username,@RequestParam String pwd){
        return oidcUserDictService.updatePwd(username,pwd);
    }

//    @Operation(summary = "激活用户")
//    @PostMapping("/user.active/{id}")
//    public OdcResponse active(@PathVariable String id){
//        return oidcUserDictService.userStatus(id, TdsStatus.APPROVE);
//    }


    @Operation(summary = "根据openId查询用户信息")
    @GetMapping("/user.findbyopenid")
    public OdcResponse findUserByOpenId(@RequestParam String openId,@RequestParam(defaultValue = "0") int type){//typr:0:公众号，1:小程序
        return oidcUserDictService.findUserByOpenId(openId,type);
    }

    @Operation(summary = "根据uid查询用户信息")
    @GetMapping("/user.findbyuid")
    public OdcResponse findUserByUid(@RequestParam String uid) {
        return oidcUserDictService.findByUid(uid);
    }

    @Operation(summary = "激活微信用户")
    @PostMapping("/user.active")
    public OdcResponse active(@RequestParam String uid,
                              @RequestParam String openId){
        return oidcUserDictService.activeWeChat(uid, openId);
    }


    @Operation(summary = "修改用户信息")
    @PostMapping("/user.updateUser")
    public OdcResponse updateUser(@RequestBody OidcUser user){
        return oidcUserDictService.updateUser(user);
    }



}

