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
    private final ComputerRepository computerRepository;
    private final RealtimeNotificationService realtimeNotificationService;
    private final AuditLogService auditLogService;

    // Dependency Injection qua Constructor
    public OrderService(OrderRepository orderRepository,
                        SessionRepository sessionRepository,
                        ItemRepository itemRepository,
                        AccountRepository accountRepository,
                        ComputerRepository computerRepository,
                        RealtimeNotificationService realtimeNotificationService,
                        AuditLogService auditLogService) {
        this.orderRepository = orderRepository;
        this.sessionRepository = sessionRepository;
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

            // Kiểm tra quyền sở hữu phiên: Nếu là khách hàng, chỉ được đặt món cho chính phiên của mình (B4)
            if (currentUserPhone != null && customer != null) {
                Account user = accountRepository.findByPhone(currentUserPhone).orElse(null);
                if (user != null && user.getRole() == Account.Role.CUSTOMER) {
                    if (!customer.getPhone().equals(currentUserPhone)) {
                        throw new org.springframework.security.access.AccessDeniedException("Bạn chỉ có thể đặt món cho chính phiên chơi của mình!");
                    }
                }
            }
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

        // Khởi tạo Order cha
        Order order = new Order();
        order.setSession(session);
        order.setComputer(computer);
        order.setAccount(customer);
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
        if (item == null || item.getType() != Item.Type.PLAYTIME) {
            return 0;
        }

        String name = item.getName().toLowerCase();
        // Regex tìm số giờ: "2 giờ", "2h", "2 hour", "2 tiếng"
        java.util.regex.Pattern hourPattern = java.util.regex.Pattern.compile("(\\d+)\\s*(giờ|giờ|tiếng|tiếng|h|hour)");
        java.util.regex.Matcher hourMatcher = hourPattern.matcher(name);
        if (hourMatcher.find()) {
            int hours = Integer.parseInt(hourMatcher.group(1));
            return hours * 60;
        }

        // Regex tìm số phút: "30 phút", "30p", "30 min"
        java.util.regex.Pattern minPattern = java.util.regex.Pattern.compile("(\\d+)\\s*(phút|phút|p|min)");
        java.util.regex.Matcher minMatcher = minPattern.matcher(name);
        if (minMatcher.find()) {
            return Integer.parseInt(minMatcher.group(1));
        }

        // Fallback: Quy đổi theo đơn giá chuẩn 10.000đ = 60 phút chuẩn
        if (item.getPrice() != null && item.getPrice().compareTo(BigDecimal.ZERO) > 0) {
            return (int) Math.round(item.getPrice().doubleValue() / 10000.0 * 60.0);
        }

        return 60; // Mặc định an toàn
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

        // KIỂM TRA TỰ ĐỘNG CỘNG GIỜ NẾU ĐƠN CÓ MÓN PLAYTIME (DYNAMIC TARIFF ARCHITECTURE)
        Session session = order.getSession();
        int totalStandardMinutes = 0;

        for (OrderItem orderItem : order.getOrderItems()) {
            if (orderItem.getItem().getType() == Item.Type.PLAYTIME) {
                int packageMinutes = extractPackageMinutes(orderItem.getItem());
                totalStandardMinutes += (packageMinutes * orderItem.getQuantity());
            }
        }

        long extraMachineMinutes = 0;
        if (totalStandardMinutes > 0) {
            // 1. Cộng thêm phút chuẩn vào tài khoản khách hàng
            Account customer = (order.getAccount() != null)
                    ? order.getAccount()
                    : (session != null ? session.getAccount() : null);

            if (customer != null) {
                customer.setRemainingMinutes(customer.getRemainingMinutes() + totalStandardMinutes);
                accountRepository.save(customer);
            }

            // 2. Nếu phiên chơi đang ACTIVE, gia hạn thời điểm hết hạn theo đơn giá máy đang ngồi
            if (session != null && session.getStatus() == Session.Status.ACTIVE && session.getComputer() != null) {
                extraMachineMinutes = SessionService.calculatePlayableMinutes(
                        totalStandardMinutes,
                        session.getComputer().getPricePerHour()
                );
                session.setExpiresAt(session.getExpiresAt().plusMinutes(extraMachineMinutes));
                sessionRepository.save(session);
                realtimeNotificationService.broadcastComputerStatus(session.getComputer());
            }
            // Nếu session == null (máy trống): Theo đúng quy tắc Cách B:
            // Giờ chơi được nạp vào tài khoản an toàn 100%, không tự mở máy và không trừ giờ của khách!
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
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy đơn hàng với ID = " + orderId));

        if (order.getStatus() != Status.PENDING_PAYMENT) {
            throw new IllegalStateException("Đơn hàng hiện không ở trạng thái chờ chuyển khoản! Trạng thái hiện tại: " + order.getStatus());
        }

        if (order.getPaymentMethod() != PaymentMethod.QR) {
            throw new IllegalArgumentException("Chỉ đơn hàng thanh toán qua chuyển khoản QR mới cần thao tác này!");
        }

        // Bảo vệ B4: Nếu là khách hàng, chỉ được thao tác với chính đơn hàng của mình
        if (currentUserPhone != null) {
            Account user = accountRepository.findByPhone(currentUserPhone).orElse(null);
            if (user != null && user.getRole() == Account.Role.CUSTOMER) {
                String orderPhone = (order.getAccount() != null)
                        ? order.getAccount().getPhone()
                        : (order.getSession() != null && order.getSession().getAccount() != null ? order.getSession().getAccount().getPhone() : null);
                if (orderPhone != null && !orderPhone.equals(currentUserPhone)) {
                    throw new org.springframework.security.access.AccessDeniedException("Bạn chỉ có thể thao tác với đơn hàng của chính mình!");
                }
            }
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
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy đơn hàng với ID = " + orderId));

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
     * 6c. LẤY TẤT CẢ ĐƠN HÀNG CỦA KHÁCH HÀNG ĐANG ĐĂNG NHẬP (Hỗ trợ cả đơn có phiên và đơn máy trống)
     */
    @Transactional(readOnly = true)
    public PageResponse<OrderResponse> getMyOrders(String currentUserPhone, Pageable pageable) {
        if (currentUserPhone == null || currentUserPhone.isBlank()) {
            throw new IllegalArgumentException("Không xác định được số điện thoại khách hàng!");
        }
        Page<Order> orderPage = orderRepository.findByAccountPhone(currentUserPhone, pageable);
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
        order.setComputer(session.getComputer());
        order.setAccount(session.getAccount());
        order.setPaymentMethod(request.getPaymentMethod() != null ? request.getPaymentMethod() : PaymentMethod.CASH);
        order.setStatus(Status.CONFIRMED);
        order.setConfirmedByStaff(staff);
        order.setConfirmedAt(now);

        BigDecimal totalAmount = BigDecimal.ZERO;
        List<OrderItem> orderItemList = new ArrayList<>();
        int totalStandardMinutes = 0;

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

            // Kiểm tra món loại PLAYTIME: Trích xuất số phút chuẩn của gói (Standard Minutes)
            if (item.getType() == Item.Type.PLAYTIME) {
                int packageMinutes = extractPackageMinutes(item);
                totalStandardMinutes += (packageMinutes * itemReq.getQuantity());
            }
        }

        order.setTotalAmount(totalAmount);
        order.setOrderItems(orderItemList);

        // 5. Nếu có món loại PLAYTIME: Áp dụng kiến trúc Dynamic Tariff chuẩn theo Zone của máy
        long extraMachineMinutes = 0;
        if (totalStandardMinutes > 0) {
            // a. Cộng phút chuẩn vào tài khoản khách hàng
            Account customer = session.getAccount();
            if (customer != null) {
                customer.setRemainingMinutes(customer.getRemainingMinutes() + totalStandardMinutes);
                accountRepository.save(customer);
            }

            // b. Nếu phiên chơi đang ACTIVE, quy đổi phút máy thực tế theo đơn giá Zone máy đang ngồi
            if (session.getStatus() == Session.Status.ACTIVE && session.getComputer() != null) {
                extraMachineMinutes = SessionService.calculatePlayableMinutes(
                        totalStandardMinutes,
                        session.getComputer().getPricePerHour()
                );
                session.setExpiresAt(session.getExpiresAt().plusMinutes(extraMachineMinutes));
                sessionRepository.save(session);
                realtimeNotificationService.broadcastComputerStatus(session.getComputer());
            }
        }

        Order savedOrder = orderRepository.save(order);
        realtimeNotificationService.broadcastOrderEvent(savedOrder, "CREATED_DIRECT", "Tạo và thanh toán đơn trực tiếp tại quầy #" + savedOrder.getId());
        auditLogService.log("CREATE_DIRECT_ORDER", "Order", savedOrder.getId(),
                "Tạo và thu tiền trực tiếp đơn #" + savedOrder.getId() + " cho phiên #" + session.getId() + ", tổng: " + savedOrder.getTotalAmount() + " VND");
        log.info("UC-7 Direct Order: Nhân viên [ID={}] tạo đơn trực tiếp [ID={}] cho phiên [ID={}], tổng: {} VND, cộng phút chuẩn: {}, phút máy: {}",
                staff.getId(), savedOrder.getId(), session.getId(), savedOrder.getTotalAmount(), totalStandardMinutes, extraMachineMinutes);
        return OrderResponse.fromEntity(savedOrder);
    }
}
