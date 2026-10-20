package com.cybernet.internet_cafe_management.dto.request;

import jakarta.validation.constraints.Size;

/**
 * Request DTO: Yêu cầu chuyển máy tính cho khách hàng (UC-6).
 * Hỗ trợ chuyển theo toComputerId hoặc toComputerCode.
 */
public class TransferComputerRequest {

    private Long toComputerId;
    private String toComputerCode;

    @Size(max = 255, message = "Lý do chuyển máy tối đa 255 ký tự")
    private String reason;

    private Boolean markOldAsMaintenance = false;

    public TransferComputerRequest() {
    }

    public TransferComputerRequest(Long toComputerId, String toComputerCode, String reason, Boolean markOldAsMaintenance) {
        this.toComputerId = toComputerId;
        this.toComputerCode = toComputerCode;
        this.reason = reason;
        this.markOldAsMaintenance = markOldAsMaintenance != null ? markOldAsMaintenance : false;
    }

    public Long getToComputerId() {
        return toComputerId;
    }

    public void setToComputerId(Long toComputerId) {
        this.toComputerId = toComputerId;
    }

    public String getToComputerCode() {
        return toComputerCode;
    }

    public void setToComputerCode(String toComputerCode) {
        this.toComputerCode = toComputerCode;
    }

    public String getReason() {
        return reason;
    }

    public void setReason(String reason) {
        this.reason = reason;
    }

    public Boolean getMarkOldAsMaintenance() {
        return markOldAsMaintenance != null ? markOldAsMaintenance : false;
    }

    public boolean isMarkOldAsMaintenance() {
        return markOldAsMaintenance != null && markOldAsMaintenance;
    }

    public void setMarkOldAsMaintenance(Boolean markOldAsMaintenance) {
        this.markOldAsMaintenance = markOldAsMaintenance != null ? markOldAsMaintenance : false;
    }
}
