package com.cybernet.internet_cafe_management;

import com.cybernet.internet_cafe_management.entity.Account;
import com.cybernet.internet_cafe_management.entity.Computer;
import com.cybernet.internet_cafe_management.repository.AccountRepository;
import com.cybernet.internet_cafe_management.repository.ComputerRepository;
import com.jayway.jsonpath.JsonPath;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import org.springframework.web.context.WebApplicationContext;

import static org.springframework.security.test.web.servlet.setup.SecurityMockMvcConfigurers.springSecurity;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
public class Phase5PaginationIntegrationTest {

    @Autowired
    private WebApplicationContext context;

    private MockMvc mockMvc;

    @Autowired
    private AccountRepository accountRepository;

    @Autowired
    private ComputerRepository computerRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    private String adminToken;

    @BeforeEach
    void setUp() throws Exception {
        mockMvc = MockMvcBuilders.webAppContextSetup(context)
                .apply(springSecurity())
                .build();

        // Đảm bảo có tài khoản ADMIN để lấy JWT Token
        accountRepository.findByPhone("0901111111").ifPresentOrElse(
                admin -> {
                    admin.setPasswordHash(passwordEncoder.encode("admin123"));
                    accountRepository.save(admin);
                },
                () -> {
                    Account admin = new Account();
                    admin.setPhone("0901111111");
                    admin.setName("Admin Test");
                    admin.setRole(Account.Role.ADMIN);
                    admin.setPasswordHash(passwordEncoder.encode("admin123"));
                    accountRepository.save(admin);
                }
        );

        adminToken = obtainAccessToken("0901111111", "admin123");
    }

    @Test
    @DisplayName("TC-1: GET /api/orders có phân trang và sắp xếp -> Trả về cấu trúc PageResponse chuẩn")
    void testGetOrdersWithPagination() throws Exception {
        mockMvc.perform(get("/api/orders?page=0&size=2&sort=createdAt,desc")
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content").isArray())
                .andExpect(jsonPath("$.pageNumber").value(0))
                .andExpect(jsonPath("$.pageSize").value(2))
                .andExpect(jsonPath("$.totalElements").isNumber())
                .andExpect(jsonPath("$.totalPages").isNumber())
                .andExpect(jsonPath("$.first").isBoolean())
                .andExpect(jsonPath("$.last").isBoolean());
    }

    @Test
    @DisplayName("TC-2: GET /api/orders lọc theo status có phân trang -> Trả về danh sách đơn đã lọc")
    void testGetOrdersFilterByStatus() throws Exception {
        mockMvc.perform(get("/api/orders?status=PENDING_PAYMENT&page=0&size=5")
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content").isArray())
                .andExpect(jsonPath("$.pageNumber").value(0))
                .andExpect(jsonPath("$.pageSize").value(5));
    }

    @Test
    @DisplayName("TC-3: GET /api/computers có phân trang và sắp xếp theo code -> PageResponse chuẩn")
    void testGetComputersWithPagination() throws Exception {
        mockMvc.perform(get("/api/computers?page=0&size=5&sort=code,asc")
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content").isArray())
                .andExpect(jsonPath("$.pageNumber").value(0))
                .andExpect(jsonPath("$.pageSize").value(5))
                .andExpect(jsonPath("$.totalElements").isNumber());
    }

    @Test
    @DisplayName("TC-4: GET /api/sessions có phân trang -> PageResponse chuẩn")
    void testGetSessionsWithPagination() throws Exception {
        mockMvc.perform(get("/api/sessions?page=0&size=3&sort=startedAt,desc")
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content").isArray())
                .andExpect(jsonPath("$.pageNumber").value(0))
                .andExpect(jsonPath("$.pageSize").value(3))
                .andExpect(jsonPath("$.totalElements").isNumber());
    }

    @Test
    @DisplayName("TC-5: GET /api/items có phân trang -> PageResponse chuẩn")
    void testGetItemsWithPagination() throws Exception {
        mockMvc.perform(get("/api/items?page=0&size=2&sort=id,asc")
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content").isArray())
                .andExpect(jsonPath("$.pageNumber").value(0))
                .andExpect(jsonPath("$.pageSize").value(2))
                .andExpect(jsonPath("$.totalElements").isNumber());
    }

    @Test
    @DisplayName("TC-6: GET /api/time-purchases có phân trang -> PageResponse chuẩn")
    void testGetTimePurchasesWithPagination() throws Exception {
        mockMvc.perform(get("/api/time-purchases?page=0&size=2&sort=createdAt,desc")
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content").isArray())
                .andExpect(jsonPath("$.pageNumber").value(0))
                .andExpect(jsonPath("$.pageSize").value(2))
                .andExpect(jsonPath("$.totalElements").isNumber());
    }

    @Test
    @DisplayName("TC-7: GET /api/accounts có phân trang -> PageResponse chuẩn")
    void testGetAccountsWithPagination() throws Exception {
        mockMvc.perform(get("/api/accounts?page=0&size=2&sort=id,asc")
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content").isArray())
                .andExpect(jsonPath("$.pageNumber").value(0))
                .andExpect(jsonPath("$.pageSize").value(2))
                .andExpect(jsonPath("$.totalElements").isNumber());
    }

    // Helper trích xuất accessToken qua MockMvc login
    private String obtainAccessToken(String phone, String password) throws Exception {
        String loginJson = String.format("{\"phone\": \"%s\", \"password\": \"%s\"}", phone, password);
        MvcResult result = mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(loginJson))
                .andExpect(status().isOk())
                .andReturn();
        return JsonPath.read(result.getResponse().getContentAsString(), "$.accessToken");
    }
}
