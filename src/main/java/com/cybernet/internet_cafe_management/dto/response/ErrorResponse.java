package com.cybernet.internet_cafe_management.dto.response;

import com.cybernet.internet_cafe_management.exception.ErrorCode;
import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDateTime;
import java.util.List;

@Getter
@Setter
public class ErrorResponse {

    private int status;
    private String errorCode;
    private String message;
    private LocalDateTime timestamp;

    @JsonInclude(JsonInclude.Include.NON_NULL)
    private List<FieldErrorDetail> fieldErrors;

    public ErrorResponse() {
        this.timestamp = LocalDateTime.now();
    }

    // Constructor tương thích ngược: tự suy luận errorCode mặc định theo status
    public ErrorResponse(int status, String message) {
        this.status = status;
        this.message = message;
        this.errorCode = resolveDefaultErrorCode(status);
        this.timestamp = LocalDateTime.now();
    }

    // Constructor chuẩn với mã lỗi máy đọc được
    public ErrorResponse(int status, String errorCode, String message) {
        this.status = status;
        this.errorCode = errorCode;
        this.message = message;
        this.timestamp = LocalDateTime.now();
    }

    // Constructor chuẩn dùng trực tiếp ErrorCode
    public ErrorResponse(int status, ErrorCode errorCode, String message) {
        this.status = status;
        this.errorCode = errorCode != null ? errorCode.name() : resolveDefaultErrorCode(status);
        this.message = message;
        this.timestamp = LocalDateTime.now();
    }

    // Constructor cho lỗi validation với danh sách fieldErrors
    public ErrorResponse(int status, ErrorCode errorCode, String message, List<FieldErrorDetail> fieldErrors) {
        this.status = status;
        this.errorCode = errorCode != null ? errorCode.name() : resolveDefaultErrorCode(status);
        this.message = message;
        this.fieldErrors = fieldErrors;
        this.timestamp = LocalDateTime.now();
    }

    private static String resolveDefaultErrorCode(int status) {
        return switch (status) {
            case 400 -> ErrorCode.MALFORMED_REQUEST.name();
            case 401 -> ErrorCode.UNAUTHORIZED.name();
            case 403 -> ErrorCode.FORBIDDEN.name();
            case 404 -> ErrorCode.NOT_FOUND.name();
            case 409 -> ErrorCode.OPTIMISTIC_LOCK_CONFLICT.name();
            case 429 -> ErrorCode.RATE_LIMITED.name();
            default -> ErrorCode.INTERNAL_ERROR.name();
        };
    }
}
