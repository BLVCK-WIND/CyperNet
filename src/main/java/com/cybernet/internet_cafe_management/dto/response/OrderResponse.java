package com.cybernet.internet_cafe_management.dto.response;

import com.cybernet.internet_cafe_management.entity.Computer;
import com.cybernet.internet_cafe_management.entity.Order;
import com.cybernet.internet_cafe_management.entity.Order.PaymentMethod;
import com.cybernet.internet_cafe_management.entity.Order.Status;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.Collections;
import java.util.List;

/**
 * Response DTO: Toàn bộ thông tin đơn hàng trả về cho Client.
 * Làm phẳng thông tin máy tính (computerCode), khu vực (computerZone), khách hàng (customerName),
 * nhân viên duyệt, và chứa danh sách các món trong đơn hàng.
 */
public class OrderResponse {

    private Long id;

    // Thông tin định danh phục vụ nhân viên bưng bê và giao hàng
    private Long sessionId;
    private String computerCode; // Mang ra bàn nào (VD: "PC-01", "VIP-02")
    private Computer.Zone computerZone; // Khu vực phòng máy (VD: VIP, STANDARD, STREAM, ARENA, COUPLE)
    private String customerName;
    private String customerPhone;

    // Thông tin đơn hàng
    private BigDecimal totalAmount;
    private PaymentMethod paymentMethod;
    private Status status;

    // Nhân viên duyệt đơn (null nếu đơn chưa được duyệt)
    private Long confirmedByStaffId;
    private String confirmedByStaffName;

    // Thời gian
    private LocalDateTime createdAt;
    private LocalDateTime confirmedAt;
    private LocalDateTime transferredAt;

    // Danh sách các món trong đơn hàng
    private List<OrderItemResponse> items;

    public OrderResponse() {
    }

    public OrderResponse(Long id, Long sessionId, String computerCode, Computer.Zone computerZone, String customerName, String customerPhone,
                         BigDecimal totalAmount, PaymentMethod paymentMethod, Status status,
                         Long confirmedByStaffId, String confirmedByStaffName,
                         LocalDateTime createdAt, LocalDateTime confirmedAt, LocalDateTime transferredAt,
                         List<OrderItemResponse> items) {
        this.id = id;
        this.sessionId = sessionId;
        this.computerCode = computerCode;
        this.computerZone = computerZone;
        this.customerName = customerName;
        this.customerPhone = customerPhone;
        this.totalAmount = totalAmount;
        this.paymentMethod = paymentMethod;
        this.status = status;
        this.confirmedByStaffId = confirmedByStaffId;
        this.confirmedByStaffName = confirmedByStaffName;
        this.createdAt = createdAt;
        this.confirmedAt = confirmedAt;
        this.transferredAt = transferredAt;
        this.items = items;
    }

    public OrderResponse(Long id, Long sessionId, String computerCode, String customerName, String customerPhone,
                         BigDecimal totalAmount, PaymentMethod paymentMethod, Status status,
                         Long confirmedByStaffId, String confirmedByStaffName,
                         LocalDateTime createdAt, LocalDateTime confirmedAt, LocalDateTime transferredAt,
                         List<OrderItemResponse> items) {
        this(id, sessionId, computerCode, null, customerName, customerPhone, totalAmount, paymentMethod, status,
             confirmedByStaffId, confirmedByStaffName, createdAt, confirmedAt, transferredAt, items);
    }

    public static OrderResponse fromEntity(Order order) {
        Long staffId = null;
        String staffName = null;

        // Xử lý null-safe cho confirmedByStaff khi đơn còn PENDING
        if (order.getConfirmedByStaff() != null) {
            staffId = order.getConfirmedByStaff().getId();
            staffName = order.getConfirmedByStaff().getName();
        }

        // Chuyển đổi danh sách OrderItem sang OrderItemResponse
        List<OrderItemResponse> itemResponses = (order.getOrderItems() != null)
                ? order.getOrderItems().stream().map(OrderItemResponse::fromEntity).toList()
                : Collections.emptyList();

        String compCode = null;
        Computer.Zone compZone = null;
        if (order.getComputer() != null) {
            compCode = order.getComputer().getCode();
            compZone = order.getComputer().getZone();
        } else if (order.getSession() != null && order.getSession().getComputer() != null) {
            compCode = order.getSession().getComputer().getCode();
            compZone = order.getSession().getComputer().getZone();
        }

        String custName = null;
        String custPhone = null;
        if (order.getAccount() != null) {
            custName = order.getAccount().getName();
            custPhone = order.getAccount().getPhone();
        } else if (order.getSession() != null && order.getSession().getAccount() != null) {
            custName = order.getSession().getAccount().getName();
            custPhone = order.getSession().getAccount().getPhone();
        }

        return new OrderResponse(
                order.getId(),
                (order.getSession() != null) ? order.getSession().getId() : null,
                compCode,
                compZone,
                custName,
                custPhone,
                order.getTotalAmount(),
                order.getPaymentMethod(),
                order.getStatus(),
                staffId,
                staffName,
                order.getCreatedAt(),
                order.getConfirmedAt(),
                order.getTransferredAt(),
                itemResponses
        );
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public Long getSessionId() {
        return sessionId;
    }

    public void setSessionId(Long sessionId) {
        this.sessionId = sessionId;
    }

    public String getComputerCode() {
        return computerCode;
    }

    public void setComputerCode(String computerCode) {
        this.computerCode = computerCode;
    }

    public Computer.Zone getComputerZone() {
        return computerZone;
    }

    public void setComputerZone(Computer.Zone computerZone) {
        this.computerZone = computerZone;
    }

    public String getCustomerName() {
        return customerName;
    }

    public void setCustomerName(String customerName) {
        this.customerName = customerName;
    }

    public String getCustomerPhone() {
        return customerPhone;
    }

    public void setCustomerPhone(String customerPhone) {
        this.customerPhone = customerPhone;
    }

    public BigDecimal getTotalAmount() {
        return totalAmount;
    }

    public void setTotalAmount(BigDecimal totalAmount) {
        this.totalAmount = totalAmount;
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

    public LocalDateTime getTransferredAt() {
        return transferredAt;
    }

    public void setTransferredAt(LocalDateTime transferredAt) {
        this.transferredAt = transferredAt;
    }

    public List<OrderItemResponse> getItems() {
        return items;
    }

    public void setItems(List<OrderItemResponse> items) {
        this.items = items;
    }
}
