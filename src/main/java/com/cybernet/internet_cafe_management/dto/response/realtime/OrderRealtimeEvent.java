package com.cybernet.internet_cafe_management.dto.response.realtime;

import com.cybernet.internet_cafe_management.entity.Order;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;

/**
 * Event DTO phát tán qua WebSocket topic /topic/orders
 * khi có đơn hàng mới phát sinh hoặc thay đổi trạng thái thanh toán.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class OrderRealtimeEvent {

    private Long orderId;
    private Long sessionId;
    private String computerCode;
    private Order.Status status;
    private Order.PaymentMethod paymentMethod;
    private BigDecimal totalAmount;
    private String eventType;
    private String message;
    private LocalDateTime timestamp;

    public static OrderRealtimeEvent fromOrder(Order order, String eventType, String message) {
        if (order == null) {
            return null;
        }
        String computerCode = (order.getSession() != null && order.getSession().getComputer() != null)
                ? order.getSession().getComputer().getCode()
                : "N/A";
        Long sessionId = (order.getSession() != null) ? order.getSession().getId() : null;

        return OrderRealtimeEvent.builder()
                .orderId(order.getId())
                .sessionId(sessionId)
                .computerCode(computerCode)
                .status(order.getStatus())
                .paymentMethod(order.getPaymentMethod())
                .totalAmount(order.getTotalAmount())
                .eventType(eventType)
                .message(message)
                .timestamp(LocalDateTime.now())
                .build();
    }
}
