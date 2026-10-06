package com.cybernet.internet_cafe_management.dto.response;

import com.cybernet.internet_cafe_management.entity.Computer.Zone;
import com.cybernet.internet_cafe_management.entity.Session;
import com.cybernet.internet_cafe_management.entity.Session.Status;

import java.math.BigDecimal;
import java.time.Duration;
import java.time.LocalDateTime;

/**
 * Response DTO: Làm phẳng toàn bộ thông tin của Session, Computer và Account
 * để trả về cho Client một JSON sạch đẹp, đầy đủ thông tin mà không cần gọi nhiều API phụ.
 */
public class SessionResponse {

    private Long id;

    // Thông tin máy tính
    private Long computerId;
    private String computerCode;
    private Zone computerZone;
    private BigDecimal pricePerHour;

    // Thông tin khách hàng
    private Long accountId;
    private String accountName;
    private String accountPhone;
    private int accountRemainingMinutes;

    // Thời gian phiên chơi
    private LocalDateTime startedAt;
    private LocalDateTime expiresAt;
    private LocalDateTime endedAt;
    private Status status;

    // Thông tin tính toán động tiện ích cho Frontend
    private long playedMinutes;               // Số phút đã thực sự ngồi chơi
    private long remainingMinutesUntilExpiry; // Số phút còn lại trước khi máy tự tắt

    public SessionResponse() {
    }

    public SessionResponse(Long id, Long computerId, String computerCode, Zone computerZone, BigDecimal pricePerHour,
                           Long accountId, String accountName, String accountPhone, int accountRemainingMinutes,
                           LocalDateTime startedAt, LocalDateTime expiresAt, LocalDateTime endedAt, Status status,
                           long playedMinutes, long remainingMinutesUntilExpiry) {
        this.id = id;
        this.computerId = computerId;
        this.computerCode = computerCode;
        this.computerZone = computerZone;
        this.pricePerHour = pricePerHour;
        this.accountId = accountId;
        this.accountName = accountName;
        this.accountPhone = accountPhone;
        this.accountRemainingMinutes = accountRemainingMinutes;
        this.startedAt = startedAt;
        this.expiresAt = expiresAt;
        this.endedAt = endedAt;
        this.status = status;
        this.playedMinutes = playedMinutes;
        this.remainingMinutesUntilExpiry = remainingMinutesUntilExpiry;
    }

    /**
     * Chuyển đổi an toàn từ Entity sang DTO, tự động tính toán thời gian thực tế đã chơi.
     */
    public static SessionResponse fromEntity(Session session) {
        LocalDateTime now = LocalDateTime.now();
        long played;
        long remaining = 0;

        if (session.getStatus() == Status.ACTIVE) {
            // Nếu đang chơi: tính từ lúc bắt đầu đến thời điểm hiện tại
            played = Math.max(0, Duration.between(session.getStartedAt(), now).toMinutes());
            // Số phút còn lại đến khi hết hạn
            if (session.getExpiresAt() != null && session.getExpiresAt().isAfter(now)) {
                remaining = Duration.between(now, session.getExpiresAt()).toMinutes();
            }
        } else {
            // Nếu đã kết thúc: tính từ lúc bắt đầu đến lúc kết thúc
            LocalDateTime end = (session.getEndedAt() != null) ? session.getEndedAt() : now;
            played = Math.max(0, Duration.between(session.getStartedAt(), end).toMinutes());
        }

        return new SessionResponse(
                session.getId(),
                session.getComputer().getId(),
                session.getComputer().getCode(),
                session.getComputer().getZone(),
                session.getComputer().getPricePerHour(),
                session.getAccount().getId(),
                session.getAccount().getName(),
                session.getAccount().getPhone(),
                session.getAccount().getRemainingMinutes(),
                session.getStartedAt(),
                session.getExpiresAt(),
                session.getEndedAt(),
                session.getStatus(),
                played,
                remaining
        );
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
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

    public Zone getComputerZone() {
        return computerZone;
    }

    public void setComputerZone(Zone computerZone) {
        this.computerZone = computerZone;
    }

    public BigDecimal getPricePerHour() {
        return pricePerHour;
    }

    public void setPricePerHour(BigDecimal pricePerHour) {
        this.pricePerHour = pricePerHour;
    }

    public Long getAccountId() {
        return accountId;
    }

    public void setAccountId(Long accountId) {
        this.accountId = accountId;
    }

    public String getAccountName() {
        return accountName;
    }

    public void setAccountName(String accountName) {
        this.accountName = accountName;
    }

    public String getAccountPhone() {
        return accountPhone;
    }

    public void setAccountPhone(String accountPhone) {
        this.accountPhone = accountPhone;
    }

    public int getAccountRemainingMinutes() {
        return accountRemainingMinutes;
    }

    public void setAccountRemainingMinutes(int accountRemainingMinutes) {
        this.accountRemainingMinutes = accountRemainingMinutes;
    }

    public LocalDateTime getStartedAt() {
        return startedAt;
    }

    public void setStartedAt(LocalDateTime startedAt) {
        this.startedAt = startedAt;
    }

    public LocalDateTime getExpiresAt() {
        return expiresAt;
    }

    public void setExpiresAt(LocalDateTime expiresAt) {
        this.expiresAt = expiresAt;
    }

    public LocalDateTime getEndedAt() {
        return endedAt;
    }

    public void setEndedAt(LocalDateTime endedAt) {
        this.endedAt = endedAt;
    }

    public Status getStatus() {
        return status;
    }

    public void setStatus(Status status) {
        this.status = status;
    }

    public long getPlayedMinutes() {
        return playedMinutes;
    }

    public void setPlayedMinutes(long playedMinutes) {
        this.playedMinutes = playedMinutes;
    }

    public long getRemainingMinutesUntilExpiry() {
        return remainingMinutesUntilExpiry;
    }

    public void setRemainingMinutesUntilExpiry(long remainingMinutesUntilExpiry) {
        this.remainingMinutesUntilExpiry = remainingMinutesUntilExpiry;
    }
}
