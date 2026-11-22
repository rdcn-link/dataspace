package cn.scichain.oidc.service;

import cn.hutool.core.date.DateUtil;
import cn.opendatachain.common.core.OdcResponse;
import cn.opendatachain.common.core.OdcResponseBuilder;
import cn.opendatachain.common.util.OdcUtils;
import cn.scichain.oidc.config.WeChatConfig;
import cn.scichain.oidc.domain.LoginTicket;
import cn.scichain.oidc.http.MyClient;
import cn.scichain.oidc.repository.LoginTicketRepository;
import cn.scichain.oidc.repository.UserRepository;
import cn.scichain.oidc.util.WeChatMsgCryptUtil;
import cn.tds.common.core.TdsBusinessType;
import cn.tds.common.core.TdsProperties;
import cn.tds.common.core.TdsStatus;
import cn.tds.common.domain.OidcUser;
import cn.tds.common.utils.TdsUtils;
import com.alibaba.fastjson.JSONObject;
import jakarta.annotation.Resource;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.data.mongodb.core.query.Criteria;
import org.springframework.data.mongodb.core.query.Query;
import org.springframework.data.mongodb.core.query.Update;
import org.springframework.stereotype.Service;
import org.w3c.dom.Document;
import org.w3c.dom.Node;
import org.w3c.dom.NodeList;

import javax.xml.parsers.DocumentBuilder;
import javax.xml.parsers.DocumentBuilderFactory;
import java.io.ByteArrayInputStream;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.time.ZonedDateTime;
import java.util.*;

import static org.reflections.Reflections.log;

/**
 * WeChatService Description
 *
 * @author 李国都
 * @version 1.0.0
 * <b>Creation Time:</b> 2026/4/30 16:17
 */
@Service
public class WeChatService {

    private final LoginTicketRepository loginTicketRepository;

    private final MongoTemplate mongoTemplate;

    private final UserRepository userRepository;

    @Resource
    private MyClient myClient;

    public WeChatService(LoginTicketRepository loginTicketRepository, MongoTemplate mongoTemplate, UserRepository userRepository) {
        this.loginTicketRepository = loginTicketRepository;
        this.mongoTemplate = mongoTemplate;
        this.userRepository = userRepository;
    }

    /**
     * 步骤2：处理微信服务器推送的关注事件（这是关键！）
     * 用户扫码关注后，微信会推送XML消息到这里
     */
    public String handleWechatEvent(String requestBody) {
        System.out.println("收到微信事件推送:  " + requestBody);

        // 解析XML，提取关键信息
        Map<String, String> xmlData = parseXml(requestBody);

        // 安全模式下微信推送的是密文，需先用 EncodingAESKey 解密后再解析
        if (xmlData.containsKey("Encrypt")) {
            try {
                String decryptMsg = WeChatMsgCryptUtil.decryptMsg(
                        xmlData.get("Encrypt"),
                        WeChatConfig.WECHAT_ENCODING_AES_KEY,
                        WeChatConfig.WECHAT_SERVICE_APPID);
                System.out.println("解密后的明文消息: " + decryptMsg);
                xmlData = parseXml(decryptMsg);
            } catch (Exception e) {
                log.error("微信消息解密失败，请检查 EncodingAESKey 配置", e);
                return "";
            }
        }

        String event = xmlData.get("Event");
        String openId = xmlData.get("FromUserName"); // 用户的openid
        String eventKey = xmlData.get("EventKey");   // 场景值

        // 提取loginToken（去掉前缀qrscene_）
        String loginToken = extractSceneValue(eventKey);

        System.out.println("event类型: " + event);
        System.out.println("openId: " + openId);
        System.out.println("loginToken: " + loginToken);

        //处理关注事件（新用户扫码关注）
        if ("subscribe".equals(event)) {
            // 新用户关注时，eventKey格式：qrscene_你的loginToken
            String realLoginToken = loginToken;
            updateLoginSuccess(realLoginToken, openId);
            System.out.println("新用户关注扫码成功: openId=" + openId + ", loginToken=" + realLoginToken);
        }

        //处理扫码事件（已关注用户扫码）
        if ("SCAN".equals(event)) {
            // 已关注用户扫码，eventKey直接就是你的loginToken
            updateLoginSuccess(loginToken, openId);
            System.out.println("已关注用户扫码登录成功: openId=" + openId + ", loginToken=" + loginToken);
        }

        return "";
    }

    public Map<String, String> generateQRCode() {

        String loginToken = UUID.randomUUID().toString().replace("-", "");

        // 保存登录凭证到数据库
        LoginTicket ticket = new LoginTicket();
        ticket.setLoginToken(loginToken);
        ticket.setStatus(0); // 未扫码
        ticket.setCreateTime(new Date());
        ticket.setExpireTime(DateUtil.offsetMinute(new Date(), 5)); // 5分钟过期
//        ticket.setExpireTime(Date.from(ZonedDateTime.now().plusMinutes(5).toInstant())); // 5分钟过期
//        ticket.setExpireTime(Date.from(ZonedDateTime.now().plusSeconds(5).toInstant())); // 5分钟过期

        loginTicketRepository.save(ticket);


        //获取access_token
        JSONObject tokenResult = myClient.getAccessToken(WeChatConfig.WECHAT_SERVICE_APPID, WeChatConfig.WECHAT_SERVICE_SECRET);

        if (tokenResult.containsKey("errcode")) {
            throw new RuntimeException("获取access_token失败: " + tokenResult.getString("errmsg"));
        }

        String accessToken = tokenResult.getString("access_token");
        System.out.println("获取到 access_token: " + accessToken);


        // 使用 Map 构建请求体（无需额外类）
        Map<String, Object> requestBody = new HashMap<>();
        requestBody.put("expire_seconds", 300);
        requestBody.put("action_name", "QR_STR_SCENE");

        Map<String, Object> actionInfo = new HashMap<>();
        Map<String, Object> scene = new HashMap<>();
        scene.put("scene_str", loginToken);
        actionInfo.put("scene", scene);
        requestBody.put("action_info", actionInfo);

        JSONObject qrResult = myClient.createQRCode(accessToken, requestBody);

        System.out.println("二维码创建结果：{}" + qrResult);

        // 5. 获取二维码URL
        String ticketStr = qrResult.getString("ticket");
        String qrCodeUrl = String.format("https://mp.weixin.qq.com/cgi-bin/showqrcode?ticket=%s", ticketStr);

        Map<String, String> result = new HashMap<>();
        result.put("loginToken", loginToken);
        result.put("qrCodeUrl", qrCodeUrl);

        return result;


    }


    /**
     * 抽取公共方法：更新登录成功状态
     */
    private void updateLoginSuccess(String loginToken, String openId) {
        // 更新数据库：将openid绑定到登录凭证
        // 1. 查询ticket
        Query query = new Query();
        query.addCriteria(Criteria.where("loginToken").is(loginToken));
        query.addCriteria(Criteria.where("status").is(0));

        LoginTicket ticket = mongoTemplate.findOne(query, LoginTicket.class);

        // 2. 验证并更新
        if (ticket != null && ticket.getExpireTime().after(new Date())) {
            Update update = new Update();
            update.set("openId", openId);
            update.set("status", 1);
            update.set("updateTime", new Date());

            mongoTemplate.updateFirst(query, update, LoginTicket.class);

            OidcUser user = userRepository.findByServiceOpenId(openId);
            if (user == null){
                OidcUser oidcUser = new OidcUser();
                oidcUser.setServiceOpenId(openId);
                oidcUser.setUid(TdsUtils.getUid(TdsBusinessType.USER));
                //tds_六位随机数字
                oidcUser.setName("tds_" + String.format("%06d", new java.util.Random().nextInt(1000000)));
                userRepository.save(oidcUser);

                userRepository.save(oidcUser);
            }


            // 更新Redis状态
//            redisTemplate.opsForValue().set("wechat:login:" + loginToken, "1", 5, TimeUnit.MINUTES);

            System.out.println("数据库更新成功: loginToken=" + loginToken + ", openId=" + openId);
        } else {
            System.out.println("登录凭证无效或已过期: loginToken=" + loginToken);
        }
    }

    /**
     * 解析微信XML消息
     */
    private Map<String, String> parseXml(String xml) {
        Map<String, String> map = new HashMap<>();
        try {
            DocumentBuilderFactory factory = DocumentBuilderFactory.newInstance();
            DocumentBuilder builder = factory.newDocumentBuilder();
            Document doc = builder.parse(new ByteArrayInputStream(xml.getBytes(StandardCharsets.UTF_8)));

            NodeList nodeList = doc.getDocumentElement().getChildNodes();
            for (int i = 0; i < nodeList.getLength(); i++) {
                Node node = nodeList.item(i);
                if (node.getNodeType() == Node.ELEMENT_NODE) {
                    map.put(node.getNodeName(), node.getTextContent());
                }
            }
        } catch (Exception e) {
            log.error("解析XML失败", e);
        }
        return map;
    }

    /**
     * 从EventKey中提取场景值（loginToken）
     * EventKey格式：qrscene_abc123 或 abc123
     */
    private String extractSceneValue(String eventKey) {
        if (eventKey == null) return null;
        if (eventKey.startsWith("qrscene_")) {
            return eventKey.substring(8);
        }
        return eventKey;
    }

    public Map<String, Object> checkLoginStatus(String loginToken) {

        Map<String, Object> result = new HashMap<>();

        // 先从Redis快速查询
//        String status = redisTemplate.opsForValue().get("wechat:login:" + loginToken);

        LoginTicket byTicketId = loginTicketRepository.findByLoginToken(loginToken);


        Integer status = byTicketId.getStatus();

        if (byTicketId.getExpireTime().before(new Date())) {
            result.put("status", 3); // 已过期
            result.put("message", "二维码已过期");

            Query query = new Query();
            query.addCriteria(Criteria.where("loginToken").is(loginToken));

            Update update = new Update();
            update.set("status", 3);
            mongoTemplate.updateFirst(query, update, LoginTicket.class);
            return result;
        }

        if (0 == status) {
            result.put("status", 0); // 未扫码
            result.put("message", "等待扫码");
            return result;
        }

        if (1 == status) {
//            // 扫码成功，生成网站JWT token
//            LoginTicket ticket = loginTicketMapper.selectOne(
//                    new LambdaQueryWrapper<LoginTicket>().eq(LoginTicket::getLoginToken, loginToken));

//            if (ticket != null && ticket.getOpenId() != null) {
//                // 根据openid查询或创建网站用户
//                UserInfo user = userService.getOrCreateByOpenId(ticket.getOpenId());

//                // 生成网站JWT token
//                String jwtToken = JwtHelper.createToken(user.getId(), user.getName());

            // 更新凭证状态为登录成功
            Query query = new Query();
            query.addCriteria(Criteria.where("loginToken").is(loginToken));

            Update update = new Update();
            update.set("status", 2);
            mongoTemplate.updateFirst(query, update, LoginTicket.class);
//                ticket.setJwtToken(jwtToken);
//            loginTicketMapper.updateById(ticket);

            // 更新Redis状态
//                redisTemplate.opsForValue().set("wechat:login:" + loginToken, "2", 5, TimeUnit.MINUTES);

            result.put("status", 2); // 登录成功
//                result.put("token", jwtToken);
//                result.put("userInfo", user);
            result.put("openId", byTicketId.getOpenId());
            result.put("message", "登录成功");
        }
//        }

        return result;
    }

    /**
     * 构建微信开放平台网站应用授权地址
     * 手机浏览器打开后，微信会展示授权引导页（唤起微信 / 扫码），授权后回跳 WECHAT_OAUTH_REDIRECT_URI
     *
     * @param state 防 CSRF 状态参数，由调用方生成（可携带前端回跳地址）
     * @return 完整授权 URL
     */
    public String buildOAuthAuthorizeUrl(String state) {
        String redirectUri = URLEncoder.encode(WeChatConfig.WECHAT_OAUTH_REDIRECT_URI, StandardCharsets.UTF_8);
        return String.format(
                "https://open.weixin.qq.com/connect/oauth2/authorize?appid=%s&redirect_uri=%s&response_type=code&scope=%s&state=%s#wechat_redirect",
                WeChatConfig.WECHAT_OAUTH_APPID, redirectUri, WeChatConfig.WECHAT_OAUTH_SCOPE, state);
    }

    /**
     * 根据 openid 查询用户，不存在则自动注册（与扫码登录自动建号逻辑一致）
     * 自动注册用户直接审核通过
     *
     * @param openId 微信开放平台 openid
     * @return OidcUser
     */
    public OidcUser getOrCreateUserByOpenId(String openId) {
        OidcUser user = userRepository.findByServiceOpenId(openId);
        if (user == null) {
            user = new OidcUser();
            user.setServiceOpenId(openId);
            user.setUid(TdsUtils.getUid(TdsBusinessType.USER));
            //tds_六位随机数字
            user.setName("tds_" + String.format("%06d", new java.util.Random().nextInt(1000000)));
            user.setAuthorities(new HashSet<>(Arrays.asList(TdsProperties.ROLES.ROLE_USER)));
            user.setStatus(TdsStatus.APPROVE.getCode());
            user.setUserIssuedAt(Instant.now());
            userRepository.save(user);
        }
        return user;
    }

    public OdcResponse bindUser(String openid, String uid) {

        OidcUser byUid = userRepository.findByUid(uid);

        if (byUid.getServiceOpenId().isBlank()){
            byUid.setServiceOpenId(openid);
            userRepository.save(byUid);
        }else if (!byUid.getServiceOpenId().equals(openid)){
            return OdcResponseBuilder.buildFailure("用户已绑定其他微信");
        }

        return OdcResponseBuilder.buildSuccess();
    }
}
