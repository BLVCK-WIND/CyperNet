package com.cybernet.internet_cafe_management.controller;

import com.cybernet.internet_cafe_management.dto.request.ComputerLoginRequest;
import com.cybernet.internet_cafe_management.dto.request.ExtendSessionRequest;
import com.cybernet.internet_cafe_management.dto.request.StartSessionRequest;
import com.cybernet.internet_cafe_management.dto.request.TransferComputerRequest;
import com.cybernet.internet_cafe_management.dto.response.PageResponse;
import com.cybernet.internet_cafe_management.dto.response.SessionCheckResponse;
import com.cybernet.internet_cafe_management.dto.response.SessionResponse;
import com.cybernet.internet_cafe_management.entity.Session.Status;
import com.cybernet.internet_cafe_management.service.SessionService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@Tag(name = "Session Management", description = "APIs quản lý phiên chơi máy trạm, mở máy, chuyển máy và gia hạn giờ")
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
    @Operation(summary = "Mở máy cho khách tại quầy (Staff)", description = "Nhân viên chủ động mở phiên chơi cho khách từ phần mềm máy chủ.")
    @PostMapping("/start")
    @PreAuthorize("hasAnyRole('ADMIN', 'STAFF')")
    public ResponseEntity<SessionResponse> startSession(@Valid @RequestBody StartSessionRequest request) {
        SessionResponse response = sessionService.startSession(request);
        return new ResponseEntity<>(response, HttpStatus.CREATED);
    }

    /**
     * 1b. Khách hàng đăng nhập máy trạm mở phiên chơi (POST /api/sessions/login - UC-2)
     * Public endpoint: Khách tự đăng nhập tại máy trạm, SecurityConfig permitAll.
     */
    @Operation(summary = "Khách đăng nhập máy trạm (UC-2)", description = "Khách hàng tự đăng nhập bằng SĐT và mật khẩu tại máy trạm (Client PC). Endpoint Public.")
    @PostMapping("/login")
    public ResponseEntity<SessionResponse> loginAndStartSession(@Valid @RequestBody ComputerLoginRequest request) {
        SessionResponse response = sessionService.loginAndStartSession(request);
        return new ResponseEntity<>(response, HttpStatus.CREATED);
    }

    /**
     * 2. Kết thúc phiên chơi (PATCH /api/sessions/{id}/end)
     * Trả về HTTP 200 OK, trả máy về AVAILABLE và hoàn lại số phút dư cho khách.
     */
    @Operation(summary = "Kết thúc phiên chơi (UC-5)", description = "Đóng phiên chơi của khách, trả máy về trạng thái AVAILABLE và hoàn lại số phút chưa dùng vào tài khoản.")
    @PatchMapping("/{id}/end")
    @PreAuthorize("hasAnyRole('ADMIN', 'STAFF')")
    public ResponseEntity<SessionResponse> endSession(@PathVariable Long id) {
        SessionResponse response = sessionService.endSession(id);
        return ResponseEntity.ok(response);
    }

    /**
     * 3. Gia hạn thêm giờ chơi cho phiên đang chạy (PATCH /api/sessions/{id}/extend)
     */
    @Operation(summary = "Gia hạn thêm giờ chơi", description = "Gia hạn thêm thời gian chơi cho một phiên đang ACTIVE.")
    @PatchMapping("/{id}/extend")
    @PreAuthorize("hasAnyRole('ADMIN', 'STAFF')")
    public ResponseEntity<SessionResponse> extendSession(
            @PathVariable Long id,
            @Valid @RequestBody ExtendSessionRequest request) {
        SessionResponse response = sessionService.extendSession(id, request);
        return ResponseEntity.ok(response);
    }

    /**
     * 3b. Chuyển máy tính cho khách hàng (PATCH /api/sessions/{id}/transfer - UC-6)
     * Quy đổi thời gian theo đơn giá động giữa 2 máy, giữ nguyên phiên chơi và đơn PENDING.
     */
    @Operation(summary = "Chuyển máy chơi (UC-6)", description = "Chuyển khách sang máy đích đang rảnh, tự động tính toán lại thời gian còn lại theo chênh lệch đơn giá.")
    @PatchMapping("/{id}/transfer")
    @PreAuthorize("hasAnyRole('ADMIN', 'STAFF')")
    public ResponseEntity<SessionResponse> transferComputer(
            @PathVariable Long id,
            @Valid @RequestBody TransferComputerRequest request) {
        SessionResponse response = sessionService.transferComputer(id, request);
        return ResponseEntity.ok(response);
    }

    /**
     * 4. Xem chi tiết 1 phiên chơi theo ID (GET /api/sessions/{id})
     */
    @Operation(summary = "Xem chi tiết phiên chơi", description = "Lấy thông tin chi tiết một phiên chơi theo ID.")
    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'STAFF')")
    public ResponseEntity<SessionResponse> getSessionById(@PathVariable Long id) {
        SessionResponse response = sessionService.getSessionById(id);
        return ResponseEntity.ok(response);
    }

    /**
     * 5. Lấy danh sách phiên chơi có phân trang & sắp xếp (GET /api/sessions hoặc /api/sessions?status=ACTIVE)
     * Dùng cho màn hình quản lý quán net xem các máy nào đang có khách ngồi.
     * Mặc định sắp xếp theo startedAt DESC, 10 records / trang.
     */
    @Operation(summary = "Lấy danh sách phiên chơi (phân trang)", description = "Lấy danh sách các phiên chơi, hỗ trợ lọc theo trạng thái (ACTIVE, ENDED).")
    @GetMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'STAFF')")
    public ResponseEntity<PageResponse<SessionResponse>> getAllSessions(
            @RequestParam(required = false) Status status,
            @PageableDefault(sort = "startedAt", direction = Sort.Direction.DESC) Pageable pageable) {
        PageResponse<SessionResponse> responses = sessionService.getAllSessions(status, pageable);
        return ResponseEntity.ok(responses);
    }

    /**
     * 6. Tra cứu phiên ACTIVE bằng mã máy tính (GET /api/sessions/active/computer/{computerCode})
     * API cực kỳ quan trọng: Phục vụ khách dùng điện thoại quét mã QR tại bàn ("PC-01").
     */
    @Operation(summary = "Tra cứu phiên đang chạy theo mã máy", description = "Phục vụ quét mã QR tại máy trạm để lấy thông tin phiên chơi hiện tại.")
    @GetMapping("/active/computer/{computerCode}")
    @PreAuthorize("hasAnyRole('ADMIN', 'STAFF', 'CUSTOMER')")
    public ResponseEntity<SessionResponse> getActiveSessionByComputerCode(@PathVariable String computerCode) {
        SessionResponse response = sessionService.getActiveSessionByComputerCode(computerCode);
        return ResponseEntity.ok(response);
    }

    /**
     * 6b. Kiểm tra trạng thái máy trạm công khai (GET /api/sessions/check/{computerCode})
     * Phục vụ quét mã QR tại bàn để kiểm tra máy mà không cần đăng nhập.
     */
    @Operation(summary = "Kiểm tra trạng thái máy trạm công khai (QR check)", description = "Phục vụ quét mã QR tại máy trạm, không yêu cầu đăng nhập và không trả về dữ liệu cá nhân.")
    @GetMapping("/check/{computerCode}")
    @PreAuthorize("permitAll()")
    public ResponseEntity<SessionCheckResponse> checkComputerSession(@PathVariable String computerCode) {
        SessionCheckResponse response = sessionService.checkComputerSession(computerCode);
        return ResponseEntity.ok(response);
    }

    /**
     * 7. Lấy lịch sử tất cả phiên chơi của 1 khách hàng có phân trang (GET /api/sessions/account/{accountId})
     */
    @Operation(summary = "Xem lịch sử chơi của khách hàng (phân trang)", description = "Lấy lịch sử các phiên chơi của một tài khoản khách hàng cụ thể.")
    @GetMapping("/account/{accountId}")
    @PreAuthorize("hasAnyRole('ADMIN', 'STAFF')")
    public ResponseEntity<PageResponse<SessionResponse>> getSessionsByAccountId(
            @PathVariable Long accountId,
            @PageableDefault(sort = "startedAt", direction = Sort.Direction.DESC) Pageable pageable) {
        PageResponse<SessionResponse> responses = sessionService.getSessionsByAccountId(accountId, pageable);
        return ResponseEntity.ok(responses);
    }

    /**
     * 7b. Lấy lịch sử tất cả phiên chơi của 1 máy tính có phân trang (GET /api/sessions/computer/{computerId})
     */
    @Operation(summary = "Xem lịch sử phiên chơi của máy tính (phân trang)", description = "Lấy lịch sử các phiên chơi đã từng chạy trên một máy trạm cụ thể.")
    @GetMapping("/computer/{computerId}")
    @PreAuthorize("hasAnyRole('ADMIN', 'STAFF')")
    public ResponseEntity<PageResponse<SessionResponse>> getSessionsByComputerId(
            @PathVariable Long computerId,
            @PageableDefault(sort = "startedAt", direction = Sort.Direction.DESC) Pageable pageable) {
        PageResponse<SessionResponse> responses = sessionService.getSessionsByComputerId(computerId, pageable);
        return ResponseEntity.ok(responses);
    }
}
