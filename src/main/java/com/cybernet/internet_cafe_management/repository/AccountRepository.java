package com.cybernet.internet_cafe_management.repository;

import com.cybernet.internet_cafe_management.entity.Account;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface AccountRepository extends JpaRepository<Account, Long> {

    // Tìm kiếm tài khoản theo SĐT (dùng khi đăng nhập hoặc kiểm tra)
    Optional<Account> findByPhone(String phone);

    // Kiểm tra xem SĐT đã có người đăng ký chưa (tránh trùng tài khoản)
    boolean existsByPhone(String phone);
}
