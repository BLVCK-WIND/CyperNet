package com.cybernet.internet_cafe_management;

import com.cybernet.internet_cafe_management.dto.request.UpdateAccountRequest;
import com.cybernet.internet_cafe_management.dto.request.UpdateComputerRequest;
import com.cybernet.internet_cafe_management.entity.Account;
import com.cybernet.internet_cafe_management.entity.Computer;
import com.cybernet.internet_cafe_management.repository.AccountRepository;
import com.cybernet.internet_cafe_management.repository.ComputerRepository;
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

import static org.springframework.security.test.web.servlet.setup.SecurityMockMvcConfigurers.springSecurity;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
public class Phase6CrudEndpointsIntegrationTest {

    @Autowired
    private WebApplicationContext context;

    private MockMvc mockMvc;

    @Autowired
    private AccountRepository accountRepository;

    @Autowired
    private ComputerRepository computerRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private JwtService jwtService;

    @Autowired
    private RateLimitingFilter rateLimitingFilter;

    private final ObjectMapper objectMapper = new ObjectMapper();

    private String adminToken;
    private String staffToken;

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

        Account staff = accountRepository.findByPhone("0902222222").orElseGet(() -> {
            Account newStaff = new Account();
            newStaff.setPhone("0902222222");
            newStaff.setName("Staff Member");
            newStaff.setPasswordHash(passwordEncoder.encode("staff123"));
            newStaff.setRole(Account.Role.STAFF);
            return accountRepository.save(newStaff);
        });
        staffToken = jwtService.generateAccessToken(staff);
    }

    @Test
    @DisplayName("TC-CRUD-1: PUT /api/computers/{id} - Cập nhật giá và chuyển bảo trì thành công")
    void testUpdateComputer_Success() throws Exception {
        Computer computer = computerRepository.findByCode("PC-03").orElseGet(() -> {
            Computer c = new Computer();
            c.setCode("PC-03");
            c.setPricePerHour(BigDecimal.valueOf(10000));
            c.setZone(Computer.Zone.STANDARD);
            c.setStatus(Computer.Status.AVAILABLE);
            c.setIpAddress("192.168.1.103");
            return computerRepository.save(c);
        });

        UpdateComputerRequest request = UpdateComputerRequest.builder()
                .code("PC-03")
                .pricePerHour(BigDecimal.valueOf(15000))
                .zone(Computer.Zone.VIP)
                .status(Computer.Status.MAINTENANCE)
                .ipAddress("192.168.1.103")
                .build();

        mockMvc.perform(put("/api/computers/" + computer.getId())
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value("PC-03"))
                .andExpect(jsonPath("$.pricePerHour").value(15000))
                .andExpect(jsonPath("$.zone").value("VIP"))
                .andExpect(jsonPath("$.status").value("MAINTENANCE"));

        // Rollback trạng thái về AVAILABLE để không ảnh hưởng test khác
        computer.setStatus(Computer.Status.AVAILABLE);
        computer.setPricePerHour(BigDecimal.valueOf(10000));
        computer.setZone(Computer.Zone.STANDARD);
        computerRepository.save(computer);
    }

    @Test
    @DisplayName("TC-CRUD-2: PUT /api/accounts/{id} - Admin cập nhật họ tên và đổi mật khẩu tài khoản")
    void testUpdateAccount_Success() throws Exception {
        Account testCustomer = accountRepository.findByPhone("0912345678").orElseGet(() -> {
            Account acc = new Account();
            acc.setPhone("0912345678");
            acc.setName("Customer Old Name");
            acc.setPasswordHash(passwordEncoder.encode("oldpass123"));
            acc.setRole(Account.Role.CUSTOMER);
            acc.setRemainingMinutes(60);
            return accountRepository.save(acc);
        });

        UpdateAccountRequest request = UpdateAccountRequest.builder()
                .name("Customer New Name")
                .password("newsecret123")
                .role(Account.Role.CUSTOMER)
                .build();

        mockMvc.perform(put("/api/accounts/" + testCustomer.getId())
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.name").value("Customer New Name"))
                .andExpect(jsonPath("$.role").value("CUSTOMER"));
    }

    @Test
    @DisplayName("TC-CRUD-3: GET /api/sessions/computer/{computerId} - Lấy lịch sử phiên của máy trạm")
    void testGetSessionsByComputerId_Success() throws Exception {
        Computer computer = computerRepository.findByCode("PC-01").orElseThrow();

        mockMvc.perform(get("/api/sessions/computer/" + computer.getId())
                        .header("Authorization", "Bearer " + staffToken)
                        .param("page", "0")
                        .param("size", "5"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content").isArray())
                .andExpect(jsonPath("$.pageSize").value(5));
    }
}
