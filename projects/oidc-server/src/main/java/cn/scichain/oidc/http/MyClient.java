package cn.scichain.oidc.http;

import com.alibaba.fastjson.JSONObject;
import com.dtflys.forest.annotation.*;

import java.net.http.HttpResponse;
import java.util.Map;

/**
 * MyClient Description
 *
 * @author 李国都
 * @version 1.0.0
 * <b>Creation Time:</b> 2025/11/10 10:26
 */
public interface MyClient {

    /**
     * 1. 获取公众号 access_token
     * @param appid 公众号AppId
     * @param secret 公众号AppSecret
     * @return JSONObject 包含 access_token 和 expires_in
     */
    @Get("https://api.weixin.qq.com/cgi-bin/token?grant_type=client_credential&appid=${appid}&secret=${secret}")
    JSONObject getAccessToken(@Var("appid") String appid, @Var("secret") String secret);


    /**
     * 2. 创建带参二维码（临时二维码）
     * @param accessToken 公众号 access_token
     * @param requestBody 请求体 JSON
     * @return JSONObject 包含 ticket 和 url
     */
    @Post("https://api.weixin.qq.com/cgi-bin/qrcode/create?access_token=${accessToken}")
    @Headers("Content-Type: application/json")
    JSONObject createQRCode(@Var("accessToken") String accessToken,
                            @Body Map<String, Object> requestBody);

    /**
     * 3. 用 code 换取用户信息（OAuth2）
     * @param appid 公众号AppId
     * @param secret 公众号AppSecret
     * @param code 临时授权码
     * @return JSONObject 包含 access_token, openid, refresh_token 等
     */
    @Get("https://api.weixin.qq.com/sns/oauth2/access_token?appid=${appid}&secret=${secret}&code=${code}&grant_type=authorization_code")
    JSONObject getOAuth2AccessToken(@Var("appid") String appid,
                                    @Var("secret") String secret,
                                    @Var("code") String code);

    /**
     * 4. 刷新 access_token
     * @param appid 公众号AppId
     * @param refreshToken 刷新令牌
     * @return JSONObject 包含新的 access_token
     */
    @Get("https://api.weixin.qq.com/sns/oauth2/refresh_token?appid=${appid}&grant_type=refresh_token&refresh_token=${refreshToken}")
    JSONObject refreshAccessToken(@Var("appid") String appid, @Var("refreshToken") String refreshToken);

    /**
     * 5. 获取用户信息（需要用户授权）
     * @param accessToken OAuth2 access_token
     * @param openId 用户openid
     * @return JSONObject 包含用户信息
     */
    @Get("https://api.weixin.qq.com/sns/userinfo?access_token=${accessToken}&openid=${openId}")
    JSONObject getUserInfo(@Var("accessToken") String accessToken, @Var("openId") String openId);

    /**
     * 6. 验证 access_token 是否有效
     * @param accessToken OAuth2 access_token
     * @param openId 用户openid
     * @return JSONObject 包含校验结果
     */
    @Get("https://api.weixin.qq.com/sns/auth?access_token=${accessToken}&openid=${openId}")
    JSONObject checkAccessToken(@Var("accessToken") String accessToken, @Var("openId") String openId);

    /**
     * 7. 小程序登录 code2session
     * @param appid 小程序AppId
     * @param secret 小程序AppSecret
     * @param jsCode 临时登录凭证 code
     * @return JSONObject 包含 openid, session_key, unionid
     */
    @Get("https://api.weixin.qq.com/sns/jscode2session?appid=${appid}&secret=${secret}&js_code=${jsCode}&grant_type=authorization_code")
    JSONObject code2Session(@Var("appid") String appid,
                            @Var("secret") String secret,
                            @Var("jsCode") String jsCode);
}
