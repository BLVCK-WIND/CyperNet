package com.cybernet.internet_cafe_management.dto.response;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Schema(description = "Kết quả đăng ký hội viên mới tại quầy kèm nạp tiền lần đầu")
public class RegisterCustomerResponse {

    @Schema(description = "Thông tin tài khoản hội viên vừa tạo")
    private AccountResponse account;

    @Schema(description = "Thông tin giao dịch nạp giờ lần đầu")
    private TimePurchaseResponse initialPurchase;

    @Schema(description = "Mật khẩu khởi tạo để nhân viên thông báo cho khách", example = "4321")
    private String initialPassword;

    @Schema(description = "Thông điệp phản hồi từ hệ thống", example = "Đăng ký hội viên thành công! Đã nạp 50.000 VNĐ (300 phút)")
    private String message;
}
