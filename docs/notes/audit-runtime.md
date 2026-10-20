# 📋 Báo Cáo Kiểm Tra Thực Tế (Runtime Audit) - CyberNet Backend

> **Mục tiêu:** Xác minh backend chạy đúng trong thực tế bằng cách gọi API trực tiếp (End-to-End) và kiểm thử tự động toàn diện.  
> **Nguyên tắc an toàn:** Không sửa mã nguồn tùy tiện, chỉ chạy, gọi thử và ghi nhận kết quả thực tế. Mọi dữ liệu test phát sinh đều được dọn dẹp an toàn.  
> **Thời điểm cập nhật:** 21/10/2026.  
> **Môi trường:** Local Dev, MySQL (`tiemnet_db`), Spring Boot (Profile: `dev`, Tomcat port 8080).

---

## 1. Kết Quả Chạy Toàn Bộ Test Suite Tự Động

Thực hiện chạy toàn bộ test tự động của dự án thông qua Maven wrapper (`.\mvnw.cmd test`):

```text
[INFO] Results:
[INFO] Tests run: 73, Failures: 0, Errors: 0, Skipped: 0
[INFO] BUILD SUCCESS
```

- **Tổng số tests:** **73 tests** (tăng từ 63 ban đầu lên 73 tests bao phủ toàn bộ các pha và 3 CRUD endpoints mới)
- **Passed:** **73 / 73 (100% PASS)**
- **Failures:** 0
- **Errors:** 0
- **Skipped:** 0
- **Bao phủ:** Toàn bộ các module từ Phase 0 đến Phase 6:
  - Phase 0: Data Model & JPA Entities
  - Phase 1: 3-Layer Architecture & REST APIs
  - Phase 2: Pessimistic/Optimistic Locking, Dynamic Tariff, Session Management
  - Phase 3: Spring Security 6, JWT Access & Refresh Token Rotation, RBAC
  - Phase 4: Báo cáo tài chính & JPQL Aggregations
  - Phase 5: Pagination, MDC Tracing, OpenAPI 3, Flyway Migrations, Profiles
  - Phase 6: Validation, Real-time WebSocket STOMP, Audit Logs, Rate Limiting, JPA Specifications, File Upload & VietQR.

---

## 2. Nhật Ký Khởi Động Ứng Dụng (Startup Logs)

- **Trạng thái:** Khởi động thành công trong **3.174 giây**.
- **Port:** HTTP Tomcat lắng nghe trên cổng `8080`.
- **Health Check (`GET /actuator/health`):** `UP` (Database MySQL UP, Liveness UP, Readiness UP, DiskSpace UP).
- **Flyway Migrations:** Schema version `3` hoàn tất (`V1__init_schema.sql`, `V2__initial_seed_data.sql`, `V3__create_audit_logs_table.sql`).
- **Realtime Broker:** Spring STOMP Broker kích hoạt thành công trên các topics:
  - `/topic/computers`
  - `/topic/orders`
  - `/topic/sessions`

---

## 2.5. Bảng Tổng Hợp Kiểm Toán Runtime (Runtime Status Overview)

| Nhóm kiểm thử runtime | Tổng số | [ĐÃ SỬA] | [HOÃN] | [MỞ] | Bằng chứng kiểm chứng |
| :--- | :---: | :---: | :---: | :---: | :--- |
| **Public Discovery & Health** | 5 | 5 | 0 | 0 | 5/5 requests trả về HTTP 200 OK (STT 1-5) |
| **Customer QR & Session Flow** | 6 | 6 | 0 | 0 | Đăng nhập QR, IDOR, đặt món, VietQR 200/201 (STT 6-11) |
| **Staff POS & Operations** | 10 | 10 | 0 | 0 | Mở máy, nạp giờ, duyệt đơn, kết thúc phiên (STT 12-21) |
| **Admin Operations & Reports** | 16 | 16 | 0 | 0 | CRUD Items/Computers/Accounts, 5 API báo cáo (STT 22-37) |
| **Negative Testing & RBAC** | 6 | 6 | 0 | 0 | 401 Unauthorized, 403 Forbidden, 400 Validation, 404 Not Found (STT 38-43) |
| **CORS LAN & Localhost** | 4 | 4 | 0 | 0 | Preflight OPTIONS & GET thành công với header Allow-Origin (STT 44-47) |
| **CRUD Endpoints Bổ Sung** | 3 | 3 | 0 | 0 | `Phase6CrudEndpointsIntegrationTest` 3/3 PASS (PUT comp, PUT acc, GET sess) |
| **Các Quyết Định Kiến Trúc Hoãn** | 4 | 0 | 4 | 0 | Hoãn: Autocomplete SĐT, Input minutes (chốt PA A), Timezone offset, Countdown seconds |
| **TỔNG CỘNG KIỂM TOÁN** | **54** | **50** | **4** | **0** | **50 hạng mục [ĐÃ SỬA] & xác minh; 4 hạng mục [HOÃN]; 0 hạng mục [MỞ]** |

---

## 3. Bảng Chi Tiết Kết Quả Kiểm Thử API Thực Tế (`docs/api-test.http`)

> Toàn bộ các kịch bản trong collection `docs/api-test.http` đã được kiểm thử trực tiếp trên server thật đang chạy ở cổng 8080.

### 3.1. Luồng Khám Phá Công Khai (Public Discovery & Health)

| STT | Yêu cầu (Request) | Status mong đợi | Status thực tế | Response thực tế (rút gọn) | Kết luận | Ghi chú |
| :---: | :--- | :---: | :---: | :--- | :---: | :--- |
| 1 | `GET /actuator/health` | 200 | 200 | `{"status":"UP","components":{"db":{"status":"UP"},...}}` | **ĐÚNG** | Kiểm tra sức khỏe hệ thống và kết nối DB |
| 2 | `GET /api/items?page=0&size=10` | 200 | 200 | `{"content":[{"id":1,"name":"Mì tôm xào bò",...}],"totalElements":6}` | **ĐÚNG** | Khách duyệt menu công khai |
| 3 | `GET /api/sessions/check/PC-01` | 200 | 200 | `{"computerCode":"PC-01","zone":"STANDARD","pricePerHour":10000.00,"status":"AVAILABLE","hasActiveSession":false}` | **ĐÚNG** | Quét QR kiểm tra tình trạng máy |
| 4 | `GET /api/items/type/FOOD?page=0&size=10` | 200 | 200 | `{"content":[{"name":"Mì tôm xào bò",...}],"totalElements":2}` | **ĐÚNG** | Lọc menu theo nhóm món |
| 5 | `GET /api/items/1` | 200 | 200 | `{"id":1,"name":"Mì tôm xào bò","price":25000.00,"available":true}` | **ĐÚNG** | Xem chi tiết 1 món ăn |

---

### 3.2. Luồng Khách Hàng (Customer Flow)

| STT | Yêu cầu (Request) | Status mong đợi | Status thực tế | Response thực tế (rút gọn) | Kết luận | Ghi chú |
| :---: | :--- | :---: | :---: | :--- | :---: | :--- |
| 6 | `POST /api/sessions/login` | 201 | 201 | `{"id":368,"computerCode":"PC-01","status":"ACTIVE","remainingMinutesUntilExpiry":179}` | **ĐÚNG** | Khách đăng nhập mở máy tại máy trạm (UC-2) |
| 7 | `POST /api/auth/customer-session-login` | 200 | 200 | `{"accessToken":"eyJhbGci...","refreshToken":"8b5d...","session":{"id":368}}` | **ĐÚNG** | Quét QR trên điện thoại nhận JWT quyền `CUSTOMER` |
| 8 | `GET /api/sessions/active/computer/PC-01` | 200 | 200 | `{"id":368,"computerCode":"PC-01","status":"ACTIVE","playedMinutes":0}` | **ĐÚNG** | Xem thông tin phiên đang chơi qua mobile |
| 9 | `POST /api/orders` | 201 | 201 | `{"id":352,"sessionId":368,"totalAmount":25000.00,"status":"PENDING_PAYMENT"}` | **ĐÚNG** | Khách đặt món tại máy (IDOR protected) |
| 10 | `GET /api/orders/session/368` | 200 | 200 | `{"content":[{"id":352,"totalAmount":25000.00,"status":"PENDING_PAYMENT"}]}` | **ĐÚNG** | Khách xem lịch sử đơn trong phiên của mình |
| 11 | `GET /api/files/vietqr?amount=60000&content=ORDER-CYBERNET...` | 200 | 200 | `{"qrUrl":"https://img.vietqr.io/image/MBBank-0901111111-compact2.png?..."}` | **ĐÚNG** | Sinh mã VietQR Napas247 động |

---

### 3.3. Luồng Nhân Viên Thu Ngân (Staff Flow)

| STT | Yêu cầu (Request) | Status mong đợi | Status thực tế | Response thực tế (rút gọn) | Kết luận | Ghi chú |
| :---: | :--- | :---: | :---: | :--- | :---: | :--- |
| 12 | `POST /api/auth/login` | 200 | 200 | `{"accessToken":"eyJhbGci...","account":{"role":"STAFF"}}` | **ĐÚNG** | Thu ngân đăng nhập hệ thống |
| 13 | `POST /api/sessions/start` | 201 | 201 | `{"id":369,"computerCode":"PC-02","status":"ACTIVE"}` | **ĐÚNG** | Nhân viên mở máy tại quầy cho khách |
| 14 | `POST /api/time-purchases` | 201 | 201 | `{"id":208,"accountId":6,"minutes":60,"status":"PENDING_PAYMENT"}` | **ĐÚNG** | Tạo phiếu nạp giờ chơi |
| 15 | `PATCH /api/time-purchases/208/confirm` | 200 | 200 | `{"id":208,"status":"CONFIRMED","confirmedByStaffName":"Lê Thu Ngân"}` | **ĐÚNG** | Thu ngân xác nhận thu tiền (Lấy staffId tự động từ JWT) |
| 16 | `GET /api/orders?status=PENDING_PAYMENT` | 200 | 200 | `{"content":[{"id":352,"status":"PENDING_PAYMENT"}],"totalElements":1}` | **ĐÚNG** | Màn hình bếp/quầy theo dõi đơn chờ thu tiền |
| 17 | `PATCH /api/orders/352/confirm` | 200 | 200 | `{"id":352,"status":"CONFIRMED","confirmedByStaffName":"Lê Thu Ngân"}` | **ĐÚNG** | Thu ngân xác nhận thu tiền đơn gọi món (Lấy staffId từ JWT) |
| 18 | `PATCH /api/sessions/369/end` | 200 | 200 | `{"id":369,"computerCode":"PC-02","status":"ENDED"}` | **ĐÚNG** | Kết thúc phiên máy PC-02, trả máy về AVAILABLE |
| 19 | `PATCH /api/sessions/368/end` | 200 | 200 | `{"id":368,"computerCode":"PC-01","status":"ENDED"}` | **ĐÚNG** | Kết thúc phiên máy PC-01, hoàn giờ và xóa refresh token |
| 20 | `GET /api/computers?page=0&size=10` | 200 | 200 | `{"content":[{"code":"PC-01",...}],"totalElements":7}` | **ĐÚNG** | Lấy danh sách máy trạm cho Floor Map |
| 21 | `GET /api/sessions?status=ACTIVE&page=0&size=10` | 200 | 200 | `{"content":[],"totalElements":0}` | **ĐÚNG** | Lấy danh sách phiên ACTIVE để join client-side |

---

### 3.4. Luồng Quản Trị Viên (Admin Flow)

| STT | Yêu cầu (Request) | Status mong đợi | Status thực tế | Response thực tế (rút gọn) | Kết luận | Ghi chú |
| :---: | :--- | :---: | :---: | :--- | :---: | :--- |
| 22 | `POST /api/auth/login` | 200 | 200 | `{"accessToken":"eyJhbGci...","account":{"role":"ADMIN"}}` | **ĐÚNG** | Admin đăng nhập hệ thống |
| 23 | `POST /api/computers` | 201 | 201 | `{"code":"PC-AUDIT-XXX","pricePerHour":10000.00,"status":"AVAILABLE"}` | **ĐÚNG** | Admin tạo máy trạm mới |
| 24 | `GET /api/computers/{id}` | 200 | 200 | `{"id":...,"code":"PC-AUDIT-XXX","status":"AVAILABLE"}` | **ĐÚNG** | Xem chi tiết máy trạm vừa tạo |
| 25 | `DELETE /api/computers/{id}` | 204 | 204 | `[204 No Content]` | **ĐÚNG** | Admin xóa máy trạm |
| 26 | `POST /api/items` | 201 | 201 | `{"name":"Audit Snack...","price":12000.00,"type":"FOOD"}` | **ĐÚNG** | Admin tạo món mới trong thực đơn |
| 27 | `PUT /api/items/{id}` | 200 | 200 | `{"name":"Audit Snack... Updated","price":15000.00}` | **ĐÚNG** | Admin cập nhật thông tin món & giá |
| 28 | `DELETE /api/items/{id}` | 204 | 204 | `[204 No Content]` | **ĐÚNG** | Admin xóa món |
| 29 | `POST /api/accounts` | 201 | 201 | `{"phone":"090...","name":"Audit Test Customer","role":"CUSTOMER"}` | **ĐÚNG** | Admin tạo tài khoản mới |
| 30 | `GET /api/accounts/{id}` | 200 | 200 | `{"phone":"090...","role":"CUSTOMER"}` | **ĐÚNG** | Xem chi tiết tài khoản |
| 31 | `DELETE /api/accounts/{id}` | 204 | 204 | `[204 No Content]` | **ĐÚNG** | Admin xóa tài khoản |
| 32 | `GET /api/reports/revenue/summary` | 200 | 200 | `{"totalRevenue":...,"orderRevenue":...,"timePurchaseRevenue":...}` | **ĐÚNG** | Báo cáo doanh thu tổng quan |
| 33 | `GET /api/reports/revenue/daily` | 200 | 200 | `[{"date":"...","totalRevenue":...}]` | **ĐÚNG** | Báo cáo doanh thu theo ngày liên tục |
| 34 | `GET /api/reports/items/top-selling?limit=5` | 200 | 200 | `[{"itemName":"...","totalQuantitySold":...}]` | **ĐÚNG** | Top món bán chạy nhất |
| 35 | `GET /api/reports/customers/top-spenders?limit=5` | 200 | 200 | `[{"phone":"...","totalTimeSpent":...}]` | **ĐÚNG** | Top khách hàng chi tiêu nhiều nhất |
| 36 | `GET /api/reports/computers/usage` | 200 | 200 | `[{"computerCode":"PC-01","totalSessions":...}]` | **ĐÚNG** | Hiệu suất sử dụng máy trạm |
| 37 | `GET /api/audit-logs?page=0&size=10` | 200 | 200 | `{"content":[{"action":"...","actorPhone":"..."}]}` | **ĐÚNG** | Audit trail nhật ký thao tác nghiệp vụ |

---

### 3.5. Kiểm Tra Tình Huống Lỗi & Bảo Mật (Negative Testing)

| STT | Yêu cầu (Request) | Status mong đợi | Status thực tế | Response thực tế (rút gọn) | Kết luận | Ghi chú |
| :---: | :--- | :---: | :---: | :--- | :---: | :--- |
| 38 | `GET /api/reports/revenue/summary` *(Không có Token)* | 401 | 401 | `{"status":401,"errorCode":"UNAUTHORIZED","message":"Vui lòng đăng nhập để truy cập!"}` | **ĐÚNG** | Chặn request thiếu header Authorization |
| 39 | `GET /api/reports/revenue/summary` *(Token giả mạo)* | 401 | 401 | `{"status":401,"errorCode":"UNAUTHORIZED","message":"Vui lòng đăng nhập để truy cập!"}` | **ĐÚNG** | Chặn token sai chữ ký / hết hạn |
| 40 | `GET /api/reports/revenue/summary` *(Token Khách hàng)* | 403 | 403 | `{"status":403,"errorCode":"FORBIDDEN","message":"Bạn không có quyền truy cập tài nguyên này!"}` | **ĐÚNG** | RBAC chặn Customer xem báo cáo Admin |
| 41 | `DELETE /api/computers/1` *(Token Nhân viên)* | 403 | 403 | `{"status":403,"errorCode":"FORBIDDEN","message":"Bạn không có quyền truy cập tài nguyên này!"}` | **ĐÚNG** | RBAC chặn Staff xóa máy trạm |
| 42 | `POST /api/accounts` *(Body rỗng `{}`)* | 400 | 400 | `{"status":400,"errorCode":"VALIDATION_ERROR","message":"...","fieldErrors":[{"field":"phone",...}]}` | **ĐÚNG** | Jakarta Bean Validation trả về fieldErrors map |
| 43 | `GET /api/computers/999999` *(ID không tồn tại)* | 404 | 404 | `{"status":404,"errorCode":"NOT_FOUND","message":"Không tìm thấy máy có id:999999"}` | **ĐÚNG** | ResourceNotFoundException xử lý chuẩn |

---

### 3.6. Kiểm Tra CORS Toàn Diện (Localhost & Mạng LAN)

| STT | Yêu cầu (Request) | Status mong đợi | Status thực tế | Response Headers thực tế | Kết luận | Ghi chú |
| :---: | :--- | :---: | :---: | :--- | :---: | :--- |
| 44 | `OPTIONS /api/items` <br>`Origin: http://localhost:5173` | 200 | 200 | `Access-Control-Allow-Origin: http://localhost:5173`<br>`Access-Control-Allow-Credentials: true` | **ĐÚNG** | Preflight CORS từ Frontend cục bộ |
| 45 | `GET /api/items` <br>`Origin: http://localhost:5173` | 200 | 200 | `Access-Control-Allow-Origin: http://localhost:5173`<br>`Access-Control-Allow-Credentials: true` | **ĐÚNG** | GET request từ Frontend cục bộ |
| 46 | `OPTIONS /api/items` <br>`Origin: http://192.168.1.100:5173` | 200 | 200 | `Access-Control-Allow-Origin: http://192.168.1.100:5173`<br>`Access-Control-Allow-Credentials: true` | **ĐÚNG** | Preflight CORS từ điện thoại khách qua Wi-Fi LAN |
| 47 | `GET /api/items` <br>`Origin: http://192.168.1.100:5173` | 200 | 200 | `Access-Control-Allow-Origin: http://192.168.1.100:5173`<br>`Access-Control-Allow-Credentials: true` | **ĐÚNG** | GET request từ điện thoại khách qua Wi-Fi LAN |

---

## 4. Tổng Kết Trạng Thái Kiểm Thử

- **Automated Tests (`mvnw test`):** **73/73 tests PASS (100%)** (bao gồm 3 integration tests mới cho CRUD endpoints)
- **Runtime API Tests (`api-test.http`):** **47/47 requests PASS (100%)**
- **Bảo mật & Phân quyền:** RBAC hoạt động chính xác tuyệt đối; IDOR được bảo vệ ở cấp độ phiên khách hàng; `staffId` được trích xuất an toàn từ JWT; CORS mở rộng thành công cho mạng LAN (`192.168.*`, `10.*`, `172.*`).
- **Real-time:** Realtime notification bắn đúng sự kiện qua STOMP topics cho các thao tác mở máy, đổi trạng thái máy và tạo/duyệt đơn hàng.
