package com.cybernet.internet_cafe_management;

import com.cybernet.internet_cafe_management.dto.request.CreateAccountRequest;
import com.cybernet.internet_cafe_management.dto.request.RegisterCustomerWithDepositRequest;
import com.cybernet.internet_cafe_management.entity.Account;
import com.cybernet.internet_cafe_management.entity.TimePurchase;
import com.cybernet.internet_cafe_management.repository.AccountRepository;
import com.cybernet.internet_cafe_management.repository.TimePurchaseRepository;
import com.cybernet.internet_cafe_management.security.JwtService;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.context.WebApplicationContext;

import java.math.BigDecimal;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.security.test.web.servlet.setup.SecurityMockMvcConfigurers.springSecurity;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
public class CustomerRegistrationWithDepositIntegrationTest {

    @Autowired
    private WebApplicationContext context;

    private MockMvc mockMvc;

    @Autowired
    private AccountRepository accountRepository;

    @Autowired
    private TimePurchaseRepository timePurchaseRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private JwtService jwtService;

    @Autowired
    private ObjectMapper objectMapper;

    private String staffToken;
    private Account staff;

    @BeforeEach
    void setUp() {
        mockMvc = MockMvcBuilders
                .webAppContextSetup(context)
                .apply(springSecurity())
                .build();

        staff = accountRepository.findByPhone("0902222222").orElseGet(() -> {
            Account newStaff = new Account();
            newStaff.setPhone("0902222222");
            newStaff.setName("Staff Test");
            newStaff.setPasswordHash(passwordEncoder.encode("staff123"));
            newStaff.setRole(Account.Role.STAFF);
            return accountRepository.save(newStaff);
        });
        staffToken = jwtService.generateAccessToken(staff);
    }

    @Test
    @DisplayName("TC-REG-1: Đăng ký hội viên thành công với tiền nạp 50.000đ và mật khẩu riêng")
    @Transactional
    void testRegisterCustomer_Success_WithCustomPassword() throws Exception {
        String testPhone = "0981999888";
        // Dọn dẹp nếu tồn tại
        accountRepository.findByPhone(testPhone).ifPresent(accountRepository::delete);

        RegisterCustomerWithDepositRequest request = RegisterCustomerWithDepositRequest.builder()
                .phone(testPhone)
                .name("Trần Tuấn Khôi")
                .password("vipgamer99")
                .initialDeposit(BigDecimal.valueOf(50000))
                .paymentMethod(TimePurchase.PaymentMethod.CASH)
                .build();

        mockMvc.perform(post("/api/accounts/register-with-deposit")
                        .header("Authorization", "Bearer " + staffToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.account.phone").value(testPhone))
                .andExpect(jsonPath("$.account.name").value("Trần Tuấn Khôi"))
                .andExpect(jsonPath("$.account.role").value("CUSTOMER"))
                .andExpect(jsonPath("$.account.remainingMinutes").value(300)) // 50.000 / 10.000 * 60 = 300p
                .andExpect(jsonPath("$.initialPurchase.amount").value(50000))
                .andExpect(jsonPath("$.initialPurchase.status").value("CONFIRMED"))
                .andExpect(jsonPath("$.initialPurchase.paymentMethod").value("CASH"))
                .andExpect(jsonPath("$.initialPassword").value("vipgamer99"));

        Account created = accountRepository.findByPhone(testPhone).orElseThrow();
        assertThat(passwordEncoder.matches("vipgamer99", created.getPasswordHash())).isTrue();
        assertThat(created.getRemainingMinutes()).isEqualTo(300);
        assertThat(created.getRole()).isEqualTo(Account.Role.CUSTOMER);
    }

    @Test
    @DisplayName("TC-REG-2: Đăng ký hội viên thành công với mật khẩu mặc định (4 số cuối của SĐT)")
    @Transactional
    void testRegisterCustomer_Success_WithDefaultPassword_Last4Digits() throws Exception {
        String testPhone = "0977881234";
        accountRepository.findByPhone(testPhone).ifPresent(accountRepository::delete);

        RegisterCustomerWithDepositRequest request = RegisterCustomerWithDepositRequest.builder()
                .phone(testPhone)
                .name("Nguyễn Văn Mặc Định")
                .password("") // Rỗng -> Tự động lấy 4 số cuối là '1234'
                .initialDeposit(BigDecimal.valueOf(20000))
                .paymentMethod(TimePurchase.PaymentMethod.QR)
                .build();

        mockMvc.perform(post("/api/accounts/register-with-deposit")
                        .header("Authorization", "Bearer " + staffToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.account.phone").value(testPhone))
                .andExpect(jsonPath("$.account.remainingMinutes").value(120)) // 20.000 / 10.000 * 60 = 120p
                .andExpect(jsonPath("$.initialPassword").value("1234"))
                .andExpect(jsonPath("$.initialPurchase.status").value("CONFIRMED"));

        Account created = accountRepository.findByPhone(testPhone).orElseThrow();
        assertThat(passwordEncoder.matches("1234", created.getPasswordHash())).isTrue();
    }

    @Test
    @DisplayName("TC-REG-3: Đăng ký thất bại khi số tiền nạp ban đầu nhỏ hơn 10.000đ -> 400 Bad Request")
    void testRegisterCustomer_Fails_WhenDepositLessThan10000() throws Exception {
        RegisterCustomerWithDepositRequest request = RegisterCustomerWithDepositRequest.builder()
                .phone("0912333444")
                .name("Khách Thiếu Tiền")
                .initialDeposit(BigDecimal.valueOf(5000)) // < 10.000đ
                .paymentMethod(TimePurchase.PaymentMethod.CASH)
                .build();

        mockMvc.perform(post("/api/accounts/register-with-deposit")
                        .header("Authorization", "Bearer " + staffToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").exists());
    }

    @Test
    @DisplayName("TC-REG-4: Đăng ký thất bại khi số điện thoại trùng lặp -> 400 Bad Request")
    void testRegisterCustomer_Fails_WhenDuplicatePhone() throws Exception {
        // Sử dụng SĐT staff đang có sẵn
        RegisterCustomerWithDepositRequest request = RegisterCustomerWithDepositRequest.builder()
                .phone(staff.getPhone())
                .name("Khách Trùng SĐT")
                .initialDeposit(BigDecimal.valueOf(10000))
                .paymentMethod(TimePurchase.PaymentMethod.CASH)
                .build();

        mockMvc.perform(post("/api/accounts/register-with-deposit")
                        .header("Authorization", "Bearer " + staffToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value("Số điện thoại này đã được đăng ký trong hệ thống!"));
    }

    @Test
    @DisplayName("TC-REG-5: Chống leo thang đặc quyền (Anti-Privilege Escalation): Staff tạo tài khoản thì luôn bị ép về CUSTOMER")
    @Transactional
    void testStaffRole_CannotCreateAdminAccount_ForcedToCustomer() throws Exception {
        String testPhone = "0944556677";
        accountRepository.findByPhone(testPhone).ifPresent(accountRepository::delete);

        CreateAccountRequest request = new CreateAccountRequest();
        request.setPhone(testPhone);
        request.setName("Hacker Thử Tạo Admin");
        request.setPassword("adminpass99");
        request.setRole(Account.Role.ADMIN); // Staff cố tình gửi role ADMIN

        mockMvc.perform(post("/api/accounts")
                        .header("Authorization", "Bearer " + staffToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.role").value("CUSTOMER")); // Backend tự động hạ về CUSTOMER
    }
}
