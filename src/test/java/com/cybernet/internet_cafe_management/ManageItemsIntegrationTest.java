package com.cybernet.internet_cafe_management;

import com.cybernet.internet_cafe_management.dto.request.CreateDirectOrderRequest;
import com.cybernet.internet_cafe_management.dto.request.CreateItemRequest;
import com.cybernet.internet_cafe_management.dto.request.CreateOrderItemRequest;
import com.cybernet.internet_cafe_management.dto.request.UpdateItemRequest;
import com.cybernet.internet_cafe_management.entity.Account;
import com.cybernet.internet_cafe_management.entity.Computer;
import com.cybernet.internet_cafe_management.entity.Item;
import com.cybernet.internet_cafe_management.entity.Order;
import com.cybernet.internet_cafe_management.entity.OrderItem;
import com.cybernet.internet_cafe_management.entity.Session;
import com.cybernet.internet_cafe_management.repository.*;
import com.cybernet.internet_cafe_management.security.JwtService;
import com.cybernet.internet_cafe_management.security.RateLimitingFilter;
import com.cybernet.internet_cafe_management.service.OrderService;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.util.ReflectionTestUtils;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import org.springframework.web.context.WebApplicationContext;

import java.math.BigDecimal;
import java.time.Duration;
import java.time.LocalDateTime;
import java.util.List;

import static org.hamcrest.Matchers.is;
import static org.junit.jupiter.api.Assertions.*;
import static org.springframework.security.test.web.servlet.setup.SecurityMockMvcConfigurers.springSecurity;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
public class ManageItemsIntegrationTest {

    @Autowired
    private WebApplicationContext context;

    private MockMvc mockMvc;

    private final ObjectMapper objectMapper = new ObjectMapper();

    @Autowired
    private ItemRepository itemRepository;

    @Autowired
    private OrderItemRepository orderItemRepository;

    @Autowired
    private OrderRepository orderRepository;

    @Autowired
    private SessionRepository sessionRepository;

    @Autowired
    private ComputerRepository computerRepository;

    @Autowired
    private AccountRepository accountRepository;

    @Autowired
    private JwtService jwtService;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private RateLimitingFilter rateLimitingFilter;

    private String adminToken;
    private String staffToken;

    @BeforeEach
    void setUp() {
        mockMvc = MockMvcBuilders
                .webAppContextSetup(context)
                .apply(springSecurity())
                .build();

        rateLimitingFilter.clearLimits();
        ReflectionTestUtils.setField(rateLimitingFilter, "authLimit", 500);

        Account admin = accountRepository.findByPhone("0901111111").orElseGet(() -> {
            Account newAdmin = new Account();
            newAdmin.setPhone("0901111111");
            newAdmin.setName("Admin Manager");
            newAdmin.setPasswordHash(passwordEncoder.encode("admin123"));
            newAdmin.setRole(Account.Role.ADMIN);
            return accountRepository.save(newAdmin);
        });
        adminToken = jwtService.generateAccessToken(admin);

        Account staff = accountRepository.findByPhone("0902222222").orElseGet(() -> {
            Account newStaff = new Account();
            newStaff.setPhone("0902222222");
            newStaff.setName("Staff Member");
            newStaff.setPasswordHash(passwordEncoder.encode("staff123"));
            newStaff.setRole(Account.Role.STAFF);
            return accountRepository.save(newStaff);
        });
        staffToken = jwtService.generateAccessToken(staff);
    }

    @Test
    @DisplayName("TC-ITEM-1: POST /api/items - Admin tạo món mới thành công với ảnh và phân loại")
    void testCreateItem_Success() throws Exception {
        itemRepository.findByName("Bánh mì que Hải Phòng").ifPresent(itemRepository::delete);

        CreateItemRequest request = new CreateItemRequest();
        request.setName("  Bánh mì que Hải Phòng  "); // Kiểm tra tự động trim
        request.setPrice(BigDecimal.valueOf(15000));
        request.setType(Item.Type.FOOD);
        request.setAvailable(true);
        request.setImageUrl("/uploads/items/banh-mi.png");

        mockMvc.perform(post("/api/items")
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.name", is("Bánh mì que Hải Phòng")))
                .andExpect(jsonPath("$.price", is(15000)))
                .andExpect(jsonPath("$.type", is("FOOD")))
                .andExpect(jsonPath("$.available", is(true)))
                .andExpect(jsonPath("$.imageUrl", is("/uploads/items/banh-mi.png")));

        // Cleanup
        itemRepository.findByName("Bánh mì que Hải Phòng").ifPresent(itemRepository::delete);
    }

    @Test
    @DisplayName("TC-ITEM-2: Chặn tạo hoặc cập nhật món khi bị trùng tên (Case-insensitive & Trim)")
    void testDuplicateNameValidation() throws Exception {
        Item item1 = itemRepository.findByName("Cà phê sữa đá").orElseGet(() -> {
            Item i = new Item();
            i.setName("Cà phê sữa đá");
            i.setPrice(BigDecimal.valueOf(18000));
            i.setType(Item.Type.DRINK);
            i.setAvailable(true);
            return itemRepository.save(i);
        });

        // 1. Thử tạo mới món trùng tên viết hoa
        CreateItemRequest dupCreate = new CreateItemRequest();
        dupCreate.setName(" CÀ PHÊ SỮA ĐÁ ");
        dupCreate.setPrice(BigDecimal.valueOf(20000));
        dupCreate.setType(Item.Type.DRINK);

        mockMvc.perform(post("/api/items")
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(dupCreate)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value(org.hamcrest.Matchers.containsString("đã tồn tại")));

        // 2. Thử cập nhật món khác thành tên trùng
        Item item2 = itemRepository.findByName("Trà đào cam sả").orElseGet(() -> {
            Item i = new Item();
            i.setName("Trà đào cam sả");
            i.setPrice(BigDecimal.valueOf(22000));
            i.setType(Item.Type.DRINK);
            i.setAvailable(true);
            return itemRepository.save(i);
        });

        UpdateItemRequest dupUpdate = new UpdateItemRequest();
        dupUpdate.setName("Cà phê sữa đá");
        dupUpdate.setPrice(item2.getPrice());
        dupUpdate.setType(item2.getType());
        dupUpdate.setAvailable(true);

        mockMvc.perform(put("/api/items/" + item2.getId())
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(dupUpdate)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value(org.hamcrest.Matchers.containsString("đã tồn tại")));
    }

    @Test
    @DisplayName("TC-ITEM-3: Chặn xóa món ăn khi đã có trong lịch sử đơn hàng (Foreign Key Protection)")
    void testDeleteItem_BlockedWhenInOrderHistory() throws Exception {
        // Tạo món ăn có lịch sử đơn hàng
        Item orderedItem = itemRepository.findByName("Mì tôm xào thịt bò").orElseGet(() -> {
            Item i = new Item();
            i.setName("Mì tôm xào thịt bò");
            i.setPrice(BigDecimal.valueOf(35000));
            i.setType(Item.Type.FOOD);
            i.setAvailable(true);
            return itemRepository.save(i);
        });

        Account customer = accountRepository.findByPhone("0908888888").orElseThrow();
        Order order = new Order();
        order.setStatus(Order.Status.CONFIRMED);
        order.setTotalAmount(BigDecimal.valueOf(35000));
        order.setPaymentMethod(Order.PaymentMethod.CASH);
        order.setAccount(customer);
        order = orderRepository.save(order);

        OrderItem orderItem = new OrderItem();
        orderItem.setOrder(order);
        orderItem.setItem(orderedItem);
        orderItem.setQuantity(1);
        orderItem.setUnitPrice(orderedItem.getPrice());
        orderItem.setSubtotal(orderedItem.getPrice());
        orderItemRepository.save(orderItem);

        // Thử xóa món ăn này -> Phải bị chặn 400 với thông báo thân thiện
        mockMvc.perform(delete("/api/items/" + orderedItem.getId())
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value(org.hamcrest.Matchers.containsString("lịch sử đơn hàng")));

        // Cleanup
        orderItemRepository.delete(orderItem);
        orderRepository.delete(order);
    }

    @Test
    @DisplayName("TC-ITEM-4: Nhận diện từ 'tiếng' trong gói giờ chơi PLAYTIME (extractPackageMinutes)")
    void testExtractPackageMinutes_WithTieng() {
        Item comboItem = new Item();
        comboItem.setType(Item.Type.PLAYTIME);
        comboItem.setName("Combo đêm 6 tiếng");
        comboItem.setPrice(BigDecimal.valueOf(40000));

        int minutes = OrderService.extractPackageMinutes(comboItem);
        // 6 tiếng x 60 phút = 360 phút chuẩn
        assertEquals(360, minutes, "Cụm '6 tiếng' phải nhận diện ra đúng 360 phút chuẩn thay vì bị fallback");
    }

    @Test
    @DisplayName("TC-ITEM-5: Bán gói giờ tại quầy POS trực tiếp (createDirectOrder) áp dụng Dynamic Tariff theo Zone máy")
    void testDirectOrder_WithDynamicTariff_ZonePricing() throws Exception {
        // Máy VIP có đơn giá 15.000 VNĐ / giờ
        Computer vipComp = computerRepository.findByCode("PC-02").orElseThrow();
        vipComp.setPricePerHour(BigDecimal.valueOf(15000));
        vipComp.setZone(Computer.Zone.VIP);
        computerRepository.save(vipComp);

        Account customer = accountRepository.findByPhone("0908888888").orElseThrow();
        customer.setRemainingMinutes(0);
        accountRepository.save(customer);

        LocalDateTime now = LocalDateTime.now();
        Session session = new Session();
        session.setComputer(vipComp);
        session.setAccount(customer);
        session.setStatus(Session.Status.ACTIVE);
        session.setStartedAt(now);
        session.setExpiresAt(now.plusMinutes(60)); // Ban đầu còn 60 phút
        session = sessionRepository.save(session);

        // Tạo gói 2 giờ chơi (120 phút chuẩn = 20.000 VNĐ)
        Item playtimePackage = itemRepository.findByName("Gói nạp 2 giờ chơi").orElseGet(() -> {
            Item it = new Item();
            it.setName("Gói nạp 2 giờ chơi");
            it.setPrice(BigDecimal.valueOf(20000));
            it.setType(Item.Type.PLAYTIME);
            it.setAvailable(true);
            return itemRepository.save(it);
        });

        // Nhân viên bán trực tiếp gói 2 giờ này cho phiên VIP tại quầy
        CreateDirectOrderRequest directOrderReq = new CreateDirectOrderRequest(
                session.getId(),
                null,
                Order.PaymentMethod.CASH,
                List.of(new CreateOrderItemRequest(playtimePackage.getId(), 1))
        );

        mockMvc.perform(post("/api/orders/direct")
                        .header("Authorization", "Bearer " + staffToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(directOrderReq)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.status", is("CONFIRMED")));

        // 1. Kiểm tra tài khoản khách được cộng ĐỦ 120 phút chuẩn
        Account updatedCustomer = accountRepository.findById(customer.getId()).orElseThrow();
        assertEquals(120, updatedCustomer.getRemainingMinutes(), "Tài khoản khách phải được cộng đúng 120 phút chuẩn");

        // 2. Kiểm tra phiên máy VIP (15.000đ/h):
        // 120 phút chuẩn x (10.000 / 15.000) = 80 phút máy!
        // Ban đầu phiên còn 60 phút + 80 phút máy mới = 140 phút!
        Session updatedSession = sessionRepository.findById(session.getId()).orElseThrow();
        long totalSessionMinutes = Duration.between(now, updatedSession.getExpiresAt()).toMinutes();
        assertEquals(140, totalSessionMinutes, 2, "Phiên máy VIP 15k/h chỉ được cộng thêm 80 phút máy thực tế từ gói 120 phút chuẩn");

        // Cleanup: Xóa đơn hàng trước để không bị dính khóa ngoại của session
        orderRepository.findBySessionIdOrderByCreatedAtDesc(updatedSession.getId()).forEach(o -> {
            orderItemRepository.deleteAll(orderItemRepository.findByOrderId(o.getId()));
            orderRepository.delete(o);
        });
        sessionRepository.delete(updatedSession);
        vipComp.setStatus(Computer.Status.AVAILABLE);
        computerRepository.save(vipComp);
    }
}
