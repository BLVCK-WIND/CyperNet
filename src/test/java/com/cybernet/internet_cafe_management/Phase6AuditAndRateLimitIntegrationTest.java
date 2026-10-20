package com.cybernet.internet_cafe_management;

import com.cybernet.internet_cafe_management.entity.Account;
import com.cybernet.internet_cafe_management.repository.AccountRepository;
import com.cybernet.internet_cafe_management.repository.AuditLogRepository;
import com.cybernet.internet_cafe_management.security.JwtService;
import com.cybernet.internet_cafe_management.security.RateLimitingFilter;
import com.cybernet.internet_cafe_management.service.AuditLogService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.util.ReflectionTestUtils;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import org.springframework.web.context.WebApplicationContext;

import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.springframework.security.test.web.servlet.setup.SecurityMockMvcConfigurers.springSecurity;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
public class Phase6AuditAndRateLimitIntegrationTest {

    @Autowired
    private WebApplicationContext context;

    private MockMvc mockMvc;

    @Autowired
    private AccountRepository accountRepository;

    @Autowired
    private AuditLogRepository auditLogRepository;

    @Autowired
    private AuditLogService auditLogService;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private JwtService jwtService;

    @Autowired
    private RateLimitingFilter rateLimitingFilter;

    private String adminToken;
    private String customerToken;

    @BeforeEach
    void setUp() {
        mockMvc = MockMvcBuilders
                .webAppContextSetup(context)
                .apply(springSecurity())
                .build();

        rateLimitingFilter.clearLimits();
        ReflectionTestUtils.setField(rateLimitingFilter, "authLimit", 100);

        Account admin = accountRepository.findByPhone("0901111111").orElseGet(() -> {
            Account newAdmin = new Account();
            newAdmin.setPhone("0901111111");
            newAdmin.setName("Admin Root");
            newAdmin.setPasswordHash(passwordEncoder.encode("admin123"));
            newAdmin.setRole(Account.Role.ADMIN);
            return accountRepository.save(newAdmin);
        });
        adminToken = jwtService.generateAccessToken(admin);

        Account customer = accountRepository.findByPhone("0903333333").orElseGet(() -> {
            Account newCust = new Account();
            newCust.setPhone("0903333333");
            newCust.setName("Khách Hàng Test");
            newCust.setPasswordHash(passwordEncoder.encode("khach123"));
            newCust.setRole(Account.Role.CUSTOMER);
            newCust.setRemainingMinutes(120);
            return accountRepository.save(newCust);
        });
        customerToken = jwtService.generateAccessToken(customer);
    }

    @Test
    @DisplayName("TC-AUDIT-1: AuditLogService ghi nhận thao tác và lưu vào DB")
    void testAuditLogService_ShouldPersistLog() {
        long initialCount = auditLogRepository.count();

        auditLogService.log("0901111111", "ADMIN", "TEST_ACTION", "Computer", 99L, "Kiểm thử audit log", "127.0.0.1");

        long newCount = auditLogRepository.count();
        assertTrue(newCount > initialCount);
    }

    @Test
    @DisplayName("TC-AUDIT-2: ADMIN xem được API /api/audit-logs -> 200 OK")
    void testGetAuditLogs_Admin_ShouldSucceed() throws Exception {
        mockMvc.perform(get("/api/audit-logs")
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content").isArray())
                .andExpect(jsonPath("$.pageNumber").value(0));
    }

    @Test
    @DisplayName("TC-AUDIT-3: CUSTOMER truy cập /api/audit-logs -> 403 Forbidden")
    void testGetAuditLogs_Customer_ShouldBeForbidden() throws Exception {
        mockMvc.perform(get("/api/audit-logs")
                        .header("Authorization", "Bearer " + customerToken))
                .andExpect(status().isForbidden());
    }

    @Test
    @DisplayName("TC-RL-1: Gọi API auth có đính kèm header X-RateLimit-Limit và X-RateLimit-Remaining")
    void testRateLimit_HeadersPresent() throws Exception {
        String loginJson = """
                {
                    "phone": "0901111111",
                    "password": "admin123"
                }
                """;

        mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(loginJson))
                .andExpect(status().isOk())
                .andExpect(header().exists("X-RateLimit-Limit"))
                .andExpect(header().exists("X-RateLimit-Remaining"));
    }

    @Test
    @DisplayName("TC-RL-2: Vượt quá giới hạn tần suất -> HTTP 429 Too Many Requests")
    void testRateLimit_Exceeded_ShouldReturn429() throws Exception {
        ReflectionTestUtils.setField(rateLimitingFilter, "authLimit", 2);
        rateLimitingFilter.clearLimits();

        String loginJson = """
                {
                    "phone": "0901111111",
                    "password": "admin123"
                }
                """;

        // Request 1: OK
        mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(loginJson))
                .andExpect(status().isOk());

        // Request 2: OK
        mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(loginJson))
                .andExpect(status().isOk());

        // Request 3: Vượt quá -> 429
        mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(loginJson))
                .andExpect(status().isTooManyRequests())
                .andExpect(jsonPath("$.status").value(429))
                .andExpect(header().string("Retry-After", "60"));
    }
}
