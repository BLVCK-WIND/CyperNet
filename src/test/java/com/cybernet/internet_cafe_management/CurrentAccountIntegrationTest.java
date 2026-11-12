package com.cybernet.internet_cafe_management;
import com.cybernet.internet_cafe_management.entity.Account;
import com.cybernet.internet_cafe_management.repository.AccountRepository;
import com.cybernet.internet_cafe_management.security.JwtService;
import org.junit.jupiter.api.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import org.springframework.web.context.WebApplicationContext;
import static org.springframework.security.test.web.servlet.setup.SecurityMockMvcConfigurers.springSecurity;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;
@SpringBootTest
class CurrentAccountIntegrationTest {
    @Autowired WebApplicationContext context;
    @Autowired AccountRepository accounts;
    @Autowired JwtService jwt;
    MockMvc mvc; Account customer;
    @BeforeEach void setup() {
        mvc = MockMvcBuilders.webAppContextSetup(context).apply(springSecurity()).build();
        customer = accounts.findByPhone("0999000088").orElseGet(() -> {
            Account account = new Account(); account.setPhone("0999000088"); account.setName("Self account fixture");
            account.setPasswordHash("not exposed"); account.setRemainingMinutes(120); return accounts.save(account);
        });
    }
    @Test void returnsOnlyTheCallerAndNoPasswordEvenWhenAnotherIdIsSupplied() throws Exception {
        mvc.perform(get("/api/accounts/me").param("accountId", "1").header("Authorization", "Bearer " + jwt.generateAccessToken(customer)))
                .andExpect(status().isOk()).andExpect(jsonPath("$.id").value(customer.getId()))
                .andExpect(jsonPath("$.phone").value(customer.getPhone()))
                .andExpect(jsonPath("$.passwordHash").doesNotExist());
        mvc.perform(get("/api/accounts/1").header("Authorization", "Bearer " + jwt.generateAccessToken(customer)))
                .andExpect(status().isForbidden());
    }
    @Test void returnsTheCurrentBalanceAfterCredit() throws Exception {
        customer.setRemainingMinutes(240); accounts.save(customer);
        mvc.perform(get("/api/accounts/me").header("Authorization", "Bearer " + jwt.generateAccessToken(customer)))
                .andExpect(status().isOk()).andExpect(jsonPath("$.remainingMinutes").value(240));
    }
    @Test void rejectsUnauthenticatedReads() throws Exception {
        mvc.perform(get("/api/accounts/me")).andExpect(status().isUnauthorized());
    }
}
