package com.cybernet.internet_cafe_management.controller;

import com.cybernet.internet_cafe_management.dto.request.LoginRequest;
import com.cybernet.internet_cafe_management.dto.request.RefreshTokenRequest;
import com.cybernet.internet_cafe_management.dto.response.AuthResponse;
import com.cybernet.internet_cafe_management.service.AuthService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

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
    @PostMapping("/login")
    public ResponseEntity<AuthResponse> login(@RequestBody LoginRequest request) {
        AuthResponse response = authService.login(request);
        return ResponseEntity.ok(response);
    }

    /**
     * POST /api/auth/refresh — Đổi Refresh Token lấy Access Token mới
     */
    @PostMapping("/refresh")
    public ResponseEntity<AuthResponse> refresh(@RequestBody RefreshTokenRequest request) {
        AuthResponse response = authService.refreshToken(request);
        return ResponseEntity.ok(response);
    }

    /**
     * POST /api/auth/logout — Huỷ Refresh Token
     */
    @PostMapping("/logout")
    public ResponseEntity<Void> logout(@RequestBody RefreshTokenRequest request) {
        authService.logout(request.getRefreshToken());
        return ResponseEntity.noContent().build();
    }
}
