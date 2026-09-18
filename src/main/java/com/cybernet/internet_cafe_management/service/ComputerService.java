package com.cybernet.internet_cafe_management.service;

import java.util.List;

import org.springframework.stereotype.Service;

import com.cybernet.internet_cafe_management.dto.request.CreateComputerRequest;
import com.cybernet.internet_cafe_management.dto.response.ComputerResponse;
import com.cybernet.internet_cafe_management.entity.Computer;
import com.cybernet.internet_cafe_management.exception.ResourceNotFoundException;
import com.cybernet.internet_cafe_management.repository.ComputerRepository;

@Service
public class ComputerService {
    private final ComputerRepository computerRepository;

    public ComputerService(ComputerRepository computerRepository) {
        this.computerRepository = computerRepository;
    }

    // Tạo máy mới
    public ComputerResponse createComputer(CreateComputerRequest request) {
        if (computerRepository.existsByCode(request.getCode()))
            throw new IllegalArgumentException("Máy có mã" + request.getCode() + " đã tồn tại");
        Computer computer = new Computer();
        computer.setCode(request.getCode());
        computer.setPricePerHour(request.getPricePerHour());
        computer.setIpAddress(request.getIpAddress());
        computer.setStatus(Computer.Status.AVAILABLE);
        computer.setZone(request.getZone());
        return ComputerResponse.fromEntity(computerRepository.save(computer));
    }

    // Lấy tất cả máy
    public List<ComputerResponse> getAllComputers() {
        return computerRepository.findAll()
                .stream()
                .map(ComputerResponse::fromEntity)
                .toList();
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
        computerRepository.delete(computer);
    }

    // Cập nhật thông tin máy theo id
    public ComputerResponse updateComputer(Long id, CreateComputerRequest request) {
        Computer computer = computerRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy máy có id:" + id));
        computer.setCode(request.getCode());
        computer.setPricePerHour(request.getPricePerHour());
        computer.setIpAddress(request.getIpAddress());
        computer.setStatus(request.getStatus());
        computer.setZone(request.getZone());
        return ComputerResponse.fromEntity(computerRepository.save(computer));
    }

}
