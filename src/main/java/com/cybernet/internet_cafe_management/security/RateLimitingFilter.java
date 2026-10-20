package com.cybernet.internet_cafe_management.security;

import com.cybernet.internet_cafe_management.dto.response.ErrorResponse;
import com.cybernet.internet_cafe_management.exception.ErrorCode;
import com.cybernet.internet_cafe_management.logging.MdcLoggingFilter;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.extern.slf4j.Slf4j;
import org.slf4j.MDC;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.atomic.AtomicInteger;

/**
 * Filter áp dụng cơ chế Giới hạn tần suất request (Rate Limiting / Throttling)
 * sử dụng thuật toán Fixed Sliding Window.
 * - Endpoint đã đăng nhập: Khóa theo tài khoản (JWT subject: user:phone).
 * - Endpoint công khai / đăng nhập: Khóa theo Client IP (ip:x.x.x.x, hỗ trợ X-Forwarded-For).
 * Ngăn chặn tấn công Brute-force mật khẩu và spam đơn hàng ảo.
 */
@Slf4j
@Component
public class RateLimitingFilter extends OncePerRequestFilter {

    private final ObjectMapper objectMapper;

    // Lưu trữ số request trong cửa sổ thời gian 60 giây
    private final Map<String, WindowCounter> requestCounts = new ConcurrentHashMap<>();

    private static final long WINDOW_MS = 60_000L; // 1 phút

    @Value("${rate-limiting.enabled:true}")
    private boolean enabled;

    @Value("${rate-limiting.auth-limit:100}")
    private int authLimit;

    @Value("${rate-limiting.order-limit:200}")
    private int orderLimit;

    @Value("${rate-limiting.general-limit:1000}")
    private int generalLimit;

    public RateLimitingFilter(ObjectMapper objectMapper) {
        this.objectMapper = objectMapper;
    }

    public void clearLimits() {
        requestCounts.clear();
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request,
                                    HttpServletResponse response,
                                    FilterChain filterChain) throws ServletException, IOException {

        if (!enabled) {
            filterChain.doFilter(request, response);
            return;
        }

        String path = request.getRequestURI();

        // Bỏ qua các endpoint tĩnh, health check hoặc tài liệu swagger
        if (isWhitelisted(path)) {
            filterChain.doFilter(request, response);
            return;
        }

        String clientIp = MDC.get(MdcLoggingFilter.CLIENT_IP_KEY);
        if (clientIp == null || clientIp.isBlank()) {
            String xfHeader = request.getHeader("X-Forwarded-For");
            if (xfHeader != null && !xfHeader.isBlank()) {
                clientIp = xfHeader.split(",")[0].trim();
            } else {
                clientIp = request.getRemoteAddr();
            }
        }

        // Định danh đối tượng bị giới hạn:
        // Nếu user đã xác thực qua JWT -> khóa theo username (số điện thoại)
        // Nếu chưa đăng nhập -> khóa theo Client IP
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        String identifier;
        if (auth != null && auth.isAuthenticated() && !"anonymousUser".equals(auth.getPrincipal())) {
            identifier = "user:" + auth.getName();
        } else {
            identifier = "ip:" + clientIp;
        }

        int maxLimit = getLimitForPath(path, request.getMethod());
        String key = identifier + ":" + getRateLimitCategory(path);

        long now = System.currentTimeMillis();
        WindowCounter counter = requestCounts.compute(key, (k, existing) -> {
            if (existing == null || now - existing.startTime >= WINDOW_MS) {
                return new WindowCounter(now, 1);
            }
            existing.count.incrementAndGet();
            return existing;
        });

        int currentRequests = counter.count.get();
        int remaining = Math.max(0, maxLimit - currentRequests);

        response.setHeader("X-RateLimit-Limit", String.valueOf(maxLimit));
        response.setHeader("X-RateLimit-Remaining", String.valueOf(remaining));

        if (currentRequests > maxLimit) {
            log.warn("[RATE LIMIT EXCEEDED] Identifier: {} vượt quá hạn mức {} req/phút cho path: {}", identifier, maxLimit, path);
            response.setStatus(HttpStatus.TOO_MANY_REQUESTS.value());
            response.setContentType(MediaType.APPLICATION_JSON_VALUE);
            response.setCharacterEncoding("UTF-8");
            response.setHeader("Retry-After", "60");

            ErrorResponse error = new ErrorResponse(
                    HttpStatus.TOO_MANY_REQUESTS.value(),
                    ErrorCode.RATE_LIMITED,
                    "Quá nhiều yêu cầu. Vui lòng thử lại sau 1 phút!"
            );
            response.getWriter().write(objectMapper.writeValueAsString(error));
            return;
        }

        filterChain.doFilter(request, response);
    }

    private boolean isWhitelisted(String path) {
        return path.startsWith("/swagger-ui") ||
               path.startsWith("/v3/api-docs") ||
               path.startsWith("/actuator") ||
               path.startsWith("/ws");
    }

    private int getLimitForPath(String path, String method) {
        if (path.startsWith("/api/auth") || path.equals("/api/sessions/login")) {
            return authLimit;
        }
        if (path.startsWith("/api/orders") && "POST".equalsIgnoreCase(method)) {
            return orderLimit;
        }
        return generalLimit;
    }

    private String getRateLimitCategory(String path) {
        if (path.startsWith("/api/auth") || path.equals("/api/sessions/login")) {
            return "auth";
        }
        if (path.startsWith("/api/orders")) {
            return "orders";
        }
        return "general";
    }

    private static class WindowCounter {
        final long startTime;
        final AtomicInteger count;

        WindowCounter(long startTime, int initialCount) {
            this.startTime = startTime;
            this.count = new AtomicInteger(initialCount);
        }
    }
}
