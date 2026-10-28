package com.cybernet.internet_cafe_management.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;

import java.math.BigDecimal;
import java.time.LocalDateTime;

/**
 * Entity: Đại diện cho Khu vực phòng máy (Zone) trong hệ thống CyberNet.
 * Hỗ trợ mở rộng danh mục khu vực động (STANDARD, VIP, STREAM, ARENA, COUPLE...).
 */
@Entity
@Table(name = "zones")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Zone {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /**
     * Mã định danh duy nhất của khu vực (VD: "STANDARD", "VIP", "STREAM").
     * Không phân biệt hoa thường khi so sánh.
     */
    @Column(nullable = false, unique = true, length = 50)
    private String code;

    /**
     * Tên hiển thị thân thiện (VD: "Khu Tiêu Chuẩn", "Khu VIP Gaming", "Phòng Stream").
     */
    @Column(nullable = false, length = 100)
    private String name;

    /**
     * Đơn giá giờ chơi mặc định gợi ý khi tạo máy trạm thuộc khu vực này.
     */
    @Column(name = "default_price_per_hour", nullable = false, precision = 10, scale = 2)
    private BigDecimal defaultPricePerHour;

    /**
     * Mã màu hiển thị đại diện trên giao diện (Hex code, VD: "#bd9875", "#434e60").
     */
    @Column(name = "color_code", nullable = false, length = 20)
    @Builder.Default
    private String colorCode = "#bd9875";

    /**
     * Mô tả chi tiết về cấu hình hoặc tiện ích của khu vực.
     */
    @Column(length = 255)
    private String description;

    /**
     * Trạng thái hoạt động (true: đang hoạt động, false: tạm ngưng).
     */
    @Column(nullable = false)
    @Builder.Default
    private boolean active = true;

    /**
     * Thời điểm tạo khu vực.
     */
    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;
}
