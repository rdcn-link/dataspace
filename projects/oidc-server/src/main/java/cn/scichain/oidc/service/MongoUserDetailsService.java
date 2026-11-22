package cn.scichain.oidc.service;

import cn.opendatachain.common.core.OdcResponse;
import cn.opendatachain.common.core.OdcResponseBuilder;
import cn.opendatachain.common.crypto.CryptoUtils;
import cn.opendatachain.common.crypto.sm.SM2Utils;
import cn.opendatachain.common.util.OdcUtils;
import cn.scichain.oidc.repository.UserRepository;
import cn.tds.common.core.RequestUser;
import cn.tds.common.core.TdsBusinessType;
import cn.tds.common.core.TdsProperties;
import cn.tds.common.core.TdsStatus;
import cn.tds.common.domain.OidcUser;
import cn.tds.common.domain.TdsRole;
import cn.tds.common.utils.TdsUtils;
import com.google.common.collect.Sets;
import lombok.RequiredArgsConstructor;
import org.apache.commons.lang3.StringUtils;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.data.mongodb.core.query.Criteria;
import org.springframework.data.mongodb.core.query.Query;
import org.springframework.data.mongodb.core.query.Update;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.*;
import java.util.regex.Pattern;

/**
 * MongoUserDetailsService Description
 *
 * @author 郭志斌
 * @version oidc-server 1.0.0
 * <b> Creation Time:</b> 2025/4/29 14:58
 */
@Service
@RequiredArgsConstructor
public class MongoUserDetailsService implements UserDetailsService {

    private final UserRepository userRepository;

    private final PasswordEncoder passwordEncoder;

    private final MongoTemplate mongoTemplate;

    private final SM2Utils sm2Utils;

    @Override
    public UserDetails loadUserByUsername(String username) throws UsernameNotFoundException {
        return null;
    }

    public OidcUser findUserByUsername(String username) {
        return userRepository.findByUsername(username);
    }

    public OdcResponse saveUser(RequestUser user) {

        if(org.apache.commons.lang3.StringUtils.isBlank(user.getType())){

            OdcUtils.exception().message("用户类型不能为空");

        }

        OidcUser regUser = userRepository.findByUsername(user.getUsername());

        if(null != regUser){
            OdcUtils.exception().message("用户已存在");
        }

        OidcUser oidcUser = new OidcUser();

        oidcUser.setCertNo(user.getCertNo());
        oidcUser.setName(user.getName());
        oidcUser.setType(user.getType());
        oidcUser.setUsername(user.getUsername());
        oidcUser.setPhone(user.getPhone());
        oidcUser.setContacts(user.getContacts());


        Map<String, String> base64KeyPair = SM2Utils.getBase64KeyPair();
        System.out.println("public:"+base64KeyPair.get(CryptoUtils.PUBLIC_KEY_NAME));
        System.out.println("private:"+base64KeyPair.get(CryptoUtils.PRIVATE_KEY_NAME));
        oidcUser.setPublicKey(base64KeyPair.get(CryptoUtils.PUBLIC_KEY_NAME));
        oidcUser.setPrivateKey(base64KeyPair.get(CryptoUtils.PRIVATE_KEY_NAME));
        oidcUser.setPassword(sm2Utils.encryptWithBase64(user.getPhone(), base64KeyPair.get(CryptoUtils.PUBLIC_KEY_NAME)));
//        sm2Utils.decryptToString(user.getPassword(), base64KeyPair.get(CryptoUtils.PRIVATE_KEY_NAME))//测试解密
        //UID
        oidcUser.setUid(TdsProperties.UserType.USER.equals(user.getType())? TdsUtils.getUid(TdsBusinessType.USER): TdsUtils.getUid(TdsBusinessType.ORGANIZATION));

        oidcUser.setUserIssuedAt(Instant.now());
        oidcUser.setSource("可信科学数据空间");
        String algorithm = user.getType().equals(TdsProperties.UserType.USER)? TdsProperties.ROLES.ROLE_USER:TdsProperties.ROLES.ROLE_ORG;
        oidcUser.setAuthorities(Sets.newHashSet(algorithm));

        // 待审核
        oidcUser.setStatus(TdsStatus.REPORTED.getCode());


        return OdcResponseBuilder.buildSuccess(userRepository.save(oidcUser));
    }


    public OdcResponse pageUser(Integer pageNum, Integer pageSize, String name, String type) {

        Query query = new Query();
        Pageable pageable = PageRequest.of(pageNum >= 1 ? pageNum -1 : pageNum,pageSize);

        query.addCriteria(Criteria.where("type").is(type));

        if (!StringUtils.isBlank(name)) {
            query.addCriteria(Criteria.where("name").regex(Pattern.compile(name, Pattern.CASE_INSENSITIVE)));
        }
        HashMap<String, Object> userMap = new HashMap<>() {{
            put("total", mongoTemplate.count(query, cn.tds.common.domain.OidcUser.class, "oidc-user"));
            put("rows", mongoTemplate.find(query.with(pageable), cn.tds.common.domain.OidcUser.class, "oidc-user"));
        }};

        return OdcResponseBuilder.buildSuccess(userMap);
    }

    public OdcResponse updateRole(String id, TdsRole tdsRole) {

        Query query = new Query();

        query.addCriteria(Criteria.where("_id").is(id));

        Update update = new Update().set("authorities", new HashSet<>(Arrays.asList(tdsRole.getRole())));

        mongoTemplate.updateFirst(query, update, cn.tds.common.domain.OidcUser.class, "oidc-user");

        return OdcResponseBuilder.buildSuccess();
    }

    public OdcResponse updatePwd(String username, String pwd) {

        cn.tds.common.domain.OidcUser user = userRepository.findByUsername(username);

        user.setPassword(sm2Utils.encryptWithBase64(pwd, user.getPublicKey()));

        userRepository.save(user);

        return OdcResponseBuilder.buildSuccess();
    }

    public OdcResponse active(String id, TdsStatus tdsStatus) {
        return null;
    }

    public OdcResponse userStatus(String id, TdsStatus tdsStatus) {

        Optional<cn.tds.common.domain.OidcUser> byId = userRepository.findById(id);

        if (byId.isPresent()) {

            cn.tds.common.domain.OidcUser oidcUser = byId.get();

            oidcUser.setStatus(tdsStatus.getCode());

            userRepository.save(oidcUser);
        }
        return OdcResponseBuilder.buildSuccess();


    }


    public OdcResponse findByUid(String uid) {
        return OdcResponseBuilder.buildSuccess(userRepository.findByUid(uid));
    }

    public OdcResponse findUserByOpenId(String openId, int type) {
        if (type == 0) {
            OidcUser oidcUser = userRepository.findByServiceOpenId(openId);
            return OdcResponseBuilder.buildSuccess(oidcUser);
        }else if (type == 1) {
            OidcUser oidcUser = userRepository.findByAppOpenId(openId);
            return OdcResponseBuilder.buildSuccess(oidcUser);
        }

        return OdcResponseBuilder.buildSuccess();
    }

    public OdcResponse activeWeChat(String uid, String openId) {

        OidcUser oidcUser = userRepository.findByUid(uid);

        if (oidcUser == null) {
            OdcUtils.exception().message("用户不存在");
        }

        oidcUser.setServiceOpenId(openId);
        userRepository.save(oidcUser);

        return OdcResponseBuilder.buildSuccess();
    }

    public OdcResponse updateUser(OidcUser user) {

        OidcUser byServiceOpenId = userRepository.findByServiceOpenId(user.getServiceOpenId());

        if (byServiceOpenId == null) {
            OdcUtils.exception().message("用户不存在");
        }

        byServiceOpenId.setUsername(user.getUsername());
        byServiceOpenId.setPhone(user.getPhone());
        byServiceOpenId.setName(user.getName());
        byServiceOpenId.setCertType(user.getCertType());
        byServiceOpenId.setOrgName(user.getOrgName());
        byServiceOpenId.setAddress(user.getAddress());
        byServiceOpenId.setCountry(user.getCountry());
        byServiceOpenId.setTitle(user.getTitle());
        byServiceOpenId.setOccupation(user.getOccupation());
        byServiceOpenId.setEducation(user.getEducation());
        byServiceOpenId.setField(user.getField());


        byServiceOpenId.setType(TdsProperties.UserType.USER);

        userRepository.save(byServiceOpenId);

        return OdcResponseBuilder.buildSuccess();
    }
}
