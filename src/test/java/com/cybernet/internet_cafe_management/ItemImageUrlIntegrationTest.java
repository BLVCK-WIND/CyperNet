package com.cybernet.internet_cafe_management;

import com.cybernet.internet_cafe_management.dto.request.CreateItemRequest;
import com.cybernet.internet_cafe_management.dto.request.CreateOrderItemRequest;
import com.cybernet.internet_cafe_management.dto.request.CreateOrderRequest;
import com.cybernet.internet_cafe_management.dto.request.UpdateItemRequest;
import com.cybernet.internet_cafe_management.entity.Account;
import com.cybernet.internet_cafe_management.entity.Computer;
import com.cybernet.internet_cafe_management.entity.Item;
import com.cybernet.internet_cafe_management.entity.Order;
import com.cybernet.internet_cafe_management.entity.Session;
import com.cybernet.internet_cafe_management.repository.AccountRepository;
import com.cybernet.internet_cafe_management.repository.ComputerRepository;
import com.cybernet.internet_cafe_management.repository.ItemRepository;
import com.cybernet.internet_cafe_management.repository.SessionRepository;
import com.cybernet.internet_cafe_management.security.JwtService;
import com.cybernet.internet_cafe_management.security.RateLimitingFilter;
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
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.context.WebApplicationContext;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

import static org.hamcrest.Matchers.*;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.springframework.security.test.web.servlet.setup.SecurityMockMvcConfigurers.springSecurity;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@Transactional
public class ItemImageUrlIntegrationTest {

    @Autowired
    private WebApplicationContext context;

    private MockMvc mockMvc;

    @Autowired
    private AccountRepository accountRepository;

    @Autowired
    private ComputerRepository computerRepository;

    @Autowired
    private ItemRepository itemRepository;

    @Autowired
    private SessionRepository sessionRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private JwtService jwtService;

    @Autowired
    private RateLimitingFilter rateLimitingFilter;

    private final ObjectMapper objectMapper = new ObjectMapper();

    private String adminToken;
    private String customerToken;
    private Account customer;
    private Session activeSession;

    @BeforeEach
    void setUp() {
        mockMvc = MockMvcBuilders
                .webAppContextSetup(context)
                .apply(springSecurity())
                .build();

        rateLimitingFilter.clearLimits();
        ReflectionTestUtils.setField(rateLimitingFilter, "authLimit", 500);
        ReflectionTestUtils.setField(rateLimitingFilter, "generalLimit", 2000);

        Account admin = accountRepository.findByPhone("0901111111").orElseGet(() -> {
            Account newAdmin = new Account();
            newAdmin.setPhone("0901111111");
            newAdmin.setName("Admin Root");
            newAdmin.setPasswordHash(passwordEncoder.encode("admin123"));
            newAdmin.setRole(Account.Role.ADMIN);
            return accountRepository.save(newAdmin);
        });
        adminToken = jwtService.generateAccessToken(admin);

        customer = accountRepository.findByPhone("0903333333").orElseGet(() -> {
            Account newCustomer = new Account();
            newCustomer.setPhone("0903333333");
            newCustomer.setName("Khách Hàng Test");
            newCustomer.setPasswordHash(passwordEncoder.encode("pass123"));
            newCustomer.setRole(Account.Role.CUSTOMER);
            newCustomer.setRemainingMinutes(180);
            return accountRepository.save(newCustomer);
        });
        customerToken = jwtService.generateAccessToken(customer);

        Computer computer = computerRepository.findByCode("PC-01").orElseGet(() -> {
            Computer c = new Computer();
            c.setCode("PC-01");
            c.setPricePerHour(BigDecimal.valueOf(10000));
            c.setZone(Computer.Zone.STANDARD);
            c.setStatus(Computer.Status.IN_USE);
            c.setIpAddress("192.168.1.101");
            return computerRepository.save(c);
        });

        activeSession = new Session();
        activeSession.setAccount(customer);
        activeSession.setComputer(computer);
        activeSession.setStartedAt(LocalDateTime.now().minusMinutes(10));
        activeSession.setExpiresAt(LocalDateTime.now().plusHours(2));
        activeSession.setStatus(Session.Status.ACTIVE);
        activeSession = sessionRepository.save(activeSession);

        itemRepository.findAll().forEach(item -> {
            if (item.getImageUrl() == null || item.getImageUrl().isBlank()) {
                if (item.getType() == Item.Type.FOOD) {
                    item.setImageUrl("https://images.unsplash.com/photo-1569718212165-3a8278d5f624?w=500");
                } else if (item.getType() == Item.Type.DRINK) {
                    item.setImageUrl("https://images.unsplash.com/photo-1622483767028-3f66f32aef97?w=500");
                } else {
                    item.setImageUrl("https://images.unsplash.com/photo-1538481199705-c710c4e965fc?w=500");
                }
                itemRepository.save(item);
            }
        });
    }

    @Test
    @DisplayName("TC-IMG-1: GET /api/items trả về danh sách món có kèm trường imageUrl")
    void testGetAllItems_ContainsImageUrl() throws Exception {
        mockMvc.perform(get("/api/items"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content", not(empty())))
                .andExpect(jsonPath("$.content[0].imageUrl").isString())
                .andExpect(jsonPath("$.content[0].imageUrl").isNotEmpty());
    }

    @Test
    @DisplayName("TC-IMG-2: POST /api/items tạo món mới có imageUrl -> 201 CREATED kèm imageUrl")
    void testCreateItem_WithImageUrl_Success() throws Exception {
        CreateItemRequest request = new CreateItemRequest(
                "Gà rán sốt cay CyberLux",
                BigDecimal.valueOf(35000),
                true,
                Item.Type.FOOD,
                "https://images.unsplash.com/photo-1562967914-608f82629710?w=500"
        );

        mockMvc.perform(post("/api/items")
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.id").isNumber())
                .andExpect(jsonPath("$.name").value("Gà rán sốt cay CyberLux"))
                .andExpect(jsonPath("$.imageUrl").value("https://images.unsplash.com/photo-1562967914-608f82629710?w=500"));
    }

    @Test
    @DisplayName("TC-IMG-3: PUT /api/items/{id} cập nhật imageUrl món ăn -> 200 OK")
    void testUpdateItem_WithImageUrl_Success() throws Exception {
        Item item = itemRepository.findAll().get(0);

        UpdateItemRequest updateRequest = new UpdateItemRequest(
                item.getName(),
                item.getPrice(),
                item.isAvailable(),
                item.getType(),
                "https://images.unsplash.com/photo-1550547660-d9450f859349?w=500"
        );

        mockMvc.perform(put("/api/items/" + item.getId())
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(updateRequest)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(item.getId()))
                .andExpect(jsonPath("$.imageUrl").value("https://images.unsplash.com/photo-1550547660-d9450f859349?w=500"));
    }

    @Test
    @DisplayName("TC-IMG-4: Đặt món (POST /api/orders) trả về OrderItemResponse có kèm itemImageUrl")
    void testCreateOrder_OrderItemContainsImageUrl() throws Exception {
        Item item = itemRepository.findAll().stream()
                .filter(i -> i.isAvailable() && i.getImageUrl() != null)
                .findFirst()
                .orElseGet(() -> {
                    Item i = new Item();
                    i.setName("Món Test Order");
                    i.setPrice(BigDecimal.valueOf(20000));
                    i.setType(Item.Type.FOOD);
                    i.setAvailable(true);
                    i.setImageUrl("https://images.unsplash.com/sample-food.jpg");
                    return itemRepository.save(i);
                });

        CreateOrderRequest orderRequest = new CreateOrderRequest();
        orderRequest.setSessionId(activeSession.getId());
        orderRequest.setPaymentMethod(Order.PaymentMethod.CASH);
        orderRequest.setItems(List.of(new CreateOrderItemRequest(item.getId(), 2)));

        mockMvc.perform(post("/api/orders")
                        .header("Authorization", "Bearer " + customerToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(orderRequest)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.items[0].itemId").value(item.getId()))
                .andExpect(jsonPath("$.items[0].itemImageUrl").value(item.getImageUrl()));
    }

    @Test
    @DisplayName("TC-IMG-5: POST /api/items với imageUrl vượt quá 500 ký tự -> 400 VALIDATION_ERROR")
    void testCreateItem_ImageUrlTooLong_FailsValidation() throws Exception {
        String longUrl = "https://example.com/" + "a".repeat(501);
        CreateItemRequest request = new CreateItemRequest(
                "Món Link Ảnh Siêu Dài",
                BigDecimal.valueOf(10000),
                true,
                Item.Type.DRINK,
                longUrl
        );

        mockMvc.perform(post("/api/items")
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.errorCode").value("VALIDATION_ERROR"))
                .andExpect(jsonPath("$.fieldErrors[0].field").value("imageUrl"));
    }
}
