package com.cybernet.internet_cafe_management.dto.response.report;

import com.cybernet.internet_cafe_management.entity.Computer;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ComputerUsageResponse {

    // ID máy tính
    private Long computerId;

    // Mã máy (VD: "PC-01", "VIP-02")
    private String computerCode;

    // Phân khu (STANDARD, VIP)
    private Computer.Zone zone;

    // Tổng số lượt mở phiên chơi tại máy này
    private long totalSessions;

    // Tổng thời lượng máy đã phục vụ khách (tính theo phút)
    private long totalMinutesUsed;
}
