package com.cybernet.internet_cafe_management.config;

import io.swagger.v3.oas.models.Components;
import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.info.Contact;
import io.swagger.v3.oas.models.info.Info;
import io.swagger.v3.oas.models.info.License;
import io.swagger.v3.oas.models.security.SecurityRequirement;
import io.swagger.v3.oas.models.security.SecurityScheme;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class OpenApiConfig {

    public static final String SECURITY_SCHEME_NAME = "BearerAuth";

    @Bean
    public OpenAPI customOpenAPI() {
        return new OpenAPI()
                .info(new Info()
                        .title("CyberNet - Internet Cafe Management API")
                        .version("1.0.0")
                        .description("Tài liệu đặc tả RESTful API cho Hệ thống Quản lý Tiệm Net CyberNet.\n\n"
                                + "Hệ thống hỗ trợ phân quyền RBAC (ADMIN, STAFF, CUSTOMER) và xác thực bằng JWT Bearer Token.\n"
                                + "Để sử dụng các API yêu cầu quyền, hãy đăng nhập qua endpoint `/api/auth/login` và click nút **Authorize** để nhập Access Token.")
                        .contact(new Contact()
                                .name("CyberNet Engineering Team")
                                .email("dev@cybernet.vn"))
                        .license(new License()
                                .name("Apache 2.0")
                                .url("https://springdoc.org")))
                .addSecurityItem(new SecurityRequirement().addList(SECURITY_SCHEME_NAME))
                .components(new Components()
                        .addSecuritySchemes(SECURITY_SCHEME_NAME, new SecurityScheme()
                                .name(SECURITY_SCHEME_NAME)
                                .type(SecurityScheme.Type.HTTP)
                                .scheme("bearer")
                                .bearerFormat("JWT")
                                .description("Nhập JWT Access Token vào đây (không cần gõ tiền tố 'Bearer ')")));
    }
}
