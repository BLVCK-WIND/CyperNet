package com.cybernet.internet_cafe_management.entity;

import java.math.BigDecimal;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.Data;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "computers")
@Data
@NoArgsConstructor

public class Computer {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true)
    private String code;

    /*
     * Cột này dùng để lưu giá tiền theo giờ, vì vậy cần dùng BigDecimal để đảm bảo
     * tính toán chính xác.
     * Mặc định = 0 có nghĩa là máy đang trong trạng thái không sử dụng.
     */

    @Column(nullable = false)
    private BigDecimal pricePerHour;

    @Column(nullable = false, unique = true)
    private String ipAddress;

    // Khu vực: STANDARD (khu thông thường) hoặc VIP (khu cao cấp hơn) — nếu là khu
    // VIP thì giá tiền sẽ cao hơn - mặc định là STANDARD vì đa số các máy là
    // standard
    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private Zone zone = Zone.STANDARD;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private Status status = Status.AVAILABLE;

    public enum Status {
        AVAILABLE, IN_USE, MAINTENANCE
    }

    public enum Zone {
        STANDARD, VIP
    }

}
