-- V9: Đồng bộ dữ liệu lịch sử computer_id và account_id từ sessions cho các đơn hàng cũ
-- Phục vụ bài toán: Khách quét QR gọi món / nạp giờ tại máy trống (chưa mở phiên)

UPDATE orders o
JOIN sessions s ON o.session_id = s.id
SET o.computer_id = COALESCE(o.computer_id, s.computer_id),
    o.account_id = COALESCE(o.account_id, s.account_id)
WHERE o.session_id IS NOT NULL;
