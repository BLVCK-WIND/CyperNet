package com.cybernet.internet_cafe_management.dto.request;

/**
 * Request DTO: Yêu cầu chuyển máy tính cho khách hàng (UC-6).
 * Hỗ trợ chuyển theo toComputerId hoặc toComputerCode.
 */
public class TransferComputerRequest {

    private Long toComputerId;
    private String toComputerCode;
    private String reason;
    private boolean markOldAsMaintenance;

    public TransferComputerRequest() {
    }

    public TransferComputerRequest(Long toComputerId, String toComputerCode, String reason, boolean markOldAsMaintenance) {
        this.toComputerId = toComputerId;
        this.toComputerCode = toComputerCode;
        this.reason = reason;
        this.markOldAsMaintenance = markOldAsMaintenance;
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

    public boolean isMarkOldAsMaintenance() {
        return markOldAsMaintenance;
    }

    public void setMarkOldAsMaintenance(boolean markOldAsMaintenance) {
        this.markOldAsMaintenance = markOldAsMaintenance;
    }
}
