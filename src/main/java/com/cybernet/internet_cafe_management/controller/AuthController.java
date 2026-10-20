package com.cybernet.internet_cafe_management.controller;

import com.cybernet.internet_cafe_management.dto.request.CustomerSessionLoginRequest;
import com.cybernet.internet_cafe_management.dto.request.LoginRequest;
import com.cybernet.internet_cafe_management.dto.request.RefreshTokenRequest;
import com.cybernet.internet_cafe_management.dto.response.AuthResponse;
import com.cybernet.internet_cafe_management.dto.response.CustomerAuthResponse;
import com.cybernet.internet_cafe_management.service.AuthService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@Tag(name = "Authentication", description = "APIs xác thực đăng nhập, cấp lại token và đăng xuất (JWT)")
@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final AuthService authService;

    public AuthController(AuthService authService) {
        this.authService = authService;
    }

    /**
     * POST /api/auth/login — Đăng nhập (STAFF/ADMIN)
     * Trả về Access Token + Refresh Token + thông tin account
     */
    @Operation(summary = "Đăng nhập hệ thống", description = "Đăng nhập bằng số điện thoại và mật khẩu dành cho Nhân viên (STAFF) và Quản trị viên (ADMIN).")
    @PostMapping("/login")
    public ResponseEntity<AuthResponse> login(@Valid @RequestBody LoginRequest request) {
        AuthResponse response = authService.login(request);
        return ResponseEntity.ok(response);
    }

    /**
     * POST /api/auth/refresh — Đổi Refresh Token lấy Access Token mới
     */
    @Operation(summary = "Làm mới Access Token", description = "Sử dụng Refresh Token còn hiệu lực để cấp cặp Access Token mới mà không cần đăng nhập lại.")
    @PostMapping("/refresh")
    public ResponseEntity<AuthResponse> refresh(@Valid @RequestBody RefreshTokenRequest request) {
        AuthResponse response = authService.refreshToken(request);
        return ResponseEntity.ok(response);
    }

    /**
     * POST /api/auth/logout — Huỷ Refresh Token
     */
    @Operation(summary = "Đăng xuất tài khoản", description = "Thu hồi và xóa Refresh Token khỏi cơ sở dữ liệu.")
    @PostMapping("/logout")
    public ResponseEntity<Void> logout(@Valid @RequestBody RefreshTokenRequest request) {
        authService.logout(request.getRefreshToken());
        return ResponseEntity.noContent().build();
    }

    /**
     * POST /api/auth/customer-session-login — Khách hàng quét mã QR tại máy nhập SĐT xác thực phiên
     * Cấp Access Token quyền ROLE_CUSTOMER + Refresh Token + thông tin phiên chơi hiện tại
     */
    @Operation(summary = "Xác thực phiên chơi khách hàng qua QR", description = "Dành cho khách hàng dùng điện thoại quét mã QR tại máy và nhập số điện thoại để gọi món và nạp giờ.")
    @PostMapping("/customer-session-login")
    public ResponseEntity<CustomerAuthResponse> customerSessionLogin(@Valid @RequestBody CustomerSessionLoginRequest request) {
        CustomerAuthResponse response = authService.customerSessionLogin(request);
        return ResponseEntity.ok(response);
    }
}
