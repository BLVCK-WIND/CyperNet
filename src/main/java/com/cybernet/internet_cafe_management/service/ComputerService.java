package com.cybernet.internet_cafe_management.service;

import java.math.BigDecimal;
import java.util.List;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;

import com.cybernet.internet_cafe_management.dto.request.CreateComputerRequest;
import com.cybernet.internet_cafe_management.dto.request.UpdateComputerRequest;
import com.cybernet.internet_cafe_management.dto.response.ComputerResponse;
import com.cybernet.internet_cafe_management.dto.response.PageResponse;
import com.cybernet.internet_cafe_management.entity.Computer;
import com.cybernet.internet_cafe_management.entity.Session;
import com.cybernet.internet_cafe_management.exception.ResourceNotFoundException;
import com.cybernet.internet_cafe_management.repository.ComputerRepository;
import com.cybernet.internet_cafe_management.repository.OrderRepository;
import com.cybernet.internet_cafe_management.repository.SessionRepository;
import com.cybernet.internet_cafe_management.repository.specification.ComputerSpecification;

@Service
public class ComputerService {
    private final ComputerRepository computerRepository;
    private final SessionRepository sessionRepository;
    private final OrderRepository orderRepository;
    private final RealtimeNotificationService realtimeNotificationService;

    public ComputerService(
            ComputerRepository computerRepository,
            SessionRepository sessionRepository,
            OrderRepository orderRepository,
            RealtimeNotificationService realtimeNotificationService) {
        this.computerRepository = computerRepository;
        this.sessionRepository = sessionRepository;
        this.orderRepository = orderRepository;
        this.realtimeNotificationService = realtimeNotificationService;
    }

    // Tạo máy mới
    public ComputerResponse createComputer(CreateComputerRequest request) {
        String cleanCode = request.getCode() != null ? request.getCode().trim().toUpperCase() : "";
        if (computerRepository.existsByCode(cleanCode)) {
            throw new IllegalArgumentException("Mã máy tính [" + cleanCode + "] đã tồn tại!");
        }

        String cleanIp = request.getIpAddress() != null ? request.getIpAddress().trim() : "";
        if (computerRepository.existsByIpAddress(cleanIp)) {
            throw new IllegalArgumentException("Địa chỉ IP [" + cleanIp + "] đã được sử dụng bởi máy khác!");
        }

        Computer computer = new Computer();
        computer.setCode(cleanCode);
        computer.setPricePerHour(request.getPricePerHour());
        computer.setIpAddress(cleanIp);
        computer.setStatus(request.getStatus() != null ? request.getStatus() : Computer.Status.AVAILABLE);
        computer.setZone(request.getZone());

        Computer saved = computerRepository.save(computer);
        realtimeNotificationService.broadcastComputerStatus(saved);
        return ComputerResponse.fromEntity(saved);
    }

    // Lấy tất cả máy
    public List<ComputerResponse> getAllComputers() {
        return computerRepository.findAll()
                .stream()
                .map(ComputerResponse::fromEntity)
                .toList();
    }

    // Lấy danh sách máy có phân trang & lọc theo status/zone
    public PageResponse<ComputerResponse> getAllComputers(Computer.Status status, Computer.Zone zone, Pageable pageable) {
        Page<Computer> page;
        if (status != null) {
            page = computerRepository.findByStatus(status, pageable);
        } else if (zone != null) {
            page = computerRepository.findByZone(zone, pageable);
        } else {
            page = computerRepository.findAll(pageable);
        }
        return PageResponse.fromPage(page, ComputerResponse::fromEntity);
    }

    // Tìm kiếm và lọc máy tính nâng cao (Specification Pattern)
    public PageResponse<ComputerResponse> searchComputers(
            Computer.Status status,
            Computer.Zone zone,
            BigDecimal minPrice,
            BigDecimal maxPrice,
            String keyword,
            Pageable pageable) {

        Specification<Computer> spec = ComputerSpecification.filter(status, zone, minPrice, maxPrice, keyword);
        Page<Computer> page = computerRepository.findAll(spec, pageable);
        return PageResponse.fromPage(page, ComputerResponse::fromEntity);
    }

    // Lấy máy theo id
    public ComputerResponse getComputerById(Long id) {
        Computer computer = computerRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy máy có id:" + id));
        return ComputerResponse.fromEntity(computer);
    }

    // Xoá máy theo id
    public void deleteComputer(Long id) {
        Computer computer = computerRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy máy có id:" + id));

        if (computer.getStatus() == Computer.Status.IN_USE || sessionRepository.existsByComputerIdAndStatus(computer.getId(), Session.Status.ACTIVE)) {
            throw new IllegalStateException("Không thể xóa máy trạm đang có phiên chơi hoạt động!");
        }

        if (sessionRepository.existsByComputerId(computer.getId())) {
            throw new IllegalStateException("Không thể xóa máy trạm đã có lịch sử phiên chơi. Hãy chuyển trạng thái máy sang BẢO TRÌ!");
        }

        if (orderRepository.existsByComputerId(computer.getId())) {
            throw new IllegalStateException("Không thể xóa máy trạm đã có lịch sử đơn hàng. Hãy chuyển trạng thái máy sang BẢO TRÌ!");
        }

        computerRepository.delete(computer);
    }

    // Cập nhật thông tin máy trạm
    public ComputerResponse updateComputer(Long id, UpdateComputerRequest request) {
        Computer computer = computerRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy máy có id:" + id));

        if (request.getCode() != null && !request.getCode().isBlank() && !request.getCode().trim().equalsIgnoreCase(computer.getCode())) {
            String cleanCode = request.getCode().trim().toUpperCase();
            if (computerRepository.existsByCode(cleanCode)) {
                throw new IllegalArgumentException("Mã máy tính [" + cleanCode + "] đã tồn tại!");
            }
            computer.setCode(cleanCode);
        }

        if (request.getIpAddress() != null && !request.getIpAddress().isBlank() && !request.getIpAddress().trim().equalsIgnoreCase(computer.getIpAddress())) {
            String cleanIp = request.getIpAddress().trim();
            if (computerRepository.existsByIpAddressAndIdNot(cleanIp, computer.getId())) {
                throw new IllegalArgumentException("Địa chỉ IP [" + cleanIp + "] đã được sử dụng bởi máy khác!");
            }
            computer.setIpAddress(cleanIp);
        }

        if (request.getStatus() != null && request.getStatus() != computer.getStatus()) {
            if (computer.getStatus() == Computer.Status.IN_USE) {
                boolean hasActiveSession = sessionRepository.existsByComputerIdAndStatus(computer.getId(), Session.Status.ACTIVE);
                if (hasActiveSession) {
                    throw new IllegalStateException("Không thể đổi trạng thái khi máy đang có phiên chơi hoạt động!");
                }
                // Nếu máy mang cờ IN_USE nhưng không có phiên chơi ACTIVE nào trong DB (kẹt trạng thái / desync),
                // cho phép giải phóng máy về trạng thái yêu cầu (AVAILABLE hoặc MAINTENANCE)
            }
            computer.setStatus(request.getStatus());
        }

        if (request.getPricePerHour() != null) {
            computer.setPricePerHour(request.getPricePerHour());
        }
        if (request.getZone() != null) {
            computer.setZone(request.getZone());
        }

        Computer saved = computerRepository.save(computer);
        realtimeNotificationService.broadcastComputerStatus(saved);
        return ComputerResponse.fromEntity(saved);
    }
}
