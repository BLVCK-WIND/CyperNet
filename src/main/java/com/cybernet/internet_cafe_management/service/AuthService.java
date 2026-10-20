package com.cybernet.internet_cafe_management.service;

import com.cybernet.internet_cafe_management.dto.request.CustomerSessionLoginRequest;
import com.cybernet.internet_cafe_management.dto.request.LoginRequest;
import com.cybernet.internet_cafe_management.dto.request.RefreshTokenRequest;
import com.cybernet.internet_cafe_management.dto.response.AccountResponse;
import com.cybernet.internet_cafe_management.dto.response.AuthResponse;
import com.cybernet.internet_cafe_management.dto.response.CustomerAuthResponse;
import com.cybernet.internet_cafe_management.dto.response.SessionResponse;
import com.cybernet.internet_cafe_management.entity.Account;
import com.cybernet.internet_cafe_management.entity.RefreshToken;
import com.cybernet.internet_cafe_management.entity.Session;
import com.cybernet.internet_cafe_management.exception.ResourceNotFoundException;
import com.cybernet.internet_cafe_management.repository.AccountRepository;
import com.cybernet.internet_cafe_management.repository.RefreshTokenRepository;
import com.cybernet.internet_cafe_management.repository.SessionRepository;
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
    private final SessionRepository sessionRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;

    public AuthService(AccountRepository accountRepository,
                       RefreshTokenRepository refreshTokenRepository,
                       SessionRepository sessionRepository,
                       PasswordEncoder passwordEncoder,
                       JwtService jwtService) {
        this.accountRepository = accountRepository;
        this.refreshTokenRepository = refreshTokenRepository;
        this.sessionRepository = sessionRepository;
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

    /**
     * 4. CUSTOMER SESSION LOGIN — Xác thực khách hàng quét mã QR tại máy trạm
     *    Kiểm tra mã máy có phiên ACTIVE và SĐT khớp với phiên chơi
     *    → Cấp JWT Access Token (ROLE_CUSTOMER) + Refresh Token + SessionResponse
     */
    @Transactional
    public CustomerAuthResponse customerSessionLogin(CustomerSessionLoginRequest request) {
        if (request == null || request.getComputerCode() == null || request.getComputerCode().isBlank()) {
            throw new IllegalArgumentException("Mã máy tính không được để trống!");
        }
        if (request.getPhone() == null || request.getPhone().isBlank()) {
            throw new IllegalArgumentException("Số điện thoại không được để trống!");
        }

        String pcCode = request.getComputerCode().trim();
        String phone = request.getPhone().trim();

        // 1. Tìm phiên đang ACTIVE tại máy
        Session session = sessionRepository.findByComputerCodeAndStatus(pcCode, Session.Status.ACTIVE)
                .orElseThrow(() -> new ResourceNotFoundException("Máy [" + pcCode + "] hiện không có phiên chơi nào đang hoạt động!"));

        // 2. Đối chiếu số điện thoại với tài khoản phiên
        Account account = session.getAccount();
        if (!account.getPhone().equals(phone)) {
            throw new IllegalArgumentException("Số điện thoại không khớp với người đang chơi tại máy " + pcCode + "!");
        }

        // 3. Sinh token với quyền ROLE_CUSTOMER
        String accessToken = jwtService.generateAccessToken(account);
        String refreshTokenStr = createRefreshToken(account);

        return new CustomerAuthResponse(
                accessToken,
                refreshTokenStr,
                jwtService.getAccessTokenExpirationMs(),
                AccountResponse.fromEntity(account),
                SessionResponse.fromEntity(session)
        );
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
