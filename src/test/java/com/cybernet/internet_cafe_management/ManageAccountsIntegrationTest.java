package com.cybernet.internet_cafe_management;

import com.cybernet.internet_cafe_management.dto.request.CreateAccountRequest;
import com.cybernet.internet_cafe_management.dto.request.UpdateAccountRequest;
import com.cybernet.internet_cafe_management.entity.Account;
import com.cybernet.internet_cafe_management.entity.Computer;
import com.cybernet.internet_cafe_management.entity.Session;
import com.cybernet.internet_cafe_management.repository.*;
import com.cybernet.internet_cafe_management.security.JwtService;
import com.cybernet.internet_cafe_management.security.RateLimitingFilter;
import com.fasterxml.jackson.databind.ObjectMapper;
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

import java.math.BigDecimal;
import java.time.LocalDateTime;

import static org.hamcrest.Matchers.is;
import static org.junit.jupiter.api.Assertions.*;
import static org.springframework.security.test.web.servlet.setup.SecurityMockMvcConfigurers.springSecurity;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
public class ManageAccountsIntegrationTest {

    @Autowired
    private WebApplicationContext context;

    private MockMvc mockMvc;

    private final ObjectMapper objectMapper = new ObjectMapper();

    @Autowired
    private AccountRepository accountRepository;

    @Autowired
    private SessionRepository sessionRepository;

    @Autowired
    private ComputerRepository computerRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private JwtService jwtService;

    @Autowired
    private RateLimitingFilter rateLimitingFilter;

    private String adminToken;
    private Account adminAccount;

    @BeforeEach
    public void setUp() {
        mockMvc = MockMvcBuilders
                .webAppContextSetup(context)
                .apply(springSecurity())
                .build();

        rateLimitingFilter.clearLimits();
        ReflectionTestUtils.setField(rateLimitingFilter, "authLimit", 500);

        // Đảm bảo có tài khoản Admin kiểm thử (0901111111)
        adminAccount = accountRepository.findByPhone("0901111111").orElseGet(() -> {
            Account acc = new Account();
            acc.setPhone("0901111111");
            acc.setName("Admin Root CyberNet");
            acc.setPasswordHash(passwordEncoder.encode("admin123"));
            acc.setRole(Account.Role.ADMIN);
            return accountRepository.save(acc);
        });

        adminToken = jwtService.generateAccessToken(adminAccount);
    }

    @Test
    @DisplayName("Test 1: Tạo tài khoản mới & Auto-trim phone, name chuẩn xác")
    public void testCreateAccount_SuccessAndTrim() throws Exception {
        String testPhone = "0988771122";
        accountRepository.findByPhone(testPhone).ifPresent(a -> accountRepository.delete(a));

        CreateAccountRequest req = new CreateAccountRequest(
                testPhone,
                "  Nguyễn Văn Staff Cyber  ",
                "staff123",
                Account.Role.STAFF
        );

        mockMvc.perform(post("/api/accounts")
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.phone", is(testPhone)))
                .andExpect(jsonPath("$.name", is("Nguyễn Văn Staff Cyber")))
                .andExpect(jsonPath("$.role", is("STAFF")));

        // Kiểm tra trong database: chuỗi name đã được trim và mật khẩu được mã hóa BCrypt
        Account created = accountRepository.findByPhone(testPhone).orElseThrow();
        assertEquals(testPhone, created.getPhone());
        assertEquals("Nguyễn Văn Staff Cyber", created.getName());
        assertTrue(passwordEncoder.matches("staff123", created.getPasswordHash()));

        // Teardown
        accountRepository.delete(created);
    }

    @Test
    @DisplayName("Test 2: Chặn tạo trùng Số điện thoại (HTTP 400)")
    public void testCreateAccount_DuplicatePhone_ThrowsBadRequest() throws Exception {
        CreateAccountRequest dupReq = new CreateAccountRequest(
                "0901111111", // Đã tồn tại của admin
                "Kẻ Mạo Danh Admin",
                "password123",
                Account.Role.CUSTOMER
        );

        mockMvc.perform(post("/api/accounts")
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(dupReq)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message", is("Số điện thoại này đã được đăng ký!")));
    }

    @Test
    @DisplayName("Test 3: Chặn Admin tự xóa chính tài khoản của mình (HTTP 400)")
    public void testDeleteAccount_SelfDelete_ThrowsBadRequest() throws Exception {
        mockMvc.perform(delete("/api/accounts/" + adminAccount.getId())
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message", is("Bạn không thể xóa tài khoản đang đăng nhập của chính mình!")));
    }

    @Test
    @DisplayName("Test 4: Chặn xóa hoặc hạ quyền tài khoản ADMIN duy nhất còn lại trong hệ thống")
    public void testAdminProtection_LastAdmin() throws Exception {
        // Tạo thêm 1 Admin thứ 2 để test thao tác trên Admin khác
        Account admin2 = new Account();
        admin2.setPhone("0909999888");
        admin2.setName("Admin Phụ Số 2");
        admin2.setPasswordHash(passwordEncoder.encode("admin123"));
        admin2.setRole(Account.Role.ADMIN);
        accountRepository.save(admin2);

        // Lúc này có 2 Admin -> Admin 1 xóa Admin 2 thành công
        mockMvc.perform(delete("/api/accounts/" + admin2.getId())
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isNoContent());

        assertFalse(accountRepository.existsById(admin2.getId()));

        // Sau khi xóa admin2, hệ thống chỉ còn đúng 1 Admin (adminAccount)
        // Tạo một Staff để thử xóa xem có bị nhầm lẫn không
        Account testStaff = new Account();
        testStaff.setPhone("0907777666");
        testStaff.setName("Staff Test Protection");
        testStaff.setPasswordHash(passwordEncoder.encode("staff123"));
        testStaff.setRole(Account.Role.STAFF);
        accountRepository.save(testStaff);

        // Sinh token từ testStaff để gọi xóa Admin duy nhất -> Bị Security chặn 403 (không phải ADMIN)
        String staffToken = jwtService.generateAccessToken(testStaff);
        mockMvc.perform(delete("/api/accounts/" + adminAccount.getId())
                        .header("Authorization", "Bearer " + staffToken))
                .andExpect(status().isForbidden());

        // Teardown testStaff
        accountRepository.delete(testStaff);
    }

    @Test
    @DisplayName("Test 5: Chặn xóa tài khoản đang có phiên chơi ACTIVE hoặc đã có lịch sử nạp giờ / đơn hàng")
    public void testDeleteAccount_ActiveSessionAndHistory_Blocked() throws Exception {
        String custPhone = "0977889911";
        accountRepository.findByPhone(custPhone).ifPresent(a -> {
            sessionRepository.findByAccountIdOrderByStartedAtDesc(a.getId()).forEach(sessionRepository::delete);
            accountRepository.delete(a);
        });

        // Tạo máy tính và khách hàng
        Computer comp = computerRepository.findByCode("PC-TEST-ACC").orElseGet(() -> {
            Computer c = new Computer();
            c.setCode("PC-TEST-ACC");
            c.setIpAddress("192.168.10.99");
            c.setZone(Computer.Zone.STANDARD);
            c.setPricePerHour(BigDecimal.valueOf(10000));
            c.setStatus(Computer.Status.AVAILABLE);
            return computerRepository.save(c);
        });

        Account customer = new Account();
        customer.setPhone(custPhone);
        customer.setName("Khách Hàng Đang Chơi");
        customer.setPasswordHash(passwordEncoder.encode("123456"));
        customer.setRole(Account.Role.CUSTOMER);
        customer.setRemainingMinutes(120);
        customer = accountRepository.save(customer);

        // Tạo phiên chơi ACTIVE
        Session session = new Session();
        session.setAccount(customer);
        session.setComputer(comp);
        session.setStatus(Session.Status.ACTIVE);
        session.setStartedAt(LocalDateTime.now());
        session.setExpiresAt(LocalDateTime.now().plusHours(2));
        session = sessionRepository.save(session);

        // 1. Thử xóa tài khoản khi đang có phiên chơi ACTIVE -> Chặn 400
        mockMvc.perform(delete("/api/accounts/" + customer.getId())
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message", is("Tài khoản đang có phiên chơi hoạt động trên máy trạm! Vui lòng kết thúc phiên chơi trước khi xóa.")));

        // 2. Thử đổi vai trò của khách sang STAFF khi đang chơi -> Chặn 400
        UpdateAccountRequest updateReq = new UpdateAccountRequest("Khách Lên Nhân Viên", null, Account.Role.STAFF);
        mockMvc.perform(put("/api/accounts/" + customer.getId())
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(updateReq)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message", is("Tài khoản đang có phiên chơi hoạt động trên máy trạm! Không thể thay đổi vai trò lúc này.")));

        // Đóng phiên chơi -> chuyển sang ENDED
        session.setStatus(Session.Status.ENDED);
        session.setEndedAt(LocalDateTime.now());
        sessionRepository.save(session);

        // 3. Lúc này phiên đã ENDED, nhưng đã có lịch sử trong sessions -> Thử xóa -> Safe Delete chặn 400
        mockMvc.perform(delete("/api/accounts/" + customer.getId())
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message", is("Tài khoản này đã phát sinh lịch sử giao dịch (nạp giờ / phiên chơi / hóa đơn). Không thể xóa để bảo toàn dữ liệu sổ sách kế toán!")));

        // Teardown
        sessionRepository.delete(session);
        accountRepository.delete(customer);
        computerRepository.delete(comp);
    }

    @Test
    @DisplayName("Test 6: Xóa thành công tài khoản mới tạo chưa phát sinh giao dịch nào (Clean Delete)")
    public void testDeleteAccount_CleanNewAccount_Success() throws Exception {
        Account newCleanAccount = new Account();
        newCleanAccount.setPhone("0999000111");
        newCleanAccount.setName("Tài Khoản Rác Mới Tạo");
        newCleanAccount.setPasswordHash(passwordEncoder.encode("123456"));
        newCleanAccount.setRole(Account.Role.CUSTOMER);
        newCleanAccount = accountRepository.save(newCleanAccount);

        mockMvc.perform(delete("/api/accounts/" + newCleanAccount.getId())
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isNoContent());

        assertFalse(accountRepository.existsById(newCleanAccount.getId()));
    }
}
