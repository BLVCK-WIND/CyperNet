package com.cybernet.internet_cafe_management;

import com.cybernet.internet_cafe_management.entity.Account;
import com.cybernet.internet_cafe_management.repository.AccountRepository;
import com.cybernet.internet_cafe_management.security.JwtService;
import com.cybernet.internet_cafe_management.security.RateLimitingFilter;
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

import java.time.LocalDate;

import static org.hamcrest.Matchers.*;
import static org.springframework.security.test.web.servlet.setup.SecurityMockMvcConfigurers.springSecurity;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
public class ReportIntegrationTest {

    @Autowired
    private WebApplicationContext context;

    private MockMvc mockMvc;

    @Autowired
    private AccountRepository accountRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private JwtService jwtService;

    @Autowired
    private RateLimitingFilter rateLimitingFilter;

    private String adminToken;
    private String staffToken;
    private String customerToken;

    @BeforeEach
    public void setUp() {
        mockMvc = MockMvcBuilders
                .webAppContextSetup(context)
                .apply(springSecurity())
                .build();

        rateLimitingFilter.clearLimits();
        ReflectionTestUtils.setField(rateLimitingFilter, "authLimit", 500);

        // 1. Tạo hoặc lấy Admin (0901111111)
        Account admin = accountRepository.findByPhone("0901111111").orElseGet(() -> {
            Account acc = new Account();
            acc.setPhone("0901111111");
            acc.setName("Admin Root CyberNet");
            acc.setPasswordHash(passwordEncoder.encode("admin123"));
            acc.setRole(Account.Role.ADMIN);
            return accountRepository.save(acc);
        });
        adminToken = jwtService.generateAccessToken(admin);

        // 2. Tạo hoặc lấy Staff (0902222222)
        Account staff = accountRepository.findByPhone("0902222222").orElseGet(() -> {
            Account acc = new Account();
            acc.setPhone("0902222222");
            acc.setName("Staff Member Cyber");
            acc.setPasswordHash(passwordEncoder.encode("staff123"));
            acc.setRole(Account.Role.STAFF);
            return accountRepository.save(acc);
        });
        staffToken = jwtService.generateAccessToken(staff);

        // 3. Tạo hoặc lấy Customer (0903333333)
        Account customer = accountRepository.findByPhone("0903333333").orElseGet(() -> {
            Account acc = new Account();
            acc.setPhone("0903333333");
            acc.setName("Customer Member Cyber");
            acc.setPasswordHash(passwordEncoder.encode("customer123"));
            acc.setRole(Account.Role.CUSTOMER);
            return accountRepository.save(acc);
        });
        customerToken = jwtService.generateAccessToken(customer);
    }

    @Test
    @DisplayName("Test 1: Admin lấy Báo cáo Tổng quan Doanh thu thành công (GET /api/reports/revenue/summary)")
    public void testGetRevenueSummary_Admin_Success() throws Exception {
        String today = LocalDate.now().toString();
        String past30Days = LocalDate.now().minusDays(30).toString();

        mockMvc.perform(get("/api/reports/revenue/summary")
                        .header("Authorization", "Bearer " + adminToken)
                        .param("fromDate", past30Days)
                        .param("toDate", today)
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.totalRevenue", notNullValue()))
                .andExpect(jsonPath("$.cashRevenue", notNullValue()))
                .andExpect(jsonPath("$.qrRevenue", notNullValue()))
                .andExpect(jsonPath("$.totalFoodAndDrinkRevenue", notNullValue()))
                .andExpect(jsonPath("$.totalPlaytimeRevenue", notNullValue()))
                .andExpect(jsonPath("$.fromDate", is(past30Days)))
                .andExpect(jsonPath("$.toDate", is(today)));
    }

    @Test
    @DisplayName("Test 2: Xu hướng doanh thu theo ngày liên tục (GET /api/reports/revenue/daily)")
    public void testGetDailyRevenue_ContinuousDates() throws Exception {
        LocalDate start = LocalDate.now().minusDays(7);
        LocalDate end = LocalDate.now();

        mockMvc.perform(get("/api/reports/revenue/daily")
                        .header("Authorization", "Bearer " + adminToken)
                        .param("fromDate", start.toString())
                        .param("toDate", end.toString())
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(8))) // 8 ngày liên tục (từ -7 đến 0)
                .andExpect(jsonPath("$[0].date", is(start.toString())))
                .andExpect(jsonPath("$[7].date", is(end.toString())));
    }

    @Test
    @DisplayName("Test 3: Thống kê Top món bán chạy nhất (GET /api/reports/items/top-selling)")
    public void testGetTopSellingItems() throws Exception {
        mockMvc.perform(get("/api/reports/items/top-selling")
                        .header("Authorization", "Bearer " + adminToken)
                        .param("limit", "5")
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", notNullValue()));
    }

    @Test
    @DisplayName("Test 4: Thống kê Top khách hàng chi tiêu nhiều nhất (GET /api/reports/customers/top-spenders)")
    public void testGetTopSpendingCustomers() throws Exception {
        mockMvc.perform(get("/api/reports/customers/top-spenders")
                        .header("Authorization", "Bearer " + adminToken)
                        .param("limit", "10")
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", notNullValue()));
    }

    @Test
    @DisplayName("Test 5: Thống kê Hiệu suất sử dụng máy trạm (GET /api/reports/computers/usage)")
    public void testGetComputerUsageStats() throws Exception {
        mockMvc.perform(get("/api/reports/computers/usage")
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", notNullValue()));
    }

    @Test
    @DisplayName("Test 6: Kiểm soát đặc quyền RBAC - Nhân viên & Khách bị chặn truy cập báo cáo tài chính (HTTP 403)")
    public void testReportSecurity_StaffAndCustomer_Forbidden() throws Exception {
        // Staff truy cập -> 403
        mockMvc.perform(get("/api/reports/revenue/summary")
                        .header("Authorization", "Bearer " + staffToken))
                .andExpect(status().isForbidden());

        // Customer truy cập -> 403
        mockMvc.perform(get("/api/reports/revenue/summary")
                        .header("Authorization", "Bearer " + customerToken))
                .andExpect(status().isForbidden());

        // Anonymous (không có token) -> 401
        mockMvc.perform(get("/api/reports/revenue/summary"))
                .andExpect(status().isUnauthorized());
    }
}
