package com.cybernet.internet_cafe_management.entity;

import java.time.LocalDateTime;

import org.hibernate.annotations.CreationTimestamp;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "accounts") // Tên bảng trong database
@Data                      // Lombok: tự sinh getter, setter, toString, equals, hashCode
@NoArgsConstructor         // Lombok: tự sinh constructor không tham số (JPA bắt buộc phải có)
public class Account {

    @Id // Đánh dấu đây là khóa chính (Primary Key)
    @GeneratedValue(strategy = GenerationType.IDENTITY) // Tự tăng do database quản lý (AUTO_INCREMENT)
    private Long id;

    // SĐT — dùng để đăng nhập, mỗi tài khoản 1 SĐT duy nhất
    @Column(nullable = false, unique = true)
    private String phone;

    // Tên khách hàng / nhân viên
    @Column(nullable = false)
    private String name;

    // Mật khẩu đã được mã hoá (hash) — KHÔNG BAO GIỜ lưu mật khẩu gốc
    // BCrypt sẽ tạo ra chuỗi ~60 ký tự, ví dụ: "$2a$10$N9qo8uLOickgx2ZMRZoMy..."
    // Việc mã hoá xử lý ở Service layer, Entity chỉ lưu kết quả
    @Column(nullable = false)
    private String passwordHash;

    // Vai trò: xác định người này được làm gì trong hệ thống
    // Dùng Enum thay vì String để tránh gõ nhầm ("ADMNI" thay vì "ADMIN")
    // EnumType.STRING → DB lưu chữ "CUSTOMER" thay vì số 0 → dễ đọc khi query trực tiếp
    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private Role role = Role.CUSTOMER; // Mặc định là khách hàng (vì đa số tài khoản là khách)

    // Số phút chơi còn lại — chỉ có ý nghĩa với CUSTOMER
    // Dùng int (không phải Integer) vì luôn có giá trị, mặc định = 0 (chưa mua giờ)
    // Staff/Admin không dùng field này, giá trị giữ nguyên = 0
    @Column(nullable = false)
    private int remainingMinutes = 0;

    // Thời điểm tạo tài khoản — tự động gán khi INSERT, không cho phép sửa
    @CreationTimestamp
    @Column(updatable = false)
    private LocalDateTime createdAt;

    // === ENUM ĐỊNH NGHĨA NGAY TRONG ENTITY ===
    // Đặt trong entity vì Role chỉ thuộc về Account, không dùng ở chỗ khác
    public enum Role {
        CUSTOMER,  // Khách hàng — quét QR gọi món, mua giờ
        STAFF,     // Nhân viên — xác nhận thanh toán, quản lý phiên
        ADMIN      // Quản lý — toàn quyền + báo cáo
    }
}
