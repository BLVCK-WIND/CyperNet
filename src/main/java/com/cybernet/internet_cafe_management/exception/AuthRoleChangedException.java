package com.cybernet.internet_cafe_management.exception;

public class AuthRoleChangedException extends RuntimeException {
    public AuthRoleChangedException() {
        super(ErrorCode.AUTH_ROLE_CHANGED.getDefaultMessage());
    }
}
