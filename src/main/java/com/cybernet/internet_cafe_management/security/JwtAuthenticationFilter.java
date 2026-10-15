package com.cybernet.internet_cafe_management.security;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;

/**
 * JWT Authentication Filter — chặn mọi HTTP request để xác thực JWT token.
 *
 * Flow xử lý:
 * 1. Đọc header "Authorization: Bearer <token>"
 * 2. Validate token (chữ ký + hạn sử dụng)
 * 3. Extract phone từ token → load UserDetails từ DB
 * 4. Set Authentication vào SecurityContextHolder
 * 5. Cho request đi tiếp vào Controller
 */
@Component
public class JwtAuthenticationFilter extends OncePerRequestFilter {

    private final JwtService jwtService;
    private final CustomUserDetailsService userDetailsService;

    public JwtAuthenticationFilter(JwtService jwtService,
                                    CustomUserDetailsService userDetailsService) {
        this.jwtService = jwtService;
        this.userDetailsService = userDetailsService;
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request,
                                     HttpServletResponse response,
                                     FilterChain filterChain)
            throws ServletException, IOException {

        // 1. Đọc header "Authorization: Bearer <token>"
        String authHeader = request.getHeader("Authorization");
        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            // Không có JWT → cho request đi tiếp (có thể là endpoint public)
            filterChain.doFilter(request, response);
            return;
        }

        String token = authHeader.substring(7); // Cắt bỏ "Bearer "

        // 2. Validate token & extract phone
        if (jwtService.isTokenValid(token)) {
            String phone = jwtService.extractPhone(token);

            // 3. Chỉ set Authentication nếu chưa có trong context (tránh ghi đè)
            if (SecurityContextHolder.getContext().getAuthentication() == null) {
                UserDetails userDetails = userDetailsService.loadUserByUsername(phone);

                UsernamePasswordAuthenticationToken authToken =
                        new UsernamePasswordAuthenticationToken(
                                userDetails,
                                null,                           // Credentials không cần (đã xác thực bằng JWT)
                                userDetails.getAuthorities()    // Quyền: ROLE_ADMIN, ROLE_STAFF, ROLE_CUSTOMER
                        );
                authToken.setDetails(
                        new WebAuthenticationDetailsSource().buildDetails(request));

                // 4. Set vào SecurityContext → các @PreAuthorize sẽ kiểm tra từ đây
                SecurityContextHolder.getContext().setAuthentication(authToken);
            }
        }

        // 5. Cho request đi tiếp
        filterChain.doFilter(request, response);
    }
}
