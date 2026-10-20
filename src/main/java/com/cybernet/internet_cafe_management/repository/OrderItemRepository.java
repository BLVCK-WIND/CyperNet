package com.cybernet.internet_cafe_management.repository;

import com.cybernet.internet_cafe_management.entity.Order;
import com.cybernet.internet_cafe_management.entity.OrderItem;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface OrderItemRepository extends JpaRepository<OrderItem, Long> {

    // Lấy các món chi tiết của 1 đơn hàng cụ thể
    List<OrderItem> findByOrderId(Long orderId);

    // === PHASE 4: AGGREGATION QUERIES FOR ITEM SALES & BREAKDOWN ===

    // 1. Thống kê món bán chạy nhất (Top-selling items)
    @Query("SELECT oi.item.id, oi.item.name, oi.item.type, " +
           "SUM(oi.quantity), SUM(oi.subtotal) " +
           "FROM OrderItem oi " +
           "WHERE oi.order.status = :status AND oi.order.confirmedAt BETWEEN :from AND :to " +
           "GROUP BY oi.item.id, oi.item.name, oi.item.type " +
           "ORDER BY SUM(oi.quantity) DESC")
    List<Object[]> findTopSellingItems(
            @Param("status") Order.Status status,
            @Param("from") LocalDateTime from,
            @Param("to") LocalDateTime to,
            Pageable pageable);

    // 2. Thống kê cơ cấu doanh thu theo loại mặt hàng (DRINK, FOOD, SERVICE, PLAYTIME)
    @Query("SELECT oi.item.type, COALESCE(SUM(oi.subtotal), 0) " +
           "FROM OrderItem oi " +
           "WHERE oi.order.status = :status AND oi.order.confirmedAt BETWEEN :from AND :to " +
           "GROUP BY oi.item.type")
    List<Object[]> sumRevenueByItemType(
            @Param("status") Order.Status status,
            @Param("from") LocalDateTime from,
            @Param("to") LocalDateTime to);
}
