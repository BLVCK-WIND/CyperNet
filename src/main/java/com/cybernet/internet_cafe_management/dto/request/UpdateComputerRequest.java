package com.cybernet.internet_cafe_management.dto.request;

import com.cybernet.internet_cafe_management.entity.Computer.Status;
import com.cybernet.internet_cafe_management.entity.Computer.Zone;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

/**
 * Request DTO: Cập nhật thông tin máy trạm (Admin / Staff).
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UpdateComputerRequest {

    @Size(max = 20, message = "Mã máy tính tối đa 20 ký tự")
    private String code;

    @NotNull(message = "Giá mỗi giờ không được để trống")
    @Positive(message = "Giá mỗi giờ phải lớn hơn 0")
    private BigDecimal pricePerHour;

    private Status status;

    @jakarta.validation.constraints.Pattern(
        regexp = "^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$",
        message = "Địa chỉ IP không đúng định dạng IPv4"
    )
    private String ipAddress;

    @NotNull(message = "Khu vực máy (Zone) không được để trống")
    private Zone zone;
}
