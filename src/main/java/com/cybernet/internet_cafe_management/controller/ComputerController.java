package com.cybernet.internet_cafe_management.controller;

import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.cybernet.internet_cafe_management.dto.request.CreateComputerRequest;
import com.cybernet.internet_cafe_management.dto.request.UpdateComputerRequest;
import com.cybernet.internet_cafe_management.dto.response.ComputerResponse;
import com.cybernet.internet_cafe_management.dto.response.PageResponse;
import com.cybernet.internet_cafe_management.entity.Computer;
import com.cybernet.internet_cafe_management.service.ComputerService;

import java.math.BigDecimal;
import java.util.List;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestParam;

@Tag(name = "Computer Management", description = "APIs quản lý danh mục máy trạm, trạng thái và khu vực (Zone)")
@RestController
@RequestMapping("/api/computers")
public class ComputerController {
    private final ComputerService computerService;

    public ComputerController(ComputerService computerService) {
        this.computerService = computerService;
    }

    // Tạo mới máy tính
    @Operation(summary = "Thêm máy trạm mới", description = "Thêm một máy trạm vào hệ thống. Yêu cầu quyền ADMIN hoặc STAFF.")
    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'STAFF')")
    public ResponseEntity<ComputerResponse> createComputer(@Valid @RequestBody CreateComputerRequest request) {
        ComputerResponse response = computerService.createComputer(request);
        return new ResponseEntity<>(response, HttpStatus.CREATED);
    }

    // Lấy danh sách máy tính có phân trang & sắp xếp, hỗ trợ lọc đa tiêu chí (Specification)
    @Operation(summary = "Lấy danh sách máy trạm (phân trang & lọc đa tiêu chí)", description = "Lấy danh sách máy trạm có hỗ trợ lọc theo trạng thái (AVAILABLE, IN_USE, MAINTENANCE), khu vực (STANDARD, VIP, STREAM), khoảng giá và từ khóa tìm kiếm (mã máy/IP).")
    @GetMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'STAFF')")
    public ResponseEntity<PageResponse<ComputerResponse>> getAllComputers(
            @RequestParam(required = false) Computer.Status status,
            @RequestParam(required = false) Computer.Zone zone,
            @RequestParam(required = false) BigDecimal minPrice,
            @RequestParam(required = false) BigDecimal maxPrice,
            @RequestParam(required = false) String keyword,
            @PageableDefault(sort = "code", direction = Sort.Direction.ASC) Pageable pageable) {
        PageResponse<ComputerResponse> response = computerService.searchComputers(status, zone, minPrice, maxPrice, keyword, pageable);
        return ResponseEntity.ok(response);
    }

    // get computer by id
    @Operation(summary = "Lấy thông tin máy trạm theo ID", description = "Xem chi tiết thông số, IP và trạng thái của máy trạm. Yêu cầu quyền ADMIN hoặc STAFF.")
    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'STAFF')")
    public ResponseEntity<ComputerResponse> getComputerById(@PathVariable Long id) {
        ComputerResponse response = computerService.getComputerById(id);
        return ResponseEntity.ok(response);
    }

    // update computer
    @Operation(summary = "Cập nhật máy trạm", description = "Cập nhật thông tin thông số, giá hoặc trạng thái máy trạm (bảo trì). Yêu cầu quyền ADMIN hoặc STAFF.")
    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'STAFF')")
    public ResponseEntity<ComputerResponse> updateComputer(
            @PathVariable Long id,
            @Valid @RequestBody UpdateComputerRequest request) {
        ComputerResponse response = computerService.updateComputer(id, request);
        return ResponseEntity.ok(response);
    }

    // delete computer
    @Operation(summary = "Xóa máy trạm", description = "Xóa máy trạm khỏi hệ thống. Yêu cầu đặc quyền ADMIN.")
    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Void> deleteComputerById(@PathVariable Long id) {
        computerService.deleteComputer(id);
        return ResponseEntity.noContent().build();
    }
}
