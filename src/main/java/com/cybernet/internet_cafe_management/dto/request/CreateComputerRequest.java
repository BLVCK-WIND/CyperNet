package com.cybernet.internet_cafe_management.dto.request;

import java.math.BigDecimal;
import com.cybernet.internet_cafe_management.entity.Computer.Status;
import com.cybernet.internet_cafe_management.entity.Computer.Zone;

public class CreateComputerRequest {
    private String code;
    private BigDecimal pricePerHour;
    private Status status;
    private String ipAddress;
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
