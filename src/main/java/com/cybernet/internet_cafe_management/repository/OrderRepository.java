package com.cybernet.internet_cafe_management.repository;

import com.cybernet.internet_cafe_management.entity.Order;
import com.cybernet.internet_cafe_management.entity.Order.Status;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface OrderRepository extends JpaRepository<Order, Long>, JpaSpecificationExecutor<Order> {

    interface QueueTotals {
        Status getStatus();
        long getOrderCount();
        BigDecimal getTotalAmount();
        long getCreatedToday();
        long getConfirmedToday();
        long getBacklogCount();
        BigDecimal getBacklogAmount();
    }

    @Query("SELECT o.status AS status, COUNT(o) AS orderCount, COALESCE(SUM(o.totalAmount), 0) AS totalAmount, " +
           "COALESCE(SUM(CASE WHEN o.createdAt >= :from AND o.createdAt < :to THEN 1 ELSE 0 END), 0) AS createdToday, " +
           "COALESCE(SUM(CASE WHEN o.confirmedAt >= :from AND o.confirmedAt < :to THEN 1 ELSE 0 END), 0) AS confirmedToday, " +
           "COALESCE(SUM(CASE WHEN o.createdAt < :from THEN 1 ELSE 0 END), 0) AS backlogCount, " +
           "COALESCE(SUM(CASE WHEN o.createdAt < :from THEN o.totalAmount ELSE 0 END), 0) AS backlogAmount " +
           "FROM Order o GROUP BY o.status")
    List<QueueTotals> summarizeQueue(@Param("from") LocalDateTime from, @Param("to") LocalDateTime to);

    @Query("""
            SELECT o FROM Order o
            LEFT JOIN FETCH o.orderItems line
            LEFT JOIN FETCH line.item
            LEFT JOIN FETCH o.account
            LEFT JOIN FETCH o.computer
            LEFT JOIN FETCH o.session playSession
            LEFT JOIN FETCH playSession.account
            LEFT JOIN FETCH playSession.computer
            LEFT JOIN FETCH o.confirmedByStaff
            WHERE o.id IN :ids
            ORDER BY line.id
            """)
    List<Order> fetchDetailsByIds(@Param("ids") List<Long> ids);

    @org.springframework.data.jpa.repository.Query(value = "SELECT * FROM orders WHERE id = :id FOR UPDATE", nativeQuery = true)
    java.util.Optional<Order> findByIdWithLock(@org.springframework.data.repository.query.Param("id") Long id);

    // Phân trang danh sách đơn hàng theo trạng thái
    Page<Order> findByStatus(Status status, Pageable pageable);

    // Kiểm tra máy tính đã từng có đơn hàng nào chưa
    boolean existsByComputerId(Long computerId);

    // Kiểm tra tài khoản khách hàng đã từng có đơn hàng nào chưa
    boolean existsByAccountId(Long accountId);

    // Kiểm tra nhân viên đã từng xác nhận đơn hàng nào chưa
    boolean existsByConfirmedByStaffId(Long staffId);

    // Phân trang danh sách đơn hàng theo tập hợp trạng thái (ví dụ đơn chờ xử lý gồm PENDING_PAYMENT và WAITING_CONFIRMATION)
    Page<Order> findByStatusIn(List<Status> statuses, Pageable pageable);

    // Phân trang danh sách đơn hàng theo phiên chơi
    Page<Order> findBySessionId(Long sessionId, Pageable pageable);

    // Lấy danh sách các đơn hàng theo phiên chơi (sắp xếp mới nhất lên đầu)
    List<Order> findBySessionIdOrderByCreatedAtDesc(Long sessionId);

    // Lấy danh sách đơn hàng theo trạng thái (VD: lấy tất cả đơn PENDING_PAYMENT cho nhân viên quầy bar/bếp duyệt)
    List<Order> findByStatusOrderByCreatedAtDesc(Status status);

    // Lấy danh sách đơn hàng theo nhiều trạng thái (VD: lấy tất cả đơn chờ xử lý gồm PENDING_PAYMENT và WAITING_CONFIRMATION)
    List<Order> findByStatusInOrderByCreatedAtDesc(List<Status> statuses);

    // Lấy danh sách đơn hàng của 1 phiên chơi theo trạng thái
    List<Order> findBySessionIdAndStatus(Long sessionId, Status status);

    // Phân trang danh sách đơn hàng theo SĐT khách hàng (hỗ trợ cả đơn có phiên và đơn máy trống)
    @Query("SELECT o FROM Order o LEFT JOIN o.account a LEFT JOIN o.session s LEFT JOIN s.account sa " +
           "WHERE COALESCE(a.phone, sa.phone) = :phone ORDER BY o.createdAt DESC")
    Page<Order> findByAccountPhone(@Param("phone") String phone, Pageable pageable);

    // === PHASE 4: AGGREGATION QUERIES FOR REVENUE REPORTING ===

    @Query("SELECT o.paymentMethod, SUM(o.totalAmount), COUNT(o) FROM Order o " +
           "WHERE o.status = :status AND o.confirmedAt >= :from AND o.confirmedAt < :to " +
           "GROUP BY o.paymentMethod")
    List<Object[]> findRevenueByPaymentMethod(
            @Param("status") Status status,
            @Param("from") LocalDateTime from,
            @Param("to") LocalDateTime to);

    // 4. Doanh thu theo từng ngày
    @Query("SELECT FUNCTION('DATE', o.confirmedAt), COALESCE(SUM(o.totalAmount), 0), COUNT(o) " +
           "FROM Order o " +
           "WHERE o.status = :status AND o.confirmedAt >= :from AND o.confirmedAt < :to " +
           "GROUP BY FUNCTION('DATE', o.confirmedAt) " +
           "ORDER BY FUNCTION('DATE', o.confirmedAt) ASC")
    List<Object[]> findDailyOrderRevenue(
            @Param("status") Status status,
            @Param("from") LocalDateTime from,
            @Param("to") LocalDateTime to);

    // 5. Thống kê chi tiêu của từng khách hàng qua đơn hàng
    @Query("SELECT COALESCE(a.id, sa.id), COALESCE(a.name, sa.name), COALESCE(a.phone, sa.phone), " +
           "COALESCE(SUM(o.totalAmount), 0) FROM Order o LEFT JOIN o.account a " +
           "LEFT JOIN o.session s LEFT JOIN s.account sa " +
           "WHERE o.status = :status AND o.confirmedAt >= :from AND o.confirmedAt < :to " +
           "AND COALESCE(a.id, sa.id) IS NOT NULL " +
           "GROUP BY COALESCE(a.id, sa.id), COALESCE(a.name, sa.name), COALESCE(a.phone, sa.phone)")
    List<Object[]> findSpendingByAccount(
            @Param("status") Status status,
            @Param("from") LocalDateTime from,
            @Param("to") LocalDateTime to);
}
