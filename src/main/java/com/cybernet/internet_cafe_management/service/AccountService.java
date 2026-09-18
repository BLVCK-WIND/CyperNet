package com.cybernet.internet_cafe_management.service;

import com.cybernet.internet_cafe_management.dto.request.CreateAccountRequest;
import com.cybernet.internet_cafe_management.dto.response.AccountResponse;
import com.cybernet.internet_cafe_management.entity.Account;
import com.cybernet.internet_cafe_management.exception.ResourceNotFoundException;
import com.cybernet.internet_cafe_management.repository.AccountRepository;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class AccountService {

    private final AccountRepository accountRepository;

    // Dependency Injection qua Constructor (chuẩn của Spring Boot)
    public AccountService(AccountRepository accountRepository) {
        this.accountRepository = accountRepository;
    }

    // 1. Tạo tài khoản mới
    public AccountResponse createAccount(CreateAccountRequest request) {
        if (accountRepository.existsByPhone(request.getPhone())) {
            throw new IllegalArgumentException("Số điện thoại này đã được đăng ký!");
        }

        Account account = new Account();
        account.setPhone(request.getPhone());
        account.setName(request.getName());
        // Tạm thời gán chuỗi hash thô (ở Phase bảo mật chúng ta sẽ tích hợp BCryptPasswordEncoder)
        account.setPasswordHash("hashed_" + request.getPassword());
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
}
