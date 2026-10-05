package com.cybernet.internet_cafe_management.dto.response;

import com.cybernet.internet_cafe_management.entity.TimePurchase;
import com.cybernet.internet_cafe_management.entity.TimePurchase.PaymentMethod;
import com.cybernet.internet_cafe_management.entity.TimePurchase.Status;

import java.math.BigDecimal;
import java.time.LocalDateTime;

/**
 * Response DTO: Dữ liệu phẳng trả về cho Client.
 * Tách biệt hoàn toàn với Entity và làm phẳng (flatten) các quan hệ Object phức tạp
 * (ví dụ: thay vì trả cả object Account lồng nhau, ta chỉ bóc ID và Tên ra).
 */
public class TimePurchaseResponse {

    private Long id;

    // Thông tin khách hàng mua giờ
    private Long accountId;
    private String accountName;
    private String accountPhone;

    // Chi tiết giao dịch
    private int minutes;
    private BigDecimal amount;
    private PaymentMethod paymentMethod;
    private Status status;

    // Thông tin nhân viên duyệt (nếu chưa duyệt thì 2 trường này là null)
    private Long confirmedByStaffId;
    private String confirmedByStaffName;

    // Thời gian
    private LocalDateTime createdAt;
    private LocalDateTime confirmedAt;

    public TimePurchaseResponse() {
    }

    public TimePurchaseResponse(Long id, Long accountId, String accountName, String accountPhone,
                                int minutes, BigDecimal amount, PaymentMethod paymentMethod, Status status,
                                Long confirmedByStaffId, String confirmedByStaffName,
                                LocalDateTime createdAt, LocalDateTime confirmedAt) {
        this.id = id;
        this.accountId = accountId;
        this.accountName = accountName;
        this.accountPhone = accountPhone;
        this.minutes = minutes;
        this.amount = amount;
        this.paymentMethod = paymentMethod;
        this.status = status;
        this.confirmedByStaffId = confirmedByStaffId;
        this.confirmedByStaffName = confirmedByStaffName;
        this.createdAt = createdAt;
        this.confirmedAt = confirmedAt;
    }

    /**
     * Phương thức tiện ích chuyển đổi từ Entity sang DTO.
     * Xử lý an toàn các trường nullable như confirmedByStaff để tránh NullPointerException.
     */
    public static TimePurchaseResponse fromEntity(TimePurchase timePurchase) {
        Long staffId = null;
        String staffName = null;

        // Lưu ý: Đơn PENDING chưa có nhân viên duyệt nên confirmedByStaff là null
        if (timePurchase.getConfirmedByStaff() != null) {
            staffId = timePurchase.getConfirmedByStaff().getId();
            staffName = timePurchase.getConfirmedByStaff().getName();
        }

        return new TimePurchaseResponse(
                timePurchase.getId(),
                timePurchase.getAccount().getId(),
                timePurchase.getAccount().getName(),
                timePurchase.getAccount().getPhone(),
                timePurchase.getMinutes(),
                timePurchase.getAmount(),
                timePurchase.getPaymentMethod(),
                timePurchase.getStatus(),
                staffId,
                staffName,
                timePurchase.getCreatedAt(),
                timePurchase.getConfirmedAt()
        );
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
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

    public int getMinutes() {
        return minutes;
    }

    public void setMinutes(int minutes) {
        this.minutes = minutes;
    }

    public BigDecimal getAmount() {
        return amount;
    }

    public void setAmount(BigDecimal amount) {
        this.amount = amount;
    }

    public PaymentMethod getPaymentMethod() {
        return paymentMethod;
    }

    public void setPaymentMethod(PaymentMethod paymentMethod) {
        this.paymentMethod = paymentMethod;
    }

    public Status getStatus() {
        return status;
    }

    public void setStatus(Status status) {
        this.status = status;
    }

    public Long getConfirmedByStaffId() {
        return confirmedByStaffId;
    }

    public void setConfirmedByStaffId(Long confirmedByStaffId) {
        this.confirmedByStaffId = confirmedByStaffId;
    }

    public String getConfirmedByStaffName() {
        return confirmedByStaffName;
    }

    public void setConfirmedByStaffName(String confirmedByStaffName) {
        this.confirmedByStaffName = confirmedByStaffName;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }

    public LocalDateTime getConfirmedAt() {
        return confirmedAt;
    }

    public void setConfirmedAt(LocalDateTime confirmedAt) {
        this.confirmedAt = confirmedAt;
    }
}
