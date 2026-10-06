package com.cybernet.internet_cafe_management.controller;

import com.cybernet.internet_cafe_management.dto.request.ExtendSessionRequest;
import com.cybernet.internet_cafe_management.dto.request.StartSessionRequest;
import com.cybernet.internet_cafe_management.dto.response.SessionResponse;
import com.cybernet.internet_cafe_management.entity.Session.Status;
import com.cybernet.internet_cafe_management.service.SessionService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
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
    public ResponseEntity<SessionResponse> startSession(@RequestBody StartSessionRequest request) {
        SessionResponse response = sessionService.startSession(request);
        return new ResponseEntity<>(response, HttpStatus.CREATED);
    }

    /**
     * 2. Kết thúc phiên chơi (PATCH /api/sessions/{id}/end)
     * Trả về HTTP 200 OK, trả máy về AVAILABLE và hoàn lại số phút dư cho khách.
     */
    @PatchMapping("/{id}/end")
    public ResponseEntity<SessionResponse> endSession(@PathVariable Long id) {
        SessionResponse response = sessionService.endSession(id);
        return ResponseEntity.ok(response);
    }

    /**
     * 3. Gia hạn thêm giờ chơi cho phiên đang chạy (PATCH /api/sessions/{id}/extend)
     */
    @PatchMapping("/{id}/extend")
    public ResponseEntity<SessionResponse> extendSession(
            @PathVariable Long id,
            @RequestBody ExtendSessionRequest request) {
        SessionResponse response = sessionService.extendSession(id, request);
        return ResponseEntity.ok(response);
    }

    /**
     * 4. Xem chi tiết 1 phiên chơi theo ID (GET /api/sessions/{id})
     */
    @GetMapping("/{id}")
    public ResponseEntity<SessionResponse> getSessionById(@PathVariable Long id) {
        SessionResponse response = sessionService.getSessionById(id);
        return ResponseEntity.ok(response);
    }

    /**
     * 5. Lấy danh sách phiên chơi (GET /api/sessions hoặc /api/sessions?status=ACTIVE)
     * Dùng cho màn hình quản lý quán net xem các máy nào đang có khách ngồi.
     */
    @GetMapping
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
    public ResponseEntity<SessionResponse> getActiveSessionByComputerCode(@PathVariable String computerCode) {
        SessionResponse response = sessionService.getActiveSessionByComputerCode(computerCode);
        return ResponseEntity.ok(response);
    }

    /**
     * 7. Lấy lịch sử tất cả phiên chơi của 1 khách hàng (GET /api/sessions/account/{accountId})
     */
    @GetMapping("/account/{accountId}")
    public ResponseEntity<List<SessionResponse>> getSessionsByAccountId(@PathVariable Long accountId) {
        List<SessionResponse> responses = sessionService.getSessionsByAccountId(accountId);
        return ResponseEntity.ok(responses);
    }
}
