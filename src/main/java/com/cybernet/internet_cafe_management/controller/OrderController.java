package com.cybernet.internet_cafe_management.controller;

import com.cybernet.internet_cafe_management.dto.request.CreateOrderRequest;
import com.cybernet.internet_cafe_management.dto.response.OrderResponse;
import com.cybernet.internet_cafe_management.entity.Order.Status;
import com.cybernet.internet_cafe_management.service.OrderService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/orders")
public class OrderController {

    private final OrderService orderService;

    public OrderController(OrderService orderService) {
        this.orderService = orderService;
    }

    /**
     * 1. Khách gọi món qua điện thoại (POST /api/orders)
     * Trả về HTTP 201 CREATED kèm thông tin đơn PENDING_PAYMENT.
     */
    @PostMapping
    public ResponseEntity<OrderResponse> createOrder(@RequestBody CreateOrderRequest request) {
        OrderResponse response = orderService.createOrder(request);
        return new ResponseEntity<>(response, HttpStatus.CREATED);
    }

    /**
     * 2. Nhân viên xác nhận đã nhận tiền (PATCH /api/orders/{id}/confirm?staffId=2)
     * Nếu có gói giờ chơi thì tự động cộng giờ vào phiên.
     */
    @PatchMapping("/{id}/confirm")
    public ResponseEntity<OrderResponse> confirmOrder(
            @PathVariable Long id,
            @RequestParam Long staffId) {
        OrderResponse response = orderService.confirmOrder(id, staffId);
        return ResponseEntity.ok(response);
    }

    /**
     * 3. Huỷ đơn hàng khi khách đổi ý (PATCH /api/orders/{id}/cancel)
     */
    @PatchMapping("/{id}/cancel")
    public ResponseEntity<OrderResponse> cancelOrder(@PathVariable Long id) {
        OrderResponse response = orderService.cancelOrder(id);
        return ResponseEntity.ok(response);
    }

    /**
     * 4. Xem chi tiết 1 đơn hàng (GET /api/orders/{id})
     */
    @GetMapping("/{id}")
    public ResponseEntity<OrderResponse> getOrderById(@PathVariable Long id) {
        OrderResponse response = orderService.getOrderById(id);
        return ResponseEntity.ok(response);
    }

    /**
     * 5. Lấy danh sách đơn hàng (GET /api/orders hoặc /api/orders?status=PENDING_PAYMENT)
     * Phục vụ màn hình bếp và quầy thu ngân theo dõi các đơn chờ làm món.
     */
    @GetMapping
    public ResponseEntity<List<OrderResponse>> getAllOrders(
            @RequestParam(required = false) Status status) {
        List<OrderResponse> responses = orderService.getAllOrders(status);
        return ResponseEntity.ok(responses);
    }

    /**
     * 6. Lấy tất cả đơn hàng đã gọi của 1 phiên chơi (GET /api/orders/session/{sessionId})
     */
    @GetMapping("/session/{sessionId}")
    public ResponseEntity<List<OrderResponse>> getOrdersBySessionId(@PathVariable Long sessionId) {
        List<OrderResponse> responses = orderService.getOrdersBySessionId(sessionId);
        return ResponseEntity.ok(responses);
    }
}
