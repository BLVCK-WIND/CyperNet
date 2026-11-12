package com.cybernet.internet_cafe_management.service;

import com.cybernet.internet_cafe_management.dto.request.CustomerSessionLoginRequest;
import com.cybernet.internet_cafe_management.dto.request.LoginRequest;
import com.cybernet.internet_cafe_management.dto.request.RefreshTokenRequest;
import com.cybernet.internet_cafe_management.dto.response.AccountResponse;
import com.cybernet.internet_cafe_management.dto.response.AuthResponse;
import com.cybernet.internet_cafe_management.dto.response.CustomerAuthResponse;
import com.cybernet.internet_cafe_management.dto.response.SessionResponse;
import com.cybernet.internet_cafe_management.entity.Account;
import com.cybernet.internet_cafe_management.entity.Computer;
import com.cybernet.internet_cafe_management.entity.RefreshToken;
import com.cybernet.internet_cafe_management.entity.Session;
import com.cybernet.internet_cafe_management.exception.AuthRoleChangedException;
import com.cybernet.internet_cafe_management.exception.ResourceNotFoundException;
import com.cybernet.internet_cafe_management.repository.AccountRepository;
import com.cybernet.internet_cafe_management.repository.ComputerRepository;
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
    private final ComputerRepository computerRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;

    public AuthService(AccountRepository accountRepository,
                       RefreshTokenRepository refreshTokenRepository,
                       SessionRepository sessionRepository,
                       ComputerRepository computerRepository,
                       PasswordEncoder passwordEncoder,
                       JwtService jwtService) {
        this.accountRepository = accountRepository;
        this.refreshTokenRepository = refreshTokenRepository;
        this.sessionRepository = sessionRepository;
        this.computerRepository = computerRepository;
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
        Account account = accountRepository.findByPhoneWithLock(request.getPhone().trim())
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

        String token = request.getRefreshToken().trim();
        Long accountId = refreshTokenRepository.findAccountIdByToken(token)
                .orElseThrow(AuthService::invalidRefreshToken);
        // Role updates and token issuance serialize on the account before touching a refresh row.
        Account account = accountRepository.findByIdWithLock(accountId)
                .orElseThrow(AuthService::invalidRefreshToken);
        RefreshToken storedToken = refreshTokenRepository.findByTokenWithLock(token)
                .orElseThrow(AuthService::invalidRefreshToken);

        // Kiểm tra hết hạn
        if (storedToken.getExpiresAt().isBefore(LocalDateTime.now())) {
            refreshTokenRepository.delete(storedToken);
            throw new IllegalArgumentException("Refresh token đã hết hạn! Vui lòng đăng nhập lại.");
        }

        if (!storedToken.getAccount().getId().equals(accountId) || storedToken.getAuthGeneration() == null) {
            throw invalidRefreshToken();
        }
        if (!storedToken.getAuthGeneration().equals(account.getAuthGeneration())) {
            throw new AuthRoleChangedException();
        }

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

        // 1. Kiểm tra máy tính có tồn tại không
        Computer computer = computerRepository.findByCode(pcCode)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy máy tính với mã: " + pcCode));

        // 2. Tìm phiên đang ACTIVE tại máy (nếu có)
        Session session = sessionRepository.findByComputerCodeAndStatus(pcCode, Session.Status.ACTIVE).orElse(null);

        Account account = accountRepository.findByPhoneWithLock(phone)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Số điện thoại chưa được đăng ký. Vui lòng đăng ký tại quầy."));
        if (account.getRole() != Account.Role.CUSTOMER) {
            throw new org.springframework.security.access.AccessDeniedException(
                    "Trang gọi món chỉ dành cho tài khoản khách hàng.");
        }
        if (session != null && !session.getAccount().getId().equals(account.getId())) {
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
                (session != null) ? SessionResponse.fromEntity(session) : null,
                computer.getCode(),
                computer.getZone()
        );
    }

    // === PRIVATE HELPER ===

    private static IllegalArgumentException invalidRefreshToken() {
        return new IllegalArgumentException("Refresh token không hợp lệ!");
    }

    /** Tạo Refresh Token (UUID) và lưu vào DB */
    private String createRefreshToken(Account account) {
        RefreshToken refreshToken = new RefreshToken();
        refreshToken.setToken(UUID.randomUUID().toString());
        refreshToken.setAccount(account);
        refreshToken.setAuthGeneration(account.getAuthGeneration());
        refreshToken.setExpiresAt(LocalDateTime.now().plusSeconds(
                jwtService.getRefreshTokenExpirationMs() / 1000));
        refreshTokenRepository.save(refreshToken);
        return refreshToken.getToken();
    }
}
