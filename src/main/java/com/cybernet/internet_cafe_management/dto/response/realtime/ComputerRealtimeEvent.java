package com.cybernet.internet_cafe_management.dto.response.realtime;

import com.cybernet.internet_cafe_management.entity.Computer;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;

/**
 * Event DTO phát tán qua WebSocket topic /topic/computers
 * khi máy trạm đổi trạng thái (AVAILABLE <-> IN_USE <-> MAINTENANCE).
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ComputerRealtimeEvent {

    private Long computerId;
    private String computerCode;
    private Computer.Status status;
    private Computer.Zone zone;
    private BigDecimal pricePerHour;
    private String ipAddress;
    private LocalDateTime timestamp;

    public static ComputerRealtimeEvent fromComputer(Computer computer) {
        if (computer == null) {
            return null;
        }
        return ComputerRealtimeEvent.builder()
                .computerId(computer.getId())
                .computerCode(computer.getCode())
                .status(computer.getStatus())
                .zone(computer.getZone())
                .pricePerHour(computer.getPricePerHour())
                .ipAddress(computer.getIpAddress())
                .timestamp(LocalDateTime.now())
                .build();
    }
}
