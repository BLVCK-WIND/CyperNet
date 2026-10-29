package com.cybernet.internet_cafe_management.entity;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

import org.hibernate.annotations.CreationTimestamp;
import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "orders") // Bắt buộc là "orders" vì "order" là từ khóa SQL
@Data
@NoArgsConstructor
public class Order {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "session_id", nullable = true)
    private Session session;

    // Máy trạm đặt đơn (hỗ trợ cả khi máy đang có session hoặc máy trống gọi món tại bàn)
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "computer_id", nullable = true)
    private Computer computer;

    // Tài khoản khách hàng đặt đơn
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "account_id", nullable = true)
    private Account account;

    // Tổng số tiền của order (bao gồm cả đồ ăn và giờ chơi)
    @Column(nullable = false)
    private BigDecimal totalAmount;

    // Thời gian nhân viên xác nhận order (khi khách đã thanh toán xong)
    @Column(nullable = true)
    private LocalDateTime confirmedAt;

    // Thời gian khách hàng bấm 'Đã chuyển khoản' trên giao diện QR
    @Column(nullable = true)
    private LocalDateTime transferredAt;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private PaymentMethod paymentMethod;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private Status status = Status.PENDING_PAYMENT;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "confirmed_by_staff_id") // Ban đầu chưa có ai duyệt nên để null
    private Account confirmedByStaff;

    @OneToMany(mappedBy = "order", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<OrderItem> orderItems;  // 1 order có nhiều orderItems

    @CreationTimestamp
    @Column(updatable = false)
    private LocalDateTime createdAt;

    public enum PaymentMethod {
        QR, CASH
    }

    public enum Status {
        PENDING_PAYMENT, WAITING_CONFIRMATION, CONFIRMED, CANCELLED
    }
}
