package com.cybernet.internet_cafe_management.dto.response;

import com.cybernet.internet_cafe_management.entity.Zone;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;

/**
 * Response DTO: Trả về thông tin chi tiết khu vực phòng máy (Zone) cho Frontend.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ZoneResponse {

    private Long id;
    private String code;
    private String name;
    private BigDecimal defaultPricePerHour;
    private String colorCode;
    private String description;
    private boolean active;
    private LocalDateTime createdAt;
    private long totalComputers;

    public static ZoneResponse fromEntity(Zone zone, long totalComputers) {
        if (zone == null) {
            return null;
        }
        return ZoneResponse.builder()
                .id(zone.getId())
                .code(zone.getCode())
                .name(zone.getName())
                .defaultPricePerHour(zone.getDefaultPricePerHour())
                .colorCode(zone.getColorCode())
                .description(zone.getDescription())
                .active(zone.isActive())
                .createdAt(zone.getCreatedAt())
                .totalComputers(totalComputers)
                .build();
    }

    public static ZoneResponse fromEntity(Zone zone) {
        return fromEntity(zone, 0);
    }
}
