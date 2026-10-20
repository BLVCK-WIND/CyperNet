package com.cybernet.internet_cafe_management;

import com.cybernet.internet_cafe_management.dto.request.CreateOrderItemRequest;
import com.cybernet.internet_cafe_management.dto.request.CreateOrderRequest;
import com.cybernet.internet_cafe_management.dto.request.CustomerSessionLoginRequest;
import com.cybernet.internet_cafe_management.entity.Account;
import com.cybernet.internet_cafe_management.entity.Computer;
import com.cybernet.internet_cafe_management.entity.Item;
import com.cybernet.internet_cafe_management.entity.Order;
import com.cybernet.internet_cafe_management.entity.Session;
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
import com.fasterxml.jackson.databind.ObjectMapper;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;
import static org.springframework.security.test.web.servlet.setup.SecurityMockMvcConfigurers.springSecurity;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
public class MicroStep0CorsAndCustomerAuthTest {

    @Autowired
    private WebApplicationContext context;

    private MockMvc mockMvc;

    @Autowired
    private AccountRepository accountRepository;

    @Autowired
    private ComputerRepository computerRepository;

    @Autowired
    private SessionRepository sessionRepository;

    @Autowired
    private ItemRepository itemRepository;

    @Autowired
    private OrderRepository orderRepository;

    @Autowired
    private RefreshTokenRepository refreshTokenRepository;

    @Autowired
    private com.cybernet.internet_cafe_management.security.JwtService jwtService;

    @Autowired
    private com.cybernet.internet_cafe_management.service.SessionService sessionService;

    @Autowired
    private PasswordEncoder passwordEncoder;

    private final ObjectMapper objectMapper = new ObjectMapper();

    private Account customerAccount;
    private Computer testComputer;
    private Session activeSession;
    private Item testFoodItem;

    @BeforeEach
    void setUp() {
        mockMvc = MockMvcBuilders
                .webAppContextSetup(context)
                .apply(springSecurity())
                .build();

        refreshTokenRepository.deleteAll();
        orderRepository.deleteAll();
        sessionRepository.deleteAll();

        // 1. Tạo Account CUSTOMER
        customerAccount = accountRepository.findByPhone("0987654321").orElseGet(() -> {
            Account acc = new Account();
            acc.setPhone("0987654321");
            acc.setName("Trần Gamer");
            acc.setRole(Account.Role.CUSTOMER);
            return acc;
        });
        customerAccount.setPasswordHash(passwordEncoder.encode("gamer123"));
        customerAccount.setRemainingMinutes(180);
        customerAccount = accountRepository.save(customerAccount);

        // 2. Tạo Computer
        testComputer = computerRepository.findByCode("TEST-PC-01").orElseGet(() -> {
            Computer pc = new Computer();
            pc.setCode("TEST-PC-01");
            pc.setPricePerHour(BigDecimal.valueOf(12000));
            pc.setIpAddress("192.168.1.55");
            pc.setZone(Computer.Zone.VIP);
            pc.setStatus(Computer.Status.IN_USE);
            return pc;
        });
        testComputer.setStatus(Computer.Status.IN_USE);
        testComputer.setZone(Computer.Zone.VIP);
        testComputer = computerRepository.save(testComputer);

        // 3. Tạo Session ACTIVE cho máy
        activeSession = new Session();
        activeSession.setComputer(testComputer);
        activeSession.setAccount(customerAccount);
        activeSession.setStartedAt(LocalDateTime.now().minusMinutes(30));
        activeSession.setExpiresAt(LocalDateTime.now().plusMinutes(150));
        activeSession.setStatus(Session.Status.ACTIVE);
        activeSession = sessionRepository.save(activeSession);

        // 4. Tạo Item mẫu
        testFoodItem = itemRepository.findByName("Mì Xào Bò Húc Test").orElseGet(() -> {
            Item item = new Item();
            item.setName("Mì Xào Bò Húc Test");
            item.setPrice(BigDecimal.valueOf(35000));
            item.setType(Item.Type.FOOD);
            item.setAvailable(true);
            return itemRepository.save(item);
        });
    }

    @Test
    @DisplayName("MS0-TC1: CORS Preflight OPTIONS request từ frontend (http://localhost:5173) -> 200 OK + CORS headers")
    void testCorsPreflight_ReturnsOkWithHeaders() throws Exception {
        mockMvc.perform(options("/api/items")
                        .header("Origin", "http://localhost:5173")
                        .header("Access-Control-Request-Method", "GET")
                        .header("Access-Control-Request-Headers", "Authorization, Content-Type"))
                .andExpect(status().isOk())
                .andExpect(header().string("Access-Control-Allow-Origin", "http://localhost:5173"))
                .andExpect(header().string("Access-Control-Allow-Credentials", "true"));
    }

    @Test
    @DisplayName("MS0-TC1b: CORS Preflight OPTIONS request từ dải IP LAN (http://192.168.1.150:5173) -> 200 OK")
    void testCorsPreflight_LanOrigin_ReturnsOkWithHeaders() throws Exception {
        mockMvc.perform(options("/api/items")
                        .header("Origin", "http://192.168.1.150:5173")
                        .header("Access-Control-Request-Method", "GET")
                        .header("Access-Control-Request-Headers", "Authorization, Content-Type"))
                .andExpect(status().isOk())
                .andExpect(header().string("Access-Control-Allow-Origin", "http://192.168.1.150:5173"))
                .andExpect(header().string("Access-Control-Allow-Credentials", "true"));
    }

    @Test
    @DisplayName("MS0-TC1c: Validation error trả về đầy đủ fieldErrors và errorCode VALIDATION_ERROR")
    void testValidationError_ReturnsAllFieldErrorsAndCode() throws Exception {
        mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{}"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.errorCode").value("VALIDATION_ERROR"))
                .andExpect(jsonPath("$.fieldErrors").isArray());
    }

    @Test
    @DisplayName("MS0-TC1d: Malformed JSON request trả về errorCode MALFORMED_REQUEST thay vì 500")
    void testMalformedJson_ReturnsMalformedRequestCode() throws Exception {
        mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"phone\": 12345")) // Cố tình thiếu ngoặc đóng
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.errorCode").value("MALFORMED_REQUEST"));
    }

    @Test
    @DisplayName("MS0-TC1e: Deserialization TransferComputerRequest với markOldAsMaintenance là null không gây lỗi 500")
    void testTransferRequest_NullField_DeserializesSafely() throws Exception {
        String json = "{\"toComputerCode\":\"TEST-PC-02\",\"reason\":\"Đổi máy\",\"markOldAsMaintenance\":null}";
        com.cybernet.internet_cafe_management.dto.request.TransferComputerRequest req =
                objectMapper.readValue(json, com.cybernet.internet_cafe_management.dto.request.TransferComputerRequest.class);
        assertNotNull(req);
        assertEquals(false, req.isMarkOldAsMaintenance());
    }

    @Test
    @DisplayName("MS0-TC2: Khách hàng xem menu public GET /api/items không cần token -> 200 OK")
    void testGetPublicItems_NoToken_Returns200() throws Exception {
        mockMvc.perform(get("/api/items"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content").isArray());
    }

    @Test
    @DisplayName("MS0-TC3: Tra cứu kiểm tra máy công khai GET /api/sessions/check/{code} -> Trả về hasActiveSession")
    void testCheckComputerSession_Success() throws Exception {
        // Kiểm tra máy đang có phiên ACTIVE
        mockMvc.perform(get("/api/sessions/check/TEST-PC-01"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.computerCode").value("TEST-PC-01"))
                .andExpect(jsonPath("$.zone").value("VIP"))
                .andExpect(jsonPath("$.hasActiveSession").value(true));

        // Kiểm tra máy không tồn tại -> 404
        mockMvc.perform(get("/api/sessions/check/NON_EXISTENT_PC"))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.message").value("Không tìm thấy máy tính với mã = NON_EXISTENT_PC"));
    }

    @Test
    @DisplayName("MS0-TC4: Khách quét QR nhập SĐT sai -> 400 Bad Request từ chối")
    void testCustomerSessionLogin_WrongPhone_ReturnsBadRequest() throws Exception {
        CustomerSessionLoginRequest request = new CustomerSessionLoginRequest("TEST-PC-01", "0999999999");

        mockMvc.perform(post("/api/auth/customer-session-login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value("Số điện thoại không khớp với người đang chơi tại máy TEST-PC-01!"));
    }

    @Test
    @DisplayName("MS0-TC5: Khách quét QR đúng SĐT & phiên ACTIVE -> 200 OK, cấp JWT ROLE_CUSTOMER + SessionResponse")
    void testCustomerSessionLogin_Success() throws Exception {
        CustomerSessionLoginRequest request = new CustomerSessionLoginRequest("TEST-PC-01", "0987654321");

        MvcResult result = mockMvc.perform(post("/api/auth/customer-session-login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.accessToken").isNotEmpty())
                .andExpect(jsonPath("$.refreshToken").isNotEmpty())
                .andExpect(jsonPath("$.account.role").value("CUSTOMER"))
                .andExpect(jsonPath("$.account.phone").value("0987654321"))
                .andExpect(jsonPath("$.session.computerCode").value("TEST-PC-01"))
                .andExpect(jsonPath("$.session.id").value(activeSession.getId()))
                .andReturn();

        String responseContent = result.getResponse().getContentAsString();
        String accessToken = JsonPath.read(responseContent, "$.accessToken");
        assertNotNull(accessToken);

        // MS0-TC6: Dùng chính Customer Token vừa cấp để đặt món qua POST /api/orders
        CreateOrderItemRequest itemReq = new CreateOrderItemRequest(testFoodItem.getId(), 2);
        CreateOrderRequest orderReq = new CreateOrderRequest(
                activeSession.getId(),
                Order.PaymentMethod.QR,
                List.of(itemReq)
        );

        mockMvc.perform(post("/api/orders")
                        .header("Authorization", "Bearer " + accessToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(orderReq)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.status").value("PENDING_PAYMENT"))
                .andExpect(jsonPath("$.totalAmount").value(70000.0))
                .andExpect(jsonPath("$.items.length()").value(1));
    }

    @Test
    @DisplayName("MS0-TC7 (B1): Nhân viên confirm đơn KHÔNG truyền staffId query param -> Lấy từ JWT thành công")
    void testConfirmOrder_ExtractsStaffFromJwt() throws Exception {
        Account staff = accountRepository.findByPhone("0902222222").orElseGet(() -> {
            Account acc = new Account();
            acc.setPhone("0902222222");
            acc.setName("Lê Thu Ngân");
            acc.setPasswordHash(passwordEncoder.encode("staff123"));
            acc.setRole(Account.Role.STAFF);
            return accountRepository.save(acc);
        });
        String staffToken = jwtService.generateAccessToken(staff);

        Order order = new Order();
        order.setSession(activeSession);
        order.setStatus(Order.Status.PENDING_PAYMENT);
        order.setPaymentMethod(Order.PaymentMethod.CASH);
        order.setTotalAmount(BigDecimal.valueOf(50000));
        order = orderRepository.save(order);

        mockMvc.perform(patch("/api/orders/" + order.getId() + "/confirm")
                        .header("Authorization", "Bearer " + staffToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("CONFIRMED"))
                .andExpect(jsonPath("$.confirmedByStaffName").value("Lê Thu Ngân"));
    }

    @Test
    @DisplayName("MS0-TC8 (B3): Khi phiên kết thúc, Refresh Token của khách hàng bị thu hồi")
    void testEndSession_RevokesRefreshToken() throws Exception {
        com.cybernet.internet_cafe_management.entity.RefreshToken rt = new com.cybernet.internet_cafe_management.entity.RefreshToken();
        rt.setAccount(customerAccount);
        rt.setToken("sample-refresh-token-" + System.currentTimeMillis());
        rt.setExpiresAt(LocalDateTime.now().plusDays(7));
        refreshTokenRepository.save(rt);

        assertTrue(refreshTokenRepository.findByToken(rt.getToken()).isPresent());

        sessionService.endSession(activeSession.getId());

        assertTrue(refreshTokenRepository.findByToken(rt.getToken()).isEmpty());
    }

    @Test
    @DisplayName("MS0-TC9 (B4): Khách A không thể đặt món trên phiên của Khách B -> 403 Forbidden")
    void testCustomer_CannotOrderOnAnotherCustomerSession() throws Exception {
        Account custB = accountRepository.findByPhone("0911223344").orElseGet(() -> {
            Account acc = new Account();
            acc.setPhone("0911223344");
            acc.setName("Khách B");
            acc.setPasswordHash(passwordEncoder.encode("pass123"));
            acc.setRole(Account.Role.CUSTOMER);
            acc.setRemainingMinutes(120);
            return accountRepository.save(acc);
        });

        Computer pc2 = computerRepository.findByCode("TEST-PC-02").orElseGet(() -> {
            Computer pc = new Computer();
            pc.setCode("TEST-PC-02");
            pc.setIpAddress("192.168.1.52");
            pc.setPricePerHour(BigDecimal.valueOf(10000));
            pc.setStatus(Computer.Status.IN_USE);
            pc.setZone(Computer.Zone.STANDARD);
            return computerRepository.save(pc);
        });
        pc2.setStatus(Computer.Status.IN_USE);
        pc2 = computerRepository.save(pc2);

        Session sessionB = new Session();
        sessionB.setComputer(pc2);
        sessionB.setAccount(custB);
        sessionB.setStartedAt(LocalDateTime.now());
        sessionB.setExpiresAt(LocalDateTime.now().plusHours(2));
        sessionB.setStatus(Session.Status.ACTIVE);
        sessionB = sessionRepository.save(sessionB);

        String tokenA = jwtService.generateAccessToken(customerAccount);

        CreateOrderItemRequest itemReq = new CreateOrderItemRequest(testFoodItem.getId(), 1);
        CreateOrderRequest orderReq = new CreateOrderRequest(
                sessionB.getId(),
                Order.PaymentMethod.CASH,
                List.of(itemReq)
        );

        mockMvc.perform(post("/api/orders")
                        .header("Authorization", "Bearer " + tokenA)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(orderReq)))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.errorCode").value("FORBIDDEN"));
    }
}
