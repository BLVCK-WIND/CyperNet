package com.cybernet.internet_cafe_management.repository;

import com.cybernet.internet_cafe_management.entity.Session;
import com.cybernet.internet_cafe_management.entity.Session.Status;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface SessionRepository extends JpaRepository<Session, Long> {

    // Phân trang danh sách phiên theo trạng thái
    Page<Session> findByStatus(Status status, Pageable pageable);

    // Phân trang lịch sử phiên chơi của 1 khách hàng
    Page<Session> findByAccountId(Long accountId, Pageable pageable);

    // Phân trang lịch sử phiên chơi của 1 máy tính cụ thể
    Page<Session> findByComputerId(Long computerId, Pageable pageable);

    // Tìm phiên chơi đang ACTIVE của 1 máy tính cụ thể (1 máy chỉ có tối đa 1 phiên ACTIVE)
    Optional<Session> findByComputerIdAndStatus(Long computerId, Status status);

    // Tìm phiên chơi đang ACTIVE dựa vào mã máy (VD: "PC-01") — Phục vụ tính năng quét mã QR tại bàn
    Optional<Session> findByComputerCodeAndStatus(String computerCode, Status status);

    // Tìm phiên chơi đang ACTIVE của 1 tài khoản khách hàng (1 khách chỉ có tối đa 1 phiên ACTIVE)
    Optional<Session> findByAccountIdAndStatus(Long accountId, Status status);

    // Kiểm tra nhanh xem máy tính có đang có phiên ACTIVE nào không
    boolean existsByComputerIdAndStatus(Long computerId, Status status);

    // Kiểm tra xem máy tính đã từng có phiên chơi nào trong lịch sử chưa
    boolean existsByComputerId(Long computerId);

    // Kiểm tra nhanh xem khách hàng có đang chơi tại máy nào khác không
    boolean existsByAccountIdAndStatus(Long accountId, Status status);

    // Kiểm tra xem tài khoản đã từng có phiên chơi nào trong lịch sử chưa
    boolean existsByAccountId(Long accountId);

    // Lấy toàn bộ danh sách phiên theo trạng thái (VD: lấy tất cả phiên ACTIVE để hiển thị màn hình giám sát máy)
    List<Session> findByStatusOrderByStartedAtDesc(Status status);

    // Lấy lịch sử tất cả phiên chơi của 1 khách hàng (mới nhất lên đầu)
    List<Session> findByAccountIdOrderByStartedAtDesc(Long accountId);

    // Tìm các phiên chơi có trạng thái chỉ định và thời điểm hết hạn nhỏ hơn hoặc bằng mốc thời gian (phục vụ Scheduler tự động đóng phiên hết giờ)
    @Query("SELECT s FROM Session s LEFT JOIN FETCH s.computer LEFT JOIN FETCH s.account WHERE s.status = :status AND s.expiresAt <= :dateTime")
    List<Session> findByStatusAndExpiresAtLessThanEqual(@Param("status") Status status, @Param("dateTime") LocalDateTime dateTime);

    // === PHASE 4: AGGREGATION QUERIES FOR UTILIZATION & GAMER STATS ===

    // 1. Thống kê số lượt sử dụng máy trạm trong khoảng thời gian
    @Query("SELECT s.computer.id, s.computer.code, s.computer.zone, COUNT(s) " +
           "FROM Session s " +
           "WHERE s.startedAt BETWEEN :from AND :to " +
           "GROUP BY s.computer.id, s.computer.code, s.computer.zone " +
           "ORDER BY COUNT(s) DESC")
    List<Object[]> findComputerUsageCount(
            @Param("from") LocalDateTime from,
            @Param("to") LocalDateTime to);

    // 2. Lấy dữ liệu mốc thời gian phiên chơi để tính tổng thời lượng sử dụng máy
    @Query("SELECT s.computer.id, s.startedAt, s.endedAt " +
           "FROM Session s " +
           "WHERE s.startedAt BETWEEN :from AND :to")
    List<Object[]> findComputerSessionDurations(
            @Param("from") LocalDateTime from,
            @Param("to") LocalDateTime to);

    // 3. Lấy dữ liệu mốc thời gian phiên chơi theo tài khoản khách hàng để tính tổng thời gian chơi
    @Query("SELECT s.account.id, s.account.name, s.account.phone, s.startedAt, s.endedAt " +
           "FROM Session s " +
           "WHERE s.startedAt BETWEEN :from AND :to")
    List<Object[]> findCustomerSessionDurations(
            @Param("from") LocalDateTime from,
            @Param("to") LocalDateTime to);
}
