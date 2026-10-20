package com.cybernet.internet_cafe_management.service;

import com.cybernet.internet_cafe_management.dto.response.AuditLogResponse;
import com.cybernet.internet_cafe_management.dto.response.PageResponse;
import com.cybernet.internet_cafe_management.entity.AuditLog;
import com.cybernet.internet_cafe_management.logging.MdcLoggingFilter;
import com.cybernet.internet_cafe_management.repository.AuditLogRepository;
import lombok.extern.slf4j.Slf4j;
import org.slf4j.MDC;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

/**
 * Service ghi nhận vết hoạt động (Audit Trail).
 * Lưu lại mọi biến động nghiệp vụ nhạy cảm phục vụ chống gian lận & truy cứu trách nhiệm.
 */
@Slf4j
@Service
public class AuditLogService {

    private final AuditLogRepository auditLogRepository;

    public AuditLogService(AuditLogRepository auditLogRepository) {
        this.auditLogRepository = auditLogRepository;
    }

    /**
     * Ghi vết thao tác tự động trích xuất thông tin người dùng từ Security Context & Client IP từ MDC.
     */
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void log(String action, String entityName, Long entityId, String details) {
        String actorPhone = "SYSTEM";
        String actorRole = "SYSTEM";

        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth != null && auth.isAuthenticated() && !"anonymousUser".equals(auth.getPrincipal())) {
            actorPhone = auth.getName();
            actorRole = auth.getAuthorities().stream()
                    .findFirst()
                    .map(a -> a.getAuthority().replace("ROLE_", ""))
                    .orElse("USER");
        }

        String ipAddress = MDC.get(MdcLoggingFilter.CLIENT_IP_KEY);
        if (ipAddress == null || ipAddress.isBlank()) {
            ipAddress = "127.0.0.1";
        }

        log(actorPhone, actorRole, action, entityName, entityId, details, ipAddress);
    }

    /**
     * Ghi vết thao tác với thông số truyền trực tiếp
     */
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void log(String actorPhone, String actorRole, String action, String entityName, Long entityId, String details, String ipAddress) {
        try {
            AuditLog auditLog = AuditLog.builder()
                    .actorPhone(actorPhone != null ? actorPhone : "UNKNOWN")
                    .actorRole(actorRole != null ? actorRole : "UNKNOWN")
                    .action(action)
                    .entityName(entityName)
                    .entityId(entityId)
                    .details(details)
                    .ipAddress(ipAddress != null ? ipAddress : "127.0.0.1")
                    .build();

            auditLogRepository.save(auditLog);
            log.info("[AUDIT] [{}] by {} ({}) on {} #{} - Details: {}",
                    action, actorPhone, actorRole, entityName, entityId, details);
        } catch (Exception ex) {
            log.error("[AUDIT ERROR] Không thể ghi audit log cho hành động {}: {}", action, ex.getMessage(), ex);
        }
    }

    /**
     * Lấy danh sách lịch sử thao tác có phân trang và lọc theo action / actorPhone.
     */
    @Transactional(readOnly = true)
    public PageResponse<AuditLogResponse> getAuditLogs(String action, String actorPhone, Pageable pageable) {
        Page<AuditLog> page;

        if (action != null && !action.isBlank() && actorPhone != null && !actorPhone.isBlank()) {
            page = auditLogRepository.findByActionAndActorPhoneOrderByCreatedAtDesc(action.trim(), actorPhone.trim(), pageable);
        } else if (action != null && !action.isBlank()) {
            page = auditLogRepository.findByActionOrderByCreatedAtDesc(action.trim(), pageable);
        } else if (actorPhone != null && !actorPhone.isBlank()) {
            page = auditLogRepository.findByActorPhoneOrderByCreatedAtDesc(actorPhone.trim(), pageable);
        } else {
            page = auditLogRepository.findAllByOrderByCreatedAtDesc(pageable);
        }

        return PageResponse.fromPage(page, AuditLogResponse::fromEntity);
    }
}
