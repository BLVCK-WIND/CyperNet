package com.cybernet.internet_cafe_management.dto.response;

/**
 * Response DTO: Trả về cho khách hàng sau khi xác thực phiên chơi thành công qua mã QR.
 * Bao gồm Access Token (JWT quyền ROLE_CUSTOMER), Refresh Token và thông tin phiên chơi hiện tại.
 */
public class CustomerAuthResponse extends AuthResponse {

    private SessionResponse session;

    public CustomerAuthResponse() {
        super();
    }

    public CustomerAuthResponse(String accessToken, String refreshToken, long expiresIn,
                                AccountResponse account, SessionResponse session) {
        super(accessToken, refreshToken, expiresIn, account);
        this.session = session;
    }

    public SessionResponse getSession() {
        return session;
    }

    public void setSession(SessionResponse session) {
        this.session = session;
    }
}
