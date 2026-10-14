package com.cybernet.internet_cafe_management.dto.request;

import com.cybernet.internet_cafe_management.entity.Order.PaymentMethod;

import java.util.List;

/**
 * Request DTO: Nhân viên tạo đơn trực tiếp tại quầy và xác nhận thu tiền ngay lập tức (UC-7).
 */
public class CreateDirectOrderRequest {

    // ID phiên chơi đang hoạt động tại máy của khách
    private Long sessionId;

    // ID nhân viên tạo và thu tiền đơn hàng
    private Long staffId;

    // Hình thức thanh toán (CASH hoặc QR, mặc định CASH)
    private PaymentMethod paymentMethod = PaymentMethod.CASH;

    // Danh sách các món gọi trực tiếp
    private List<CreateOrderItemRequest> items;

    public CreateDirectOrderRequest() {
    }

    public CreateDirectOrderRequest(Long sessionId, Long staffId, PaymentMethod paymentMethod, List<CreateOrderItemRequest> items) {
        this.sessionId = sessionId;
        this.staffId = staffId;
        this.paymentMethod = (paymentMethod != null) ? paymentMethod : PaymentMethod.CASH;
        this.items = items;
    }

    public Long getSessionId() {
        return sessionId;
    }

    public void setSessionId(Long sessionId) {
        this.sessionId = sessionId;
    }

    public Long getStaffId() {
        return staffId;
    }

    public void setStaffId(Long staffId) {
        this.staffId = staffId;
    }

    public PaymentMethod getPaymentMethod() {
        return paymentMethod;
    }

    public void setPaymentMethod(PaymentMethod paymentMethod) {
        this.paymentMethod = paymentMethod;
    }

    public List<CreateOrderItemRequest> getItems() {
        return items;
    }

    public void setItems(List<CreateOrderItemRequest> items) {
        this.items = items;
    }
}
