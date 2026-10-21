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

## ⚠️ CHECKLIST BẮT BUỘC TRƯỚC KHI BẮT ĐẦU PHASE 2 (MUST-FIX ĐẦU PHIÊN SAU)
> **Nhiệm vụ bắt buộc:** Bổ sung thuộc tính `imageUrl` (ảnh món ăn) cho Thực đơn & Món ăn:
- [ ] **Backend (Item Entity & DTOs):** Bổ sung trường `imageUrl` (String) vào `Item`, migration Flyway V4 thêm cột `image_url VARCHAR(500)` vào bảng `items`, cập nhật `ItemResponse`, `CreateItemRequest`, `UpdateItemRequest` và script nạp sẵn ảnh mẫu (mì tôm, Sting dâu/vàng, gà rán, bò húc, nước suối...).
- [ ] **Frontend (Customer Menu & Cart):** Cập nhật `types/item.ts` (`imageUrl?: string`), chỉnh sửa `MenuCard.tsx` hiển thị ảnh món ăn thật với thumbnail bo góc đẹp mắt (fallback sang Lucide Icon nếu không có ảnh), cập nhật `CartDrawer.tsx` và `OrderDetailDrawer.tsx`.

---

## 🟢 Kế hoạch kế tiếp:
1. **Ưu tiên 1:** Hoàn thành Checklist Must-Fix: Bổ sung thuộc tính `imageUrl` và hiển thị ảnh món ăn cho Menu Phase 1.
2. **Ưu tiên 2:** Bắt tay triển khai **Phase 2: Staff Dashboard (Floor Map sơ đồ máy, POS nạp giờ, Order Queue duyệt đơn & chuyển máy)**.

---

## 🎯 Tổng kết chất lượng:
- **Backend:** 97 Java source files, 73/73 tests PASS 100%, 47/47 runtime HTTP tests PASS.
- **Frontend:** React 19 + TypeScript + Vite + Tailwind 4 + Ant Design 5 (CyberLux Theme), `npm run build` PASS 100% (code 0).
