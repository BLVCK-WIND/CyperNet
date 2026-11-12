# Tiến độ hiện tại — 13/11/2026

| Hạng mục | Kết quả |
|---|---|
| Báo cáo và múi giờ | Backend và bộ lọc báo cáo dùng ngày Việt Nam. Thời lượng phiên qua nửa đêm được chia theo ngày. Lượt mở được tính vào ngày bắt đầu, và báo cáo công suất tính cả máy có 0 lượt. |
| Truy vấn và migration V12 | Tải chi tiết đơn theo lô sau phân trang. Trang 5 đơn giảm từ 10 xuống 3 câu SQL, trang 15 đơn từ 20 xuống 3, và tổng quan doanh thu từ 7 xuống 3. V12 thêm index theo trạng thái và thời điểm xác nhận cho đơn hàng và phiếu nạp. |
| Đơn mua giờ duyệt muộn | Duyệt đơn cộng giờ cho tài khoản và gia hạn phiên khách đang chơi theo giá của phiên đó. Nếu khách đang nghỉ, giữ giờ trong tài khoản cho lần sau. Đơn vẫn ghi phiên lúc đặt. Đã kiểm tra trên API và trang khách của server demo. |
| Chuyển máy và giao món | Đã thống nhất giữ cách quy đổi và làm tròn hiện tại. Đơn giao theo máy lúc đặt. Khách báo nhân viên nếu đổi chỗ trong khi chờ món. |
| Đổi quyền tài khoản | Thu hồi cả access token và refresh token trên mọi thiết bị khi đổi vai trò. Giao diện yêu cầu đăng nhập lại ở yêu cầu kế tiếp. V13 yêu cầu đăng nhập lại một lần đối với token cấp từ phiên bản cũ. |

**Kiểm chứng gần nhất.** Toàn bộ 196 test backend và 45 test frontend đạt. MariaDB tạm đã kiểm tra nâng quyền, hạ quyền, đổi quyền rồi đổi lại, giữ phiên khi sửa tên và refresh đồng thời với đổi quyền. Chrome trên server demo đã hiện thông báo và về trang đăng nhập sau khi đổi quyền. Build và lint frontend thành công, còn cảnh báo hooks và bundle lớn. [Nhật ký triển khai](../notes/LOG.md)

**Các bước còn lại.** Kiểm thử thiết bị thật, rà kích thước bundle và hiệu năng với tải đại diện, xác minh backup/khôi phục, rồi nghiệm thu triển khai V13 trên môi trường đích. Bản sao CSDL quán đã diễn tập tới V11.1. V12 và V13 được kiểm thử trên schema tạm. [Hướng dẫn migration](../notes/migration-rollout.md)

---

# Tiến độ và nghiệm thu mục tiêu 1 — 11/11/2026

Bảng này ghi kết quả nghiệm thu tại ngày 11/11/2026. Các mục phía dưới lưu diễn biến theo từng mốc.

| Công việc trong mục tiêu 1 | Triển khai | Nghiệm thu của người dùng |
|---|---|---|
| Giới hạn đọc tài khoản STAFF/ADMIN | Xong | Đã xác nhận đạt |
| Routing QR: giữ mã bàn, thiếu mã phải quét lại, đổi bàn xác thực lại | Xong | Đã xác nhận đạt |
| Hội viên: server search/phân trang, thống kê tổng, bộ chọn khách chung | Xong | Đã xác nhận đạt |
| Tải máy trống khi mở máy từ trang hội viên | Xong | Đã xác nhận đạt cùng nhóm hội viên |
| Đơn hàng: lọc cả đơn không phiên, search server, phân trang chung hai cột | Xong | Người dùng báo hoàn tất ca 1 trên bản sao DB quán |
| Lỗi duyệt/hủy: giữ thông báo backend, lỗi mạng tiếng Việt, giữ modal | Xong | Ca 2 đạt khi thử duyệt lại đơn #688 từ tab thứ hai |
| Summary theo ngày Việt Nam và lỗi riêng từng nguồn Admin | Xong | Ca 3 đạt với số liệu trong ngày và bộ lọc. Ca 4 đạt khi chặn riêng doanh thu rồi thử lại. Trường hợp qua ngày đã có test tích hợp và còn chờ mẫu để đối chiếu trên giao diện |
| Nhãn CONFIRMED hiển thị “Đã thanh toán” | Xong | Người dùng xác nhận đạt ngày 11/11/2026 |
| Đối chiếu tài liệu và kiểm thử hồi quy mục tiêu 1 | Đã cập nhật tài liệu và chạy kiểm thử | Đã ghi nhận kết quả bốn ca trên `tiemnet_qa_v11` |

**Nghiệm thu ngày 11/11/2026** dùng bản khôi phục `tiemnet_qa_v11` từ DB quán. Bản sao đã nâng từ V9 lên V11.1 và khởi động lại với `out-of-order=false`. Chi tiết các ca nằm trong [bản bàn giao](../notes/frontend-handoff.md#7-kết-quả-nghiệm-thu-trên-bản-sao-db-quán).

**Các giai đoạn chưa hoàn tất:** QA thiết bị thật và gián đoạn (iPhone Safari, camera QR, bàn phím, background/resume, offline, reduced motion); rà hiệu năng/bundle; kiểm tra backup/khôi phục và triển khai/migration thật. Đã có kiểm thử backend, responsive/emulator và diễn tập migration trên bản sao trước đây; không coi đó là nghiệm thu thiết bị thật hoặc đã nâng CSDL thật.

**Kiểm thử hồi quy ngày 11/11/2026.** 48 test backend trong 7 lớp và 41 test frontend offline đều đạt. Sáu lớp tích hợp dùng CSDL tạm riêng. Build và lint thành công, còn cảnh báo React hooks và bundle lớn. Danh sách test và checklist trình duyệt nằm trong bản bàn giao.

---
# Queue daily summary and independent Admin KPI errors — implemented 2026-11-10

Approved rules: new orders use createdAt; paid count/F&B revenue use confirmedAt, on the Vietnam calendar day [start, next-day start). Pending totals include both waiting states across all history and separately identify prior-day backlog. Tab totals remain all-history; list search/pagination do not affect summary. New STAFF/ADMIN GET /api/orders/summary aggregates SQL without the 100-row cap or line-item count duplication; financial report APIs remain ADMIN-only. No schema/migration or payment-state changes.

Staff UI consumes one summary query, refreshes after confirm/cancel, shows day/backlog and failure/retry states without hiding the order list. Admin KPI revenue, all computer pages and active-session metadata use separate scoped queries; a failed source shows unavailable values rather than zero, with its own retry and last-success timestamp. Day keys/timestamps use Asia/Ho_Chi_Minh and update at midnight/on focus. Admin has 125-machine and >100-session metadata regression coverage.

Validation: 26 backend tests (OrderSummaryIntegrationTest 7, OrderQueueSearchIntegrationTest 11, Phase4ReportIntegrationTest 8), all pass. 41 offline frontend regressions pass (17 orders, 7 statistics, 7 accounts, 10 QR). Production build/lint pass with existing hook/large-chunk warnings. Boundary fixtures include 258 orders, mixed FOOD/DRINK/PLAYTIME/SERVICE lines, old-created/new-paid orders, empty data, exact day boundaries, confirm/cancel updates and RBAC. Browser acceptance remains for the user; no automated browser QA in this step.

New disposable demo: frontend 5173/API 8081; 245 orders, 125 computers. Staff summary initially pending=80, backlog=10, createdToday=234, confirmedToday=145, F&B today=2,400,000 VND. Admin revenue=3,282,000 VND, machines=125 (1 in use, 101 available, 23 maintenance), active sessions=1. Order #82 was created yesterday and paid today. API checks verified these values and STAFF financial-report 403. Demo seed values reset on launcher restart; the live cafe database was not migrated.

Next: propose/review remaining CONFIRMED paid labels and reconcile documentation/combined acceptance, then physical-device/interruption QA and deployment/performance gates. Earlier acceptance-pending entries record their own evidence; do not treat implementation completion as user acceptance.

---

# Order action error messages — implemented, acceptance pending 2026-11-10

Approved scope: frontend confirm/cancel error presentation in the staff queue. Shared getApiErrorMessage reads direct ErrorResponse.message, raw Axios response.data.message, then the action fallback. Malformed/non-string messages do not render as objects or HTML. Network/timeout errors use Vietnamese connection/reload guidance. No interceptor, backend, database schema or payment-rule changes.

Failure keeps the action modal open, stops processing, emits no success notification/cache refresh and sends no automatic retry. Existing success behavior still closes the modal and invalidates the queue/status summaries.

Validation: 14 offline order UI/hook/API tests pass (7 additional cases cover message formats/network/malformed errors, deferred failures and successful confirm/cancel). Frontend build/lint pass with existing warnings. Backend tests were not rerun because no backend code changed. Browser acceptance remains for the user, using two tabs with the same pending CASH order; a stale second operation should show the backend state error and keep its modal open. Demo servers remain 5173/8081 on the existing disposable database.

Next task to investigate and propose: daily queue statistics and Admin failure/zero states. CONFIRMED paid labels and remaining documentation reconciliation follow. No implementation of those tasks is authorized by this step.

---

# Order queue search/pagination — implemented, acceptance pending 2026-11-10

Approved: exact #ID/ORD-ID search; ordinary keyword searches machine/phone/name (case/accent insensitive including Vietnamese d-stroke); one shared page for kitchen/cashier lanes, default 20 with 50 optional. Existing /api/orders/search now receives keyword; filters use direct order links with session fallback, including sessionless/legacy orders. Stable createdAt/id ordering preserves FIFO for both pending statuses and includes previous-day backlog. No database schema change.

Frontend sends filters to the server, resets page on filter/size changes, cancels old requests, labels lane counts as page-local and returns to a valid page after rows disappear. Switching page/filter establishes the notification baseline; local confirm/cancel refreshes all status summaries. Statistics calculations, generic action-error handling and payment labels remain separate tasks.

Validation: 16 backend integration tests (11 order-search regressions + 5 existing search/upload tests); 7 offline order UI/hook/API regressions, plus 7 account and 10 QR frontend regressions. Build/lint pass with hook/large-bundle warnings. Disposable demo uses 120 orders; user browser acceptance pending. Live cafe database untouched.

Current completion tracker:
- User-accepted: account read RBAC; QR routing; account directory/search/summary/shared selector; member quick-action machine loading.
- Implemented, awaiting user acceptance: order filters/search/shared pagination (this step).
- Next, requires proposal/approval: daily queue statistics and Admin error/zero handling; CONFIRMED label changed to paid; remaining documentation reconciliation and combined regression acceptance.
- Later milestones: physical-device/interruption QA; performance/bundle and deployment/backup/migration gates.

---

# Account directory/search/summary — implemented 2026-11-10

Approved scope: server pagination and keyword search (phone/name substring, accent/case insensitive including d/d-stroke; #ID exact), role-scoped SQL summary, shared paginated customer selector and cache refresh after account mutations. STAFF read restrictions remain enforced before search/pagination/counting. Summary is independent of list filters; minutes aggregate CUSTOMER standard minutes only. Selection is fetched by ID so an older/newly registered customer remains available outside the result page.

Additional approved fix: opening a session from the member directory fetches AVAILABLE computers through the existing API, following all pages, with loading/retry/empty states. No payment or gaming business rules changed.

Verification: 31 backend integration tests across five account-related classes, 7 offline frontend regression tests, production build and lint (existing hook/large-bundle warnings). Tests use disposable databases. User reported browser acceptance PASS in this chat; automated tests remain separate evidence. The live cafe database was not migrated.

---

# QR routing — implemented and user-accepted 2026-11-10

Approved option A: preserve QR codes through root/customer redirects, require rescanning for missing/blank codes, and reauthenticate when scanning a different table. Clear the previous local customer auth/query cache, without ending the gaming session on that PC. Save the new context only after successful authentication; block unverified/invalid PC submission and ignore stale responses after navigation/table changes.

Ten automated route/store/component tests pass via `npm --prefix frontend run test:qr`. These are offline unit tests, not browser/device acceptance. Frontend build/lint pass with warnings; the test harness uses Node experimental VM modules without new dependencies. Browser automation was denied permission to open the local site; the user subsequently reported browser acceptance PASS in this chat. No backend or database changes are part of this step.

---

# Account read permissions — completed 2026-11-10

Approved scope: account reads only. STAFF lists are restricted to CUSTOMER before pagination/counting; explicit STAFF/ADMIN filters and reads of another management account return 403. STAFF can read their own profile; ADMIN access is retained. The Staff member page requests CUSTOMER and hides the role selector for STAFF. Both API contracts and the handoff describe these rules.

Verification: 33 tests passed, zero failures/errors/skips across AccountReadAccessIntegrationTest (9 new cases), CurrentAccountIntegrationTest, Phase6CrudEndpointsIntegrationTest, ManageAccountsIntegrationTest and Phase3SecurityIntegrationTest. These used the existing disposable-database harness. Frontend production build and lint passed; large-bundle and React hook warnings remain. No browser QA or live database migration was performed in this step. QR, pagination, order statistics and payment labels remain separate work requiring review and approval.

---

# Emulator QA — completed 2026-11-09

LDPlayer Android Chrome passed password-free login, menu/cart navigation, cash order submission and history checks. Responsive dashboard/menu checks passed at 320–412px and landscape; actions now have 48px minimum height and stack below 360px. Frontend build passes. See `docs/notes/emulator-qa.md`; physical iPhone/keyboard/camera testing remains pending.

---

# Restored-copy migration rehearsal — completed 2026-11-09

The configured local V9 database copy upgraded to V11.1 with preserved business-table counts, valid order links and snapshots, repeat Flyway validation and Hibernate startup. The copy was removed; the source database was not upgraded. See `docs/notes/migration-rehearsal.md`. Next: physical Android/iPhone acceptance and a verified deployment backup before any live rollout.

---

# Browser/mobile QA — completed 2026-11-09

Customer cash/QR ordering, staff approval, idle-account top-ups and Admin reports were verified using disposable QA data. Fixed balance refresh, QR failure feedback, revenue labels and narrow-screen actions. **147 backend tests / 28 classes pass; frontend build and lint pass with existing warnings.** See `docs/notes/browser-mobile-qa.md` for scope and limits. Restored-copy rehearsal is recorded above; physical-device acceptance remains pending.

---

# Full backend suite — verified 2026-11-09

**144 tests / 27 classes passed; 0 failures, errors or skipped tests.** All 24 test databases were confirmed removed. Ordinary backend tests now use disposable databases by default. See `docs/notes/backend-suite-verification.md` for fixture corrections, command and limits. Browser/mobile QA is recorded above; migration rehearsal remains pending.

---

# Ownership and billing safety update — 2026-11-09

Ownership guards, serialized payment/session transitions, expiry recheck, package/tariff snapshots and sessionless spending aggregation are implemented. See `docs/notes/ownership-billing-review.md` for behavior and verification, and `docs/notes/migration-rollout.md` before deployment. Mobile ordering remains password-free.

---

# Implementation reconciliation ? 2026-11-09

This section supersedes older snapshot claims below. Source manifests declare Java 17, Spring Boot 4.1.1, React 19, Ant Design 6, Tailwind 4, Zustand and TanStack Query.

- Customer mobile ordering remains password-free. Existing CUSTOMER phone numbers only; unknown numbers return 404 NOT_FOUND with counter-registration guidance; STAFF/ADMIN return 403 FORBIDDEN before tokens are issued.
- PC gaming login continues to require a password. Idle-PC QR login returns session=null and does not start play or deduct minutes.
- Zone codes are catalog-backed strings, not a fixed enum. New assignments require an active zone; unchanged inactive assignments remain editable. Computer price remains authoritative.
- Staff dashboard contains operational metrics and does not query Admin financial reports. Counts load all computer pages.
- Admin CRUD, reports and dashboard already exist. Shared reduced-motion behavior and dashboard loading/retry states have been implemented; browser-wide visual QA remains pending.
- Verification: Java/test compilation and 7 isolated customer/zone/error tests passed; frontend production build passed with a large-bundle warning. Lint exits successfully with warnings. Later backend integration and browser verification results are recorded above.
- Migration rollout: see `docs/notes/migration-rollout.md`. Existing applied scripts were preserved; startup no longer repairs migration checksums automatically.

---

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
      + *Bước 2 (Chờ quầy xác nhận):* Khách chuyển khoản VietQR xong, bấm "TÔI ĐÃ CHUYỂN KHOẢN" trên modal -> Gọi `PATCH /api/orders/{id}/notify-transferred` -> Chuyển sang `WAITING_CONFIRMATION` ("Đã CK • Chờ quầy duyệt"), lưu `transferredAt`. Hàng đợi Staff nhận trạng thái qua polling, nút Xác nhận đổi sang cyan/emerald bật sáng.
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
