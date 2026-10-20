package com.cybernet.internet_cafe_management;

import com.cybernet.internet_cafe_management.entity.*;
import com.cybernet.internet_cafe_management.repository.*;
import com.jayway.jsonpath.JsonPath;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import org.springframework.web.context.WebApplicationContext;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

import static org.hamcrest.Matchers.*;
import static org.springframework.security.test.web.servlet.setup.SecurityMockMvcConfigurers.springSecurity;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
public class Phase4ReportIntegrationTest {

    @Autowired
    private WebApplicationContext context;

    private MockMvc mockMvc;

    @Autowired
    private AccountRepository accountRepository;

    @Autowired
    private RefreshTokenRepository refreshTokenRepository;

    @Autowired
    private ComputerRepository computerRepository;

    @Autowired
    private SessionRepository sessionRepository;

    @Autowired
    private OrderRepository orderRepository;

    @Autowired
    private OrderItemRepository orderItemRepository;

    @Autowired
    private ItemRepository itemRepository;

    @Autowired
    private TimePurchaseRepository timePurchaseRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    private Account adminAccount;
    private Account staffAccount;
    private Account customerAccount;
    private Computer availablePc;
    private Item itemNoodle;
    private Item itemSting;
    private Item itemPlaytime;

    private String adminToken;
    private String staffToken;

    @BeforeEach
    void setUp() throws Exception {
        mockMvc = MockMvcBuilders
                .webAppContextSetup(context)
                .apply(springSecurity())
                .build();

        // Xoá dữ liệu theo thứ tự FK an toàn
        orderRepository.deleteAll();
        timePurchaseRepository.deleteAll();
        sessionRepository.deleteAll();
        itemRepository.deleteAll();
        refreshTokenRepository.deleteAll();

        // 1. Tạo Account ADMIN
        adminAccount = accountRepository.findByPhone("0901111111").orElseGet(() -> {
            Account acc = new Account();
            acc.setPhone("0901111111");
            acc.setName("Nguyễn Quản Lý");
            acc.setRole(Account.Role.ADMIN);
            return acc;
        });
        adminAccount.setPasswordHash(passwordEncoder.encode("admin123"));
        accountRepository.save(adminAccount);

        // 2. Tạo Account STAFF
        staffAccount = accountRepository.findByPhone("0902222222").orElseGet(() -> {
            Account acc = new Account();
            acc.setPhone("0902222222");
            acc.setName("Lê Thu Ngân");
            acc.setRole(Account.Role.STAFF);
            return acc;
        });
        staffAccount.setPasswordHash(passwordEncoder.encode("staff123"));
        accountRepository.save(staffAccount);

        // 3. Tạo Account CUSTOMER
        customerAccount = accountRepository.findByPhone("0903333333").orElseGet(() -> {
            Account acc = new Account();
            acc.setPhone("0903333333");
            acc.setName("Trần Khách Chơi");
            acc.setRole(Account.Role.CUSTOMER);
            return acc;
        });
        customerAccount.setPasswordHash(passwordEncoder.encode("khach123"));
        customerAccount.setRemainingMinutes(120);
        accountRepository.save(customerAccount);

        // 4. Tìm hoặc tạo Computer
        availablePc = computerRepository.findAll().stream().findFirst().orElseGet(() -> {
            Computer pc = new Computer();
            pc.setCode("PC-REP-01");
            pc.setPricePerHour(BigDecimal.valueOf(10000));
            pc.setIpAddress("192.168.254.99");
            pc.setZone(Computer.Zone.VIP);
            pc.setStatus(Computer.Status.AVAILABLE);
            return computerRepository.save(pc);
        });
        availablePc.setStatus(Computer.Status.AVAILABLE);
        computerRepository.save(availablePc);

        // 5. Tìm hoặc tạo các Item mẫu an toàn
        itemNoodle = itemRepository.findAll().stream()
                .filter(i -> "Mì tôm xào bò".equals(i.getName()))
                .findFirst()
                .orElseGet(() -> {
                    Item item = new Item();
                    item.setName("Mì tôm xào bò");
                    item.setPrice(BigDecimal.valueOf(30000));
                    item.setType(Item.Type.FOOD);
                    item.setAvailable(true);
                    return itemRepository.save(item);
                });

        itemSting = itemRepository.findAll().stream()
                .filter(i -> "Sting dâu lạnh".equals(i.getName()))
                .findFirst()
                .orElseGet(() -> {
                    Item item = new Item();
                    item.setName("Sting dâu lạnh");
                    item.setPrice(BigDecimal.valueOf(15000));
                    item.setType(Item.Type.DRINK);
                    item.setAvailable(true);
                    return itemRepository.save(item);
                });

        itemPlaytime = itemRepository.findAll().stream()
                .filter(i -> "Gói thêm 1 giờ".equals(i.getName()))
                .findFirst()
                .orElseGet(() -> {
                    Item item = new Item();
                    item.setName("Gói thêm 1 giờ");
                    item.setPrice(BigDecimal.valueOf(10000));
                    item.setType(Item.Type.PLAYTIME);
                    item.setAvailable(true);
                    return itemRepository.save(item);
                });

        // 6. Lấy JWT Tokens cho Admin & Staff
        adminToken = loginAndGetToken("0901111111", "admin123");
        staffToken = loginAndGetToken("0902222222", "staff123");
    }

    private String loginAndGetToken(String phone, String password) throws Exception {
        String json = String.format("""
                {
                    "phone": "%s",
                    "password": "%s"
                }
                """, phone, password);

        MvcResult res = mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(json))
                .andExpect(status().isOk())
                .andReturn();

        return JsonPath.read(res.getResponse().getContentAsString(), "$.accessToken");
    }

    private void seedRevenueTestData() {
        // Tạo Session
        Session session = new Session();
        session.setAccount(customerAccount);
        session.setComputer(availablePc);
        session.setStartedAt(LocalDateTime.now().minusHours(2));
        session.setEndedAt(LocalDateTime.now());
        session.setExpiresAt(LocalDateTime.now().plusHours(1));
        session.setStatus(Session.Status.ENDED);
        sessionRepository.save(session);

        // Đơn 1: CONFIRMED bằng CASH (30k mì + 15k nước = 45k)
        Order order1 = new Order();
        order1.setSession(session);
        order1.setPaymentMethod(Order.PaymentMethod.CASH);
        order1.setStatus(Order.Status.CONFIRMED);
        order1.setConfirmedByStaff(staffAccount);
        order1.setConfirmedAt(LocalDateTime.now().minusMinutes(30));
        order1.setTotalAmount(BigDecimal.valueOf(45000));

        List<OrderItem> items1 = new ArrayList<>();
        OrderItem oi1 = new OrderItem();
        oi1.setOrder(order1);
        oi1.setItem(itemNoodle);
        oi1.setQuantity(1);
        oi1.setUnitPrice(BigDecimal.valueOf(30000));
        oi1.setSubtotal(BigDecimal.valueOf(30000));
        items1.add(oi1);

        OrderItem oi2 = new OrderItem();
        oi2.setOrder(order1);
        oi2.setItem(itemSting);
        oi2.setQuantity(1);
        oi2.setUnitPrice(BigDecimal.valueOf(15000));
        oi2.setSubtotal(BigDecimal.valueOf(15000));
        items1.add(oi2);

        order1.setOrderItems(items1);
        orderRepository.save(order1);

        // Đơn 2: CANCELLED (50k - phải bị loại khỏi doanh thu)
        Order cancelledOrder = new Order();
        cancelledOrder.setSession(session);
        cancelledOrder.setPaymentMethod(Order.PaymentMethod.CASH);
        cancelledOrder.setStatus(Order.Status.CANCELLED);
        cancelledOrder.setTotalAmount(BigDecimal.valueOf(50000));
        orderRepository.save(cancelledOrder);

        // Đơn 3: PENDING_PAYMENT (20k - chưa thanh toán, phải bị loại)
        Order pendingOrder = new Order();
        pendingOrder.setSession(session);
        pendingOrder.setPaymentMethod(Order.PaymentMethod.QR);
        pendingOrder.setStatus(Order.Status.PENDING_PAYMENT);
        pendingOrder.setTotalAmount(BigDecimal.valueOf(20000));
        orderRepository.save(pendingOrder);

        // Giao dịch Nạp giờ quầy: CONFIRMED qua QR (50,000)
        TimePurchase tpConfirmed = new TimePurchase();
        tpConfirmed.setAccount(customerAccount);
        tpConfirmed.setMinutes(300);
        tpConfirmed.setAmount(BigDecimal.valueOf(50000));
        tpConfirmed.setPaymentMethod(TimePurchase.PaymentMethod.QR);
        tpConfirmed.setStatus(TimePurchase.Status.CONFIRMED);
        tpConfirmed.setConfirmedByStaff(staffAccount);
        tpConfirmed.setConfirmedAt(LocalDateTime.now().minusMinutes(20));
        timePurchaseRepository.save(tpConfirmed);

        // Giao dịch Nạp giờ quầy: PENDING_PAYMENT (10,000 - chưa duyệt, phải bị loại)
        TimePurchase tpPending = new TimePurchase();
        tpPending.setAccount(customerAccount);
        tpPending.setMinutes(60);
        tpPending.setAmount(BigDecimal.valueOf(10000));
        tpPending.setPaymentMethod(TimePurchase.PaymentMethod.CASH);
        tpPending.setStatus(TimePurchase.Status.PENDING_PAYMENT);
        timePurchaseRepository.save(tpPending);
    }

    @Test
    @DisplayName("TC-1: Báo cáo tổng quan doanh thu (Revenue Summary) tính toán chuẩn xác 100%")
    void testRevenueSummary_CalculatesCorrectly() throws Exception {
        seedRevenueTestData();

        mockMvc.perform(get("/api/reports/revenue/summary")
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.totalOrderRevenue").value(45000))
                .andExpect(jsonPath("$.totalTimePurchaseRevenue").value(50000))
                .andExpect(jsonPath("$.totalRevenue").value(95000))
                .andExpect(jsonPath("$.cashRevenue").value(45000))
                .andExpect(jsonPath("$.qrRevenue").value(50000))
                .andExpect(jsonPath("$.totalFoodAndDrinkRevenue").value(45000))
                .andExpect(jsonPath("$.totalPlaytimeRevenue").value(50000))
                .andExpect(jsonPath("$.totalOrders").value(1))
                .andExpect(jsonPath("$.totalTimePurchases").value(1));
    }

    @Test
    @DisplayName("TC-2: Báo cáo doanh thu theo ngày (Daily Revenue Trend)")
    void testDailyRevenue_ReturnsContinuousList() throws Exception {
        seedRevenueTestData();

        LocalDate today = LocalDate.now();
        mockMvc.perform(get("/api/reports/revenue/daily")
                        .header("Authorization", "Bearer " + adminToken)
                        .param("fromDate", today.toString())
                        .param("toDate", today.toString()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(1)))
                .andExpect(jsonPath("$[0].date").value(today.toString()))
                .andExpect(jsonPath("$[0].totalRevenue").value(95000))
                .andExpect(jsonPath("$[0].orderRevenue").value(45000))
                .andExpect(jsonPath("$[0].timePurchaseRevenue").value(50000))
                .andExpect(jsonPath("$[0].orderCount").value(1))
                .andExpect(jsonPath("$[0].timePurchaseCount").value(1));
    }

    @Test
    @DisplayName("TC-3: Thống kê món bán chạy nhất (Top Selling Items)")
    void testTopSellingItems_OrderedByQuantityDesc() throws Exception {
        seedRevenueTestData();

        mockMvc.perform(get("/api/reports/items/top-selling")
                        .header("Authorization", "Bearer " + adminToken)
                        .param("limit", "5"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(2)))
                .andExpect(jsonPath("$[0].totalQuantity").value(1))
                .andExpect(jsonPath("$[1].totalQuantity").value(1));
    }

    @Test
    @DisplayName("TC-4: Thống kê top khách hàng chi tiêu nhiều nhất (Top Spenders)")
    void testTopSpendingCustomers() throws Exception {
        seedRevenueTestData();

        mockMvc.perform(get("/api/reports/customers/top-spenders")
                        .header("Authorization", "Bearer " + adminToken)
                        .param("limit", "5"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(greaterThanOrEqualTo(1))))
                .andExpect(jsonPath("$[0].phone").value("0903333333"))
                .andExpect(jsonPath("$[0].totalSpent").value(95000));
    }

    @Test
    @DisplayName("TC-5: Thống kê hiệu suất máy trạm (Computer Usage)")
    void testComputerUsageStats() throws Exception {
        seedRevenueTestData();

        mockMvc.perform(get("/api/reports/computers/usage")
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(greaterThanOrEqualTo(1))))
                .andExpect(jsonPath("$[0].computerCode").value(availablePc.getCode()))
                .andExpect(jsonPath("$[0].totalSessions").value(greaterThanOrEqualTo(1)))
                .andExpect(jsonPath("$[0].zone").value(availablePc.getZone().name()));
    }

    @Test
    @DisplayName("TC-6: Phân quyền RBAC - ADMIN truy cập báo cáo thành công (200 OK)")
    void testSecurity_AdminAccess_Returns200() throws Exception {
        mockMvc.perform(get("/api/reports/revenue/summary")
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isOk());
    }

    @Test
    @DisplayName("TC-7: Phân quyền RBAC - STAFF bị chặn truy cập báo cáo tài chính (403 Forbidden)")
    void testSecurity_StaffAccess_Returns403() throws Exception {
        mockMvc.perform(get("/api/reports/revenue/summary")
                        .header("Authorization", "Bearer " + staffToken))
                .andExpect(status().isForbidden());
    }

    @Test
    @DisplayName("TC-8: Phân quyền RBAC - Request thiếu JWT bị chặn (401 Unauthorized)")
    void testSecurity_Unauthenticated_Returns401() throws Exception {
        mockMvc.perform(get("/api/reports/revenue/summary"))
                .andExpect(status().isUnauthorized());
    }
}
