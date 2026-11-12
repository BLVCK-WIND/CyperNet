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

    @org.springframework.data.jpa.repository.Query(value = "SELECT * FROM sessions WHERE id = :id FOR UPDATE", nativeQuery = true)
    java.util.Optional<Session> findByIdWithLock(@org.springframework.data.repository.query.Param("id") Long id);

    @org.springframework.data.jpa.repository.Query("select s.account.id from Session s where s.id = :id")
    java.util.Optional<Long> findAccountId(@org.springframework.data.repository.query.Param("id") Long id);

    @org.springframework.data.jpa.repository.Query(value = "SELECT * FROM sessions WHERE account_id = :id AND status = 'ACTIVE' FOR UPDATE", nativeQuery = true)
    java.util.Optional<Session> findActiveByAccountIdWithLock(@org.springframework.data.repository.query.Param("id") Long id);

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

    interface ComputerUsageRow {
        Long getComputerId();
        String getComputerCode();
        String getZone();
        long getTotalSessions();
        long getTotalMinutesUsed();
    }

    interface CustomerUsageRow {
        Long getAccountId();
        long getTotalMinutesPlayed();
    }

    // Elapsed play is the intersection of a session with the requested date window.
    String OVERLAP_SECONDS = """
            GREATEST(0, TIMESTAMPDIFF(SECOND, GREATEST(s.started_at, :fromTime),
                LEAST(COALESCE(s.ended_at, s.expires_at), :usageEnd)))
            """;

    @Query(value = """
            SELECT c.id AS computerId, c.code AS computerCode, c.zone AS zone,
                   COUNT(CASE WHEN s.started_at >= :fromTime THEN 1 END) AS totalSessions,
                   COALESCE(SUM(
            """ + OVERLAP_SECONDS + """
                   ), 0) DIV 60 AS totalMinutesUsed
            FROM computers c LEFT JOIN sessions s ON s.computer_id = c.id
                AND s.started_at < :toTime
                AND (s.started_at >= :fromTime OR COALESCE(s.ended_at, s.expires_at) > :fromTime)
            GROUP BY c.id, c.code, c.zone
            ORDER BY totalSessions DESC, totalMinutesUsed DESC, c.id
            """, nativeQuery = true)
    List<ComputerUsageRow> findComputerUsage(
            @Param("fromTime") LocalDateTime fromTime,
            @Param("toTime") LocalDateTime toTime,
            @Param("usageEnd") LocalDateTime usageEnd);

    @Query(value = """
            SELECT s.account_id AS accountId, SUM(
            """ + OVERLAP_SECONDS + """
                   ) DIV 60 AS totalMinutesPlayed
            FROM sessions s
            WHERE s.started_at < :usageEnd AND COALESCE(s.ended_at, s.expires_at) > :fromTime
            GROUP BY s.account_id
            """, nativeQuery = true)
    List<CustomerUsageRow> findCustomerUsage(
            @Param("fromTime") LocalDateTime fromTime,
            @Param("usageEnd") LocalDateTime usageEnd);
}
