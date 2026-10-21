package com.cybernet.internet_cafe_management.service;

import com.cybernet.internet_cafe_management.dto.response.realtime.ComputerRealtimeEvent;
import com.cybernet.internet_cafe_management.dto.response.realtime.OrderRealtimeEvent;
import com.cybernet.internet_cafe_management.dto.response.realtime.SessionRealtimeEvent;
import com.cybernet.internet_cafe_management.entity.Computer;
import com.cybernet.internet_cafe_management.entity.Order;
import lombok.extern.slf4j.Slf4j;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.Optional;

/**
 * Service phụ trách bắn thông điệp Real-time (WebSocket / STOMP)
 * tới quầy thu ngân (Staff Dashboard) và máy khách hàng.
 */
@Slf4j
@Service
public class RealtimeNotificationService {

    private final SimpMessagingTemplate messagingTemplate;

    public RealtimeNotificationService(Optional<SimpMessagingTemplate> messagingTemplate) {
        this.messagingTemplate = messagingTemplate.orElse(null);
    }

    /**
     * Bắn cập nhật trạng thái máy trạm tới topic /topic/computers
     */
    public void broadcastComputerStatus(Computer computer) {
        if (computer == null || messagingTemplate == null) return;
        try {
            ComputerRealtimeEvent event = ComputerRealtimeEvent.fromComputer(computer);
            log.info("[WebSocket] Broadcast computer status: {} -> {}", computer.getCode(), computer.getStatus());
            messagingTemplate.convertAndSend("/topic/computers", event);
        } catch (Exception ex) {
            log.error("[WebSocket] Failed to broadcast computer status for: {}", computer.getCode(), ex);
        }
    }

    /**
     * Bắn thông báo đơn đặt món tới topic /topic/orders
     */
    public void broadcastOrderEvent(Order order, String eventType, String message) {
        if (order == null || messagingTemplate == null) return;
        try {
            OrderRealtimeEvent event = OrderRealtimeEvent.fromOrder(order, eventType, message);
            log.info("[WebSocket] Broadcast order event: Order #{} [{}]", order.getId(), eventType);
            messagingTemplate.convertAndSend("/topic/orders", event);
        } catch (Exception ex) {
            log.error("[WebSocket] Failed to broadcast order event for Order #{}", order.getId(), ex);
        }
    }

    /**
     * Bắn thông báo liên quan đến phiên chơi tới topic /topic/sessions
     */
    public void broadcastSessionEvent(Long sessionId, String computerCode, String message, String eventType) {
        if (messagingTemplate == null) return;
        try {
            SessionRealtimeEvent event = SessionRealtimeEvent.builder()
                    .sessionId(sessionId)
                    .computerCode(computerCode)
                    .eventType(eventType)
                    .message(message)
                    .timestamp(LocalDateTime.now())
                    .build();

            log.info("[WebSocket] Broadcast session event: Session #{} [{}]", sessionId, eventType);
            messagingTemplate.convertAndSend("/topic/sessions", event);
        } catch (Exception ex) {
            log.error("[WebSocket] Failed to broadcast session event for Session #{}", sessionId, ex);
        }
    }
}
