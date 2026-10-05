package com.cybernet.internet_cafe_management.repository;

import com.cybernet.internet_cafe_management.entity.TimePurchase;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface TimePurchaseRepository extends JpaRepository<TimePurchase, Long> {

    // Lấy danh sách giao dịch mua giờ của 1 tài khoản khách hàng cụ thể
    // Sắp xếp theo ngày tạo giảm dần (mới nhất lên đầu)
    List<TimePurchase> findByAccountIdOrderByCreatedAtDesc(Long accountId);

    // Lấy danh sách giao dịch theo trạng thái (ví dụ: lấy tất cả đơn PENDING_PAYMENT cho nhân viên quầy duyệt)
    List<TimePurchase> findByStatusOrderByCreatedAtDesc(TimePurchase.Status status);
}
