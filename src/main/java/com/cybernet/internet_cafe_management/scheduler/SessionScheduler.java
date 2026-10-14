package com.cybernet.internet_cafe_management.scheduler;

import com.cybernet.internet_cafe_management.entity.Session;
import com.cybernet.internet_cafe_management.repository.SessionRepository;
import com.cybernet.internet_cafe_management.service.SessionService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.time.LocalDateTime;
import java.util.List;

@Component
@Slf4j
public class SessionScheduler {

    private final SessionRepository sessionRepository;
    private final SessionService sessionService;

    public SessionScheduler(SessionRepository sessionRepository, SessionService sessionService) {
        this.sessionRepository = sessionRepository;
        this.sessionService = sessionService;
    }

    /**
     * Tự động quét và kết thúc các phiên chơi đã hết hạn.
     * Chạy định kỳ mỗi 30 giây (fixedDelay = 30000ms tính từ thời điểm lần chạy trước hoàn tất).
     */
    @Scheduled(fixedDelay = 30000)
    public void scanAndCloseExpiredSessions() {
        LocalDateTime now = LocalDateTime.now();
        List<Session> expiredSessions = sessionRepository.findByStatusAndExpiresAtLessThanEqual(Session.Status.ACTIVE, now);

        if (expiredSessions.isEmpty()) {
            return;
        }

        log.info("Phát hiện {} phiên chơi đã hết giờ cần đóng tự động.", expiredSessions.size());

        for (Session session : expiredSessions) {
            try {
                sessionService.autoEndExpiredSession(session.getId());
                log.info("Đã tự động kết thúc phiên chơi [ID: {}] của máy [{}] tại mốc thời gian {}",
                        session.getId(),
                        session.getComputer() != null ? session.getComputer().getCode() : "N/A",
                        now);
            } catch (Exception e) {
                log.error("Lỗi khi tự động kết thúc phiên chơi [ID: {}]: {}", session.getId(), e.getMessage(), e);
            }
        }
    }
}
