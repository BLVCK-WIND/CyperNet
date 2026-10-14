package com.cybernet.internet_cafe_management;

import com.cybernet.internet_cafe_management.dto.request.ComputerLoginRequest;
import com.cybernet.internet_cafe_management.dto.request.CreateDirectOrderRequest;
import com.cybernet.internet_cafe_management.dto.request.CreateOrderItemRequest;
import com.cybernet.internet_cafe_management.dto.request.TransferComputerRequest;
import com.cybernet.internet_cafe_management.dto.response.OrderResponse;
import com.cybernet.internet_cafe_management.dto.response.SessionResponse;
import com.cybernet.internet_cafe_management.entity.*;
import com.cybernet.internet_cafe_management.repository.*;
import com.cybernet.internet_cafe_management.scheduler.SessionScheduler;
import com.cybernet.internet_cafe_management.service.OrderService;
import com.cybernet.internet_cafe_management.service.SessionService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest
public class Phase2IntegrationTest {

    @Autowired
    private SessionService sessionService;

    @Autowired
    private OrderService orderService;

    @Autowired
    private SessionScheduler sessionScheduler;

    @Autowired
    private AccountRepository accountRepository;

    @Autowired
    private ComputerRepository computerRepository;

    @Autowired
    private ItemRepository itemRepository;

    @Autowired
    private SessionRepository sessionRepository;

    @Autowired
    private OrderRepository orderRepository;

    private Account customer;
    private Account staff;
    private Computer standardPc;
    private Computer vipPc;
    private Item playtimeItem;

    @BeforeEach
    void setUp() {
        // Xóa dữ liệu phiên và đơn cũ trước mỗi test
        orderRepository.deleteAll();
        sessionRepository.deleteAll();

        // 1. Tạo Account Khách hàng
        customer = accountRepository.findByPhone("0988888888").orElseGet(() -> {
            Account acc = new Account();
            acc.setPhone("0988888888");
            acc.setName("Nguyễn Văn Khách");
            acc.setPasswordHash("hashed_123456");
            acc.setRole(Account.Role.CUSTOMER);
            acc.setRemainingMinutes(60); // Nạp trước 60 phút
            return accountRepository.save(acc);
        });
        customer.setRemainingMinutes(60);
        accountRepository.save(customer);

        // 2. Tạo Account Nhân viên
        staff = accountRepository.findByPhone("0977777777").orElseGet(() -> {
            Account acc = new Account();
            acc.setPhone("0977777777");
            acc.setName("Trần Thu Ngân");
            acc.setPasswordHash("hashed_staff123");
            acc.setRole(Account.Role.STAFF);
            return accountRepository.save(acc);
        });

        // 3. Tạo Máy tính Standard (10.000đ/h)
        standardPc = computerRepository.findByCode("TEST-PC-01").orElseGet(() -> {
            Computer pc = new Computer();
            pc.setCode("TEST-PC-01");
            pc.setPricePerHour(BigDecimal.valueOf(10000));
            pc.setIpAddress("172.31.254.101");
            pc.setZone(Computer.Zone.STANDARD);
            pc.setStatus(Computer.Status.AVAILABLE);
            return computerRepository.save(pc);
        });
        standardPc.setStatus(Computer.Status.AVAILABLE);
        computerRepository.save(standardPc);

        // 4. Tạo Máy tính VIP (20.000đ/h)
        vipPc = computerRepository.findByCode("TEST-VIP-01").orElseGet(() -> {
            Computer pc = new Computer();
            pc.setCode("TEST-VIP-01");
            pc.setPricePerHour(BigDecimal.valueOf(20000));
            pc.setIpAddress("172.31.254.201");
            pc.setZone(Computer.Zone.VIP);
            pc.setStatus(Computer.Status.AVAILABLE);
            return computerRepository.save(pc);
        });
        vipPc.setStatus(Computer.Status.AVAILABLE);
        computerRepository.save(vipPc);

        // 5. Tạo Món loại PLAYTIME
        playtimeItem = itemRepository.findAll().stream()
                .filter(i -> i.getType() == Item.Type.PLAYTIME)
                .findFirst()
                .orElseGet(() -> {
                    Item item = new Item();
                    item.setName("Gói thêm 1 giờ");
                    item.setPrice(BigDecimal.valueOf(10000));
                    item.setType(Item.Type.PLAYTIME);
                    item.setAvailable(true);
                    return itemRepository.save(item);
                });
    }

    @Test
    @DisplayName("Kịch bản chuỗi liên hoàn Phase 2: Login -> Tranh chấp -> Đơn quầy -> Đổi máy đổi Zone -> Auto Expire")
    void testPhase2FullBusinessFlow() {
        // ==========================================
        // BƯỚC 1: UC-2 ĐĂNG NHẬP MÁY TRẠM (PC LOGIN)
        // ==========================================
        ComputerLoginRequest loginReq = new ComputerLoginRequest(
                customer.getPhone(),
                "123456",
                standardPc.getCode()
        );
        SessionResponse sessionResp = sessionService.loginAndStartSession(loginReq);
        assertNotNull(sessionResp);
        assertEquals(Session.Status.ACTIVE, sessionResp.getStatus());
        assertEquals("TEST-PC-01", sessionResp.getComputerCode());

        // Kiểm tra máy tính đã được khóa sang IN_USE
        Computer pcInDb = computerRepository.findById(standardPc.getId()).orElseThrow();
        assertEquals(Computer.Status.IN_USE, pcInDb.getStatus());

        // ==========================================
        // BƯỚC 2: TEST TRANH CHẤP MÁY (PESSIMISTIC LOCK)
        // ==========================================
        // Cố tình login lại vào máy TEST-PC-01 đang bận -> Phải bị từ chối ngay lập tức
        IllegalStateException lockEx = assertThrows(IllegalStateException.class, () -> {
            sessionService.loginAndStartSession(loginReq);
        });
        assertTrue(lockEx.getMessage().contains("hiện không khả dụng") || lockEx.getMessage().contains("đang có phiên chơi"));

        // ==========================================
        // BƯỚC 3: UC-7 TẠO ĐƠN TRỰC TIẾP TẠI QUẦY (DIRECT ORDER)
        // ==========================================
        CreateDirectOrderRequest directOrderReq = new CreateDirectOrderRequest();
        directOrderReq.setSessionId(sessionResp.getId());
        directOrderReq.setStaffId(staff.getId());
        directOrderReq.setPaymentMethod(Order.PaymentMethod.CASH);
        directOrderReq.setItems(List.of(new CreateOrderItemRequest(playtimeItem.getId(), 1))); // Mua thêm 1 giờ (60 phút)

        OrderResponse orderResp = orderService.createDirectOrder(directOrderReq);
        assertNotNull(orderResp);
        assertEquals(Order.Status.CONFIRMED, orderResp.getStatus());
        assertNotNull(orderResp.getConfirmedByStaffName());

        // Kiểm tra phiên chơi đã được tự động cộng thêm 60 phút
        Session sessionAfterOrder = sessionRepository.findById(sessionResp.getId()).orElseThrow();
        // Thời lượng phiên ban đầu là 60 phút, cộng thêm 60 phút = khoảng 120 phút từ lúc bắt đầu
        assertTrue(sessionAfterOrder.getExpiresAt().isAfter(LocalDateTime.now().plusMinutes(100)));

        // ==========================================
        // BƯỚC 4: UC-6 CHUYỂN MÁY TỪ STANDARD (10k) SANG VIP (20k)
        // ==========================================
        TransferComputerRequest transferReq = new TransferComputerRequest();
        transferReq.setToComputerCode("TEST-VIP-01");
        transferReq.setReason("Khách muốn đổi sang phòng VIP chơi");
        transferReq.setMarkOldAsMaintenance(false);

        SessionResponse transferResp = sessionService.transferComputer(sessionResp.getId(), transferReq);
        assertNotNull(transferResp);
        assertEquals("TEST-VIP-01", transferResp.getComputerCode());

        // Kiểm tra máy cũ đã trở lại AVAILABLE
        Computer oldPc = computerRepository.findById(standardPc.getId()).orElseThrow();
        assertEquals(Computer.Status.AVAILABLE, oldPc.getStatus());

        // Kiểm tra máy mới đã chuyển sang IN_USE
        Computer newPc = computerRepository.findById(vipPc.getId()).orElseThrow();
        assertEquals(Computer.Status.IN_USE, newPc.getStatus());

        // Kiểm tra đơn hàng cũ vẫn gắn liền với phiên sau khi đổi máy
        List<Order> ordersOfSession = orderRepository.findBySessionIdOrderByCreatedAtDesc(sessionResp.getId());
        assertFalse(ordersOfSession.isEmpty());
        assertEquals(orderResp.getId(), ordersOfSession.get(0).getId());

        // ==========================================
        // BƯỚC 5: UC-5 SCHEDULER TỰ ĐỘNG ĐÓNG PHIÊN HẾT HẠN
        // ==========================================
        // Giả lập phiên chơi đã hết giờ bằng cách tua ngược expiresAt về quá khứ
        Session currentSession = sessionRepository.findById(sessionResp.getId()).orElseThrow();
        currentSession.setExpiresAt(LocalDateTime.now().minusMinutes(5));
        sessionRepository.save(currentSession);

        // Kích hoạt Scheduler quét tự động
        sessionScheduler.scanAndCloseExpiredSessions();

        // Kiểm tra kết quả sau khi Scheduler chạy
        Session expiredSession = sessionRepository.findById(sessionResp.getId()).orElseThrow();
        assertEquals(Session.Status.ENDED, expiredSession.getStatus());
        assertNotNull(expiredSession.getEndedAt());

        // Máy VIP phải được tự động giải phóng về AVAILABLE
        Computer vipAfterExpire = computerRepository.findById(vipPc.getId()).orElseThrow();
        assertEquals(Computer.Status.AVAILABLE, vipAfterExpire.getStatus());

        // Tài khoản khách phải được reset remainingMinutes = 0
        Account customerAfterExpire = accountRepository.findById(customer.getId()).orElseThrow();
        assertEquals(0, customerAfterExpire.getRemainingMinutes());
    }
}
