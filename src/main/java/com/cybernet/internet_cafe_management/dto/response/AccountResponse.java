package com.cybernet.internet_cafe_management.dto.response;

import com.cybernet.internet_cafe_management.entity.Account;
import com.cybernet.internet_cafe_management.entity.Account.Role;

import java.time.LocalDateTime;

public class AccountResponse {

    private Long id;
    private String phone;
    private String name;
    private Role role;
    private int remainingMinutes;
    private LocalDateTime createdAt;

    public AccountResponse() {
    }

    public AccountResponse(Long id, String phone, String name, Role role, int remainingMinutes, LocalDateTime createdAt) {
        this.id = id;
        this.phone = phone;
        this.name = name;
        this.role = role;
        this.remainingMinutes = remainingMinutes;
        this.createdAt = createdAt;
    }

    // Tiện ích chuyển đổi nhanh từ Entity sang DTO
    public static AccountResponse fromEntity(Account account) {
        return new AccountResponse(
                account.getId(),
                account.getPhone(),
                account.getName(),
                account.getRole(),
                account.getRemainingMinutes(),
                account.getCreatedAt()
        );
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getPhone() {
        return phone;
    }

    public void setPhone(String phone) {
        this.phone = phone;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public Role getRole() {
        return role;
    }

    public void setRole(Role role) {
        this.role = role;
    }

    public int getRemainingMinutes() {
        return remainingMinutes;
    }

    public void setRemainingMinutes(int remainingMinutes) {
        this.remainingMinutes = remainingMinutes;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }
}
