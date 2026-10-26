package com.cybernet.internet_cafe_management.exception;

import com.cybernet.internet_cafe_management.dto.response.ErrorResponse;
import com.cybernet.internet_cafe_management.dto.response.FieldErrorDetail;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.MissingServletRequestParameterException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.method.annotation.MethodArgumentTypeMismatchException;

import java.util.List;
import java.util.stream.Collectors;

@Slf4j
@RestControllerAdvice
public class GlobalExceptionHandler {

    @ExceptionHandler(ResourceNotFoundException.class)
    public ResponseEntity<ErrorResponse> handleResourceNotFoundException(ResourceNotFoundException ex) {
        log.warn("ResourceNotFoundException: {}", ex.getMessage());
        ErrorResponse errorResponse = new ErrorResponse(
                HttpStatus.NOT_FOUND.value(),
                ErrorCode.NOT_FOUND,
                ex.getMessage()
        );
        return new ResponseEntity<>(errorResponse, HttpStatus.NOT_FOUND);
    }

    @ExceptionHandler({IllegalArgumentException.class, IllegalStateException.class})
    public ResponseEntity<ErrorResponse> handleBadRequestException(RuntimeException ex) {
        log.warn("BadRequestException: {}", ex.getMessage());
        ErrorCode code = determineErrorCode(ex.getMessage());
        ErrorResponse errorResponse = new ErrorResponse(
                HttpStatus.BAD_REQUEST.value(),
                code,
                ex.getMessage()
        );
        return new ResponseEntity<>(errorResponse, HttpStatus.BAD_REQUEST);
    }

    @ExceptionHandler(org.springframework.orm.ObjectOptimisticLockingFailureException.class)
    public ResponseEntity<ErrorResponse> handleOptimisticLockException(Exception ex) {
        log.warn("OptimisticLockException: {}", ex.getMessage());
        ErrorResponse errorResponse = new ErrorResponse(
                HttpStatus.CONFLICT.value(),
                ErrorCode.OPTIMISTIC_LOCK_CONFLICT,
                "Dữ liệu tài khoản đang được cập nhật bởi một giao dịch khác. Vui lòng thử lại!"
        );
        return new ResponseEntity<>(errorResponse, HttpStatus.CONFLICT);
    }

    @ExceptionHandler({org.springframework.dao.PessimisticLockingFailureException.class, org.springframework.dao.CannotAcquireLockException.class})
    public ResponseEntity<ErrorResponse> handlePessimisticLockException(Exception ex) {
        log.warn("PessimisticLockException: {}", ex.getMessage());
        ErrorResponse errorResponse = new ErrorResponse(
                HttpStatus.CONFLICT.value(),
                ErrorCode.PESSIMISTIC_LOCK_CONFLICT,
                "Máy tính đang trong quá trình xử lý bởi người dùng khác. Vui lòng thử lại sau giây lát!"
        );
        return new ResponseEntity<>(errorResponse, HttpStatus.CONFLICT);
    }

    @ExceptionHandler(AccessDeniedException.class)
    public ResponseEntity<ErrorResponse> handleAccessDeniedException(AccessDeniedException ex) {
        log.warn("AccessDenied: {}", ex.getMessage());
        String message = (ex.getMessage() != null && !ex.getMessage().isBlank() && !ex.getMessage().equalsIgnoreCase("Access Denied"))
                ? ex.getMessage()
                : "Bạn không có quyền truy cập tài nguyên này!";
        ErrorResponse errorResponse = new ErrorResponse(
                HttpStatus.FORBIDDEN.value(),
                ErrorCode.FORBIDDEN,
                message
        );
        return new ResponseEntity<>(errorResponse, HttpStatus.FORBIDDEN);
    }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<ErrorResponse> handleValidationException(MethodArgumentNotValidException ex) {
        List<FieldErrorDetail> fieldErrors = ex.getBindingResult().getFieldErrors().stream()
                .map(error -> new FieldErrorDetail(error.getField(), error.getDefaultMessage()))
                .collect(Collectors.toList());

        String defaultMessage = fieldErrors.isEmpty() ? "Dữ liệu không hợp lệ!" : fieldErrors.get(0).getMessage();
        log.warn("Validation failed: {} errors - {}", fieldErrors.size(), defaultMessage);

        ErrorResponse errorResponse = new ErrorResponse(
                HttpStatus.BAD_REQUEST.value(),
                ErrorCode.VALIDATION_ERROR,
                defaultMessage,
                fieldErrors
        );
        return new ResponseEntity<>(errorResponse, HttpStatus.BAD_REQUEST);
    }

    @ExceptionHandler({
            HttpMessageNotReadableException.class,
            MethodArgumentTypeMismatchException.class,
            MissingServletRequestParameterException.class
    })
    public ResponseEntity<ErrorResponse> handleMalformedRequestException(Exception ex) {
        log.warn("MalformedRequestException: {}", ex.getMessage());
        ErrorResponse errorResponse = new ErrorResponse(
                HttpStatus.BAD_REQUEST.value(),
                ErrorCode.MALFORMED_REQUEST,
                "Dữ liệu yêu cầu không đúng định dạng hoặc thiếu tham số bắt buộc!"
        );
        return new ResponseEntity<>(errorResponse, HttpStatus.BAD_REQUEST);
    }

    @ExceptionHandler(org.springframework.web.servlet.resource.NoResourceFoundException.class)
    public ResponseEntity<ErrorResponse> handleNoResourceFoundException(org.springframework.web.servlet.resource.NoResourceFoundException ex) {
        log.warn("NoResourceFoundException: {}", ex.getMessage());
        ErrorResponse errorResponse = new ErrorResponse(
                HttpStatus.NOT_FOUND.value(),
                ErrorCode.NOT_FOUND,
                "Không tìm thấy tài nguyên: " + ex.getResourcePath()
        );
        return new ResponseEntity<>(errorResponse, HttpStatus.NOT_FOUND);
    }

    @ExceptionHandler(Exception.class)
    public ResponseEntity<ErrorResponse> handleGeneralException(Exception ex) {
        log.error("Internal Server Error: ", ex);
        ErrorResponse errorResponse = new ErrorResponse(
                HttpStatus.INTERNAL_SERVER_ERROR.value(),
                ErrorCode.INTERNAL_ERROR,
                "Đã có lỗi hệ thống xảy ra. Vui lòng liên hệ quản trị viên!"
        );
        return new ResponseEntity<>(errorResponse, HttpStatus.INTERNAL_SERVER_ERROR);
    }

    private ErrorCode determineErrorCode(String message) {
        if (message == null) return ErrorCode.MALFORMED_REQUEST;
        String lower = message.toLowerCase();
        if (lower.contains("chờ duyệt") || lower.contains("pending")) return ErrorCode.ORDER_NOT_PENDING;
        if (lower.contains("hết hàng") || lower.contains("out of stock")) return ErrorCode.ORDER_OUT_OF_STOCK;
        if (lower.contains("chính máy hiện tại") || lower.contains("cùng một máy")) return ErrorCode.TRANSFER_SAME_COMPUTER;
        if (lower.contains("khả dụng") || lower.contains("available") || lower.contains("đang hoạt động") || lower.contains("đang được sử dụng") || lower.contains("đang sử dụng")) return ErrorCode.COMPUTER_NOT_AVAILABLE;
        if (lower.contains("không còn hoạt động") || lower.contains("không ở trạng thái active") || lower.contains("phiên")) return ErrorCode.SESSION_NOT_ACTIVE;
        if (lower.contains("không đủ") || lower.contains("số dư") || lower.contains("phút")) return ErrorCode.INSUFFICIENT_TIME;
        if (lower.contains("mật khẩu") || lower.contains("không chính xác") || lower.contains("tài khoản không tồn tại")) return ErrorCode.INVALID_CREDENTIALS;
        if (lower.contains("đang có phiên") || lower.contains("active")) return ErrorCode.ACTIVE_SESSION_EXISTS;
        if (lower.contains("refresh token")) return ErrorCode.REFRESH_TOKEN_INVALID;
        return ErrorCode.MALFORMED_REQUEST;
    }
}
