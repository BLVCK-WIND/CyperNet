package com.cybernet.internet_cafe_management;

import com.cybernet.internet_cafe_management.entity.Account;
import com.cybernet.internet_cafe_management.entity.Computer;
import com.cybernet.internet_cafe_management.repository.AccountRepository;
import com.cybernet.internet_cafe_management.repository.ComputerRepository;
import com.cybernet.internet_cafe_management.repository.OrderRepository;
import com.cybernet.internet_cafe_management.repository.RefreshTokenRepository;
import com.cybernet.internet_cafe_management.repository.SessionRepository;
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

import java.math.BigDecimal;

import static org.junit.jupiter.api.Assertions.*;
import static org.springframework.security.test.web.servlet.setup.SecurityMockMvcConfigurers.springSecurity;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
public class Phase3SecurityIntegrationTest {

    @Autowired
    private WebApplicationContext context;

    private MockMvc mockMvc;

    @Autowired
    private AccountRepository accountRepository;

    @Autowired
    private RefreshTokenRepository refreshTokenRepository;

    @Autowired
    private ComputerRepository computerRepository;

    @Autowired
    private SessionRepository sessionRepository;

    @Autowired
    private OrderRepository orderRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    private Account adminAccount;
    private Account staffAccount;
    private Account customerAccount;
    private Computer availablePc;

    @BeforeEach
    void setUp() {
        mockMvc = MockMvcBuilders
                .webAppContextSetup(context)
                .apply(springSecurity())
                .build();

        refreshTokenRepository.deleteAll();
        orderRepository.deleteAll();
        sessionRepository.deleteAll();

        // 1. Tạo/cập nhật Account ADMIN
        adminAccount = accountRepository.findByPhone("0901111111").orElseGet(() -> {
            Account acc = new Account();
            acc.setPhone("0901111111");
            acc.setName("Nguyễn Quản Lý");
            acc.setRole(Account.Role.ADMIN);
            return acc;
        });
        adminAccount.setPasswordHash(passwordEncoder.encode("admin123"));
        accountRepository.save(adminAccount);

        // 2. Tạo/cập nhật Account STAFF
        staffAccount = accountRepository.findByPhone("0902222222").orElseGet(() -> {
            Account acc = new Account();
            acc.setPhone("0902222222");
            acc.setName("Lê Thu Ngân");
            acc.setRole(Account.Role.STAFF);
            return acc;
        });
        staffAccount.setPasswordHash(passwordEncoder.encode("staff123"));
        accountRepository.save(staffAccount);

        // 3. Tạo/cập nhật Account CUSTOMER
        customerAccount = accountRepository.findByPhone("0903333333").orElseGet(() -> {
            Account acc = new Account();
            acc.setPhone("0903333333");
            acc.setName("Trần Khách Chơi");
            acc.setRole(Account.Role.CUSTOMER);
            return acc;
        });
        customerAccount.setPasswordHash(passwordEncoder.encode("khach123"));
        customerAccount.setRemainingMinutes(120);
        accountRepository.save(customerAccount);

        // 4. Tạo Computer AVAILABLE để test public session login
        availablePc = computerRepository.findByCode("SEC-PC-01").orElseGet(() -> {
            Computer pc = new Computer();
            pc.setCode("SEC-PC-01");
            pc.setPricePerHour(BigDecimal.valueOf(10000));
            pc.setIpAddress("192.168.100.10");
            pc.setZone(Computer.Zone.STANDARD);
            pc.setStatus(Computer.Status.AVAILABLE);
            return pc;
        });
        availablePc.setStatus(Computer.Status.AVAILABLE);
        computerRepository.save(availablePc);
    }

    @Test
    @DisplayName("TC-1: Đăng nhập STAFF đúng mật khẩu -> 200 OK + cấp Access & Refresh Token")
    void testStaffLogin_Success() throws Exception {
        String jsonRequest = """
                {
                    "phone": "0902222222",
                    "password": "staff123"
                }
                """;

        MvcResult result = mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(jsonRequest))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.accessToken").isNotEmpty())
                .andExpect(jsonPath("$.refreshToken").isNotEmpty())
                .andExpect(jsonPath("$.account.role").value("STAFF"))
                .andReturn();

        String responseContent = result.getResponse().getContentAsString();
        String accessToken = JsonPath.read(responseContent, "$.accessToken");
        String refreshToken = JsonPath.read(responseContent, "$.refreshToken");
        assertNotNull(accessToken);
        assertTrue(refreshTokenRepository.findByToken(refreshToken).isPresent());
    }

    @Test
    @DisplayName("TC-2: Đăng nhập sai mật khẩu -> 400 Bad Request")
    void testLogin_WrongPassword_ReturnsBadRequest() throws Exception {
        String jsonRequest = """
                {
                    "phone": "0902222222",
                    "password": "wrong_password"
                }
                """;

        mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(jsonRequest))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value("Sai số điện thoại hoặc mật khẩu!"));
    }

    @Test
    @DisplayName("TC-3: CUSTOMER đăng nhập API Auth quản lý -> 400 Bad Request từ chối")
    void testCustomerLoginToAdminApi_Rejected() throws Exception {
        String jsonRequest = """
                {
                    "phone": "0903333333",
                    "password": "khach123"
                }
                """;

        mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(jsonRequest))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value("Tài khoản khách hàng vui lòng đăng nhập tại máy trạm!"));
    }

    @Test
    @DisplayName("TC-4: Truy cập Endpoint bảo vệ không kèm JWT -> 401 Unauthorized dạng JSON")
    void testAccessProtectedEndpoint_WithoutToken_Returns401() throws Exception {
        mockMvc.perform(get("/api/accounts"))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.status").value(401))
                .andExpect(jsonPath("$.message").value("Vui lòng đăng nhập để truy cập!"));
    }

    @Test
    @DisplayName("TC-5: STAFF có JWT hợp lệ xem danh sách tài khoản -> 200 OK")
    void testStaffAccessAccounts_WithToken_Returns200() throws Exception {
        String staffToken = obtainAccessToken("0902222222", "staff123");

        mockMvc.perform(get("/api/accounts")
                        .header("Authorization", "Bearer " + staffToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content").isArray());
    }

    @Test
    @DisplayName("TC-6: STAFF gọi DELETE /api/accounts/{id} -> 403 Forbidden (Chỉ ADMIN mới có quyền)")
    void testStaffDeleteAccount_Forbidden_Returns403() throws Exception {
        String staffToken = obtainAccessToken("0902222222", "staff123");

        mockMvc.perform(delete("/api/accounts/" + customerAccount.getId())
                        .header("Authorization", "Bearer " + staffToken))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.status").value(403))
                .andExpect(jsonPath("$.message").value("Bạn không có quyền truy cập tài nguyên này!"));
    }

    @Test
    @DisplayName("TC-7: ADMIN gọi DELETE /api/accounts/{id} -> 204 No Content thành công")
    void testAdminDeleteAccount_Success_Returns204() throws Exception {
        accountRepository.findByPhone("0999999999").ifPresent(accountRepository::delete);

        // Tạo 1 tài khoản tạm để xóa
        Account tempAccount = new Account();
        tempAccount.setPhone("0999999999");
        tempAccount.setName("Tài Khoản Tạm");
        tempAccount.setPasswordHash(passwordEncoder.encode("123456"));
        tempAccount.setRole(Account.Role.CUSTOMER);
        Account savedTemp = accountRepository.save(tempAccount);

        String adminToken = obtainAccessToken("0901111111", "admin123");

        mockMvc.perform(delete("/api/accounts/" + savedTemp.getId())
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isNoContent());

        assertFalse(accountRepository.existsById(savedTemp.getId()));
    }

    @Test
    @DisplayName("TC-8: Refresh Token Rotation -> Cấp cặp token mới, token cũ bị thu hồi")
    void testRefreshToken_Rotation_Success() throws Exception {
        // 1. Đăng nhập để lấy refresh token ban đầu
        String loginJson = """
                {
                    "phone": "0902222222",
                    "password": "staff123"
                }
                """;
        MvcResult loginResult = mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(loginJson))
                .andReturn();
        String oldRefreshToken = JsonPath.read(loginResult.getResponse().getContentAsString(), "$.refreshToken");

        // 2. Gọi Refresh Token
        String refreshJson = String.format("{\"refreshToken\": \"%s\"}", oldRefreshToken);
        MvcResult refreshResult = mockMvc.perform(post("/api/auth/refresh")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(refreshJson))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.accessToken").isNotEmpty())
                .andExpect(jsonPath("$.refreshToken").isNotEmpty())
                .andReturn();

        String newRefreshToken = JsonPath.read(refreshResult.getResponse().getContentAsString(), "$.refreshToken");

        // Token cũ phải bị xóa khỏi DB
        assertFalse(refreshTokenRepository.findByToken(oldRefreshToken).isPresent());
        // Token mới phải tồn tại trong DB
        assertTrue(refreshTokenRepository.findByToken(newRefreshToken).isPresent());
    }

    @Test
    @DisplayName("TC-9: Logout thu hồi Refresh Token trong DB -> 204 No Content")
    void testLogout_RevokesToken_Success() throws Exception {
        // 1. Login lấy token
        String loginJson = """
                {
                    "phone": "0902222222",
                    "password": "staff123"
                }
                """;
        MvcResult loginResult = mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(loginJson))
                .andReturn();
        String refreshToken = JsonPath.read(loginResult.getResponse().getContentAsString(), "$.refreshToken");

        // 2. Logout
        String logoutJson = String.format("{\"refreshToken\": \"%s\"}", refreshToken);
        mockMvc.perform(post("/api/auth/logout")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(logoutJson))
                .andExpect(status().isNoContent());

        // Token đã bị xóa
        assertFalse(refreshTokenRepository.findByToken(refreshToken).isPresent());
    }

    @Test
    @DisplayName("TC-10: UC-2 Đăng nhập máy trạm POST /api/sessions/login là Public (Không cần Bearer token)")
    void testCustomerPcLogin_PublicEndpoint_Success() throws Exception {
        String pcLoginJson = String.format("""
                {
                    "phone": "%s",
                    "password": "khach123",
                    "computerCode": "%s"
                }
                """, customerAccount.getPhone(), availablePc.getCode());

        mockMvc.perform(post("/api/sessions/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(pcLoginJson))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.status").value("ACTIVE"))
                .andExpect(jsonPath("$.computerCode").value(availablePc.getCode()));
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
