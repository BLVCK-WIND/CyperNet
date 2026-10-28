-- ===================================================================
-- Flyway Migration V5: Create zones table for Dynamic Zone Management
-- ===================================================================

CREATE TABLE IF NOT EXISTS zones (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    code VARCHAR(50) NOT NULL UNIQUE,
    name VARCHAR(100) NOT NULL,
    default_price_per_hour DECIMAL(10, 2) NOT NULL,
    color_code VARCHAR(20) NOT NULL DEFAULT '#bd9875',
    description VARCHAR(255) NULL,
    active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_zones_code (code),
    INDEX idx_zones_active (active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Nạp sẵn 2 Zone mặc định tương thích 100% với dữ liệu hiện có
INSERT INTO zones (code, name, default_price_per_hour, color_code, description, active, created_at)
SELECT 'STANDARD', 'Khu Tiêu Chuẩn', 10000.00, '#85C1DC', 'Khu máy phổ thông, cấu hình thể thao điện tử chuẩn mực', TRUE, NOW()
WHERE NOT EXISTS (SELECT 1 FROM zones WHERE code = 'STANDARD');

INSERT INTO zones (code, name, default_price_per_hour, color_code, description, active, created_at)
SELECT 'VIP', 'Khu VIP Gaming', 15000.00, '#bd9875', 'Khu máy VIP màn hình cong cao cấp, không gian riêng tư', TRUE, NOW()
WHERE NOT EXISTS (SELECT 1 FROM zones WHERE code = 'VIP');
