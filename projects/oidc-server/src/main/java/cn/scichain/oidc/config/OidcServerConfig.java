package cn.scichain.oidc.config;

import cn.scichain.oidc.domain.OidcTokenCustomizer;
import cn.scichain.oidc.repository.AuthorizationRepository;
import cn.scichain.oidc.repository.ClientRepository;
import cn.scichain.oidc.repository.UserRepository;
import cn.scichain.oidc.service.MongoAuthorizationConsentService;
import cn.scichain.oidc.service.MongoClientService;
import cn.scichain.oidc.service.MongoOAuth2AuthorizationService;
import cn.scichain.oidc.service.MongoUserDetailsService;
import com.nimbusds.jose.jwk.JWKSet;
import com.nimbusds.jose.jwk.source.ImmutableJWKSet;
import com.nimbusds.jose.jwk.source.JWKSource;
import com.nimbusds.jose.proc.SecurityContext;
import org.springframework.context.annotation.Bean;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.http.MediaType;
import org.springframework.security.config.Customizer;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.oauth2.jwt.JwtDecoder;
import org.springframework.security.oauth2.server.authorization.OAuth2AuthorizationConsentService;
import org.springframework.security.oauth2.server.authorization.OAuth2AuthorizationService;
import org.springframework.security.oauth2.server.authorization.client.RegisteredClientRepository;
import org.springframework.security.oauth2.server.authorization.config.annotation.web.configuration.OAuth2AuthorizationServerConfiguration;
import org.springframework.security.oauth2.server.authorization.config.annotation.web.configurers.OAuth2AuthorizationServerConfigurer;
import org.springframework.security.oauth2.server.authorization.settings.AuthorizationServerSettings;
import org.springframework.security.oauth2.server.authorization.token.JwtEncodingContext;
import org.springframework.security.oauth2.server.authorization.token.OAuth2TokenCustomizer;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.LoginUrlAuthenticationEntryPoint;
import org.springframework.security.web.util.matcher.MediaTypeRequestMatcher;

import java.io.IOException;
import java.io.InputStream;
import java.text.ParseException;

/**
 * OIDCServerConfig OIDC Server 配置类
 *
 * @author 郭志斌
 * @version oidc-server 1.0.0
 * <b> Creation Time:</b> 2025/4/21 16:28
 */
//@Configuration
public class OidcServerConfig {

    private final UserRepository userRepository;

    private final ClientRepository clientRepository;

    private final AuthorizationRepository authorizationRepository;

    private final PasswordEncoder passwordEncoder;

    private final MongoTemplate mongoTemplate;

    public OidcServerConfig(UserRepository userRepository, ClientRepository clientRepository, AuthorizationRepository authorizationRepository, PasswordEncoder passwordEncoder, MongoTemplate mongoTemplate) {
        this.userRepository = userRepository;
        this.clientRepository = clientRepository;
        this.authorizationRepository = authorizationRepository;
        this.passwordEncoder = passwordEncoder;
        this.mongoTemplate = mongoTemplate;
    }

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        OAuth2AuthorizationServerConfigurer authorizationServerConfigurer =
                OAuth2AuthorizationServerConfigurer.authorizationServer();

        http.securityMatcher(authorizationServerConfigurer.getEndpointsMatcher())
                .with(authorizationServerConfigurer, (authorizationServer) -> {
                    // Enable OpenID Connect 1.0
                    authorizationServer.oidc(Customizer.withDefaults());
                }).authorizeHttpRequests((authorizeHttpRequests) -> {
                    // 确保应用程序中的所有端点都需要至少对安全上下文进行身份验证才能允许访问
                    authorizeHttpRequests.anyRequest().authenticated();
                }).exceptionHandling((exceptionHandling) -> {
                    //未登录时访问认证端点将被重定向至login页面
                    exceptionHandling.defaultAuthenticationEntryPointFor(
                            new LoginUrlAuthenticationEntryPoint("/login"),
                            new MediaTypeRequestMatcher(MediaType.TEXT_HTML)
                    );
                });

        return http.build();
    }

    /**
     * Jwk 使用秘钥存储位置,不同应用建议使用不同秘钥 - 可以使用数据库存储
     * 参考单元测试类 JwksTest 生成不同 key
     */
    public static String KEYSTORE_NAME = "jwks.json";

    /**
     * 配置 jwk 源用于加解密及签署访问令牌，每个接入的应用应使用不同 key 使用 ImmutableJWKSet 存储 - 秘钥存储在 jwks.json 配置文件中
     *
     * @return JWKSource<SecurityContext>
     */
    @Bean
    public JWKSource<SecurityContext> jwkSource() throws IOException, ParseException {
        try (InputStream is = getClass().getClassLoader().getResourceAsStream(KEYSTORE_NAME)) {
            return new ImmutableJWKSet<>(JWKSet.load(is));
        }
    }

    /**
     * 配置 JWT 令牌解密器 - 用于解码签名访问令牌
     *
     * @param jwkSource JWKSource<SecurityContext>
     * @return JwtDecoder
     */
    @Bean
    public JwtDecoder jwtDecoder(JWKSource<SecurityContext> jwkSource) {
        return OAuth2AuthorizationServerConfiguration.jwtDecoder(jwkSource);
    }

    /**
     * 配置 Spring Authorization Server
     *
     * @return AuthorizationServerSettings
     */
    @Bean
    public AuthorizationServerSettings authorizationServerSettings() {
        return AuthorizationServerSettings.builder().build();
    }

    /**
     * 用户信息存储配置, MongoDB 实现
     *
     * @return UserDetailsService
     */
    @Bean
    public UserDetailsService userDetailsService() {
        return new MongoUserDetailsService(userRepository, passwordEncoder,null,null);
    }

    /**
     * 注册客户端管理
     *
     * @return RegisteredClientRepository
     */
    @Bean
    public RegisteredClientRepository registeredClientRepository() {
        return new MongoClientService(clientRepository, mongoTemplate);
    }

    /**
     * 授权许可存储配置, MongoDB 实现
     *
     * @return OAuth2AuthorizationConsentService
     */
    @Bean
    public OAuth2AuthorizationConsentService oAuth2AuthorizationConsentService(RegisteredClientRepository registeredClientRepository) {
        return new MongoAuthorizationConsentService();
    }


    /**
     * 授权信息存储配置, MongoDB 实现
     *
     * @return OAuth2AuthorizationService
     */
    @Bean
    public OAuth2AuthorizationService oAuth2AuthorizationService(RegisteredClientRepository registeredClientRepository) {
        return new MongoOAuth2AuthorizationService(authorizationRepository);
    }

    /**
     * 扩展 JWT ID_TOKEN 中携带信息
     *
     * @return OAuth2TokenCustomizer
     */
    @Bean
    public OAuth2TokenCustomizer<JwtEncodingContext> jwtTokenCustomizer() {
        return new OidcTokenCustomizer();
    }

}
