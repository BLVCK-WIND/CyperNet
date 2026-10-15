# 📌 CyberNet Project Status Snapshot

> **Mục đích:** File trạng thái "nóng" (Hot Memory) siêu ngắn gọn (~30 dòng). AI chỉ cần đọc file này để biết chính xác tiến độ hiện tại mà không cần nạp `PLAN.md` hay `LOG.md`.

---

## 🟢 Cột mốc đã hoàn thành
- [x] **Phase 0: Data Model & Entity Layer** (100% DONE — 7 Entity cốt lõi).
- [x] **Phase 1: 3-Layer Architecture & DTOs** (100% DONE — CRUD & API cho Account, Computer, Item, TimePurchase, Session, Order). Biên dịch thành công 46 files.
- [x] **Phase 2: Complex Business Logic** (100% DONE — 5 Micro-Steps: UC-5 Auto-Expire Scheduler, UC-2 PC Login, UC-6 Transfer Computer with Dynamic Tariff, UC-7 Direct Order & Cancel, Concurrency Locking with Pessimistic + @Version). Biên dịch thành công 50 files.
- [x] **Phase 3: Spring Security 6 & JWT** (100% DONE — Spring Security 6, BCrypt, JWT Access Token, Database-backed RefreshToken, AuthController, Role-based @PreAuthorize). Biên dịch thành công 62 files.

---

## 🟡 Phase hiện tại: Phase 4 — Báo cáo & Thống kê doanh thu
> **Mục tiêu:** Báo cáo & Thống kê doanh thu (Aggregation Queries, DTO projection).

---

## 🔜 Phase tiếp theo
- **Phase 4:** Báo cáo & Thống kê doanh thu (Aggregation Queries, DTO projection).
- **Phase 5:** Production-ready (Swagger, Logging, Docker, Flyway).
- **Phase 6:** Deploy VPS / Cloud.
