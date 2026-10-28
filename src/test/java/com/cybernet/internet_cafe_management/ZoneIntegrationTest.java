package com.cybernet.internet_cafe_management;

import com.cybernet.internet_cafe_management.dto.request.CreateZoneRequest;
import com.cybernet.internet_cafe_management.dto.request.UpdateZoneRequest;
import com.cybernet.internet_cafe_management.entity.Account;
import com.cybernet.internet_cafe_management.entity.Computer;
import com.cybernet.internet_cafe_management.entity.Zone;
import com.cybernet.internet_cafe_management.repository.AccountRepository;
import com.cybernet.internet_cafe_management.repository.ComputerRepository;
import com.cybernet.internet_cafe_management.repository.ZoneRepository;
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

import static org.hamcrest.Matchers.*;
import static org.springframework.security.test.web.servlet.setup.SecurityMockMvcConfigurers.springSecurity;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
public class ZoneIntegrationTest {

    @Autowired
    private WebApplicationContext context;

    private MockMvc mockMvc;

    @Autowired
    private AccountRepository accountRepository;

    @Autowired
    private ZoneRepository zoneRepository;

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
        context.getBean(org.springframework.jdbc.core.JdbcTemplate.class)
                .update("DELETE FROM computers WHERE code = 'PC-ZONE-TEST'");

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
    @DisplayName("TC-ZONE-1: GET /api/zones - Lấy danh sách zones mặc định thành công")
    void testGetAllZones_Success() throws Exception {
        mockMvc.perform(get("/api/zones")
                        .header("Authorization", "Bearer " + staffToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(greaterThanOrEqualTo(2))))
                .andExpect(jsonPath("$[*].code", hasItems("STANDARD", "VIP")));
    }

    @Test
    @DisplayName("TC-ZONE-2: GET /api/zones/active - Lấy danh sách zones active phục vụ Dropdown")
    void testGetActiveZones_Success() throws Exception {
        mockMvc.perform(get("/api/zones/active")
                        .header("Authorization", "Bearer " + staffToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(greaterThanOrEqualTo(2))));
    }

    @Test
    @DisplayName("TC-ZONE-3: POST /api/zones - Admin tạo mới zone thành công")
    void testCreateZone_AdminSuccess() throws Exception {
        // Dọn dẹp nếu đã tồn tại
        zoneRepository.findByCodeIgnoreCase("STREAM_TEST").ifPresent(zoneRepository::delete);

        CreateZoneRequest request = CreateZoneRequest.builder()
                .code("STREAM_TEST")
                .name("Khu Stream Cao Cấp")
                .defaultPricePerHour(BigDecimal.valueOf(25000))
                .colorCode("#8b5cf6")
                .description("Phòng live stream cách âm 2 màn hình")
                .active(true)
                .build();

        mockMvc.perform(post("/api/zones")
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.code").value("STREAM_TEST"))
                .andExpect(jsonPath("$.name").value("Khu Stream Cao Cấp"))
                .andExpect(jsonPath("$.defaultPricePerHour").value(25000))
                .andExpect(jsonPath("$.colorCode").value("#8b5cf6"));

        // Dọn dẹp sau test
        zoneRepository.findByCodeIgnoreCase("STREAM_TEST").ifPresent(zoneRepository::delete);
    }

    @Test
    @DisplayName("TC-ZONE-4: POST /api/zones - Báo lỗi khi tạo trùng mã khu vực")
    void testCreateZone_DuplicateCode() throws Exception {
        CreateZoneRequest request = CreateZoneRequest.builder()
                .code("STANDARD") // Mã đã tồn tại
                .name("Khu Tiêu Chuẩn Trùng Lặp")
                .defaultPricePerHour(BigDecimal.valueOf(10000))
                .colorCode("#434e60")
                .build();

        mockMvc.perform(post("/api/zones")
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.errorCode").value("ZONE_ALREADY_EXISTS"));
    }

    @Test
    @DisplayName("TC-ZONE-5: POST /api/zones - Nhân viên (STAFF) bị chặn tạo zone (403 Forbidden)")
    void testCreateZone_StaffForbidden() throws Exception {
        CreateZoneRequest request = CreateZoneRequest.builder()
                .code("HACK_ZONE")
                .name("Khu Vực Bất Hợp Pháp")
                .defaultPricePerHour(BigDecimal.valueOf(50000))
                .build();

        mockMvc.perform(post("/api/zones")
                        .header("Authorization", "Bearer " + staffToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isForbidden());
    }

    @Test
    @DisplayName("TC-ZONE-6: PUT /api/zones/{id} - Admin cập nhật thông tin zone thành công")
    void testUpdateZone_Success() throws Exception {
        // Tạo một zone tạm thời để update
        zoneRepository.findByCodeIgnoreCase("TMP_UPDATE").ifPresent(zoneRepository::delete);
        Zone tempZone = zoneRepository.save(Zone.builder()
                .code("TMP_UPDATE")
                .name("Zone Ban Đầu")
                .defaultPricePerHour(BigDecimal.valueOf(18000))
                .colorCode("#bd9875")
                .active(true)
                .build());

        UpdateZoneRequest updateRequest = UpdateZoneRequest.builder()
                .name("Zone Đã Đổi Tên")
                .defaultPricePerHour(BigDecimal.valueOf(22000))
                .colorCode("#06b6d4")
                .description("Mô tả mới")
                .active(true)
                .build();

        mockMvc.perform(put("/api/zones/" + tempZone.getId())
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(updateRequest)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.name").value("Zone Đã Đổi Tên"))
                .andExpect(jsonPath("$.defaultPricePerHour").value(22000))
                .andExpect(jsonPath("$.colorCode").value("#06b6d4"));

        // Dọn dẹp
        zoneRepository.delete(tempZone);
    }

    @Test
    @DisplayName("TC-ZONE-7: DELETE /api/zones/{id} - Chặn tuyệt đối xóa zone hệ thống STANDARD/VIP")
    void testDeleteZone_SystemZoneForbidden() throws Exception {
        Zone standardZone = zoneRepository.findByCodeIgnoreCase("STANDARD").orElseThrow();

        mockMvc.perform(delete("/api/zones/" + standardZone.getId())
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message", containsString("Không thể xóa khu vực mặc định")));
    }

    @Test
    @DisplayName("TC-ZONE-8: DELETE /api/zones/{id} - Chặn xóa zone khi có máy trạm đang sử dụng (ZONE_IN_USE)")
    void testDeleteZone_ZoneInUseForbidden() throws Exception {
        // Tạo zone STREAM nếu chưa có
        Zone zone = zoneRepository.findByCodeIgnoreCase("STREAM").orElseGet(() -> {
            return zoneRepository.save(Zone.builder()
                    .code("STREAM")
                    .name("Khu Stream Gaming")
                    .defaultPricePerHour(BigDecimal.valueOf(25000))
                    .colorCode("#8b5cf6")
                    .active(true)
                    .build());
        });

        // Tạo máy tính PC-ZONE-TEST thuộc zone STREAM
        context.getBean(org.springframework.jdbc.core.JdbcTemplate.class)
                .update("DELETE FROM computers WHERE code = 'PC-ZONE-TEST'");
        Computer computer = new Computer();
        computer.setCode("PC-ZONE-TEST");
        computer.setPricePerHour(BigDecimal.valueOf(25000));
        computer.setZone(Computer.Zone.STREAM);
        computer.setStatus(Computer.Status.AVAILABLE);
        computer.setIpAddress("192.168.99.99");
        computerRepository.save(computer);

        // Thử xóa zone STREAM -> Phải bị chặn với lỗi ZONE_IN_USE
        mockMvc.perform(delete("/api/zones/" + zone.getId())
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.errorCode").value("ZONE_IN_USE"));

        // Dọn dẹp sau test
        context.getBean(org.springframework.jdbc.core.JdbcTemplate.class)
                .update("DELETE FROM computers WHERE code = 'PC-ZONE-TEST'");
        zoneRepository.delete(zone);
    }
}
