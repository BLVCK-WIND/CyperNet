package com.cybernet.internet_cafe_management.dto.response.report;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDate;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class DailyRevenueResponse {

    // Ngày phát sinh doanh thu
    private LocalDate date;

    // Doanh thu từ đơn hàng trong ngày
    private BigDecimal orderRevenue;

    // Doanh thu từ nạp giờ quầy trong ngày
    private BigDecimal timePurchaseRevenue;

    // Tổng doanh thu trong ngày (orderRevenue + timePurchaseRevenue)
    private BigDecimal totalRevenue;

    // Số đơn hàng trong ngày
    private long orderCount;

    // Số lượt nạp giờ trong ngày
    private long timePurchaseCount;
}
