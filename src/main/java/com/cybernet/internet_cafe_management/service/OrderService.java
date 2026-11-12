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
import com.cybernet.internet_cafe_management.repository.ComputerRepository;
import com.cybernet.internet_cafe_management.repository.ItemRepository;
import com.cybernet.internet_cafe_management.repository.OrderRepository;
import com.cybernet.internet_cafe_management.repository.SessionRepository;
import com.cybernet.internet_cafe_management.repository.specification.OrderSpecification;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.function.Function;
import java.util.stream.Collectors;

@Slf4j
@Service
public class OrderService {

    private final OrderRepository orderRepository;
    private final SessionRepository sessionRepository;
    private final SessionService sessionService;
    private final ItemRepository itemRepository;
    private final AccountRepository accountRepository;
    private final ComputerRepository computerRepository;
    private final RealtimeNotificationService realtimeNotificationService;
    private final AuditLogService auditLogService;

    // Dependency Injection qua Constructor
    public OrderService(OrderRepository orderRepository,
                        SessionRepository sessionRepository,
                        SessionService sessionService,
                        ItemRepository itemRepository,
                        AccountRepository accountRepository,
                        ComputerRepository computerRepository,
                        RealtimeNotificationService realtimeNotificationService,
                        AuditLogService auditLogService) {
        this.orderRepository = orderRepository;
        this.sessionRepository = sessionRepository;
        this.sessionService = sessionService;
        this.itemRepository = itemRepository;
        this.accountRepository = accountRepository;
        this.computerRepository = computerRepository;
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

        // 1. Xác định Session, Computer và Account
        Session session = null;
        Computer computer = null;
        Account customer = null;

        if (request.getSessionId() != null) {
            session = sessionRepository.findById(request.getSessionId())
                    .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy phiên chơi với ID = " + request.getSessionId()));

            if (session.getStatus() != Session.Status.ACTIVE) {
                throw new IllegalStateException("Phiên chơi này đã kết thúc, không thể đặt món!");
            }

            computer = session.getComputer();
            customer = session.getAccount();

        } else if (request.getComputerCode() != null && !request.getComputerCode().isBlank()) {
            String pcCode = request.getComputerCode().trim();
            computer = computerRepository.findByCode(pcCode)
                    .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy máy tính với mã: " + pcCode));

            // Kiểm tra xem máy này có phiên ACTIVE không
            Session activeSession = sessionRepository.findByComputerCodeAndStatus(pcCode, Session.Status.ACTIVE).orElse(null);
            if (activeSession != null) {
                session = activeSession;
                customer = activeSession.getAccount();
            } else {
                // Máy trống (AVAILABLE): Lấy tài khoản khách hàng từ token SĐT
                if (currentUserPhone != null) {
                    customer = accountRepository.findByPhone(currentUserPhone).orElse(null);
                }
            }
        } else {
            throw new IllegalArgumentException("Vui lòng cung cấp mã phiên chơi (sessionId) hoặc mã máy trạm (computerCode)!");
        }

        if (currentUserPhone != null) {
            CustomerOwnership.requireOwner(accountRepository.findByPhone(currentUserPhone).orElse(null), customer);
        }

        // Khởi tạo Order cha
        Order order = new Order();
        order.setSession(session);
        order.setComputer(computer);
        order.setAccount(customer);
        order.setPaymentMethod(request.getPaymentMethod());
        order.setStatus(Status.PENDING_PAYMENT);

        populateOrderItems(order, request.getItems());

        // Do có cascade = ALL, hàm save dưới đây sẽ tự động INSERT cả bảng orders và order_items
        Order savedOrder = orderRepository.save(order);
        String pcCode = (computer != null) ? computer.getCode() : (session != null && session.getComputer() != null ? session.getComputer().getCode() : "N/A");
        realtimeNotificationService.broadcastOrderEvent(savedOrder, "CREATED", "Khách gọi món mới tại máy " + pcCode);
        log.info("Order: Tạo đơn hàng mới [ID={}] tại máy [{}], phiên [ID={}], tổng tiền: {} VND, phương thức: {}",
                savedOrder.getId(), pcCode, (session != null ? session.getId() : "NONE"), savedOrder.getTotalAmount(), savedOrder.getPaymentMethod());
        return OrderResponse.fromEntity(savedOrder);
    }

    /**
     * Trích xuất số phút chuẩn của món thuộc loại PLAYTIME (Gói giờ chơi)
     * Ưu tiên phân tích từ tên món (vd: "Gói nạp 2 giờ chơi" -> 120 phút, "Gói nạp 5 giờ" -> 300 phút)
     * Nếu không nhận diện được chữ số thì quy đổi theo giá chuẩn: 10.000 VNĐ = 60 phút
     */
    public static int extractPackageMinutes(Item item) {
        return item == null || item.getType() == null ? 0 : PlaytimeMinutes.minutes(item.getName(), item.getType().name(), item.getPrice());
    }

    private void populateOrderItems(Order order, List<CreateOrderItemRequest> requests) {
        List<Long> itemIds = requests.stream().map(CreateOrderItemRequest::getItemId).distinct().toList();
        Map<Long, Item> catalog = itemRepository.findAllById(itemIds).stream()
                .collect(Collectors.toMap(Item::getId, Function.identity()));

        BigDecimal totalAmount = BigDecimal.ZERO;
        List<OrderItem> lines = new ArrayList<>(requests.size());
        for (CreateOrderItemRequest request : requests) {
            if (request.getQuantity() <= 0) {
                throw new IllegalArgumentException("Số lượng món phải lớn hơn 0!");
            }
            Item item = catalog.get(request.getItemId());
            if (item == null) {
                throw new ResourceNotFoundException("Không tìm thấy món với ID = " + request.getItemId());
            }
            if (!item.isAvailable()) {
                throw new IllegalStateException("Món [" + item.getName() + "] hiện đã hết hàng!");
            }

            BigDecimal unitPrice = item.getPrice();
            BigDecimal subtotal = unitPrice.multiply(BigDecimal.valueOf(request.getQuantity()));

            OrderItem line = new OrderItem();
            line.setOrder(order);
            line.setItem(item);
            line.setItemNameSnapshot(item.getName());
            line.setItemTypeSnapshot(item.getType());
            line.setPackageMinutesSnapshot(extractPackageMinutes(item));
            line.setQuantity(request.getQuantity());
            line.setUnitPrice(unitPrice);
            line.setSubtotal(subtotal);
            lines.add(line);
            totalAmount = totalAmount.add(subtotal);
        }
        order.setOrderItems(lines);
        order.setTotalAmount(totalAmount);
    }

    /**
     * 2. NHÂN VIÊN DUYỆT ĐƠN HÀNG (confirmOrder)
     * Sau khi nhận đủ tiền (mặt hoặc chuyển khoản), nhân viên bấm xác nhận.
     * Nếu trong đơn có món thuộc loại PLAYTIME (thêm giờ), hệ thống tự cộng giờ vào Session.
     */
    @Transactional
    public OrderResponse confirmOrder(Long orderId, Long staffId) {
        Order order = orderRepository.findByIdWithLock(orderId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy đơn hàng với ID = " + orderId));

        if (order.getStatus() != Status.PENDING_PAYMENT && order.getStatus() != Status.WAITING_CONFIRMATION) {
            throw new IllegalStateException("Đơn hàng không ở trạng thái chờ duyệt! Trạng thái hiện tại: " + order.getStatus());
        }

        // RÀO CHẮN AN TOÀN TÀI CHÍNH: Nếu đơn thanh toán QR mà khách CHƯA xác nhận chuyển khoản thì CẤM duyệt
        if (order.getPaymentMethod() == PaymentMethod.QR && order.getStatus() == Status.PENDING_PAYMENT) {
            throw new IllegalStateException("Đơn hàng chuyển khoản QR chưa được khách hàng xác nhận đã chuyển tiền! Không được phép duyệt.");
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

        int totalStandardMinutes = purchasedStandardMinutes(order);
        long extraMachineMinutes = 0;
        if (totalStandardMinutes > 0) {
            Long customerId = order.getAccount() == null ? null : order.getAccount().getId();
            if (customerId == null && order.getSession() != null) {
                // Resolve legacy ownership without loading a session before its locking read.
                customerId = sessionRepository.findAccountId(order.getSession().getId()).orElse(null);
            }
            if (customerId != null) {
                extraMachineMinutes = sessionService.creditPurchasedMinutes(customerId, totalStandardMinutes)
                        .machineMinutes();
            }
        }

        Order updatedOrder = orderRepository.save(order);
        realtimeNotificationService.broadcastOrderEvent(updatedOrder, "CONFIRMED", "Đã xác nhận thanh toán đơn #" + updatedOrder.getId());
        auditLogService.log("CONFIRM_ORDER", "Order", orderId,
                String.format("Xác nhận đơn #%d bởi staffId=%d (cộng giờ chuẩn: %d phút, gia hạn máy: %d phút)",
                        orderId, staffId, totalStandardMinutes, extraMachineMinutes));
        log.info("Order Confirm: Nhân viên [ID={}] xác nhận đơn hàng [ID={}]. Cộng chuẩn: {}p, Gia hạn máy: {}p",
                staffId, orderId, totalStandardMinutes, extraMachineMinutes);
        return OrderResponse.fromEntity(updatedOrder);
    }

    /**
     * 2b. KHÁCH HÀNG XÁC NHẬN ĐÃ CHUYỂN KHOẢN (notifyTransferred)
     * Chuyển trạng thái đơn từ PENDING_PAYMENT sang WAITING_CONFIRMATION.
     * Bắn thông báo realtime tới quầy thu ngân để nhân viên đối soát số dư ngân hàng và mở nút duyệt.
     */
    @Transactional
    public OrderResponse notifyTransferred(Long orderId, String currentUserPhone) {
        Order order = orderRepository.findByIdWithLock(orderId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy đơn hàng với ID = " + orderId));

        if (order.getStatus() != Status.PENDING_PAYMENT) {
            throw new IllegalStateException("Đơn hàng hiện không ở trạng thái chờ chuyển khoản! Trạng thái hiện tại: " + order.getStatus());
        }

        if (order.getPaymentMethod() != PaymentMethod.QR) {
            throw new IllegalArgumentException("Chỉ đơn hàng thanh toán qua chuyển khoản QR mới cần thao tác này!");
        }

        if (currentUserPhone != null) {
            CustomerOwnership.requireOwner(accountRepository.findByPhone(currentUserPhone).orElse(null),
                    order.getAccount() != null ? order.getAccount() : order.getSession() == null ? null : order.getSession().getAccount());
        }

        order.setStatus(Status.WAITING_CONFIRMATION);
        order.setTransferredAt(LocalDateTime.now());
        Order savedOrder = orderRepository.save(order);

        String pcCode = (order.getComputer() != null)
                ? order.getComputer().getCode()
                : (order.getSession() != null && order.getSession().getComputer() != null ? order.getSession().getComputer().getCode() : "N/A");
        realtimeNotificationService.broadcastOrderEvent(savedOrder, "WAITING_CONFIRMATION",
                "Khách tại máy " + pcCode + " đã chuyển khoản cho đơn #" + orderId + " (" + savedOrder.getTotalAmount() + " VNĐ)");
        auditLogService.log("ORDER_TRANSFERRED", "Order", orderId,
                "Khách xác nhận đã chuyển khoản cho đơn #" + orderId + " (Máy " + pcCode + ")");
        log.info("Order Transferred: Khách tại máy [{}] xác nhận đã chuyển khoản cho đơn [ID={}]", pcCode, orderId);
        return OrderResponse.fromEntity(savedOrder);
    }

    /**
     * 3. HUỶ ĐƠN HÀNG (cancelOrder)
     * Chỉ huỷ được khi đơn đang ở trạng thái PENDING_PAYMENT hoặc WAITING_CONFIRMATION.
     */
    @Transactional
    public OrderResponse cancelOrder(Long orderId) {
        return cancelOrder(orderId, null);
    }

    @Transactional
    public OrderResponse cancelOrder(Long orderId, String currentUserPhone) {
        Order order = orderRepository.findByIdWithLock(orderId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy đơn hàng với ID = " + orderId));

        if (currentUserPhone != null) {
            CustomerOwnership.requireOwner(accountRepository.findByPhone(currentUserPhone).orElse(null),
                    order.getAccount() != null ? order.getAccount() : order.getSession() == null ? null : order.getSession().getAccount());
        }

        if (order.getStatus() != Status.PENDING_PAYMENT && order.getStatus() != Status.WAITING_CONFIRMATION) {
            throw new IllegalStateException("Chỉ có thể huỷ đơn hàng chưa hoàn tất thanh toán! Trạng thái: " + order.getStatus());
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
                ? (status == Status.PENDING_PAYMENT
                        ? orderRepository.findByStatusInOrderByCreatedAtDesc(List.of(Status.PENDING_PAYMENT, Status.WAITING_CONFIRMATION))
                        : orderRepository.findByStatusOrderByCreatedAtDesc(status))
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
        Page<Order> orderPage;
        if (status != null) {
            if (status == Status.PENDING_PAYMENT) {
                // Hàng đợi đơn chờ xử lý bao gồm cả đơn Chờ chuyển khoản và đơn Khách đã CK chờ quầy duyệt
                orderPage = orderRepository.findByStatusIn(List.of(Status.PENDING_PAYMENT, Status.WAITING_CONFIRMATION), pageable);
            } else {
                orderPage = orderRepository.findByStatus(status, pageable);
            }
        } else {
            orderPage = orderRepository.findAll(pageable);
        }

        return toDetailedPage(orderPage);
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
            String keyword,
            Pageable pageable) {

        Specification<Order> spec = OrderSpecification.filter(
                status, paymentMethod, fromDate, toDate, minAmount, maxAmount, computerCode, customerPhone, keyword);

        Sort sort = pageable.getSort().isSorted() ? pageable.getSort() : Sort.by(Sort.Direction.DESC, "createdAt");
        if (sort.getOrderFor("id") == null) {
            Sort.Order created = sort.getOrderFor("createdAt");
            sort = sort.and(Sort.by(created != null ? created.getDirection() : Sort.Direction.DESC, "id"));
        }
        Page<Order> page = orderRepository.findAll(spec, PageRequest.of(pageable.getPageNumber(), pageable.getPageSize(), sort));
        return toDetailedPage(page);
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

        if (currentUserPhone != null) {
            CustomerOwnership.requireOwner(accountRepository.findByPhone(currentUserPhone).orElse(null), session.getAccount());
        }

        Page<Order> orderPage = orderRepository.findBySessionId(sessionId, pageable);
        return toDetailedPage(orderPage);
    }

    /**
     * 6c. LẤY TẤT CẢ ĐƠN HÀNG CỦA KHÁCH HÀNG ĐANG ĐĂNG NHẬP (Hỗ trợ cả đơn có phiên và đơn máy trống)
     */
    @Transactional(readOnly = true)
    public PageResponse<OrderResponse> getMyOrders(String currentUserPhone, Pageable pageable) {
        if (currentUserPhone == null || currentUserPhone.isBlank()) {
            throw new IllegalArgumentException("Không xác định được số điện thoại khách hàng!");
        }
        Page<Order> orderPage = orderRepository.findByAccountPhone(currentUserPhone, pageable);
        return toDetailedPage(orderPage);
    }

    private PageResponse<OrderResponse> toDetailedPage(Page<Order> page) {
        if (page.hasContent()) {
            // Initialize the managed page rows in one query and keep the original page order.
            orderRepository.fetchDetailsByIds(page.getContent().stream().map(Order::getId).toList());
        }
        return PageResponse.fromPage(page, OrderResponse::fromEntity);
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
        Long balanceAccountId = sessionRepository.findAccountId(request.getSessionId())
                .orElseThrow(() -> new ResourceNotFoundException("Session not found: " + request.getSessionId()));
        Account customer = accountRepository.findByIdWithLock(balanceAccountId).orElseThrow();
        Session session = sessionRepository.findByIdWithLock(request.getSessionId())
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy phiên chơi với ID = " + request.getSessionId()));

        if (session.getStatus() != Session.Status.ACTIVE) {
            throw new IllegalStateException("Phiên chơi này đã kết thúc, không thể tạo đơn hàng!");
        }

        // 3. Khởi tạo Order với trạng thái CONFIRMED
        LocalDateTime now = LocalDateTime.now();
        Order order = new Order();
        order.setSession(session);
        order.setComputer(session.getComputer());
        order.setAccount(customer);
        order.setPaymentMethod(request.getPaymentMethod() != null ? request.getPaymentMethod() : PaymentMethod.CASH);
        order.setStatus(Status.CONFIRMED);
        order.setConfirmedByStaff(staff);
        order.setConfirmedAt(now);

        populateOrderItems(order, request.getItems());
        int totalStandardMinutes = purchasedStandardMinutes(order);
        long extraMachineMinutes = totalStandardMinutes > 0
                ? sessionService.applyPurchasedMinutes(customer, session, totalStandardMinutes) : 0;

        Order savedOrder = orderRepository.save(order);
        realtimeNotificationService.broadcastOrderEvent(savedOrder, "CREATED_DIRECT", "Tạo và thanh toán đơn trực tiếp tại quầy #" + savedOrder.getId());
        auditLogService.log("CREATE_DIRECT_ORDER", "Order", savedOrder.getId(),
                "Tạo và thu tiền trực tiếp đơn #" + savedOrder.getId() + " cho phiên #" + session.getId() + ", tổng: " + savedOrder.getTotalAmount() + " VND");
        log.info("UC-7 Direct Order: Nhân viên [ID={}] tạo đơn trực tiếp [ID={}] cho phiên [ID={}], tổng: {} VND, cộng phút chuẩn: {}, phút máy: {}",
                staff.getId(), savedOrder.getId(), session.getId(), savedOrder.getTotalAmount(), totalStandardMinutes, extraMachineMinutes);
        return OrderResponse.fromEntity(savedOrder);
    }

    private static int purchasedStandardMinutes(Order order) {
        return order.getOrderItems().stream()
                .filter(line -> line.getItemTypeSnapshot() == Item.Type.PLAYTIME)
                .filter(line -> line.getPackageMinutesSnapshot() != null)
                .mapToInt(line -> line.getPackageMinutesSnapshot() * line.getQuantity())
                .sum();
    }
}
