# 📌 CyberNet Project Status Snapshot

> **Mục đích:** File trạng thái "nóng" (Hot Memory) siêu ngắn gọn (~30 dòng). AI chỉ cần đọc file này để biết chính xác tiến độ hiện tại mà không cần nạp `PLAN.md` hay `LOG.md`.

---

## 🟢 Cột mốc đã hoàn thành
- [x] **Phase 0: Data Model & Entity Layer** (100% DONE — 7 Entity cốt lõi).
- [x] **Phase 1: 3-Layer Architecture & DTOs** (100% DONE — CRUD & API cho Account, Computer, Item, TimePurchase, Session, Order). Biên dịch thành công 46 files.
- [x] **Phase 2: Complex Business Logic** (100% DONE — 5 Micro-Steps: UC-5 Auto-Expire Scheduler, UC-2 PC Login, UC-6 Transfer Computer with Dynamic Tariff, UC-7 Direct Order & Cancel, Concurrency Locking with Pessimistic + @Version). Biên dịch thành công 50 files.

---

## 🟡 Phase hiện tại: Phase 3 — Spring Security 6 & JWT
> **Mục tiêu:** Xác thực tài khoản, băm mật khẩu BCryptPasswordEncoder, cấp phát và xác thực JWT token (Access & Refresh), phân quyền Role-based Access Control (@PreAuthorize cho CUSTOMER, STAFF, ADMIN).

### Danh sách Task Phase 3 (Thứ tự triển khai):
- [ ] **Task 3.1:** Tích hợp Spring Security 6 + BCryptPasswordEncoder cho Account.
- [ ] **Task 3.2:** Xây dựng JwtService & JwtAuthenticationFilter (Access Token + Refresh Token).
- [ ] **Task 3.3:** Xây dựng AuthController & AuthService (Login cho NV/Quản lý, Refresh token).
- [ ] **Task 3.4:** Phân quyền chi tiết trên các Endpoints (@PreAuthorize cho ADMIN, STAFF, CUSTOMER).

---

## 🔜 Phase tiếp theo
- **Phase 4:** Báo cáo & Thống kê doanh thu (Aggregation Queries, DTO projection).
- **Phase 5:** Production-ready (Swagger, Logging, Docker, Flyway).
- **Phase 6:** Deploy VPS / Cloud.
