package com.cybernet.internet_cafe_management.service;

import com.cybernet.internet_cafe_management.dto.request.CreateAccountRequest;
import com.cybernet.internet_cafe_management.dto.request.UpdateAccountRequest;
import com.cybernet.internet_cafe_management.dto.response.AccountResponse;
import com.cybernet.internet_cafe_management.dto.response.PageResponse;
import com.cybernet.internet_cafe_management.entity.Account;
import com.cybernet.internet_cafe_management.exception.ResourceNotFoundException;
import com.cybernet.internet_cafe_management.repository.AccountRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class AccountService {

    private final AccountRepository accountRepository;
    private final PasswordEncoder passwordEncoder;

    // Dependency Injection qua Constructor (chuẩn của Spring Boot)
    public AccountService(AccountRepository accountRepository,
                          PasswordEncoder passwordEncoder) {
        this.accountRepository = accountRepository;
        this.passwordEncoder = passwordEncoder;
    }

    // 1. Tạo tài khoản mới
    public AccountResponse createAccount(CreateAccountRequest request) {
        if (accountRepository.existsByPhone(request.getPhone())) {
            throw new IllegalArgumentException("Số điện thoại này đã được đăng ký!");
        }

        Account account = new Account();
        account.setPhone(request.getPhone());
        account.setName(request.getName());
        // Mã hoá mật khẩu bằng BCrypt trước khi lưu vào database
        account.setPasswordHash(passwordEncoder.encode(request.getPassword()));
        if (request.getRole() != null) {
            account.setRole(request.getRole());
        }

        Account saved = accountRepository.save(account);
        return AccountResponse.fromEntity(saved);
    }

    // 2. Lấy danh sách tất cả tài khoản (dùng Stream API chuyển Entity -> DTO)
    public List<AccountResponse> getAllAccounts() {
        return accountRepository.findAll()
                .stream()
                .map(AccountResponse::fromEntity)
                .toList();
    }

    // 2b. Lấy danh sách tài khoản có phân trang & sắp xếp (hỗ trợ lọc theo Role)
    public PageResponse<AccountResponse> getAllAccounts(Account.Role role, Pageable pageable) {
        Page<Account> page = (role != null)
                ? accountRepository.findByRole(role, pageable)
                : accountRepository.findAll(pageable);
        return PageResponse.fromPage(page, AccountResponse::fromEntity);
    }

    // 3. Lấy chi tiết 1 tài khoản theo ID
    public AccountResponse getAccountById(Long id) {
        Account account = accountRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy Account với id = " + id));
        return AccountResponse.fromEntity(account);
    }

    // 4. Xóa tài khoản theo ID
    public void deleteAccount(Long id) {
        if (!accountRepository.existsById(id)) {
            throw new ResourceNotFoundException("Không tìm thấy Account với id = " + id);
        }
        accountRepository.deleteById(id);
    }

    // 5. Cập nhật thông tin tài khoản
    public AccountResponse updateAccount(Long id, UpdateAccountRequest request) {
        Account account = accountRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy Account với id = " + id));

        account.setName(request.getName().trim());
        if (request.getRole() != null) {
            account.setRole(request.getRole());
        }
        if (request.getPassword() != null && !request.getPassword().isBlank()) {
            account.setPasswordHash(passwordEncoder.encode(request.getPassword().trim()));
        }

        Account saved = accountRepository.save(account);
        return AccountResponse.fromEntity(saved);
    }
}
