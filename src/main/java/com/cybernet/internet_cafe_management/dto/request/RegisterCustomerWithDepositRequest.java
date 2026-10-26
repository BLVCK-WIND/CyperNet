package com.cybernet.internet_cafe_management.dto.request;

import com.cybernet.internet_cafe_management.entity.TimePurchase.PaymentMethod;
import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Schema(description = "Yêu cầu đăng ký hội viên mới tại quầy thu ngân kèm nạp tiền lần đầu")
public class RegisterCustomerWithDepositRequest {

    @NotBlank(message = "Số điện thoại không được để trống")
    @Pattern(regexp = "^[0-9]{9,11}$", message = "Số điện thoại phải từ 9 đến 11 chữ số")
    @Schema(description = "Số điện thoại của khách hàng", example = "0987654321")
    private String phone;

    @NotBlank(message = "Tên khách hàng không được để trống")
    @Size(min = 2, max = 100, message = "Tên phải từ 2 đến 100 ký tự")
    @Schema(description = "Họ và tên khách hàng", example = "Trần Game Thủ")
    private String name;

    @Schema(description = "Mật khẩu (nếu để trống, hệ thống tự động lấy 4 số cuối của SĐT)", example = "4321")
    private String password;

    @NotNull(message = "Số tiền nạp lần đầu không được để trống")
    @DecimalMin(value = "10000", message = "Số tiền nạp lần đầu tối thiểu là 10.000 VNĐ")
    @Schema(description = "Số tiền nạp giờ ban đầu (tối thiểu 10.000 VNĐ)", example = "50000")
    private BigDecimal initialDeposit;

    @NotNull(message = "Phương thức thanh toán không được để trống")
    @Schema(description = "Phương thức thanh toán (CASH: Tiền mặt, QR: Quét mã QR quầy)", example = "CASH")
    private PaymentMethod paymentMethod;
}
