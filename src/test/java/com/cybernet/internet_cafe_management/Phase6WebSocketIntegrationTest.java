package com.cybernet.internet_cafe_management;

import com.cybernet.internet_cafe_management.dto.response.realtime.ComputerRealtimeEvent;
import com.cybernet.internet_cafe_management.dto.response.realtime.OrderRealtimeEvent;
import com.cybernet.internet_cafe_management.entity.Computer;
import com.cybernet.internet_cafe_management.entity.Order;
import com.cybernet.internet_cafe_management.service.RealtimeNotificationService;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.test.context.bean.override.mockito.MockitoBean;

import java.math.BigDecimal;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.verify;

@SpringBootTest
public class Phase6WebSocketIntegrationTest {

    @MockitoBean
    private SimpMessagingTemplate messagingTemplate;

    @Autowired
    private RealtimeNotificationService realtimeNotificationService;

    @Test
    @DisplayName("TC-WS1: Broadcast trạng thái máy trạm đẩy event lên /topic/computers")
    void testBroadcastComputerStatus_ShouldSendToTopic() {
        Computer computer = new Computer();
        computer.setId(10L);
        computer.setCode("PC-VIP-99");
        computer.setStatus(Computer.Status.IN_USE);
        computer.setZone(Computer.Zone.VIP);
        computer.setPricePerHour(BigDecimal.valueOf(15000));
        computer.setIpAddress("192.168.1.99");

        realtimeNotificationService.broadcastComputerStatus(computer);

        ArgumentCaptor<ComputerRealtimeEvent> captor = ArgumentCaptor.forClass(ComputerRealtimeEvent.class);
        verify(messagingTemplate).convertAndSend(eq("/topic/computers"), captor.capture());

        ComputerRealtimeEvent event = captor.getValue();
        assertNotNull(event);
        assertEquals("PC-VIP-99", event.getComputerCode());
        assertEquals(Computer.Status.IN_USE, event.getStatus());
        assertEquals(Computer.Zone.VIP, event.getZone());
        assertNotNull(event.getTimestamp());
    }

    @Test
    @DisplayName("TC-WS2: Broadcast đơn hàng mới đẩy event lên /topic/orders")
    void testBroadcastOrderEvent_ShouldSendToTopic() {
        Order order = new Order();
        order.setId(88L);
        order.setStatus(Order.Status.PENDING_PAYMENT);
        order.setPaymentMethod(Order.PaymentMethod.QR);
        order.setTotalAmount(BigDecimal.valueOf(45000));

        realtimeNotificationService.broadcastOrderEvent(order, "CREATED", "Khách gọi món mới tại máy PC-VIP-99");

        ArgumentCaptor<OrderRealtimeEvent> captor = ArgumentCaptor.forClass(OrderRealtimeEvent.class);
        verify(messagingTemplate).convertAndSend(eq("/topic/orders"), captor.capture());

        OrderRealtimeEvent event = captor.getValue();
        assertNotNull(event);
        assertEquals(88L, event.getOrderId());
        assertEquals(Order.Status.PENDING_PAYMENT, event.getStatus());
        assertEquals("CREATED", event.getEventType());
        assertEquals(BigDecimal.valueOf(45000), event.getTotalAmount());
        assertNotNull(event.getTimestamp());
    }
}
