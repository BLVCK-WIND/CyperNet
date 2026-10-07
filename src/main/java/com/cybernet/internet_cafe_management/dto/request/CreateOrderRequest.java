package com.cybernet.internet_cafe_management.dto.request;

import com.cybernet.internet_cafe_management.entity.Order.PaymentMethod;

import java.util.List;

/**
 * Request DTO: Yêu cầu tạo đơn đặt món ăn/uống từ điện thoại của khách (sau khi quét QR tại bàn).
 */
public class CreateOrderRequest {

    // ID phiên chơi đang hoạt động tại máy
    private Long sessionId;

    // Hình thức thanh toán: QR (chuyển khoản) hoặc CASH (tiền mặt tại bàn)
    private PaymentMethod paymentMethod;

    // Danh sách các món trong giỏ hàng
    private List<CreateOrderItemRequest> items;

    public CreateOrderRequest() {
    }

    public CreateOrderRequest(Long sessionId, PaymentMethod paymentMethod, List<CreateOrderItemRequest> items) {
        this.sessionId = sessionId;
        this.paymentMethod = paymentMethod;
        this.items = items;
    }

    public Long getSessionId() {
        return sessionId;
    }

    public void setSessionId(Long sessionId) {
        this.sessionId = sessionId;
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
