# 🤝 CyberNet — Tài Liệu Bàn Giao Phát Triển Frontend (Frontend Handoff)

> **Mục tiêu:** Cung cấp tài liệu bàn giao cô đọng (~1 trang) để lập trình viên Frontend hoặc phiên làm việc kế tiếp có thể bắt tay thực hiện ngay **MS-1.1** mà không cần đọc lại toàn bộ nhật ký trao đổi.  
> **Thời điểm lập:** 21/10/2026.

---

## 1. Giới Thiệu Hệ Thống & Đối Tượng Sử Dụng
- **CyberNet** là hệ thống quản lý phòng máy (tiệm net) hiện đại, kiến trúc Client-Server với Backend Spring Boot 3 và Frontend React 19.
- Hệ thống quản lý toàn diện trạng thái máy trạm theo thời gian thực, tính tiền giờ chơi linh hoạt, bán dịch vụ ăn uống (F&B) và thống kê doanh thu.
- **3 Loại người dùng chính:**
  1. **Khách hàng (`CUSTOMER`):** Chơi tại máy trạm hoặc dùng điện thoại quét mã QR tại bàn để xem giờ chơi, lướt menu, tạo đơn gọi món và xem mã VietQR thanh toán.
  2. **Nhân viên thu ngân (`STAFF`):** Sử dụng máy quầy POS để xem Floor Map sơ đồ máy, mở máy cho khách, chuyển máy, nạp giờ chơi và duyệt đơn F&B.
  3. **Quản trị viên (`ADMIN`):** Quản lý cấu hình danh mục máy, thực đơn món, tài khoản nhân viên và theo dõi các biểu đồ báo cáo tài chính chuyên sâu.
- **Các luồng chính:**
  - *Luồng khách hàng:* Quét QR bàn $\rightarrow$ Kiểm tra máy $\rightarrow$ Đăng nhập phiên $\rightarrow$ Theo dõi thời gian $\rightarrow$ Đặt món F&B $\rightarrow$ Thanh toán QR/Tiền mặt.
  - *Luồng thu ngân:* Xem Floor Map $\rightarrow$ Mở máy cho khách $\rightarrow$ Nhận đơn gọi món $\rightarrow$ Thu tiền & duyệt đơn $\rightarrow$ Nạp thêm giờ $\rightarrow$ Đóng phiên (tự hoàn giờ dư).
  - *Luồng quản trị:* Dashboard tổng quan $\rightarrow$ Biểu đồ doanh thu 7 ngày $\rightarrow$ CRUD máy/món/tài khoản $\rightarrow$ Báo cáo hiệu suất máy.

---

## 2. Trạng Thái Hiện Tại Của Backend
- **Đã sửa & sẵn sàng (16/20 mục kiểm toán + 3/3 CRUD endpoints mới):**
  - Đã bổ sung đủ 3 API còn thiếu: `PUT /api/computers/{id}`, `PUT /api/accounts/{id}`, `GET /api/sessions/computer/{computerId}`.
  - Sửa sai lệch URL (`/api/sessions/start`, `/api/reports/revenue/...`).
  - Sửa lỗi giả mạo nhân viên: `staffId` tự động lấy từ JWT token, không nhận từ client.
  - Sửa Rate Limit: phân biệt `user:<phone>` và `ip:<clientIp>`, không khóa nhầm IP mạng LAN.
  - Sửa CORS: hỗ trợ đầy đủ truy cập từ mạng LAN nội bộ tiệm net (`192.168.*`, `10.*`, `172.*`).
  - Sửa lỗi bảo mật IDOR: khách chỉ được tạo và xem đơn hàng thuộc phiên của chính mình.
  - Sửa thu hồi Refresh Token: tự động xóa token của khách khi phiên kết thúc.
  - Chuẩn hóa mã lỗi `errorCode` (20 mã lỗi Enum) và gom toàn bộ lỗi vào mảng `fieldErrors`.
- **Đã hoãn (4 mục — có lý do kỹ thuật & giải pháp Frontend rõ ràng):**
  1. *Tìm kiếm SĐT autocomplete:* Hoãn vì quy mô tiệm net MVP dưới 500 khách; Frontend dùng Ant Design `Select showSearch` lọc client-side trên `GET /api/accounts?role=CUSTOMER`.
  2. *Bỏ tham số minutes khi mở máy (Chốt Phương án A):* Server tự động mở máy theo toàn bộ số dư thời gian của khách và tự động hoàn trả phút chưa dùng khi đóng phiên; Modal thu ngân không cần ô nhập số phút.
  3. *Múi giờ & Giờ Server:* Toàn bộ tiệm chạy giờ Việt Nam (`Asia/Ho_Chi_Minh`). Mọi API phiên (`SessionResponse`) đều trả kèm trường `serverTime` (ISO string) và CORS exposed headers có `Date`, `Retry-After`. Frontend dùng `dayjs.tz` tính độ lệch đồng hồ máy khách để đếm ngược chính xác tuyệt đối.
  4. *Độ mịn countdown timer:* Server cung cấp mốc `expiresAt` ISO chuẩn xác; Frontend tự tính `dayjs.tz(expiresAt).diff(adjustedNow, 'second')` để chạy đồng hồ đếm ngược từng giây.
- **Còn mở (Open):** **0 mục** (Không có vấn đề nào bị bỏ lửng).

---

## 3. Các Quyết Định Đã Chốt & Quyết Định Còn Mở
- **Quyết định ĐÃ CHỐT:**
  1. **Real-time MVP dùng Polling (WebSocket đang TẮT):** TanStack Query polling (`refetchInterval: 10000ms` cho Floor Map, `5000ms` cho Order Queue). **Cảnh báo bảo mật:** WebSocket đang TẮT cho MVP (`websocket.enabled=false`). Trước khi bật phải làm Phương án B: giới hạn origin, JWT ở STOMP CONNECT, phân quyền subscribe theo role/phiên. Tuyệt đối không bật lại khi chưa hoàn thành các bước bảo mật này!
  2. **Bảo mật danh tính Staff & IDOR:** Mọi thao tác thu ngân (`confirmOrder`, `confirmTimePurchase`, `directOrder`) đều lấy `staffId` tự động từ claims JWT qua Spring Security. Khách hàng chỉ xem và tạo đơn thuộc phiên của chính mình (chống IDOR).
  3. **Đăng nhập khách quét QR (MS-1.3):** Khách quét mã QR tại bàn chỉ cần nhập SĐT + mã máy trạm đọc từ URL param `?code=PC-01` (`POST /api/auth/customer-session-login`), **không** cần mật khẩu và **không** có checkbox "Ghi nhớ đăng nhập".
  4. **Lấy và Quản lý `sessionId` của khách:** Trích xuất từ `session.id` trong phản hồi của `POST /api/auth/customer-session-login` và lưu vào Zustand Store (`authStore.sessionId`).
  5. **Bảo mật token sau khi phiên ENDED:** Khi đóng phiên, backend tự động xóa toàn bộ refresh token của tài khoản. Dù access token còn hạn 30 phút, nghiệp vụ tạo đơn `POST /api/orders` trên phiên đã đóng bị từ chối triệt để với `400 BAD_REQUEST` + `errorCode: "SESSION_NOT_ACTIVE"`.
  6. **Chuẩn hóa API Contract 100% dữ liệu thật:** Dùng `name` và `remainingMinutes` (thay vì `fullName`/`balanceMinutes`), `expiresIn: 1800000`, `toComputerId` (thay vì `newComputerId`), mã lỗi hết hàng `400 ORDER_OUT_OF_STOCK`.
  7. **Đồng bộ thời gian thực tế:** `SessionResponse` có trường `serverTime`; CORS expose `Date` và `Retry-After`; Frontend dùng công thức bù lệch đồng hồ (Clock Drift Compensation) với `dayjs.tz`.
  8. **Mở máy quầy (Phương án A):** Mở theo toàn bộ số dư khả dụng, hoàn trả tự động khi `endSession`.
- **Quyết định CÒN MỞ:**
  - Ngưỡng cảnh báo tải mạng LAN khi số máy vượt quá 80 máy trạm (sẽ đánh giá lại khi chạy thực tế tại quán).

---

## 4. Thứ Tự Tài Liệu Cần Đọc
Lập trình viên khi tiếp nhận cần đọc theo đúng thứ tự sau:
1. 📖 **[`docs/notes/frontend-handoff.md`](file:///d:/Antigravity/Java_SpringBoot/internet-cafe-management/docs/notes/frontend-handoff.md)** *(File này)*: Nắm tổng quan, quyết định kiến trúc và trạng thái backend.
2. 🗺️ **[`docs/notes/frontend-plan.md`](file:///d:/Antigravity/Java_SpringBoot/internet-cafe-management/docs/notes/frontend-plan.md)**: Chi tiết thiết kế giao diện "CyberLux", bảng màu, cấu trúc thư mục và lộ trình 43 micro-steps.
3. 📜 **[`docs/notes/api-contract.md`](file:///d:/Antigravity/Java_SpringBoot/internet-cafe-management/docs/notes/api-contract.md)**: Tra cứu chi tiết từng URL, headers, payload JSON thực tế, mã lỗi và role phân quyền cho mỗi endpoint.

---

## 5. Lưu Ý Kỹ Thuật Đặc Biệt Cho MS-1.1
- **Tailwind CSS 4:** Cấu hình trực tiếp bằng CSS directives (`@theme { --color-midnight: #10232A; ... }`) trong `src/styles/index.css`, **không** dùng file `tailwind.config.js` truyền thống của Tailwind v3.
- **Ant Design 5 + React 19:** React 19 thay đổi cơ chế `ref` và fiber hooks. Cần cài đặt gói tương thích chính thức:
  ```bash
  npm i @ant-design/v5-patch-for-react-19
  ```
  Và import ngay dòng đầu tiên của file `src/main.tsx`:
  ```typescript
  import '@ant-design/v5-patch-for-react-19';
  ```

---

## 6. Trạng Thái Hiện Tại & Việc Cần Làm Kế Tiếp
- **Phase 1: Customer UI (Web PC & Mobile QR Ordering):** ĐÃ HOÀN THÀNH 100% (MS-1.1 đến MS-1.11, build sạch `npm run build` exit code 0).
- ⚠️ **Checklist Bắt Buộc Trước Khi Vào Phase 2 (Ưu tiên số 1 đầu phiên làm việc kế tiếp):**
  1. **Backend (Spring Boot):**
     - Thêm trường `imageUrl` vào Entity `Item.java`.
     - Tạo migration Flyway `V4__add_image_url_to_items.sql` thêm cột `image_url` và cập nhật đường dẫn ảnh cho các món mẫu (mì tôm, Sting, gà rán, bò húc,...).
     - Cập nhật DTOs `ItemResponse`, `CreateItemRequest`, `UpdateItemRequest`.
  2. **Frontend (React 19):**
     - Cập nhật `types/item.ts` (`imageUrl?: string`).
     - Cập nhật `MenuCard.tsx` render thumbnail ảnh món ăn thật với bo góc chuẩn CyberLux (fallback icon Lucide nếu món không có ảnh).
     - Cập nhật `CartDrawer.tsx` và `OrderDetailDrawer.tsx` hiển thị thumbnail món ăn.
- 👉 **Sau khi hoàn tất Checklist Ảnh Món Ăn:** Tiến hành khởi động **Phase 2: Staff Dashboard (Sơ đồ máy Floor Map, POS nạp giờ, duyệt đơn & chuyển máy)**.
