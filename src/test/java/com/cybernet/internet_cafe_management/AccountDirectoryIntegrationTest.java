package com.cybernet.internet_cafe_management;

import com.cybernet.internet_cafe_management.entity.Account;
import com.cybernet.internet_cafe_management.repository.AccountRepository;
import com.cybernet.internet_cafe_management.security.JwtService;
import org.junit.jupiter.api.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.context.WebApplicationContext;
import java.util.ArrayList;
import static org.hamcrest.Matchers.*;
import static org.springframework.security.test.web.servlet.setup.SecurityMockMvcConfigurers.springSecurity;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@TestInstance(TestInstance.Lifecycle.PER_CLASS)
@Transactional
class AccountDirectoryIntegrationTest {
    @Autowired WebApplicationContext context;
    @Autowired AccountRepository accounts;
    @Autowired JwtService jwt;
    MockMvc mvc;
    Account admin, staff, target;

    @BeforeAll void fixture() {
        mvc = MockMvcBuilders.webAppContextSetup(context).apply(springSecurity()).build();
        admin = create("0999200001", "Directory admin", Account.Role.ADMIN, 999999);
        staff = create("0999200002", "Directory staff", Account.Role.STAFF, 999999);
        var customers = new ArrayList<Account>();
        for (int i = 1; i <= 125; i++) {
            Account a = new Account();
            a.setPhone(String.format("0888800%03d", i));
            a.setName(i == 125 ? "Nguyễn Đặng Khách Xa" : i == 124 ? "Khách 100%_VIP!" : "Hội viên thử " + i);
            a.setRole(Account.Role.CUSTOMER); a.setRemainingMinutes(i); a.setPasswordHash("fixture only");
            customers.add(a);
        }
        target = accounts.saveAll(customers).get(124);
    }

    Account create(String phone, String name, Account.Role role, int minutes) {
        Account a = new Account(); a.setPhone(phone); a.setName(name); a.setRole(role);
        a.setRemainingMinutes(minutes); a.setPasswordHash("fixture only"); return accounts.save(a);
    }
    String token(Account a) { return "Bearer " + jwt.generateAccessToken(a); }

    @Test void paginationCountsAll125CustomersAndReachesTheLastPage() throws Exception {
        mvc.perform(get("/api/accounts").param("size", "100").param("sort", "id,asc").header("Authorization", token(staff)))
                .andExpect(status().isOk()).andExpect(jsonPath("$.totalElements").value(125))
                .andExpect(jsonPath("$.content.length()").value(100)).andExpect(jsonPath("$.hasNext").value(true));
        mvc.perform(get("/api/accounts").param("size", "100").param("page", "1").param("sort", "id,asc").header("Authorization", token(staff)))
                .andExpect(status().isOk()).andExpect(jsonPath("$.content.length()").value(25))
                .andExpect(jsonPath("$.content[24].id").value(target.getId())).andExpect(jsonPath("$.last").value(true));
    }

    @Test void unaccentedUppercaseNameAndPartialPhoneFindACustomerOutsideFirst100() throws Exception {
        for (String keyword : new String[]{"nGUYEN", "dang", "  0888800125  "}) {
            mvc.perform(get("/api/accounts").param("keyword", keyword).param("size", "10").header("Authorization", token(staff)))
                    .andExpect(status().isOk()).andExpect(jsonPath("$.totalElements").value(1))
                    .andExpect(jsonPath("$.content[0].id").value(target.getId()));
        }
    }

    @Test void hashIdIsExactAndBareDigitsAreNotAnIdSelector() throws Exception {
        mvc.perform(get("/api/accounts").param("keyword", "#" + target.getId()).header("Authorization", token(staff)))
                .andExpect(status().isOk()).andExpect(jsonPath("$.totalElements").value(1))
                .andExpect(jsonPath("$.content[0].id").value(target.getId()));
        mvc.perform(get("/api/accounts").param("keyword", "#" + Long.MAX_VALUE).header("Authorization", token(staff)))
                .andExpect(status().isOk()).andExpect(jsonPath("$.totalElements").value(0));
        // '1' is a phone/name substring and can match many accounts, not only ID 1.
        mvc.perform(get("/api/accounts").param("keyword", "1").header("Authorization", token(staff)))
                .andExpect(status().isOk()).andExpect(jsonPath("$.totalElements", greaterThan(1)));
    }

    @Test void literalWildcardsAndInvalidIdsDoNotExpandTheSearch() throws Exception {
        mvc.perform(get("/api/accounts").param("keyword", "%_").header("Authorization", token(staff)))
                .andExpect(status().isOk()).andExpect(jsonPath("$.totalElements").value(1))
                .andExpect(jsonPath("$.content[0].name").value("Khách 100%_VIP!"));
        for (String keyword : new String[]{"#abc", "#-1", "#99999999999999999999999999"}) {
            mvc.perform(get("/api/accounts").param("keyword", keyword).header("Authorization", token(staff)))
                    .andExpect(status().isOk()).andExpect(jsonPath("$.totalElements").value(0));
        }
    }

    @Test void searchNeverBypassesStaffVisibility() throws Exception {
        mvc.perform(get("/api/accounts").param("keyword", "#" + admin.getId()).header("Authorization", token(staff)))
                .andExpect(status().isOk()).andExpect(jsonPath("$.totalElements").value(0));
        mvc.perform(get("/api/accounts").param("keyword", "Directory").param("role", "ADMIN").header("Authorization", token(staff)))
                .andExpect(status().isForbidden());
        mvc.perform(get("/api/accounts").param("keyword", "Directory").param("role", "STAFF").header("Authorization", token(admin)))
                .andExpect(status().isOk()).andExpect(jsonPath("$.totalElements").value(1));
    }

    @Test void summaryUsesAllCustomersAndDoesNotIncludePrivilegedBalancesOrCountsForStaff() throws Exception {
        mvc.perform(get("/api/accounts/summary").param("keyword", "absent").param("page", "999").header("Authorization", token(staff)))
                .andExpect(status().isOk()).andExpect(jsonPath("$.totalAccounts").value(125))
                .andExpect(jsonPath("$.countsByRole.CUSTOMER").value(125))
                .andExpect(jsonPath("$.countsByRole.ADMIN").doesNotExist()).andExpect(jsonPath("$.countsByRole.STAFF").doesNotExist())
                .andExpect(jsonPath("$.totalRemainingMinutes").value(7875));
        mvc.perform(get("/api/accounts/summary").header("Authorization", token(admin)))
                .andExpect(status().isOk()).andExpect(jsonPath("$.totalAccounts").value(accounts.count()))
                .andExpect(jsonPath("$.countsByRole.ADMIN").value(accounts.countByRole(Account.Role.ADMIN)))
                .andExpect(jsonPath("$.totalRemainingMinutes").value(7875));
    }

    @Test void summaryReflectsNewMembersEditsAndCredits() throws Exception {
        Account fresh = create("0888899999", "Hội viên mới", Account.Role.CUSTOMER, 120);
        target.setRemainingMinutes(185); accounts.saveAndFlush(target);
        mvc.perform(get("/api/accounts/summary").header("Authorization", token(staff)))
                .andExpect(status().isOk()).andExpect(jsonPath("$.totalAccounts").value(126))
                .andExpect(jsonPath("$.totalRemainingMinutes").value(8055));
        mvc.perform(get("/api/accounts/{id}", fresh.getId()).header("Authorization", token(staff)))
                .andExpect(status().isOk()).andExpect(jsonPath("$.remainingMinutes").value(120));
    }

    @Test void customerAndAnonymousCannotReadDirectorySummary() throws Exception {
        mvc.perform(get("/api/accounts/summary")).andExpect(status().isUnauthorized());
        mvc.perform(get("/api/accounts/summary").header("Authorization", token(target))).andExpect(status().isForbidden());
    }
}
