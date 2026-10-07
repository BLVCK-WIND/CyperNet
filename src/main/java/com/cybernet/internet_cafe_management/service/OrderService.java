package com.cybernet.internet_cafe_management.service;

import com.cybernet.internet_cafe_management.dto.request.CreateOrderItemRequest;
import com.cybernet.internet_cafe_management.dto.request.CreateOrderRequest;
import com.cybernet.internet_cafe_management.dto.response.OrderResponse;
import com.cybernet.internet_cafe_management.entity.*;
import com.cybernet.internet_cafe_management.entity.Order.Status;
import com.cybernet.internet_cafe_management.exception.ResourceNotFoundException;
import com.cybernet.internet_cafe_management.repository.AccountRepository;
import com.cybernet.internet_cafe_management.repository.ItemRepository;
import com.cybernet.internet_cafe_management.repository.OrderRepository;
import com.cybernet.internet_cafe_management.repository.SessionRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Service
public class OrderService {

    private final OrderRepository orderRepository;
    private final SessionRepository sessionRepository;
    private final ItemRepository itemRepository;
    private final AccountRepository accountRepository;

    // Dependency Injection qua Constructor
    public OrderService(OrderRepository orderRepository,
                        SessionRepository sessionRepository,
                        ItemRepository itemRepository,
                        AccountRepository accountRepository) {
        this.orderRepository = orderRepository;
        this.sessionRepository = sessionRepository;
        this.itemRepository = itemRepository;
        this.accountRepository = accountRepository;
    }

    /**
     * 1. TẠO ĐƠN ĐẶT MÓN (createOrder)
     * Khách hàng quét mã QR tại máy tính để gọi món ăn/uống hoặc nạp thêm giờ chơi.
     * Áp dụng CascadeType.ALL: Lưu Order sẽ tự động lưu danh sách OrderItem con.
     */
    @Transactional
    public OrderResponse createOrder(CreateOrderRequest request) {
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
}
