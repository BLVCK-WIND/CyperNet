package com.cybernet.internet_cafe_management;

import com.cybernet.internet_cafe_management.entity.Account;
import com.cybernet.internet_cafe_management.repository.AccountRepository;
import com.cybernet.internet_cafe_management.security.JwtService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import org.springframework.web.context.WebApplicationContext;

import static org.hamcrest.Matchers.everyItem;
import static org.hamcrest.Matchers.is;
import static org.springframework.security.test.web.servlet.setup.SecurityMockMvcConfigurers.springSecurity;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
class AccountReadAccessIntegrationTest {
    @Autowired WebApplicationContext context;
    @Autowired AccountRepository accounts;
    @Autowired JwtService jwt;
    private MockMvc mvc;
    private Account staff;
    private Account colleague;
    private Account admin;
    private Account customer;

    @BeforeEach
    void setUp() {
        mvc = MockMvcBuilders.webAppContextSetup(context).apply(springSecurity()).build();
        staff = fixture("0999100001", Account.Role.STAFF);
        colleague = fixture("0999100002", Account.Role.STAFF);
        admin = fixture("0999100003", Account.Role.ADMIN);
        customer = fixture("0999100004", Account.Role.CUSTOMER);
    }

    private Account fixture(String phone, Account.Role role) {
        return accounts.findByPhone(phone).orElseGet(() -> {
            Account account = new Account();
            account.setPhone(phone);
            account.setName("Read access fixture " + role);
            account.setRole(role);
            account.setPasswordHash("must never be exposed");
            return accounts.save(account);
        });
    }

    private String token(Account account) {
        return "Bearer " + jwt.generateAccessToken(account);
    }

    @Test
    void staffDefaultListFiltersBeforePaginationAndCounting() throws Exception {
        mvc.perform(get("/api/accounts").param("size", "1").header("Authorization", token(staff)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content[*].role", everyItem(is("CUSTOMER"))))
                .andExpect(jsonPath("$.totalElements").value(accounts.countByRole(Account.Role.CUSTOMER)))
                .andExpect(jsonPath("$.content[0].passwordHash").doesNotExist());
    }

    @Test
    void staffCanExplicitlyFilterCustomers() throws Exception {
        mvc.perform(get("/api/accounts").param("role", "CUSTOMER").header("Authorization", token(staff)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content[*].role", everyItem(is("CUSTOMER"))));
    }

    @Test
    void staffCannotSelectEitherPrivilegedRole() throws Exception {
        for (String role : new String[]{"STAFF", "ADMIN"}) {
            mvc.perform(get("/api/accounts").param("role", role).header("Authorization", token(staff)))
                    .andExpect(status().isForbidden()).andExpect(jsonPath("$.errorCode").value("FORBIDDEN"))
                    .andExpect(jsonPath("$.content").doesNotExist());
        }
    }

    @Test
    void staffCanReadCustomerAndOwnProfileById() throws Exception {
        for (Account target : new Account[]{customer, staff}) {
            mvc.perform(get("/api/accounts/{id}", target.getId()).header("Authorization", token(staff)))
                    .andExpect(status().isOk()).andExpect(jsonPath("$.id").value(target.getId()))
                    .andExpect(jsonPath("$.passwordHash").doesNotExist());
        }
        mvc.perform(get("/api/accounts/me").param("accountId", admin.getId().toString())
                        .header("Authorization", token(staff)))
                .andExpect(status().isOk()).andExpect(jsonPath("$.id").value(staff.getId()));
    }

    @Test
    void staffCannotReadAdminOrColleagueById() throws Exception {
        for (Account target : new Account[]{admin, colleague}) {
            mvc.perform(get("/api/accounts/{id}", target.getId()).header("Authorization", token(staff)))
                    .andExpect(status().isForbidden()).andExpect(jsonPath("$.errorCode").value("FORBIDDEN"))
                    .andExpect(jsonPath("$.phone").doesNotExist());
        }
    }

    @Test
    void adminRetainsUnfilteredAndRoleFilteredLists() throws Exception {
        mvc.perform(get("/api/accounts").header("Authorization", token(admin)))
                .andExpect(status().isOk()).andExpect(jsonPath("$.totalElements").value(accounts.count()));
        for (Account.Role role : Account.Role.values()) {
            mvc.perform(get("/api/accounts").param("role", role.name()).header("Authorization", token(admin)))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.content[*].role", everyItem(is(role.name()))))
                    .andExpect(jsonPath("$.totalElements").value(accounts.countByRole(role)));
        }
    }

    @Test
    void adminRetainsAccessToEveryAccountRole() throws Exception {
        for (Account target : new Account[]{admin, staff, colleague, customer}) {
            mvc.perform(get("/api/accounts/{id}", target.getId()).header("Authorization", token(admin)))
                    .andExpect(status().isOk()).andExpect(jsonPath("$.id").value(target.getId()))
                    .andExpect(jsonPath("$.passwordHash").doesNotExist());
        }
    }

    @Test
    void customerAndAnonymousCannotUseManagementReads() throws Exception {
        for (String path : new String[]{"/api/accounts", "/api/accounts/" + staff.getId()}) {
            mvc.perform(get(path).header("Authorization", token(customer))).andExpect(status().isForbidden());
            mvc.perform(get(path)).andExpect(status().isUnauthorized());
        }
    }

    @Test
    void nonexistentAccountStillReturnsNotFound() throws Exception {
        mvc.perform(get("/api/accounts/{id}", Long.MAX_VALUE).header("Authorization", token(staff)))
                .andExpect(status().isNotFound()).andExpect(jsonPath("$.errorCode").value("NOT_FOUND"));
    }
}
