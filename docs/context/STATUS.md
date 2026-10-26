# 📌 CyberNet Project Status Snapshot

> **Mục đích:** File trạng thái "nóng" (Hot Memory) siêu ngắn gọn (~30 dòng). AI chỉ cần đọc file này để biết chính xác tiến độ hiện tại mà không cần nạp `PLAN.md` hay `LOG.md`.

---

## 🟢 Cột mốc đã hoàn thành
- [x] **Phase 0: Data Model & Entity Layer** (100% DONE — 7 Entity cốt lõi).
- [x] **Phase 1: 3-Layer Architecture & DTOs** (100% DONE — CRUD & API cho Account, Computer, Item, TimePurchase, Session, Order).
- [x] **Phase 2: Complex Business Logic** (100% DONE — Concurrency Locking với Pessimistic + @Version, Dynamic Tariff, Scheduler).
- [x] **Phase 3: Spring Security 6 & JWT** (100% DONE — BCrypt, JWT Access Token, Refresh Token Rotation, RBAC @PreAuthorize).
- [x] **Phase 4: Báo cáo & Thống kê doanh thu** (100% DONE — JPQL Aggregations, DTO Projections, Doanh thu tổng hợp/ngày/top món).
- [x] **Phase 5: Production-Ready Architecture** (100% DONE — Pagination/Sorting, MDC Tracing, Swagger OpenAPI 3, Profiles/Actuator, Flyway, Docker Compose).
- [x] **Micro-Step 0 (Frontend Preparation): CORS & Customer Auth Bridge** (100% DONE — CORS, QR session login, JWT Customer).
- [x] **Phase 6: Backend Gaps Resolution (Full Roadmap Execution)** (100% DONE — 73/73 test cases PASS):
  - **Bước 1 (DTO Validation):** Siết chặt Jakarta Bean Validation (`@NotBlank`, `@Min`, `@Size`, `@Positive`, `@Valid`) trên 14 Request DTOs & Controllers.
  - **Bước 2 (WebSocket & Real-time):** Spring WebSocket + STOMP Broker (`/ws`, `/ws-raw`, `/topic/computers`, `/topic/orders`, `/topic/sessions`), Event Push tức thì khi máy đổi trạng thái hoặc có order mới.
  - **Bước 3 (Audit Trail & Rate Limiting):** Flyway V3 table `audit_logs`, `AuditLogService` ghi nhận lịch sử nhạy cảm (duyệt đơn, chuyển máy, nạp tiền), `RateLimitingFilter` chống Brute-force & spam request (HTTP 429).
  - **Bước 4 (Specification & Asset/VietQR):** `JpaSpecificationExecutor` đa tiêu chí cho Order/Computer, `FileUploadController` lưu ảnh món ăn/avatar và `VietQrHelper` sinh mã thanh toán Napas247 động.
  - **Bước 5 (Frontend CRUD Enablement):** Đã bổ sung 3 endpoints theo yêu cầu Frontend: `PUT /api/computers/{id}`, `PUT /api/accounts/{id}`, `GET /api/sessions/computer/{computerId}`.
- [x] **Frontend Phase 1: Customer UI (Web PC & Mobile QR Ordering)** (100% DONE — MS-1.1 đến MS-1.11):
  - MS-1.1 (Scaffold & CyberLux Theme), MS-1.2 (Auth & Token Mutex), MS-1.3 (Customer Login QR), MS-1.4 (Countdown & Stats), MS-1.5 (Menu Browser), MS-1.6 (Cart & Napas247 VietQR), MS-1.7 (Order History & 10s Polling), MS-1.8 (Page Transition & Stagger), MS-1.9 (Responsive & Bottom Nav Bar), MS-1.10 (Error Boundary, 404 & Global Progress Bar), MS-1.11 (Session Expired Modal, Double-click Lock, Focus-ring & Document Titles).

---

## 🟢 Cột mốc hoàn thành trước Phase 2 (ĐÃ HOÀN TẤT)
> **Nhiệm vụ bắt buộc:** Bổ sung thuộc tính `imageUrl` (ảnh món ăn) cho Thực đơn & Món ăn và tối ưu độ ổn định giao diện:
- [x] **Backend (Item Entity & DTOs):** Bổ sung trường `imageUrl` (String) vào `Item`, migration Flyway V4 thêm cột `image_url VARCHAR(500)` vào bảng `items`, cập nhật `ItemResponse`, `CreateItemRequest`, `UpdateItemRequest`, `OrderItemResponse` và nạp sẵn ảnh mẫu Unsplash Food CDN độ nét cao cho các món.
- [x] **Frontend (Customer Menu & Cart):** Cập nhật `types/item.ts` (`imageUrl?: string`), `types/order.ts` (`itemImageUrl?: string`), cập nhật `MenuCard.tsx` hiển thị ảnh thumbnail bo góc CyberLux (kèm fallback Lucide Icon khi không có ảnh hoặc lỗi mạng), cập nhật thumbnail cho `CartDrawer.tsx` và `OrderDetailDrawer.tsx`.
- [x] **Frontend Polish & Bugfixes (Zero-Warning & CyberLux Smoothness):**
  - Khắc phục triệt để lỗi chớp modal "Phiên chơi đã kết thúc" trong 0.1s khi đăng nhập bằng cách chuyển `useCountdown` sang derived state đồng bộ (`useMemo`).
  - Tinh chỉnh hiệu ứng chuyển trang `PageTransition` và `StaggerContainer` theo chuẩn CyberLux mượt mà (0.28s, cubic-bezier, micro-scale), triệt tiêu hoàn toàn hiện tượng nảy giật trục Y kép 26px từ dưới lên và co giật khung hình do scrollbar Windows (`scrollbar-gutter: stable`).
  - Dọn sạch 100% Ant Design warnings (`App.useApp()` thay thế static `message`, Drawer `size` thay cho `width`, sửa deprecation `mask.closable`).

- [x] **Frontend Phase 2: Staff Dashboard (Floor Map sơ đồ máy, POS nạp giờ, Order Queue duyệt đơn & chuyển máy)** (100% DONE — MS-2.1 đến MS-2.12).
- [x] **Frontend MS-2.12b: Staff & Customer UX/UI Polish & Twinkle Theme Refinement** (100% DONE — chuẩn hóa bảng màu Twinkle, phân chia Section Menu, bổ sung Badge Counter thời gian thực và nâng cao phân cấp thị giác trạng thái).
- [x] **Frontend MS-2.12c: Floor Map Cache Key Isolation & Route Error Boundary Hotfix** (100% DONE — khắc phục triệt để lỗi 0 máy và màn hình đen khi F5, làm sạch 100% console warning).
- [x] **Full Completion of Phase 2 Modules & Dynamic Tariff Architecture** (100% DONE):
  - **MS-2.6 & MS-2.7: SessionManagerPage** (`/staff/sessions`) — Quản lý phiên chơi thời gian thực, bảng lịch sử phiên, đếm ngược cảnh báo sắp hết giờ, thanh tiến trình % thời gian chơi, tích hợp trực tiếp Start, End, Transfer, Sell Time modal.
  - **MS-2.9: SellTimePage POS** (`/staff/sell-time`) — Màn hình bán giờ chuyên nghiệp tại quầy với tính năng tra cứu khách hàng nhanh, 6 nút preset mệnh giá (10k-500k), sinh mã Napas247 VietQR động và thanh toán tiền mặt.
  - **Dynamic Tariff Architecture (Backend + Frontend)**: Chuẩn hóa đơn vị `account.remainingMinutes` thành **Phút chuẩn (Standard Base Minutes @ 10k/h)**. Quy đổi động đối xứng 2 chiều khi mở máy, đổi máy và trả máy: $\text{playableMinutes} = \lfloor \text{remainingMinutes} \times \frac{10000}{\text{pricePerHour}} \rfloor$.
  - **Active Session Auto-Extend Linkage**: Khi khách đang ngồi máy VIP nạp thêm tiền tại quầy (`confirmTimePurchase`), hệ thống tự động gia hạn `session.expiresAt` theo tỷ lệ máy VIP và bắn WebSocket realtime. Khi trả máy, toàn bộ thời gian dư được hoàn trả chính xác về phút chuẩn mà không thất thoát 1 đồng.
  - **Frontend UI/UX Hardening**: Khắc phục triệt để lỗi reset ô chọn khách sau 1.2s bằng `useMemo` và bóc tách dependencies; xóa sạch chữ ba chấm `...` bằng Ant Design `optionRender` Flexbox 2 cột (SĐT & Tên bên trái, Badge phút/giờ nổi bật bên phải); xử lý an toàn trạng thái `IN_USE` đang đồng bộ.

---

- [x] **Frontend MS-3.0: Chuẩn hóa toàn diện Bảng màu Twinkle gốc theo ảnh tham khảo**: Đồng bộ 4 mã màu cốt lõi trên toàn bộ Design Tokens: (1) Nền chính `#202332`, (2) Màu chủ đạo `#bd9875`, (3) Bề mặt thẻ `#434e60`, (4) Màu phụ & viền `#8b9a9f`. Toàn bộ Customer, Staff và Admin đồng bộ tự động qua Design Tokens.
- [x] **Frontend MS-3.1: Admin Layout, RBAC Guard & Chuẩn Thẻ Hero Flow Vàng Caramel**:
  - Tạo cấu trúc khung quản trị: `AdminLayout`, `AdminSidebar` (nhóm 4 phân hệ), `AdminTopBar` (breadcrumbs, switch sang POS).
  - Tinh chỉnh gradient Top-to-Bottom Twinkle Flow: Phân tách rõ ràng giữa Thẻ chủ đề lớn / Banner chính (`.twinkle-hero-flow`, `.twinkle-major-flow`) với Thẻ nhỏ / Card con (`.twinkle-card-flow`, `.glass-panel`).
  - Tích hợp viền nóc mạ ánh kim phản quang `border-t: 1.5px solid rgba(220, 185, 150, 0.75)` và Vòng tròn mũi tên phát sáng (`.twinkle-arrow-capsule`).
  - Dọn sạch 100% token cũ hardcode (`181,136,99`, `167,158,156`, `61,77,85`, `16,35,42`, `#10232A`, `#3D4D55`, `#B58863`, `#D3C3B9`) trên toàn bộ codebase frontend (`git grep` 0 kết quả).
- [x] **Frontend MS-3.2: Admin Dashboard Quick Stats & Overview**:
  - Khởi tạo `types/report.ts` và `api/reportApi.ts` kết nối backend báo cáo tài chính.
  - Xây dựng `useAdminStats` hook kết hợp 3 API thời gian thực với chu kỳ tự làm mới 15 giây.
  - Xây dựng component `AdminStatsCards.tsx` gồm 4 thẻ thống kê trực tuyến (Doanh thu hôm nay, Máy trạm hoạt động & Tỷ lệ lấp đầy, Phiên đang chạy, Đơn món & Lượt nạp giờ POS).
- [x] **Bugfix & Performance Polish (Bước 1, 2, 3, 4)**:
  - **Bước 1 (Đã hoàn tất):** Sửa lỗi máy `TEST-PC-02` kẹt trạng thái `IN_USE` không có session và chặn cứng deadlock khôi phục trong `ComputerService.java`. Bổ sung nhánh nhận diện trạng thái desync trong `ComputerDetailDrawer.tsx` và `ComputerCard.tsx`. Đã giải phóng toàn bộ 8 máy về `AVAILABLE`.
  - **Bước 2 (Đã hoàn tất):** Triệt tiêu 100% hiện tượng giật khựng khi chuyển tab trên Sơ đồ máy (bỏ `mode="popLayout"` và `layout` lồng nhau trên CSS Grid), Hàng đợi đơn hàng và Quản lý phiên chơi (bổ sung `placeholderData: keepPreviousData`, giữ giao diện ổn định không nháy Skeleton).
  - **Bước 3 (Đã hoàn tất):** Tái thiết kế dải Chỉ số vận hành trực tuyến Admin (`AdminStatsCards.tsx`) theo phong cách **Liquid Glass 3D (Kính Lỏng Nổi Phản Quang)**: 4 thẻ phân định sắc nét: (1) Doanh thu thực thu: Cam cháy hoàng hôn & Đỏ san hô ấm (`.liquid-glass-sunset`), (2) Công suất phòng máy: Vàng cát ngà & Xám slate (`.liquid-glass-sand`), (3) Phiên chơi trực tiếp: Xanh Cyan điện tử & Lam ngọc sống động (`.liquid-glass-cyan`), (4) Giao dịch hôm nay: Hổ phách đậm & Kem sữa ấm (`.liquid-glass-amber`). Viền khúc xạ ánh sáng 3D, vệt lóa sáng radial góc trên trái, quầng sáng neon mềm nở tỏa bên dưới và chân thẻ frosted pill, `cursor-default` không nút bấm.
  - **Bước 4 (Đã hoàn tất):** Chuẩn hóa nghiệp vụ Đăng Ký Hội Viên & Nạp Đầu Tại Quầy (Staff POS): Endpoint nguyên tử `POST /api/accounts/register-with-deposit` kiểm tra SĐT, nạp tối thiểu 10.000đ, quy đổi phút chuẩn, tạo giao dịch `TimePurchase` CONFIRMED và ghi log kiểm toán; siết chặt chống leo thang đặc quyền (Staff chỉ tạo CUSTOMER); Frontend modal `RegisterCustomerModal.tsx` tích hợp mượt mà vào `StartSessionModal.tsx`, `SellTimePage.tsx`, `SellTimeModal.tsx` với cơ chế auto-select ngay sau khi tạo. Bổ sung trang Quản lý tài khoản hội viên (`AccountManagerPage.tsx`) và menu **Tài khoản** trên Sidebar Staff & Admin.
  - **Đồng bộ Liquid Glass 3D toàn diện cho Staff (Đã hoàn tất):** Nâng cấp toàn bộ thẻ thống kê `div.rounded` trên cả 4 trang Staff (Sơ đồ máy, Đơn hàng, Phiên chơi, Tài khoản) sang hiệu ứng kính lỏng nổi 3D (Liquid Glass) với chân thẻ Frosted Glass Pill; đặc biệt đã bổ sung mới dải Telemetry 4 thẻ báo cáo nhanh tại trang Hàng đợi đơn hàng (Chờ duyệt, Đã xong, Tổng lượt gọi, Doanh thu F&B).
  - **Khắc phục lỗ hổng đổi mật khẩu & RBAC Hội viên (Đã hoàn tất):**
    - Chặn cứng lỗ hổng leo thang đặc quyền: Nhân viên (`STAFF`) tuyệt đối không thể sửa thông tin hoặc đổi mật khẩu của `ADMIN` hoặc đồng nghiệp `STAFF` khác (trả về 403 Forbidden kèm thông báo nghiệp vụ rõ ràng).
    - Tối ưu nghiệp vụ đổi mật khẩu tại quầy POS: Thao tác 1-click `[⚡ Điền nhanh 4 số cuối SĐT]` khi khách quên mật khẩu, cho phép tùy chỉnh gõ mật khẩu mới theo yêu cầu của khách hoặc chỉ đổi họ tên.
    - Đã xác thực 100% qua JUnit integration tests (`Phase6CrudEndpointsIntegrationTest.java`) và kịch bản thực tế PowerShell end-to-end.
  - **Tối ưu tương phản cao cho Select & Dropdown Options (Đã hoàn tất):** Sửa triệt để lỗi trùng màu nền và màu text khi các nút/tùy chọn (như lọc vai trò Quản trị, Hội viên...) ở trạng thái `active` hoặc `selected`. Áp dụng phong cách Twinkle đồng bộ: nền Vàng Gold Caramel (`#bd9875`) + chữ Midnight than đậm (`#202332`), hover Trắng Sáng nổi bật.
  - **Phân luồng Đơn hàng Kép & Tối ưu Bán giờ chơi qua Order (Đã hoàn tất):**
    - **Dual-Lane Kanban Đồng Bộ Trên Toàn Bộ Tab & Swimlane Track Cá Nhân Hóa:** Phân luồng 2 cột song song (Cột 1: **Bếp & Pha Chế** [F&B Only] | Cột 2: **Thu Ngân & Nạp Giờ** [Playtime & Combo]) được đóng khung trong 2 Panel Kanban lớn độc lập (Amber Lane vs Cyan Lane), triệt tiêu hoàn toàn cảm giác nằm chung hàng ngang; phân biệt thị giác thẻ đơn bằng dải chỉ thị màu (Amber vs Cyan vs Emerald) và nền gradient chuyên biệt.
    - **Bộ lọc Phương thức thanh toán:** Hỗ trợ lọc tức thì: `Tất cả`, `💵 Tiền mặt (Cash)`, `📱 Chuyển khoản (VietQR)`.
    - **Huy hiệu phân loại trực quan:** Đính kèm badge phương thức thanh toán và badge phân loại (`[🍜 Món ăn & Uống]`, `[⚡ Nạp giờ chơi]`, `[🎁 Combo Món + Giờ]`) trên cả Order Card và Order Detail Drawer.
    - **Cảnh báo an toàn thu tiền mặt:** Pop-up Modal xác nhận bắt buộc nhân viên kiểm tra đã thu tiền mặt trước khi duyệt đơn có nạp giờ chơi.
    - **Backend Dynamic Playtime:** Nâng cấp [OrderService.java](file:///d:/Antigravity/Java_SpringBoot/internet-cafe-management/src/main/java/com/cybernet/internet_cafe_management/service/OrderService.java) tự động phân tích tên gói cước (ví dụ: "Gói nạp 2 giờ chơi" $\rightarrow$ 120 phút), quy đổi động sang phút chuẩn theo giá máy VIP/Standard của Session đang chạy và gia hạn trực tiếp `session.expiresAt`.

---

## 🟢 Kế hoạch kế tiếp:
1. **Triển khai MS-3.3: Quản lý Máy trạm Admin (`/admin/computers`)**: Bảng quản trị danh sách máy trạm, đổi zone (STANDARD/VIP), thiết lập đơn giá giờ chơi theo zone, bật/tắt chế độ bảo trì máy trạm.
2. **Triển khai MS-3.4: Quản lý Thực đơn & Dịch vụ Admin (`/admin/items`)**: Bảng quản trị món ăn/đồ uống/gói giờ chơi, tạo món mới kèm tải ảnh món ăn, cập nhật giá và tồn kho.

---

## 🎯 Tổng kết chất lượng:
- **Backend:** 101 Java source files, 83/83 tests PASS 100%, tích hợp kiểm toán (AuditLog) và chống leo thang đặc quyền.
- **Frontend:** React 19 + TypeScript + Vite + Tailwind 4 + Ant Design 6 (Twinkle CyberLux Theme), `npm run build` PASS 100% (0 errors, 0 warnings). Đồng bộ 100% Liquid Glass 3D Telemetry Strip trên toàn bộ Staff & Admin.
