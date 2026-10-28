package com.cybernet.internet_cafe_management.repository;

import com.cybernet.internet_cafe_management.entity.Zone;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

/**
 * Repository: Thao tác dữ liệu bảng zones (Khu vực phòng máy).
 */
@Repository
public interface ZoneRepository extends JpaRepository<Zone, Long> {

    /**
     * Tìm khu vực theo mã định danh (chính xác).
     */
    Optional<Zone> findByCode(String code);

    /**
     * Tìm khu vực theo mã định danh (không phân biệt hoa thường).
     */
    Optional<Zone> findByCodeIgnoreCase(String code);

    /**
     * Kiểm tra sự tồn tại của mã khu vực (không phân biệt hoa thường).
     */
    boolean existsByCodeIgnoreCase(String code);

    /**
     * Lấy danh sách các khu vực đang hoạt động phục vụ Dropdown chọn khi tạo/lọc máy trạm.
     */
    List<Zone> findByActiveTrueOrderByCreatedAtAsc();

    /**
     * Lấy toàn bộ danh sách khu vực sắp xếp theo thời điểm tạo.
     */
    List<Zone> findAllByOrderByCreatedAtAsc();
}
