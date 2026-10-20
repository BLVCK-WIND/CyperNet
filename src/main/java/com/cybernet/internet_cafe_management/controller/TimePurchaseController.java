package com.cybernet.internet_cafe_management.controller;

import com.cybernet.internet_cafe_management.dto.request.CreateTimePurchaseRequest;
import com.cybernet.internet_cafe_management.dto.response.PageResponse;
import com.cybernet.internet_cafe_management.dto.response.TimePurchaseResponse;
import com.cybernet.internet_cafe_management.entity.Account;
import com.cybernet.internet_cafe_management.entity.TimePurchase.Status;
import com.cybernet.internet_cafe_management.exception.ResourceNotFoundException;
import com.cybernet.internet_cafe_management.repository.AccountRepository;
import com.cybernet.internet_cafe_management.service.TimePurchaseService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@Tag(name = "Time Purchase Management", description = "APIs nạp tiền giờ chơi tại quầy thu ngân và lịch sử giao dịch")
@RestController
@RequestMapping("/api/time-purchases")
public class TimePurchaseController {

    private final TimePurchaseService timePurchaseService;
    private final AccountRepository accountRepository;

    public TimePurchaseController(TimePurchaseService timePurchaseService, AccountRepository accountRepository) {
        this.timePurchaseService = timePurchaseService;
        this.accountRepository = accountRepository;
    }

    /**
     * 1. Tạo yêu cầu mua giờ chơi mới (POST /api/time-purchases)
     * Trả về HTTP 201 CREATED kèm thông tin giao dịch PENDING.
     */
    @Operation(summary = "Tạo yêu cầu nạp giờ", description = "Tạo giao dịch nạp giờ chơi cho tài khoản khách hàng. Trạng thái khởi tạo PENDING_PAYMENT.")
    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'STAFF')")
    public ResponseEntity<TimePurchaseResponse> createTimePurchase(@Valid @RequestBody CreateTimePurchaseRequest request) {
        TimePurchaseResponse response = timePurchaseService.createTimePurchase(request);
        return new ResponseEntity<>(response, HttpStatus.CREATED);
    }

    /**
     * 2. Nhân viên quầy xác nhận đã nhận tiền (PATCH /api/time-purchases/{id}/confirm)
     * Dùng PATCH vì đây là thao tác cập nhật một phần trạng thái của tài nguyên.
     * ID nhân viên xác nhận được trích xuất an toàn từ JWT Authentication (B1).
     */
    @Operation(summary = "Xác nhận nạp giờ thành công", description = "Thu ngân xác nhận nhận tiền, nạp số phút tương ứng vào số dư tài khoản của khách hàng.")
    @PatchMapping("/{id}/confirm")
    @PreAuthorize("hasAnyRole('ADMIN', 'STAFF')")
    public ResponseEntity<TimePurchaseResponse> confirmTimePurchase(
            @PathVariable Long id,
            Authentication authentication) {
        Account staff = accountRepository.findByPhone(authentication.getName())
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy thông tin nhân viên từ phiên đăng nhập!"));
        TimePurchaseResponse response = timePurchaseService.confirmTimePurchase(id, staff.getId());
        return ResponseEntity.ok(response);
    }

    /**
     * 3. Huỷ giao dịch mua giờ (PATCH /api/time-purchases/{id}/cancel)
     */
    @Operation(summary = "Hủy yêu cầu nạp giờ", description = "Hủy giao dịch nạp giờ khi chưa thanh toán (chỉ hủy được trạng thái PENDING_PAYMENT).")
    @PatchMapping("/{id}/cancel")
    @PreAuthorize("hasAnyRole('ADMIN', 'STAFF')")
    public ResponseEntity<TimePurchaseResponse> cancelTimePurchase(@PathVariable Long id) {
        TimePurchaseResponse response = timePurchaseService.cancelTimePurchase(id);
        return ResponseEntity.ok(response);
    }

    /**
     * 4. Xem chi tiết 1 giao dịch (GET /api/time-purchases/{id})
     */
    @Operation(summary = "Xem chi tiết giao dịch nạp giờ", description = "Lấy thông tin chi tiết của một giao dịch nạp giờ theo ID.")
    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'STAFF')")
    public ResponseEntity<TimePurchaseResponse> getTimePurchaseById(@PathVariable Long id) {
        TimePurchaseResponse response = timePurchaseService.getTimePurchaseById(id);
        return ResponseEntity.ok(response);
    }

    /**
     * 5. Lấy danh sách tất cả giao dịch nạp giờ có phân trang & sắp xếp
     */
    @Operation(summary = "Lấy danh sách giao dịch nạp giờ (phân trang)", description = "Lấy danh sách tất cả các giao dịch nạp giờ trong hệ thống có phân trang và sắp xếp.")
    @GetMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'STAFF')")
    public ResponseEntity<PageResponse<TimePurchaseResponse>> getAllTimePurchases(
            @RequestParam(required = false) Status status,
            @PageableDefault(sort = "createdAt", direction = Sort.Direction.DESC) Pageable pageable) {
        PageResponse<TimePurchaseResponse> responses = timePurchaseService.getAllTimePurchases(status, pageable);
        return ResponseEntity.ok(responses);
    }

    /**
     * 6. Lấy lịch sử nạp giờ của 1 tài khoản khách hàng có phân trang & sắp xếp
     */
    @Operation(summary = "Lấy lịch sử nạp giờ của một tài khoản (phân trang)", description = "Lấy toàn bộ lịch sử các lần nạp giờ chơi của một khách hàng cụ thể.")
    @GetMapping("/account/{accountId}")
    @PreAuthorize("hasAnyRole('ADMIN', 'STAFF')")
    public ResponseEntity<PageResponse<TimePurchaseResponse>> getTimePurchasesByAccountId(
            @PathVariable Long accountId,
            @PageableDefault(sort = "createdAt", direction = Sort.Direction.DESC) Pageable pageable) {
        PageResponse<TimePurchaseResponse> responses = timePurchaseService.getTimePurchasesByAccountId(accountId, pageable);
        return ResponseEntity.ok(responses);
    }
}
