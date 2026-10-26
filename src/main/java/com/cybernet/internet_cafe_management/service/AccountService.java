package com.cybernet.internet_cafe_management.service;

import com.cybernet.internet_cafe_management.dto.request.CreateAccountRequest;
import com.cybernet.internet_cafe_management.dto.request.RegisterCustomerWithDepositRequest;
import com.cybernet.internet_cafe_management.dto.request.UpdateAccountRequest;
import com.cybernet.internet_cafe_management.dto.response.AccountResponse;
import com.cybernet.internet_cafe_management.dto.response.PageResponse;
import com.cybernet.internet_cafe_management.dto.response.RegisterCustomerResponse;
import com.cybernet.internet_cafe_management.dto.response.TimePurchaseResponse;
import com.cybernet.internet_cafe_management.entity.Account;
import com.cybernet.internet_cafe_management.entity.TimePurchase;
import com.cybernet.internet_cafe_management.exception.ResourceNotFoundException;
import com.cybernet.internet_cafe_management.repository.AccountRepository;
import com.cybernet.internet_cafe_management.repository.TimePurchaseRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.text.DecimalFormat;
import java.time.LocalDateTime;
import java.util.List;

@Service
public class AccountService {

    private final AccountRepository accountRepository;
    private final PasswordEncoder passwordEncoder;
    private final TimePurchaseRepository timePurchaseRepository;
    private final AuditLogService auditLogService;

    // Dependency Injection qua Constructor (chuẩn của Spring Boot)
    public AccountService(AccountRepository accountRepository,
                          PasswordEncoder passwordEncoder,
                          TimePurchaseRepository timePurchaseRepository,
                          AuditLogService auditLogService) {
        this.accountRepository = accountRepository;
        this.passwordEncoder = passwordEncoder;
        this.timePurchaseRepository = timePurchaseRepository;
        this.auditLogService = auditLogService;
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

    /**
     * 1b. Đăng ký tài khoản hội viên mới trực tiếp tại quầy POS kèm nạp tiền ban đầu.
     * Quy tắc nghiệp vụ bắt buộc:
     * - Khách phải nạp tối thiểu 10.000 VNĐ.
     * - Tự động quy đổi sang số phút chuẩn cơ sở (@ 10.000đ = 60 phút).
     * - Tạo ngay giao dịch nạp giờ CONFIRMED gắn với nhân viên trực ca (staffId).
     * - Ghi vết kiểm toán (AuditLog) để quản lý gian lận và đối soát camera.
     */
    @Transactional
    public RegisterCustomerResponse registerCustomerWithDeposit(RegisterCustomerWithDepositRequest request, Long staffId) {
        String cleanPhone = request.getPhone().trim();
        if (accountRepository.existsByPhone(cleanPhone)) {
            throw new IllegalArgumentException("Số điện thoại này đã được đăng ký trong hệ thống!");
        }

        // 1. Phân giải mật khẩu: Nếu không nhập hoặc rỗng, mặc định lấy 4 số cuối của SĐT
        String rawPassword;
        if (request.getPassword() != null && !request.getPassword().trim().isEmpty()) {
            rawPassword = request.getPassword().trim();
        } else {
            rawPassword = cleanPhone.substring(cleanPhone.length() - 4);
        }

        // 2. Tính số phút chuẩn Standard cơ sở (10.000đ = 60 phút)
        int minutes = request.getInitialDeposit()
                .multiply(BigDecimal.valueOf(60))
                .divide(BigDecimal.valueOf(10000), 0, RoundingMode.FLOOR)
                .intValue();

        // 3. Tạo tài khoản hội viên mới (Cố định vai trò CUSTOMER, không cho phép gán vai trò khác)
        Account account = new Account();
        account.setPhone(cleanPhone);
        account.setName(request.getName().trim());
        account.setPasswordHash(passwordEncoder.encode(rawPassword));
        account.setRole(Account.Role.CUSTOMER);
        account.setRemainingMinutes(minutes);
        Account savedAccount = accountRepository.save(account);

        // 4. Tìm nhân viên thực hiện thu tiền & đăng ký
        Account staff = accountRepository.findById(staffId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy thông tin nhân viên với ID = " + staffId));

        // 5. Tạo bản ghi giao dịch nạp tiền lần đầu (CONFIRMED)
        TimePurchase timePurchase = new TimePurchase();
        timePurchase.setAccount(savedAccount);
        timePurchase.setMinutes(minutes);
        timePurchase.setAmount(request.getInitialDeposit());
        timePurchase.setPaymentMethod(request.getPaymentMethod());
        timePurchase.setStatus(TimePurchase.Status.CONFIRMED);
        timePurchase.setConfirmedByStaff(staff);
        timePurchase.setConfirmedAt(LocalDateTime.now());
        TimePurchase savedPurchase = timePurchaseRepository.save(timePurchase);

        // 6. Ghi vết kiểm toán (Audit Trail)
        auditLogService.log(
                "REGISTER_CUSTOMER_WITH_DEPOSIT",
                "Account",
                savedAccount.getId(),
                String.format("Đăng ký hội viên mới SĐT=%s, nạp đầu=%sđ (%dp) bởi staff=%s (ID=%d)",
                        cleanPhone, request.getInitialDeposit(), minutes, staff.getName(), staff.getId())
        );

        return RegisterCustomerResponse.builder()
                .account(AccountResponse.fromEntity(savedAccount))
                .initialPurchase(TimePurchaseResponse.fromEntity(savedPurchase))
                .initialPassword(rawPassword)
                .message(String.format("Đăng ký hội viên thành công! Đã nạp %s VNĐ (%d phút) cho khách %s",
                        new DecimalFormat("#,###").format(request.getInitialDeposit()),
                        minutes,
                        savedAccount.getName()))
                .build();
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
