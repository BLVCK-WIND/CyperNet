package com.cybernet.internet_cafe_management.dto.response;

import com.cybernet.internet_cafe_management.entity.Computer.Status;
import com.cybernet.internet_cafe_management.entity.Computer.Zone;

import java.math.BigDecimal;

/**
 * Response DTO: Thông tin công khai khi quét QR để kiểm tra máy tính (không chứa dữ liệu nhạy cảm).
 */
public class SessionCheckResponse {

    private String computerCode;
    private Zone zone;
    private BigDecimal pricePerHour;
    private Status status;
    private boolean hasActiveSession;

    public SessionCheckResponse() {
    }

    public SessionCheckResponse(String computerCode, Zone zone, BigDecimal pricePerHour,
                                Status status, boolean hasActiveSession) {
        this.computerCode = computerCode;
        this.zone = zone;
        this.pricePerHour = pricePerHour;
        this.status = status;
        this.hasActiveSession = hasActiveSession;
    }

    public String getComputerCode() {
        return computerCode;
    }

    public void setComputerCode(String computerCode) {
        this.computerCode = computerCode;
    }

    public Zone getZone() {
        return zone;
    }

    public void setZone(Zone zone) {
        this.zone = zone;
    }

    public BigDecimal getPricePerHour() {
        return pricePerHour;
    }

    public void setPricePerHour(BigDecimal pricePerHour) {
        this.pricePerHour = pricePerHour;
    }

    public Status getStatus() {
        return status;
    }

    public void setStatus(Status status) {
        this.status = status;
    }

    public boolean isHasActiveSession() {
        return hasActiveSession;
    }

    public void setHasActiveSession(boolean hasActiveSession) {
        this.hasActiveSession = hasActiveSession;
    }
}
