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

    /**
     * Sinh Access Token — chứa phone (subject) + role (custom claim)
     * Payload: { "sub": "0912345678", "role": "STAFF", "iat": ..., "exp": ... }
     */
    public String generateAccessToken(Account account) {
        return Jwts.builder()
                .subject(account.getPhone())
                .claim("role", account.getRole().name())
                .issuedAt(new Date())
                .expiration(new Date(System.currentTimeMillis() + accessTokenExpiration))
                .signWith(getSigningKey())
                .compact();
    }

    /**
     * Trích xuất phone (subject) từ token
     */
    public String extractPhone(String token) {
        return extractAllClaims(token).getSubject();
    }

    /**
     * Trích xuất role từ token
     */
    public String extractRole(String token) {
        return extractAllClaims(token).get("role", String.class);
    }

    public enum TokenStatus {
        VALID,
        EXPIRED,
        INVALID
    }

    /**
     * Xác thực trạng thái token (Hợp lệ / Hết hạn / Sai định dạng hoặc giả mạo)
     */
    public TokenStatus validateToken(String token) {
        try {
            extractAllClaims(token);
            return TokenStatus.VALID;
        } catch (ExpiredJwtException e) {
            return TokenStatus.EXPIRED;
        } catch (JwtException | IllegalArgumentException e) {
            return TokenStatus.INVALID;
        }
    }

    /**
     * Kiểm tra token còn hạn và chữ ký hợp lệ
     * Trả về false nếu token bị sửa, hết hạn hoặc sai format
     */
    public boolean isTokenValid(String token) {
        return validateToken(token) == TokenStatus.VALID;
    }

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
