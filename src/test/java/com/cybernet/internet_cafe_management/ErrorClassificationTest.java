package com.cybernet.internet_cafe_management;

import com.cybernet.internet_cafe_management.exception.GlobalExceptionHandler;
import org.junit.jupiter.api.Test;
import static org.junit.jupiter.api.Assertions.*;

class ErrorClassificationTest {
    private final GlobalExceptionHandler handler = new GlobalExceptionHandler();
    @Test void refreshTokenErrorsKeepTheirCodeDespiteOtherWords() {
        var response = handler.handleBadRequestException(new IllegalArgumentException("Refresh token expired: active session"));
        assertEquals(400, response.getStatusCode().value());
        assertEquals("REFRESH_TOKEN_INVALID", response.getBody().getErrorCode());
    }
    @Test void genericNotFoundRemainsCompatible() {
        var response = handler.handleResourceNotFoundException(new com.cybernet.internet_cafe_management.exception.ResourceNotFoundException("missing computer"));
        assertEquals(404, response.getStatusCode().value());
        assertEquals("NOT_FOUND", response.getBody().getErrorCode());
    }
}
