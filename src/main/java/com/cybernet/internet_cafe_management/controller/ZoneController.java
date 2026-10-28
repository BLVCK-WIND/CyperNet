package com.cybernet.internet_cafe_management.controller;

import com.cybernet.internet_cafe_management.dto.request.CreateZoneRequest;
import com.cybernet.internet_cafe_management.dto.request.UpdateZoneRequest;
import com.cybernet.internet_cafe_management.dto.response.ZoneResponse;
import com.cybernet.internet_cafe_management.service.ZoneService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

/**
 * Controller: Cung cấp các APIs quản lý Khu vực phòng máy (Zone).
 */
@Tag(name = "Zone Management", description = "APIs quản lý danh mục khu vực phòng máy (Zone) động")
@RestController
@RequestMapping("/api/zones")
@RequiredArgsConstructor
public class ZoneController {

    private final ZoneService zoneService;

    @Operation(summary = "Lấy danh sách tất cả khu vực", description = "Lấy toàn bộ khu vực kèm số lượng máy trạm thuộc mỗi khu vực. Yêu cầu quyền ADMIN hoặc STAFF.")
    @GetMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'STAFF')")
    public ResponseEntity<List<ZoneResponse>> getAllZones() {
        return ResponseEntity.ok(zoneService.getAllZones());
    }

    @Operation(summary = "Lấy danh sách khu vực đang hoạt động", description = "Lấy danh sách khu vực có active = true phục vụ Dropdown chọn khi tạo máy hoặc lọc sơ đồ.")
    @GetMapping("/active")
    @PreAuthorize("hasAnyRole('ADMIN', 'STAFF', 'CUSTOMER')")
    public ResponseEntity<List<ZoneResponse>> getActiveZones() {
        return ResponseEntity.ok(zoneService.getActiveZones());
    }

    @Operation(summary = "Xem chi tiết một khu vực theo ID", description = "Xem thông tin chi tiết của khu vực. Yêu cầu quyền ADMIN hoặc STAFF.")
    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'STAFF')")
    public ResponseEntity<ZoneResponse> getZoneById(@PathVariable Long id) {
        return ResponseEntity.ok(zoneService.getZoneById(id));
    }

    @Operation(summary = "Tạo mới khu vực", description = "Thêm một khu vực phòng máy mới (STREAM, ARENA, COUPLE...). Yêu cầu đặc quyền ADMIN.")
    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ZoneResponse> createZone(@Valid @RequestBody CreateZoneRequest request) {
        ZoneResponse response = zoneService.createZone(request);
        return new ResponseEntity<>(response, HttpStatus.CREATED);
    }

    @Operation(summary = "Cập nhật khu vực", description = "Cập nhật tên, đơn giá giờ mặc định, màu sắc hoặc trạng thái khu vực. Yêu cầu đặc quyền ADMIN.")
    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ZoneResponse> updateZone(@PathVariable Long id, @Valid @RequestBody UpdateZoneRequest request) {
        return ResponseEntity.ok(zoneService.updateZone(id, request));
    }

    @Operation(summary = "Xóa khu vực", description = "Xóa khu vực khỏi hệ thống. Yêu cầu đặc quyền ADMIN. Bị chặn nếu còn máy trạm thuộc khu vực.")
    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Void> deleteZone(@PathVariable Long id) {
        zoneService.deleteZone(id);
        return ResponseEntity.noContent().build();
    }
}
