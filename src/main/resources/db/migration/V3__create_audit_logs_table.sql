-- ===================================================================
-- Flyway Migration V3: Create audit_logs table for activity auditing
-- ===================================================================

CREATE TABLE IF NOT EXISTS audit_logs (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    actor_phone VARCHAR(20) NOT NULL,
    actor_role VARCHAR(20) NOT NULL,
    action VARCHAR(50) NOT NULL,
    entity_name VARCHAR(50),
    entity_id BIGINT,
    details TEXT,
    ip_address VARCHAR(45),
    created_at DATETIME NOT NULL,
    INDEX idx_audit_logs_created_at (created_at DESC),
    INDEX idx_audit_logs_action (action),
    INDEX idx_audit_logs_actor_phone (actor_phone)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
