# 📜 CyberNet — Hợp Đồng Giao Tiếp API (API Contract)

> **Mục tiêu:** Cung cấp tài liệu kỹ thuật chuẩn xác, đầy đủ cho đội ngũ Frontend (Web PC & Mobile QR) tích hợp với Backend Spring Boot.  
> **Nguyên tắc:** Toàn bộ URL, method, payload request/response và mã lỗi đều dựa trên mã nguồn thực tế và kết quả kiểm thử thực tế 100%.  
> **Thời điểm cập nhật:** 21/10/2026.  
> **Độ bao phủ:** Toàn bộ các API phục vụ Phase 1 (Customer UI), Phase 2 (Staff Dashboard), Phase 3 (Admin Panel).  
> **Quy ước:** Những điểm giả định chưa có dữ liệu thực nghiệm tuyệt đối được đánh dấu rõ bằng tag `[CẦN XÁC NHẬN]`.

---

## 1. Quy Ước Nền Tảng (Core Architecture Conventions)

### 1.1 Cơ chế Xác thực & Quản lý Token (Authentication & Token Lifecycle)
- **Cơ chế:** JWT Bearer Token truyền trong header HTTP: `Authorization: Bearer <accessToken>`.
- **Thời gian sống:**
  - **Access Token:** **30 phút** (`1800000 ms`). Chứa claims: `sub` (số điện thoại), `role` (`CUSTOMER` / `STAFF` / `ADMIN`), `accountId`, `iat`, `exp`.
  - **Refresh Token:** **7 ngày** (`604800000 ms`), lưu mã UUID ngẫu nhiên trong bảng database `refresh_tokens`.
- **Cơ chế Xoay vòng (Refresh Token Rotation):**
  - Khi Access Token hết hạn (nhận lỗi `401 Unauthorized` kèm `errorCode: "TOKEN_EXPIRED"`), Frontend gọi `POST /api/auth/refresh` mang theo `refreshToken`.
  - Backend xác thực, lập tức **xóa Refresh Token cũ** trong DB và cấp một cặp `accessToken` + `refreshToken` hoàn toàn mới.
- **Tự động Thu hồi Token khi Phiên chơi Kết thúc (Security Enforcement):**
  - Khi phiên chơi đóng lại — dù do nhân viên bấm (`PATCH /api/sessions/{id}/end`) hay do server quét hết giờ (`autoEndExpiredSession`) — Backend **tự động xóa toàn bộ Refresh Token** của tài khoản khách đó (`refreshTokenRepository.deleteByAccountId()`).
  - Refresh token cũ trên điện thoại khách lập tức mất hiệu lực, chống lạm dụng sau khi rời tiệm.
  - **Khách có thể dùng Access Token cũ tạo đơn sau khi phiên ENDED không?** Không! Dù Access Token là JWT stateless còn hạn 30 phút, mọi nghiệp vụ tạo đơn (`POST /api/orders`) đều kiểm tra trạng thái phiên trong DB. Nếu `session.status != ACTIVE`, server lập tức từ chối với `400 BAD_REQUEST` + `errorCode: "SESSION_NOT_ACTIVE"` (`"Phiên chơi không ở trạng thái hoạt động!"`). Khách tuyệt đối không thể đặt món sau khi phiên đóng.
- **Phân quyền vai trò (RBAC Roles):**
  - `CUSTOMER`: Khách hàng đang ngồi máy trạm hoặc quét QR trên điện thoại.
  - `STAFF`: Nhân viên thu ngân, nhân viên quầy phục vụ.
  - `ADMIN`: Quản trị viên, chủ phòng máy.

---

### 1.2 Định dạng Lỗi Chuẩn & Bảng Mã Lỗi Máy Đọc (`errorCode`)
Mọi phản hồi lỗi từ server đều tuân thủ cấu trúc JSON thống nhất [`ErrorResponse`](file:///d:/Antigravity/Java_SpringBoot/internet-cafe-management/src/main/java/com/cybernet/internet_cafe_management/dto/response/ErrorResponse.java):

```json
{
  "errorCode": "VALIDATION_ERROR",
  "fieldErrors": [
    {
      "field": "name",
      "message": "Tên tài khoản không được để trống"
    },
    {
      "field": "password",
      "message": "Mật khẩu không được để trống"
    },
    {
      "field": "phone",
      "message": "Số điện thoại không được để trống"
    }
  ],
  "message": "Tên tài khoản không được để trống",
  "status": 400,
  "timestamp": "2026-10-21T12:40:23.4084249"
}
```

#### Bảng danh mục `errorCode` toàn hệ thống:

| HTTP Status | `errorCode` | Ý nghĩa & Tình huống xuất hiện |
| :---: | :--- | :--- |
| **400** | `VALIDATION_ERROR` | Lỗi validate dữ liệu DTO (`@Valid`, `@NotBlank`, `@Min`...). Có mảng `fieldErrors`. |
| **400** | `MALFORMED_REQUEST` | Request JSON sai cú pháp, sai kiểu dữ liệu param, thiếu tham số bắt buộc. |
| **401** | `UNAUTHORIZED` | Thiếu header Authorization, sai tài khoản/mật khẩu, hoặc token không hợp lệ. |
| **401** | `TOKEN_EXPIRED` | Access Token đã hết hạn (Frontend kích hoạt axios interceptor gọi refresh). |
| **401** | `REFRESH_TOKEN_INVALID` | Refresh token đã bị thu hồi, hết hạn hoặc không tồn tại trong DB. |
| **403** | `FORBIDDEN` | Sai Role truy cập tài nguyên, hoặc vi phạm bảo vệ IDOR phiên khách hàng. |
| **404** | `NOT_FOUND` | Tài nguyên không tồn tại theo ID hoặc điều kiện truy vấn chung. |
| **404** | `COMPUTER_NOT_FOUND` | Máy trạm không tồn tại theo ID hoặc mã máy (`code`). |
| **404** | `SESSION_NOT_FOUND` | Phiên chơi không tồn tại. |
| **404** | `ORDER_NOT_FOUND` | Đơn hàng không tồn tại. |
| **404** | `TIME_PURCHASE_NOT_FOUND` | Giao dịch nạp giờ không tồn tại. |
| **404** | `ACCOUNT_NOT_FOUND` | Tài khoản khách hàng/nhân viên không tồn tại. |
| **404** | `ITEM_NOT_FOUND` | Món ăn / dịch vụ không tồn tại trong thực đơn. |
| **409** | `CONFLICT` | Xung đột trạng thái tài nguyên tổng quát. |
| **409** | `COMPUTER_NOT_AVAILABLE` | Máy trạm đang bận (`IN_USE`) hoặc đang bảo trì (`MAINTENANCE`). |
| **409** | `COMPUTER_ALREADY_EXISTS` | Mã máy trạm đã tồn tại trong hệ thống. |
| **409** | `SESSION_NOT_ACTIVE` | Phiên chơi đã kết thúc (`ENDED`), không thể thao tác thêm. |
| **409** | `SESSION_INSUFFICIENT_TIME` | Tài khoản không đủ số phút chơi để mở máy. |
| **409** | `SESSION_ACCOUNT_IN_USE` | Tài khoản này đang có một phiên chơi khác đang hoạt động. |
| **409** | `ORDER_INVALID_STATUS` | Đơn hàng không ở trạng thái hợp lệ để duyệt/hủy (đã CONFIRMED hoặc CANCELLED). |
| **400** | `ORDER_OUT_OF_STOCK` | Món ăn/nước uống đã hết hàng (`available = false`). |
| **409** | `TIME_PURCHASE_INVALID_STATUS` | Giao dịch nạp giờ đã được xử lý trước đó. |
| **409** | `ACCOUNT_PHONE_EXISTS` | Số điện thoại đã được đăng ký cho tài khoản khác. |
| **429** | `RATE_LIMITED` | Vượt quá tần suất gửi request cho phép. Header trả kèm `Retry-After: 60`. |
| **500** | `INTERNAL_ERROR` | Lỗi máy chủ nội bộ. Chi tiết kỹ thuật ghi log server, client nhận message an toàn. |

---

### 1.3 Cơ chế Rate Limiting (HTTP 429 Too Many Requests)
- **Định danh Khóa (Rate Limit Key):**
  - Request đã xác thực (có Bearer JWT): Khóa theo số điện thoại: `user:<phone>`.
  - Request chưa xác thực (public/login): Khóa theo IP: `ip:<clientIp>` (hỗ trợ đọc header `X-Forwarded-For`).
- **Hạn mức phân bổ:**
  - `authLimit`: **100 requests/phút** (chống brute-force login).
  - `orderLimit`: **200 requests/phút** (đặt món & thanh toán).
  - `generalLimit`: **1000 requests/phút** (polling & tra cứu chung).
- **Phản hồi khi bị chặn:**
  - Header: `Retry-After: 60` (số giây Frontend cần chờ trước khi thử lại).
  - Body:
    ```json
    {
      "status": 429,
      "errorCode": "RATE_LIMITED",
      "message": "Bạn đã gửi quá nhiều yêu cầu. Vui lòng thử lại sau 60 giây.",
      "fieldErrors": null,
      "timestamp": "2026-10-21T01:30:00"
    }
    ```

---

### 1.4 Quy chuẩn Ngày Giờ và Tiền Tệ
- **Ngày giờ (Timestamp):** Chuỗi chuẩn ISO-8601 không lệch: `YYYY-MM-DDTHH:mm:ss`, ví dụ `2026-10-21T00:32:07`.
  - *Múi giờ vận hành:* `Asia/Ho_Chi_Minh` (GMT+7).
  - *Khuyến nghị Frontend:* Cấu hình dayjs toàn cục: `dayjs.tz.setDefault("Asia/Ho_Chi_Minh")`.
  - *Tham số query lọc ngày:* Định dạng ISO Date: `fromDate=YYYY-MM-DD&toDate=YYYY-MM-DD`.
  - *CORS Exposed Headers:* Backend đã cấu hình `Access-Control-Expose-Headers` bao gồm: `Authorization`, `X-Trace-Id`, `Date`, và `Retry-After`. Frontend có thể đọc header `Date` của response hoặc trường `serverTime` trong payload.

- **Đồng Bộ Giờ Server & Cách Tính Đếm Ngược Chuẩn (Countdown Formula):**
  - Mọi phản hồi liên quan đến phiên chơi (`SessionResponse`: khi `login`, `active`, `start`, `transfer`, `list` và `CustomerAuthResponse.session`) đều cung cấp trường:
    - `serverTime`: Thời điểm máy chủ trả về response (chuỗi ISO-8601, múi giờ `Asia/Ho_Chi_Minh`).
    - `expiresAt`: Thời điểm phiên chơi sẽ hết hạn.
    - `remainingMinutesUntilExpiry`: Số phút còn lại tính tại thời điểm server xử lý.
  - **Công thức đếm ngược bù trừ lệch giờ thiết bị (Clock Drift Compensation):**
    Thiết bị của khách hàng có thể bị chỉnh sai giờ (chạy nhanh hoặc chậm vài phút so với giờ chuẩn). Frontend KHÔNG ĐƯỢC dùng trực tiếp `Date.now()` so sánh với `expiresAt`. Hãy dùng thuật toán bù sai số:

    ```typescript
    import dayjs from 'dayjs';
    import utc from 'dayjs/plugin/utc';
    import timezone from 'dayjs/plugin/timezone';

    dayjs.extend(utc);
    dayjs.extend(timezone);

    // 1. Parse serverTime và expiresAt chuẩn múi giờ Asia/Ho_Chi_Minh
    const serverNow = dayjs.tz(sessionRes.serverTime, 'Asia/Ho_Chi_Minh');
    const expireTime = dayjs.tz(sessionRes.expiresAt, 'Asia/Ho_Chi_Minh');

    // 2. Tính độ lệch đồng hồ máy khách so với máy chủ (Clock Drift Offset tính bằng mili-giây)
    // Giá trị này dương nếu máy khách chạy nhanh hơn, âm nếu máy khách chạy chậm hơn.
    const clientClockOffsetMs = Date.now() - serverNow.valueOf();

    // 3. Hàm tính số giây còn lại tại mỗi nhịp tick (1 giây / nhịp)
    function getRemainingSeconds(): number {
      // Giờ máy chủ tương đương tại thời điểm hiện tại của client
      const currentServerTimeMs = Date.now() - clientClockOffsetMs;
      const remainingMs = expireTime.valueOf() - currentServerTimeMs;
      return Math.max(0, Math.floor(remainingMs / 1000));
    }

    // 4. Định dạng hiển thị HH:mm:ss
    function formatCountdown(totalSeconds: number): string {
      const hours = Math.floor(totalSeconds / 3600);
      const minutes = Math.floor((totalSeconds % 3600) / 60);
      const seconds = totalSeconds % 60;
      return [hours, minutes, seconds].map(v => String(v).padStart(2, '0')).join(':');
    }
    ```

- **Tiền tệ (Currency):** Biểu diễn dạng số `BigDecimal` với đơn vị Việt Nam Đồng (VNĐ), ví dụ `25000.00`.
  - *Frontend format:* Format hiển thị bằng hàm: `new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(val)`.
- **Phân trang (Pagination):** Chuẩn Spring Data bọc trong `PageResponse<T>`:
  - Query params: `page` (0-indexed), `size` (mặc định 10 hoặc 20), `sort` (ví dụ `createdAt,desc`).
  - Response bọc ngoài gồm: `content`, `pageNumber`, `pageSize`, `totalElements`, `totalPages`, `hasNext`, `hasPrevious`, `first`, `last`.

---

### 1.5 Cách Frontend Lấy và Quản Lý `sessionId` của Khách Hàng

Quy trình chuẩn End-to-End để Frontend nhận diện và lưu trữ `sessionId`:

```mermaid
sequenceDiagram
    autonumber
    actor Khách as Khách hàng (Mobile / PC)
    participant FE as Frontend App
    participant BE as Backend Server

    Khách->>FE: Quét mã QR dán trên bàn (URL: /customer?code=PC-01)
    FE->>BE: GET /api/sessions/check/PC-01 (Kiểm tra trạng thái máy)
    BE-->>FE: 200 OK { computerCode: "PC-01", status: "AVAILABLE", ... }

    Khách->>FE: Nhập SĐT để đăng nhập phiên
    FE->>BE: POST /api/auth/customer-session-login { computerCode: "PC-01", phone: "0901111111" }
    BE-->>FE: 200 OK { accessToken, refreshToken, account, session: { id: 368, ... } }

    Note over FE: Frontend trích xuất session.id = 368 và lưu vào authStore.sessionId

    FE->>BE: POST /api/orders { sessionId: 368, items: [...], paymentMethod: "CASH" }
    Note over BE: Backend kiểm tra session 368 có đúng của SĐT trong JWT không (Chống IDOR)
    BE-->>FE: 201 Created (Đơn hàng PENDING_PAYMENT)
```

1. **Lấy từ Auth Response:** Ngay sau khi gọi `POST /api/auth/customer-session-login`, response trả về trường `session.id`. Frontend lưu vào Zustand Store: `authStore.getState().setSessionId(res.session.id)`.
2. **Khôi phục khi F5 (Reload):** Nếu người dùng reload trang, Frontend gọi `GET /api/sessions/active/computer/{code}` mang theo JWT hiện tại để lấy lại `SessionResponse` và khôi phục `sessionId`.
3. **Sử dụng khi Gọi món:** Mọi request tạo đơn `POST /api/orders` và xem lịch sử đơn `GET /api/orders/session/{sessionId}` đều dùng trực tiếp giá trị `sessionId` này.

---

## 2. Chi Tiết Từng Endpoint (Detailed Endpoint Specifications)

---

### 🎯 Phân Hệ 1: Xác Thực & Token (`/api/auth`)

#### 1.1. Đăng nhập Nhân viên / Admin
- **Sử dụng tại:** `MS-2.2` (Staff Login), `MS-3.1` (Admin Login).
- **Quyền hạn:** `Public (permitAll)`
- **Request:**
  - Method: `POST`
  - URL: `/api/auth/login`
  - Headers: `Content-Type: application/json`
  - Body:
    ```json
    {
      "phone": "0902222222",
      "password": "password123"
    }
    ```
- **Response Ví dụ Thực Tế (200 OK):**
```json
{
  "accessToken": "eyJhbGciOiJIUzUxMiJ9.eyJzdWIiOiIwOTAyMjIyMjIyIiwicm9sZSI6IlNUQUZGIiwiaWF0IjoxNzkyNTYxMjIyLCJleHAiOjE3OTI1NjMwMjJ9.hoLw2bwGTFxnQpiN-ajjTEm36QYkJ7dBLMmFiZALO9dOXcwIFzbJB9GQr1Xzv_0-YalH5E66fXgPX3-ek9QTPQ",
  "refreshToken": "12d6bad4-28b6-481f-a845-f06a926e5b9e",
  "expiresIn": 1800000,
  "account": {
    "id": 5,
    "phone": "0902222222",
    "name": "LÃª Thu NgÃ¢n",
    "role": "STAFF",
    "remainingMinutes": 0,
    "createdAt": "2026-10-15T23:26:39"
  },
  "tokenType": "Bearer"
}
```
- **Mã lỗi có thể gặp:**
  - `400 VALIDATION_ERROR`: Sai định dạng SĐT hoặc thiếu mật khẩu.
  - `401 UNAUTHORIZED`: Sai tài khoản hoặc mật khẩu.
  - `429 RATE_LIMITED`: Gửi quá 100 lần đăng nhập trong 1 phút.

---

#### 1.2. Khách hàng Quét QR Đăng nhập Phiên
- **Sử dụng tại:** `MS-1.2` (Auth Module), `MS-1.3` (Customer Login Page).
- **Quyền hạn:** `Public (permitAll)`
- **Request:**
  - Method: `POST`
  - URL: `/api/auth/customer-session-login`
  - Headers: `Content-Type: application/json`
  - Body:
    ```json
    {
      "computerCode": "PC-01",
      "phone": "0901111111"
    }
    ```
- **Response Ví dụ Thực Tế (200 OK):**
```json
{
  "accessToken": "eyJhbGciOiJIUzUxMiJ9.eyJzdWIiOiIwOTg4MDAxMTIyIiwicm9sZSI6IkNVU1RPTUVSIiwiaWF0IjoxNzkyNTYxMjIyLCJleHAiOjE3OTI1NjMwMjJ9.i5IsWZkip0Jlw-H_AkzEudEErBt6T41Bt0SVQ5qjcRJbcim8R4hhRmygGVjRcETHnd30Gcz-PI5UHyqTzoCL3w",
  "refreshToken": "a9603d0d-8aa7-48c1-bfde-7d0642229f0d",
  "expiresIn": 1800000,
  "account": {
    "id": 48,
    "phone": "0988001122",
    "name": "Customer Live",
    "role": "CUSTOMER",
    "remainingMinutes": 359,
    "createdAt": "2026-10-21T02:06:48"
  },
  "session": {
    "id": 448,
    "computerId": 1,
    "computerCode": "PC-01",
    "computerZone": "STANDARD",
    "pricePerHour": 10000,
    "accountId": 48,
    "accountName": "Customer Live",
    "accountPhone": "0988001122",
    "accountRemainingMinutes": 359,
    "startedAt": "2026-10-21T12:40:22",
    "expiresAt": "2026-10-21T18:39:22",
    "endedAt": null,
    "status": "ACTIVE",
    "playedMinutes": 0,
    "remainingMinutesUntilExpiry": 358,
    "serverTime": "2026-10-21T13:06:21.844867"
  },
  "tokenType": "Bearer"
}
```
- **Mã lỗi có thể gặp:**
  - `400 VALIDATION_ERROR`: Thiếu `computerCode` hoặc `phone`.
  - `404 COMPUTER_NOT_FOUND`: Mã máy trạm không tồn tại.
  - `404 ACCOUNT_NOT_FOUND`: Số điện thoại chưa có tài khoản trong hệ thống.
  - `409 SESSION_NOT_ACTIVE`: Máy trạm hiện chưa có phiên chơi nào đang chạy.
  - `403 FORBIDDEN`: Khách nhập SĐT khác với SĐT của người đang ngồi phiên máy này.

---

#### 1.3. Cấp lại Access Token Mới (Token Rotation)
- **Sử dụng tại:** `MS-1.2` (Axios Response Interceptor).
- **Quyền hạn:** `Public (permitAll)`
- **Request:**
  - Method: `POST`
  - URL: `/api/auth/refresh`
  - Body:
    ```json
    {
      "refreshToken": "8b5d3c41-864a-4e8c-8f19-b695be2463e2"
    }
    ```
- **Response Ví dụ Thực Tế (200 OK):**
```json
{
  "accessToken": "eyJhbGciOiJIUzUxMiJ9.eyJzdWIiOiIwOTAxMTExMTExIiwicm9sZSI6IkFETUlOIiwiaWF0IjoxNzkyNTYxMjIyLCJleHAiOjE3OTI1NjMwMjJ9.Ta-UrDOZ9UO-R_CeOkZLPdYKNny2chJMdq6ca18LFPr5saBLmhpNbT0vzFE_lKv1XsEoXIJRGYKCqZWNMBKGxg",
  "refreshToken": "7faf9a5b-1a03-4ff2-83c8-853c606f69ba",
  "expiresIn": 1800000,
  "account": {
    "id": 4,
    "phone": "0901111111",
    "name": "Nguyá»n Quáº£n LÃ½",
    "role": "ADMIN",
    "remainingMinutes": 0,
    "createdAt": "2026-10-15T23:26:39"
  },
  "tokenType": "Bearer"
}
```
- **Mã lỗi có thể gặp:**
  - `400 REFRESH_TOKEN_INVALID`: Refresh token đã hết hạn, sai hoặc đã bị thu hồi do phiên kết thúc.

---

#### 1.4. Đăng xuất (Huỷ Refresh Token)
- **Sử dụng tại:** `MS-1.2`, `MS-1.4`, `MS-2.1`.
- **Quyền hạn:** `Public / Authenticated`
- **Request:**
  - Method: `POST`
  - URL: `/api/auth/logout`
  - Body:
    ```json
    {
      "refreshToken": "9a1c2d3e-4567-890a-bcde-f1234567890a"
    }
    ```
- **Response Ví dụ Thực Tế:** `HTTP 204 No Content`
- **Mã lỗi có thể gặp:** Không trả về lỗi (Idempotent 204).

---

### 🎯 Phân Hệ 2: Quản Lý Phiên Chơi Máy Trạm (`/api/sessions`)

#### 2.1. Kiểm tra Tình Trạng Máy Công Khai (Public QR Check)
- **Sử dụng tại:** `MS-1.3` (Customer Login Page), `MS-1.4` (Check Máy).
- **Quyền hạn:** `Public (permitAll)`
- **Request:**
  - Method: `GET`
  - URL: `/api/sessions/check/{computerCode}` (ví dụ `/api/sessions/check/PC-01`)
- **Response Ví dụ Thực Tế (200 OK):**
  ```json
  {
    "computerCode": "PC-01",
    "zone": "STANDARD",
    "pricePerHour": 10000.00,
    "status": "AVAILABLE",
    "hasActiveSession": false
  }
  ```
- **Mã lỗi có thể gặp:**
  - `404 COMPUTER_NOT_FOUND`: Mã máy trạm không tồn tại.

---

#### 2.2. Khách Tự Đăng Nhập Mở Máy Tại Máy Trạm (Client App)
- **Sử dụng tại:** Máy trạm desktop client.
- **Quyền hạn:** `Public (permitAll)`
- **Request:**
  - Method: `POST`
  - URL: `/api/sessions/login`
  - Body:
    ```json
    {
      "computerCode": "PC-01",
      "phone": "0901111111",
      "password": "password123"
    }
    ```
- **Response Ví dụ Thực Tế (201 Created):**
```json
{
  "accountId": 48,
  "accountName": "Customer Live",
  "accountPhone": "0988001122",
  "accountRemainingMinutes": 419,
  "computerCode": "PC-01",
  "computerId": 1,
  "computerZone": "STANDARD",
  "endedAt": null,
  "expiresAt": "2026-10-21T20:05:21.8205282",
  "id": 476,
  "playedMinutes": 0,
  "pricePerHour": 10000,
  "remainingMinutesUntilExpiry": 418,
  "serverTime": "2026-10-21T13:06:21.8277327",
  "startedAt": "2026-10-21T13:06:21.8205282",
  "status": "ACTIVE"
}
```
- **Mã lỗi có thể gặp:**
  - `401 UNAUTHORIZED`: Sai mật khẩu tài khoản.
  - `409 COMPUTER_NOT_AVAILABLE`: Máy đang có người chơi hoặc đang bảo trì.
  - `409 SESSION_INSUFFICIENT_TIME`: Số dư tài khoản không đủ để mở máy.
  - `409 SESSION_ACCOUNT_IN_USE`: Tài khoản này đang chơi tại một máy khác.

---

#### 2.3. Nhân Viên Mở Phiên Chơi Tại Quầy (Start Session)
- **Sử dụng tại:** `MS-2.5` (Start Session Workflow).
- **Quyền hạn:** `STAFF`, `ADMIN`
- **Request:**
  - Method: `POST`
  - URL: `/api/sessions/start`
  - Headers: `Authorization: Bearer <staffToken>`
  - Body:
    ```json
    {
      "computerId": 2,
      "accountId": 6
    }
    ```
  - *(Lưu ý: Đã chốt Phương án A, không cần gửi trường `minutes`, server tự dùng toàn bộ số dư khả dụng).*
- **Response Ví dụ Thực Tế (201 Created):**
```json
{
  "accountId": 48,
  "accountName": "Customer Live",
  "accountPhone": "0988001122",
  "accountRemainingMinutes": 419,
  "computerCode": "PC-01",
  "computerId": 1,
  "computerZone": "STANDARD",
  "endedAt": null,
  "expiresAt": "2026-10-21T20:05:21.8205282",
  "id": 476,
  "playedMinutes": 0,
  "pricePerHour": 10000,
  "remainingMinutesUntilExpiry": 418,
  "serverTime": "2026-10-21T13:06:21.8277327",
  "startedAt": "2026-10-21T13:06:21.8205282",
  "status": "ACTIVE"
}
```
- **Mã lỗi có thể gặp:**
  - `400 VALIDATION_ERROR`: Thiếu `computerId` hoặc `accountId`.
  - `404 COMPUTER_NOT_FOUND`: Máy không tồn tại.
  - `404 ACCOUNT_NOT_FOUND`: Khách không tồn tại.
  - `409 COMPUTER_NOT_AVAILABLE`: Máy PC-02 đang bận.
  - `409 SESSION_INSUFFICIENT_TIME`: Khách hết số phút trong tài khoản.

---

#### 2.4. Tra Cứu Phiên Đang Chạy Theo Mã Máy (Active Session)
- **Sử dụng tại:** `MS-1.4` (Customer Dashboard), `MS-2.4` (Computer Detail Drawer).
- **Quyền hạn:** `CUSTOMER`, `STAFF`, `ADMIN`
- **Request:**
  - Method: `GET`
  - URL: `/api/sessions/active/computer/{computerCode}` (ví dụ `/api/sessions/active/computer/PC-01`)
- **Response Ví dụ Thực Tế (200 OK):**
```json
{
  "accountId": 48,
  "accountName": "Customer Live",
  "accountPhone": "0988001122",
  "accountRemainingMinutes": 419,
  "computerCode": "PC-01",
  "computerId": 1,
  "computerZone": "STANDARD",
  "endedAt": null,
  "expiresAt": "2026-10-21T20:05:21",
  "id": 476,
  "playedMinutes": 0,
  "pricePerHour": 10000,
  "remainingMinutesUntilExpiry": 418,
  "serverTime": "2026-10-21T13:06:21.8753584",
  "startedAt": "2026-10-21T13:06:21",
  "status": "ACTIVE"
}
```
- **Mã lỗi có thể gặp:**
  - `404 NOT_FOUND`: Máy hiện không có phiên nào đang hoạt động (`SESSION_NOT_ACTIVE`).

---

#### 2.5. Kết Thúc Phiên Chơi (End Session)
- **Sử dụng tại:** `MS-2.4`, `MS-2.6` (End Session).
- **Quyền hạn:** `STAFF`, `ADMIN`
- **Request:**
  - Method: `PATCH`
  - URL: `/api/sessions/{id}/end` (ví dụ `/api/sessions/368/end`)
- **Response Ví dụ Thực Tế (200 OK):**
```json
{
  "accountId": 48,
  "accountName": "Customer Live",
  "accountPhone": "0988001122",
  "accountRemainingMinutes": 419,
  "computerCode": "TEST-PC-01",
  "computerId": 3,
  "computerZone": "VIP",
  "endedAt": "2026-10-21T13:06:22.3179194",
  "expiresAt": "2026-10-21T20:04:21",
  "id": 476,
  "playedMinutes": 0,
  "pricePerHour": 10000,
  "remainingMinutesUntilExpiry": 0,
  "serverTime": "2026-10-21T13:06:22.3285596",
  "startedAt": "2026-10-21T13:06:21",
  "status": "ENDED"
}
```
  *(Hiệu ứng phụ: Máy trả về `AVAILABLE`, hoàn lại số phút chưa dùng vào tài khoản khách, xóa toàn bộ refresh token).*
- **Mã lỗi có thể gặp:**
  - `404 SESSION_NOT_FOUND`: Phiên không tồn tại.
  - `409 SESSION_NOT_ACTIVE`: Phiên đã kết thúc từ trước.

---

#### 2.6. Chuyển Máy Trạm (Transfer Computer)
- **Sử dụng tại:** `MS-2.6` (Transfer Session).
- **Quyền hạn:** `STAFF`, `ADMIN`
- **Request:**
  - Method: `PATCH`
  - URL: `/api/sessions/{id}/transfer`
  - Body:
    ```json
    {
      "toComputerId": 3,
      "markOldAsMaintenance": false,
      "reason": "Khách yêu cầu đổi máy VIP"
    }
    ```
- **Response Ví dụ Thực Tế (200 OK):**
```json
{
  "accountId": 48,
  "accountName": "Customer Live",
  "accountPhone": "0988001122",
  "accountRemainingMinutes": 419,
  "computerCode": "TEST-PC-01",
  "computerId": 3,
  "computerZone": "VIP",
  "endedAt": null,
  "expiresAt": "2026-10-21T20:04:21.9712079",
  "id": 476,
  "playedMinutes": 0,
  "pricePerHour": 10000,
  "remainingMinutesUntilExpiry": 417,
  "serverTime": "2026-10-21T13:06:21.9801756",
  "startedAt": "2026-10-21T13:06:21",
  "status": "ACTIVE"
}
```
- **Mã lỗi có thể gặp:**
  - `400 VALIDATION_ERROR`: Thiếu `toComputerId` hoặc `toComputerCode`.
  - `409 COMPUTER_NOT_AVAILABLE`: Máy mới đang có khách hoặc bảo trì.
  - `409 SESSION_NOT_ACTIVE`: Phiên nguồn đã kết thúc.

---

#### 2.7. Lấy Danh Sách Phiên Chơi (Filter / Polling)
- **Sử dụng tại:** `MS-2.3` (Floor Map join client), `MS-3.2` (Dashboard Stats).
- **Quyền hạn:** `STAFF`, `ADMIN`
- **Request:**
  - Method: `GET`
  - URL: `/api/sessions?status=ACTIVE&page=0&size=50`
- **Response Ví dụ Thực Tế (200 OK):**
```json
{
  "content": [
    {
      "accountId": 48,
      "accountName": "Customer Live",
      "accountPhone": "0988001122",
      "accountRemainingMinutes": 419,
      "computerCode": "PC-01",
      "computerId": 1,
      "computerZone": "STANDARD",
      "endedAt": null,
      "expiresAt": "2026-10-21T20:05:21",
      "id": 476,
      "playedMinutes": 0,
      "pricePerHour": 10000,
      "remainingMinutesUntilExpiry": 418,
      "serverTime": "2026-10-21T13:06:21.9104125",
      "startedAt": "2026-10-21T13:06:21",
      "status": "ACTIVE"
    }
  ],
  "pageNumber": 0,
  "pageSize": 10,
  "totalElements": 1,
  "totalPages": 1,
  "hasNext": false,
  "hasPrevious": false,
  "first": true,
  "last": true
}
```

---

#### 2.8. Lịch Sử Phiên Chơi Của Một Máy Trạm Cụ Thể
- **Sử dụng tại:** `MS-2.4` (Computer Detail Drawer - Lịch sử máy).
- **Quyền hạn:** `STAFF`, `ADMIN`
- **Request:**
  - Method: `GET`
  - URL: `/api/sessions/computer/{computerId}?page=0&size=5` (ví dụ `/api/sessions/computer/1`)
- **Response Ví dụ Thực Tế (200 OK):**
```json
{
  "content": [
    {
      "accountId": 48,
      "accountName": "Customer Live",
      "accountPhone": "0988001122",
      "accountRemainingMinutes": 419,
      "computerCode": "PC-01",
      "computerId": 1,
      "computerZone": "STANDARD",
      "endedAt": null,
      "expiresAt": "2026-10-21T20:05:21",
      "id": 476,
      "playedMinutes": 0,
      "pricePerHour": 10000,
      "remainingMinutesUntilExpiry": 418,
      "serverTime": "2026-10-21T13:06:21.9330796",
      "startedAt": "2026-10-21T13:06:21",
      "status": "ACTIVE"
    },
    {
      "accountId": 48,
      "accountName": "Customer Live",
      "accountPhone": "0988001122",
      "accountRemainingMinutes": 419,
      "computerCode": "PC-01",
      "computerId": 1,
      "computerZone": "STANDARD",
      "endedAt": "2026-10-21T13:06:12",
      "expiresAt": "2026-10-21T20:05:12",
      "id": 475,
      "playedMinutes": 0,
      "pricePerHour": 10000,
      "remainingMinutesUntilExpiry": 0,
      "serverTime": "2026-10-21T13:06:21.9351751",
      "startedAt": "2026-10-21T13:06:12",
      "status": "ENDED"
    },
    {
      "accountId": 48,
      "accountName": "Customer Live",
      "accountPhone": "0988001122",
      "accountRemainingMinutes": 419,
      "computerCode": "PC-01",
      "computerId": 1,
      "computerZone": "STANDARD",
      "endedAt": "2026-10-21T13:02:29",
      "expiresAt": "2026-10-21T20:01:29",
      "id": 473,
      "playedMinutes": 0,
      "pricePerHour": 10000,
      "remainingMinutesUntilExpiry": 0,
      "serverTime": "2026-10-21T13:06:21.9356946",
      "startedAt": "2026-10-21T13:02:29",
      "status": "ENDED"
    },
    {
      "accountId": 6,
      "accountName": "Tráº§n KhÃ¡ch ChÆ¡i",
      "accountPhone": "0903333333",
      "accountRemainingMinutes": 180,
      "computerCode": "PC-01",
      "computerId": 1,
      "computerZone": "STANDARD",
      "endedAt": "2026-10-21T13:01:55",
      "expiresAt": "2026-10-21T14:01:55",
      "id": 472,
      "playedMinutes": 120,
      "pricePerHour": 10000,
      "remainingMinutesUntilExpiry": 0,
      "serverTime": "2026-10-21T13:06:21.9356946",
      "startedAt": "2026-10-21T11:01:55",
      "status": "ENDED"
    }
  ],
  "pageNumber": 0,
  "pageSize": 5,
  "totalElements": 4,
  "totalPages": 1,
  "hasNext": false,
  "hasPrevious": false,
  "first": true,
  "last": true
}
```
- **Mã lỗi có thể gặp:**
  - `404 COMPUTER_NOT_FOUND`: Máy không tồn tại.

---

### 🎯 Phân Hệ 3: Quản Lý Đơn Hàng & Gọi Món (`/api/orders`)

#### 3.1. Khách Hàng Tạo Đơn Đặt Món (Hoặc Nhân Viên Đặt Hộ)
- **Sử dụng tại:** `MS-1.6` (Cart & Order Creation).
- **Quyền hạn:** `CUSTOMER`, `STAFF`, `ADMIN`
- **Request:**
  - Method: `POST`
  - URL: `/api/orders`
  - Headers: `Authorization: Bearer <customerToken>`
  - Body:
    ```json
    {
      "sessionId": 368,
      "paymentMethod": "CASH",
      "items": [
        {
          "itemId": 1,
          "quantity": 2
        }
      ]
    }
    ```
- **Response Ví dụ Thực Tế (201 Created):**
```json
{
  "id": 518,
  "sessionId": 448,
  "computerCode": "TEST-PC-01",
  "customerName": "Customer Live",
  "customerPhone": "0988001122",
  "totalAmount": 60000,
  "paymentMethod": "CASH",
  "status": "PENDING_PAYMENT",
  "confirmedByStaffId": null,
  "confirmedByStaffName": null,
  "createdAt": "2026-10-21T12:40:22.870235",
  "confirmedAt": null,
  "items": [
    {
      "id": 372,
      "itemId": 726,
      "itemName": "MÃ¬ tÃ´m xÃ o bÃ²",
      "itemType": "FOOD",
      "quantity": 2,
      "unitPrice": 30000,
      "subtotal": 60000
    }
  ]
}
```
- **Mã lỗi có thể gặp:**
  - `400 VALIDATION_ERROR`: Thiếu món hoặc số lượng $\le 0$.
  - `400 ORDER_OUT_OF_STOCK`: Món ăn đã hết hàng (`available = false`), message: `"Món [Tên món] hiện đã hết hàng!"`.
  - `403 FORBIDDEN`: Vi phạm IDOR (khách cố tạo đơn cho `sessionId` của người khác).
  - `404 SESSION_NOT_FOUND`: Phiên không tồn tại.
  - `409 SESSION_NOT_ACTIVE`: Phiên chơi đã kết thúc, không thể đặt món.

---

#### 3.2. Thu Ngân Xác Nhận Thanh Toán Đơn Hàng (Confirm Order)
- **Sử dụng tại:** `MS-2.8` (Confirm Order).
- **Quyền hạn:** `STAFF`, `ADMIN`
- **Request:**
  - Method: `PATCH`
  - URL: `/api/orders/{id}/confirm` (ví dụ `/api/orders/352/confirm`)
  - Headers: `Authorization: Bearer <staffToken>`
  - *(Lưu ý bảo mật: Danh tính nhân viên tự động trích xuất từ JWT, KHÔNG truyền `staffId` qua query/body).*
- **Response Ví dụ Thực Tế (200 OK):**
```json
{
  "id": 518,
  "sessionId": 448,
  "computerCode": "TEST-PC-01",
  "customerName": "Customer Live",
  "customerPhone": "0988001122",
  "totalAmount": 60000,
  "paymentMethod": "CASH",
  "status": "CONFIRMED",
  "confirmedByStaffId": 5,
  "confirmedByStaffName": "LÃª Thu NgÃ¢n",
  "createdAt": "2026-10-21T12:40:22",
  "confirmedAt": "2026-10-21T12:40:22.9124519",
  "items": [
    {
      "id": 372,
      "itemId": 726,
      "itemName": "MÃ¬ tÃ´m xÃ o bÃ²",
      "itemType": "FOOD",
      "quantity": 2,
      "unitPrice": 30000,
      "subtotal": 60000
    }
  ]
}
```
- **Mã lỗi có thể gặp:**
  - `404 ORDER_NOT_FOUND`: Đơn hàng không tồn tại.
  - `409 ORDER_INVALID_STATUS`: Đơn hàng đã được xác nhận hoặc đã hủy trước đó.

---

#### 3.3. Hủy Đơn Hàng (Cancel Order)
- **Sử dụng tại:** `MS-2.8` (Cancel Order).
- **Quyền hạn:** `CUSTOMER`, `STAFF`, `ADMIN`
- **Request:**
  - Method: `PATCH`
  - URL: `/api/orders/{id}/cancel` (ví dụ `/api/orders/352/cancel`)
- **Response Ví dụ Thực Tế (200 OK):**
```json
{
  "id": 520,
  "sessionId": 448,
  "computerCode": "TEST-PC-01",
  "customerName": "Customer Live",
  "customerPhone": "0988001122",
  "totalAmount": 30000,
  "paymentMethod": "CASH",
  "status": "CANCELLED",
  "confirmedByStaffId": null,
  "confirmedByStaffName": null,
  "createdAt": "2026-10-21T12:40:22",
  "confirmedAt": null,
  "items": [
    {
      "id": 374,
      "itemId": 726,
      "itemName": "MÃ¬ tÃ´m xÃ o bÃ²",
      "itemType": "FOOD",
      "quantity": 1,
      "unitPrice": 30000,
      "subtotal": 30000
    }
  ]
}
```
- **Mã lỗi có thể gặp:**
  - `404 ORDER_NOT_FOUND`: Đơn hàng không tồn tại.
  - `409 ORDER_INVALID_STATUS`: Đơn đã `CONFIRMED`, không thể hủy.

---

#### 3.4. Bán Hàng Trực Tiếp Tại Quầy POS (Direct Order)
- **Sử dụng tại:** `MS-2.9` (Sell Time & Direct POS).
- **Quyền hạn:** `STAFF`, `ADMIN`
- **Request:**
  - Method: `POST`
  - URL: `/api/orders/direct`
  - Headers: `Authorization: Bearer <staffToken>`
  - Body:
    ```json
    {
      "sessionId": 368,
      "paymentMethod": "CASH",
      "items": [
        {
          "itemId": 3,
          "quantity": 1
        }
      ]
    }
    ```
- **Response Ví dụ Thực Tế (201 Created):**
```json
{
  "id": 519,
  "sessionId": 448,
  "computerCode": "TEST-PC-01",
  "customerName": "Customer Live",
  "customerPhone": "0988001122",
  "totalAmount": 30000,
  "paymentMethod": "CASH",
  "status": "CONFIRMED",
  "confirmedByStaffId": 5,
  "confirmedByStaffName": "LÃª Thu NgÃ¢n",
  "createdAt": "2026-10-21T12:40:22.953851",
  "confirmedAt": "2026-10-21T12:40:22.9527244",
  "items": [
    {
      "id": 373,
      "itemId": 726,
      "itemName": "MÃ¬ tÃ´m xÃ o bÃ²",
      "itemType": "FOOD",
      "quantity": 1,
      "unitPrice": 30000,
      "subtotal": 30000
    }
  ]
}
```

---

#### 3.5. Xem Lịch Sử Đơn Theo Phiên Của Khách (IDOR Protected)
- **Sử dụng tại:** `MS-1.7` (Customer Order History).
- **Quyền hạn:** `CUSTOMER`, `STAFF`, `ADMIN`
- **Request:**
  - Method: `GET`
  - URL: `/api/orders/session/{sessionId}?page=0&size=10` (ví dụ `/api/orders/session/368`)
  - Headers: `Authorization: Bearer <customerToken>`
- **Response Ví dụ Thực Tế (200 OK):**
```json
{
  "content": [
    {
      "id": 518,
      "sessionId": 448,
      "computerCode": "TEST-PC-01",
      "customerName": "Customer Live",
      "customerPhone": "0988001122",
      "totalAmount": 60000,
      "paymentMethod": "CASH",
      "status": "CONFIRMED",
      "confirmedByStaffId": 5,
      "confirmedByStaffName": "LÃª Thu NgÃ¢n",
      "createdAt": "2026-10-21T12:40:22",
      "confirmedAt": "2026-10-21T12:40:22",
      "items": [
        {
          "id": 372,
          "itemId": 726,
          "itemName": "MÃ¬ tÃ´m xÃ o bÃ²",
          "itemType": "FOOD",
          "quantity": 2,
          "unitPrice": 30000,
          "subtotal": 60000
        }
      ]
    }
  ],
  "pageNumber": 0,
  "pageSize": 10,
  "totalElements": 1,
  "totalPages": 1,
  "hasNext": false,
  "hasPrevious": false,
  "first": true,
  "last": true
}
```
- **Mã lỗi có thể gặp:**
  - `403 FORBIDDEN`: Khách xem lịch sử phiên của tài khoản khác.
  - `404 SESSION_NOT_FOUND`: Phiên không tồn tại.

---

#### 3.6. Danh Sách Đơn Chờ Xử Lý Cho Quầy / Bếp (Order Queue)
- **Sử dụng tại:** `MS-2.7` (Order Queue Polling).
- **Quyền hạn:** `STAFF`, `ADMIN`
- **Request:**
  - Method: `GET`
  - URL: `/api/orders?status=PENDING_PAYMENT&page=0&size=20`
- **Response Ví dụ Thực Tế (200 OK):**
```json
{
  "content": [
    {
      "id": 518,
      "sessionId": 448,
      "computerCode": "TEST-PC-01",
      "customerName": "Customer Live",
      "customerPhone": "0988001122",
      "totalAmount": 60000,
      "paymentMethod": "CASH",
      "status": "PENDING_PAYMENT",
      "confirmedByStaffId": null,
      "confirmedByStaffName": null,
      "createdAt": "2026-10-21T12:40:22",
      "confirmedAt": null,
      "items": [
        {
          "id": 372,
          "itemId": 726,
          "itemName": "MÃ¬ tÃ´m xÃ o bÃ²",
          "itemType": "FOOD",
          "quantity": 2,
          "unitPrice": 30000,
          "subtotal": 60000
        }
      ]
    },
    {
      "id": 506,
      "sessionId": 440,
      "computerCode": "PC-01",
      "customerName": "Tráº§n KhÃ¡ch ChÆ¡i",
      "customerPhone": "0903333333",
      "totalAmount": 20000,
      "paymentMethod": "QR",
      "status": "PENDING_PAYMENT",
      "confirmedByStaffId": null,
      "confirmedByStaffName": null,
      "createdAt": "2026-10-21T12:19:31",
      "confirmedAt": null,
      "items": []
    }
  ],
  "pageNumber": 0,
  "pageSize": 10,
  "totalElements": 2,
  "totalPages": 1,
  "hasNext": false,
  "hasPrevious": false,
  "first": true,
  "last": true
}
```

---

### 🎯 Phân Hệ 4: Bán Giờ Chơi Tại Quầy (`/api/time-purchases`)

#### 4.1. Tạo Phiếu Nạp Giờ
- **Sử dụng tại:** `MS-2.9` (Sell Time POS).
- **Quyền hạn:** `STAFF`, `ADMIN`
- **Request:**
  - Method: `POST`
  - URL: `/api/time-purchases`
  - Body:
    ```json
    {
      "accountId": 6,
      "minutes": 60,
      "amount": 10000.00,
      "paymentMethod": "CASH"
    }
    ```
- **Response Ví dụ Thực Tế (201 Created):**
```json
{
  "id": 308,
  "accountId": 48,
  "accountName": "Customer Live",
  "accountPhone": "0988001122",
  "minutes": 60,
  "amount": 10000,
  "paymentMethod": "CASH",
  "status": "PENDING_PAYMENT",
  "confirmedByStaffId": null,
  "confirmedByStaffName": null,
  "createdAt": "2026-10-21T12:40:23.032902",
  "confirmedAt": null
}
```
- **Mã lỗi có thể gặp:**
  - `400 VALIDATION_ERROR`: `minutes` hoặc `amount` $\le 0$.
  - `404 ACCOUNT_NOT_FOUND`: Khách không tồn tại.

---

#### 4.2. Thu Ngân Xác Nhận Nạp Giờ
- **Sử dụng tại:** `MS-2.9` (Confirm Nạp Giờ).
- **Quyền hạn:** `STAFF`, `ADMIN`
- **Request:**
  - Method: `PATCH`
  - URL: `/api/time-purchases/{id}/confirm` (ví dụ `/api/time-purchases/208/confirm`)
  - *(Lưu ý: Staff ID tự động lấy từ JWT).*
- **Response Ví dụ Thực Tế (200 OK):**
```json
{
  "id": 308,
  "accountId": 48,
  "accountName": "Customer Live",
  "accountPhone": "0988001122",
  "minutes": 60,
  "amount": 10000,
  "paymentMethod": "CASH",
  "status": "CONFIRMED",
  "confirmedByStaffId": 5,
  "confirmedByStaffName": "LÃª Thu NgÃ¢n",
  "createdAt": "2026-10-21T12:40:23",
  "confirmedAt": "2026-10-21T12:40:23.0424692"
}
```
- **Mã lỗi có thể gặp:**
  - `404 TIME_PURCHASE_NOT_FOUND`: Phiếu nạp không tồn tại.
  - `409 TIME_PURCHASE_INVALID_STATUS`: Phiếu nạp đã được xác nhận trước đó.

---

### 🎯 Phân Hệ 5: Quản Lý Máy Trạm (`/api/computers`)

#### 5.1. Danh Sách & Tìm Kiếm Máy Trạm
- **Sử dụng tại:** `MS-2.3` (Floor Map), `MS-3.4` (Manage Computers).
- **Quyền hạn:** `STAFF`, `ADMIN`
- **Request:**
  - Method: `GET`
  - URL: `/api/computers?status=&zone=&keyword=&page=0&size=50`
- **Response Ví dụ Thực Tế (200 OK):**
```json
{
  "content": [
    {
      "id": 1,
      "code": "PC-01",
      "pricePerHour": 10000,
      "ipAddress": "192.168.1.101",
      "zone": "STANDARD",
      "status": "AVAILABLE"
    },
    {
      "id": 2,
      "code": "PC-02",
      "pricePerHour": 10000,
      "ipAddress": "192.168.1.102",
      "zone": "STANDARD",
      "status": "AVAILABLE"
    },
    {
      "id": 22,
      "code": "PC-03",
      "pricePerHour": 10000,
      "ipAddress": "192.168.1.103",
      "zone": "STANDARD",
      "status": "AVAILABLE"
    },
    {
      "id": 5,
      "code": "SEC-PC-01",
      "pricePerHour": 10000,
      "ipAddress": "192.168.100.10",
      "zone": "STANDARD",
      "status": "AVAILABLE"
    },
    {
      "id": 3,
      "code": "TEST-PC-01",
      "pricePerHour": 10000,
      "ipAddress": "172.31.254.101",
      "zone": "VIP",
      "status": "AVAILABLE"
    }
  ],
  "pageNumber": 0,
  "pageSize": 5,
  "totalElements": 8,
  "totalPages": 2,
  "hasNext": true,
  "hasPrevious": false,
  "first": true,
  "last": false
}
```

---

#### 6.2. Thêm Món / Gói Mới
- **Sử dụng tại:** `MS-3.5` (Thêm Món).
- **Quyền hạn:** `ADMIN`
- **Request:**
  - Method: `POST`
  - URL: `/api/items`
  - Body:
    ```json
    {
      "name": "Bò Húc Thái",
      "price": 20000.00,
      "type": "DRINK",
      "available": true
    }
    ```
- **Response Ví dụ Thực Tế (201 Created):**
```json
{
  "id": 733,
  "name": "Snack Real 906",
  "price": 12000,
  "available": true,
  "type": "FOOD"
}
```
- **Mã lỗi có thể gặp:**
  - `400 VALIDATION_ERROR`: Tên rỗng hoặc giá âm.
  - `403 FORBIDDEN`: Không phải ADMIN.

---

#### 6.3. Cập Nhật Món & Toggle Hết Hàng
- **Sử dụng tại:** `MS-3.5` (Sửa Món / Switch Còn Hàng).
- **Quyền hạn:** `ADMIN`
- **Request:**
  - Method: `PUT`
  - URL: `/api/items/{id}` (ví dụ `/api/items/1`)
  - Body:
    ```json
    {
      "name": "Mì tôm xào bò đặc biệt",
      "price": 30000.00,
      "type": "FOOD",
      "available": false
    }
    ```
- **Response Ví dụ Thực Tế (200 OK):**
```json
{
  "id": 733,
  "name": "Snack Real 906 Updated",
  "price": 15000,
  "available": false,
  "type": "FOOD"
}
```

---

#### 6.4. Xóa Món
- **Sử dụng tại:** `MS-3.5` (Xóa Món).
- **Quyền hạn:** `ADMIN`
- **Request:**
  - Method: `DELETE`
  - URL: `/api/items/{id}`
- **Response:** `HTTP 204 No Content`

---

### 🎯 Phân Hệ 7: Quản Lý Tài Khoản (`/api/accounts`)

#### 7.1. Danh Sách Tài Khoản Phân Trang
- **Sử dụng tại:** `MS-2.5` (Select Khách Hàng), `MS-3.6` (Manage Accounts).
- **Quyền hạn:** `STAFF`, `ADMIN`
- **Request:**
  - Method: `GET`
  - URL: `/api/accounts?role=CUSTOMER&page=0&size=50`
- **Response Ví dụ Thực Tế (200 OK):**
```json
{
  "content": [
    {
      "id": 1,
      "phone": "0912345678",
      "name": "Customer New Name",
      "role": "CUSTOMER",
      "remainingMinutes": 60,
      "createdAt": "2026-09-15T19:23:50"
    },
    {
      "id": 2,
      "phone": "0988888888",
      "name": "Nguyá»n VÄn KhÃ¡ch",
      "role": "CUSTOMER",
      "remainingMinutes": 0,
      "createdAt": "2026-10-14T13:26:41"
    },
    {
      "id": 6,
      "phone": "0903333333",
      "name": "Tráº§n KhÃ¡ch ChÆ¡i",
      "role": "CUSTOMER",
      "remainingMinutes": 180,
      "createdAt": "2026-10-15T23:26:40"
    },
    {
      "id": 16,
      "phone": "0911111111",
      "name": "KhÃ¡ch HÃ ng A",
      "role": "CUSTOMER",
      "remainingMinutes": 0,
      "createdAt": "2026-10-17T02:44:40"
    },
    {
      "id": 23,
      "phone": "0987654321",
      "name": "Tráº§n Gamer",
      "role": "CUSTOMER",
      "remainingMinutes": 180,
      "createdAt": "2026-10-17T15:48:18"
    }
  ],
  "pageNumber": 0,
  "pageSize": 5,
  "totalElements": 9,
  "totalPages": 2,
  "hasNext": true,
  "hasPrevious": false,
  "first": true,
  "last": false
}
```

---

#### 7.2. Tạo Tài Khoản Mới
- **Sử dụng tại:** `MS-3.6` (Thêm Tài Khoản).
- **Quyền hạn:** `STAFF`, `ADMIN` (Chỉ ADMIN tạo được STAFF/ADMIN).
- **Request:**
  - Method: `POST`
  - URL: `/api/accounts`
  - Body:
    ```json
    {
      "phone": "0988888888",
      "name": "Nguyễn Văn A",
      "password": "password123",
      "role": "CUSTOMER"
    }
    ```
- **Response Ví dụ Thực Tế (201 Created):**
```json
{
  "id": 62,
  "phone": "0977501707",
  "name": "Customer Test Real",
  "role": "CUSTOMER",
  "remainingMinutes": 0,
  "createdAt": "2026-10-21T12:40:23.231897"
}
```
- **Mã lỗi có thể gặp:**
  - `400 VALIDATION_ERROR`: SĐT sai định dạng hoặc password < 6 ký tự.
  - `409 ACCOUNT_PHONE_EXISTS`: Số điện thoại đã được đăng ký.

---

#### 7.3. Cập Nhật Thông Tin Tài Khoản & Reset Mật Khẩu
- **Sử dụng tại:** `MS-3.6` (Sửa Tài Khoản / Đặt Lại Mật Khẩu).
- **Quyền hạn:** `ADMIN`
- **Request:**
  - Method: `PUT`
  - URL: `/api/accounts/{id}` (ví dụ `/api/accounts/6`)
  - Body:
    ```json
    {
      "name": "Trần Gamer Pro",
      "password": "newpassword123",
      "role": "CUSTOMER"
    }
    ```
  - *(Nếu không đổi mật khẩu, có thể để trống trường `password`).*
- **Response Ví dụ Thực Tế (200 OK):**
```json
{
  "id": 62,
  "phone": "0977501707",
  "name": "Customer Test Real Pro",
  "role": "CUSTOMER",
  "remainingMinutes": 0,
  "createdAt": "2026-10-21T12:40:23"
}
```
- **Mã lỗi có thể gặp:**
  - `404 ACCOUNT_NOT_FOUND`: Tài khoản không tồn tại.
  - `403 FORBIDDEN`: Không phải ADMIN.

---

#### 7.4. Xóa Tài Khoản
- **Sử dụng tại:** `MS-3.6` (Xóa Tài Khoản).
- **Quyền hạn:** `ADMIN`
- **Request:**
  - Method: `DELETE`
  - URL: `/api/accounts/{id}`
- **Response:** `HTTP 204 No Content`

---

### 🎯 Phân Hệ 8: Báo Cáo & Thống Kê Tài Chính (`/api/reports` - Chỉ ADMIN)

#### 8.1. Báo Cáo Doanh Thu Tổng Quan
- **Sử dụng tại:** `MS-3.2` (Dashboard Overview Stats), `MS-3.3` (Pie Chart).
- **Quyền hạn:** `ADMIN`
- **Request:**
  - Method: `GET`
  - URL: `/api/reports/revenue/summary?fromDate=2026-10-01&toDate=2026-10-21`
- **Response Ví dụ Thực Tế (200 OK):**
```json
{
  "totalRevenue": 565000,
  "totalOrderRevenue": 465000,
  "totalTimePurchaseRevenue": 100000,
  "totalFoodAndDrinkRevenue": 465000,
  "totalPlaytimeRevenue": 100000,
  "cashRevenue": 515000,
  "qrRevenue": 50000,
  "totalOrders": 11,
  "totalTimePurchases": 6,
  "fromDate": "2026-09-21",
  "toDate": "2026-10-21"
}
```

---

#### 8.2. Xu Hướng Doanh Thu Theo Ngày (Daily Continuous Time-Series)
- **Sử dụng tại:** `MS-3.3` (AreaChart 7 ngày), `MS-3.7` (Daily Revenue Table & BarChart).
- **Quyền hạn:** `ADMIN`
- **Request:**
  - Method: `GET`
  - URL: `/api/reports/revenue/daily?fromDate=2026-10-15&toDate=2026-10-21`
- **Response Ví dụ Thực Tế (200 OK):**
```json
[
  {
    "date": "2026-10-19",
    "orderRevenue": 0,
    "timePurchaseRevenue": 0,
    "totalRevenue": 0,
    "orderCount": 0,
    "timePurchaseCount": 0
  },
  {
    "date": "2026-10-20",
    "orderRevenue": 0,
    "timePurchaseRevenue": 0,
    "totalRevenue": 0,
    "orderCount": 0,
    "timePurchaseCount": 0
  },
  {
    "date": "2026-10-21",
    "orderRevenue": 465000,
    "timePurchaseRevenue": 100000,
    "totalRevenue": 565000,
    "orderCount": 11,
    "timePurchaseCount": 6
  }
]
```

---

#### 8.3. Top Món Bán Chạy Nhất
- **Sử dụng tại:** `MS-3.8` (Top Items BarChart & Table).
- **Quyền hạn:** `ADMIN`
- **Request:**
  - Method: `GET`
  - URL: `/api/reports/items/top-selling?limit=10&fromDate=&toDate=`
- **Response Ví dụ Thực Tế (200 OK):**
```json
[
  {
    "itemId": 726,
    "itemName": "MÃ¬ tÃ´m xÃ o bÃ²",
    "itemType": "FOOD",
    "totalQuantity": 15,
    "totalRevenue": 450000
  },
  {
    "itemId": 727,
    "itemName": "Sting dÃ¢u láº¡nh",
    "itemType": "DRINK",
    "totalQuantity": 1,
    "totalRevenue": 15000
  }
]
```

---

#### 8.4. Top Khách Hàng Chi Tiêu Nhiều Nhất
- **Sử dụng tại:** `MS-3.8` (Top Customers Table).
- **Quyền hạn:** `ADMIN`
- **Request:**
  - Method: `GET`
  - URL: `/api/reports/customers/top-spenders?limit=10&fromDate=&toDate=`
- **Response Ví dụ Thực Tế (200 OK):**
```json
[
  {
    "accountId": 48,
    "name": "Customer Live",
    "phone": "0988001122",
    "totalSpent": 460000,
    "remainingMinutes": 419,
    "totalMinutesPlayed": 0
  },
  {
    "accountId": 6,
    "name": "Tráº§n KhÃ¡ch ChÆ¡i",
    "phone": "0903333333",
    "totalSpent": 105000,
    "remainingMinutes": 180,
    "totalMinutesPlayed": 120
  }
]
```

---

#### 8.5. Hiệu Suất Sử Dụng Máy Trạm
- **Sử dụng tại:** `MS-3.9` (Computer Usage Table & Comparison).
- **Quyền hạn:** `ADMIN`
- **Request:**
  - Method: `GET`
  - URL: `/api/reports/computers/usage?fromDate=&toDate=`
- **Response Ví dụ Thực Tế (200 OK):**
```json
[
  {
    "computerId": 1,
    "computerCode": "PC-01",
    "zone": "STANDARD",
    "totalSessions": 3,
    "totalMinutesUsed": 120
  },
  {
    "computerId": 2,
    "computerCode": "PC-02",
    "zone": "STANDARD",
    "totalSessions": 3,
    "totalMinutesUsed": 0
  },
  {
    "computerId": 3,
    "computerCode": "TEST-PC-01",
    "zone": "VIP",
    "totalSessions": 3,
    "totalMinutesUsed": 0
  }
]
```
  *(Lưu ý: Tỷ lệ sử dụng % và tổng số giờ được tính toán trên Frontend: `totalHours = (totalUsageMinutes / 60).toFixed(1)`, `utilizationRate = totalUsageMinutes / (days * 24 * 60) * 100`).*

---

### 🎯 Phân Hệ 9: Tiện Ích VietQR & Upload Tệp (`/api/files`)

#### 9.1. Sinh Mã VietQR Napas247 Động
- **Sử dụng tại:** `MS-1.6` (Thanh toán QR khách), `MS-2.9` (Nạp giờ QR quầy).
- **Quyền hạn:** `Public (permitAll)`
- **Request:**
  - Method: `GET`
  - URL: `/api/files/vietqr?amount=60000&content=ORDER-CYBERNET-352`
- **Response Ví dụ Thực Tế (200 OK):**
```json
{
  "qrUrl": "https://img.vietqr.io/image/MBBank-0901111111-compact2.png?amount=60000&addInfo=ORDER-CYBERNET-352",
  "amount": "60000",
  "content": "ORDER-CYBERNET-352",
  "bankId": "MBBank",
  "accountNo": "0901111111"
}
```

---

## 3. Các Điểm Đánh Dấu `[CẦN XÁC NHẬN]` Cho Đội Ngũ Triển Khai

| STT | Vấn đề | Tình trạng hiện tại | Hành động đề xuất |
| :---: | :--- | :--- | :--- |
| 1 | **Số lượng máy tối đa cho Floor Map Polling** | Test kiểm thử với 10 máy chạy tốt ở chu kỳ 10s. | `[CẦN XÁC NHẬN]` Khi triển khai quán trên 80 máy, nếu tải mạng LAN cao thì cân nhắc nâng polling lên 15s hoặc kích hoạt STOMP WebSocket topic `/topic/computers`. |
| 2 | **Thông tin tài khoản ngân hàng thụ hưởng VietQR** | Hiện đang cấu hình mẫu trong `application-dev.properties` (`MBBank`, STK `0901111111`). | `[CẦN XÁC NHẬN]` Chủ quán cần cung cấp số tài khoản và mã ngân hàng thực tế để cập nhật biến môi trường Production `vietqr.bank-code` và `vietqr.account-number`. |
| 3 | **Cơ chế âm thanh thông báo đơn mới (MS-2.11)** | Trình duyệt hiện đại chặn âm thanh tự phát (Audio Autoplay Policy) nếu chưa có tương tác người dùng. | `[CẦN XÁC NHẬN]` Cần yêu cầu nhân viên click một nút bất kỳ khi vào ca làm việc để cấp quyền phát âm thanh ting ting trên trình duyệt. |
| 4 | **Trạng thái WebSocket Real-time** | WebSocket đang TẮT cho MVP (`websocket.enabled=false`). Toàn bộ client dùng HTTP Polling. | `[QUAN TRỌNG]` WebSocket đang TẮT cho MVP. Trước khi bật phải làm Phương án B: giới hạn origin, JWT ở STOMP CONNECT, phân quyền subscribe theo role/phiên. Không bật lại nếu chưa làm bảo mật này! |
