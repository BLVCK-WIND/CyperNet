package com.cybernet.internet_cafe_management.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

/**
 * Request DTO: Tạo mới khu vực phòng máy (Zone).
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CreateZoneRequest {

    @NotBlank(message = "Mã khu vực không được để trống")
    @Size(max = 50, message = "Mã khu vực tối đa 50 ký tự")
    @Pattern(regexp = "^[A-Za-z0-9_-]+$", message = "Mã khu vực chỉ được chứa chữ cái, chữ số, gạch dưới hoặc gạch ngang (không dấu)")
    private String code;

    @NotBlank(message = "Tên khu vực không được để trống")
    @Size(max = 100, message = "Tên khu vực tối đa 100 ký tự")
    private String name;

    @NotNull(message = "Đơn giá giờ chơi không được để trống")
    @Positive(message = "Đơn giá giờ chơi phải lớn hơn 0")
    private BigDecimal defaultPricePerHour;

    @Pattern(regexp = "^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$", message = "Mã màu phải là mã màu HEX hợp lệ (VD: #bd9875)")
    @Builder.Default
    private String colorCode = "#bd9875";

    @Size(max = 255, message = "Mô tả tối đa 255 ký tự")
    private String description;

    @Builder.Default
    private Boolean active = true;
}
