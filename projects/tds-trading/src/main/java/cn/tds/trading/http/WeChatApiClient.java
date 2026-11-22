package cn.tds.trading.http;

import com.dtflys.forest.annotation.*;
import com.dtflys.forest.http.ForestResponse;

import java.util.Map;

public interface WeChatApiClient {
    
    @Get(url = "https://api.weixin.qq.com/cgi-bin/token")
    ForestResponse<Map> getAccessToken(
        @Query("grant_type") String grantType,
        @Query("appid") String appid,
        @Query("secret") String secret
    );
    
    @Post(url = "https://api.weixin.qq.com/cgi-bin/message/template/send")
    ForestResponse<String> sendTemplateMessage(
        @Query("access_token") String accessToken,
        @JSONBody Map<String, Object> requestBody
    );
}