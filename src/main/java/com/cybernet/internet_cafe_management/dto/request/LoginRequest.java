package com.cybernet.internet_cafe_management.dto.request;

import jakarta.validation.constraints.NotBlank;

/**
 * Request DTO: Đăng nhập hệ thống quản lý (STAFF/ADMIN).
 * Client gửi số điện thoại + mật khẩu để nhận JWT tokens.
 */
public class LoginRequest {

    @NotBlank(message = "Số điện thoại không được để trống")
    private String phone;

    @NotBlank(message = "Mật khẩu không được để trống")
    private String password;

    public LoginRequest() {
    }

    public LoginRequest(String phone, String password) {
        this.phone = phone;
        this.password = password;
    }

    public String getPhone() {
        return phone;
    }

    public void setPhone(String phone) {
        this.phone = phone;
    }

    public String getPassword() {
        return password;
    }

    public void setPassword(String password) {
        this.password = password;
    }
}
