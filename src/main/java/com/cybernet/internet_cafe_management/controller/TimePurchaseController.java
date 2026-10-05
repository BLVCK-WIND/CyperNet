package com.cybernet.internet_cafe_management.controller;

import com.cybernet.internet_cafe_management.dto.request.CreateTimePurchaseRequest;
import com.cybernet.internet_cafe_management.dto.response.TimePurchaseResponse;
import com.cybernet.internet_cafe_management.entity.TimePurchase.Status;
import com.cybernet.internet_cafe_management.service.TimePurchaseService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/time-purchases")
public class TimePurchaseController {

    private final TimePurchaseService timePurchaseService;

    public TimePurchaseController(TimePurchaseService timePurchaseService) {
        this.timePurchaseService = timePurchaseService;
    }

    /**
     * 1. Tạo yêu cầu mua giờ chơi mới (POST /api/time-purchases)
     * Trả về HTTP 201 CREATED kèm thông tin giao dịch PENDING.
     */
    @PostMapping
    public ResponseEntity<TimePurchaseResponse> createTimePurchase(@RequestBody CreateTimePurchaseRequest request) {
        TimePurchaseResponse response = timePurchaseService.createTimePurchase(request);
        return new ResponseEntity<>(response, HttpStatus.CREATED);
    }

    /**
     * 2. Nhân viên quầy xác nhận đã nhận tiền (PATCH /api/time-purchases/{id}/confirm?staffId=2)
     * Dùng PATCH vì đây là thao tác cập nhật một phần trạng thái của tài nguyên.
     */
    @PatchMapping("/{id}/confirm")
    public ResponseEntity<TimePurchaseResponse> confirmTimePurchase(
            @PathVariable Long id,
            @RequestParam Long staffId) {
        TimePurchaseResponse response = timePurchaseService.confirmTimePurchase(id, staffId);
        return ResponseEntity.ok(response);
    }

    /**
     * 3. Huỷ giao dịch mua giờ (PATCH /api/time-purchases/{id}/cancel)
     */
    @PatchMapping("/{id}/cancel")
    public ResponseEntity<TimePurchaseResponse> cancelTimePurchase(@PathVariable Long id) {
        TimePurchaseResponse response = timePurchaseService.cancelTimePurchase(id);
        return ResponseEntity.ok(response);
    }

    /**
     * 4. Xem chi tiết 1 giao dịch (GET /api/time-purchases/{id})
     */
    @GetMapping("/{id}")
    public ResponseEntity<TimePurchaseResponse> getTimePurchaseById(@PathVariable Long id) {
        TimePurchaseResponse response = timePurchaseService.getTimePurchaseById(id);
        return ResponseEntity.ok(response);
    }

    /**
     * 5. Lấy danh sách giao dịch (GET /api/time-purchases hoặc /api/time-purchases?status=PENDING_PAYMENT)
     * Thường dùng cho màn hình quầy thu ngân để theo dõi các đơn nạp giờ chờ duyệt.
     */
    @GetMapping
    public ResponseEntity<List<TimePurchaseResponse>> getAllTimePurchases(
            @RequestParam(required = false) Status status) {
        List<TimePurchaseResponse> responses = timePurchaseService.getAllTimePurchases(status);
        return ResponseEntity.ok(responses);
    }

    /**
     * 6. Lấy toàn bộ lịch sử mua giờ của 1 tài khoản (GET /api/time-purchases/account/{accountId})
     */
    @GetMapping("/account/{accountId}")
    public ResponseEntity<List<TimePurchaseResponse>> getTimePurchasesByAccountId(@PathVariable Long accountId) {
        List<TimePurchaseResponse> responses = timePurchaseService.getTimePurchasesByAccountId(accountId);
        return ResponseEntity.ok(responses);
    }
}
