package com.cybernet.internet_cafe_management.dto.request;

import com.cybernet.internet_cafe_management.entity.TimePurchase.PaymentMethod;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;

import java.math.BigDecimal;

/**
 * Request DTO: Chứa dữ liệu khi khách hàng hoặc nhân viên tạo yêu cầu nạp giờ chơi.
 * Client chỉ cần gửi đúng các thông tin cần thiết này, không thể tự ý set status hay confirmedByStaff.
 */
public class CreateTimePurchaseRequest {

    // ID của tài khoản khách hàng được cộng giờ
    @NotNull(message = "Mã tài khoản (accountId) không được để trống")
    private Long accountId;

    // Số phút muốn mua (VD: 60 = 1 tiếng, 120 = 2 tiếng)
    @Min(value = 1, message = "Số phút mua phải ít nhất là 1 phút")
    private int minutes;

    // Số tiền khách phải thanh toán (VD: 10000.00)
    @NotNull(message = "Số tiền thanh toán không được để trống")
    @Positive(message = "Số tiền thanh toán phải lớn hơn 0")
    private BigDecimal amount;

    // Hình thức thanh toán: QR hoặc CASH
    @NotNull(message = "Phương thức thanh toán không được để trống")
    private PaymentMethod paymentMethod;

    public CreateTimePurchaseRequest() {
    }

    public CreateTimePurchaseRequest(Long accountId, int minutes, BigDecimal amount, PaymentMethod paymentMethod) {
        this.accountId = accountId;
        this.minutes = minutes;
        this.amount = amount;
        this.paymentMethod = paymentMethod;
    }

    public Long getAccountId() {
        return accountId;
    }

    public void setAccountId(Long accountId) {
        this.accountId = accountId;
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
}
