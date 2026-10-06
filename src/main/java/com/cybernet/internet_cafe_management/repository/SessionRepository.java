package com.cybernet.internet_cafe_management.repository;

import com.cybernet.internet_cafe_management.entity.Session;
import com.cybernet.internet_cafe_management.entity.Session.Status;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface SessionRepository extends JpaRepository<Session, Long> {

    // Tìm phiên chơi đang ACTIVE của 1 máy tính cụ thể (1 máy chỉ có tối đa 1 phiên ACTIVE)
    Optional<Session> findByComputerIdAndStatus(Long computerId, Status status);

    // Tìm phiên chơi đang ACTIVE dựa vào mã máy (VD: "PC-01") — Phục vụ tính năng quét mã QR tại bàn
    Optional<Session> findByComputerCodeAndStatus(String computerCode, Status status);

    // Tìm phiên chơi đang ACTIVE của 1 tài khoản khách hàng (1 khách chỉ có tối đa 1 phiên ACTIVE)
    Optional<Session> findByAccountIdAndStatus(Long accountId, Status status);

    // Kiểm tra nhanh xem máy tính có đang có phiên ACTIVE nào không
    boolean existsByComputerIdAndStatus(Long computerId, Status status);

    // Kiểm tra nhanh xem khách hàng có đang chơi tại máy nào khác không
    boolean existsByAccountIdAndStatus(Long accountId, Status status);

    // Lấy toàn bộ danh sách phiên theo trạng thái (VD: lấy tất cả phiên ACTIVE để hiển thị màn hình giám sát máy)
    List<Session> findByStatusOrderByStartedAtDesc(Status status);

    // Lấy lịch sử tất cả phiên chơi của 1 khách hàng (mới nhất lên đầu)
    List<Session> findByAccountIdOrderByStartedAtDesc(Long accountId);
}
