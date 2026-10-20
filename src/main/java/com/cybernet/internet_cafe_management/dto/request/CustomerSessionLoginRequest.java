package com.cybernet.internet_cafe_management.dto.request;

import jakarta.validation.constraints.NotBlank;

/**
 * Request DTO: Khách hàng quét mã QR trên bàn máy tính và nhập SĐT để xác thực phiên chơi.
 */
public class CustomerSessionLoginRequest {

    @NotBlank(message = "Mã máy tính không được để trống")
    private String computerCode;

    @NotBlank(message = "Số điện thoại không được để trống")
    private String phone;

    public CustomerSessionLoginRequest() {
    }

    public CustomerSessionLoginRequest(String computerCode, String phone) {
        this.computerCode = computerCode;
        this.phone = phone;
    }

    public String getComputerCode() {
        return computerCode;
    }

    public void setComputerCode(String computerCode) {
        this.computerCode = computerCode;
    }

    public String getPhone() {
        return phone;
    }

    public void setPhone(String phone) {
        this.phone = phone;
    }
}
