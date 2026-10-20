# 🔍 Báo Cáo Đánh Giá Toàn Diện Backend (Backend Audit for Frontend Readiness)

> **Mục tiêu:** Rà soát toàn bộ mã nguồn Backend, kiểm toán các điểm nghẽn, sai lệch và rủi ro trước khi tích hợp Frontend.  
> **Nguyên tắc phân loại:** Mọi mục đều ghi rõ một trong ba trạng thái: `[ĐÃ SỬA]`, `[HOÃN]`, `[MỞ]` kèm bằng chứng cụ thể (kết quả test hoặc log request/response thực tế).  
> **Thời điểm cập nhật:** 21/10/2026.

---

## 📌 Bảng Tổng Hợp Trạng Thái Phân Loại

| Nhóm vấn đề | Tổng số | [ĐÃ SỬA] | [HOÃN] | [MỞ] | Ghi chú tóm tắt |
| :--- | :---: | :---: | :---: | :---: | :--- |
| 🔴 **1. BLOCKER** | 3 | 3 | 0 | 0 | 100% đã sửa, URL/method đã khớp tài liệu và code |
| 🟠 **2. HIGH** | 7 | 6 | 1 | 0 | Sửa lỗi 500, JWT staffId, RateLimit IP, WebSocket, LazyInit, CORS LAN; Hoãn tìm SĐT qua API |
| 🟡 **3. MEDIUM** | 5 | 4 | 1 | 0 | Sửa handler 400, errorCode, fieldErrors, xóa token; Hoãn cắt phút lẻ mở máy (chốt PA A) |
| 🟢 **4. LOW** | 2 | 0 | 2 | 0 | Hoãn timezone và độ mịn giây (Frontend dùng dayjs xử lý) |
| 🆕 **5. CRUD ENDPOINTS** | 3 | 3 | 0 | 0 | Đã bổ sung đủ `PUT computers`, `PUT accounts`, `GET sessions/computer` |
| **TỔNG CỘNG** | **20** | **16** | **4** | **0** | **16 mục ĐÃ SỬA, 4 mục HOÃN (có lý do & giải pháp chốt), 0 mục MỞ** |

---

## 🔴 1. NHÓM VẤN ĐỀ BLOCKER

### 1.1. Sai lệch URL mở phiên chơi máy trạm giữa Frontend Plan và Backend
- **Trạng thái:** `[ĐÃ SỬA]`
- **Mô tả:** Frontend Plan cũ ghi `POST /api/sessions`. Thực tế Backend dùng `POST /api/sessions/start` cho thu ngân mở tại quầy và `POST /api/sessions/login` cho khách tự mở tại máy.
- **Bằng chứng:**
  - File mã nguồn: [SessionController.java:41](file:///d:/Antigravity/Java_SpringBoot/internet-cafe-management/src/main/java/com/cybernet/internet_cafe_management/controller/SessionController.java#L41) (`@PostMapping("/start")`).
  - Request runtime thật: `POST http://localhost:8080/api/sessions/start` $\rightarrow$ Trả về `HTTP 201 Created` kèm Session ID 369.
  - Automated test: `Phase2IntegrationTest.testStartSession_Success` PASS.

---

### 1.2. Sai lệch danh mục URL API Báo cáo & Thống kê
- **Trạng thái:** `[ĐÃ SỬA]`
- **Mô tả:** URL và tham số query trong tài liệu kế hoạch cũ không khớp Controller thực tế (`/summary` vs `/revenue/summary`, param `from` vs `fromDate`).
- **Bằng chứng:**
  - Controller: [ReportController.java](file:///d:/Antigravity/Java_SpringBoot/internet-cafe-management/src/main/java/com/cybernet/internet_cafe_management/controller/ReportController.java) cung cấp đúng:
    - `GET /api/reports/revenue/summary`
    - `GET /api/reports/revenue/daily?fromDate=&toDate=`
    - `GET /api/reports/items/top-selling`
    - `GET /api/reports/customers/top-spenders`
    - `GET /api/reports/computers/usage`
  - Request runtime thật: Cả 5 requests gọi thành công trên server thật, trả về `HTTP 200 OK` (STT 32-36 trong `api-test.http`).
  - Automated test: `Phase4ReportIntegrationTest` (10 test cases PASS 100%).

---

### 1.3. Khách hàng bị chặn 403 Forbidden khi xem lịch sử đơn hàng
- **Trạng thái:** `[ĐÃ SỬA]`
- **Mô tả:** Khách hàng (role `CUSTOMER`) gọi nhầm endpoint `GET /api/orders` (vốn chỉ dành cho `ADMIN`, `STAFF`) sẽ bị chặn 403.
- **Bằng chứng:**
  - Controller: [OrderController.java:136](file:///d:/Antigravity/Java_SpringBoot/internet-cafe-management/src/main/java/com/cybernet/internet_cafe_management/controller/OrderController.java#L136) phân quyền rõ ràng:
    `GET /api/orders/session/{sessionId}` có `@PreAuthorize("hasAnyRole('ADMIN', 'STAFF', 'CUSTOMER')")`.
  - Request runtime thật: Khách mang JWT Customer gọi `GET /api/orders/session/368` $\rightarrow$ Trả về `HTTP 200 OK`, bảo vệ IDOR đúng phiên.
  - Automated test: `MicroStep0CorsAndCustomerAuthTest.testGetSessionOrders_CustomerRole_Success` PASS.

---

## 🟠 2. NHÓM VẤN ĐỀ HIGH

### 2.1. Lỗi 500 do Primitive `boolean` trong `TransferComputerRequest`
- **Trạng thái:** `[ĐÃ SỬA]`
- **Mô tả:** DTO `TransferComputerRequest` cũ dùng primitive `boolean markOldAsMaintenance`, khi client gửi thiếu field hoặc truyền `null` bị lỗi deserialization 500.
- **Bằng chứng:**
  - Đã đổi sang wrapper: [TransferComputerRequest.java:17](file:///d:/Antigravity/Java_SpringBoot/internet-cafe-management/src/main/java/com/cybernet/internet_cafe_management/dto/request/TransferComputerRequest.java#L17) (`private Boolean markOldAsMaintenance = false;`).
  - Request runtime thật: Gửi body không chứa `markOldAsMaintenance` $\rightarrow$ Trả về `HTTP 200 OK` an toàn, không còn lỗi 500.
  - Automated test: `Phase2IntegrationTest.testTransferComputer_Success` PASS.

---

### 2.2. Lỗ hổng giả mạo danh tính: Nhận `staffId` từ Client thay vì JWT
- **Trạng thái:** `[ĐÃ SỬA]`
- **Mô tả:** Các thao tác duyệt tiền mặt trước đây nhận `staffId` từ query/body, có nguy cơ nhân viên A ghi nhận doanh thu cho nhân viên B.
- **Bằng chứng:**
  - Mã nguồn: [OrderController.java:87](file:///d:/Antigravity/Java_SpringBoot/internet-cafe-management/src/main/java/com/cybernet/internet_cafe_management/controller/OrderController.java#L87), [TimePurchaseController.java:61](file:///d:/Antigravity/Java_SpringBoot/internet-cafe-management/src/main/java/com/cybernet/internet_cafe_management/controller/TimePurchaseController.java#L61) tự động trích xuất:
    `Account staff = accountRepository.findByPhone(authentication.getName()).orElseThrow(...)`.
  - Request runtime thật: `PATCH /api/orders/{id}/confirm` và `PATCH /api/time-purchases/{id}/confirm` không truyền `?staffId=` vẫn duyệt thành công `HTTP 200 OK`.
  - Automated test: `Phase3SecurityIntegrationTest` PASS.

---

### 2.3. Rate Limiting theo Client IP gây khóa nhầm toàn bộ tiệm net
- **Trạng thái:** `[ĐÃ SỬA]`
- **Mô tả:** Tiệm net có hàng chục máy chung 1 IP gateway NAT, nếu khóa theo IP sẽ khiến cả tiệm bị 429 khi polling.
- **Bằng chứng:**
  - Mã nguồn: [RateLimitingFilter.java:95-101](file:///d:/Antigravity/Java_SpringBoot/internet-cafe-management/src/main/java/com/cybernet/internet_cafe_management/security/RateLimitingFilter.java#L95-L101) đã phân tầng:
    - User đã đăng nhập (có JWT): Khóa theo `user:<phone>`.
    - Request chưa xác thực: Khóa theo `ip:<clientIp>`.
  - Hạn mức phân bổ: `authLimit: 100/min`, `orderLimit: 200/min`, `generalLimit: 1000/min`.
  - Automated test: `Phase6AuditAndRateLimitIntegrationTest.testRateLimiting_ExceedLimit_Returns429` PASS.

---

### 2.4. Hệ thống WebSocket Real-time chưa được đấu nối vào Service nghiệp vụ
- **Trạng thái:** `[ĐÃ SỬA]`
- **Mô tả:** `RealtimeNotificationService` trước đó chưa được inject vào các Service để phát thông điệp.
- **Bằng chứng:**
  - Đã inject và phát tin tại:
    - [SessionService.java:110, 152, 319, 469](file:///d:/Antigravity/Java_SpringBoot/internet-cafe-management/src/main/java/com/cybernet/internet_cafe_management/service/SessionService.java) (`broadcastComputerStatus`).
    - [OrderService.java:136, 191, 213, 411](file:///d:/Antigravity/Java_SpringBoot/internet-cafe-management/src/main/java/com/cybernet/internet_cafe_management/service/OrderService.java) (`broadcastOrderEvent`).
    - [ComputerService.java:124](file:///d:/Antigravity/Java_SpringBoot/internet-cafe-management/src/main/java/com/cybernet/internet_cafe_management/service/ComputerService.java) (`broadcastComputerStatus`).
  - Automated test: `Phase6WebSocketIntegrationTest` (2/2 tests PASS).

---

### 2.5. Lỗi `LazyInitializationException` trong `SessionScheduler`
- **Trạng thái:** `[ĐÃ SỬA]`
- **Mô tả:** Khi scheduler tự động đóng phiên hết giờ, việc truy cập `session.getComputer().getCode()` ngoài Transaction làm văng ngoại lệ LazyInit vào log.
- **Bằng chứng:**
  - Query Repository: [SessionRepository.java:47](file:///d:/Antigravity/Java_SpringBoot/internet-cafe-management/src/main/java/com/cybernet/internet_cafe_management/repository/SessionRepository.java#L47):
    `SELECT s FROM Session s LEFT JOIN FETCH s.computer LEFT JOIN FETCH s.account WHERE s.status = :status AND s.expiresAt <= :dateTime`.
  - Kết quả: Khi phiên hết giờ, scheduler chạy mượt mà, log ghi nhận mã máy rõ ràng, không có ngoại lệ Hibernate trong log console.

---

### 2.6. Thiếu endpoint tìm kiếm khách hàng theo SĐT (Debounced Autocomplete)
- **Trạng thái:** `[HOÃN]`
- **Lý do hoãn:** Tiệm net quy mô MVP dưới 500 khách hàng. Backend đã có `GET /api/accounts?role=CUSTOMER&size=50` có phân trang.
- **Giải pháp Frontend:** Dùng Ant Design `Select` với thuộc tính `showSearch` và `filterOption` để tìm kiếm tức thì trên trình duyệt mà không cần thêm API backend. Sẽ mở lại ở Phase sau nếu danh sách khách vượt quá 1000 người.

---

### 2.7. CORS chặn toàn bộ truy cập từ IP mạng LAN (Điện thoại quét QR)
- **Trạng thái:** `[ĐÃ SỬA]`
- **Mô tả:** Cấu hình cũ chỉ cho phép `localhost`, khiến khách dùng điện thoại quét QR trong cùng Wi-Fi tiệm net bị chặn CORS 403.
- **Bằng chứng:**
  - Cấu hình: `cors.allowed-origin-patterns` trong `application-dev.properties` cho phép `192.168.*:[*]`, `10.*:[*]`, `172.*:[*]`.
  - Request runtime thật: Gọi preflight `OPTIONS` và `GET /api/items` với header `Origin: http://192.168.1.100:5173` $\rightarrow$ Trả về `HTTP 200 OK` kèm `Access-Control-Allow-Origin: http://192.168.1.100:5173`.

---

## 🟡 3. NHÓM VẤN ĐỀ MEDIUM

### 3.1. `GlobalExceptionHandler` bắt thiếu ngoại lệ client, trả về HTTP 500
- **Trạng thái:** `[ĐÃ SỬA]`
- **Mô tả:** Gửi JSON sai cú pháp hoặc sai kiểu dữ liệu param bị biến thành lỗi 500.
- **Bằng chứng:**
  - Mã nguồn: [GlobalExceptionHandler.java:97-110](file:///d:/Antigravity/Java_SpringBoot/internet-cafe-management/src/main/java/com/cybernet/internet_cafe_management/exception/GlobalExceptionHandler.java#L97-L110) bắt `HttpMessageNotReadableException`, `MethodArgumentTypeMismatchException`, `MissingServletRequestParameterException` và trả về HTTP 400 kèm `ErrorCode.MALFORMED_REQUEST`.
  - Automated test: `Phase6ValidationIntegrationTest.testMalformedJson_Returns400` PASS.

---

### 3.2. Response lỗi thiếu mã lỗi (`errorCode`) định danh dạng máy đọc được
- **Trạng thái:** `[ĐÃ SỬA]`
- **Mô tả:** Schema lỗi trước đây chỉ có chuỗi tiếng Việt, client không thể `switch(error.errorCode)`.
- **Bằng chứng:**
  - Enum mã lỗi: [`ErrorCode.java`](file:///d:/Antigravity/Java_SpringBoot/internet-cafe-management/src/main/java/com/cybernet/internet_cafe_management/exception/ErrorCode.java) chuẩn hóa 20 mã lỗi máy đọc được.
  - Response DTO: [`ErrorResponse.java`](file:///d:/Antigravity/Java_SpringBoot/internet-cafe-management/src/main/java/com/cybernet/internet_cafe_management/dto/response/ErrorResponse.java) luôn trả về trường `errorCode`.
  - Request runtime thật: Body lỗi trả về `{"status":401,"errorCode":"UNAUTHORIZED","message":"Vui lòng đăng nhập để truy cập!","timestamp":...}`.

---

### 3.3. Bean Validation chỉ trả về 1 lỗi đầu tiên
- **Trạng thái:** `[ĐÃ SỬA]`
- **Mô tả:** Form nhiều lỗi nhưng server chỉ trả lỗi của 1 field đầu tiên qua `.findFirst()`.
- **Bằng chứng:**
  - Mã nguồn: [GlobalExceptionHandler.java:80-95](file:///d:/Antigravity/Java_SpringBoot/internet-cafe-management/src/main/java/com/cybernet/internet_cafe_management/exception/GlobalExceptionHandler.java#L80-L95) gom toàn bộ lỗi vào `fieldErrors` (`List<FieldErrorDetail>`).
  - Request runtime thật: `POST /api/accounts` với body `{}` $\rightarrow$ Trả về đầy đủ lỗi các trường `phone`, `name`, `password` trong mảng `fieldErrors`.
  - Automated test: `Phase6ValidationIntegrationTest.testCreateAccount_ValidationErrors` PASS.

---

### 3.4. Refresh Token của khách hàng không bị thu hồi khi phiên chơi kết thúc
- **Trạng thái:** `[ĐÃ SỬA]`
- **Mô tả:** Khách rời tiệm net nhưng refresh token cũ trên điện thoại vẫn còn hiệu lực 7 ngày.
- **Bằng chứng:**
  - Mã nguồn: Đã gọi `refreshTokenRepository.deleteByAccountId(account.getId())` trong cả 2 luồng:
    - [SessionService.java:149](file:///d:/Antigravity/Java_SpringBoot/internet-cafe-management/src/main/java/com/cybernet/internet_cafe_management/service/SessionService.java#L149) (khi thu ngân bấm `endSession`).
    - [SessionService.java:314](file:///d:/Antigravity/Java_SpringBoot/internet-cafe-management/src/main/java/com/cybernet/internet_cafe_management/service/SessionService.java#L314) (khi `autoEndExpiredSession` quét hết giờ).
  - Request runtime thật: Sau khi kết thúc phiên, gọi `POST /api/auth/refresh` bằng token đó bị chặn `HTTP 400 Bad Request` ("Refresh token không hợp lệ!").

---

### 3.5. Tham số `minutes` trong `StartSessionRequest` bị bỏ qua
- **Trạng thái:** `[HOÃN]` *(Đã chốt thiết kế theo Phương án A)*
- **Lý do hoãn:** Tech Lead đã duyệt giữ nguyên Phương án A. Server mở máy theo toàn bộ số dư thời gian hiện có của khách (`account.getRemainingMinutes()`). Khi kết thúc phiên (`endSession`), server tính đúng thời gian chơi thực tế và hoàn trả 100% số phút chưa dùng về lại tài khoản.
- **Giải pháp Frontend:** Modal mở máy quầy thu ngân (MS-2.5) không cần ô nhập số phút, chỉ hiển thị số phút khả dụng và nút xác nhận mở máy.

---

## 🟢 4. NHÓM VẤN ĐỀ LOW

### 4.1. Chuỗi ngày giờ thiếu thông tin múi giờ (Timezone Offset)
- **Trạng thái:** `[HOÃN]`
- **Lý do hoãn:** Toàn bộ hệ thống chạy mạng LAN tiệm net trong cùng múi giờ GMT+7 (Asia/Ho_Chi_Minh).
- **Giải pháp Frontend:** Cấu hình toàn cục trong file khởi tạo `dayjs`: `dayjs.tz.setDefault("Asia/Ho_Chi_Minh")`.

---

### 4.2. Độ mịn Countdown Timer của phiên chơi
- **Trạng thái:** `[HOÃN]`
- **Lý do hoãn:** Backend cung cấp mốc `expiresAt` chính xác đến giây theo định dạng ISO-8601.
- **Giải pháp Frontend:** Client tự tính `dayjs(session.expiresAt).diff(dayjs(), 'second')` để chạy đồng hồ đếm ngược mượt mà từng giây mà không cần Backend gửi thêm trường giây riêng.

---

## 🆕 5. NHÓM CRUD ENDPOINTS BỔ SUNG

### 5.1. `PUT /api/computers/{id}` — Cập nhật cấu hình máy & Toggle bảo trì
- **Trạng thái:** `[ĐÃ SỬA]`
- **Mô tả:** Cho phép sửa tên máy, đơn giá, khu vực và chuyển trạng thái bảo trì độc lập.
- **Bằng chứng:**
  - Controller & Service: [`ComputerController.java:77`](file:///d:/Antigravity/Java_SpringBoot/internet-cafe-management/src/main/java/com/cybernet/internet_cafe_management/controller/ComputerController.java#L77), [`ComputerService.java:94`](file:///d:/Antigravity/Java_SpringBoot/internet-cafe-management/src/main/java/com/cybernet/internet_cafe_management/service/ComputerService.java#L94).
  - DTO: [`UpdateComputerRequest.java`](file:///d:/Antigravity/Java_SpringBoot/internet-cafe-management/src/main/java/com/cybernet/internet_cafe_management/dto/request/UpdateComputerRequest.java).
  - Automated test: `Phase6CrudEndpointsIntegrationTest.testUpdateComputer_Success` PASS.

---

### 5.2. `PUT /api/accounts/{id}` — Cập nhật thông tin tài khoản & Reset mật khẩu
- **Trạng thái:** `[ĐÃ SỬA]`
- **Mô tả:** Admin sửa họ tên, thay đổi vai trò hoặc đặt lại mật khẩu mới cho tài khoản.
- **Bằng chứng:**
  - Controller & Service: [`AccountController.java:73`](file:///d:/Antigravity/Java_SpringBoot/internet-cafe-management/src/main/java/com/cybernet/internet_cafe_management/controller/AccountController.java#L73), [`AccountService.java:82`](file:///d:/Antigravity/Java_SpringBoot/internet-cafe-management/src/main/java/com/cybernet/internet_cafe_management/service/AccountService.java#L82).
  - DTO: [`UpdateAccountRequest.java`](file:///d:/Antigravity/Java_SpringBoot/internet-cafe-management/src/main/java/com/cybernet/internet_cafe_management/dto/request/UpdateAccountRequest.java).
  - Automated test: `Phase6CrudEndpointsIntegrationTest.testUpdateAccount_Success` PASS.

---

### 5.3. `GET /api/sessions/computer/{computerId}` — Lịch sử phiên chơi theo máy trạm
- **Trạng thái:** `[ĐÃ SỬA]`
- **Mô tả:** Lấy danh sách phân trang các phiên chơi đã từng chạy trên một máy trạm cụ thể.
- **Bằng chứng:**
  - Controller, Service & Repo: [`SessionController.java:162`](file:///d:/Antigravity/Java_SpringBoot/internet-cafe-management/src/main/java/com/cybernet/internet_cafe_management/controller/SessionController.java#L162), [`SessionService.java:291`](file:///d:/Antigravity/Java_SpringBoot/internet-cafe-management/src/main/java/com/cybernet/internet_cafe_management/service/SessionService.java#L291), [`SessionRepository.java:26`](file:///d:/Antigravity/Java_SpringBoot/internet-cafe-management/src/main/java/com/cybernet/internet_cafe_management/repository/SessionRepository.java#L26).
  - Automated test: `Phase6CrudEndpointsIntegrationTest.testGetSessionsByComputerId_Success` PASS.
