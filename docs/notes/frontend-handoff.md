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

## 6. Trạng Thái Hiện Tại & Quy Chuẩn UI/UX Mới
- **Phase 1: Customer UI:** ĐÃ HOÀN THÀNH 100% (kèm tích hợp ảnh món ăn `imageUrl`).
- **Phase 2: Staff Dashboard:** ĐÃ HOÀN THÀNH 100% (MS-2.1 đến MS-2.12).
- **Phân hệ Quản trị Admin & Chuẩn Hóa Toàn Diện Hệ Thống (Đang triển khai):** Đã hoàn tất Layout Admin, RBAC Guard, Đổi mật khẩu POS, Đăng ký hội viên nạp đầu, Nâng cấp toàn diện Order Queue Dual-Lane Swimlane.

---

## 7. 🌟 BỘ QUY CHUẨN UI/UX & KỸ THUẬT BẮT BUỘC (CẨM NANG BÀN GIAO CHO MỌI PHIÊN LÀM VIỆC)

> [!IMPORTANT]
> Bất kỳ AI Assistant hoặc Lập trình viên nào tiếp nhận dự án CyberNet ở các phiên làm việc tiếp theo **BẮT BUỘC PHẢI TUÂN THỦ NGHIÊM NGẶT 8 NGUYÊN TẮC VÀNG DƯỚI ĐÂY** để đảm bảo tính nhất quán tuyệt đối về cả nghiệp vụ lẫn thẩm mỹ giao diện:

### 1. Nguyên Tắc "Kế Hoạch Trước, Duyệt Rồi Mới Làm" (Quy tắc tối thượng)
- **Tuyệt đối không tự ý viết code hay sửa file khi chưa trình bày kế hoạch.**
- Quy trình chuẩn: Lắng nghe yêu cầu $\rightarrow$ Phân tích nguyên nhân $\rightarrow$ Đưa ra Kế hoạch các bước rõ ràng $\rightarrow$ Chờ người dùng phê duyệt ("OK" / đồng ý) $\rightarrow$ Triển khai từng bước một cách cẩn trọng $\rightarrow$ Biên dịch kiểm thử sạch sẽ $\rightarrow$ Báo cáo tổng kết.

### 2. Chuẩn Thẻ Thống Kê Nổi Liquid Glass 3D (Kính Lỏng Nổi Phản Quang)
- **Tất cả các dải chỉ số vận hành / Telemetry Stats Strip** trên mọi trang (Admin, Staff Sơ đồ máy, Đơn hàng, Phiên chơi, Hội viên, Khách hàng) **bắt buộc dùng chuẩn Liquid Glass 3D**, không dùng thẻ phẳng bo góc đơn điệu:
  - 4 biến thể màu định danh:
    1. **`.liquid-glass-sunset` (Cam cháy hoàng hôn & Đỏ san hô):** Dành cho Đơn chờ duyệt, Cảnh báo khẩn cấp, Chi phí tồn đọng.
    2. **`.liquid-glass-emerald` (Xanh lục ngọc bích):** Dành cho Doanh thu thực thu, Đơn đã hoàn tất, Tác vụ thành công.
    3. **`.liquid-glass-cyan` (Xanh Cyan điện tử & Lam ngọc):** Dành cho Máy trạm online, Phiên chơi trực tiếp, Lượt gọi món realtime.
    4. **`.liquid-glass-amber` (Hổ phách đậm & Kem sữa ấm):** Dành cho Tổng giao dịch, Doanh thu F&B, Điểm tích lũy.
  - Cấu trúc 3 lớp vật lý:
    - Lớp viền khúc xạ 3D (`border-white/20`, đổ bóng sâu `shadow-[0_8px_32px_rgba(0,0,0,0.5)]`).
    - Vệt lóa sáng phản xạ góc trên trái (`radial-gradient` lóa sáng nhẹ).
    - Chân thẻ Frosted Glass Pill (`backdrop-blur-md bg-black/20 rounded-xl px-2.5 py-1 text-sand/80`) chứa chỉ số so sánh phụ.
    - Con trỏ `cursor-default` (thẻ hiển thị số liệu thuần túy, không click nhầm như nút bấm).

### 3. Chuẩn Bố Cục Máng Cột Độc Lập (Swimlane Kanban Track)
- Khi chia luồng công việc nhiều cột (ví dụ: Cột Bếp F&B vs Cột Thu Ngân Nạp Giờ):
  - **Tuyệt đối không để các thẻ trôi tự do trên nền trang:** Nếu chỉ có 2 header rồi thả thẻ bên dưới, mắt người dùng sẽ bị ảo giác các thẻ nằm cùng một hàng ngang rồi xuống dòng.
  - **Bắt buộc đóng khung Panel Máng Cột (Swimlane Container):**
    - Mỗi cột phải được bọc trong một Panel lớn riêng biệt (`rounded-3xl p-4 sm:p-5 border shadow-2xl`).
    - Nền panel có sắc thái gradient riêng (Lane Bếp = viền mạ hổ phách `border-amber-500/30` + nền ánh hổ phách; Lane Thu Ngân = viền mạ cyan `border-cyan-500/30` + nền ánh cyan).
    - Header cột gắn liền trên đỉnh Panel thành một khối vững chắc.
    - Bên trong là rãnh chứa thẻ (Lane Track) có chiều cao tối thiểu (`min-h-[280px]`) và vùng Empty State dạng nét đứt mờ riêng biệt.

### 4. Chuẩn Nhận Diện Ngoại Hình Thẻ Đơn Hàng (Card Identity & Left Accent Stripe)
- Các thẻ tác vụ mang tính chất khác nhau **tuyệt đối không được dùng chung một kiểu nền/viền đồng điệu**:
  - **Đơn Bếp (🍜 F&B Only):** Vạch chỉ thị trái màu Cam Hổ Phách `border-l-4 border-l-amber-500`, nền gradient ấm áp `from-[#27201b]/90 via-[#1e202c]/95 to-[#141622]/95`, badge `[🍜 MÓN ĂN & UỐNG]`.
  - **Đơn Thu Ngân (⚡ Nạp Giờ Chơi):** Vạch chỉ thị trái màu Xanh Cyan Neon phát sáng `border-l-4 border-l-cyan-400 shadow-[0_0_12px_rgba(6,182,212,0.4)]`, nền Cyber Gaming `from-[#122433]/90 via-[#18202e]/95 to-[#131622]/95`, badge `[⚡ NẠP GIỜ CHƠI]`, khối nạp giờ phát sáng nổi bật.
  - **Đơn Combo (🎁 Món + Giờ):** Vạch chỉ thị trái màu Xanh Ngọc Bích `border-l-4 border-l-emerald-400`, badge `[🎁 COMBO MÓN + GIỜ]`.

### 5. Chuẩn Tương Phản Cao Cho Form Controls (Select, Dropdown, Menu)
- **Tập tin quy chuẩn:** `frontend/src/styles/antd-theme.ts` và `frontend/src/styles/index.css`.
- Trạng thái `Selected`: Nền vàng Gold Caramel (`#bd9875`), chữ Midnight than đậm (`#202332`, font-bold 700), checkmark đen than `#202332`.
- Trạng thái `Active / Hover`: Nền hổ phách mờ (`rgba(189, 152, 117, 0.18)`), chữ chuyển sang màu Trắng Sáng (`#ffffff`, font-semibold).
- Triệt tiêu 100% tình trạng màu nền trùng màu chữ khiến người dùng không đọc được tùy chọn.

### 6. Kiến Trúc Dynamic Tariff & Chuẩn Phút Tiệm Net
- **Đơn vị lưu trữ cốt lõi:** `account.remainingMinutes` **LUÔN LÀ PHÚT CHUẨN (Standard Base Minutes @ 10k/h)**.
- **Quy đổi đối xứng 2 chiều:**
  $$\text{playableMinutes} = \left\lfloor \text{remainingMinutes} \times \frac{10000}{\text{pricePerHour}} \right\rfloor$$
- Khi khách đang chơi máy VIP nạp thêm giờ tại quầy hoặc qua đơn hàng, hệ thống tự động gia hạn `session.expiresAt` theo đơn giá máy VIP và cộng số phút chuẩn tương ứng vào tài khoản. Khi đóng máy, toàn bộ thời gian dư được hoàn trả chính xác về phút chuẩn mà không thất thoát của khách.
- **Tự động phân tích tên gói nạp:** Trong [OrderService.java](file:///d:/Antigravity/Java_SpringBoot/internet-cafe-management/src/main/java/com/cybernet/internet_cafe_management/service/OrderService.java), hệ thống dùng biểu thức chính quy (Regex) để trích xuất số phút thực tế từ tên gói (vd: "Gói nạp 2 giờ chơi" $\rightarrow$ 120 phút), không được gán cứng `60 * quantity`.

### 7. Nghiệp Vụ Tiền Mặt & An Toàn Thu Ngân
- Hệ thống **KHÔNG HỖ TRỢ VÍ TIỀN / SỐ DƯ TÀI KHOẢN** (`ACCOUNT_BALANCE`). Chỉ có 2 phương thức thanh toán: `CASH` (Tiền mặt) và `QR` (Chuyển khoản VietQR Banking).
- Mọi thao tác xác nhận đơn hàng hoặc nạp giờ chơi bằng **Tiền mặt** (`paymentMethod === 'CASH'`): Bắt buộc phải có **Modal cảnh báo an toàn** màu hổ phách yêu cầu nhân viên xác nhận *"Đã thu tiền mặt từ khách chưa?"* trước khi thực thi cập nhật DB.

### 8. Phân Quyền Bảo Mật (RBAC) & Chống Leo Thang Đặc Quyền
- Nhân viên thu ngân (`STAFF`) **tuyệt đối không được phép xem thông tin nhạy cảm, chỉnh sửa hoặc đổi mật khẩu của `ADMIN` hoặc đồng nghiệp `STAFF` khác**.
- Chỉ cho phép `STAFF` đổi mật khẩu cho hội viên (`CUSTOMER`) tại quầy POS với tính năng hỗ trợ 1-click `[⚡ Điền nhanh 4 số cuối SĐT]` hoặc gõ mật khẩu mới theo yêu cầu của khách.

---

## 8. Hướng Dẫn Kế Tiếp Cho Phiên Làm Việc Mới (Next Steps)
1. **Triển khai MS-3.3: Quản lý Máy trạm Admin (`/admin/computers`)**:
   - Bảng quản trị danh sách máy trạm (DataTable kèm tìm kiếm & lọc zone STANDARD/VIP).
   - Thao tác thêm máy mới, sửa IP, chuyển zone, cấu hình đơn giá theo zone và bật/tắt chế độ bảo trì máy.
   - Áp dụng đầy đủ: Dải chỉ số Liquid Glass 3D, Card Twinkle Flow mạ viền vàng, Modal tương phản cao.
2. **Triển khai MS-3.4: Quản lý Thực đơn & Dịch vụ Admin (`/admin/items`)**:
   - Bảng quản trị món ăn, đồ uống và các gói nạp giờ chơi.
   - Thao tác thêm món mới kèm tải ảnh món ăn (`FileUploadController`), cập nhật giá bán, trạng thái còn/hết hàng.
   - Đảm bảo các gói nạp giờ ghi rõ số giờ/phút quy đổi trong tên hoặc mô tả để `OrderService` phân tích tự động.
