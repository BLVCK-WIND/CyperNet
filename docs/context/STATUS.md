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

  - **Kiến trúc Quản lý Phân khu Động (Dynamic Zone Architecture - Đã hoàn tất 100%):**
    - **Backend (Spring Boot + MySQL):**
      - Migration Flyway `V5__create_zones_table.sql`: Tạo bảng `zones` (`code`, `name`, `default_price_per_hour`, `color_code`, `active`, `description`), nạp sẵn `STANDARD` (Ice Cyan `#85C1DC`) và `VIP` (`#bd9875`).
      - Migration Flyway `V6__alter_computers_zone_column.sql`: Mở rộng `computers.zone VARCHAR(50)` hỗ trợ mọi mã khu vực tùy biến trong tương lai.
      - Entity `Zone.java`, `ZoneRepository.java`, DTOs (`CreateZoneRequest`, `UpdateZoneRequest`, `ZoneResponse`), `ZoneService.java` (rào chắn an toàn: không cho xóa STANDARD/VIP, không cho xóa khu vực đang có máy trạm liên kết), `ZoneController.java` (`/api/zones` đầy đủ CRUD & phân quyền RBAC).
      - Test suite: `ZoneIntegrationTest.java` (8/8 tests PASS 100%), `Phase6CrudEndpointsIntegrationTest.java` (5/5 tests PASS 100%).
    - **Frontend Admin Panel (`ZoneManagerPage.tsx` & `ManageComputersPage.tsx`):**
      - Trang Quản lý Khu Vực (`/admin/zones`): Bảng danh sách phân khu Liquid Glass 3D, form thêm/sửa khu vực với bảng màu mẫu (Presets) và color picker tự do, bảo vệ khu vực mặc định.
      - Trang Quản lý Máy Trạm (`/admin/computers`): Bảng quản trị máy trạm CRUD đầy đủ, dropdown chọn phân khu động từ database, tự động gợi ý đơn giá theo zone, chuyển đổi trạng thái bảo trì 1-click, modal xóa an toàn.
  - **Hệ thống Hiển thị Zone Động & Chuẩn hóa Màu sắc (Zero-Camouflage System - Đã hoàn tất):**
    - Tạo hook `useZoneMap.ts` tự động nạp và cache danh mục phân khu từ backend.
    - Tạo component dùng chung `ZoneBadge.tsx`: Hiển thị mã viết tắt ngắn gọn (`STD`, `VIP`, `ARENA`, `VAL`, `FPS`...), văn bản mang chính xác 100% mã màu Admin đã chọn trong database, viền kính mờ và chấm LED phát sáng.
    - Khắc phục triệt để lỗi màu chữ STANDARD `#434e60` chìm nghỉm vào nền tối bằng cách chuyển sang màu Ice Cyan `#85C1DC`.
    - Đồng bộ hiển thị trên toàn bộ cụm Staff (`ComputerCard`, `ComputerDetailDrawer`, `StartSessionModal`, `TransferSessionModal`, `SellTimeModal`, `SessionManagerPage`) và Customer (`CustomerLoginPage`, `CustomerDashboardPage`, `SessionStats`).
  - **Tối ưu Bố cục Sơ đồ máy (Floor Map Control Optimization - Đã hoàn tất):**
    - Chuyển bộ lọc phân khu từ hàng nút Segmented dài dòng thành **Dropdown `Select` có mũi tên trỏ xuống `▾`** đặt liền kề cạnh ô Tìm kiếm nhanh bên phải.
    - Giữ các nút chuyển trạng thái máy (`Tất cả`, `Trống`, `Đang chơi`, `Bảo trì`) dạng 1-click bên trái, tạo bố cục cân đối và không bao giờ bị vỡ layout.
  - **Khắc phục Lỗi Bất đối xứng độ dài SĐT Đăng nhập (Phone Length Asymmetry Fix - Đã hoàn tất):**
    - Sửa lỗi xung đột `maxLength={10}` và regex trên `CustomerLoginPage.tsx` khiến khách hàng đăng ký 11 số bị cắt cụt không đăng nhập được.
    - Đồng bộ validation 9 đến 11 số (`maxLength={11}`, regex `/^0\d{8,10}$/`) trên toàn hệ thống. Cập nhật tài khoản #82 về đúng chuẩn 10 số (`0111111111`).

  - **Frontend MS-3.5: Quản lý Thực Đơn & Dịch Vụ Admin (`/admin/items` - Đã hoàn tất 100%):**
    - Trang Quản lý Thực đơn (`ManageItemsPage.tsx`): Bảng quản trị danh mục món ăn, thức uống, gói nạp giờ và dịch vụ tiện ích với đầy đủ chức năng Thêm/Sửa/Xóa.
    - Dải 4 chỉ số Telemetry Liquid Glass 3D (Tổng mặt hàng, Món ăn chế biến, Đồ uống giải khát, Gói giờ chơi & Tạm hết hàng).
    - Modal Thêm / Chỉnh sửa món (`ItemFormModal.tsx`): Form validation Jakarta Bean tương thích 100%, chọn phân loại (`FOOD`, `DRINK`, `PLAYTIME`, `SERVICE`), nhập đơn giá VNĐ, tích hợp upload ảnh trực tiếp lên server qua `POST /api/files/upload?folder=items` kèm preview tức thì.
    - Inline Toggle Còn hàng / Hết hàng (`available`) trực tiếp trên DataTable với cơ chế cập nhật lạc quan (Optimistic Update) và cảnh báo xóa an toàn.
    - Đã xác thực 100% qua `npm --prefix frontend run build` (0 errors, 0 warnings).
  - **Frontend MS-3.6: Quản lý Tài Khoản & Phân Quyền Admin (`/admin/accounts` - Đã hoàn tất 100%):**
    - Trang Quản lý Tài khoản Admin chuyên dụng (`ManageAccountsPage.tsx`): Bảng danh sách tài khoản đa vai trò (`ADMIN`, `STAFF`, `CUSTOMER`), phân trang, tìm kiếm theo SĐT, lọc theo vai trò và dải 4 chỉ số Liquid Glass 3D (Quản trị viên, Nhân viên, Hội viên, Tổng quỹ giờ khả dụng).
    - Modal Thêm / Chỉnh sửa tài khoản (`AccountFormModal.tsx`): Cấp tài khoản nhân viên / quản trị mới (`POST /api/accounts`), cập nhật họ tên, vai trò và đặt lại mật khẩu an toàn (`PUT /api/accounts/{id}`) kèm các nút điền nhanh mật khẩu tiện lợi.
    - Bảo vệ an toàn RBAC: Tự động nhận diện tài khoản đang đăng nhập (`currentUserId`), chặn tuyệt đối việc Admin tự xóa hoặc tự hạ cấp chính mình.
    - Đã xác thực 100% qua `npm --prefix frontend run build` (0 errors, 0 warnings).

  - **Frontend MS-3.7 & MS-3.8 & MS-3.9: Trung Tâm Báo Cáo Doanh Thu & Hiệu Suất Máy Trạm (`/admin/reports` - Đã hoàn tất 100%):**
    - Trang Báo cáo Doanh thu & Tài chính (`RevenueReportsPage.tsx` tại `/admin/reports/revenue`):
      + Dải 4 chỉ số Liquid Glass 3D (Tổng doanh thu thực thu, Doanh thu F&B, Doanh thu Giờ chơi, Cơ cấu Tiền mặt vs VietQR).
      + Biểu đồ đường diện tích tương tác (`RevenueAreaChart.tsx` dựng trên Recharts) phân rã 3 dòng tiền mượt mà với custom tooltip tông Twilight/Caramel Gold.
      + Tabs phân tích đa chiều: Bảng chi tiết doanh thu từng ngày (MS-3.7), Bảng Top 10 món bán chạy nhất (MS-3.8), Bảng Top 10 khách hàng chi tiêu nhiều nhất (MS-3.8).
      + Bộ lọc thời gian linh hoạt (Presets: Hôm nay, 7 ngày, 30 ngày, Tháng này hoặc RangePicker tùy chọn).
    - Trang Hiệu suất Vận hành Máy trạm (`ComputerUsageReportPage.tsx` tại `/admin/reports/computers` - MS-3.9):
      + Bảng thống kê số lượt mở phiên, tổng số giờ chơi, thanh tiến trình % công suất lấp đầy máy trạm 24/7 theo khung ngày khảo sát.
      + Dải 4 chỉ số Telemetry (Tổng lượt phục vụ, Tổng giờ máy chạy, Công suất bình quân toàn quán, Máy đắt khách nhất).
    - Đã xác thực 100% qua `npm --prefix frontend run build` (0 errors, 0 warnings).

---

  - **Frontend MS-3.12: Nâng cấp Toàn diện Dashboard Quản lý (Admin Dashboard) & Xây dựng Staff Operations Hub (`/staff/dashboard`) theo Triết lý shadcn/ui Bento Grid & Recharts (Đã hoàn tất 100%):**
    - **Lột xác Executive Admin Dashboard (`/admin/dashboard`):**
      + Bố cục Bento Grid đa tầng mạ vàng Caramel Twinkle kết hợp kính mờ Liquid Glass 3D.
      + Tích hợp biểu đồ diện tích `RevenueAreaChart` (Recharts) đa mốc thời gian (7, 14, 30 ngày) kèm phân bổ doanh thu F&B vs Giờ chơi.
      + Bảng cấp tin trực tuyến (Live Orders Feed 5 đơn mới nhất) và Top 5 món bán chạy nhất trong ngày.
      + Cụm 6 phím tắt quản trị điều hướng 1-click tới các module cốt lõi (Máy trạm, Phân khu, Thực đơn, Tài khoản, Báo cáo).
    - **Trung tâm Điều hành Ca trực Staff (`/staff/dashboard`):**
      + Bổ sung route `/staff/dashboard` và tab `Tổng quan ca` trên Sidebar thu ngân.
      + Dải Telemetry 4 chỉ số ca trực Liquid Glass 3D: Đơn chờ duyệt khẩn cấp (pulse indicator đỏ), Doanh thu ca hôm nay (Tiền mặt vs VietQR), Tỷ lệ lấp đầy phòng máy kèm progress bar, Số phiên chơi trực tiếp.
      + Màn hình tiến độ trực tiếp (Live Progress Monitor): Danh sách máy online, đếm thời gian chơi, thanh tiến trình % thời lượng, cảnh báo sắp hết giờ (<10 phút), ZoneBadge.
      + Quầy thao tác nhanh (Quick Action Dock): 1-click mở trực tiếp `StartSessionModal` (mở máy), `SellTimeModal` (nạp giờ quầy), `RegisterCustomerModal` (tạo hội viên mới), chuyển nhanh sang Sơ đồ máy & Hàng đợi đơn hàng.
    - Đã xác thực 100% qua `npm --prefix frontend run build` (0 errors, 0 warnings).

---

  - **Frontend MS-4.1: Tinh chỉnh Toàn diện Theme, Border-Radius & Kiểm định Tương phản WCAG AA (Đã hoàn tất 100%):**
    - Kiểm định tỷ lệ tương phản toàn hệ thống theo tiêu chuẩn WCAG AA: nâng cấp `colorTextSecondary` lên `#9cb0b6` (>4.5:1), `colorTextPlaceholder` lên `rgba(165,182,188,0.75)` (>3.5:1), đảm bảo mọi nhãn và chỉ dẫn trên nền tối Midnight `#202332` và thẻ Slate `#434e60` sắc nét rõ ràng.
    - Hoàn thiện Design Tokens Ant Design 6 cho toàn bộ các component còn thiếu: `DatePicker` & `RangePicker` (calendar popup mạ vàng), `Drawer`, `Tabs` (ink-bar gold pill), `Pagination` (item active gold), `Tooltip` (`colorBgSpotlight`), `Switch`, `Checkbox`, `Radio`, `Message`, `Notification`.
    - Thêm custom Twinkle scrollbars chống phá layout trên Windows.

---

  - **Frontend & Backend MS-4.1b: Chuẩn hóa Luồng Đặt Hàng QR 2 Bước & Rào Chắn An Toàn Tài Chính (Đã hoàn tất 100%):**
    - **Nghiệp vụ QR 2 bước chuẩn hóa:**
      + *Bước 1 (Chờ chuyển khoản):* Khách đặt đơn QR -> Đơn trạng thái `PENDING_PAYMENT` ("Chờ chuyển khoản"). Phía Staff: Nút xác nhận bị VÔ HIỆU HÓA (DISABLED) kèm tooltip cảnh báo cấm duyệt. Backend: Chặn tuyệt đối `confirmOrder` nếu là đơn QR ở trạng thái `PENDING_PAYMENT` (ném HTTP 400 Bad Request).
      + *Bước 2 (Chờ quầy xác nhận):* Khách chuyển khoản VietQR xong, bấm "TÔI ĐÃ CHUYỂN KHOẢN" trên modal -> Gọi `PATCH /api/orders/{id}/notify-transferred` -> Chuyển sang `WAITING_CONFIRMATION` ("Đã CK • Chờ quầy duyệt"), lưu `transferredAt`. Staff nhận thông báo realtime, nút Xác nhận đổi sang cyan/emerald bật sáng.
      + *Bước 3 (Đối soát tài chính an toàn QR):* Staff bấm "Xác nhận chuyển khoản", hệ thống bật Popup an toàn CyberLux rộng 580px: *"Bạn có chắc khách hàng có SĐT: [sdt] (Khách [tên] tại máy [mã máy]) đã chuyển khoản rồi chứ?"* kèm số tiền cần đối soát, cú pháp CK `ORDER-CYBERNET-{id}` và cảnh báo kiểm tra app ngân hàng trước khi duyệt. Staff xác nhận -> Đơn chuyển `CONFIRMED`.
      + *Bước 4 (Đối soát thu tiền mặt CASH):* Khi nhân viên bấm duyệt đơn Tiền mặt (CASH), hệ thống hiển thị Popup an toàn xác nhận *"Bạn có chắc chắn đã nhận đủ [số tiền] tiền mặt từ khách hàng [tên] (máy [mã máy]) rồi chứ?"* kèm mã đơn, cảnh báo cầm đủ tiền trên tay trước khi duyệt.
      + *Bước 5 (Định vị Khu vực Zone Bắt buộc):* Bổ sung thuộc tính `computerZone` vào `OrderResponse` và tích hợp `ZoneBadge` trên toàn bộ thẻ đơn hàng (`StaffOrderCard`, `StaffOrderDetailDrawer`, `ConfirmOrderModal`, `OrderCard`, `OrderDetailDrawer`) để nhân viên quầy và phục vụ luôn biết chính xác khu vực máy trạm cần giao món (VD: VIP-02 thuộc Zone VIP).
    - **Hotfix Order Queue Tab Chờ xử lý:** Đã đồng bộ triệt để `orderRepository.findByStatusIn` và `OrderSpecification` để khi lọc `status = PENDING_PAYMENT`, hệ thống gom đầy đủ cả `PENDING_PAYMENT` và `WAITING_CONFIRMATION` vào Tab "Chờ xử lý" của Staff; cập nhật badge count trên `CustomerBottomNav` và `CustomerMenuPage`.
    - **Database Migration:** Mở rộng cột `orders.status` lên `VARCHAR(50)` (thay thế enum cũ), tạo migration `V8__alter_orders_status_varchar.sql`.
    - **Kiểm thử tự động:** Đã test tích hợp end-to-end cả QR Flow (tạo đơn -> staff thử duyệt bị chặn 400 -> khách báo đã CK -> đơn vẫn nằm vững chắc tại Tab "Chờ xử lý" -> staff đối soát duyệt thành công) và Cash Flow (popup xác nhận thu tiền mặt -> duyệt thành công) PASS 100%.
    - Cả Backend (port 8080) và Frontend (port 5173) đang chạy ngầm sẵn sàng phục vụ kiểm thử trực tiếp.

---

  - **Frontend & Backend MS-4.1c: Tinh chỉnh Cơ chế Hàng đợi FIFO, Hiệu ứng Thị giác Nhẹ & Tráo Vị trí Nút Thao tác (Đã hoàn tất 100%):**
    - **Cơ chế Hàng đợi FIFO (First In, First Out):** Đơn hàng tại Tab "Chờ xử lý" tự động sắp xếp theo `createdAt,asc` (tăng dần). Đơn của khách nào chờ lâu nhất (ví dụ: đã chờ 17 phút) luôn được ưu tiên nổi lên trên cùng để thu ngân và bếp phục vụ trước.
    - **Flash Notification Đơn Mới 3s:** Khi có đơn mới, hệ thống tự động bật Toast thông báo góc phải trong đúng 3s và huy hiệu `⚡ ĐƠN MỚI ĐẾN` trên thẻ rồi tự động biến mất và đơn nằm êm vào cuối hàng đợi.
    - **Triệt tiêu hiện tượng nhấp nháy mờ cả thẻ đơn hàng:** Loại bỏ hoàn toàn `animate-pulse` trên khung thẻ `StaffOrderCard`, giữ toàn bộ thẻ, hình ảnh và câu chữ luôn sắc nét 100%, không bị chớp giật mờ mịt gây mỏi mắt.
    - **Hiệu ứng nhấp nhẹ nhàng, tinh tế cho các thành phần trọng yếu:**
      + *Huy hiệu "CHỜ ... PHÚT":* Chữ sắc nét 100%, chỉ có chấm tín hiệu radar đỏ 6px nhấp nháy êm dịu bên cạnh để báo hiệu thời gian chờ.
      + *Huy hiệu Trạng thái:* Trạng thái "ĐÃ CK • CHỜ XÁC NHẬN" giữ chữ sắc nét, bổ sung chấm radar xanh ngọc nhấp nhẹ nhàng.
      + *Nút Xác nhận:* Bật hiệu ứng phát sáng nhẹ nhàng (soft glowing ring) khi khách đã chuyển khoản để thu ngân nhận diện nút bấm cần duyệt ngay.
    - **Tráo đổi vị trí 2 nút thao tác theo đúng chuẩn công thái học:**
      + **BÊN TRÁI:** Nút **HỦY ĐƠN** (Danger đỏ).
      + **BÊN PHẢI:** Nút **XÁC NHẬN** (Primary vàng/cyan phát sáng hoặc "Chờ khách CK" disabled nếu là QR chưa ck).
    - Đã xác thực 100% qua `npm --prefix frontend run build` (0 errors, 0 warnings).

  - **Frontend & Backend MS-4.1d: Hoàn thiện Luồng Quét QR tại Máy Trống (AVAILABLE - Chưa mở phiên) theo Chuẩn Cách B (Đã hoàn tất 100%):**
    - **Nghiệp vụ cốt lõi theo chỉ đạo của Tech Lead:**
      + Khách ngồi vào máy trống (chưa bật / chưa đăng nhập PC), dùng điện thoại quét mã QR tại bàn (`?code=PC-01`) và nhập SĐT để truy cập dịch vụ gọi món và nạp giờ.
      + **Bảo lưu giờ chơi tuyệt đối:** Khi máy trống mà khách đăng nhập trên điện thoại, hệ thống **TUYỆT ĐỐI KHÔNG TẠO SESSION VÀ KHÔNG TRỪ BẤT KỲ 1 GIÂY NÀO** của khách! Khách chỉ đang dùng dịch vụ trên điện thoại chứ chưa sử dụng máy tính.
      + **Quy tắc Nạp giờ (Cách B):** Khi khách nạp gói giờ (PLAYTIME) qua QR tại máy trống, sau khi thu ngân duyệt đơn, giờ chơi được cộng an toàn vào tài khoản (`account.remainingMinutes`). Khách muốn chơi game thì phải **tự đăng nhập thủ công trên màn hình PC** (gõ SĐT + mật khẩu), hệ thống không tự động mở máy liên kết từ điện thoại.
    - **Cải tiến Backend (Database & Service Layer):**
      + *Flyway V9 (`V9__add_computer_and_account_to_orders.sql`):* Bổ sung `computer_id` và `account_id` vào bảng `orders`, cho phép `session_id` là `NULL`. Tự động backfill toàn bộ lịch sử đơn hàng cũ từ bảng `sessions`.
      + *`Order.java` & `CreateOrderRequest.java`:* Hỗ trợ tạo đơn với `sessionId` (máy đang chơi) hoặc `computerCode` (máy trống).
      + *`AuthService.customerSessionLogin`:* Khi quét mã máy trống (`AVAILABLE`), cấp token `ROLE_CUSTOMER` hợp lệ với `session = null`, nhận diện chính xác `computerCode` và `computerZone`.
      + *`OrderService.confirmOrder`:* Tách bạch 2 luồng: Nếu có session active thì gia hạn thời gian máy; nếu là đơn máy trống (`session == null`) thì chỉ cộng phút chuẩn vào tài khoản, giữ nguyên máy `AVAILABLE`.
      + *API `GET /api/orders/my-orders`:* Sử dụng query JPQL với `LEFT JOIN`, cho phép khách hàng tra cứu đầy đủ lịch sử đơn hàng của mình bất kể đơn có phiên chơi hay đặt tại máy trống.
    - **Cải tiến Frontend (Customer & Staff UI):**
      + *`CustomerLoginPage.tsx`:* Bỏ chặn máy trống, cho phép đăng nhập mượt mà vào chế độ gọi món tại bàn.
      + *`CustomerDashboardPage.tsx`:* Khi máy chưa mở phiên, hiển thị Hero Card thông báo chế độ *"GỌI MÓN TẠI BÀN"*, hiển thị rõ số dư phút trong tài khoản kèm cam kết xanh: *"✓ Chưa tính giờ (không bị trừ phút)"* và hướng dẫn đăng nhập trên PC khi muốn chơi.
      + *`CartDrawer.tsx`:* Hỗ trợ checkout đơn hàng khi `sessionId` là null, tự động gửi `computerCode`.
      + *`CustomerOrderHistoryPage.tsx`:* Chuyển sang gọi `orderApi.getMyOrders()`, hiển thị trọn vẹn lịch sử đơn hàng của khách.
      + *`StaffOrderCard.tsx` & `StaffOrderDetailDrawer.tsx`:* Hiển thị huy hiệu `GỌI TẠI BÀN` cho các đơn máy trống, giải thích rõ quy định cộng giờ vào tài khoản để thu ngân nắm bắt.
    - **Kiểm định thực tế:** Đã viết test script tự động mô phỏng trọn vẹn 6 bước (quét QR máy trống -> đăng nhập session null -> đặt F&B + nạp giờ -> báo CK -> staff duyệt -> kiểm tra tài khoản cộng 60p và máy PC-01 vẫn AVAILABLE -> tra cứu lịch sử) **PASS 100%**.

  - **Phase 3 CRUD: Toàn diện 4 Trang Quản trị Admin Chuyên sâu (ĐÃ HOÀN TẤT 100%):**
    - **Trang 1: Quản lý Máy trạm (`/admin/computers`):**
      + Siết chặt validation IPv4 regex trên `CreateComputerRequest` và `UpdateComputerRequest`.
      + Kiểm tra chống trùng mã máy và địa chỉ IP LAN (`existsByIpAddressAndIdNot`).
      + Chặn xóa cứng máy đang `IN_USE` hoặc đã có lịch sử phiên chơi / đơn hàng liên kết (HTTP 400).
      + Bắn sự kiện realtime WebSocket STOMP tức thì khi tạo máy trạm mới.
      + Kiểm thử: `ManageComputersIntegrationTest` (5/5 tests PASS), `test_admin_computers_e2e.ps1` (8/8 bước PASS).
    - **Trang 2: Quản lý Thực đơn F&B & Kho món (`/admin/items`):**
      + Tự động `.trim()` khoảng trắng đầu/cuối tên món khi tạo và cập nhật.
      + Chống trùng tên món case-insensitive (`existsByNameIgnoreCaseAndIdNot`).
      + Safe Delete Integrity: Chặn xóa cứng món đã phát sinh đơn hàng trong `order_items` (HTTP 400); chuyển sang toggle `available = false` (báo hết hàng).
      + **Bảo toàn Dynamic Tariff cho gói Combo giờ chơi:** Bổ sung regex nhận diện `"tiếng"` / `"tiếng"` / `"giờ"` / `"h"` trong `extractPackageMinutes`. Khi bán gói combo trực tiếp tại quầy qua `OrderService.createDirectOrder`, quy đổi động ra số phút máy thực tế theo Zone máy (`VIP` 15k/h $\rightarrow$ 240 phút cho gói 6 tiếng), bảo toàn nguyên vẹn doanh thu phòng máy.
      + Kiểm thử: `ManageItemsIntegrationTest` (5/5 tests PASS), `test_admin_items_e2e.ps1` (9/9 bước PASS).
    - **Trang 3: Quản lý Tài khoản & Phân quyền (`/admin/accounts`):**
      + Auto-trim số điện thoại và họ tên khi tạo mới và cập nhật.
      + Bảo vệ Quản trị viên Tối cao: Chặn Admin tự xóa chính mình (`isSelf`) và chặn xóa/hạ quyền Quản trị viên duy nhất còn lại trong hệ thống (`countByRole(Role.ADMIN) <= 1`).
      + Safe Delete: Chặn xóa tài khoản đã có lịch sử nạp giờ (`time_purchases`), lịch sử phiên chơi (`sessions`), lịch sử đơn hàng (`orders`) hoặc nhân viên đã từng xác nhận giao dịch.
      + Active Session Protection: Chặn xóa và chặn đổi Role khi tài khoản đang có phiên chơi `ACTIVE` trên máy trạm.
      + Kiểm thử: `ManageAccountsIntegrationTest` (6/6 tests PASS), `test_admin_accounts_e2e.ps1` (9/9 bước PASS).
    - **Trang 4: Báo cáo Doanh thu & Thống kê (`/admin/reports`):**
      + **Cân đối sổ sách kế toán 100% (Zero Revenue Leakage):** Gom cả `Item.Type.SERVICE` và `Item.Type.PLAYTIME` vào doanh thu giờ chơi / dịch vụ, bảo đảm cân đối tuyệt đối: $\text{totalRevenue} = \text{F&B} + \text{Playtime} = \text{Cash} + \text{QR}$.
      + Chuẩn hóa mốc thời gian lọc `end.atTime(23, 59, 59)` loại bỏ lỗi làm tròn nanoseconds sang ngày hôm sau trên MySQL.
      + Bảo mật RBAC tuyệt đối: Toàn bộ controller khóa chặt `@PreAuthorize("hasRole('ADMIN')")`, chặn `STAFF` và `CUSTOMER` xem báo cáo tài chính (HTTP 403).
      + Kiểm thử: `ReportIntegrationTest` (6/6 tests PASS), `test_admin_reports_e2e.ps1` (9/9 bước PASS).

---

## 🟢 Kế hoạch kế tiếp:
1. **MS-4.2: Animation Audit & Motion Refinement**: Rà soát độ mượt mà của `PageTransition`, `StaggerContainer`, Modal mở/đóng, tôn trọng media query `prefers-reduced-motion`.
2. **MS-4.3: Loading & Skeleton Audit**: Rà soát toàn bộ trạng thái chờ nạp dữ liệu trên các bảng và thẻ.

---

## 🎯 Tổng kết chất lượng:
- **Backend:** 107 Java source files, 22/22 Integration tests chuyên sâu Phase 3 PASS 100%, 4 kịch bản E2E Live Server PASS 100%, bảo mật JWT, kiểm toán AuditLog, Dynamic Tariff và Quản lý Phân khu động.
- **Frontend:** React 19 + TypeScript + Vite + Tailwind 4 + Ant Design 6, `npm run build` PASS 100% (0 errors, 0 warnings). Đồng bộ 100% Liquid Glass 3D và hệ thống ZoneBadge trên toàn bộ Staff, Customer & Admin.
