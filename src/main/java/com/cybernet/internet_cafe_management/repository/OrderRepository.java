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
           "WHERE a.phone = :phone OR sa.phone = :phone ORDER BY o.createdAt DESC")
    Page<Order> findByAccountPhone(@Param("phone") String phone, Pageable pageable);

    // === PHASE 4: AGGREGATION QUERIES FOR REVENUE REPORTING ===

    // 1. Tính tổng doanh thu đơn hàng trong khoảng thời gian
    @Query("SELECT COALESCE(SUM(o.totalAmount), 0) FROM Order o " +
           "WHERE o.status = :status AND o.confirmedAt BETWEEN :from AND :to")
    BigDecimal sumRevenueByStatusAndDateRange(
            @Param("status") Status status,
            @Param("from") LocalDateTime from,
            @Param("to") LocalDateTime to);

    // 2. Đếm số lượng đơn hàng hoàn tất trong khoảng thời gian
    @Query("SELECT COUNT(o) FROM Order o " +
           "WHERE o.status = :status AND o.confirmedAt BETWEEN :from AND :to")
    long countByStatusAndDateRange(
            @Param("status") Status status,
            @Param("from") LocalDateTime from,
            @Param("to") LocalDateTime to);

    // 3. Gom nhóm doanh thu đơn hàng theo phương thức thanh toán (CASH vs QR)
    @Query("SELECT o.paymentMethod, COALESCE(SUM(o.totalAmount), 0) FROM Order o " +
           "WHERE o.status = :status AND o.confirmedAt BETWEEN :from AND :to " +
           "GROUP BY o.paymentMethod")
    List<Object[]> sumRevenueByPaymentMethod(
            @Param("status") Status status,
            @Param("from") LocalDateTime from,
            @Param("to") LocalDateTime to);

    // 4. Doanh thu theo từng ngày
    @Query("SELECT FUNCTION('DATE', o.confirmedAt), COALESCE(SUM(o.totalAmount), 0), COUNT(o) " +
           "FROM Order o " +
           "WHERE o.status = :status AND o.confirmedAt BETWEEN :from AND :to " +
           "GROUP BY FUNCTION('DATE', o.confirmedAt) " +
           "ORDER BY FUNCTION('DATE', o.confirmedAt) ASC")
    List<Object[]> findDailyOrderRevenue(
            @Param("status") Status status,
            @Param("from") LocalDateTime from,
            @Param("to") LocalDateTime to);

    // 5. Thống kê chi tiêu của từng khách hàng qua đơn hàng
    @Query("SELECT o.session.account.id, o.session.account.name, o.session.account.phone, " +
           "COALESCE(SUM(o.totalAmount), 0) " +
           "FROM Order o " +
           "WHERE o.status = :status AND o.confirmedAt BETWEEN :from AND :to " +
           "GROUP BY o.session.account.id, o.session.account.name, o.session.account.phone")
    List<Object[]> findSpendingByAccount(
            @Param("status") Status status,
            @Param("from") LocalDateTime from,
            @Param("to") LocalDateTime to);
}
