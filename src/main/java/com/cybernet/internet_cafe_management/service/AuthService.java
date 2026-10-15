package com.cybernet.internet_cafe_management.service;

import com.cybernet.internet_cafe_management.dto.request.LoginRequest;
import com.cybernet.internet_cafe_management.dto.request.RefreshTokenRequest;
import com.cybernet.internet_cafe_management.dto.response.AccountResponse;
import com.cybernet.internet_cafe_management.dto.response.AuthResponse;
import com.cybernet.internet_cafe_management.entity.Account;
import com.cybernet.internet_cafe_management.entity.RefreshToken;
import com.cybernet.internet_cafe_management.repository.AccountRepository;
import com.cybernet.internet_cafe_management.repository.RefreshTokenRepository;
import com.cybernet.internet_cafe_management.security.JwtService;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.UUID;

@Service
public class AuthService {

    private final AccountRepository accountRepository;
    private final RefreshTokenRepository refreshTokenRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;

    public AuthService(AccountRepository accountRepository,
                       RefreshTokenRepository refreshTokenRepository,
                       PasswordEncoder passwordEncoder,
                       JwtService jwtService) {
        this.accountRepository = accountRepository;
        this.refreshTokenRepository = refreshTokenRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtService = jwtService;
    }

    /**
     * 1. LOGIN — Xác thực STAFF/ADMIN bằng phone + password
     *    → Cấp Access Token (JWT) + Refresh Token (UUID lưu DB)
     */
    @Transactional
    public AuthResponse login(LoginRequest request) {
        if (request == null || request.getPhone() == null || request.getPhone().isBlank()) {
            throw new IllegalArgumentException("Số điện thoại không được để trống!");
        }
        if (request.getPassword() == null || request.getPassword().isBlank()) {
            throw new IllegalArgumentException("Mật khẩu không được để trống!");
        }

        // Tìm account theo phone
        Account account = accountRepository.findByPhone(request.getPhone().trim())
                .orElseThrow(() -> new IllegalArgumentException("Sai số điện thoại hoặc mật khẩu!"));

        // Verify password BCrypt
        if (!passwordEncoder.matches(request.getPassword(), account.getPasswordHash())) {
            throw new IllegalArgumentException("Sai số điện thoại hoặc mật khẩu!");
        }

        // Chỉ STAFF và ADMIN mới đăng nhập hệ thống quản lý
        if (account.getRole() == Account.Role.CUSTOMER) {
            throw new IllegalArgumentException(
                    "Tài khoản khách hàng vui lòng đăng nhập tại máy trạm!");
        }

        // Sinh tokens
        String accessToken = jwtService.generateAccessToken(account);
        String refreshTokenStr = createRefreshToken(account);

        return new AuthResponse(
                accessToken,
                refreshTokenStr,
                jwtService.getAccessTokenExpirationMs(),
                AccountResponse.fromEntity(account)
        );
    }

    /**
     * 2. REFRESH — Đổi Refresh Token lấy Access Token mới
     *    Áp dụng Refresh Token Rotation: token cũ bị xoá, cấp token mới
     */
    @Transactional
    public AuthResponse refreshToken(RefreshTokenRequest request) {
        if (request == null || request.getRefreshToken() == null || request.getRefreshToken().isBlank()) {
            throw new IllegalArgumentException("Refresh token không được để trống!");
        }

        // Tìm refresh token trong DB
        RefreshToken storedToken = refreshTokenRepository.findByToken(request.getRefreshToken().trim())
                .orElseThrow(() -> new IllegalArgumentException("Refresh token không hợp lệ!"));

        // Kiểm tra hết hạn
        if (storedToken.getExpiresAt().isBefore(LocalDateTime.now())) {
            refreshTokenRepository.delete(storedToken);
            throw new IllegalArgumentException("Refresh token đã hết hạn! Vui lòng đăng nhập lại.");
        }

        Account account = storedToken.getAccount();

        // Rotation: xoá token cũ, tạo token mới
        refreshTokenRepository.delete(storedToken);
        String newAccessToken = jwtService.generateAccessToken(account);
        String newRefreshToken = createRefreshToken(account);

        return new AuthResponse(
                newAccessToken,
                newRefreshToken,
                jwtService.getAccessTokenExpirationMs(),
                AccountResponse.fromEntity(account)
        );
    }

    /**
     * 3. LOGOUT — Xoá Refresh Token khỏi DB
     */
    @Transactional
    public void logout(String refreshToken) {
        refreshTokenRepository.findByToken(refreshToken)
                .ifPresent(refreshTokenRepository::delete);
    }

    // === PRIVATE HELPER ===

    /** Tạo Refresh Token (UUID) và lưu vào DB */
    private String createRefreshToken(Account account) {
        RefreshToken refreshToken = new RefreshToken();
        refreshToken.setToken(UUID.randomUUID().toString());
        refreshToken.setAccount(account);
        refreshToken.setExpiresAt(LocalDateTime.now().plusSeconds(
                jwtService.getRefreshTokenExpirationMs() / 1000));
        refreshTokenRepository.save(refreshToken);
        return refreshToken.getToken();
    }
}
