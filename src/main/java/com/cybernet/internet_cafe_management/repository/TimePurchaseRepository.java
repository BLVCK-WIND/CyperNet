package com.cybernet.internet_cafe_management.repository;

import com.cybernet.internet_cafe_management.entity.TimePurchase;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface TimePurchaseRepository extends JpaRepository<TimePurchase, Long> {

    // Phân trang danh sách giao dịch nạp giờ theo trạng thái
    Page<TimePurchase> findByStatus(TimePurchase.Status status, Pageable pageable);

    // Phân trang lịch sử nạp giờ của 1 tài khoản
    Page<TimePurchase> findByAccountId(Long accountId, Pageable pageable);

    // Lấy danh sách giao dịch mua giờ của 1 tài khoản khách hàng cụ thể
    // Sắp xếp theo ngày tạo giảm dần (mới nhất lên đầu)
    List<TimePurchase> findByAccountIdOrderByCreatedAtDesc(Long accountId);

    // Lấy danh sách giao dịch theo trạng thái (ví dụ: lấy tất cả đơn PENDING_PAYMENT cho nhân viên quầy duyệt)
    List<TimePurchase> findByStatusOrderByCreatedAtDesc(TimePurchase.Status status);

    // === PHASE 4: AGGREGATION QUERIES FOR REVENUE REPORTING ===

    // 1. Tính tổng tiền nạp giờ chơi trong khoảng thời gian
    @Query("SELECT COALESCE(SUM(tp.amount), 0) FROM TimePurchase tp " +
           "WHERE tp.status = :status AND tp.confirmedAt BETWEEN :from AND :to")
    BigDecimal sumRevenueByStatusAndDateRange(
            @Param("status") TimePurchase.Status status,
            @Param("from") LocalDateTime from,
            @Param("to") LocalDateTime to);

    // 2. Đếm số lượt nạp giờ hoàn tất trong khoảng thời gian
    @Query("SELECT COUNT(tp) FROM TimePurchase tp " +
           "WHERE tp.status = :status AND tp.confirmedAt BETWEEN :from AND :to")
    long countByStatusAndDateRange(
            @Param("status") TimePurchase.Status status,
            @Param("from") LocalDateTime from,
            @Param("to") LocalDateTime to);

    // 3. Gom nhóm tiền nạp giờ theo phương thức thanh toán (CASH vs QR)
    @Query("SELECT tp.paymentMethod, COALESCE(SUM(tp.amount), 0) FROM TimePurchase tp " +
           "WHERE tp.status = :status AND tp.confirmedAt BETWEEN :from AND :to " +
           "GROUP BY tp.paymentMethod")
    List<Object[]> sumRevenueByPaymentMethod(
            @Param("status") TimePurchase.Status status,
            @Param("from") LocalDateTime from,
            @Param("to") LocalDateTime to);

    // 4. Doanh thu nạp giờ theo từng ngày
    @Query("SELECT FUNCTION('DATE', tp.confirmedAt), COALESCE(SUM(tp.amount), 0), COUNT(tp) " +
           "FROM TimePurchase tp " +
           "WHERE tp.status = :status AND tp.confirmedAt BETWEEN :from AND :to " +
           "GROUP BY FUNCTION('DATE', tp.confirmedAt) " +
           "ORDER BY FUNCTION('DATE', tp.confirmedAt) ASC")
    List<Object[]> findDailyTimePurchaseRevenue(
            @Param("status") TimePurchase.Status status,
            @Param("from") LocalDateTime from,
            @Param("to") LocalDateTime to);

    // 5. Thống kê số tiền nạp giờ của từng khách hàng
    @Query("SELECT tp.account.id, tp.account.name, tp.account.phone, " +
           "COALESCE(SUM(tp.amount), 0) " +
           "FROM TimePurchase tp " +
           "WHERE tp.status = :status AND tp.confirmedAt BETWEEN :from AND :to " +
           "GROUP BY tp.account.id, tp.account.name, tp.account.phone")
    List<Object[]> findSpendingByAccount(
            @Param("status") TimePurchase.Status status,
            @Param("from") LocalDateTime from,
            @Param("to") LocalDateTime to);
}
