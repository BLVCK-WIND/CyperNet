-- =============================================================================
-- V2__initial_seed_data.sql: Khởi tạo dữ liệu mẫu ban đầu cho CyberNet
-- =============================================================================

-- 1. Tài khoản mặc định: ADMIN & STAFF (Mật khẩu mặc định: admin123 / staff123)
-- BCrypt hash của 'admin123': $2a$10$wU05z8zQ0Z6Pj9O33d2qG.bYJc37E1hKkIwhZtO3Z1q4wI9fV7G6G
-- BCrypt hash của 'staff123': $2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy
INSERT IGNORE INTO accounts (id, phone, name, password_hash, role, remaining_minutes, created_at, version)
VALUES 
(1, '0901111111', 'Admin Quản Trị', '$2a$10$wU05z8zQ0Z6Pj9O33d2qG.bYJc37E1hKkIwhZtO3Z1q4wI9fV7G6G', 'ADMIN', 0, NOW(), 0),
(2, '0902222222', 'Lê Thu Ngân', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', 'STAFF', 0, NOW(), 0);

-- 2. Dữ liệu máy trạm ban đầu (Zone STANDARD & VIP)
INSERT IGNORE INTO computers (id, code, ip_address, price_per_hour, zone, status)
VALUES
(1, 'PC-01', '192.168.1.101', 10000.00, 'STANDARD', 'AVAILABLE'),
(2, 'PC-02', '192.168.1.102', 10000.00, 'STANDARD', 'AVAILABLE'),
(3, 'PC-03', '192.168.1.103', 10000.00, 'STANDARD', 'AVAILABLE'),
(4, 'PC-04', '192.168.1.104', 10000.00, 'STANDARD', 'AVAILABLE'),
(5, 'VIP-01', '192.168.1.201', 15000.00, 'VIP', 'AVAILABLE'),
(6, 'VIP-02', '192.168.1.202', 15000.00, 'VIP', 'AVAILABLE');

-- 3. Menu đồ ăn, thức uống và các gói giờ chơi
INSERT IGNORE INTO items (id, name, price, type, available)
VALUES
(1, 'Mì tôm trứng xúc xích', 25000.00, 'FOOD', TRUE),
(2, 'Cơm rang dưa bò', 45000.00, 'FOOD', TRUE),
(3, 'Nước ngọt Sting dâu', 15000.00, 'DRINK', TRUE),
(4, 'Trà tắc khổng lồ', 15000.00, 'DRINK', TRUE),
(5, 'Cà phê đen đá', 18000.00, 'DRINK', TRUE),
(6, 'Gói nạp 2 giờ chơi', 18000.00, 'PLAYTIME', TRUE),
(7, 'Gói nạp 5 giờ chơi (Combo đêm)', 40000.00, 'PLAYTIME', TRUE);
