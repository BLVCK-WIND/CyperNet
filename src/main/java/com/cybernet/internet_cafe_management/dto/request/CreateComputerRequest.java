package com.cybernet.internet_cafe_management.dto.request;

import java.math.BigDecimal;
import com.cybernet.internet_cafe_management.entity.Computer.Status;
import com.cybernet.internet_cafe_management.entity.Computer.Zone;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.Size;

public class CreateComputerRequest {

    @NotBlank(message = "Mã máy tính không được để trống")
    @Size(max = 20, message = "Mã máy tính tối đa 20 ký tự")
    private String code;

    @NotNull(message = "Giá mỗi giờ không được để trống")
    @Positive(message = "Giá mỗi giờ phải lớn hơn 0")
    private BigDecimal pricePerHour;

    private Status status;

    private String ipAddress;

    @NotNull(message = "Khu vực máy (Zone) không được để trống")
    private Zone zone;

    public CreateComputerRequest() {
    }

    public CreateComputerRequest(String code, BigDecimal pricePerHour, Status status, String ipAddress, Zone zone) {
        this.code = code;
        this.pricePerHour = pricePerHour;
        this.status = status;
        this.ipAddress = ipAddress;
        this.zone = zone;
    }

    public String getCode() {
        return code;
    }

    public void setCode(String code) {
        this.code = code;
    }

    public BigDecimal getPricePerHour() {
        return pricePerHour;
    }

    public void setPricePerHour(BigDecimal pricePerHour) {
        this.pricePerHour = pricePerHour;
    }

    public String getIpAddress() {
        return ipAddress;
    }

    public void setIpAddress(String ipAddress) {
        this.ipAddress = ipAddress;
    }

    public Zone getZone() {
        return zone;
    }

    public void setZone(Zone zone) {
        this.zone = zone;
    }

    public Status getStatus() {
        return status;
    }

    public void setStatus(Status status) {
        this.status = status;
    }
}
