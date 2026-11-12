package com.cybernet.internet_cafe_management.security;

import com.cybernet.internet_cafe_management.entity.Account;
import io.jsonwebtoken.*;
import io.jsonwebtoken.security.Keys;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.util.Date;

@Service
public class JwtService {

    @Value("${jwt.secret}")
    private String secretKey;

    @Value("${jwt.access-token-expiration-ms}")
    private long accessTokenExpiration;

    @Value("${jwt.refresh-token-expiration-ms}")
    private long refreshTokenExpiration;

    /** The account ID and auth generation bind the signed role to a specific login state. */
    public String generateAccessToken(Account account) {
        return Jwts.builder()
                .subject(account.getPhone())
                .claim("accountId", account.getId())
                .claim("role", account.getRole().name())
                .claim("authGeneration", account.getAuthGeneration())
                .issuedAt(new Date())
                .expiration(new Date(System.currentTimeMillis() + accessTokenExpiration))
                .signWith(getSigningKey())
                .compact();
    }

    AccessToken readAccessToken(String token) {
        Claims claims = extractAllClaims(token);
        return new AccessToken(claims.getSubject(), claims.get("accountId", Long.class),
                claims.get("role", String.class), claims.get("authGeneration", String.class));
    }

    record AccessToken(String phone, Long accountId, String role, String authGeneration) {}

    /** Lấy thời hạn refresh token (ms) — dùng cho AuthService */
    public long getRefreshTokenExpirationMs() {
        return refreshTokenExpiration;
    }

    /** Lấy thời hạn access token (ms) — dùng cho AuthResponse */
    public long getAccessTokenExpirationMs() {
        return accessTokenExpiration;
    }

    // ======= PRIVATE HELPERS =======

    /**
     * Parse và validate tất cả claims từ JWT token
     * Tự động kiểm tra chữ ký + thời hạn
     */
    private Claims extractAllClaims(String token) {
        return Jwts.parser()
                .verifyWith(getSigningKey())
                .build()
                .parseSignedClaims(token)
                .getPayload();
    }

    /**
     * Tạo SecretKey từ chuỗi secret (HMAC-SHA256)
     * Secret phải >= 256 bit (32 bytes) để đảm bảo an toàn
     */
    private SecretKey getSigningKey() {
        return Keys.hmacShaKeyFor(secretKey.getBytes(StandardCharsets.UTF_8));
    }
}
