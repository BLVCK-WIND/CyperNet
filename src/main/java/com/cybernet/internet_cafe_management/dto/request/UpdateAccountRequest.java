package com.cybernet.internet_cafe_management.dto.request;

import com.cybernet.internet_cafe_management.entity.Account.Role;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Request DTO: Cập nhật thông tin tài khoản (Admin).
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UpdateAccountRequest {

    @NotBlank(message = "Tên tài khoản không được để trống")
    @Size(min = 2, max = 100, message = "Tên phải từ 2 đến 100 ký tự")
    private String name;

    @Size(min = 4, max = 100, message = "Mật khẩu phải từ 4 ký tự trở lên nếu muốn đổi mật khẩu")
    private String password;

    @NotNull(message = "Vai trò (Role) không được để trống")
    private Role role;
}
