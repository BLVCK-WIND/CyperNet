package com.cybernet.internet_cafe_management.security;

import com.cybernet.internet_cafe_management.entity.Account;
import com.cybernet.internet_cafe_management.repository.AccountRepository;
import org.springframework.security.core.userdetails.User;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;

/**
 * Custom UserDetailsService — nạp thông tin user từ DB cho Spring Security.
 * Dùng phone làm username (vì hệ thống CyberNet đăng nhập bằng SĐT).
 */
@Service
public class CustomUserDetailsService implements UserDetailsService {

    private final AccountRepository accountRepository;

    public CustomUserDetailsService(AccountRepository accountRepository) {
        this.accountRepository = accountRepository;
    }

    @Override
    public UserDetails loadUserByUsername(String phone) throws UsernameNotFoundException {
        Account account = accountRepository.findByPhone(phone)
                .orElseThrow(() -> new UsernameNotFoundException(
                        "Không tìm thấy tài khoản với SĐT: " + phone));

        // Spring Security dùng prefix ROLE_ nội bộ
        // Khi kiểm tra hasRole('ADMIN') → Security tự thêm ROLE_ → so khớp với ROLE_ADMIN
        return User.builder()
                .username(account.getPhone())
                .password(account.getPasswordHash())
                .authorities("ROLE_" + account.getRole().name())
                .build();
    }
}
