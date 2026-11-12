package com.cybernet.internet_cafe_management.repository;

import com.cybernet.internet_cafe_management.entity.Account;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface AccountRepository extends JpaRepository<Account, Long>, org.springframework.data.jpa.repository.JpaSpecificationExecutor<Account> {

    interface RoleTotals {
        Account.Role getRole();
        long getAccountCount();
        long getRemainingMinutes();
    }

    @org.springframework.data.jpa.repository.Query("select a.role as role, count(a) as accountCount, coalesce(sum(a.remainingMinutes), 0) as remainingMinutes from Account a group by a.role")
    java.util.List<RoleTotals> summarizeRoles();

    @org.springframework.data.jpa.repository.Query("select a.role as role, count(a) as accountCount, coalesce(sum(a.remainingMinutes), 0) as remainingMinutes from Account a where a.role = :role group by a.role")
    java.util.List<RoleTotals> summarizeRole(@org.springframework.data.repository.query.Param("role") Account.Role role);

    @org.springframework.data.jpa.repository.Query(value = "SELECT * FROM accounts WHERE id = :id FOR UPDATE", nativeQuery = true)
    java.util.Optional<Account> findByIdWithLock(@org.springframework.data.repository.query.Param("id") Long id);

    @org.springframework.data.jpa.repository.Query(value = "SELECT * FROM accounts WHERE phone = :phone FOR UPDATE", nativeQuery = true)
    java.util.Optional<Account> findByPhoneWithLock(@org.springframework.data.repository.query.Param("phone") String phone);

    // Tìm kiếm tài khoản theo SĐT (dùng khi đăng nhập hoặc kiểm tra)
    Optional<Account> findByPhone(String phone);

    // Kiểm tra xem SĐT đã có người đăng ký chưa (tránh trùng tài khoản)
    boolean existsByPhone(String phone);

    // Phân trang danh sách tài khoản theo vai trò
    Page<Account> findByRole(Account.Role role, Pageable pageable);

    // Đếm số lượng tài khoản theo vai trò (dùng để bảo vệ ADMIN duy nhất)
    long countByRole(Account.Role role);
}
