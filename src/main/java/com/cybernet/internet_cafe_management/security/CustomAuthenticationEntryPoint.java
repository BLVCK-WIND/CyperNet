package com.cybernet.internet_cafe_management.security;

import com.cybernet.internet_cafe_management.dto.response.ErrorResponse;
import com.cybernet.internet_cafe_management.exception.ErrorCode;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.security.core.AuthenticationException;
import org.springframework.security.web.AuthenticationEntryPoint;
import org.springframework.stereotype.Component;

import java.io.IOException;

@Component
public class CustomAuthenticationEntryPoint implements AuthenticationEntryPoint {

    private final ObjectMapper objectMapper;

    public CustomAuthenticationEntryPoint(ObjectMapper objectMapper) {
        this.objectMapper = objectMapper;
    }

    @Override
    public void commence(HttpServletRequest request,
                          HttpServletResponse response,
                          AuthenticationException authException) throws IOException {
        response.setContentType("application/json;charset=UTF-8");
        response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);

        String jwtError = (String) request.getAttribute("JWT_ERROR");
        ErrorCode code;
        String message;

        if ("TOKEN_EXPIRED".equals(jwtError)) {
            code = ErrorCode.TOKEN_EXPIRED;
            message = "Phiên đăng nhập đã hết hạn! Vui lòng làm mới token hoặc đăng nhập lại.";
        } else {
            code = ErrorCode.UNAUTHORIZED;
            message = "Vui lòng đăng nhập để truy cập!";
        }

        ErrorResponse errorResponse = new ErrorResponse(
                HttpServletResponse.SC_UNAUTHORIZED,
                code,
                message
        );

        response.getWriter().write(objectMapper.writeValueAsString(errorResponse));
    }
}
