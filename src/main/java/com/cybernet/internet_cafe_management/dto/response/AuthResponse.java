package com.cybernet.internet_cafe_management.dto.response;

/**
 * Response DTO: Trả về khi đăng nhập hoặc refresh token thành công.
 * Chứa Access Token (JWT), Refresh Token (UUID), thông tin account.
 */
public class AuthResponse {

    private String accessToken;
    private String refreshToken;
    private String tokenType = "Bearer";
    private long expiresIn;           // Access token lifetime in ms
    private AccountResponse account;  // Thông tin user kèm theo

    public AuthResponse() {
    }

    public AuthResponse(String accessToken, String refreshToken,
                        long expiresIn, AccountResponse account) {
        this.accessToken = accessToken;
        this.refreshToken = refreshToken;
        this.expiresIn = expiresIn;
        this.account = account;
    }

    public String getAccessToken() {
        return accessToken;
    }

    public void setAccessToken(String accessToken) {
        this.accessToken = accessToken;
    }

    public String getRefreshToken() {
        return refreshToken;
    }

    public void setRefreshToken(String refreshToken) {
        this.refreshToken = refreshToken;
    }

    public String getTokenType() {
        return tokenType;
    }

    public void setTokenType(String tokenType) {
        this.tokenType = tokenType;
    }

    public long getExpiresIn() {
        return expiresIn;
    }

    public void setExpiresIn(long expiresIn) {
        this.expiresIn = expiresIn;
    }

    public AccountResponse getAccount() {
        return account;
    }

    public void setAccount(AccountResponse account) {
        this.account = account;
    }
}
