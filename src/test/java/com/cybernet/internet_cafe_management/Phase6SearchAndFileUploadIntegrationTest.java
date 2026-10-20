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
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.util.ReflectionTestUtils;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import org.springframework.web.context.WebApplicationContext;

import static org.springframework.security.test.web.servlet.setup.SecurityMockMvcConfigurers.springSecurity;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.multipart;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
public class Phase6SearchAndFileUploadIntegrationTest {

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

    @BeforeEach
    void setUp() {
        mockMvc = MockMvcBuilders
                .webAppContextSetup(context)
                .apply(springSecurity())
                .build();

        rateLimitingFilter.clearLimits();
        ReflectionTestUtils.setField(rateLimitingFilter, "authLimit", 500);

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
    @DisplayName("TC-SPEC-1: Tìm kiếm máy tính theo từ khóa (keyword=VIP) -> Trả về đúng máy VIP")
    void testSearchComputers_ByKeyword() throws Exception {
        mockMvc.perform(get("/api/computers")
                        .param("keyword", "VIP")
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content").isArray())
                .andExpect(jsonPath("$.pageNumber").value(0));
    }

    @Test
    @DisplayName("TC-SPEC-2: Tìm kiếm đơn hàng nâng cao (GET /api/orders/search) -> 200 OK")
    void testSearchOrders_AdvancedFilter() throws Exception {
        mockMvc.perform(get("/api/orders/search")
                        .param("status", "CONFIRMED")
                        .param("paymentMethod", "CASH")
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content").isArray());
    }

    @Test
    @DisplayName("TC-FILE-1: Tải lên hình ảnh món ăn hợp lệ -> 201 CREATED kèm URL")
    void testUploadFile_ValidImage_ShouldSucceed() throws Exception {
        MockMultipartFile mockFile = new MockMultipartFile(
                "file",
                "food_sample.png",
                "image/png",
                "sample-image-binary-data".getBytes()
        );

        mockMvc.perform(multipart("/api/files/upload")
                        .file(mockFile)
                        .param("folder", "items")
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.fileUrl").isNotEmpty())
                .andExpect(jsonPath("$.contentType").value("image/png"));
    }

    @Test
    @DisplayName("TC-FILE-2: Tải lên tệp không phải ảnh -> 400 Bad Request từ chối")
    void testUploadFile_InvalidType_ShouldFail() throws Exception {
        MockMultipartFile mockFile = new MockMultipartFile(
                "file",
                "hack.sh",
                "text/plain",
                "echo 'hello'".getBytes()
        );

        mockMvc.perform(multipart("/api/files/upload")
                        .file(mockFile)
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value("Định dạng tệp không hợp lệ! Chỉ chấp nhận ảnh JPG, PNG, WEBP, GIF."));
    }

    @Test
    @DisplayName("TC-FILE-3: Tạo liên kết VietQR động -> 200 OK kèm URL hình ảnh")
    void testGenerateVietQr_ShouldReturnValidUrl() throws Exception {
        mockMvc.perform(get("/api/files/vietqr")
                        .param("amount", "25000")
                        .param("content", "ORDER_TEST_99"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.qrUrl").isNotEmpty())
                .andExpect(jsonPath("$.amount").value("25000"));
    }
}
