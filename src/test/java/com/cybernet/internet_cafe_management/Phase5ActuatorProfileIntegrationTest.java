package com.cybernet.internet_cafe_management;

import com.cybernet.internet_cafe_management.entity.Account;
import com.cybernet.internet_cafe_management.repository.AccountRepository;
import com.cybernet.internet_cafe_management.security.JwtService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.core.env.Environment;
import org.springframework.http.MediaType;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import org.springframework.web.context.WebApplicationContext;

import java.util.Arrays;

import static org.hamcrest.Matchers.*;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.springframework.security.test.web.servlet.setup.SecurityMockMvcConfigurers.springSecurity;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
public class Phase5ActuatorProfileIntegrationTest {

    @Autowired
    private WebApplicationContext context;

    @Autowired
    private Environment environment;

    @Autowired
    private AccountRepository accountRepository;

    @Autowired
    private JwtService jwtService;

    @Autowired
    private PasswordEncoder passwordEncoder;

    private MockMvc mockMvc;
    private Account adminAccount;
    private Account customerAccount;

    @BeforeEach
    void setUp() {
        mockMvc = MockMvcBuilders.webAppContextSetup(context)
                .apply(springSecurity())
                .build();

        // 1. Chuẩn bị tài khoản ADMIN
        adminAccount = accountRepository.findByPhone("0901111111")
                .orElseGet(() -> {
                    Account admin = new Account();
                    admin.setPhone("0901111111");
                    admin.setName("Admin Root");
                    return admin;
                });
        adminAccount.setRole(Account.Role.ADMIN);
        adminAccount.setPasswordHash(passwordEncoder.encode("admin123"));
        adminAccount = accountRepository.save(adminAccount);

        // 2. Chuẩn bị tài khoản CUSTOMER
        customerAccount = accountRepository.findByPhone("0903333333")
                .orElseGet(() -> {
                    Account customer = new Account();
                    customer.setPhone("0903333333");
                    customer.setName("Khách Hàng A");
                    return customer;
                });
        customerAccount.setRole(Account.Role.CUSTOMER);
        customerAccount.setPasswordHash(passwordEncoder.encode("pass123"));
        customerAccount = accountRepository.save(customerAccount);
    }

    @Test
    @DisplayName("TC-1: GET /actuator/health truy cập công khai và báo cáo status UP")
    void testActuatorHealthIsPublicAndUp() throws Exception {
        mockMvc.perform(get("/actuator/health"))
                .andExpect(status().isOk())
                .andExpect(content().contentTypeCompatibleWith(MediaType.valueOf("application/vnd.spring-boot.actuator.v3+json")))
                .andExpect(jsonPath("$.status").value("UP"));
    }

    @Test
    @DisplayName("TC-2: GET /actuator/info truy cập công khai không yêu cầu authentication")
    void testActuatorInfoIsPublic() throws Exception {
        mockMvc.perform(get("/actuator/info"))
                .andExpect(status().isOk());
    }

    @Test
    @DisplayName("TC-3: GET /actuator/metrics bảo mật RBAC: 401 khi không đăng nhập, 403 khi CUSTOMER, 200 khi ADMIN")
    void testActuatorMetricsSecurity() throws Exception {
        // 1. Không gửi token -> 401 Unauthorized
        mockMvc.perform(get("/actuator/metrics"))
                .andExpect(status().isUnauthorized());

        // 2. Gửi token role CUSTOMER -> 403 Forbidden
        String customerToken = jwtService.generateAccessToken(customerAccount);
        mockMvc.perform(get("/actuator/metrics")
                        .header("Authorization", "Bearer " + customerToken))
                .andExpect(status().isForbidden());

        // 3. Gửi token role ADMIN -> 200 OK + danh sách metrics
        String adminToken = jwtService.generateAccessToken(adminAccount);
        mockMvc.perform(get("/actuator/metrics")
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.names", not(empty())));
    }

    @Test
    @DisplayName("TC-4: Xác nhận cấu hình multi-environment profile đang nạp profile dev")
    void testActiveProfileIsDev() {
        String[] activeProfiles = environment.getActiveProfiles();
        boolean hasDevProfile = Arrays.asList(activeProfiles).contains("dev") 
                || (activeProfiles.length == 0 && Arrays.asList(environment.getDefaultProfiles()).contains("dev"));
        assertTrue(hasDevProfile, "Environment profile phải chứa profile 'dev'");
    }
}
