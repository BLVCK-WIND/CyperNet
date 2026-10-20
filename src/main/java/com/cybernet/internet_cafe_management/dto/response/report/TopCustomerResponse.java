package com.cybernet.internet_cafe_management.dto.response.report;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class TopCustomerResponse {

    // ID tài khoản khách hàng
    private Long accountId;

    // Tên khách hàng
    private String name;

    // Số điện thoại đăng nhập
    private String phone;

    // Tổng số tiền khách đã chi tiêu (Nạp quầy + Gọi món)
    private BigDecimal totalSpent;

    // Số phút chơi hiện còn lại trong tài khoản
    private int remainingMinutes;

    // Tổng số phút thực tế đã chơi
    private long totalMinutesPlayed;
}
