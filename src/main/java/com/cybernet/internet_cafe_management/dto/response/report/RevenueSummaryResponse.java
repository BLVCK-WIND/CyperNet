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
public class RevenueSummaryResponse {

    // Tổng doanh thu toàn quán (Order + TimePurchase)
    private BigDecimal totalRevenue;

    // Doanh thu từ gọi món, dịch vụ & nạp giờ trong phiên (Order)
    private BigDecimal totalOrderRevenue;

    // Doanh thu từ nạp giờ chơi tại quầy (TimePurchase)
    private BigDecimal totalTimePurchaseRevenue;

    // Doanh thu thuần F&B (Món ăn & Đồ uống)
    private BigDecimal totalFoodAndDrinkRevenue;

    // Tổng doanh thu từ nạp giờ chơi (TimePurchase + Gói giờ trong Order)
    private BigDecimal totalPlaytimeRevenue;

    // Doanh thu thu bằng tiền mặt
    private BigDecimal cashRevenue;

    // Doanh thu thu qua chuyển khoản QR
    private BigDecimal qrRevenue;

    // Tổng số lượng đơn hàng hoàn tất
    private long totalOrders;

    // Tổng số lượt nạp giờ chơi tại quầy
    private long totalTimePurchases;

    // Khoảng thời gian thống kê
    private LocalDate fromDate;
    private LocalDate toDate;
}
