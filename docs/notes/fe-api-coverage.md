# 📊 CyberNet — Báo Cáo Phân Tích Độ Bao Phủ API Frontend (FE API Coverage)

> **Mục tiêu:** Đối chiếu chi tiết từng micro-step của kế hoạch giao diện ([`docs/notes/frontend-plan.md`](file:///d:/Antigravity/Java_SpringBoot/internet-cafe-management/docs/notes/frontend-plan.md)) với năng lực cung cấp API và dữ liệu thực tế của Backend.  
> **Nguyên tắc:** **CHƯA SỬA CODE BACKEND, CHƯA SỬA PLAN FRONTEND**. Xác định trung thực trạng thái, khoảng trống dữ liệu (data gaps) và sai lệch tham số để đội ngũ Frontend nắm rõ trước khi code.  
> **Thời điểm lập:** 21/10/2026.  
> **Phạm vi:** Toàn bộ các micro-step có tương tác API từ **MS-1.2** đến **MS-3.9**.

---

## 📌 Bảng Tổng Hợp Trạng Thái Phủ API

| Phân hệ | Tổng số MS có API | [ĐÃ SỬA] / KHỚP 100% | [HOÃN] (Chốt giải pháp FE) | [MỞ] | Ghi chú tóm tắt |
| :--- | :---: | :---: | :---: | :---: | :--- |
| **Phase 1 — Customer UI** | 5 | 4 | 1 | 0 | MS-1.4 hoãn độ mịn countdown; 4 MS khác khớp 100% |
| **Phase 2 — Staff Dashboard** | 7 | 4 | 3 | 0 | MS-2.4 đã sửa; Hoãn join máy MS-2.3, phút PA A MS-2.5, tính tiền MS-2.9 |
| **Phase 3 — Admin Panel** | 8 | 7 | 1 | 0 | MS-3.4 & MS-3.6 đã sửa; Hoãn tỷ lệ % dẫn xuất MS-3.9 |
| **TỔNG CỘNG** | **20** | **15** | **5** | **0** | **15 MS khớp 100% backend; 5 MS có giải pháp FE đã duyệt; 0 MS mở** |

*Quy ước trạng thái:*
- **[ĐÃ SỬA]:** Endpoint backend đã được kiểm thử, hoặc vừa được bổ sung hoàn chỉnh (kèm integration test PASS 100%).
- **[HOÃN]:** Sai lệch hoặc khoảng trống dữ liệu nhỏ đã có giải pháp thống nhất xử lý trên Frontend (hoặc đã chốt phương án thiết kế như PA A), không cần sửa Backend.
- **[MỞ]:** Vấn đề chưa có hướng giải quyết (Hiện tại: **0** mục).

---

## 1. Chi Tiết Độ Bao Phủ Từng Micro-Step

### 🎯 PHASE 1: CUSTOMER UI

---

#### MS-1.2 — Auth Module & API Layer
- **Endpoints thực tế & Phân quyền:**
  1. `POST /api/auth/customer-session-login` — Quyền: `Public`
  2. `POST /api/auth/refresh` — Quyền: `Public`
  3. `POST /api/auth/logout` — Quyền: `Public / Authenticated`
- **Trạng thái:** **ĐÃ TEST ĐÚNG**
- **So sánh Dữ liệu Cần vs Response Thực tế:**
  - *Frontend cần:* `accessToken`, `refreshToken`, thời hạn token, thông tin cơ bản tài khoản và phiên chơi để lưu vào store.
  - *Response thực tế:*
    - `POST /api/auth/customer-session-login`: Trả về `CustomerAuthResponse` gồm `accessToken`, `refreshToken`, `tokenType: "Bearer"`, `account` (`id`, `phone`, `name`, `role`, `remainingMinutes`), `session` (`id`, `computerCode`, `computerZone`, `pricePerHour`, `startedAt`, `expiresAt`, `status`, `remainingMinutesUntilExpiry`).
    - `POST /api/auth/refresh`: Cấp mới cặp token và xoay vòng refresh token an toàn.
    - `POST /api/auth/logout`: Thu hồi refresh token, trả về `204 No Content`.
  - *Đánh giá:* **ĐỦ 100% dữ liệu**, hoàn toàn đáp ứng nhu cầu AuthStore.
- **Tham chiếu `api-test.http`:**
  - `#CustomerMobileSessionLogin` (Dòng 49)
  - `#AuthLogout` (Dòng 334)

---

#### MS-1.3 — Customer Login Page
- **Endpoints thực tế & Phân quyền:**
  1. `GET /api/sessions/check/{computerCode}` — Quyền: `Public (permitAll)`
  2. `POST /api/auth/customer-session-login` — Quyền: `Public`
- **Trạng thái:** **ĐÃ TEST ĐÚNG**
- **So sánh Dữ liệu Cần vs Response Thực tế:**
  - *Frontend cần:*
    - Kiểm tra máy trạm theo mã (`?code=VIP-01`): Có tồn tại không, đang rảnh hay bận, giá/giờ, zone để hiện badge chào đón.
    - Đăng nhập: SĐT khách để liên kết với máy.
  - *Response thực tế:*
    - `GET /api/sessions/check/{code}`: Trả về `SessionCheckResponse` gồm `computerCode`, `zone`, `pricePerHour`, `status`, `hasActiveSession`.
    - `POST /api/auth/customer-session-login`: Body nhận `computerCode`, `phone`. Nếu phiên không tồn tại hoặc sai SĐT $\rightarrow$ trả về `400 Bad Request` với message rõ ràng.
  - *Đánh giá:* **ĐỦ 100% dữ liệu**, form login có đủ thông tin để hiển thị mã máy và xác thực.
- **Tham chiếu `api-test.http`:**
  - `#PublicCheckPC01` (Dòng 28)
  - `#CustomerMobileSessionLogin` (Dòng 49)

---

#### MS-1.4 — Session Dashboard (Trang chính của Khách)
- **Endpoints thực tế & Phân quyền:**
  1. `GET /api/sessions/active/computer/{computerCode}` — Quyền: `CUSTOMER`, `STAFF`, `ADMIN`
- **Trạng thái:** **ĐÃ TEST ĐÚNG**
- **So sánh Dữ liệu Cần vs Response Thực tế:**
  - *Frontend cần:*
    - Top bar: Tên khách, mã máy (badge gold), zone tag, nút Đăng xuất.
    - Countdown Timer: Đồng hồ đếm ngược HH:MM:SS, số phút/giây còn lại.
    - Quick Stats: Số phút đã dùng, đơn giá giờ chơi (đ/h), Zone.
    - Session Info: Thời gian bắt đầu, dự kiến kết thúc, số phút dư trong tài khoản.
  - *Response thực tế (`SessionResponse`):*
    - `accountName`: "Trần Gamer" (Tên khách).
    - `computerCode`: "PC-01", `computerZone`: "STANDARD", `pricePerHour`: 10000.00.
    - `startedAt`: "2026-10-21T00:32:07", `expiresAt`: "2026-10-21T02:32:07".
    - `playedMinutes`: 25 (Đã tính sẵn số phút đã chơi).
    - `remainingMinutesUntilExpiry`: 95 (Số phút còn lại trước khi máy tự đóng).
    - `accountRemainingMinutes`: 120 (Số phút còn trong tài khoản).
  - *Khoảng trống dữ liệu (Data Gaps nhỏ):*
    1. **Không có trường `serverTime` trong body:** Để chống lệch giờ do đồng hồ client chạy sai, Frontend cần đọc header HTTP `Date` của response hoặc gọi `new Date(res.headers.date)` để đồng bộ mốc đếm ngược.
    2. **Độ mịn countdown:** `remainingMinutesUntilExpiry` trả về số phút nguyên (Long). Tuy nhiên, vì backend cung cấp chính xác `expiresAt` (chuẩn ISO đến giây), Frontend hoàn toàn có thể tính `remainingSeconds = dayjs(expiresAt).diff(now, 'second')` để chạy vòng đếm mượt mà từng giây.
- **Tham chiếu `api-test.http`:**
  - `#CustomerGetActiveSession` (Dòng 60)

---

#### MS-1.5 — Menu Browser & Filter
- **Endpoints thực tế & Phân quyền:**
  1. `GET /api/items?page=0&size=20` — Quyền: `Public (permitAll)`
  2. `GET /api/items/type/{type}?page=0&size=20` — Quyền: `Public (permitAll)`
- **Trạng thái:** **ĐÃ TEST ĐÚNG**
- **So sánh Dữ liệu Cần vs Response Thực tế:**
  - *Frontend cần:* Tìm kiếm món, lọc theo tabs (Tất cả, Đồ ăn, Đồ uống, Giờ chơi), hiển thị tên, giá, trạng thái hết hàng (opacity mờ).
  - *Response thực tế (`PageResponse<ItemResponse>`):*
    - Mỗi item có: `id`, `name`, `price`, `type` (`FOOD`, `DRINK`, `PLAYTIME`, `SERVICE`), `available` (`true`/`false`).
  - *Đánh giá:* **ĐỦ 100% dữ liệu**. Tab "Tất cả" gọi `GET /api/items`, các tab riêng gọi `GET /api/items/type/{FOOD|DRINK|PLAYTIME}`. Cờ `available = false` dùng để render badge "Hết hàng" và disable nút thêm vào giỏ.
- **Tham chiếu `api-test.http`:**
  - `#PublicMenu` (Dòng 23)
  - `#PublicMenuByType` (Dòng 34)

---

#### MS-1.6 — Cart & Order Creation
- **Endpoints thực tế & Phân quyền:**
  1. `POST /api/orders` — Quyền: `CUSTOMER`, `STAFF`, `ADMIN`
- **Trạng thái:** **ĐÃ TEST ĐÚNG**
- **So sánh Dữ liệu Cần vs Response Thực tế:**
  - *Frontend gửi (`CreateOrderRequest`):* `sessionId`, `paymentMethod` (`CASH` hoặc `QR`), `items` (`itemId`, `quantity`).
  - *Xử lý & Response:*
    - Tạo đơn thành công: Trả về `OrderResponse` (HTTP `201 Created`), `status: "PENDING_PAYMENT"`, danh sách món con `items`, `totalAmount`.
    - Bảo vệ IDOR: Nếu khách cố tình đặt món cho `sessionId` của người khác $\rightarrow$ Chặn `403 Forbidden` ("Bạn chỉ có thể đặt món cho chính phiên chơi của mình!").
    - **Hết hàng:** Nếu trong giỏ có món mang cờ `available = false` $\rightarrow$ Ném ngoại lệ, trả về HTTP `400 Bad Request` với message: `"Món [Tên món] hiện đã hết hàng!"`.
  - *Đánh giá:* **ĐỦ dữ liệu**. Frontend có thể bắt message lỗi này để hiện cảnh báo trên giỏ hàng.
- **Tham chiếu `api-test.http`:**
  - `#CustomerCreateOrder` (Dòng 66)

---

#### MS-1.7 — Order History & Detail
- **Endpoints thực tế & Phân quyền:**
  1. `GET /api/orders/session/{sessionId}?page=0&size=10` — Quyền: `CUSTOMER`, `STAFF`, `ADMIN`
- **Trạng thái:** **ĐÃ TEST ĐÚNG**
- **So sánh Dữ liệu Cần vs Response Thực tế:**
  - *Frontend cần:*
    - Danh sách đơn: Mã đơn, thời gian tạo, tổng tiền, trạng thái (`PENDING_PAYMENT`, `CONFIRMED`, `CANCELLED`).
    - Chi tiết đơn: Từng món, SL, đơn giá, thành tiền, phương thức thanh toán, nhân viên duyệt.
  - *Response thực tế (`PageResponse<OrderResponse>`):*
    - Mỗi phần tử có: `id`, `totalAmount`, `status`, `paymentMethod`, `createdAt`, `confirmedAt`, `confirmedByStaffName`, và mảng `items` (`itemName`, `quantity`, `unitPrice`, `subtotal`).
  - *Lưu ý:* `GET /api/orders/session/{sessionId}` trả về toàn bộ đơn của phiên theo thứ tự mới nhất (`createdAt DESC`), không có param lọc `status` trên backend. Do số lượng đơn của một phiên thường ít (dưới 10 đơn), Frontend có thể lọc tab trực tiếp trên client.
- **Tham chiếu `api-test.http`:**
  - `#CustomerGetSessionOrders` (Dòng 88)

---

### 🎯 PHASE 2: STAFF DASHBOARD

---

#### MS-2.2 — Staff Login Page
- **Endpoints thực tế & Phân quyền:**
  1. `POST /api/auth/login` — Quyền: `Public`
- **Trạng thái:** **ĐÃ TEST ĐÚNG**
- **So sánh Dữ liệu Cần vs Response Thực tế:**
  - *Frontend cần:* Đăng nhập bằng SĐT + mật khẩu, lấy JWT token, kiểm tra role phải là `STAFF` hoặc `ADMIN`.
  - *Response thực tế:* Trả về `AuthResponse` gồm `accessToken`, `refreshToken`, `account` (`id`, `phone`, `role`, `name`). Role trả về đúng enum `STAFF` hoặc `ADMIN`.
- **Tham chiếu `api-test.http`:**
  - `#StaffLogin` (Dòng 102)

---

#### MS-2.3 — Floor Map (Sơ đồ máy) ⭐
- **Endpoints thực tế & Phân quyền:**
  1. `GET /api/computers?page=0&size=50` — Quyền: `STAFF`, `ADMIN`
  2. `GET /api/sessions?status=ACTIVE&page=0&size=50` — Quyền: `STAFF`, `ADMIN`
- **Trạng thái:** **ĐÃ TEST CÓ VẤN ĐỀ (Lệch thiết kế DTO)**
- **So sánh Dữ liệu Cần vs Response Thực tế:**
  - *Màn hình Floor Map cần:*
    - Hiển thị danh sách toàn bộ máy (grid 4-6 cột).
    - Với mỗi máy: Mã máy, Zone badge, Status (`AVAILABLE`, `IN_USE`, `MAINTENANCE`).
    - **Nếu máy đang `IN_USE`:** Cần hiển thị **Tên khách hàng đang ngồi** và **Đồng hồ đếm ngược mini (thời gian còn lại)**.
  - *Thực tế Backend trả về (`ComputerResponse`):*
    - `id`, `code`, `pricePerHour`, `ipAddress`, `zone`, `status`.
    - ❌ **HOÀN TOÀN KHÔNG CÓ** trường `customerName`, `remainingMinutes`, hay `sessionId` bên trong `ComputerResponse`.
  - *Ảnh hưởng & Giải pháp cho Frontend:*
    - Nếu Frontend gọi `GET /api/sessions/active/computer/{code}` cho từng máy `IN_USE` $\rightarrow$ Sẽ phát sinh **N + 1 API calls** (nếu quán có 40 máy đang chơi sẽ phải gọi 41 requests mỗi chu kỳ 10s).
    - **Cách giải quyết tối ưu trên Frontend (không sửa Backend):**
      Frontend gọi **đồng thời 2 API** bằng `Promise.all`:
      1. `GET /api/computers?size=100` (lấy danh sách máy).
      2. `GET /api/sessions?status=ACTIVE&size=100` (lấy toàn bộ phiên đang chạy).
      Sau đó ghép (join) dữ liệu trên client bằng `computerCode` hoặc `computerId`: gắn `session.accountName` và `session.remainingMinutesUntilExpiry` vào card máy tương ứng.
- **Tham chiếu `api-test.http`:**
  - `#StaffGetComputersList` (Dòng 219)
  - `#StaffGetActiveSessions` (Dòng 225)

---

#### MS-2.4 — Computer Detail Panel (Slide-in)
- **Endpoints thực tế & Phân quyền:**
  1. `GET /api/computers/{id}` — Quyền: `STAFF`, `ADMIN`
  2. `GET /api/sessions/active/computer/{code}` — Quyền: `STAFF`, `ADMIN`, `CUSTOMER`
  3. `GET /api/sessions/computer/{computerId}?page=0&size=5` — Quyền: `STAFF`, `ADMIN` (Lịch sử phiên máy trạm)
- **Trạng thái:** **ĐÃ TEST ĐÚNG**
- **So sánh Dữ liệu Cần vs Response Thực tế:**
  - *Thông tin máy & phiên hiện tại:* `GET /api/computers/{id}` và `GET /api/sessions/active/computer/{code}` cung cấp đầy đủ thông số máy, IP, giá giờ, khách đang ngồi, giờ bắt đầu, giờ hết hạn.
  - *Lịch sử phiên gần nhất của máy (MS-2.4 yêu cầu hiện 3-5 phiên gần nhất):*
    - Backend đã bổ sung endpoint `GET /api/sessions/computer/{computerId}` trả về `PageResponse<SessionResponse>` sắp xếp theo `startedAt DESC`.
  - *Đánh giá:* **ĐỦ 100% dữ liệu**, panel chi tiết máy trạm hiển thị đầy đủ thông tin máy, phiên đang chạy và lịch sử các phiên trước.
- **Tham chiếu `api-test.http`:**
  - `#AdminGetComputer` (Dòng 244)
  - `#CustomerGetActiveSession` (Dòng 60)

---

#### MS-2.5 — Start Session Workflow (Mở máy tại quầy)
- **Endpoints thực tế & Phân quyền:**
  1. `POST /api/sessions/start` — Quyền: `STAFF`, `ADMIN`
  2. `GET /api/accounts?role=CUSTOMER` — Quyền: `STAFF`, `ADMIN`
- **Trạng thái:** **ĐÃ TEST ĐÚNG (Có điểm lệch logic input)**
- **So sánh Dữ liệu Cần vs Response Thực tế:**
  - *Tìm kiếm khách hàng bằng SĐT:*
    - Backend chưa có API search autocomplete theo từ khóa SĐT (`GET /api/accounts/search?phone=...`).
    - Frontend gọi `GET /api/accounts?role=CUSTOMER&size=50` để render select box hoặc filter trên client.
  - *Lệch logic input thời gian:*
    - Frontend Plan dự định: Nhân viên nhập số phút muốn sử dụng (ví dụ 60 phút, hoặc chọn "Dùng hết").
    - **Thực tế Backend:** DTO `StartSessionRequest` chỉ nhận `{ "computerId": 1, "accountId": 6 }` (hoặc `computerCode`). Backend tự động lấy **TOÀN BỘ số phút còn lại trong tài khoản** của khách để mở máy (`account.getRemainingMinutes()`). Khi khách rời máy sớm, lệnh `PATCH /api/sessions/{id}/end` sẽ tự động hoàn trả số phút chưa dùng về lại tài khoản.
  - *Lưu ý Frontend:* Modal mở máy không cần ô nhập số phút, chỉ cần hiện thông tin: "Số phút khả dụng: XX phút (Sẽ sử dụng toàn bộ thời gian này)".
- **Tham chiếu `api-test.http`:**
  - `#StaffStartSession` (Dòng 113)
  - `#AdminGetAccountsList` (Dòng 327)

---

#### MS-2.6 — End / Transfer Session
- **Endpoints thực tế & Phân quyền:**
  1. `PATCH /api/sessions/{id}/end` — Quyền: `STAFF`, `ADMIN`
  2. `PATCH /api/sessions/{id}/transfer` — Quyền: `STAFF`, `ADMIN`
- **Trạng thái:** **ĐÃ TEST ĐÚNG**
- **So sánh Dữ liệu Cần vs Response Thực tế:**
  - *Kết thúc phiên:* Gọi `PATCH /api/sessions/{id}/end`, Backend trả máy về `AVAILABLE`, hoàn phút dư cho khách, thu hồi refresh token, trả về `SessionResponse` với `status: "ENDED"`.
  - *Chuyển máy:* DTO nhận `{ "newComputerId": 2, "markOldAsMaintenance": false }`. Backend quy đổi thời gian theo biểu giá chênh lệch, bảo lưu đơn PENDING, trả về `SessionResponse` máy mới.
  - *Đánh giá:* **ĐỦ 100% dữ liệu**.
- **Tham chiếu `api-test.http`:**
  - `#StaffEndSession` (Dòng 181)
  - `#StaffTransferSession` (Dòng 170)

---

#### MS-2.7 & MS-2.8 — Order Queue, Confirm / Cancel Order
- **Endpoints thực tế & Phân quyền:**
  1. `GET /api/orders?status=PENDING_PAYMENT&page=0&size=20` — Quyền: `STAFF`, `ADMIN`
  2. `GET /api/orders?status=CONFIRMED&page=0&size=20` — Quyền: `STAFF`, `ADMIN`
  3. `PATCH /api/orders/{id}/confirm` — Quyền: `STAFF`, `ADMIN`
  4. `PATCH /api/orders/{id}/cancel` — Quyền: `STAFF`, `ADMIN`, `CUSTOMER`
- **Trạng thái:** **ĐÃ TEST ĐÚNG**
- **So sánh Dữ liệu Cần vs Response Thực tế:**
  - *Order Queue:* Trả về danh sách đơn có đầy đủ `computerCode`, `customerName`, `customerPhone`, `totalAmount`, `paymentMethod`, và danh sách món con.
  - *Xác nhận đơn:* Nhân viên bấm xác nhận $\rightarrow$ Gọi `PATCH /api/orders/{id}/confirm` (danh tính nhân viên tự trích xuất từ JWT). Tự động nạp giờ nếu đơn chứa gói `PLAYTIME`.
  - *Hủy đơn:* Gọi `PATCH /api/orders/{id}/cancel` $\rightarrow$ Đơn chuyển sang `CANCELLED`.
  - *Đánh giá:* **ĐỦ 100% dữ liệu**.
- **Tham chiếu `api-test.http`:**
  - `#StaffListPendingOrders` (Dòng 158)
  - `#StaffConfirmOrder` (Dòng 164)
  - `#StaffCancelOrder` (Dòng 207)

---

#### MS-2.9 — Sell Time (Bán giờ chơi tại quầy)
- **Endpoints thực tế & Phân quyền:**
  1. `POST /api/time-purchases` — Quyền: `STAFF`, `ADMIN`
  2. `PATCH /api/time-purchases/{id}/confirm` — Quyền: `STAFF`, `ADMIN`
  3. `PATCH /api/time-purchases/{id}/cancel` — Quyền: `STAFF`, `ADMIN`
  4. Hoặc: `POST /api/orders/direct` — Quyền: `STAFF`, `ADMIN`
- **Trạng thái:** **ĐÃ TEST ĐÚNG (Có điểm cần lưu ý về tính tiền)**
- **So sánh Dữ liệu Cần vs Response Thực tế:**
  - *Cách tính tiền:*
    - Backend **KHÔNG** tự động tính tiền từ ID món `PLAYTIME` trong API `POST /api/time-purchases`.
    - DTO `CreateTimePurchaseRequest` yêu cầu gửi trực tiếp:
      ```json
      {
        "accountId": 6,
        "minutes": 60,
        "amount": 10000.00,
        "paymentMethod": "CASH"
      }
      ```
    - **Quy tắc Frontend:** Frontend đọc danh sách giá từ `GET /api/items/type/PLAYTIME` để gợi ý các gói (1h, 2h, 3h) hoặc tự nhân: `amount = (minutes / 60) * hourlyRate` trước khi gửi lên Backend.
  - *Xác nhận thu tiền:* Gọi `PATCH /api/time-purchases/{id}/confirm`, số phút mua được cộng lập tức vào tài khoản khách.
  - *Đánh giá:* **ĐỦ dữ liệu để triển khai**.
- **Tham chiếu `api-test.http`:**
  - `#StaffCreateTimePurchase` (Dòng 126)
  - `#StaffConfirmTimePurchase` (Dòng 152)
  - `#StaffCancelTimePurchase` (Dòng 213)
  - `#StaffCreateDirectOrder` (Dòng 187)

---

### 🎯 PHASE 3: ADMIN PANEL

---

#### MS-3.2 — Dashboard Overview ⭐
- **Endpoints thực tế & Phân quyền:**
  1. `GET /api/reports/revenue/summary?fromDate={today}&toDate={today}` — Quyền: `ADMIN`
  2. `GET /api/computers` — Quyền: `STAFF`, `ADMIN`
  3. `GET /api/sessions?status=ACTIVE` — Quyền: `STAFF`, `ADMIN`
  4. `GET /api/orders?page=0&size=5` — Quyền: `STAFF`, `ADMIN`
- **Trạng thái:** **ĐÃ TEST ĐÚNG**
- **So sánh Dữ liệu Cần vs Response Thực tế:**
  - *4 Thẻ Stats đầu trang:*
    - Doanh thu hôm nay: Đọc từ `RevenueSummaryResponse.totalRevenue`.
    - Máy đang hoạt động / Tổng máy: `GET /api/computers` (đếm số máy có `status == IN_USE` / `totalElements`).
    - Phiên đang active: Đọc từ `totalElements` của `GET /api/sessions?status=ACTIVE`.
    - Đơn hàng hôm nay: Đọc từ `totalOrders` của `GET /api/reports/revenue/summary`.
  - *Mini floor map & Đơn gần nhất:* Đọc từ `GET /api/computers` và `GET /api/orders?size=5`.
  - *Đánh giá:* **ĐỦ 100% dữ liệu**.
- **Tham chiếu `api-test.http`:**
  - `#AdminReportRevenueSummary` (Dòng 344)
  - `#StaffGetComputersList` (Dòng 219)
  - `#StaffGetActiveSessions` (Dòng 225)

---

#### MS-3.3 — Revenue Charts
- **Endpoints thực tế & Phân quyền:**
  1. `GET /api/reports/revenue/daily?fromDate=...&toDate=...` — Quyền: `ADMIN`
  2. `GET /api/reports/revenue/summary?fromDate=...&toDate=...` — Quyền: `ADMIN`
- **Trạng thái:** **ĐÃ TEST ĐÚNG**
- **So sánh Dữ liệu Cần vs Response Thực tế:**
  - *Biểu đồ AreaChart 7 ngày:* `GET /api/reports/revenue/daily` trả về mảng các ngày liên tục gồm `date`, `orderRevenue`, `timePurchaseRevenue`, `totalRevenue`. Rất chuẩn cho Recharts.
  - *Biểu đồ PieChart cơ cấu doanh thu:* `GET /api/reports/revenue/summary` trả về phân rã F&B (`orderRevenue`) vs Giờ chơi (`timePurchaseRevenue`), và Tiền mặt (`cashRevenue`) vs Chuyển khoản (`transferRevenue`).
  - *Đánh giá:* **ĐỦ 100% dữ liệu**.
- **Tham chiếu `api-test.http`:**
  - `#AdminReportDailyRevenue` (Dòng 350)
  - `#AdminReportRevenueSummary` (Dòng 344)

---

#### MS-3.4 — Manage Computers (CRUD Máy Trạm)
- **Endpoints thực tế & Phân quyền:**
  1. `POST /api/computers` — Quyền: `STAFF`, `ADMIN`
  2. `GET /api/computers?status=&zone=&keyword=&page=&size=` — Quyền: `STAFF`, `ADMIN`
  3. `GET /api/computers/{id}` — Quyền: `STAFF`, `ADMIN`
  4. `PUT /api/computers/{id}` — Quyền: `STAFF`, `ADMIN` (Cập nhật máy / Chuyển Maintenance)
  5. `DELETE /api/computers/{id}` — Quyền: `ADMIN`
- **Trạng thái:** **ĐÃ TEST ĐÚNG**
- **So sánh Dữ liệu Cần vs Response Thực tế:**
  - *Xem, Tìm kiếm & Xóa:* Backend có đầy đủ API phân trang, tìm theo mã máy/IP, lọc theo trạng thái và xóa máy trạm (`DELETE /api/computers/{id}`).
  - *Cập nhật máy (Edit modal) & Toggle Maintenance trực tiếp:*
    - Backend đã bổ sung endpoint `PUT /api/computers/{id}` nhận `UpdateComputerRequest` (`code`, `pricePerHour`, `zone`, `status`, `ipAddress`).
    - Hỗ trợ đổi trạng thái sang `MAINTENANCE` hoặc trả về `AVAILABLE` (chặn nếu máy đang `IN_USE`).
    - Bắn STOMP WebSocket `/topic/computers` tự động cập nhật ngay lập tức trên UI.
  - *Đánh giá:* **ĐỦ 100% dữ liệu**, hoàn chỉnh CRUD máy trạm.
- **Tham chiếu `api-test.http`:**
  - `#AdminCreateComputer` (Dòng 237)
  - `#StaffGetComputersList` (Dòng 219)
  - `#AdminGetComputer` (Dòng 244)
  - `#AdminDeleteComputer` (Dòng 250)

---

#### MS-3.5 — Manage Menu Items (CRUD Món & Gói Giờ)
- **Endpoints thực tế & Phân quyền:**
  1. `POST /api/items` — Quyền: `ADMIN`
  2. `GET /api/items?page=0&size=20` — Quyền: `Public`
  3. `GET /api/items/{id}` — Quyền: `Public`
  4. `PUT /api/items/{id}` — Quyền: `ADMIN`
  5. `DELETE /api/items/{id}` — Quyền: `ADMIN`
- **Trạng thái:** **ĐÃ TEST ĐÚNG**
- **So sánh Dữ liệu Cần vs Response Thực tế:**
  - *Tạo, xem, sửa, xóa, toggle còn hàng:*
    - `POST /api/items` tạo món (`name`, `price`, `type`, `available`).
    - `PUT /api/items/{id}` nhận DTO cập nhật toàn bộ trường, bao gồm cờ `available` để làm switch On/Off tồn kho.
    - `DELETE /api/items/{id}` xóa món.
  - *Đánh giá:* **ĐỦ 100% dữ liệu**, CRUD hoàn chỉnh nhất trong hệ thống.
- **Tham chiếu `api-test.http`:**
  - `#AdminCreateItem` (Dòng 256)
  - `#AdminUpdateItem` (Dòng 270)
  - `#AdminDeleteItem` (Dòng 284)

---

#### MS-3.6 — Manage Accounts (CRUD Tài Khoản)
- **Endpoints thực tế & Phân quyền:**
  1. `POST /api/accounts` — Quyền: `STAFF`, `ADMIN`
  2. `GET /api/accounts?role=&page=&size=` — Quyền: `STAFF`, `ADMIN`
  3. `GET /api/accounts/{id}` — Quyền: `STAFF`, `ADMIN`
  4. `PUT /api/accounts/{id}` — Quyền: `ADMIN` (Cập nhật tài khoản / Reset Password)
  5. `DELETE /api/accounts/{id}` — Quyền: `ADMIN`
- **Trạng thái:** **ĐÃ TEST ĐÚNG**
- **So sánh Dữ liệu Cần vs Response Thực tế:**
  - *Tạo, Lọc & Xóa:*
    - `POST /api/accounts` tạo tài khoản (`phone`, `name`, `password`, `role`).
    - `GET /api/accounts?role=...` phân trang danh sách tài khoản theo vai trò (`CUSTOMER`, `STAFF`, `ADMIN`).
    - `DELETE /api/accounts/{id}` xóa tài khoản.
  - *Sửa tài khoản:*
    - Backend đã bổ sung endpoint `PUT /api/accounts/{id}` nhận `UpdateAccountRequest` (`name`, `password`, `role`).
    - Tự động mã hóa BCrypt khi admin đặt lại mật khẩu mới.
  - *Đánh giá:* **ĐỦ 100% dữ liệu**, hoàn chỉnh CRUD tài khoản.
- **Tham chiếu `api-test.http`:**
  - `#AdminCreateAccount` (Dòng 290)
  - `#AdminGetAccountsList` (Dòng 327)
  - `#AdminGetAccount` (Dòng 321)
  - `#AdminDeleteAccount` (Dòng 340)

---

#### MS-3.7 — Report: Daily Revenue
- **Endpoints thực tế & Phân quyền:**
  1. `GET /api/reports/revenue/daily?fromDate=...&toDate=...` — Quyền: `ADMIN`
- **Trạng thái:** **ĐÃ TEST ĐÚNG**
- **So sánh Dữ liệu Cần vs Response Thực tế:**
  - *Params:* `fromDate` và `toDate` dạng ISO Date (`YYYY-MM-DD`). Nếu để trống, Backend mặc định lấy 30 ngày gần nhất.
  - *Response:* Mảng `List<DailyRevenueResponse>` gồm `date`, `orderRevenue`, `timePurchaseRevenue`, `totalRevenue`, `orderCount`, `timePurchaseCount`.
  - *Đánh giá:* **ĐỦ 100% dữ liệu** cho cả bảng dữ liệu và biểu đồ so sánh doanh thu 2 nguồn.
- **Tham chiếu `api-test.http`:**
  - `#AdminReportDailyRevenue` (Dòng 350)

---

#### MS-3.8 — Report: Top Items & Top Customers
- **Endpoints thực tế & Phân quyền:**
  1. `GET /api/reports/items/top-selling?limit=10&fromDate=&toDate=` — Quyền: `ADMIN`
  2. `GET /api/reports/customers/top-spenders?limit=10&fromDate=&toDate=` — Quyền: `ADMIN`
- **Trạng thái:** **ĐÃ TEST ĐÚNG**
- **So sánh Dữ liệu Cần vs Response Thực tế:**
  - *Top món bán chạy:* Trả về `itemId`, `itemName`, `itemType`, `totalQuantitySold`, `totalRevenue`.
  - *Top khách hàng:* Trả về `accountId`, `phone`, `fullName`, `totalTimeSpent`, `totalMinutesPurchased`.
  - *Đánh giá:* **ĐỦ 100% dữ liệu** cho biểu đồ BarChart và bảng xếp hạng.
- **Tham chiếu `api-test.http`:**
  - `#AdminReportTopItems` (Dòng 356)
  - `#AdminReportTopCustomers` (Dòng 362)

---

#### MS-3.9 — Report: Computer Usage
- **Endpoints thực tế & Phân quyền:**
  1. `GET /api/reports/computers/usage?fromDate=&toDate=` — Quyền: `ADMIN`
- **Trạng thái:** **ĐÃ TEST ĐÚNG (Có thiếu field dẫn xuất)**
- **So sánh Dữ liệu Cần vs Response Thực tế:**
  - *Màn hình cần (theo plan):* Mã máy, Tổng giờ sử dụng, Số phiên, Tỷ lệ sử dụng (%), Doanh thu máy trạm.
  - *Response thực tế (`ComputerUsageResponse`):*
    - `computerId`, `computerCode`, `zone`, `totalSessions`, `totalUsageMinutes`.
  - *Khoảng trống dữ liệu:*
    - ❌ Không có sẵn trường `utilizationRate` (tỷ lệ %) và `revenue` trong response.
    - **Giải pháp Frontend:**
      - Số giờ sử dụng: `totalHours = (totalUsageMinutes / 60).toFixed(1)`.
      - Tỷ lệ sử dụng (%): Frontend tính theo công thức: `totalUsageMinutes / (số_ngày_trong_khoảng_lọc * 24 * 60) * 100`.
- **Tham chiếu `api-test.http`:**
  - `#AdminReportComputerUsage` (Dòng 368)

---

## 2. Đánh Giá Chuyên Sâu Các Màn Hình Trọng Điểm

### 2.1. Dashboard Khách (MS-1.4)
- **Đếm ngược thời gian:**
  - Backend cung cấp `expiresAt` (mốc thời gian ISO kết thúc phiên) và `remainingMinutesUntilExpiry` (số phút nguyên).
  - Không có trường `serverTime` riêng trong JSON body. Khuyến nghị Frontend lấy mốc giờ server qua HTTP response header `Date` khi nhận response để đồng bộ đồng hồ, sau đó chạy `dayjs(expiresAt).diff(serverNow, 'second')` để hiển thị countdown mượt mà từng giây.
- **Thông tin nhận diện:** Có đủ tên khách (`accountName`), mã máy (`computerCode`), khu vực (`computerZone`), và đơn giá giờ chơi (`pricePerHour`).

### 2.2. Floor Map Nhân Viên (MS-2.3)
- **Thực tế gọi API:**
  - Một lần gọi `GET /api/computers` **KHÔNG LẤY ĐƯỢC** tên khách đang dùng và số phút còn lại vì `ComputerResponse` chỉ chứa thông tin vật lý của máy.
  - Tuy nhiên, **KHÔNG CẦN gọi N lần**.
  - **Khuyến nghị kiến trúc cho Frontend:** Gọi song song 2 API:
    ```typescript
    const [computersRes, activeSessionsRes] = await Promise.all([
      computerApi.getAll({ size: 100 }),
      sessionApi.getAllActive({ size: 100 })
    ]);
    ```
    Dùng HashMap theo `computerCode` để join 2 tập dữ liệu trong thời gian $O(N)$ trên trình duyệt.

### 2.3. Danh Sách Đơn Hàng (MS-1.7 & MS-2.7)
- **Đầy đủ dữ liệu:** Toàn bộ thông tin món con (`items`), số lượng, đơn giá, thành tiền, tổng đơn (`totalAmount`), hình thức thanh toán (`paymentMethod`), nhân viên duyệt (`confirmedByStaffName`), ngày giờ tạo/duyệt đều có trong `OrderResponse`.
- **Lọc theo trạng thái & Phân trang:**
  - Staff: `GET /api/orders?status=PENDING_PAYMENT` có đầy đủ lọc trạng thái và phân trang.
  - Customer: `GET /api/orders/session/{sessionId}` phân trang theo phiên, không có param lọc trạng thái (Frontend lọc mảng đơn trên client).

### 2.4. Thực Đơn Menu (MS-1.5)
- Public không cần đăng nhập (`permitAll`).
- Hỗ trợ lọc theo loại qua endpoint `GET /api/items/type/{type}`.
- Có cờ `available` (boolean) để hiển thị mờ và vô hiệu hóa đặt món khi hết hàng.

### 2.5. Tạo Đơn Đặt Món & Tình Huống Hết Hàng (MS-1.6)
- DTO `CreateOrderRequest` có đủ `sessionId`, `paymentMethod`, và danh sách `items`.
- Khi khách đặt món đã hết hàng (`available == false`), Backend trả về mã lỗi **`400 Bad Request`**, message: `"Món [Tên món] hiện đã hết hàng!"`, `errorCode: MALFORMED_REQUEST`. Frontend hiển thị toast message cảnh báo người dùng.

### 2.6. Bán Giờ Chơi Tại Quầy (MS-2.9)
- Backend **không tự động nhân tiền** từ gói PLAYTIME khi gọi `POST /api/time-purchases`.
- Frontend phải truyền cả `minutes` và `amount`. Frontend có thể lấy bảng giá gói giờ từ `GET /api/items/type/PLAYTIME` để tự tính hoặc cung cấp danh sách gói nạp nhanh (10k = 60p, 20k = 120p).

### 2.7. Lịch Sử Phiên Gần Nhất Của Máy (MS-2.4)
- **Trạng thái:** `[ĐÃ SỬA]`
- **Mô tả:** Backend đã bổ sung endpoint `GET /api/sessions/computer/{computerId}?page=0&size=5` sắp xếp theo `startedAt DESC`.
- **Bằng chứng:** Test `Phase6CrudEndpointsIntegrationTest.testGetSessionsByComputerId_Success` PASS 100%.

### 2.8. Hệ Thống Báo Cáo Tài Chính (MS-3.2, 3.7, 3.8, 3.9)
- Tham số ngày chuẩn `fromDate` và `toDate` (`YYYY-MM-DD`). Nếu để trống, server tự gán mặc định 30 ngày gần nhất.
- Khi không có dữ liệu trong khoảng thời gian chọn, API trả về chuỗi ngày liên tục với doanh thu bằng 0 (`totalRevenue: 0`), không bị rỗng hay lỗi biểu đồ Recharts.

### 2.9. Tính Nhất Quán Về Phân Trang (Pagination)
- **100% thống nhất:** Tất cả các endpoint danh sách trong hệ thống đều dùng chung lớp bao bọc [`PageResponse<T>`](file:///d:/Antigravity/Java_SpringBoot/internet-cafe-management/src/main/java/com/cybernet/internet_cafe_management/dto/response/PageResponse.java) với các trường chuẩn: `content`, `pageNumber`, `pageSize`, `totalElements`, `totalPages`, `isFirst`, `isLast`.

---

## 3. Danh Sách Tổng Hợp Mọi Chỗ THIẾU Hoặc LỆCH (Actionable Gap Summary)

Dưới đây là danh sách tổng hợp toàn bộ các điểm cần lưu ý khi xây dựng Frontend, xếp theo từng Micro-step bị ảnh hưởng kèm trạng thái và bằng chứng cụ thể:

| STT | MS bị ảnh hưởng | Loại vấn đề | Trạng thái | Bằng chứng kiểm thử / Request | Giải pháp xử lý Frontend |
|---|---|---|:---:|---|---|
| 1 | **MS-1.4** (Customer Dashboard) | Data Gap | `[HOÃN]` | Request 8: `GET /api/sessions/active/computer/PC-01` trả về `expiresAt` ISO chuẩn, `remainingMinutesUntilExpiry: 95`. | Đọc thời gian server từ HTTP header `Date`. Tính số giây đếm ngược chính xác qua `dayjs(expiresAt).diff(serverNow, 'second')`. |
| 2 | **MS-1.7** (Order History) | Param Mismatch | `[HOÃN]` | Request 10: `GET /api/orders/session/368` trả về toàn bộ đơn của phiên, không có param lọc `status`. | Nhận toàn bộ danh sách đơn của phiên (thường dưới 10 đơn) và thực hiện lọc tab (Chờ xử lý / Đã duyệt / Đã hủy) trực tiếp trên State của React/Zustand. |
| 3 | **MS-2.3** (Floor Map) | Data Gap | `[HOÃN]` | Request 20: `GET /api/computers` + Request 21: `GET /api/sessions?status=ACTIVE` đều trả về `200 OK`. | Gọi song song 2 API bằng `Promise.all`, sau đó merge dữ liệu trên client theo `computerCode`. |
| 4 | **MS-2.4** (Computer Detail) | Missing Endpoint | `[ĐÃ SỬA]` | `Phase6CrudEndpointsIntegrationTest.testGetSessionsByComputerId_Success` PASS; Endpoint `GET /api/sessions/computer/{id}` hoạt động. | Frontend kết nối trực tiếp API để hiển thị lịch sử 3-5 phiên chơi gần nhất của máy. |
| 5 | **MS-2.5** (Start Session) | Logic Mismatch | `[HOÃN]` | Request 13: `POST /api/sessions/start` thành công `201 Created` và Request 19: `PATCH /api/sessions/{id}/end` tự động hoàn trả phút dư. | Modal mở máy hiển thị "Thời gian khả dụng: XX phút", xác nhận mở máy không cần ô nhập số phút (Phương án A đã chốt). |
| 6 | **MS-2.5 & MS-2.9** | Missing Search | `[HOÃN]` | Request 30: `GET /api/accounts?role=CUSTOMER` trả về danh sách khách hàng có phân trang. | Load danh sách tài khoản khách và thực hiện tìm kiếm / autocomplete trên client bằng Ant Design `Select` với thuộc tính `showSearch` & `filterOption`. |
| 7 | **MS-2.9** (Sell Time) | Logic Mismatch | `[HOÃN]` | Request 14: `POST /api/time-purchases` nhận body trực tiếp `{ "minutes": 60, "amount": 10000.00 }`. | Frontend đọc bảng giá từ `GET /api/items/type/PLAYTIME` để tự tính `amount` trước khi gửi request. |
| 8 | **MS-3.4** (Manage Computers) | Missing Endpoint | `[ĐÃ SỬA]` | `Phase6CrudEndpointsIntegrationTest.testUpdateComputer_Success` PASS; Endpoint `PUT /api/computers/{id}` trả về `200 OK`. | Frontend kết nối trực tiếp Modal Sửa máy và switch Chuyển Bảo trì. |
| 9 | **MS-3.6** (Manage Accounts) | Missing Endpoint | `[ĐÃ SỬA]` | `Phase6CrudEndpointsIntegrationTest.testUpdateAccount_Success` PASS; Endpoint `PUT /api/accounts/{id}` trả về `200 OK`. | Frontend kết nối trực tiếp Modal Sửa tài khoản trên Admin Panel. |
| 10 | **MS-3.9** (Computer Usage) | Data Gap | `[HOÃN]` | Request 36: `GET /api/reports/computers/usage` trả về `totalSessions`, `totalUsageMinutes` chuẩn xác. | Frontend tự tính toán: `totalHours = totalUsageMinutes / 60`, tỷ lệ % = `totalUsageMinutes / (days * 24 * 60) * 100`. |
