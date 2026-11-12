package com.cybernet.internet_cafe_management;

import com.cybernet.internet_cafe_management.service.AuthService;
import com.cybernet.internet_cafe_management.repository.*;
import com.cybernet.internet_cafe_management.entity.*;
import com.cybernet.internet_cafe_management.security.JwtService;
import com.cybernet.internet_cafe_management.dto.request.CustomerSessionLoginRequest;
import com.cybernet.internet_cafe_management.exception.ResourceNotFoundException;
import org.junit.jupiter.api.Test;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.crypto.password.PasswordEncoder;
import java.util.Optional;
import static org.mockito.Mockito.*;
import static org.junit.jupiter.api.Assertions.*;

class MobileCustomerAccessTest {
    @Test void customerAtIdleComputerGetsOrderingAccessWithoutStartingPlay() {
        AccountRepository accounts = mock(AccountRepository.class);
        RefreshTokenRepository tokens = mock(RefreshTokenRepository.class);
        ComputerRepository computers = mock(ComputerRepository.class);
        SessionRepository sessions = mock(SessionRepository.class);
        JwtService jwt = mock(JwtService.class);
        PasswordEncoder encoder = mock(PasswordEncoder.class);
        AuthService service = new AuthService(accounts, tokens, sessions, computers, encoder, jwt);
        Account account = new Account(); account.setId(5L); account.setRole(Account.Role.CUSTOMER);
        account.setRemainingMinutes(120);
        Computer computer = new Computer(); computer.setCode("PC-01");
        when(computers.findByCode("PC-01")).thenReturn(Optional.of(computer));
        when(accounts.findByPhone("0901111111")).thenReturn(Optional.of(account));
        when(jwt.generateAccessToken(account)).thenReturn("customer-token");
        CustomerSessionLoginRequest request = new CustomerSessionLoginRequest();
        request.setComputerCode("PC-01"); request.setPhone("0901111111");
        var response = service.customerSessionLogin(request);
        assertNull(response.getSession());
        assertEquals("customer-token", response.getAccessToken());
        assertEquals(120, account.getRemainingMinutes());
        verify(tokens).save(any());
        verify(sessions, never()).save(any());
        verify(accounts, never()).save(any());
        verifyNoInteractions(encoder);
    }

    @Test void privilegedAndUnknownPhonesCannotObtainTokens() {
        for (Account.Role role : Account.Role.values()) {
            if (role == Account.Role.CUSTOMER) continue;
            AccountRepository accounts = mock(AccountRepository.class);
            RefreshTokenRepository tokens = mock(RefreshTokenRepository.class);
            ComputerRepository computers = mock(ComputerRepository.class);
            SessionRepository sessions = mock(SessionRepository.class);
            JwtService jwt = mock(JwtService.class);
            AuthService service = new AuthService(accounts, tokens, sessions, computers,
                    mock(PasswordEncoder.class), jwt);
            CustomerSessionLoginRequest request = new CustomerSessionLoginRequest();
            request.setComputerCode("PC-01");
            request.setPhone("0901111111");
            when(computers.findByCode("PC-01")).thenReturn(Optional.of(new Computer()));
            Account account = new Account();
            account.setRole(role);
            when(accounts.findByPhone(request.getPhone())).thenReturn(Optional.of(account));
            assertThrows(AccessDeniedException.class, () -> service.customerSessionLogin(request));
            when(accounts.findByPhone(request.getPhone())).thenReturn(Optional.empty());
            assertThrows(ResourceNotFoundException.class, () -> service.customerSessionLogin(request));
            verifyNoInteractions(jwt, tokens);
            verify(accounts, never()).save(any());
        }
    }
}
