package com.cybernet.internet_cafe_management.dto.request;

import jakarta.validation.constraints.NotBlank;

/**
 * Request DTO: Đổi Refresh Token lấy Access Token mới.
 */
public class RefreshTokenRequest {

    @NotBlank(message = "Refresh token không được để trống")
    private String refreshToken;

    public RefreshTokenRequest() {
    }

    public RefreshTokenRequest(String refreshToken) {
        this.refreshToken = refreshToken;
    }

    public String getRefreshToken() {
        return refreshToken;
    }

    public void setRefreshToken(String refreshToken) {
        this.refreshToken = refreshToken;
    }
}
