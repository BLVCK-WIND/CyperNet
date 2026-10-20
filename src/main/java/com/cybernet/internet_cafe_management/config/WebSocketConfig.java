package com.cybernet.internet_cafe_management.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.messaging.simp.config.MessageBrokerRegistry;
import org.springframework.web.socket.config.annotation.EnableWebSocketMessageBroker;
import org.springframework.web.socket.config.annotation.StompEndpointRegistry;
import org.springframework.web.socket.config.annotation.WebSocketMessageBrokerConfigurer;

/**
 * WebSocket & STOMP Configuration:
 * - Endpoints: /ws (SockJS fallback) và /ws-raw (Standard WebSocket)
 * - Message Broker:
 *   + /topic: Cho broadcast đa người nhận (Sơ đồ máy trạm, Thông báo đơn hàng mới)
 *   + /queue: Cho tin nhắn cá nhân hóa 1-1
 *   + /app: Tiền tố cho message do client gửi lên server
 */
@Configuration
@EnableWebSocketMessageBroker
public class WebSocketConfig implements WebSocketMessageBrokerConfigurer {

    @Override
    public void registerStompEndpoints(StompEndpointRegistry registry) {
        // Endpoint hỗ trợ SockJS fallback cho web browser cũ
        registry.addEndpoint("/ws")
                .setAllowedOriginPatterns("*")
                .withSockJS();

        // Endpoint WebSocket thuần túy cho client hiện đại / desktop app
        registry.addEndpoint("/ws-raw")
                .setAllowedOriginPatterns("*");
    }

    @Override
    public void configureMessageBroker(MessageBrokerRegistry registry) {
        // Kích hoạt broker in-memory cho /topic và /queue
        registry.enableSimpleBroker("/topic", "/queue");

        // Prefix cho các method @MessageMapping trên controller
        registry.setApplicationDestinationPrefixes("/app");
    }
}
