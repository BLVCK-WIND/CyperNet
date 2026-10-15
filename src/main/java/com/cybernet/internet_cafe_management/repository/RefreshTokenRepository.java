package com.cybernet.internet_cafe_management.repository;

import com.cybernet.internet_cafe_management.entity.RefreshToken;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.Optional;

@Repository
public interface RefreshTokenRepository extends JpaRepository<RefreshToken, Long> {

    // Tìm refresh token theo token string
    Optional<RefreshToken> findByToken(String token);

    // Xoá tất cả refresh token của 1 account (dùng khi logout toàn bộ thiết bị)
    void deleteByAccountId(Long accountId);

    // Xoá token đã hết hạn (dùng cho scheduled cleanup)
    @Modifying
    @Query("DELETE FROM RefreshToken rt WHERE rt.expiresAt < :now")
    int deleteExpiredTokens(LocalDateTime now);
}
