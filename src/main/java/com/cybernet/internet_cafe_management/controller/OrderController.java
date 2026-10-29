package com.cybernet.internet_cafe_management.controller;

import com.cybernet.internet_cafe_management.dto.request.CreateDirectOrderRequest;
import com.cybernet.internet_cafe_management.dto.request.CreateOrderRequest;
import com.cybernet.internet_cafe_management.dto.response.OrderResponse;
import com.cybernet.internet_cafe_management.dto.response.PageResponse;
import com.cybernet.internet_cafe_management.entity.Account;
import com.cybernet.internet_cafe_management.entity.Order.PaymentMethod;
import com.cybernet.internet_cafe_management.entity.Order.Status;
import com.cybernet.internet_cafe_management.exception.ResourceNotFoundException;
import com.cybernet.internet_cafe_management.repository.AccountRepository;
import com.cybernet.internet_cafe_management.service.OrderService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

@Tag(name = "Order Management", description = "APIs đặt món tại máy, bán hàng trực tiếp tại quầy và xử lý trạng thái đơn hàng")
@RestController
@RequestMapping("/api/orders")
public class OrderController {

    private final OrderService orderService;
    private final AccountRepository accountRepository;

    public OrderController(OrderService orderService, AccountRepository accountRepository) {
        this.orderService = orderService;
        this.accountRepository = accountRepository;
    }

    /**
     * 1. Khách gọi món qua điện thoại (POST /api/orders - UC-4)
     * Trả về HTTP 201 CREATED kèm thông tin đơn PENDING_PAYMENT.
     */
    @Operation(summary = "Khách gọi món tại máy (UC-4)", description = "Khách hàng quét mã QR tại máy gọi đồ ăn, thức uống hoặc thêm giờ chơi. Đơn tạo ở trạng thái PENDING_PAYMENT.")
    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'STAFF', 'CUSTOMER')")
    public ResponseEntity<OrderResponse> createOrder(
            @Valid @RequestBody CreateOrderRequest request,
            Authentication authentication) {
        String currentUserPhone = (authentication != null) ? authentication.getName() : null;
        OrderResponse response = orderService.createOrder(request, currentUserPhone);
        return new ResponseEntity<>(response, HttpStatus.CREATED);
    }

    /**
     * 1b. Nhân viên tạo đơn và thu tiền trực tiếp tại quầy (POST /api/orders/direct - UC-7)
     * Trả về HTTP 201 CREATED kèm thông tin đơn CONFIRMED và tự động kích hoạt nạp giờ nếu có PLAYTIME.
     * ID nhân viên thực hiện được trích xuất an toàn từ JWT (B1).
     */
    @Operation(summary = "Tạo đơn và thu tiền trực tiếp tại quầy (UC-7)", description = "Nhân viên tạo đơn trực tiếp tại quầy, thu tiền mặt hoặc chuyển khoản và tự động CONFIRMED đơn, nạp giờ nếu có PLAYTIME.")
    @PostMapping("/direct")
    @PreAuthorize("hasAnyRole('ADMIN', 'STAFF')")
    public ResponseEntity<OrderResponse> createDirectOrder(
            @Valid @RequestBody CreateDirectOrderRequest request,
            Authentication authentication) {
        Account staff = accountRepository.findByPhone(authentication.getName())
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy thông tin nhân viên từ phiên đăng nhập!"));
        request.setStaffId(staff.getId());
        OrderResponse response = orderService.createDirectOrder(request);
        return new ResponseEntity<>(response, HttpStatus.CREATED);
    }

    /**
     * 2. Nhân viên xác nhận đã nhận tiền (PATCH /api/orders/{id}/confirm)
     * Nếu có gói giờ chơi thì tự động cộng giờ vào phiên.
     * ID nhân viên xác nhận được trích xuất an toàn từ JWT (B1).
     */
    @Operation(summary = "Xác nhận đơn và thanh toán", description = "Nhân viên xác nhận thu tiền đơn hàng PENDING_PAYMENT. Tự động cộng giờ chơi nếu đơn chứa gói PLAYTIME.")
    @PatchMapping("/{id}/confirm")
    @PreAuthorize("hasAnyRole('ADMIN', 'STAFF')")
    public ResponseEntity<OrderResponse> confirmOrder(
            @PathVariable Long id,
            Authentication authentication) {
        Account staff = accountRepository.findByPhone(authentication.getName())
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy thông tin nhân viên từ phiên đăng nhập!"));
        OrderResponse response = orderService.confirmOrder(id, staff.getId());
        return ResponseEntity.ok(response);
    }

    /**
     * 2b. Khách hàng thông báo đã chuyển khoản VietQR (PATCH /api/orders/{id}/notify-transferred)
     */
    @Operation(summary = "Khách thông báo đã chuyển khoản VietQR", description = "Khách hàng bấm 'Tôi đã chuyển khoản' để gửi yêu cầu đối soát tới quầy thu ngân.")
    @PatchMapping("/{id}/notify-transferred")
    @PreAuthorize("hasAnyRole('ADMIN', 'STAFF', 'CUSTOMER')")
    public ResponseEntity<OrderResponse> notifyTransferred(
            @PathVariable Long id,
            Authentication authentication) {
        String phone = (authentication != null) ? authentication.getName() : null;
        OrderResponse response = orderService.notifyTransferred(id, phone);
        return ResponseEntity.ok(response);
    }

    /**
     * 3. Huỷ đơn hàng khi khách đổi ý (PATCH /api/orders/{id}/cancel)
     */
    @Operation(summary = "Hủy đơn hàng", description = "Hủy đơn hàng khi khách đổi ý hoặc hết món (chỉ hủy được đơn đang PENDING_PAYMENT).")
    @PatchMapping("/{id}/cancel")
    @PreAuthorize("hasAnyRole('ADMIN', 'STAFF', 'CUSTOMER')")
    public ResponseEntity<OrderResponse> cancelOrder(@PathVariable Long id) {
        OrderResponse response = orderService.cancelOrder(id);
        return ResponseEntity.ok(response);
    }

    /**
     * 4. Xem chi tiết 1 đơn hàng (GET /api/orders/{id})
     */
    @Operation(summary = "Xem chi tiết đơn hàng", description = "Lấy thông tin chi tiết các món đã gọi trong đơn và thông tin thanh toán.")
    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'STAFF')")
    public ResponseEntity<OrderResponse> getOrderById(@PathVariable Long id) {
        OrderResponse response = orderService.getOrderById(id);
        return ResponseEntity.ok(response);
    }

    /**
     * 5. Lấy danh sách đơn hàng có phân trang & sắp xếp (GET /api/orders hoặc /api/orders?status=PENDING_PAYMENT)
     * Phục vụ màn hình bếp và quầy thu ngân theo dõi các đơn chờ làm món.
     * Mặc định sắp xếp theo createdAt DESC, 10 records / trang.
     */
    @Operation(summary = "Lấy danh sách đơn hàng (phân trang)", description = "Lấy danh sách đơn hàng lọc theo trạng thái (PENDING_PAYMENT, CONFIRMED, CANCELLED) phục vụ thu ngân và bếp.")
    @GetMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'STAFF')")
    public ResponseEntity<PageResponse<OrderResponse>> getAllOrders(
            @RequestParam(required = false) Status status,
            @PageableDefault(sort = "createdAt", direction = Sort.Direction.DESC) Pageable pageable) {
        PageResponse<OrderResponse> responses = orderService.getAllOrders(status, pageable);
        return ResponseEntity.ok(responses);
    }

    /**
     * 6. Lấy tất cả đơn hàng đã gọi của 1 phiên chơi có phân trang (GET /api/orders/session/{sessionId})
     * Khách hàng chỉ xem được đơn hàng của chính phiên của mình (B4).
     */
    @Operation(summary = "Lấy danh sách đơn theo phiên chơi (phân trang)", description = "Xem lịch sử tất cả các đơn hàng đã đặt của một phiên chơi cụ thể.")
    @GetMapping("/session/{sessionId}")
    @PreAuthorize("hasAnyRole('ADMIN', 'STAFF', 'CUSTOMER')")
    public ResponseEntity<PageResponse<OrderResponse>> getOrdersBySessionId(
            @PathVariable Long sessionId,
            Authentication authentication,
            @PageableDefault(sort = "createdAt", direction = Sort.Direction.DESC) Pageable pageable) {
        String currentUserPhone = (authentication != null) ? authentication.getName() : null;
        PageResponse<OrderResponse> responses = orderService.getOrdersBySessionId(sessionId, currentUserPhone, pageable);
        return ResponseEntity.ok(responses);
    }

    /**
     * 6b. Khách hàng xem lịch sử tất cả đơn hàng của chính mình (GET /api/orders/my-orders)
     * Hỗ trợ xem đơn cả khi đang chơi và khi đặt tại máy trống chưa mở phiên.
     */
    @Operation(summary = "Khách hàng xem lịch sử đơn của mình", description = "Lấy toàn bộ đơn hàng của khách hàng đang đăng nhập, bất kể đơn có phiên chơi hay đặt tại máy trống.")
    @GetMapping("/my-orders")
    @PreAuthorize("hasRole('CUSTOMER')")
    public ResponseEntity<PageResponse<OrderResponse>> getMyOrders(
            Authentication authentication,
            @PageableDefault(sort = "createdAt", direction = Sort.Direction.DESC) Pageable pageable) {
        String phone = authentication.getName();
        PageResponse<OrderResponse> responses = orderService.getMyOrders(phone, pageable);
        return ResponseEntity.ok(responses);
    }

    /**
     * 7. Tìm kiếm & Lọc đơn hàng nâng cao (GET /api/orders/search)
     */
    @Operation(summary = "Tìm kiếm & lọc đơn hàng nâng cao (Specification)", description = "Lọc đa tiêu chí kết hợp: trạng thái, phương thức thanh toán, khoảng thời gian, khoảng tiền, mã máy và SĐT khách.")
    @GetMapping("/search")
    @PreAuthorize("hasAnyRole('ADMIN', 'STAFF')")
    public ResponseEntity<PageResponse<OrderResponse>> searchOrders(
            @RequestParam(required = false) Status status,
            @RequestParam(required = false) PaymentMethod paymentMethod,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime fromDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime toDate,
            @RequestParam(required = false) BigDecimal minAmount,
            @RequestParam(required = false) BigDecimal maxAmount,
            @RequestParam(required = false) String computerCode,
            @RequestParam(required = false) String customerPhone,
            @PageableDefault(sort = "createdAt", direction = Sort.Direction.DESC) Pageable pageable) {
        PageResponse<OrderResponse> response = orderService.searchOrders(
                status, paymentMethod, fromDate, toDate, minAmount, maxAmount, computerCode, customerPhone, pageable);
        return ResponseEntity.ok(response);
    }
}
