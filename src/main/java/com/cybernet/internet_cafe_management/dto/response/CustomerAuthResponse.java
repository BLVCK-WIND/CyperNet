package com.cybernet.internet_cafe_management.dto.response;

import com.cybernet.internet_cafe_management.entity.Computer;

/**
 * Response DTO: Trả về cho khách hàng sau khi xác thực phiên chơi thành công qua mã QR.
 * Bao gồm Access Token (JWT quyền ROLE_CUSTOMER), Refresh Token và thông tin phiên chơi hiện tại (hoặc null nếu máy trống).
 */
public class CustomerAuthResponse extends AuthResponse {

    private SessionResponse session;
    private String computerCode;
    private Computer.Zone computerZone;

    public CustomerAuthResponse() {
        super();
    }

    public CustomerAuthResponse(String accessToken, String refreshToken, long expiresIn,
                                AccountResponse account, SessionResponse session) {
        super(accessToken, refreshToken, expiresIn, account);
        this.session = session;
        if (session != null) {
            this.computerCode = session.getComputerCode();
            this.computerZone = session.getComputerZone();
        }
    }

    public CustomerAuthResponse(String accessToken, String refreshToken, long expiresIn,
                                AccountResponse account, SessionResponse session,
                                String computerCode, Computer.Zone computerZone) {
        super(accessToken, refreshToken, expiresIn, account);
        this.session = session;
        this.computerCode = computerCode;
        this.computerZone = computerZone;
    }

    public SessionResponse getSession() {
        return session;
    }

    public void setSession(SessionResponse session) {
        this.session = session;
    }

    public String getComputerCode() {
        return computerCode;
    }

    public void setComputerCode(String computerCode) {
        this.computerCode = computerCode;
    }

    public Computer.Zone getComputerZone() {
        return computerZone;
    }

    public void setComputerZone(Computer.Zone computerZone) {
        this.computerZone = computerZone;
    }
}
