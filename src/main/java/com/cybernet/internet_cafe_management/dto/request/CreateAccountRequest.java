package com.cybernet.internet_cafe_management.dto.request;

import com.cybernet.internet_cafe_management.entity.Account.Role;

public class CreateAccountRequest {

    private String phone;
    private String name;
    private String password;
    private Role role;

    public CreateAccountRequest() {
    }

    public CreateAccountRequest(String phone, String name, String password, Role role) {
        this.phone = phone;
        this.name = name;
        this.password = password;
        this.role = role;
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

    public String getPassword() {
        return password;
    }

    public void setPassword(String password) {
        this.password = password;
    }

    public Role getRole() {
        return role;
    }

    public void setRole(Role role) {
        this.role = role;
    }
}
