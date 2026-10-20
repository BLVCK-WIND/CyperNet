package com.cybernet.internet_cafe_management.dto.request;

import jakarta.validation.constraints.Min;

/**
 * Request DTO: Yêu cầu gia hạn thêm giờ chơi cho phiên đang chạy.
 */
public class ExtendSessionRequest {

    @Min(value = 1, message = "Số phút gia hạn phải ít nhất là 1 phút")
    private int extraMinutes;

    public ExtendSessionRequest() {
    }

    public ExtendSessionRequest(int extraMinutes) {
        this.extraMinutes = extraMinutes;
    }

    public int getExtraMinutes() {
        return extraMinutes;
    }

    public void setExtraMinutes(int extraMinutes) {
        this.extraMinutes = extraMinutes;
    }
}
