package com.cybernet.internet_cafe_management.dto.request;

/**
 * Request DTO: Yêu cầu gia hạn thêm giờ chơi cho phiên đang chạy.
 */
public class ExtendSessionRequest {

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
