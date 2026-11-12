package com.cybernet.internet_cafe_management.security;

import com.cybernet.internet_cafe_management.entity.Account;
import com.cybernet.internet_cafe_management.exception.ErrorCode;
import com.cybernet.internet_cafe_management.repository.AccountRepository;
import io.jsonwebtoken.ExpiredJwtException;
import io.jsonwebtoken.JwtException;
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
 * 3. Đối chiếu danh tính, vai trò và phiên xác thực với tài khoản trong DB
 * 4. Set Authentication vào SecurityContextHolder
 * 5. Cho request đi tiếp vào Controller
 */
@Component
public class JwtAuthenticationFilter extends OncePerRequestFilter {

    private final JwtService jwtService;
    private final AccountRepository accountRepository;

    public JwtAuthenticationFilter(JwtService jwtService,
                                   AccountRepository accountRepository) {
        this.jwtService = jwtService;
        this.accountRepository = accountRepository;
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request,
                                     HttpServletResponse response,
                                     FilterChain filterChain)
            throws ServletException, IOException {

        String authHeader = request.getHeader("Authorization");
        if (authHeader != null && authHeader.startsWith("Bearer ")
                && SecurityContextHolder.getContext().getAuthentication() == null) {
            authenticate(request, authHeader.substring(7));
        }
        filterChain.doFilter(request, response);
    }

    private void authenticate(HttpServletRequest request, String token) {
        JwtService.AccessToken access;
        try {
            access = jwtService.readAccessToken(token);
        } catch (ExpiredJwtException ex) {
            request.setAttribute("JWT_ERROR", ErrorCode.TOKEN_EXPIRED);
            return;
        } catch (JwtException | IllegalArgumentException ex) {
            request.setAttribute("JWT_ERROR", ErrorCode.UNAUTHORIZED);
            return;
        }

        if (access.accountId() == null || access.authGeneration() == null) {
            // Legacy credentials predate role binding. Require a fresh sign-in.
            request.setAttribute("JWT_ERROR", ErrorCode.TOKEN_EXPIRED);
            return;
        }

        Account account = accountRepository.findById(access.accountId()).orElse(null);
        if (account == null || !account.getPhone().equals(access.phone())) {
            request.setAttribute("JWT_ERROR", ErrorCode.UNAUTHORIZED);
            return;
        }
        if (!account.getAuthGeneration().equals(access.authGeneration())
                || !account.getRole().name().equals(access.role())) {
            request.setAttribute("JWT_ERROR", ErrorCode.AUTH_ROLE_CHANGED);
            return;
        }

        UserDetails userDetails = CustomUserDetailsService.fromAccount(account);
        var authToken = new UsernamePasswordAuthenticationToken(userDetails, null, userDetails.getAuthorities());
        authToken.setDetails(new WebAuthenticationDetailsSource().buildDetails(request));
        SecurityContextHolder.getContext().setAuthentication(authToken);
    }
}
