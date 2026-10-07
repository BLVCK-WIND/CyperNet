package com.cybernet.internet_cafe_management.repository;

import com.cybernet.internet_cafe_management.entity.OrderItem;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface OrderItemRepository extends JpaRepository<OrderItem, Long> {

    // Lấy các món chi tiết của 1 đơn hàng cụ thể
    List<OrderItem> findByOrderId(Long orderId);
}
