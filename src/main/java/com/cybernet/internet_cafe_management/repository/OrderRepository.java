package com.cybernet.internet_cafe_management.repository;

import com.cybernet.internet_cafe_management.entity.Order;
import com.cybernet.internet_cafe_management.entity.Order.Status;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface OrderRepository extends JpaRepository<Order, Long> {

    // Lấy danh sách các đơn hàng theo phiên chơi (sắp xếp mới nhất lên đầu)
    List<Order> findBySessionIdOrderByCreatedAtDesc(Long sessionId);

    // Lấy danh sách đơn hàng theo trạng thái (VD: lấy tất cả đơn PENDING_PAYMENT cho nhân viên quầy bar/bếp duyệt)
    List<Order> findByStatusOrderByCreatedAtDesc(Status status);

    // Lấy danh sách đơn hàng của 1 phiên chơi theo trạng thái
    List<Order> findBySessionIdAndStatus(Long sessionId, Status status);
}
