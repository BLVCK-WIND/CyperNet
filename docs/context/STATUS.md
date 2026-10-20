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

---

## 🟢 Dự án: HOÀN THÀNH TOÀN DIỆN BACKEND & PHASE 6 (Sẵn sàng 100% cho UI Mockups)
> **Trạng thái:** Robust Real-time Backend Architecture Complete (73/73 Tests PASS, 47/47 Runtime HTTP Tests PASS)
- [x] **Phase 0 - Phase 5:** Core Backend & Production Architecture (100% DONE)
- [x] **Micro-Step 0:** Frontend Enablement (100% DONE)
- [x] **Phase 6:** All 7 Backend Gaps Resolved (100% DONE)
- [x] **Backend & Runtime Audit:** Hoàn tất rà soát thực tế (16 mục [ĐÃ SỬA], 4 mục [HOÃN] có giải pháp chốt, 0 mục [MỞ]).
- [ ] **Giai đoạn tiếp theo (Frontend UX/UI):** Bắt tay thực hiện MS-1.1 (Scaffold Project & Theme Setup) theo kế hoạch bàn giao frontend-handoff.md.

---

## 🎯 Tổng kết chất lượng:
- **Source Files:** 97 Java source files biên dịch hoàn hảo, 0 warning/error.
- **Unit & Integration Tests:** 73 test cases bao phủ toàn bộ chức năng, **PASS 100%**.
- **Runtime HTTP Tests:** 47 test cases trong `api-test.http`, **PASS 100%**.
- **Tài liệu & Tuân thủ:** Tuân thủ triệt để nguyên tắc Clean Code, 12-Factor App, Security RBAC, WebSocket STOMP và Diff-Only.
