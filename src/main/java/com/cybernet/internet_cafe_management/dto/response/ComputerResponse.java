package com.cybernet.internet_cafe_management.dto.response;

import java.math.BigDecimal;
import com.cybernet.internet_cafe_management.entity.Computer;
import com.cybernet.internet_cafe_management.entity.Computer.Status;
import com.cybernet.internet_cafe_management.entity.Computer.Zone;

public class ComputerResponse {
    private Long id;
    private String code;
    private BigDecimal pricePerHour;
    private String ipAddress;
    private Zone zone;
    private Status status;

    public ComputerResponse() {
    }

    public ComputerResponse(Long id, String code, BigDecimal pricePerHour, String ipAddress, Zone zone, Status status) {
        this.id = id;
        this.code = code;
        this.pricePerHour = pricePerHour;
        this.ipAddress = ipAddress;
        this.zone = zone;
        this.status = status;
    }

    public static ComputerResponse fromEntity(Computer computer) {
        return new ComputerResponse(
                computer.getId(),
                computer.getCode(),
                computer.getPricePerHour(),
                computer.getIpAddress(),
                computer.getZone(),
                computer.getStatus());
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
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
