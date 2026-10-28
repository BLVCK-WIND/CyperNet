package com.cybernet.internet_cafe_management.exception;

/**
 * Danh sách mã lỗi chuẩn hóa toàn hệ thống (máy đọc được, ổn định).
 * Phục vụ Client / Frontend phân loại lỗi, rẽ nhánh xử lý và đa ngôn ngữ.
 */
public enum ErrorCode {

    // === LỖI HỆ THỐNG & GIAO THỨC (HTTP 4xx / 5xx) ===
    VALIDATION_ERROR("Dữ liệu đầu vào không hợp lệ"),
    MALFORMED_REQUEST("Yêu cầu không đúng định dạng JSON hoặc sai kiểu dữ liệu"),
    UNAUTHORIZED("Vui lòng đăng nhập để truy cập tài nguyên"),
    TOKEN_EXPIRED("Phiên đăng nhập đã hết hạn"),
    REFRESH_TOKEN_INVALID("Refresh token không hợp lệ hoặc đã hết hạn"),
    FORBIDDEN("Bạn không có quyền truy cập tài nguyên này"),
    NOT_FOUND("Không tìm thấy tài nguyên yêu cầu"),
    CONFLICT("Xung đột trạng thái hoặc dữ liệu tài nguyên"),
    RATE_LIMITED("Quá nhiều yêu cầu, vui lòng thử lại sau"),
    INTERNAL_ERROR("Hệ thống đang gặp sự cố, vui lòng thử lại sau"),

    // === LỖI NGHIỆP VỤ (BUSINESS RULES) ===
    ORDER_NOT_PENDING("Đơn hàng không ở trạng thái chờ duyệt"),
    ORDER_OUT_OF_STOCK("Món ăn hoặc dịch vụ hiện đã hết hàng"),
    COMPUTER_NOT_AVAILABLE("Máy tính hiện không khả dụng"),
    SESSION_NOT_ACTIVE("Phiên chơi không ở trạng thái hoạt động"),
    INSUFFICIENT_TIME("Tài khoản không đủ thời gian chơi"),
    ACCOUNT_ALREADY_EXISTS("Số điện thoại đã tồn tại trong hệ thống"),
    INVALID_CREDENTIALS("Sai số điện thoại hoặc mật khẩu"),
    ACTIVE_SESSION_EXISTS("Tài khoản đang có phiên chơi tại máy khác"),
    TRANSFER_SAME_COMPUTER("Không thể chuyển sang chính máy đang ngồi"),
    OPTIMISTIC_LOCK_CONFLICT("Dữ liệu tài khoản đang được cập nhật bởi giao dịch khác"),
    PESSIMISTIC_LOCK_CONFLICT("Máy tính đang trong quá trình xử lý bởi người dùng khác"),

    // === LỖI QUẢN LÝ KHU VỰC (ZONE MANAGEMENT) ===
    ZONE_NOT_FOUND("Khu vực không tồn tại trong hệ thống"),
    ZONE_ALREADY_EXISTS("Mã khu vực đã tồn tại trong hệ thống"),
    ZONE_IN_USE("Không thể xóa khu vực đang có máy trạm hoạt động");

    private final String defaultMessage;

    ErrorCode(String defaultMessage) {
        this.defaultMessage = defaultMessage;
    }

    public String getDefaultMessage() {
        return defaultMessage;
    }
}
