package com.cybernet.internet_cafe_management;

import com.cybernet.internet_cafe_management.entity.Account;
import com.cybernet.internet_cafe_management.entity.Item;
import com.cybernet.internet_cafe_management.repository.*;
import com.cybernet.internet_cafe_management.security.JwtService;
import org.junit.jupiter.api.BeforeAll;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.TestInstance;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.support.GeneratedKeyHolder;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.context.WebApplicationContext;
import java.sql.Statement;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.util.ArrayList;
import java.util.List;
import static org.springframework.security.test.web.servlet.setup.SecurityMockMvcConfigurers.springSecurity;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@TestInstance(TestInstance.Lifecycle.PER_CLASS)
@Transactional
class OrderSummaryIntegrationTest {
    @Autowired WebApplicationContext context;
    @Autowired AccountRepository accounts;
    @Autowired ComputerRepository computers;
    @Autowired ItemRepository items;
    @Autowired JwtService jwt;
    @Autowired JdbcTemplate jdbc;
    MockMvc mvc;
    Account staff, admin, customer;
    Item food, drink, playtime, service;
    Long pc;
    LocalDate today;
    List<Long> pending = new ArrayList<>();

    @BeforeAll void fixtures() {
        mvc = MockMvcBuilders.webAppContextSetup(context).apply(springSecurity()).build();
        staff = account("0999400001", Account.Role.STAFF);
        admin = account("0999400002", Account.Role.ADMIN);
        customer = account("0888600001", Account.Role.CUSTOMER);
        pc = computers.findByCode("PC-02").orElseThrow().getId();
        var catalog = items.findAll();
        food = catalog.stream().filter(i -> i.getType() == Item.Type.FOOD).findFirst().orElseThrow();
        drink = catalog.stream().filter(i -> i.getType() == Item.Type.DRINK).findFirst().orElseThrow();
        playtime = catalog.stream().filter(i -> i.getType() == Item.Type.PLAYTIME).findFirst().orElseThrow();
        service = new Item(); service.setName("Summary service"); service.setType(Item.Type.SERVICE);
        service.setPrice(new java.math.BigDecimal("40000")); service = items.save(service);
        today = LocalDate.now(ZoneId.of("Asia/Ho_Chi_Minh"));
        var old = today.minusDays(1).atTime(12, 0);
        for (int i = 0; i < 125; i++) {
            long id = order(i % 2 == 0 ? "PENDING_PAYMENT" : "WAITING_CONFIRMATION", i < 25 ? old : today.atTime(1, 0), null, 43000);
            line(id, food, 25000); line(id, playtime, 18000); pending.add(id);
        }
        for (int i = 0; i < 125; i++) {
            long id = order("CONFIRMED", old, today.atTime(12, 0), 43000);
            line(id, food, 25000); line(id, playtime, 18000);
        }
        long mixed = order("CONFIRMED", today.atTime(2, 0), today.atTime(3, 0), 100000);
        line(mixed, food, 10000); line(mixed, drink, 20000); line(mixed, playtime, 30000); line(mixed, service, 40000);
        line(order("CONFIRMED", old, old, 25000), food, 25000);
        line(order("CONFIRMED", old, today.atStartOfDay(), 100), food, 100);
        line(order("CONFIRMED", old, today.atTime(23, 59, 59), 200), food, 200);
        line(order("CONFIRMED", old, today.plusDays(1).atStartOfDay(), 300), food, 300);
        order("CANCELLED", today.atStartOfDay(), null, 100);
        order("CANCELLED", today.atTime(23, 59, 59), null, 100);
        order("CANCELLED", today.plusDays(1).atStartOfDay(), null, 100);
    }

    Account account(String phone, Account.Role role) {
        Account a = new Account(); a.setPhone(phone); a.setName("Summary " + role); a.setRole(role);
        a.setPasswordHash("fixture only"); a.setRemainingMinutes(120); return accounts.save(a);
    }
    long order(String status, LocalDateTime created, LocalDateTime confirmed, int amount) {
        var key = new GeneratedKeyHolder();
        jdbc.update(connection -> {
            var ps = connection.prepareStatement("INSERT INTO orders (account_id,computer_id,status,payment_method,total_amount,created_at,confirmed_at) VALUES(?,?,?,'CASH',?,?,?)", Statement.RETURN_GENERATED_KEYS);
            ps.setLong(1, customer.getId()); ps.setLong(2, pc); ps.setString(3, status);
            ps.setInt(4, amount); ps.setObject(5, created); ps.setObject(6, confirmed); return ps;
        }, key);
        return java.util.Objects.requireNonNull(key.getKey()).longValue();
    }
    void line(long order, Item item, int subtotal) {
        jdbc.update("INSERT INTO order_items (order_id,item_id,quantity,unit_price,subtotal,item_name_snapshot,item_type_snapshot,package_minutes_snapshot) VALUES(?,?,1,?,?,?,?,?)",
                order, item.getId(), subtotal, subtotal, item.getName(), item.getType().name(), item.getType() == Item.Type.PLAYTIME ? 120 : 0);
    }
    String token(Account a) { return "Bearer " + jwt.generateAccessToken(a); }

    @Test void summaryAggregatesAll258OrdersAndCountsEachOrderOnce() throws Exception {
        mvc.perform(get("/api/orders/summary").header("Authorization", token(staff)))
                .andExpect(status().isOk()).andExpect(jsonPath("$.date").value(today.toString()))
                .andExpect(jsonPath("$.timezone").value("Asia/Ho_Chi_Minh"))
                .andExpect(jsonPath("$.countsByStatus.PENDING_PAYMENT").value(63))
                .andExpect(jsonPath("$.countsByStatus.WAITING_CONFIRMATION").value(62))
                .andExpect(jsonPath("$.countsByStatus.CONFIRMED").value(130))
                .andExpect(jsonPath("$.countsByStatus.CANCELLED").value(3))
                .andExpect(jsonPath("$.pendingCount").value(125))
                .andExpect(jsonPath("$.pendingAmount").value(5375000))
                .andExpect(jsonPath("$.backlogCount").value(25))
                .andExpect(jsonPath("$.backlogAmount").value(1075000));
    }

    @Test void dailyMetricsUseCreatedAndConfirmedClocksAndExcludeNextMidnight() throws Exception {
        mvc.perform(get("/api/orders/summary").header("Authorization", token(admin)))
                .andExpect(status().isOk()).andExpect(jsonPath("$.todayCreatedCount").value(103))
                .andExpect(jsonPath("$.todayConfirmedCount").value(128))
                .andExpect(jsonPath("$.todayFoodAndDrinkRevenue").value(3155300));
    }

    @Test void listFiltersAndPaginationCannotRestrictTheSummary() throws Exception {
        mvc.perform(get("/api/orders/summary").param("keyword", "absent").param("page", "999")
                        .param("status", "CANCELLED").param("paymentMethod", "QR").header("Authorization", token(staff)))
                .andExpect(status().isOk()).andExpect(jsonPath("$.pendingCount").value(125))
                .andExpect(jsonPath("$.todayFoodAndDrinkRevenue").value(3155300));
    }

    @Test void emptyDatabaseProducesRealZerosForEveryStatus() throws Exception {
        jdbc.update("DELETE FROM order_items"); jdbc.update("DELETE FROM orders");
        mvc.perform(get("/api/orders/summary").header("Authorization", token(staff)))
                .andExpect(status().isOk()).andExpect(jsonPath("$.pendingCount").value(0))
                .andExpect(jsonPath("$.pendingAmount").value(0)).andExpect(jsonPath("$.backlogCount").value(0))
                .andExpect(jsonPath("$.countsByStatus.CONFIRMED").value(0))
                .andExpect(jsonPath("$.countsByStatus.CANCELLED").value(0))
                .andExpect(jsonPath("$.todayCreatedCount").value(0))
                .andExpect(jsonPath("$.todayConfirmedCount").value(0))
                .andExpect(jsonPath("$.todayFoodAndDrinkRevenue").value(0));
    }

    @Test void confirmingBacklogUpdatesPendingAndTodaysRevenue() throws Exception {
        mvc.perform(patch("/api/orders/{id}/confirm", pending.get(0)).header("Authorization", token(staff)))
                .andExpect(status().isOk());
        mvc.perform(get("/api/orders/summary").header("Authorization", token(staff)))
                .andExpect(status().isOk()).andExpect(jsonPath("$.pendingCount").value(124))
                .andExpect(jsonPath("$.backlogCount").value(24))
                .andExpect(jsonPath("$.todayConfirmedCount").value(129))
                .andExpect(jsonPath("$.todayFoodAndDrinkRevenue").value(3180300));
    }

    @Test void cancellingBacklogDoesNotAddRevenue() throws Exception {
        mvc.perform(patch("/api/orders/{id}/cancel", pending.get(1)).header("Authorization", token(staff)))
                .andExpect(status().isOk());
        mvc.perform(get("/api/orders/summary").header("Authorization", token(staff)))
                .andExpect(status().isOk()).andExpect(jsonPath("$.pendingCount").value(124))
                .andExpect(jsonPath("$.backlogCount").value(24))
                .andExpect(jsonPath("$.countsByStatus.CANCELLED").value(4))
                .andExpect(jsonPath("$.todayFoodAndDrinkRevenue").value(3155300));
    }

    @Test void operationalAccessDoesNotGrantStaffFinancialReportAccess() throws Exception {
        mvc.perform(get("/api/orders/summary")).andExpect(status().isUnauthorized());
        mvc.perform(get("/api/orders/summary").header("Authorization", token(customer))).andExpect(status().isForbidden());
        mvc.perform(get("/api/reports/revenue/summary").header("Authorization", token(staff))).andExpect(status().isForbidden());
    }
}
