package com.cybernet.internet_cafe_management;

import com.cybernet.internet_cafe_management.entity.Account;
import com.cybernet.internet_cafe_management.repository.AccountRepository;
import com.cybernet.internet_cafe_management.security.JwtService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import org.springframework.web.context.WebApplicationContext;

import static org.springframework.security.test.web.servlet.setup.SecurityMockMvcConfigurers.springSecurity;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
public class Phase6ValidationIntegrationTest {

    @Autowired
    private WebApplicationContext context;

    private MockMvc mockMvc;

    @Autowired
    private AccountRepository accountRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private JwtService jwtService;

    private String adminToken;

    @BeforeEach
    void setUp() {
        mockMvc = MockMvcBuilders
                .webAppContextSetup(context)
                .apply(springSecurity())
                .build();

        Account admin = accountRepository.findByPhone("0901111111").orElseGet(() -> {
            Account newAdmin = new Account();
            newAdmin.setPhone("0901111111");
            newAdmin.setName("Admin Root");
            newAdmin.setPasswordHash(passwordEncoder.encode("admin123"));
            newAdmin.setRole(Account.Role.ADMIN);
            return accountRepository.save(newAdmin);
        });
        adminToken = jwtService.generateAccessToken(admin);
    }

    @Test
    @DisplayName("TC-V1: Tạo Account với số điện thoại rỗng -> 400 Bad Request")
    void testCreateAccount_BlankPhone_ShouldFail() throws Exception {
        String invalidJson = """
                {
                    "phone": "",
                    "name": "Nguyen Van A",
                    "password": "pass123",
                    "role": "CUSTOMER"
                }
                """;

        mockMvc.perform(post("/api/accounts")
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(invalidJson))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").isNotEmpty());
    }

    @Test
    @DisplayName("TC-V2: Tạo máy tính với giá mỗi giờ <= 0 -> 400 Bad Request")
    void testCreateComputer_InvalidPrice_ShouldFail() throws Exception {
        String invalidJson = """
                {
                    "code": "PC-TEST-99",
                    "pricePerHour": -5000,
                    "zone": "STANDARD"
                }
                """;

        mockMvc.perform(post("/api/computers")
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(invalidJson))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value("Giá mỗi giờ phải lớn hơn 0"));
    }

    @Test
    @DisplayName("TC-V3: Đăng nhập với phone để trống -> 400 Bad Request")
    void testLogin_BlankPhone_ShouldFail() throws Exception {
        String invalidJson = """
                {
                    "phone": "  ",
                    "password": "some_password"
                }
                """;

        mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(invalidJson))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value("Số điện thoại không được để trống"));
    }

    @Test
    @DisplayName("TC-V4: Tạo đơn hàng với danh sách món rỗng -> 400 Bad Request")
    void testCreateOrder_EmptyItems_ShouldFail() throws Exception {
        String invalidJson = """
                {
                    "sessionId": 1,
                    "paymentMethod": "CASH",
                    "items": []
                }
                """;

        mockMvc.perform(post("/api/orders")
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(invalidJson))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value("Danh sách món đặt không được để trống"));
    }

    @Test
    @DisplayName("TC-V5: Tạo đơn hàng với số lượng món = 0 -> 400 Bad Request")
    void testCreateOrder_ItemQuantityZero_ShouldFail() throws Exception {
        String invalidJson = """
                {
                    "sessionId": 1,
                    "paymentMethod": "CASH",
                    "items": [
                        {
                            "itemId": 1,
                            "quantity": 0
                        }
                    ]
                }
                """;

        mockMvc.perform(post("/api/orders")
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(invalidJson))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value("Số lượng món phải từ 1 trở lên"));
    }

    @Test
    @DisplayName("TC-V6: Nạp giờ chơi với số phút = 0 -> 400 Bad Request")
    void testCreateTimePurchase_ZeroMinutes_ShouldFail() throws Exception {
        String invalidJson = """
                {
                    "accountId": 1,
                    "minutes": 0,
                    "amount": 10000,
                    "paymentMethod": "CASH"
                }
                """;

        mockMvc.perform(post("/api/time-purchases")
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(invalidJson))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value("Số phút mua phải ít nhất là 1 phút"));
    }
}
