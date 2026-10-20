package com.cybernet.internet_cafe_management;

import com.cybernet.internet_cafe_management.repository.AccountRepository;
import com.cybernet.internet_cafe_management.repository.ComputerRepository;
import com.cybernet.internet_cafe_management.repository.ItemRepository;
import org.flywaydb.core.Flyway;
import org.flywaydb.core.api.MigrationInfo;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;

import java.util.Arrays;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest
public class Phase5FlywayIntegrationTest {

    @Autowired(required = false)
    private Flyway flyway;

    @Autowired
    private AccountRepository accountRepository;

    @Autowired
    private ComputerRepository computerRepository;

    @Autowired
    private ItemRepository itemRepository;

    @Test
    @DisplayName("TC-1: Flyway bean được khởi tạo thành công và quản lý database migration")
    void testFlywayBeanIsLoaded() {
        assertNotNull(flyway, "Flyway bean phải được Spring Boot tự động cấu hình và nạp vào ApplicationContext");
    }

    @Test
    @DisplayName("TC-2: Các migration script V1 (schema) và V2 (seed data) đã được áp dụng thành công")
    void testFlywayMigrationsApplied() {
        assertNotNull(flyway);
        MigrationInfo[] appliedMigrations = flyway.info().applied();
        assertTrue(appliedMigrations.length >= 2, "Phải có ít nhất 2 bản migration V1 và V2 được áp dụng");

        List<String> versions = Arrays.stream(appliedMigrations)
                .map(m -> m.getVersion().getVersion())
                .toList();

        assertTrue(versions.contains("1"), "Bản migration V1 phải được áp dụng");
        assertTrue(versions.contains("2"), "Bản migration V2 phải được áp dụng");

        // Phiên bản schema hiện tại phải từ version 2 trở lên
        MigrationInfo current = flyway.info().current();
        assertNotNull(current);
        assertTrue(Integer.parseInt(current.getVersion().getVersion()) >= 2);
    }

    @Test
    @DisplayName("TC-3: Dữ liệu khởi tạo (Seed Data) từ V2__initial_seed_data.sql đã có mặt trong cơ sở dữ liệu")
    void testSeedDataPresentInDatabase() {
        // 1. Kiểm tra tài khoản Admin mặc định
        assertTrue(accountRepository.findByPhone("0901111111").isPresent(), 
                "Tài khoản Admin mặc định (0901111111) từ migration V2 phải tồn tại trong DB");

        // 2. Kiểm tra tài khoản Staff mặc định
        assertTrue(accountRepository.findByPhone("0902222222").isPresent(), 
                "Tài khoản Staff mặc định (0902222222) từ migration V2 phải tồn tại trong DB");

        // 3. Kiểm tra máy trạm ban đầu
        assertTrue(computerRepository.findByCode("PC-01").isPresent(), 
                "Máy trạm PC-01 từ migration V2 phải tồn tại trong DB");

        // 4. Kiểm tra danh sách máy trạm đã được nạp
        assertTrue(computerRepository.count() >= 4, 
                "Số lượng máy trạm trong hệ thống phải có ít nhất 4 máy từ dữ liệu khởi tạo");
    }
}
