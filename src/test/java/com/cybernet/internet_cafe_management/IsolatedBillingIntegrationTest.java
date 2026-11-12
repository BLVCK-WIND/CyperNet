package com.cybernet.internet_cafe_management;

import com.cybernet.internet_cafe_management.entity.*;
import com.cybernet.internet_cafe_management.repository.*;
import com.cybernet.internet_cafe_management.service.*;
import com.cybernet.internet_cafe_management.dto.request.*;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.AfterAll;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import java.nio.file.*;
import java.sql.*;
import java.util.*;
import java.util.concurrent.*;
import java.math.BigDecimal;
import static org.junit.jupiter.api.Assertions.*;

/** Isolated local-MySQL test; owns only a fresh UUID schema, never the configured application schema. */
@SpringBootTest(properties = {"spring.jpa.hibernate.ddl-auto=validate", "spring.flyway.baseline-on-migrate=false", "websocket.enabled=false", "spring.jpa.show-sql=false"})
class IsolatedBillingIntegrationTest {
    static final String SCHEMA = "cybernet_safety_" + UUID.randomUUID().toString().replace("-", "");
    static String serverUrl, testUrl, username, password;
    @DynamicPropertySource static void database(DynamicPropertyRegistry registry) throws Exception {
        Properties properties = new Properties();
        try (var reader = Files.newBufferedReader(Path.of("src/main/resources/application-dev.properties"))) { properties.load(reader); }
        String original = properties.getProperty("spring.datasource.url");
        var match = java.util.regex.Pattern.compile("(jdbc:mysql://[^/]+/)[^?]*(.*)").matcher(original);
        if (!match.matches()) throw new IllegalStateException("Expected a local MySQL JDBC URL");
        serverUrl = match.group(1) + match.group(2); testUrl = match.group(1) + SCHEMA + match.group(2);
        username = properties.getProperty("spring.datasource.username"); password = properties.getProperty("spring.datasource.password");
        if (!SCHEMA.matches("cybernet_safety_[a-f0-9]{32}")) throw new IllegalStateException("Invalid isolated schema");
        try (var connection = DriverManager.getConnection(serverUrl, username, password); var statement = connection.createStatement()) {
            statement.execute("CREATE DATABASE " + SCHEMA + " CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci");
        }
        registry.add("spring.datasource.url", () -> testUrl);
        registry.add("spring.datasource.username", () -> username);
        registry.add("spring.datasource.password", () -> password);
    }
    @AfterAll static void cleanup() throws Exception {
        if (serverUrl != null && SCHEMA.matches("cybernet_safety_[a-f0-9]{32}")) {
            try (var connection = DriverManager.getConnection(serverUrl, username, password); var statement = connection.createStatement()) {
                statement.execute("DROP DATABASE IF EXISTS " + SCHEMA);
            }
        }
    }
    @Autowired AccountRepository accounts;
    @Autowired ComputerRepository computers;
    @Autowired SessionRepository sessions;
    @Autowired OrderRepository orders;
    @Autowired ItemRepository items;
    @Autowired SessionService sessionService;
    @Autowired OrderService orderService;
    @Autowired ReportService reportService;
    @Autowired TimePurchaseService timePurchaseService;
    @Autowired TimePurchaseRepository purchases;
    @Autowired org.flywaydb.core.Flyway flyway;
    Account customer;
    Computer computer;
    @BeforeEach void fixtures() {
        customer = new Account(); customer.setName("Isolated customer"); customer.setPhone("T" + UUID.randomUUID().toString().substring(0, 12));
        customer.setPasswordHash("unused"); customer.setRemainingMinutes(120); customer = accounts.save(customer);
        computer = new Computer(); computer.setCode("T" + UUID.randomUUID().toString().substring(0, 12));
        computer.setIpAddress(UUID.randomUUID().toString()); computer.setZone("STANDARD"); computer.setPricePerHour(BigDecimal.valueOf(10000));
        computer = computers.save(computer);
    }
    Item item(Item.Type type, String name) {
        Item item = new Item(); item.setName(name + UUID.randomUUID()); item.setType(type); item.setPrice(BigDecimal.valueOf(10000)); return items.save(item);
    }
    Long order(Item item) {
        CreateOrderItemRequest line = new CreateOrderItemRequest(); line.setItemId(item.getId()); line.setQuantity(1);
        return orderService.createOrder(new CreateOrderRequest(null, computer.getCode(), Order.PaymentMethod.CASH, List.of(line)), customer.getPhone()).getId();
    }
    List<Boolean> race(Runnable first, Runnable second) throws Exception {
        var pool = Executors.newFixedThreadPool(2); var start = new CountDownLatch(1);
        try {
            List<Future<Boolean>> futures = new ArrayList<>();
            for (Runnable command : List.of(first, second)) futures.add(pool.submit(() -> {
                start.await(); try { command.run(); return true; } catch (IllegalStateException expected) { return false; }
            }));
            start.countDown(); List<Boolean> results = new ArrayList<>();
            for (var future : futures) results.add(future.get(20, TimeUnit.SECONDS));
            return results;
        } finally { pool.shutdownNow(); }
    }
    @Test void cleanSchemaMigratesAndValidates() {
        assertEquals("12", flyway.info().current().getVersion().getVersion()); flyway.validate();
        assertEquals(0, flyway.info().pending().length);
    }
    @Test void upgradePreservesHistoricalOrderAndCapturesLegacyBenefits() throws Exception {
        String upgrade = SCHEMA + "_upgrade";
        assertTrue(upgrade.matches("cybernet_safety_[a-f0-9]{32}_upgrade"));
        String upgradeUrl = testUrl.replace(SCHEMA, upgrade);
        try (var connection = DriverManager.getConnection(serverUrl, username, password); var statement = connection.createStatement()) {
            statement.execute("CREATE DATABASE " + upgrade + " CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci");
        }
        try {
            var previous = org.flywaydb.core.Flyway.configure().dataSource(upgradeUrl, username, password).target("10").load();
            previous.migrate();
            try (var connection = DriverManager.getConnection(upgradeUrl, username, password); var statement = connection.createStatement()) {
                statement.executeUpdate("INSERT INTO sessions(id,computer_id,account_id,started_at,expires_at,status) VALUES(1,1,1,NOW(),DATE_ADD(NOW(),INTERVAL 1 HOUR),'ACTIVE')");
                statement.executeUpdate("INSERT INTO orders(id,session_id,computer_id,account_id,total_amount,payment_method,status) VALUES(1,1,1,1,18000,'CASH','PENDING_PAYMENT')");
                statement.executeUpdate("INSERT INTO order_items(id,order_id,item_id,quantity,unit_price,subtotal) VALUES(1,1,6,1,18000,18000)");
            }
            var upgraded = org.flywaydb.core.Flyway.configure().dataSource(upgradeUrl, username, password).load();
            upgraded.migrate(); upgraded.validate();
            try (var connection = DriverManager.getConnection(upgradeUrl, username, password); var statement = connection.createStatement();
                 var result = statement.executeQuery("SELECT oi.package_minutes_snapshot, s.price_per_hour_snapshot, o.total_amount FROM order_items oi JOIN orders o ON oi.order_id=o.id JOIN sessions s ON o.session_id=s.id WHERE oi.id=1")) {
                assertTrue(result.next()); assertEquals(120, result.getInt(1));
                assertEquals(0, BigDecimal.valueOf(10000).compareTo(result.getBigDecimal(2)));
                assertEquals(0, BigDecimal.valueOf(18000).compareTo(result.getBigDecimal(3)));
            }
            upgraded.migrate(); assertEquals(0, upgraded.info().pending().length);
        } finally {
            try (var connection = DriverManager.getConnection(serverUrl, username, password); var statement = connection.createStatement()) {
                statement.execute("DROP DATABASE IF EXISTS " + upgrade);
            }
        }
    }
    @Test void catalogEditsDoNotChangePurchasedBenefits() {
        Item item = item(Item.Type.PLAYTIME, "1 hour "); Long id = order(item);
        item.setType(Item.Type.FOOD); item.setName("Changed catalog " + UUID.randomUUID()); item.setPrice(BigDecimal.valueOf(90000)); items.save(item);
        var response = orderService.confirmOrder(id, 2L);
        assertEquals(Item.Type.PLAYTIME, response.getItems().get(0).getItemType());
        assertEquals(180, accounts.findById(customer.getId()).orElseThrow().getRemainingMinutes());
    }

    @Test void latePlaytimeOrderExtendsCurrentSessionWithoutChangingOrderHistory() {
        var start = new StartSessionRequest(computer.getId(), null, customer.getId());
        Long originalSessionId = sessionService.startSession(start).getId();
        Item packageItem = item(Item.Type.PLAYTIME, "1 hour ");
        var request = new CreateOrderRequest(originalSessionId, Order.PaymentMethod.CASH,
                List.of(new CreateOrderItemRequest(packageItem.getId(), 1)));
        var pendingOrder = orderService.createOrder(request, customer.getPhone());
        sessionService.endSession(originalSessionId);

        Computer currentComputer = computers.findById(computer.getId()).orElseThrow();
        currentComputer.setPricePerHour(BigDecimal.valueOf(15000));
        computers.save(currentComputer);
        Long currentSessionId = sessionService.startSession(start).getId();
        var previousExpiry = sessionService.getSessionById(currentSessionId).getExpiresAt();
        int previousBalance = accounts.findById(customer.getId()).orElseThrow().getRemainingMinutes();

        var confirmed = orderService.confirmOrder(pendingOrder.getId(), 2L);

        assertEquals(Order.Status.CONFIRMED, confirmed.getStatus());
        assertEquals(originalSessionId, orderService.getOrderById(confirmed.getId()).getSessionId());
        assertEquals(Session.Status.ENDED, sessionService.getSessionById(originalSessionId).getStatus());
        assertEquals(previousBalance + 60, accounts.findById(customer.getId()).orElseThrow().getRemainingMinutes());
        assertEquals(previousExpiry.plusMinutes(40), sessionService.getSessionById(currentSessionId).getExpiresAt(),
                "60 standard minutes buy 40 minutes at the current session's 15,000/hour tariff");
    }

    @Test void latePlaytimeOrderKeepsCreditIfTheNewSessionAlreadyExpired() {
        var start = new StartSessionRequest(computer.getId(), null, customer.getId());
        Long originalSessionId = sessionService.startSession(start).getId();
        Long orderId = order(item(Item.Type.PLAYTIME, "1 hour "));
        sessionService.endSession(originalSessionId);
        Long currentSessionId = sessionService.startSession(start).getId();
        Session current = sessions.findById(currentSessionId).orElseThrow();
        current.setExpiresAt(java.time.LocalDateTime.now().minusSeconds(1));
        sessions.save(current);
        sessionService.autoEndExpiredSession(currentSessionId);
        assertEquals(0, accounts.findById(customer.getId()).orElseThrow().getRemainingMinutes());

        var confirmed = orderService.confirmOrder(orderId, 2L);

        assertEquals(originalSessionId, confirmed.getSessionId());
        assertEquals(Session.Status.ENDED, sessionService.getSessionById(currentSessionId).getStatus());
        assertEquals(60, accounts.findById(customer.getId()).orElseThrow().getRemainingMinutes());
    }

    @Test void sessionlessPlaytimeOrderExtendsSessionOpenedBeforeConfirmation() {
        Long orderId = order(item(Item.Type.PLAYTIME, "1 hour "));
        Long currentSessionId = sessionService.startSession(
                new StartSessionRequest(computer.getId(), null, customer.getId())).getId();
        var previousExpiry = sessionService.getSessionById(currentSessionId).getExpiresAt();

        var confirmed = orderService.confirmOrder(orderId, 2L);

        assertNull(confirmed.getSessionId());
        assertEquals(180, accounts.findById(customer.getId()).orElseThrow().getRemainingMinutes());
        assertEquals(previousExpiry.plusMinutes(60), sessionService.getSessionById(currentSessionId).getExpiresAt());
    }

    @Test void latePlaytimeOrderAndExpiryRacePreservesThePurchasedMinutes() throws Exception {
        var start = new StartSessionRequest(computer.getId(), null, customer.getId());
        Long originalSessionId = sessionService.startSession(start).getId();
        Long orderId = order(item(Item.Type.PLAYTIME, "1 hour "));
        sessionService.endSession(originalSessionId);
        Long currentSessionId = sessionService.startSession(start).getId();
        int initialBalance = accounts.findById(customer.getId()).orElseThrow().getRemainingMinutes();
        Session dueSession = sessions.findById(currentSessionId).orElseThrow();
        dueSession.setExpiresAt(java.time.LocalDateTime.now().minusSeconds(1));
        sessions.save(dueSession);

        var outcomes = race(
                () -> orderService.confirmOrder(orderId, 2L),
                () -> sessionService.autoEndExpiredSession(currentSessionId));

        assertTrue(outcomes.stream().allMatch(Boolean::booleanValue));
        assertEquals(Order.Status.CONFIRMED, orderService.getOrderById(orderId).getStatus());
        var current = sessionService.getSessionById(currentSessionId);
        int balance = accounts.findById(customer.getId()).orElseThrow().getRemainingMinutes();
        if (current.getStatus() == Session.Status.ACTIVE) {
            assertEquals(initialBalance + 60, balance);
            assertTrue(current.getExpiresAt().isAfter(java.time.LocalDateTime.now().plusMinutes(58)));
        } else {
            assertEquals(Session.Status.ENDED, current.getStatus());
            assertEquals(60, balance);
        }
    }

    @Test void loadingCatalogInBatchPreservesOrderAndRepeatedCartLines() {
        Item food = item(Item.Type.FOOD, "Batch meal ");
        Item drink = item(Item.Type.DRINK, "Batch drink ");
        var request = new CreateOrderRequest(null, computer.getCode(), Order.PaymentMethod.CASH, List.of(
                new CreateOrderItemRequest(food.getId(), 2),
                new CreateOrderItemRequest(drink.getId(), 1),
                new CreateOrderItemRequest(food.getId(), 3)));

        var response = orderService.createOrder(request, customer.getPhone());
        assertEquals(List.of(food.getId(), drink.getId(), food.getId()),
                response.getItems().stream().map(line -> line.getItemId()).toList());
        assertEquals(List.of(2, 1, 3), response.getItems().stream().map(line -> line.getQuantity()).toList());
        assertEquals(0, BigDecimal.valueOf(60000).compareTo(response.getTotalAmount()));
    }

    @Test void changingMachinePriceDoesNotChangeAnExistingSessionTariff() {
        StartSessionRequest request = new StartSessionRequest(); request.setAccountId(customer.getId()); request.setComputerId(computer.getId());
        Long id = sessionService.startSession(request).getId();
        computer.setPricePerHour(BigDecimal.valueOf(30000)); computer.setStatus(Computer.Status.IN_USE); computers.save(computer);
        assertEquals(0, BigDecimal.valueOf(10000).compareTo(sessionService.getSessionById(id).getPricePerHour()));
        sessionService.endSession(id);
        int remaining = accounts.findById(customer.getId()).orElseThrow().getRemainingMinutes();
        assertTrue(remaining >= 118 && remaining <= 120);
    }
    @Test void concurrentConfirmationCreditsExactlyOnce() throws Exception {
        Long id = order(item(Item.Type.PLAYTIME, "1 hour "));
        var result = race(() -> orderService.confirmOrder(id, 2L), () -> orderService.confirmOrder(id, 2L));
        assertEquals(1, result.stream().filter(Boolean::booleanValue).count());
        assertEquals(180, accounts.findById(customer.getId()).orElseThrow().getRemainingMinutes());
    }
    @Test void concurrentConfirmAndCancelHaveOneWinner() throws Exception {
        Long id = order(item(Item.Type.PLAYTIME, "1 hour "));
        var result = race(() -> orderService.confirmOrder(id, 2L), () -> orderService.cancelOrder(id, customer.getPhone()));
        assertEquals(1, result.stream().filter(Boolean::booleanValue).count());
        var status = orders.findById(id).orElseThrow().getStatus();
        assertEquals(status == Order.Status.CONFIRMED ? 180 : 120, accounts.findById(customer.getId()).orElseThrow().getRemainingMinutes());
    }
    @Test void sameAccountCannotStartTwoMachinesConcurrently() throws Exception {
        Computer other = new Computer(); other.setCode("OTHER" + customer.getId()); other.setIpAddress("OTHER" + customer.getId());
        other.setZone("STANDARD"); other.setPricePerHour(BigDecimal.valueOf(10000)); other = computers.save(other);
        StartSessionRequest first = new StartSessionRequest(); first.setAccountId(customer.getId()); first.setComputerId(computer.getId());
        StartSessionRequest second = new StartSessionRequest(); second.setAccountId(customer.getId()); second.setComputerId(other.getId());
        var result = race(() -> sessionService.startSession(first), () -> sessionService.startSession(second));
        assertEquals(1, result.stream().filter(Boolean::booleanValue).count());
    }
    @Test void concurrentTimePurchaseConfirmationCreditsOnce() throws Exception {
        TimePurchase purchase = new TimePurchase(); purchase.setAccount(customer); purchase.setMinutes(60);
        purchase.setAmount(BigDecimal.valueOf(10000)); purchase.setPaymentMethod(TimePurchase.PaymentMethod.CASH);
        Long id = purchases.save(purchase).getId();
        var result = race(() -> timePurchaseService.confirmTimePurchase(id, 2L), () -> timePurchaseService.confirmTimePurchase(id, 2L));
        assertEquals(1, result.stream().filter(Boolean::booleanValue).count());
        assertEquals(180, accounts.findById(customer.getId()).orElseThrow().getRemainingMinutes());
    }
    @Test void topupAndExpiryRaceNeverErasePurchasedMinutes() throws Exception {
        StartSessionRequest request = new StartSessionRequest(); request.setAccountId(customer.getId()); request.setComputerId(computer.getId());
        Long sessionId = sessionService.startSession(request).getId();
        Session expired = sessions.findById(sessionId).orElseThrow(); expired.setExpiresAt(java.time.LocalDateTime.now().minusSeconds(1)); sessions.save(expired);
        TimePurchase purchase = new TimePurchase(); purchase.setAccount(customer); purchase.setMinutes(60);
        purchase.setAmount(BigDecimal.valueOf(10000)); purchase.setPaymentMethod(TimePurchase.PaymentMethod.CASH);
        Long id = purchases.save(purchase).getId();
        var results = race(() -> sessionService.autoEndExpiredSession(sessionId), () -> timePurchaseService.confirmTimePurchase(id, 2L));
        assertTrue(results.stream().allMatch(Boolean::booleanValue));
        Session current = sessions.findById(sessionId).orElseThrow();
        assertEquals(current.getStatus() == Session.Status.ACTIVE ? 180 : 60,
                accounts.findById(customer.getId()).orElseThrow().getRemainingMinutes());
    }
    @Test void sessionlessOrdersContributeToCustomerSpending() {
        Long id = order(item(Item.Type.FOOD, "Food ")); orderService.confirmOrder(id, 2L);
        var ranking = reportService.getTopSpendingCustomers(java.time.LocalDate.now(), java.time.LocalDate.now(), 50);
        assertTrue(ranking.stream().anyMatch(row -> row.getAccountId().equals(customer.getId()) && row.getTotalSpent().compareTo(BigDecimal.valueOf(10000)) == 0));
    }
}
