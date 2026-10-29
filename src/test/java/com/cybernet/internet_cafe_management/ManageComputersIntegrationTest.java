package com.cybernet.internet_cafe_management;

import com.cybernet.internet_cafe_management.dto.request.CreateComputerRequest;
import com.cybernet.internet_cafe_management.dto.request.UpdateComputerRequest;
import com.cybernet.internet_cafe_management.entity.Account;
import com.cybernet.internet_cafe_management.entity.Computer;
import com.cybernet.internet_cafe_management.entity.Session;
import com.cybernet.internet_cafe_management.repository.AccountRepository;
import com.cybernet.internet_cafe_management.repository.ComputerRepository;
import com.cybernet.internet_cafe_management.repository.SessionRepository;
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
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.springframework.security.test.web.servlet.setup.SecurityMockMvcConfigurers.springSecurity;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
public class ManageComputersIntegrationTest {

    @Autowired
    private WebApplicationContext context;

    private MockMvc mockMvc;

    private final ObjectMapper objectMapper = new ObjectMapper();

    @Autowired
    private ComputerRepository computerRepository;

    @Autowired
    private SessionRepository sessionRepository;

    @Autowired
    private AccountRepository accountRepository;

    @Autowired
    private JwtService jwtService;

    @Autowired
    private PasswordEncoder passwordEncoder;

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
            newAdmin.setName("System Admin");
            newAdmin.setPasswordHash(passwordEncoder.encode("admin123"));
            newAdmin.setRole(Account.Role.ADMIN);
            return accountRepository.save(newAdmin);
        });
        adminToken = jwtService.generateAccessToken(admin);
    }

    @Test
    @DisplayName("TC-COMP-1: POST /api/computers - Tạo máy mới thành công với đầy đủ tham số và status MAINTENANCE")
    void testCreateComputer_Success() throws Exception {
        // Xóa máy test cũ nếu còn sót lại
        computerRepository.findByCode("TEST-99").ifPresent(c -> computerRepository.delete(c));

        CreateComputerRequest request = new CreateComputerRequest();
        request.setCode("TEST-99");
        request.setPricePerHour(BigDecimal.valueOf(18000));
        request.setIpAddress("192.168.10.99");
        request.setZone(Computer.Zone.STREAM);
        request.setStatus(Computer.Status.MAINTENANCE);

        mockMvc.perform(post("/api/computers")
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.code", is("TEST-99")))
                .andExpect(jsonPath("$.ipAddress", is("192.168.10.99")))
                .andExpect(jsonPath("$.zone", is("STREAM")))
                .andExpect(jsonPath("$.status", is("MAINTENANCE")))
                .andExpect(jsonPath("$.pricePerHour", is(18000)));

        // Cleanup
        computerRepository.findByCode("TEST-99").ifPresent(c -> computerRepository.delete(c));
    }

    @Test
    @DisplayName("TC-COMP-2: POST /api/computers - Từ chối khi trùng mã máy hoặc trùng địa chỉ IP")
    void testCreateComputer_DuplicateValidation() throws Exception {
        Computer existing = computerRepository.findByCode("PC-01").orElseThrow();

        // 1. Thử tạo với mã máy trùng
        CreateComputerRequest duplicateCodeReq = new CreateComputerRequest();
        duplicateCodeReq.setCode("PC-01");
        duplicateCodeReq.setPricePerHour(BigDecimal.valueOf(10000));
        duplicateCodeReq.setIpAddress("192.168.10.201");
        duplicateCodeReq.setZone(Computer.Zone.STANDARD);
        duplicateCodeReq.setStatus(Computer.Status.AVAILABLE);

        mockMvc.perform(post("/api/computers")
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(duplicateCodeReq)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value(org.hamcrest.Matchers.containsString("đã tồn tại")));

        // 2. Thử tạo với IP trùng
        CreateComputerRequest duplicateIpReq = new CreateComputerRequest();
        duplicateIpReq.setCode("TEST-UNIQUE");
        duplicateIpReq.setPricePerHour(BigDecimal.valueOf(10000));
        duplicateIpReq.setIpAddress(existing.getIpAddress());
        duplicateIpReq.setZone(Computer.Zone.STANDARD);
        duplicateIpReq.setStatus(Computer.Status.AVAILABLE);

        mockMvc.perform(post("/api/computers")
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(duplicateIpReq)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value(org.hamcrest.Matchers.containsString("đã được sử dụng")));
    }

    @Test
    @DisplayName("TC-COMP-3: PUT /api/computers/{id} - Chuyển đổi trạng thái Bảo Trì (Toggle Maintenance)")
    void testToggleMaintenance_Success() throws Exception {
        Computer computer = computerRepository.findByCode("PC-02").orElseThrow();
        computer.setStatus(Computer.Status.AVAILABLE);
        computerRepository.save(computer);

        // Đưa sang MAINTENANCE
        UpdateComputerRequest toMaintenance = UpdateComputerRequest.builder()
                .code(computer.getCode())
                .pricePerHour(computer.getPricePerHour())
                .zone(computer.getZone())
                .ipAddress(computer.getIpAddress())
                .status(Computer.Status.MAINTENANCE)
                .build();

        mockMvc.perform(put("/api/computers/" + computer.getId())
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(toMaintenance)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status", is("MAINTENANCE")));

        // Đưa lại về AVAILABLE
        toMaintenance.setStatus(Computer.Status.AVAILABLE);
        mockMvc.perform(put("/api/computers/" + computer.getId())
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(toMaintenance)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status", is("AVAILABLE")));
    }

    @Test
    @DisplayName("TC-COMP-4: DELETE & PUT - Chặn thao tác khi máy tính đang có phiên chơi IN_USE")
    void testBlockedWhenInUse() throws Exception {
        Computer computer = computerRepository.findByCode("PC-01").orElseThrow();
        Account customer = accountRepository.findByPhone("0908888888").orElseGet(() -> {
            Account acc = new Account();
            acc.setPhone("0908888888");
            acc.setName("Customer In Use");
            acc.setPasswordHash(passwordEncoder.encode("123456"));
            acc.setRole(Account.Role.CUSTOMER);
            return accountRepository.save(acc);
        });

        // Tạo phiên chơi giả lập đang chạy
        Session activeSession = new Session();
        activeSession.setComputer(computer);
        activeSession.setAccount(customer);
        activeSession.setStatus(Session.Status.ACTIVE);
        activeSession.setStartedAt(LocalDateTime.now().minusMinutes(10));
        activeSession.setExpiresAt(LocalDateTime.now().plusMinutes(50));
        sessionRepository.save(activeSession);

        computer.setStatus(Computer.Status.IN_USE);
        computerRepository.save(computer);

        try {
            // 1. Thử đổi trạng thái sang MAINTENANCE khi máy IN_USE -> Bị chặn 400
            UpdateComputerRequest badUpdate = UpdateComputerRequest.builder()
                    .code(computer.getCode())
                    .pricePerHour(computer.getPricePerHour())
                    .zone(computer.getZone())
                    .ipAddress(computer.getIpAddress())
                    .status(Computer.Status.MAINTENANCE)
                    .build();

            mockMvc.perform(put("/api/computers/" + computer.getId())
                            .header("Authorization", "Bearer " + adminToken)
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(badUpdate)))
                    .andExpect(status().isBadRequest())
                    .andExpect(jsonPath("$.message").value(org.hamcrest.Matchers.containsString("phiên chơi hoạt động")));

            // 2. Thử xóa máy khi đang IN_USE -> Bị chặn 400
            mockMvc.perform(delete("/api/computers/" + computer.getId())
                            .header("Authorization", "Bearer " + adminToken))
                    .andExpect(status().isBadRequest())
                    .andExpect(jsonPath("$.message").value(org.hamcrest.Matchers.containsString("phiên chơi hoạt động")));

        } finally {
            // Dọn dẹp session test
            sessionRepository.delete(activeSession);
            computer.setStatus(Computer.Status.AVAILABLE);
            computerRepository.save(computer);
        }
    }

    @Test
    @DisplayName("TC-COMP-5: DELETE - Xóa thành công máy trạm hợp lệ chưa từng có phiên chơi")
    void testDeleteComputer_Success() throws Exception {
        // Xóa sạch nếu tồn tại từ lần chạy trước
        computerRepository.findByCode("CLEAN-99").ifPresent(c -> computerRepository.delete(c));

        Computer cleanComp = new Computer();
        cleanComp.setCode("CLEAN-99");
        cleanComp.setPricePerHour(BigDecimal.valueOf(12000));
        cleanComp.setIpAddress("192.168.99.99");
        cleanComp.setZone(Computer.Zone.STANDARD);
        cleanComp.setStatus(Computer.Status.AVAILABLE);
        cleanComp = computerRepository.save(cleanComp);

        mockMvc.perform(delete("/api/computers/" + cleanComp.getId())
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isNoContent());

        assertFalse(computerRepository.existsById(cleanComp.getId()));
    }
}
