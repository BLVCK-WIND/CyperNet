package com.cybernet.internet_cafe_management.dto.request;

import jakarta.validation.constraints.NotBlank;

/**
 * Request DTO: Khách hàng đăng nhập trực tiếp tại máy trạm (UC-2).
 * Cung cấp số điện thoại, mật khẩu và mã máy tính để mở phiên chơi.
 */
public class ComputerLoginRequest {

    @NotBlank(message = "Số điện thoại không được để trống")
    private String phone;

    @NotBlank(message = "Mật khẩu không được để trống")
    private String password;

    @NotBlank(message = "Mã máy tính không được để trống")
    private String computerCode;

    public ComputerLoginRequest() {
    }

    public ComputerLoginRequest(String phone, String password, String computerCode) {
        this.phone = phone;
        this.password = password;
        this.computerCode = computerCode;
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

    public String getComputerCode() {
        return computerCode;
    }

    public void setComputerCode(String computerCode) {
        this.computerCode = computerCode;
    }
}
