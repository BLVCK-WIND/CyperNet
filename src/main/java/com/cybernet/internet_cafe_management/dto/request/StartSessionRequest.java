package com.cybernet.internet_cafe_management.dto.request;

/**
 * Request DTO: Yêu cầu mở phiên chơi mới.
 * Hỗ trợ truyền theo computerId HOẶC computerCode (VD: "PC-01") để linh hoạt cho cả máy tính quầy và khách quét QR.
 */
public class StartSessionRequest {

    private Long computerId;
    private String computerCode;
    private Long accountId;

    public StartSessionRequest() {
    }

    public StartSessionRequest(Long computerId, String computerCode, Long accountId) {
        this.computerId = computerId;
        this.computerCode = computerCode;
        this.accountId = accountId;
    }

    public Long getComputerId() {
        return computerId;
    }

    public void setComputerId(Long computerId) {
        this.computerId = computerId;
    }

    public String getComputerCode() {
        return computerCode;
    }

    public void setComputerCode(String computerCode) {
        this.computerCode = computerCode;
    }

    public Long getAccountId() {
        return accountId;
    }

    public void setAccountId(Long accountId) {
        this.accountId = accountId;
    }
}
