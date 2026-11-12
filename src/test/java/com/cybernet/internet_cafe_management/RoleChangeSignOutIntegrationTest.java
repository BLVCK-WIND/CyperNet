package com.cybernet.internet_cafe_management;

import com.cybernet.internet_cafe_management.entity.Account;
import com.cybernet.internet_cafe_management.entity.RefreshToken;
import com.cybernet.internet_cafe_management.repository.AccountRepository;
import com.cybernet.internet_cafe_management.repository.RefreshTokenRepository;
import com.jayway.jsonpath.JsonPath;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.ResultActions;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import org.springframework.web.context.WebApplicationContext;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.Executors;
import java.util.concurrent.TimeUnit;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotEquals;
import static org.springframework.security.test.web.servlet.setup.SecurityMockMvcConfigurers.springSecurity;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest(properties = "rate-limiting.enabled=false")
class RoleChangeSignOutIntegrationTest {
    private static final String ADMIN_PHONE = "0999800100";
    private static final String PASSWORD = "demo-role-change-742";

    @Autowired WebApplicationContext context;
    @Autowired AccountRepository accounts;
    @Autowired RefreshTokenRepository refreshTokens;
    @Autowired PasswordEncoder passwordEncoder;

    private MockMvc mvc;
    private Tokens administrator;

    @BeforeEach
    void setUp() throws Exception {
        mvc = MockMvcBuilders.webAppContextSetup(context).apply(springSecurity()).build();
        if (!accounts.existsByPhone(ADMIN_PHONE)) {
            createAccount(ADMIN_PHONE, Account.Role.ADMIN);
        }
        administrator = login(ADMIN_PHONE, Account.Role.ADMIN);
    }

    @Test
    void promotingStaffSignsOutBothDevices() throws Exception {
        assertRoleChangeSignsOutBothDevices("0999800101", Account.Role.STAFF, Account.Role.ADMIN);
    }

    @Test
    void demotingAdminSignsOutBothDevices() throws Exception {
        assertRoleChangeSignsOutBothDevices("0999800102", Account.Role.ADMIN, Account.Role.STAFF);
    }

    @Test
    void restoringTheOriginalRoleKeepsEarlierSignInsRevoked() throws Exception {
        Account account = createAccount("0999800104", Account.Role.STAFF);
        Tokens originalSignIn = login(account.getPhone(), Account.Role.STAFF);
        update(account.getId(), account.getName(), Account.Role.ADMIN);
        Tokens interimSignIn = login(account.getPhone(), Account.Role.ADMIN);
        update(account.getId(), account.getName(), Account.Role.STAFF);

        assertSignedOut(originalSignIn);
        assertSignedOut(interimSignIn);
        currentAccount(login(account.getPhone(), Account.Role.STAFF))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.role").value("STAFF"));
    }

    @Test
    void nameOnlyEditKeepsExistingAccessAndRefreshTokensUsable() throws Exception {
        Account staff = createAccount("0999800103", Account.Role.STAFF);
        Tokens signedIn = login(staff.getPhone(), Account.Role.STAFF);

        update(staff.getId(), "Renamed staff", Account.Role.STAFF);

        currentAccount(signedIn)
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.name").value("Renamed staff"))
                .andExpect(jsonPath("$.role").value("STAFF"));
        refresh(signedIn.refreshToken())
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.accessToken").isNotEmpty())
                .andExpect(jsonPath("$.account.name").value("Renamed staff"));
    }

    @Test
    void legacyRefreshWithoutRoleBindingIsRejected() throws Exception {
        Account account = createAccount("0999800105", Account.Role.STAFF);
        RefreshToken legacy = new RefreshToken();
        legacy.setToken(UUID.randomUUID().toString());
        legacy.setAccount(account);
        legacy.setExpiresAt(LocalDateTime.now().plusHours(1));
        refreshTokens.save(legacy);

        refresh(legacy.getToken())
                .andExpect(status().is4xxClientError())
                .andExpect(jsonPath("$.errorCode").value("REFRESH_TOKEN_INVALID"))
                .andExpect(jsonPath("$.accessToken").doesNotExist());
    }

    @Test
    void refreshConcurrentWithRoleChangeCannotSurviveTheChange() throws Exception {
        Account staff = createAccount("0999800106", Account.Role.STAFF);
        Tokens signedIn = login(staff.getPhone(), Account.Role.STAFF);
        var pool = Executors.newFixedThreadPool(2);
        var start = new CountDownLatch(1);
        try {
            var refreshResult = pool.submit(() -> {
                start.await();
                return refresh(signedIn.refreshToken()).andReturn().getResponse();
            });
            var roleUpdate = pool.submit(() -> {
                start.await();
                update(staff.getId(), staff.getName(), Account.Role.ADMIN);
                return null;
            });
            start.countDown();
            roleUpdate.get(10, TimeUnit.SECONDS);
            var result = refreshResult.get(10, TimeUnit.SECONDS);

            currentAccount(signedIn)
                    .andExpect(status().isUnauthorized())
                    .andExpect(jsonPath("$.errorCode").value("AUTH_ROLE_CHANGED"));
            String body = result.getContentAsString();
            if (result.getStatus() == 200) {
                assertEquals("STAFF", JsonPath.read(body, "$.account.role"));
                assertSignedOut(new Tokens(JsonPath.read(body, "$.accessToken"), JsonPath.read(body, "$.refreshToken")));
            } else {
                assertEquals(401, result.getStatus());
                assertEquals("AUTH_ROLE_CHANGED", JsonPath.read(body, "$.errorCode"));
            }
        } finally {
            pool.shutdownNow();
        }
    }

    private void assertRoleChangeSignsOutBothDevices(String phone, Account.Role originalRole, Account.Role newRole)
            throws Exception {
        Account account = createAccount(phone, originalRole);
        Tokens firstDevice = login(phone, originalRole);
        Tokens secondDevice = login(phone, originalRole);
        assertNotEquals(firstDevice.refreshToken(), secondDevice.refreshToken());
        for (Tokens device : List.of(firstDevice, secondDevice)) {
            currentAccount(device)
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.role").value(originalRole.name()));
        }

        update(account.getId(), account.getName(), newRole);

        for (Tokens device : List.of(firstDevice, secondDevice)) {
            assertSignedOut(device);
        }
        Tokens fresh = login(phone, newRole);
        currentAccount(fresh)
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.role").value(newRole.name()));
    }

    private void assertSignedOut(Tokens tokens) throws Exception {
        currentAccount(tokens)
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.errorCode").value("AUTH_ROLE_CHANGED"));
        refresh(tokens.refreshToken())
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.errorCode").value("AUTH_ROLE_CHANGED"))
                .andExpect(jsonPath("$.accessToken").doesNotExist())
                .andExpect(jsonPath("$.refreshToken").doesNotExist());
    }

    private Account createAccount(String phone, Account.Role role) {
        Account account = new Account();
        account.setPhone(phone);
        account.setName("Role change fixture");
        account.setPasswordHash(passwordEncoder.encode(PASSWORD));
        account.setRole(role);
        return accounts.save(account);
    }

    private Tokens login(String phone, Account.Role expectedRole) throws Exception {
        String body = """
                {"phone":"%s","password":"%s"}
                """.formatted(phone, PASSWORD);
        String response = mvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON).content(body))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.account.role").value(expectedRole.name()))
                .andExpect(jsonPath("$.accessToken").isNotEmpty())
                .andExpect(jsonPath("$.refreshToken").isNotEmpty())
                .andReturn().getResponse().getContentAsString();
        return new Tokens(JsonPath.read(response, "$.accessToken"), JsonPath.read(response, "$.refreshToken"));
    }

    private void update(Long id, String name, Account.Role role) throws Exception {
        String body = """
                {"name":"%s","role":"%s"}
                """.formatted(name, role.name());
        mvc.perform(put("/api/accounts/{id}", id)
                        .header("Authorization", "Bearer " + administrator.accessToken())
                        .contentType(MediaType.APPLICATION_JSON).content(body))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.role").value(role.name()));
    }

    private ResultActions currentAccount(Tokens tokens) throws Exception {
        return mvc.perform(get("/api/accounts/me").header("Authorization", "Bearer " + tokens.accessToken()));
    }

    private ResultActions refresh(String refreshToken) throws Exception {
        String body = """
                {"refreshToken":"%s"}
                """.formatted(refreshToken);
        return mvc.perform(post("/api/auth/refresh").contentType(MediaType.APPLICATION_JSON).content(body));
    }

    private record Tokens(String accessToken, String refreshToken) {}
}
