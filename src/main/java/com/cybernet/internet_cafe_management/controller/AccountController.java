package com.cybernet.internet_cafe_management.controller;

import com.cybernet.internet_cafe_management.dto.request.CreateAccountRequest;
import com.cybernet.internet_cafe_management.dto.request.UpdateAccountRequest;
import com.cybernet.internet_cafe_management.dto.response.AccountResponse;
import com.cybernet.internet_cafe_management.dto.response.PageResponse;
import com.cybernet.internet_cafe_management.entity.Account;
import com.cybernet.internet_cafe_management.service.AccountService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@Tag(name = "Account Management", description = "APIs quản lý tài khoản khách hàng, nhân viên và quản trị viên")
@RestController
@RequestMapping("/api/accounts")
public class AccountController {

    private final AccountService accountService;

    // Constructor Injection
    public AccountController(AccountService accountService) {
        this.accountService = accountService;
    }

    // 1. Tạo mới tài khoản (POST /api/accounts) -> Trả về 201 CREATED
    @Operation(summary = "Tạo mới tài khoản", description = "Tạo tài khoản khách hàng hoặc nhân viên mới. Yêu cầu quyền ADMIN hoặc STAFF.")
    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'STAFF')")
    public ResponseEntity<AccountResponse> createAccount(@Valid @RequestBody CreateAccountRequest request) {
        AccountResponse response = accountService.createAccount(request);
        return new ResponseEntity<>(response, HttpStatus.CREATED);
    }

    // 2. Lấy danh sách tài khoản có phân trang & sắp xếp (GET /api/accounts) -> Trả về 200 OK
    @Operation(summary = "Lấy danh sách tài khoản (phân trang)", description = "Lấy danh sách tài khoản theo vai trò (Role) có phân trang và sắp xếp. Yêu cầu quyền ADMIN hoặc STAFF.")
    @GetMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'STAFF')")
    public ResponseEntity<PageResponse<AccountResponse>> getAllAccounts(
            @RequestParam(required = false) Account.Role role,
            @PageableDefault(sort = "id", direction = Sort.Direction.ASC) Pageable pageable) {
        PageResponse<AccountResponse> responses = accountService.getAllAccounts(role, pageable);
        return ResponseEntity.ok(responses);
    }

    // 3. Lấy chi tiết 1 tài khoản (GET /api/accounts/{id}) -> Trả về 200 OK
    @Operation(summary = "Lấy chi tiết tài khoản theo ID", description = "Xem thông tin chi tiết của một tài khoản theo ID. Yêu cầu quyền ADMIN hoặc STAFF.")
    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'STAFF')")
    public ResponseEntity<AccountResponse> getAccountById(@PathVariable Long id) {
        AccountResponse response = accountService.getAccountById(id);
        return ResponseEntity.ok(response);
    }

    // 4. Xóa tài khoản (DELETE /api/accounts/{id}) -> Trả về 204 NO_CONTENT
    @Operation(summary = "Xóa tài khoản", description = "Xóa tài khoản theo ID. Yêu cầu đặc quyền ADMIN.")
    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Void> deleteAccount(@PathVariable Long id) {
        accountService.deleteAccount(id);
        return ResponseEntity.noContent().build();
    }

    // 5. Cập nhật tài khoản (PUT /api/accounts/{id}) -> Trả về 200 OK
    @Operation(summary = "Cập nhật tài khoản", description = "Cập nhật họ tên, vai trò hoặc đặt lại mật khẩu cho tài khoản. Yêu cầu đặc quyền ADMIN.")
    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<AccountResponse> updateAccount(
            @PathVariable Long id,
            @Valid @RequestBody UpdateAccountRequest request) {
        AccountResponse response = accountService.updateAccount(id, request);
        return ResponseEntity.ok(response);
    }
}
