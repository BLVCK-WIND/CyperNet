package com.cybernet.internet_cafe_management.controller;

import com.cybernet.internet_cafe_management.dto.response.report.*;
import com.cybernet.internet_cafe_management.service.ReportService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;

@Tag(name = "Reporting & Analytics", description = "APIs báo cáo doanh thu tài chính, phân tích xu hướng và hiệu suất máy trạm (Chỉ dành cho ADMIN)")
@RestController
@RequestMapping("/api/reports")
@PreAuthorize("hasRole('ADMIN')") // Toàn bộ module báo cáo tài chính chỉ dành riêng cho ADMIN
public class ReportController {

    private final ReportService reportService;

    public ReportController(ReportService reportService) {
        this.reportService = reportService;
    }

    /**
     * 1. Báo cáo tổng quan doanh thu (GET /api/reports/revenue/summary)
     * Thống kê tổng tiền thu từ F&B, nạp giờ, cơ cấu thanh toán Tiền mặt vs QR.
     */
    @Operation(summary = "Báo cáo tổng quan doanh thu", description = "Thống kê tổng doanh thu thực thu, doanh thu F&B, doanh thu giờ chơi và tỷ trọng tiền mặt/chuyển khoản.")
    @GetMapping("/revenue/summary")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<RevenueSummaryResponse> getRevenueSummary(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate fromDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate toDate) {
        RevenueSummaryResponse response = reportService.getRevenueSummary(fromDate, toDate);
        return ResponseEntity.ok(response);
    }

    /**
     * 2. Báo cáo xu hướng doanh thu theo ngày (GET /api/reports/revenue/daily)
     * Trả về danh sách chuỗi thời gian liên tục phục vụ vẽ biểu đồ doanh thu.
     */
    @Operation(summary = "Xu hướng doanh thu theo ngày", description = "Trả về chuỗi thời gian liên tục từng ngày (không đứt quãng) phục vụ vẽ biểu đồ.")
    @GetMapping("/revenue/daily")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<List<DailyRevenueResponse>> getDailyRevenue(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate fromDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate toDate) {
        List<DailyRevenueResponse> response = reportService.getDailyRevenue(fromDate, toDate);
        return ResponseEntity.ok(response);
    }

    /**
     * 3. Thống kê món bán chạy nhất (GET /api/reports/items/top-selling)
     * Xếp hạng danh mục món ăn/uống/giờ chơi theo số lượng bán và tổng tiền.
     */
    @Operation(summary = "Xếp hạng món bán chạy nhất", description = "Thống kê danh sách món ăn, nước uống và gói giờ bán chạy nhất theo số lượng và doanh thu.")
    @GetMapping("/items/top-selling")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<List<TopItemResponse>> getTopSellingItems(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate fromDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate toDate,
            @RequestParam(defaultValue = "10") int limit) {
        List<TopItemResponse> response = reportService.getTopSellingItems(fromDate, toDate, limit);
        return ResponseEntity.ok(response);
    }

    /**
     * 4. Thống kê khách hàng thân thiết chi tiêu nhiều nhất (GET /api/reports/customers/top-spenders)
     */
    @Operation(summary = "Top khách hàng chi tiêu nhiều nhất", description = "Thống kê danh sách khách hàng nạp giờ và sử dụng dịch vụ nhiều nhất trong quán net.")
    @GetMapping("/customers/top-spenders")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<List<TopCustomerResponse>> getTopSpendingCustomers(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate fromDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate toDate,
            @RequestParam(defaultValue = "10") int limit) {
        List<TopCustomerResponse> response = reportService.getTopSpendingCustomers(fromDate, toDate, limit);
        return ResponseEntity.ok(response);
    }

    /**
     * 5. Thống kê công suất và tần suất sử dụng máy trạm (GET /api/reports/computers/usage)
     */
    @Operation(summary = "Thống kê hiệu suất sử dụng máy trạm", description = "Thống kê số lượt phục vụ và tổng số giờ hoạt động của từng máy trạm.")
    @GetMapping("/computers/usage")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<List<ComputerUsageResponse>> getComputerUsage(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate fromDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate toDate) {
        List<ComputerUsageResponse> response = reportService.getComputerUsageStats(fromDate, toDate);
        return ResponseEntity.ok(response);
    }
}
