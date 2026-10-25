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

## 🟢 Kế hoạch kế tiếp:
1. **Bắt tay triển khai Phase 3: Admin Panel (Báo cáo doanh thu, Quản lý Máy trạm, Thực đơn F&B, Tài khoản người dùng)** bắt đầu từ **MS-3.1 (Admin Layout & RBAC Guard)**.
2. Kế thừa toàn bộ tiêu chuẩn thiết kế: Twinkle Luxury Theme, Badge Counter realtime, 2-column Option Dropdowns, và Kiến trúc Dynamic Tariff đã hoàn thiện.

---

## 🎯 Tổng kết chất lượng:
- **Backend:** 99 Java source files, 78/78 tests PASS 100%, Dynamic Tariff & Session Auto-Extend verified bằng live scripts.
- **Frontend:** React 19 + TypeScript + Vite + Tailwind 4 + Ant Design 6 (Twinkle CyberLux Theme), `npm run build` PASS 100% (0 errors, 0 warnings).
