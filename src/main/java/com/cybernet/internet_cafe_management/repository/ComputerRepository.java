package com.cybernet.internet_cafe_management.repository;

import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import com.cybernet.internet_cafe_management.entity.Computer;
import jakarta.persistence.LockModeType;

@Repository
public interface ComputerRepository extends JpaRepository<Computer, Long> {
    boolean existsByCode(String code);

    Optional<Computer> findByCode(String code);

    // Khóa bi quan (Pessimistic Lock) khi mở máy hoặc chuyển máy theo ID - Dùng nativeQuery tương thích mọi phiên bản MySQL/MariaDB
    @Query(value = "SELECT * FROM computers WHERE id = :id FOR UPDATE", nativeQuery = true)
    Optional<Computer> findByIdWithLock(@Param("id") Long id);

    // Khóa bi quan (Pessimistic Lock) khi mở máy hoặc chuyển máy theo Code - Dùng nativeQuery tương thích mọi phiên bản MySQL/MariaDB
    @Query(value = "SELECT * FROM computers WHERE code = :code FOR UPDATE", nativeQuery = true)
    Optional<Computer> findByCodeWithLock(@Param("code") String code);
}
