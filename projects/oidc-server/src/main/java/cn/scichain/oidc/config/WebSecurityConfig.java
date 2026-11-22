package cn.scichain.oidc.config;

import cn.opendatachain.common.crypto.sm.SM2Utils;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.annotation.Order;
import org.springframework.http.HttpMethod;
import org.springframework.security.config.Customizer;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;

/**
 * WebSecurityConfig Description
 *
 * @author 郭志斌
 * @version oidc-server 1.0.0
 * <b> Creation Time:</b> 2025/5/14 9:16
 */
@Configuration
@EnableWebSecurity
public class WebSecurityConfig {

    /**
     * 扩展默认的 Web安全配置项
     * <p>
     * defaultSecurityFilterChain
     *
     * @throws Exception e
     * @since 3.0.0
     */
    @Bean
    @Order(2)
    public SecurityFilterChain defaultSecurityFilterChain(HttpSecurity http) throws Exception {

        http.csrf(csrfConfigurer -> {
            csrfConfigurer.ignoringRequestMatchers("/oauth2/rest_token");
        });

        http.authorizeHttpRequests(matcherRegistry -> {
            // permitAll() 的URL路径属于公开访问，不需要权限
            matcherRegistry
                    .requestMatchers("/oauth/**","/swagger-ui.html","/swagger-ui/**", "/v3/api-docs/**", "/webjars/**","/swagger-resources/**","/swagger-ui/*.js").permitAll()
                    .requestMatchers("/oauth/**").permitAll()
                    .requestMatchers("/sso/**").permitAll()
                    .requestMatchers("/client.*").permitAll()
                    .requestMatchers("/user.*").permitAll()
                    .requestMatchers("/user/**").permitAll()
                    .requestMatchers("/wechat/**").permitAll()
                    .requestMatchers(HttpMethod.GET, "/login*").anonymous()
                    // 所有以 /m/  开头的 URL属于 MOBILE 权限
                    .requestMatchers("/m/**").hasAnyRole("MOBILE")
                    // anyRequest() 放最后
                    .anyRequest().authenticated();
        }).csrf(AbstractHttpConfigurer::disable);

        return http.build();
    }

    @Bean
    public PasswordEncoder  passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    @Bean
    public SM2Utils sm2Utils() {
        return new SM2Utils();
    }



}
