package com.cybernet.internet_cafe_management.service;

import com.cybernet.internet_cafe_management.dto.request.CreateZoneRequest;
import com.cybernet.internet_cafe_management.dto.request.UpdateZoneRequest;
import com.cybernet.internet_cafe_management.dto.response.ZoneResponse;
import com.cybernet.internet_cafe_management.entity.Zone;
import com.cybernet.internet_cafe_management.exception.ResourceNotFoundException;
import com.cybernet.internet_cafe_management.repository.ComputerRepository;
import com.cybernet.internet_cafe_management.repository.ZoneRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

/**
 * Service xử lý toàn bộ logic nghiệp vụ quản lý Khu vực phòng máy (Zone).
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class ZoneService {

    private final ZoneRepository zoneRepository;
    private final ComputerRepository computerRepository;

    /**
     * Lấy danh sách toàn bộ khu vực, kèm theo số lượng máy trạm thuộc mỗi khu vực.
     */
    @Transactional(readOnly = true)
    public List<ZoneResponse> getAllZones() {
        return zoneRepository.findAllByOrderByCreatedAtAsc().stream()
                .map(zone -> {
                    long count = computerRepository.countComputersByZoneCode(zone.getCode());
                    return ZoneResponse.fromEntity(zone, count);
                })
                .collect(Collectors.toList());
    }

    /**
     * Lấy danh sách các khu vực đang hoạt động phục vụ Dropdown cho Staff/Admin.
     */
    @Transactional(readOnly = true)
    public List<ZoneResponse> getActiveZones() {
        return zoneRepository.findByActiveTrueOrderByCreatedAtAsc().stream()
                .map(zone -> {
                    long count = computerRepository.countComputersByZoneCode(zone.getCode());
                    return ZoneResponse.fromEntity(zone, count);
                })
                .collect(Collectors.toList());
    }

    /**
     * Lấy thông tin chi tiết khu vực theo ID.
     */
    @Transactional(readOnly = true)
    public ZoneResponse getZoneById(Long id) {
        Zone zone = zoneRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Khu vực không tồn tại trong hệ thống (ID: " + id + ")"));
        long count = computerRepository.countComputersByZoneCode(zone.getCode());
        return ZoneResponse.fromEntity(zone, count);
    }

    /**
     * Tạo mới một khu vực phòng máy.
     */
    @Transactional
    public ZoneResponse createZone(CreateZoneRequest request) {
        String cleanCode = request.getCode().trim().toUpperCase();

        if (zoneRepository.existsByCodeIgnoreCase(cleanCode)) {
            throw new IllegalArgumentException("Mã khu vực đã tồn tại: " + cleanCode);
        }

        String color = (request.getColorCode() != null && !request.getColorCode().isBlank())
                ? request.getColorCode().trim()
                : "#bd9875";

        Zone zone = Zone.builder()
                .code(cleanCode)
                .name(request.getName().trim())
                .defaultPricePerHour(request.getDefaultPricePerHour())
                .colorCode(color)
                .description(request.getDescription() != null ? request.getDescription().trim() : null)
                .active(request.getActive() != null ? request.getActive() : true)
                .build();

        Zone savedZone = zoneRepository.save(zone);
        log.info("Tạo mới khu vực thành công: code={}, name={}, price={}", savedZone.getCode(), savedZone.getName(), savedZone.getDefaultPricePerHour());
        return ZoneResponse.fromEntity(savedZone, 0);
    }

    /**
     * Cập nhật thông tin khu vực phòng máy.
     * Lưu ý: Không cho phép đổi 'code' để bảo toàn liên kết với máy trạm.
     */
    @Transactional
    public ZoneResponse updateZone(Long id, UpdateZoneRequest request) {
        Zone zone = zoneRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Khu vực không tồn tại trong hệ thống (ID: " + id + ")"));

        zone.setName(request.getName().trim());
        zone.setDefaultPricePerHour(request.getDefaultPricePerHour());

        if (request.getColorCode() != null && !request.getColorCode().isBlank()) {
            zone.setColorCode(request.getColorCode().trim());
        }

        if (request.getDescription() != null) {
            zone.setDescription(request.getDescription().trim());
        }

        if (request.getActive() != null) {
            zone.setActive(request.getActive());
        }

        Zone updatedZone = zoneRepository.save(zone);
        long count = computerRepository.countComputersByZoneCode(updatedZone.getCode());
        log.info("Cập nhật khu vực thành công: id={}, code={}, name={}", updatedZone.getId(), updatedZone.getCode(), updatedZone.getName());
        return ZoneResponse.fromEntity(updatedZone, count);
    }

    /**
     * Xóa khu vực phòng máy.
     * Rào chắn bảo vệ:
     * 1. Không cho xóa 2 zone mặc định STANDARD và VIP.
     * 2. Không cho xóa nếu đang có máy trạm thuộc khu vực này.
     */
    @Transactional
    public void deleteZone(Long id) {
        Zone zone = zoneRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Khu vực không tồn tại trong hệ thống (ID: " + id + ")"));

        if ("STANDARD".equalsIgnoreCase(zone.getCode()) || "VIP".equalsIgnoreCase(zone.getCode())) {
            throw new IllegalStateException("Không thể xóa khu vực mặc định cốt lõi của hệ thống (" + zone.getCode() + ")!");
        }

        long computerCount = computerRepository.countComputersByZoneCode(zone.getCode());
        if (computerCount > 0) {
            throw new IllegalStateException("Không thể xóa vì khu vực đang có máy trạm hoạt động (" + computerCount + " máy)! Vui lòng chuyển các máy trạm sang khu vực khác trước khi xóa.");
        }

        zoneRepository.delete(zone);
        log.info("Đã xóa khu vực thành công: id={}, code={}", id, zone.getCode());
    }
}
