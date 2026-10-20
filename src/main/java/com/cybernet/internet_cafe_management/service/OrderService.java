package com.cybernet.internet_cafe_management.service;

import com.cybernet.internet_cafe_management.dto.request.CreateDirectOrderRequest;
import com.cybernet.internet_cafe_management.dto.request.CreateOrderItemRequest;
import com.cybernet.internet_cafe_management.dto.request.CreateOrderRequest;
import com.cybernet.internet_cafe_management.dto.response.OrderResponse;
import com.cybernet.internet_cafe_management.dto.response.PageResponse;
import com.cybernet.internet_cafe_management.entity.*;
import com.cybernet.internet_cafe_management.entity.Order.PaymentMethod;
import com.cybernet.internet_cafe_management.entity.Order.Status;
import com.cybernet.internet_cafe_management.exception.ResourceNotFoundException;
import com.cybernet.internet_cafe_management.repository.AccountRepository;
import com.cybernet.internet_cafe_management.repository.ItemRepository;
import com.cybernet.internet_cafe_management.repository.OrderRepository;
import com.cybernet.internet_cafe_management.repository.SessionRepository;
import com.cybernet.internet_cafe_management.repository.specification.OrderSpecification;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Slf4j
@Service
public class OrderService {

    private final OrderRepository orderRepository;
    private final SessionRepository sessionRepository;
    private final ItemRepository itemRepository;
    private final AccountRepository accountRepository;
    private final RealtimeNotificationService realtimeNotificationService;
    private final AuditLogService auditLogService;

    // Dependency Injection qua Constructor
    public OrderService(OrderRepository orderRepository,
                        SessionRepository sessionRepository,
                        ItemRepository itemRepository,
                        AccountRepository accountRepository,
                        RealtimeNotificationService realtimeNotificationService,
                        AuditLogService auditLogService) {
        this.orderRepository = orderRepository;
        this.sessionRepository = sessionRepository;
        this.itemRepository = itemRepository;
        this.accountRepository = accountRepository;
        this.realtimeNotificationService = realtimeNotificationService;
        this.auditLogService = auditLogService;
    }

    /**
     * 1. TẠO ĐƠN ĐẶT MÓN (createOrder)
     * Khách hàng quét mã QR tại máy tính để gọi món ăn/uống hoặc nạp thêm giờ chơi.
     * Áp dụng CascadeType.ALL: Lưu Order sẽ tự động lưu danh sách OrderItem con.
     */
    @Transactional
    public OrderResponse createOrder(CreateOrderRequest request) {
        return createOrder(request, null);
    }

    @Transactional
    public OrderResponse createOrder(CreateOrderRequest request, String currentUserPhone) {
        // Validate giỏ hàng
        if (request.getItems() == null || request.getItems().isEmpty()) {
            throw new IllegalArgumentException("Giỏ hàng không được để trống!");
        }
        if (request.getPaymentMethod() == null) {
            throw new IllegalArgumentException("Vui lòng chọn phương thức thanh toán (QR hoặc CASH)!");
        }

        // Validate phiên chơi: Máy phải đang có phiên ACTIVE
        Session session = sessionRepository.findById(request.getSessionId())
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy phiên chơi với ID = " + request.getSessionId()));

        if (session.getStatus() != Session.Status.ACTIVE) {
            throw new IllegalStateException("Phiên chơi này đã kết thúc, không thể đặt món!");
        }

        // Kiểm tra quyền sở hữu phiên: Nếu là khách hàng, chỉ được đặt món cho chính phiên của mình (B4)
        if (currentUserPhone != null && session.getAccount() != null) {
            Account user = accountRepository.findByPhone(currentUserPhone).orElse(null);
            if (user != null && user.getRole() == Account.Role.CUSTOMER) {
                if (!session.getAccount().getPhone().equals(currentUserPhone)) {
                    throw new org.springframework.security.access.AccessDeniedException("Bạn chỉ có thể đặt món cho chính phiên chơi của mình!");
                }
            }
        }

        // Khởi tạo Order cha
        Order order = new Order();
        order.setSession(session);
        order.setPaymentMethod(request.getPaymentMethod());
        order.setStatus(Status.PENDING_PAYMENT);

        BigDecimal totalAmount = BigDecimal.ZERO;
        List<OrderItem> orderItemList = new ArrayList<>();

        // Xử lý từng món trong giỏ hàng
        for (CreateOrderItemRequest itemReq : request.getItems()) {
            if (itemReq.getQuantity() <= 0) {
                throw new IllegalArgumentException("Số lượng món phải lớn hơn 0!");
            }

            Item item = itemRepository.findById(itemReq.getItemId())
                    .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy món với ID = " + itemReq.getItemId()));

            if (!item.isAvailable()) {
                throw new IllegalStateException("Món [" + item.getName() + "] hiện đã hết hàng!");
            }

            // SNAPSHOT GIÁ: Lưu cứng giá tại thời điểm đặt để bảo vệ doanh thu lịch sử
            BigDecimal unitPrice = item.getPrice();
            BigDecimal subtotal = unitPrice.multiply(BigDecimal.valueOf(itemReq.getQuantity()));
            totalAmount = totalAmount.add(subtotal);

            // Tạo OrderItem con
            OrderItem orderItem = new OrderItem();
            orderItem.setOrder(order); // Gắn quan hệ với Order cha
            orderItem.setItem(item);
            orderItem.setQuantity(itemReq.getQuantity());
            orderItem.setUnitPrice(unitPrice);
            orderItem.setSubtotal(subtotal);

            orderItemList.add(orderItem);
        }

        order.setTotalAmount(totalAmount);
        order.setOrderItems(orderItemList);

        // Do có cascade = ALL, hàm save dưới đây sẽ tự động INSERT cả bảng orders và order_items
        Order savedOrder = orderRepository.save(order);
        realtimeNotificationService.broadcastOrderEvent(savedOrder, "CREATED", "Khách gọi món mới tại máy " + (session.getComputer() != null ? session.getComputer().getCode() : "N/A"));
        log.info("Order: Tạo đơn hàng mới [ID={}] cho phiên [ID={}], tổng tiền: {} VND, phương thức: {}",
                savedOrder.getId(), session.getId(), savedOrder.getTotalAmount(), savedOrder.getPaymentMethod());
        return OrderResponse.fromEntity(savedOrder);
    }

    /**
     * 2. NHÂN VIÊN DUYỆT ĐƠN HÀNG (confirmOrder)
     * Sau khi nhận đủ tiền (mặt hoặc chuyển khoản), nhân viên bấm xác nhận.
     * Nếu trong đơn có món thuộc loại PLAYTIME (thêm giờ), hệ thống tự cộng giờ vào Session.
     */
    @Transactional
    public OrderResponse confirmOrder(Long orderId, Long staffId) {
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy đơn hàng với ID = " + orderId));

        if (order.getStatus() != Status.PENDING_PAYMENT) {
            throw new IllegalStateException("Đơn hàng không ở trạng thái chờ duyệt! Trạng thái hiện tại: " + order.getStatus());
        }

        Account staff = accountRepository.findById(staffId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy tài khoản nhân viên với ID = " + staffId));

        if (staff.getRole() == Account.Role.CUSTOMER) {
            throw new IllegalArgumentException("Tài khoản này là khách hàng, không có quyền duyệt đơn hàng!");
        }

        // Cập nhật trạng thái duyệt
        order.setStatus(Status.CONFIRMED);
        order.setConfirmedByStaff(staff);
        order.setConfirmedAt(LocalDateTime.now());

        // KIỂM TRA TỰ ĐỘNG CỘNG GIỜ NẾU ĐƠN CÓ MÓN PLAYTIME
        Session session = order.getSession();
        int extraMinutes = 0;

        for (OrderItem orderItem : order.getOrderItems()) {
            if (orderItem.getItem().getType() == Item.Type.PLAYTIME) {
                // Giả định mỗi đơn vị món PLAYTIME tương ứng 60 phút
                extraMinutes += (60 * orderItem.getQuantity());
            }
        }

        if (extraMinutes > 0 && session.getStatus() == Session.Status.ACTIVE) {
            // Gia hạn thời điểm hết hạn của phiên
            session.setExpiresAt(session.getExpiresAt().plusMinutes(extraMinutes));
            sessionRepository.save(session);

            // Cộng thêm phút vào tài khoản khách
            Account customer = session.getAccount();
            customer.setRemainingMinutes(customer.getRemainingMinutes() + extraMinutes);
            accountRepository.save(customer);
        }

        Order updatedOrder = orderRepository.save(order);
        realtimeNotificationService.broadcastOrderEvent(updatedOrder, "CONFIRMED", "Đã xác nhận thanh toán đơn #" + updatedOrder.getId());
        auditLogService.log("CONFIRM_ORDER", "Order", orderId, "Xác nhận đơn #" + orderId + " bởi staffId=" + staffId + " (cộng giờ: " + extraMinutes + " phút)");
        log.info("Order Confirm: Nhân viên [ID={}] xác nhận đơn hàng [ID={}]. Cộng thêm: {} phút",
                staffId, orderId, extraMinutes);
        return OrderResponse.fromEntity(updatedOrder);
    }

    /**
     * 3. HUỶ ĐƠN HÀNG (cancelOrder)
     * Chỉ huỷ được khi đơn đang ở trạng thái PENDING_PAYMENT.
     */
    @Transactional
    public OrderResponse cancelOrder(Long orderId) {
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy đơn hàng với ID = " + orderId));

        if (order.getStatus() != Status.PENDING_PAYMENT) {
            throw new IllegalStateException("Chỉ có thể huỷ đơn hàng đang chờ thanh toán! Trạng thái: " + order.getStatus());
        }

        order.setStatus(Status.CANCELLED);
        Order updated = orderRepository.save(order);
        realtimeNotificationService.broadcastOrderEvent(updated, "CANCELLED", "Đơn hàng #" + updated.getId() + " đã bị hủy");
        auditLogService.log("CANCEL_ORDER", "Order", orderId, "Hủy đơn hàng #" + orderId);
        log.warn("Order Cancel: Đã huỷ đơn hàng [ID={}]", orderId);
        return OrderResponse.fromEntity(updated);
    }

    /**
     * 4. LẤY CHI TIẾT 1 ĐƠN HÀNG THEO ID
     */
    @Transactional(readOnly = true)
    public OrderResponse getOrderById(Long id) {
        Order order = orderRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy đơn hàng với ID = " + id));
        return OrderResponse.fromEntity(order);
    }

    /**
     * 5. LẤY TẤT CẢ ĐƠN HÀNG (Lọc theo PENDING_PAYMENT cho màn hình quầy bar/bếp)
     */
    @Transactional(readOnly = true)
    public List<OrderResponse> getAllOrders(Status status) {
        List<Order> list = (status != null)
                ? orderRepository.findByStatusOrderByCreatedAtDesc(status)
                : orderRepository.findAll();

        return list.stream()
                .map(OrderResponse::fromEntity)
                .toList();
    }

    /**
     * 5b. LẤY TẤT CẢ ĐƠN HÀNG CÓ PHÂN TRANG & SẮP XẾP
     */
    @Transactional(readOnly = true)
    public PageResponse<OrderResponse> getAllOrders(Status status, Pageable pageable) {
        Page<Order> orderPage = (status != null)
                ? orderRepository.findByStatus(status, pageable)
                : orderRepository.findAll(pageable);

        return PageResponse.fromPage(orderPage, OrderResponse::fromEntity);
    }

    /**
     * 5c. TÌM KIẾM & LỌC ĐƠN HÀNG NÂNG CAO (JPA Specification Pattern)
     */
    @Transactional(readOnly = true)
    public PageResponse<OrderResponse> searchOrders(
            Status status,
            PaymentMethod paymentMethod,
            LocalDateTime fromDate,
            LocalDateTime toDate,
            BigDecimal minAmount,
            BigDecimal maxAmount,
            String computerCode,
            String customerPhone,
            Pageable pageable) {

        Specification<Order> spec = OrderSpecification.filter(
                status, paymentMethod, fromDate, toDate, minAmount, maxAmount, computerCode, customerPhone);

        Page<Order> page = orderRepository.findAll(spec, pageable);
        return PageResponse.fromPage(page, OrderResponse::fromEntity);
    }

    /**
     * 6. LẤY DANH SÁCH ĐƠN HÀNG CỦA 1 PHIÊN CHƠI
     */
    @Transactional(readOnly = true)
    public List<OrderResponse> getOrdersBySessionId(Long sessionId) {
        if (!sessionRepository.existsById(sessionId)) {
            throw new ResourceNotFoundException("Không tìm thấy phiên chơi với ID = " + sessionId);
        }

        return orderRepository.findBySessionIdOrderByCreatedAtDesc(sessionId)
                .stream()
                .map(OrderResponse::fromEntity)
                .toList();
    }

    /**
     * 6b. LẤY DANH SÁCH ĐƠN HÀNG CỦA 1 PHIÊN CHƠI CÓ PHÂN TRANG
     */
    @Transactional(readOnly = true)
    public PageResponse<OrderResponse> getOrdersBySessionId(Long sessionId, Pageable pageable) {
        return getOrdersBySessionId(sessionId, null, pageable);
    }

    @Transactional(readOnly = true)
    public PageResponse<OrderResponse> getOrdersBySessionId(Long sessionId, String currentUserPhone, Pageable pageable) {
        Session session = sessionRepository.findById(sessionId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy phiên chơi với ID = " + sessionId));

        // Kiểm tra quyền sở hữu phiên: Nếu là khách hàng, chỉ được xem đơn hàng của chính phiên mình (B4)
        if (currentUserPhone != null && session.getAccount() != null) {
            Account user = accountRepository.findByPhone(currentUserPhone).orElse(null);
            if (user != null && user.getRole() == Account.Role.CUSTOMER) {
                if (!session.getAccount().getPhone().equals(currentUserPhone)) {
                    throw new org.springframework.security.access.AccessDeniedException("Bạn không có quyền xem đơn hàng của phiên chơi khác!");
                }
            }
        }

        Page<Order> orderPage = orderRepository.findBySessionId(sessionId, pageable);
        return PageResponse.fromPage(orderPage, OrderResponse::fromEntity);
    }

    /**
     * 7. NHÂN VIÊN TẠO ĐƠN TRỰC TIẾP TẠI QUẦY (createDirectOrder - UC-7)
     * Khách gọi món / thêm giờ trả tiền mặt trực tiếp tại quầy thu ngân.
     * Tạo Order, gán CONFIRMED ngay lập tức, tự động kích hoạt nạp giờ nếu có món PLAYTIME.
     */
    @Transactional
    public OrderResponse createDirectOrder(CreateDirectOrderRequest request) {
        if (request.getSessionId() == null) {
            throw new IllegalArgumentException("Vui lòng cung cấp ID phiên chơi của khách!");
        }
        if (request.getStaffId() == null) {
            throw new IllegalArgumentException("Vui lòng cung cấp ID nhân viên tạo đơn!");
        }
        if (request.getItems() == null || request.getItems().isEmpty()) {
            throw new IllegalArgumentException("Giỏ hàng không được để trống!");
        }

        // 1. Kiểm tra nhân viên
        Account staff = accountRepository.findById(request.getStaffId())
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy tài khoản nhân viên với ID = " + request.getStaffId()));

        if (staff.getRole() == Account.Role.CUSTOMER) {
            throw new IllegalArgumentException("Tài khoản này là khách hàng, không có quyền tạo đơn trực tiếp tại quầy!");
        }

        // 2. Kiểm tra phiên chơi
        Session session = sessionRepository.findById(request.getSessionId())
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy phiên chơi với ID = " + request.getSessionId()));

        if (session.getStatus() != Session.Status.ACTIVE) {
            throw new IllegalStateException("Phiên chơi này đã kết thúc, không thể tạo đơn hàng!");
        }

        // 3. Khởi tạo Order với trạng thái CONFIRMED
        LocalDateTime now = LocalDateTime.now();
        Order order = new Order();
        order.setSession(session);
        order.setPaymentMethod(request.getPaymentMethod() != null ? request.getPaymentMethod() : PaymentMethod.CASH);
        order.setStatus(Status.CONFIRMED);
        order.setConfirmedByStaff(staff);
        order.setConfirmedAt(now);

        BigDecimal totalAmount = BigDecimal.ZERO;
        List<OrderItem> orderItemList = new ArrayList<>();
        int extraMinutes = 0;

        // 4. Xử lý từng món trong đơn
        for (CreateOrderItemRequest itemReq : request.getItems()) {
            if (itemReq.getQuantity() <= 0) {
                throw new IllegalArgumentException("Số lượng món phải lớn hơn 0!");
            }

            Item item = itemRepository.findById(itemReq.getItemId())
                    .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy món với ID = " + itemReq.getItemId()));

            if (!item.isAvailable()) {
                throw new IllegalStateException("Món [" + item.getName() + "] hiện đã hết hàng!");
            }

            BigDecimal unitPrice = item.getPrice();
            BigDecimal subtotal = unitPrice.multiply(BigDecimal.valueOf(itemReq.getQuantity()));
            totalAmount = totalAmount.add(subtotal);

            OrderItem orderItem = new OrderItem();
            orderItem.setOrder(order);
            orderItem.setItem(item);
            orderItem.setQuantity(itemReq.getQuantity());
            orderItem.setUnitPrice(unitPrice);
            orderItem.setSubtotal(subtotal);

            orderItemList.add(orderItem);

            // Kiểm tra món loại PLAYTIME
            if (item.getType() == Item.Type.PLAYTIME) {
                extraMinutes += (60 * itemReq.getQuantity());
            }
        }

        order.setTotalAmount(totalAmount);
        order.setOrderItems(orderItemList);

        // 5. Nếu có món loại PLAYTIME, tự động cộng giờ vào phiên và tài khoản
        if (extraMinutes > 0 && session.getStatus() == Session.Status.ACTIVE) {
            session.setExpiresAt(session.getExpiresAt().plusMinutes(extraMinutes));
            sessionRepository.save(session);

            Account customer = session.getAccount();
            customer.setRemainingMinutes(customer.getRemainingMinutes() + extraMinutes);
            accountRepository.save(customer);
        }

        Order savedOrder = orderRepository.save(order);
        realtimeNotificationService.broadcastOrderEvent(savedOrder, "CREATED_DIRECT", "Tạo và thanh toán đơn trực tiếp tại quầy #" + savedOrder.getId());
        auditLogService.log("CREATE_DIRECT_ORDER", "Order", savedOrder.getId(),
                "Tạo và thu tiền trực tiếp đơn #" + savedOrder.getId() + " cho phiên #" + session.getId() + ", tổng: " + savedOrder.getTotalAmount() + " VND");
        log.info("UC-7 Direct Order: Nhân viên [ID={}] tạo đơn trực tiếp [ID={}] cho phiên [ID={}], tổng: {} VND, cộng giờ: {} phút",
                staff.getId(), savedOrder.getId(), session.getId(), savedOrder.getTotalAmount(), extraMinutes);
        return OrderResponse.fromEntity(savedOrder);
    }
}
