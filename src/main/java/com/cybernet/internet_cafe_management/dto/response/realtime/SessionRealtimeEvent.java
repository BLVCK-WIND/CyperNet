package com.cybernet.internet_cafe_management.dto.response.realtime;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

/**
 * Event DTO phát tán qua WebSocket topic /topic/sessions
 * khi có sự kiện cảnh báo hoặc thay đổi liên quan đến phiên chơi.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SessionRealtimeEvent {

    private Long sessionId;
    private String computerCode;
    private String eventType;
    private String message;
    private LocalDateTime timestamp;
}
