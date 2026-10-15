package com.cybernet.internet_cafe_management.controller;

import com.cybernet.internet_cafe_management.dto.request.ComputerLoginRequest;
import com.cybernet.internet_cafe_management.dto.request.ExtendSessionRequest;
import com.cybernet.internet_cafe_management.dto.request.StartSessionRequest;
import com.cybernet.internet_cafe_management.dto.request.TransferComputerRequest;
import com.cybernet.internet_cafe_management.dto.response.SessionResponse;
import com.cybernet.internet_cafe_management.entity.Session.Status;
import com.cybernet.internet_cafe_management.service.SessionService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/sessions")
public class SessionController {

    private final SessionService sessionService;

    public SessionController(SessionService sessionService) {
        this.sessionService = sessionService;
    }

    /**
     * 1. Bắt đầu phiên chơi mới (POST /api/sessions/start)
     * Trả về HTTP 201 CREATED kèm chi tiết phiên và trạng thái máy chuyển sang IN_USE.
     */
    @PostMapping("/start")
    @PreAuthorize("hasAnyRole('ADMIN', 'STAFF')")
    public ResponseEntity<SessionResponse> startSession(@RequestBody StartSessionRequest request) {
        SessionResponse response = sessionService.startSession(request);
        return new ResponseEntity<>(response, HttpStatus.CREATED);
    }

    /**
     * 1b. Khách hàng đăng nhập máy trạm mở phiên chơi (POST /api/sessions/login - UC-2)
     * Public endpoint: Khách tự đăng nhập tại máy trạm, SecurityConfig permitAll.
     */
    @PostMapping("/login")
    public ResponseEntity<SessionResponse> loginAndStartSession(@RequestBody ComputerLoginRequest request) {
        SessionResponse response = sessionService.loginAndStartSession(request);
        return new ResponseEntity<>(response, HttpStatus.CREATED);
    }

    /**
     * 2. Kết thúc phiên chơi (PATCH /api/sessions/{id}/end)
     * Trả về HTTP 200 OK, trả máy về AVAILABLE và hoàn lại số phút dư cho khách.
     */
    @PatchMapping("/{id}/end")
    @PreAuthorize("hasAnyRole('ADMIN', 'STAFF')")
    public ResponseEntity<SessionResponse> endSession(@PathVariable Long id) {
        SessionResponse response = sessionService.endSession(id);
        return ResponseEntity.ok(response);
    }

    /**
     * 3. Gia hạn thêm giờ chơi cho phiên đang chạy (PATCH /api/sessions/{id}/extend)
     */
    @PatchMapping("/{id}/extend")
    @PreAuthorize("hasAnyRole('ADMIN', 'STAFF')")
    public ResponseEntity<SessionResponse> extendSession(
            @PathVariable Long id,
            @RequestBody ExtendSessionRequest request) {
        SessionResponse response = sessionService.extendSession(id, request);
        return ResponseEntity.ok(response);
    }

    /**
     * 3b. Chuyển máy tính cho khách hàng (PATCH /api/sessions/{id}/transfer - UC-6)
     * Quy đổi thời gian theo đơn giá động giữa 2 máy, giữ nguyên phiên chơi và đơn PENDING.
     */
    @PatchMapping("/{id}/transfer")
    @PreAuthorize("hasAnyRole('ADMIN', 'STAFF')")
    public ResponseEntity<SessionResponse> transferComputer(
            @PathVariable Long id,
            @RequestBody TransferComputerRequest request) {
        SessionResponse response = sessionService.transferComputer(id, request);
        return ResponseEntity.ok(response);
    }

    /**
     * 4. Xem chi tiết 1 phiên chơi theo ID (GET /api/sessions/{id})
     */
    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'STAFF')")
    public ResponseEntity<SessionResponse> getSessionById(@PathVariable Long id) {
        SessionResponse response = sessionService.getSessionById(id);
        return ResponseEntity.ok(response);
    }

    /**
     * 5. Lấy danh sách phiên chơi (GET /api/sessions hoặc /api/sessions?status=ACTIVE)
     * Dùng cho màn hình quản lý quán net xem các máy nào đang có khách ngồi.
     */
    @GetMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'STAFF')")
    public ResponseEntity<List<SessionResponse>> getAllSessions(
            @RequestParam(required = false) Status status) {
        List<SessionResponse> responses = sessionService.getAllSessions(status);
        return ResponseEntity.ok(responses);
    }

    /**
     * 6. Tra cứu phiên ACTIVE bằng mã máy tính (GET /api/sessions/active/computer/{computerCode})
     * API cực kỳ quan trọng: Phục vụ khách dùng điện thoại quét mã QR tại bàn ("PC-01").
     */
    @GetMapping("/active/computer/{computerCode}")
    @PreAuthorize("hasAnyRole('ADMIN', 'STAFF', 'CUSTOMER')")
    public ResponseEntity<SessionResponse> getActiveSessionByComputerCode(@PathVariable String computerCode) {
        SessionResponse response = sessionService.getActiveSessionByComputerCode(computerCode);
        return ResponseEntity.ok(response);
    }

    /**
     * 7. Lấy lịch sử tất cả phiên chơi của 1 khách hàng (GET /api/sessions/account/{accountId})
     */
    @GetMapping("/account/{accountId}")
    @PreAuthorize("hasAnyRole('ADMIN', 'STAFF')")
    public ResponseEntity<List<SessionResponse>> getSessionsByAccountId(@PathVariable Long accountId) {
        List<SessionResponse> responses = sessionService.getSessionsByAccountId(accountId);
        return ResponseEntity.ok(responses);
    }
}
