## Current-account refresh — 2026-11-09

`GET /api/accounts/me`: authenticated CUSTOMER, STAFF or ADMIN; returns 200 `AccountResponse` for the authenticated principal only, including the current standard-minute balance and excluding password hashes. No account selector is accepted. Missing authentication returns 401. Idle mobile dashboards poll this endpoint every 15 seconds; it does not start a gaming session.

---

## Ownership and billing update — 2026-11-09

Customer cancellation, transfer notification, session history and active-session lookup require ownership (403 FORBIDDEN for another account). Both order creation selectors enforce ownership. No password is added to mobile ordering. Staff/Admin access remains role-controlled.

SessionResponse.pricePerHour is the purchased segment tariff, unaffected by later machine-price edits. OrderItemResponse.itemName/itemType are the purchase snapshot. Confirmation uses snapshotted package minutes. Existing monetary response shapes and HTTP state-error conventions remain unchanged. Top-customer spending includes sessionless orders. See `docs/notes/ownership-billing-review.md` for migration and concurrency details.

---

## Current contract additions ? 2026-11-09

This section takes precedence over historical examples below. Examples were not freshly captured from a live server.

Frontend QR rule approved 2026-11-10: `/customer?code=PC-02` preserves the code through login. Missing/blank codes require rescanning; no saved-table or PC-01 fallback. A customer switching from table A to B must authenticate B again. Only local mobile auth/query state is cleared; no gaming-session end API is called. Failed verification cannot save B as the authenticated table. The password-free API request/response shapes below are unchanged.

- `POST /api/auth/customer-session-login`: public; `{computerCode, phone}`; existing CUSTOMER only, no password. Unknown phone: 404 NOT_FOUND. Non-customer: 403 FORBIDDEN. Successful `session` may be null, with computerCode/computerZone identifying the table. It never starts gaming.
- `POST /api/orders`: authenticated; `{sessionId?, computerCode?, paymentMethod, items}`; provide sessionId or computerCode. Return 201 OrderResponse; sessionId may be null.
- `GET /api/orders/my-orders`: authenticated; paginated current-account history including table orders without sessions.
- `PATCH /api/orders/{id}/notify-transferred`: authenticated customer ownership enforced; QR PENDING_PAYMENT -> WAITING_CONFIRMATION, sets transferredAt. Staff must verify the bank transfer before confirm -> CONFIRMED.
- `GET /api/zones` requires STAFF/ADMIN and includes inactive zones; `/active` also allows CUSTOMER. Computer create/update/filter zone fields accept catalog code strings.
- `GET /api/reports/**` remains ADMIN-only. Staff dashboard does not call it.
- JWT claims are sub, role, iat and exp. Account ID is supplied by the account response, not a JWT claim. expiresIn is milliseconds.
- ErrorResponse remains `{status,errorCode,message,fieldErrors,timestamp}`. Missing resources use generic NOT_FOUND/404. Business argument/state rejections use 400; lock conflicts use 409. Invalid password login currently returns 400 INVALID_CREDENTIALS; missing/expired Bearer authentication returns 401. Frontend refreshes 401 protected requests, not login failures.
- ErrorCode enum is authoritative. Legacy business errors still use message classification; codes must not be inferred solely from an endpoint name. Unknown business messages fall back to MALFORMED_REQUEST. Refresh-token and existing-active-session classification now take priority over generic wording.
- Pagination returns content, pageNumber, pageSize, totalElements, totalPages, first, last, hasNext and hasPrevious; report and zone endpoints return arrays where declared.

---

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
  - **Access Token:** **30 phút** (`1800000 ms`). Chứa `sub` (số điện thoại), `accountId`, `role`, `authGeneration`, `iat` và `exp`.
  - **Refresh Token:** **7 ngày** (`604800000 ms`), lưu mã UUID ngẫu nhiên trong bảng database `refresh_tokens`.
- **Cơ chế Xoay vòng (Refresh Token Rotation):**
  - Khi Access Token hết hạn (nhận lỗi `401 Unauthorized` kèm `errorCode: "TOKEN_EXPIRED"`), Frontend gọi `POST /api/auth/refresh` mang theo `refreshToken`.
  - Backend xác thực, lập tức **xóa Refresh Token cũ** trong DB và cấp một cặp `accessToken` + `refreshToken` hoàn toàn mới.
- Khi đổi vai trò, backend thu hồi access token và refresh token trên mọi thiết bị của tài khoản. Yêu cầu dùng token đã bị thu hồi nhận `401 AUTH_ROLE_CHANGED`. Frontend xóa phiên cục bộ và yêu cầu đăng nhập lại. Chỉnh tên với cùng vai trò giữ phiên đăng nhập.
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

**Frontend xử lý lỗi thao tác đơn hàng — cập nhật 10/11/2026:**
- Axios interceptor thường reject trực tiếp `ErrorResponse`; hàm đọc lỗi ưu tiên `message` của đối tượng này. Trường hợp còn nguyên Axios error (ví dụ lỗi refresh token), đọc `response.data.message`; nếu thiếu thông báo hợp lệ thì dùng thông báo dự phòng theo thao tác.
- Mất mạng/timeout (`NETWORK_ERROR`, status 0 hoặc mã mạng/timeout Axios) hiển thị tiếng Việt, hướng dẫn kiểm tra kết nối và tải lại đơn trước khi thử lại. Không kết luận đơn đã thành công hay thất bại chỉ từ lỗi kết nối.
- Trang hàng đợi áp dụng cho duyệt/hủy: thất bại giữ modal, tắt loading, không báo thành công, không tự gửi lại thao tác. Thành công mới đóng modal và làm mới dữ liệu. Cơ chế interceptor/refresh và các endpoint backend giữ nguyên.

#### Bảng danh mục `errorCode` toàn hệ thống:

| HTTP Status | `errorCode` | Ý nghĩa & Tình huống xuất hiện |
| :---: | :--- | :--- |
| **400** | `VALIDATION_ERROR` | Lỗi validate dữ liệu DTO (`@Valid`, `@NotBlank`, `@Min`...). Có mảng `fieldErrors`. |
| **400** | `MALFORMED_REQUEST` | Request JSON sai cú pháp, sai kiểu dữ liệu param, thiếu tham số bắt buộc. |
| **401** | `UNAUTHORIZED` | Thiếu header Authorization, sai tài khoản/mật khẩu, hoặc token không hợp lệ. |
| **401** | `TOKEN_EXPIRED` | Access Token đã hết hạn (Frontend kích hoạt axios interceptor gọi refresh). |
| **401** | `AUTH_ROLE_CHANGED` | Phiên đăng nhập bị thu hồi khi đổi vai trò. Người dùng cần đăng nhập lại. |
| **400** | `REFRESH_TOKEN_INVALID` | Refresh token hết hạn, sai, không còn trong DB hoặc được cấp trước V13. |
| **403** | `FORBIDDEN` | Sai Role truy cập tài nguyên, hoặc vi phạm bảo vệ IDOR phiên khách hàng. |
| **404** | `NOT_FOUND` | Tài nguyên không tồn tại theo ID hoặc điều kiện truy vấn chung. |
| **404** | `NOT_FOUND` | Máy trạm không tồn tại theo ID hoặc mã máy (`code`). |
| **404** | `NOT_FOUND` | Phiên chơi không tồn tại. |
| **404** | `NOT_FOUND` | Đơn hàng không tồn tại. |
| **404** | `NOT_FOUND` | Giao dịch nạp giờ không tồn tại. |
| **404** | `NOT_FOUND` | Tài khoản khách hàng/nhân viên không tồn tại. |
| **404** | `NOT_FOUND` | Món ăn / dịch vụ không tồn tại trong thực đơn. |
| **409** | `CONFLICT` | Xung đột trạng thái tài nguyên tổng quát. |
| **400** | `COMPUTER_NOT_AVAILABLE` | Máy trạm đang bận (`IN_USE`) hoặc đang bảo trì (`MAINTENANCE`). |
| **400** | `MALFORMED_REQUEST` | Mã máy trạm đã tồn tại trong hệ thống. |
| **400** | `SESSION_NOT_ACTIVE` | Phiên chơi đã kết thúc (`ENDED`), không thể thao tác thêm. |
| **400** | `INSUFFICIENT_TIME` | Tài khoản không đủ số phút chơi để mở máy. |
| **400** | `ACTIVE_SESSION_EXISTS` | Tài khoản này đang có một phiên chơi khác đang hoạt động. |
| **400** | `ORDER_NOT_PENDING` | Đơn hàng không ở trạng thái hợp lệ để duyệt/hủy (đã CONFIRMED hoặc CANCELLED). |
| **400** | `ORDER_OUT_OF_STOCK` | Món ăn/nước uống đã hết hàng (`available = false`). |
| **400** | `MALFORMED_REQUEST` | Giao dịch nạp giờ đã được xử lý trước đó. |
| **400** | `MALFORMED_REQUEST` | Số điện thoại đã được đăng ký cho tài khoản khác. |
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
    Các báo cáo bao gồm cả hai ngày theo giờ Việt Nam. Truy vấn lấy từ đầu ngày `fromDate` đến trước đầu ngày sau `toDate`.
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
  - `404 NOT_FOUND`: Mã máy trạm không tồn tại.
  - `404 NOT_FOUND`: Số điện thoại chưa có tài khoản trong hệ thống.
  - `400 SESSION_NOT_ACTIVE`: Máy trạm hiện chưa có phiên chơi nào đang chạy.
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
  - `401 AUTH_ROLE_CHANGED`: Refresh token được cấp trước lần đổi vai trò. Người dùng cần đăng nhập lại.

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
  - `404 NOT_FOUND`: Mã máy trạm không tồn tại.

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
  - `400 COMPUTER_NOT_AVAILABLE`: Máy đang có người chơi hoặc đang bảo trì.
  - `400 INSUFFICIENT_TIME`: Số dư tài khoản không đủ để mở máy.
  - `400 ACTIVE_SESSION_EXISTS`: Tài khoản này đang chơi tại một máy khác.

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
  - **Quy tắc Tính Giờ Động (Dynamic Tariff Architecture)**:
    - `account.remainingMinutes` trong database luôn lưu theo **Số phút chuẩn (Standard Base Minutes)** với mệnh giá chuẩn `BASE_PRICE_PER_HOUR = 10,000 VNĐ/h` (10k = 60 phút chuẩn).
    - Khi mở máy, Backend tự động tính số phút chơi thực tế tại máy theo tỷ giá:
      $$\text{playableMinutes} = \left\lfloor \frac{\text{account.remainingMinutes} \times 10,000}{\text{computer.pricePerHour}} \right\rfloor$$
    - Mốc hết hạn: `expiresAt = LocalDateTime.now().plusMinutes(playableMinutes)`.
    - Ví dụ: Khách có 300 phút chuẩn: Ngồi máy 10k/h $\rightarrow$ 300 phút (5.0h); Ngồi máy VIP 15k/h $\rightarrow$ 200 phút (3.3h); Ngồi máy VIP Pro 20k/h $\rightarrow$ 150 phút (2.5h).
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
  - `404 NOT_FOUND`: Máy không tồn tại.
  - `404 NOT_FOUND`: Khách không tồn tại.
  - `400 COMPUTER_NOT_AVAILABLE`: Máy PC-02 đang bận.
  - `400 INSUFFICIENT_TIME`: Khách hết số phút trong tài khoản.

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
  - **Quy tắc Hoàn Trả Giờ Động (Dynamic Tariff Refund)**:
    - Khi kết thúc phiên trước thời hạn, số phút máy trạm còn dư `remainingMachineMinutes = Duration.between(now, expiresAt).toMinutes()`.
    - Số phút hoàn trả được quy đổi đối xứng về lại **Số phút chuẩn (Standard Base Minutes)** trước khi nạp lại vào tài khoản khách:
      $$\text{refundStandardMinutes} = \left\lfloor \frac{\text{remainingMachineMinutes} \times \text{computer.pricePerHour}}{10,000} \right\rfloor$$
    - Bảo toàn 100% tài sản cho khách hàng, không gây sai lệch doanh thu của quán.
- **Mã lỗi có thể gặp:**
  - `404 NOT_FOUND`: Phiên không tồn tại.
  - `400 SESSION_NOT_ACTIVE`: Phiên đã kết thúc từ trước.

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
  - `400 COMPUTER_NOT_AVAILABLE`: Máy mới đang có khách hoặc bảo trì.
  - `400 SESSION_NOT_ACTIVE`: Phiên nguồn đã kết thúc.

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
  - `404 NOT_FOUND`: Máy không tồn tại.

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
  - `404 NOT_FOUND`: Phiên không tồn tại.
  - `400 SESSION_NOT_ACTIVE`: Phiên chơi đã kết thúc, không thể đặt món.

---

#### 3.2. Thu Ngân Xác Nhận Thanh Toán Đơn Hàng (Confirm Order)
- **Sử dụng tại:** `MS-2.8` (Confirm Order).
- **Quyền hạn:** `STAFF`, `ADMIN`
- **Request:**
  - Method: `PATCH`
  - URL: `/api/orders/{id}/confirm` (ví dụ `/api/orders/352/confirm`)
  - Headers: `Authorization: Bearer <staffToken>`
  - *(Lưu ý bảo mật: Danh tính nhân viên tự động trích xuất từ JWT, KHÔNG truyền `staffId` qua query/body).*
- Đơn có gói giờ cộng phút chuẩn cho tài khoản và gia hạn phiên khách đang chơi tại thời điểm duyệt theo đơn giá của phiên đó. Nếu khách đang nghỉ, phút mua được giữ trong tài khoản. Trường `sessionId` vẫn ghi nhận phiên lúc đặt đơn.
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
  - `404 NOT_FOUND`: Đơn hàng không tồn tại.
  - `400 ORDER_NOT_PENDING`: Đơn hàng đã được xác nhận hoặc đã hủy trước đó.

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
  - `404 NOT_FOUND`: Đơn hàng không tồn tại.
  - `400 ORDER_NOT_PENDING`: Đơn đã `CONFIRMED`, không thể hủy.

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
  - `404 NOT_FOUND`: Phiên không tồn tại.

---

#### 3.6b. Thống Kê Vận Hành Đơn Hàng — cập nhật 10/11/2026
- **Request:** `GET /api/orders/summary`, STAFF hoặc ADMIN; thiếu xác thực trả `401`, CUSTOMER trả `403`. Quyền gọi `/api/reports/**` vẫn chỉ dành cho ADMIN.
- Không nhận bộ lọc danh sách, ngày tùy chọn hoặc phân trang. Backend tổng hợp bằng SQL trên toàn bộ đơn, không giới hạn 100 bản ghi và không đếm lặp đơn có nhiều dòng hàng.
- `date` là ngày hiện tại tại `Asia/Ho_Chi_Minh`; cửa sổ ngày từ 00:00 (bao gồm) đến 00:00 ngày kế tiếp (không bao gồm).
- `countsByStatus`: số đơn toàn bộ lịch sử theo từng trạng thái, chứa đủ bốn trạng thái kể cả khi bằng 0. Số đếm các tab lấy từ đây; Chờ xử lý cộng `PENDING_PAYMENT` và `WAITING_CONFIRMATION`.
- `pendingCount`, `pendingAmount`: toàn bộ đơn chưa xử lý và tổng giá trị tạm tính của chúng, bao gồm phần tồn từ ngày trước.
- `backlogCount`, `backlogAmount`: phần đơn chưa xử lý có `createdAt` trước đầu ngày hôm nay.
- `todayCreatedCount`: số đơn tạo trong ngày theo `createdAt`, bất kể trạng thái hiện tại.
- `todayConfirmedCount`: số đơn hiện CONFIRMED có `confirmedAt` trong ngày, kể cả đơn tạo từ hôm trước.
- `todayFoodAndDrinkRevenue`: tổng `subtotal` các dòng FOOD/DRINK theo snapshot, thuộc đơn CONFIRMED trong ngày theo `confirmedAt`. Không cộng PLAYTIME/SERVICE hoặc nạp giờ POS; không cộng đơn đang chờ/hủy.
- Ví dụ CSDL demo 245 đơn:
```json
{
  "date": "2026-11-10",
  "timezone": "Asia/Ho_Chi_Minh",
  "countsByStatus": { "PENDING_PAYMENT": 40, "WAITING_CONFIRMATION": 40, "CONFIRMED": 145, "CANCELLED": 20 },
  "pendingCount": 80,
  "pendingAmount": 1818000,
  "backlogCount": 10,
  "backlogAmount": 229000,
  "todayCreatedCount": 234,
  "todayConfirmedCount": 145,
  "todayFoodAndDrinkRevenue": 2400000
}
```
- Frontend polling summary mỗi 5 giây, độc lập truy vấn danh sách; làm mới sau duyệt/hủy. Không đọc được summary thì hiển thị `—`, thông báo lỗi/nút thử lại và vẫn giữ danh sách đơn.
- Ngày trên giao diện dùng múi giờ Việt Nam; đổi query key khi qua ngày hoặc quay lại cửa sổ. Không dùng summary của ngày trước làm số liệu hôm nay.
- Admin KPI đọc doanh thu, máy và phiên bằng ba query riêng. Lỗi nguồn nào chỉ nhóm tương ứng hiện `—`/Thử lại; timestamp là lần tải thành công của nguồn đó, không thay bằng giờ lỗi. Số máy lấy đủ các trang; số phiên dùng `totalElements` của API, không đếm trang đầu. Số 0 chỉ hiển thị khi API thực sự trả dữ liệu 0.

#### 3.6a. Tìm Kiếm / Lọc / Phân Trang Hàng Đợi — cập nhật 10/11/2026
- **Request:** `GET /api/orders/search`, JWT STAFF hoặc ADMIN; thiếu JWT trả `401`, CUSTOMER trả `403`.
- **Response:** `PageResponse<OrderResponse>` như danh sách bên dưới. Không đổi schema hoặc nghiệp vụ xác nhận/hủy/thanh toán.
- Bộ lọc tùy chọn kết hợp AND: `status`, `paymentMethod`, `fromDate`, `toDate`, `minAmount`, `maxAmount`, `computerCode`, `customerPhone`, `keyword`; áp dụng trước khi đếm và phân trang.
- `computerCode` và `customerPhone` tìm bằng giá trị chính xác (trim). Máy/khách ưu tiên liên kết trực tiếp trên đơn, nếu thiếu lấy từ phiên; bao gồm đơn `session=null` và đơn cũ chỉ liên kết qua phiên.
- `keyword`: trim; `#12` hoặc `ORD-12`/`ord-12` tìm chính xác ID 12. `#` trên URL phải encode thành `%23`; ID không hợp lệ, âm, 0 hoặc tràn số trả trang rỗng.
- Chuỗi thường tìm chuỗi con của mã máy, SĐT hoặc tên khách; chuỗi số thường không tìm ID. Tên không phân biệt hoa thường/dấu tiếng Việt (kể cả `đ`/`d`). `%`, `_`, `!` được hiểu là ký tự thường.
- `status=PENDING_PAYMENT` vẫn gom cả `PENDING_PAYMENT` và `WAITING_CONFIRMATION`; `status=WAITING_CONFIRMATION` chỉ trả trạng thái đó. Không tự thêm bộ lọc ngày, vì đơn tồn hôm trước vẫn phải được xử lý.
- `page` bắt đầu từ 0; dùng `size`, `sort` như quy ước chung. Nếu chưa sắp xếp theo ID, backend thêm ID cùng chiều với `createdAt` để ổn định thứ tự khi trùng thời gian. Mặc định `createdAt,desc` rồi `id,desc`.
- UI dùng FIFO `createdAt,asc` cho Chờ xử lý, các tab khác `createdAt,desc`; mặc định 20 đơn, tùy chọn 50. Hai cột Bếp/Thu ngân chia cùng một trang, số đếm mỗi cột ghi rõ "trên trang này". Tổng kết quả lấy `totalElements`, độc lập với thẻ thống kê hiện có.
- Tìm kiếm debounce 300 ms; đổi tab/phương thức/từ khóa hoặc cỡ trang thì về trang đầu. Hủy request cũ khi đổi truy vấn, không dùng dữ liệu truy vấn cũ làm kết quả mới. Sau duyệt/hủy làm mới danh sách, nếu trang cuối hết dữ liệu thì về trang hợp lệ cuối cùng. Chuyển trang/bộ lọc không được xem là đơn mới để thông báo.
- Ví dụ: `/api/orders/search?status=PENDING_PAYMENT&paymentMethod=QR&keyword=nguyen&page=0&size=20&sort=createdAt,asc`.
- Giao diện hiển thị `CONFIRMED` là “Đã thanh toán” và `WAITING_CONFIRMATION` là chờ quầy xác nhận. Thẻ thống kê dùng `GET /api/orders/summary`. Hàng đợi chờ và tab Tất cả polling mỗi 5 giây, các tab còn lại polling mỗi 15 giây.

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
  - `404 NOT_FOUND`: Khách không tồn tại.

---

#### 4.2. Thu Ngân Xác Nhận Nạp Giờ
- **Sử dụng tại:** `MS-2.9` (Confirm Nạp Giờ).
- **Quyền hạn:** `STAFF`, `ADMIN`
- **Request:**
  - Method: `PATCH`
  - URL: `/api/time-purchases/{id}/confirm` (ví dụ `/api/time-purchases/208/confirm`)
  - *(Lưu ý: Staff ID tự động lấy từ JWT).*
  - **Cơ chế Liên Thông Tự Động Gia Hạn Phiên Đang Chơi (Active Session Auto-Extend)**:
    - Nếu khách hàng đang có phiên chơi đang hoạt động (`SessionStatus.ACTIVE`), Backend sẽ **tự động gia hạn mốc hết hạn `expiresAt`** của phiên chơi theo công thức quy đổi động:
      $$\text{extraMachineMinutes} = \left\lfloor \frac{\text{purchase.minutes} \times 10,000}{\text{computer.pricePerHour}} \right\rfloor$$
      $$\text{session.expiresAt} = \text{session.expiresAt}.plusMinutes(\text{extraMachineMinutes})$$
    - Giao diện lấy trạng thái phiên mới qua HTTP polling trong cấu hình MVP hiện tại. WebSocket mặc định tắt.
    - Tài khoản `account.remainingMinutes` được bảo toàn (số phút nạp vào được tiêu dùng ngay vào phiên đang chạy; khi kết thúc phiên sẽ được hoàn trả đối xứng).
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
  - `404 NOT_FOUND`: Phiếu nạp không tồn tại.
  - `400 MALFORMED_REQUEST`: Phiếu nạp đã được xác nhận trước đó.

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
- **Quy tắc đọc tài khoản — chốt 10/11/2026:**
  - `ADMIN`: xem mọi tài khoản; tùy chọn lọc theo `role` giữ nguyên.
  - `STAFF`: không truyền `role` hoặc truyền `role=CUSTOMER` đều chỉ nhận CUSTOMER. Backend lọc trước phân trang, nên `totalElements` cũng chỉ đếm CUSTOMER.
  - `STAFF` truyền `role=STAFF` hoặc `role=ADMIN`: `403 FORBIDDEN`, không trả danh sách.
  - `GET /api/accounts/{id}`: ADMIN xem mọi tài khoản; STAFF chỉ xem CUSTOMER hoặc chính mình. Xem ADMIN/STAFF khác trả `403 FORBIDDEN`; ID không tồn tại trả `404 NOT_FOUND`.
  - `GET /api/accounts/me`: CUSTOMER/STAFF/ADMIN chỉ xem hồ sơ của chính mình; tham số ID do client gửi không đổi danh tính được đọc.
  - Các endpoint quản lý danh sách/chi tiết theo ID vẫn chặn CUSTOMER bằng `403`; thiếu xác thực trả `401`. Response không chứa `passwordHash`.
  - Trang hội viên của STAFF chỉ yêu cầu CUSTOMER và không hiển thị bộ lọc ADMIN/STAFF. Quyền sửa/xóa không thay đổi trong bước này.
- **Request:**
  - Method: `GET`
  - URL: `/api/accounts?role=CUSTOMER&keyword=Nguyen&page=0&size=20&sort=id,desc`
  - `keyword` tùy chọn, trim khoảng trắng; tìm chuỗi con trong SĐT/tên, không phân biệt hoa thường/dấu tiếng Việt (kể cả `đ`/`d`). `%`, `_`, `!` là ký tự thường, không phải wildcard.
  - `keyword=#123` tìm đúng ID 123; trên URL phải encode thành `%23123`. Chuỗi số không có `#` chỉ tìm trong SĐT/tên. ID không hợp lệ hoặc ngoài phạm vi trả trang rỗng.
  - Backend áp dụng quyền và bộ lọc trước khi phân trang/đếm. Đổi từ khóa/vai trò trên UI đưa về trang đầu; không tải trước 100 tài khoản rồi lọc ở client.
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

#### 7.1a. Tổng Quan Tài Khoản
- **Request:** `GET /api/accounts/summary`, JWT `STAFF` hoặc `ADMIN`.
- Không áp dụng `keyword`, `role` hay phân trang của danh sách; thống kê trên toàn bộ phạm vi được phép đọc.
- `ADMIN`: `totalAccounts` đếm mọi vai trò; `countsByRole` chứa `ADMIN`, `STAFF`, `CUSTOMER` (kể cả số 0).
- `STAFF`: chỉ đếm CUSTOMER; `countsByRole` chỉ chứa `CUSTOMER`, không lộ số lượng ADMIN/STAFF.
- `totalRemainingMinutes`: tổng `remainingMinutes` của CUSTOMER, đơn vị phút chuẩn Standard; không cộng số dư quản trị/nhân viên.
- Thiếu JWT trả `401`; CUSTOMER trả `403`. Ví dụ STAFF:
```json
{
  "totalAccounts": 125,
  "countsByRole": { "CUSTOMER": 125 },
  "totalRemainingMinutes": 15000
}
```
- Frontend dùng endpoint này cho thẻ thống kê; sau thêm/sửa/nạp giờ làm mới danh sách, tổng quan và chi tiết hội viên đang chọn. Dropdown hội viên tìm trên server sau 300 ms, mỗi trang 20, có nút tải thêm; giữ hội viên đã chọn bằng API chi tiết theo ID.

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
  - `400 MALFORMED_REQUEST`: Số điện thoại đã được đăng ký.

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
  - `404 NOT_FOUND`: Tài khoản không tồn tại.
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
  `totalSessions` đếm lượt mở phiên trong khoảng ngày đã chọn. `totalMinutesUsed` cộng phần thời lượng giao với khoảng đó, kể cả phiên mở trước ngày đầu. API trả cả máy có 0 lượt và 0 phút để tỷ lệ sử dụng tính trên toàn bộ danh mục máy.

  *(Tỷ lệ sử dụng và tổng số giờ được tính trên Frontend: `totalHours = (totalUsageMinutes / 60).toFixed(1)`, `utilizationRate = totalUsageMinutes / (days * 24 * 60) * 100`).*

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
