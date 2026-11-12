package com.cybernet.internet_cafe_management;

import com.cybernet.internet_cafe_management.entity.*;
import com.cybernet.internet_cafe_management.repository.*;
import com.cybernet.internet_cafe_management.security.JwtService;
import jakarta.persistence.EntityManager;
import org.hibernate.SessionEventListener;
import org.junit.jupiter.api.BeforeAll;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.TestInstance;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.context.WebApplicationContext;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.*;
import java.util.concurrent.atomic.AtomicInteger;
import static org.hamcrest.Matchers.*;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.springframework.security.test.web.servlet.setup.SecurityMockMvcConfigurers.springSecurity;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@TestInstance(TestInstance.Lifecycle.PER_CLASS)
@Transactional
class OrderQueueSearchIntegrationTest {
    @Autowired WebApplicationContext context;
    @Autowired AccountRepository accounts;
    @Autowired ComputerRepository computers;
    @Autowired SessionRepository sessions;
    @Autowired OrderRepository orders;
    @Autowired ItemRepository items;
    @Autowired JwtService jwt;
    @Autowired JdbcTemplate jdbc;
    @Autowired EntityManager entityManager;
    MockMvc mvc;
    Account admin, staff, customer, distantCustomer;
    Computer pc1, pc2;
    Session legacySession;
    List<Order> fixtures;

    @BeforeAll void setup() {
        mvc = MockMvcBuilders.webAppContextSetup(context).apply(springSecurity()).build();
        admin = account("0999300001", "Queue Admin", Account.Role.ADMIN);
        staff = account("0999300002", "Queue Staff", Account.Role.STAFF);
        customer = account("0888700001", "Queue Guest", Account.Role.CUSTOMER);
        distantCustomer = account("0888799999", "Nguyễn Đặng Khách Xa", Account.Role.CUSTOMER);
        pc1 = computers.findByCode("PC-01").orElseThrow();
        pc2 = computers.findByCode("PC-02").orElseThrow();
        legacySession = session(customer);
        Session distantSession = session(distantCustomer);
        var list = new ArrayList<Order>();
        for (int i = 1; i <= 120; i++) {
            Order o = order(i % 3 == 0 ? null : customer, i % 3 == 0 ? null : pc2);
            if (i % 3 == 0) o.setSession(i == 120 ? distantSession : legacySession);
            o.setStatus(switch (i % 4) {
                case 1 -> Order.Status.PENDING_PAYMENT;
                case 2 -> Order.Status.WAITING_CONFIRMATION;
                case 3 -> Order.Status.CONFIRMED;
                default -> Order.Status.CANCELLED;
            });
            o.setPaymentMethod(i % 2 == 0 ? Order.PaymentMethod.QR : Order.PaymentMethod.CASH);
            list.add(o);
        }
        fixtures = orders.saveAllAndFlush(list);
        // All timestamps tie, and pending orders predate today: exercise stable FIFO and backlog.
        jdbc.update("UPDATE orders SET created_at = ?", LocalDateTime.now().minusDays(1).withNano(0));
    }

    Account account(String phone, String name, Account.Role role) {
        Account a = new Account(); a.setPhone(phone); a.setName(name); a.setRole(role);
        a.setRemainingMinutes(120); a.setPasswordHash("fixture only"); return accounts.save(a);
    }
    Session session(Account customer) {
        Session s = new Session(); s.setComputer(pc1); s.setAccount(customer);
        s.setStartedAt(LocalDateTime.now().minusDays(2)); s.setExpiresAt(LocalDateTime.now().minusDays(1));
        s.setEndedAt(s.getExpiresAt()); s.setStatus(Session.Status.ENDED); return sessions.save(s);
    }
    Order order(Account customer, Computer computer) {
        Order o = new Order(); o.setAccount(customer); o.setComputer(computer);
        o.setPaymentMethod(Order.PaymentMethod.CASH); o.setTotalAmount(new BigDecimal("25000"));
        o.setOrderItems(new ArrayList<>()); return o;
    }
    String token(Account a) { return "Bearer " + jwt.generateAccessToken(a); }

    @Test void paginationReachesAll120OrdersAndBreaksTimestampTiesById() throws Exception {
        for (int page = 0; page < 6; page++) {
            var expected = fixtures.subList(page * 20, page * 20 + 20).stream().map(o -> o.getId().intValue()).toArray();
            mvc.perform(get("/api/orders/search").param("page", "" + page).param("size", "20")
                            .param("sort", "createdAt,asc").header("Authorization", token(staff)))
                    .andExpect(status().isOk()).andExpect(jsonPath("$.totalElements").value(120))
                    .andExpect(jsonPath("$.content[*].id", contains(expected)));
        }
        mvc.perform(get("/api/orders/search").param("size", "20").header("Authorization", token(admin)))
                .andExpect(status().isOk()).andExpect(jsonPath("$.content[0].id").value(fixtures.get(119).getId()));
    }

    @Test void pendingIncludesBothStatusesAndYesterdayBacklogInFifoOrder() throws Exception {
        var expected = fixtures.stream().filter(o -> o.getStatus() == Order.Status.PENDING_PAYMENT
                || o.getStatus() == Order.Status.WAITING_CONFIRMATION).map(o -> o.getId().intValue()).toArray();
        mvc.perform(get("/api/orders/search").param("status", "PENDING_PAYMENT").param("size", "100")
                        .param("sort", "createdAt,asc").header("Authorization", token(staff)))
                .andExpect(status().isOk()).andExpect(jsonPath("$.totalElements").value(60))
                .andExpect(jsonPath("$.content[*].id", contains(expected)));
    }

    @Test void queueLoadsLineSnapshotsAndLiveImagesWithoutSqlGrowingWithPageSize() throws Exception {
        Order first = orders.findById(fixtures.get(0).getId()).orElseThrow();
        OrderItem meal = queueLine(first, "Original meal", Item.Type.FOOD, "/uploads/menu/current-meal.png", 2, 6000);
        OrderItem drink = queueLine(first, "Original drink", Item.Type.DRINK, "/uploads/menu/current-drink.png", 1, 13000);
        orders.saveAndFlush(first);

        AtomicInteger preparedStatements = new AtomicInteger();
        entityManager.unwrap(org.hibernate.Session.class).addEventListeners(new SessionEventListener() {
            @Override
            public void jdbcPrepareStatementStart() {
                preparedStatements.incrementAndGet();
            }
        });

        String authorization = token(staff);
        List<Integer> counts = new ArrayList<>();
        for (int pageSize : List.of(5, 15)) {
            entityManager.clear();
            preparedStatements.set(0);
            var response = mvc.perform(get("/api/orders/search").param("status", "PENDING_PAYMENT")
                            .param("size", Integer.toString(pageSize)).param("sort", "createdAt,asc")
                            .header("Authorization", authorization))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.totalElements").value(60))
                    .andExpect(jsonPath("$.content.length()").value(pageSize))
                    .andExpect(jsonPath("$.content[0].id").value(first.getId()))
                    .andExpect(jsonPath("$.content[0].items.length()").value(2));
            for (OrderItem line : List.of(meal, drink)) {
                String path = "$.content[0].items[?(@.itemId == " + line.getItem().getId() + ")]";
                response.andExpect(jsonPath(path + ".itemName", contains(line.getItemNameSnapshot())))
                        .andExpect(jsonPath(path + ".itemType", contains(line.getItemTypeSnapshot().name())))
                        .andExpect(jsonPath(path + ".itemImageUrl", contains(line.getItem().getImageUrl())))
                        .andExpect(jsonPath(path + ".quantity", contains(line.getQuantity())))
                        .andExpect(jsonPath(path + ".unitPrice", contains(line.getUnitPrice().doubleValue())))
                        .andExpect(jsonPath(path + ".subtotal", contains(line.getSubtotal().doubleValue())));
            }
            counts.add(preparedStatements.get());
        }

        assertEquals(counts.get(0), counts.get(1), () -> "Prepared statements for 5 and 15 orders: " + counts);
        assertTrue(counts.get(0) > 0 && counts.get(0) <= 8,
                () -> "Expected a bounded number of SQL statements, got " + counts);
    }

    private OrderItem queueLine(Order order, String snapshotName, Item.Type snapshotType,
                                String imageUrl, int quantity, long unitPrice) {
        Item item = new Item();
        item.setName("Current " + snapshotName);
        item.setType(Item.Type.SERVICE);
        item.setPrice(BigDecimal.valueOf(unitPrice + 1000));
        item.setImageUrl(imageUrl);

        OrderItem line = new OrderItem();
        line.setOrder(order);
        line.setItem(items.save(item));
        line.setItemNameSnapshot(snapshotName);
        line.setItemTypeSnapshot(snapshotType);
        line.setQuantity(quantity);
        line.setUnitPrice(BigDecimal.valueOf(unitPrice));
        line.setSubtotal(BigDecimal.valueOf(unitPrice * quantity));
        order.getOrderItems().add(line);
        return line;
    }

    @Test void exactComputerAndPhoneFiltersIncludeSessionlessAndLegacyOrders() throws Exception {
        for (int index : new int[]{0, 2}) {
            Order target = fixtures.get(index);
            mvc.perform(get("/api/orders/search").param("keyword", "#" + target.getId())
                            .param("computerCode", index == 0 ? pc2.getCode() : pc1.getCode())
                            .param("customerPhone", customer.getPhone()).header("Authorization", token(staff)))
                    .andExpect(status().isOk()).andExpect(jsonPath("$.totalElements").value(1))
                    .andExpect(jsonPath("$.content[0].id").value(target.getId()));
        }
    }

    @Test void directIdentityTakesPriorityOverDifferentSessionIdentity() throws Exception {
        Order target = order(distantCustomer, pc2); target.setSession(legacySession);
        target = orders.saveAndFlush(target);
        mvc.perform(get("/api/orders/search").param("keyword", "#" + target.getId())
                        .param("computerCode", pc2.getCode()).param("customerPhone", distantCustomer.getPhone())
                        .header("Authorization", token(staff)))
                .andExpect(status().isOk()).andExpect(jsonPath("$.totalElements").value(1))
                .andExpect(jsonPath("$.content[0].customerPhone").value(distantCustomer.getPhone()));
        mvc.perform(get("/api/orders/search").param("keyword", "#" + target.getId())
                        .param("customerPhone", customer.getPhone()).header("Authorization", token(staff)))
                .andExpect(status().isOk()).andExpect(jsonPath("$.totalElements").value(0));
    }

    @Test void keywordFindsNamesWithoutAccentsAndPhoneOutsideFirst50() throws Exception {
        for (String keyword : new String[]{"  nGUYEN  ", "dang", distantCustomer.getPhone()}) {
            mvc.perform(get("/api/orders/search").param("keyword", keyword).header("Authorization", token(staff)))
                    .andExpect(status().isOk()).andExpect(jsonPath("$.totalElements").value(1))
                    .andExpect(jsonPath("$.content[0].id").value(fixtures.get(119).getId()));
        }
    }

    @Test void keywordPaymentAndStatusApplyBeforeCountingAndPaging() throws Exception {
        mvc.perform(get("/api/orders/search").param("keyword", "pc-02").param("paymentMethod", "QR")
                        .param("status", "PENDING_PAYMENT").param("size", "5").header("Authorization", token(staff)))
                .andExpect(status().isOk()).andExpect(jsonPath("$.totalElements").value(20))
                .andExpect(jsonPath("$.content.length()").value(5)).andExpect(jsonPath("$.totalPages").value(4))
                .andExpect(jsonPath("$.content[*].computerCode", everyItem(is("PC-02"))))
                .andExpect(jsonPath("$.content[*].status", everyItem(is("WAITING_CONFIRMATION"))));
    }

    @Test void hashAndOrdIdsAreExactWhileBareDigitsSearchPhoneOrName() throws Exception {
        for (String prefix : new String[]{"#", "ORD-", "ord-"}) {
            mvc.perform(get("/api/orders/search").param("keyword", prefix + fixtures.get(11).getId())
                            .header("Authorization", token(staff)))
                    .andExpect(status().isOk()).andExpect(jsonPath("$.totalElements").value(1))
                    .andExpect(jsonPath("$.content[0].id").value(fixtures.get(11).getId()));
        }
        mvc.perform(get("/api/orders/search").param("keyword", "#1").param("paymentMethod", "QR")
                        .header("Authorization", token(staff)))
                .andExpect(status().isOk()).andExpect(jsonPath("$.totalElements").value(0));
        mvc.perform(get("/api/orders/search").param("keyword", "1").header("Authorization", token(staff)))
                .andExpect(status().isOk()).andExpect(jsonPath("$.totalElements").value(120));
    }

    @Test void literalWildcardsAndInvalidIdsReturnOnlyLiteralMatches() throws Exception {
        Account literal = account("0888700009", "VIP 100%_!", Account.Role.CUSTOMER);
        Order target = orders.saveAndFlush(order(literal, pc2));
        mvc.perform(get("/api/orders/search").param("keyword", "%_!").header("Authorization", token(staff)))
                .andExpect(status().isOk()).andExpect(jsonPath("$.totalElements").value(1))
                .andExpect(jsonPath("$.content[0].id").value(target.getId()));
        for (String keyword : new String[]{"#abc", "#-1", "#0", "ORD-", "ORD-999999999999999999999999"}) {
            mvc.perform(get("/api/orders/search").param("keyword", keyword).header("Authorization", token(staff)))
                    .andExpect(status().isOk()).andExpect(jsonPath("$.totalElements").value(0));
        }
    }

    @Test void cancellationChangesLastPageMetadata() throws Exception {
        Long last = fixtures.get(117).getId();
        mvc.perform(get("/api/orders/search").param("status", "WAITING_CONFIRMATION").param("page", "1")
                        .param("size", "29").param("sort", "createdAt,asc").header("Authorization", token(staff)))
                .andExpect(status().isOk()).andExpect(jsonPath("$.content[0].id").value(last));
        mvc.perform(patch("/api/orders/{id}/cancel", last).header("Authorization", token(staff))).andExpect(status().isOk());
        mvc.perform(get("/api/orders/search").param("status", "WAITING_CONFIRMATION").param("page", "1")
                        .param("size", "29").header("Authorization", token(staff)))
                .andExpect(status().isOk()).andExpect(jsonPath("$.totalElements").value(29))
                .andExpect(jsonPath("$.totalPages").value(1)).andExpect(jsonPath("$.content.length()").value(0));
    }

    @Test void searchRequiresStaffOrAdmin() throws Exception {
        mvc.perform(get("/api/orders/search")).andExpect(status().isUnauthorized());
        mvc.perform(get("/api/orders/search").header("Authorization", token(customer))).andExpect(status().isForbidden());
        mvc.perform(get("/api/orders/search").header("Authorization", token(admin))).andExpect(status().isOk());
    }

    @Test void existingDateAndAmountFiltersRemainEffective() throws Exception {
        mvc.perform(get("/api/orders/search").param("minAmount", "25000").param("maxAmount", "25000")
                        .param("fromDate", LocalDateTime.now().minusDays(2).toString())
                        .param("toDate", LocalDateTime.now().toString()).header("Authorization", token(staff)))
                .andExpect(status().isOk()).andExpect(jsonPath("$.totalElements").value(120));
        mvc.perform(get("/api/orders/search").param("minAmount", "25001").header("Authorization", token(staff)))
                .andExpect(status().isOk()).andExpect(jsonPath("$.totalElements").value(0));
        mvc.perform(get("/api/orders/search").param("fromDate", LocalDateTime.now().toString())
                        .header("Authorization", token(staff)))
                .andExpect(status().isOk()).andExpect(jsonPath("$.totalElements").value(0));
    }
}
