# Bàn giao nghiệm thu mục tiêu 1 — 11/11/2026

Phần đầu ghi trạng thái hiện hành và checklist nghiệm thu. Các mốc phía dưới lưu kết quả đã ghi nhận khi bàn giao từng phần.

## 1. Trạng thái hiện hành

- Đã triển khai và người dùng xác nhận đạt: quyền đọc tài khoản; routing QR; search/phân trang/summary hội viên và bộ chọn khách chung; tải máy trống khi mở máy từ hội viên.
- Người dùng đã thử lọc/phân trang, từ chối duyệt lại đơn, đối chiếu số liệu hôm nay và lỗi riêng Admin trên bản sao DB quán. Kết quả nằm ở mục 7.
- Nhãn `CONFIRMED` đã hiển thị “Đã thanh toán” trên các màn hình đơn hàng của Staff, khách và Admin. Người dùng xác nhận đạt ngày 11/11/2026.
- Đã ghi nhận kết quả hồi quy của mục tiêu 1. Ca qua ngày còn chờ đối chiếu trên giao diện khi có mẫu phù hợp.
- Backend đã đo lại số truy vấn hàng đợi và báo cáo. Các bước còn lại gồm QA thiết bị thật/gián đoạn, tối ưu bundle, backup/khôi phục và rollout migration thật. [Tiến độ hiện tại](../context/STATUS.md)
- Trong các hướng dẫn demo bên dưới, dùng mật khẩu được cấp lúc tạo dữ liệu mẫu cho `DEMO_PASSWORD`.

## 2. Quy tắc làm việc bắt buộc

1. Khảo sát chỉ đọc → báo cáo vấn đề và bằng chứng → trình phạm vi refactor/kiểm chứng → chờ duyệt rõ ràng → triển khai → test/build → bàn giao người dùng nghiệm thu.
2. Không tự đoán nghiệp vụ hoặc điểm mơ hồ: hỏi trực tiếp, đưa lựa chọn và đề xuất.
3. Có nhiều thay đổi có sẵn trong checkout, gồm cả thay đổi của người dùng và các bước đã duyệt. Không reset/clean/checkout hàng loạt hoặc hoàn tác chúng; không tự commit.
4. Tiếp tục dùng CSDL demo riêng như đã chọn; không chạy ứng dụng với datasource tiệm thật hoặc tự chạy migration thật. Không thay quy tắc tài chính trong một task sửa hiển thị.
5. Công cụ trình duyệt đã bị từ chối mở local site trước đây; không thử đường vòng. Kiểm thử offline/API đã thực hiện; nghiệm thu giao diện do người dùng làm.

## 3. Các quyết định đã chốt

- STAFF chỉ đọc CUSTOMER và hồ sơ chính mình; ADMIN giữ quyền quản lý. `/api/reports/**` vẫn ADMIN-only.
- QR giữ mã máy từ URL; thiếu mã không dùng bàn cũ/PC-01; đổi bàn xác thực lại và không kết thúc phiên ở bàn cũ. Mobile vẫn không cần mật khẩu.
- Search tài khoản: `#ID` chính xác; chuỗi thường tìm SĐT/tên, không dấu/không phân biệt hoa thường.
- Search đơn: `#ID` hoặc `ORD-ID` chính xác; chuỗi thường tìm máy/SĐT/tên. Hỗ trợ đơn `session=null`, liên kết trực tiếp ưu tiên hơn liên kết qua phiên.
- Hàng đợi gồm PENDING_PAYMENT và WAITING_CONFIRMATION, FIFO; hai cột dùng chung 20/50 bản ghi, số đếm cột chỉ là trên trang đó. Không loại đơn tồn hôm trước.
- Ngày thống kê: Asia/Ho_Chi_Minh, từ đầu ngày (bao gồm) tới đầu ngày kế tiếp (không bao gồm). Lượt gọi theo createdAt; đơn thanh toán và F&B theo confirmedAt.
- Số đếm tab/pending là toàn lịch sử; backlog là pending tạo trước hôm nay. F&B chỉ FOOD/DRINK theo snapshot, không cộng PLAYTIME/SERVICE/POS. Không cộng tiền từ trang đầu để làm tổng.
- Lỗi duyệt/hủy giữ modal, tắt loading, không báo thành công/không tự gửi lại yêu cầu. Lỗi mạng cần kiểm tra kết nối và tải lại đơn trước khi thử lại.
- Admin lỗi nguồn nào chỉ nhóm đó hiện unavailable/Thử lại; số 0 phải đến từ dữ liệu thành công; timestamp là lần tải thành công từng nguồn.
- `CONFIRMED` hiển thị “Đã thanh toán”. `WAITING_CONFIRMATION` cho biết khách đã báo chuyển khoản và quầy đang chờ xác nhận. Các nhãn này mô tả trạng thái thanh toán.

## 4. Kiểm chứng mới nhất

- Backend ngày 11/11/2026 đạt 48 test trong 7 lớp. Sáu lớp tích hợp dùng CSDL tạm riêng, còn MobileCustomerAccessTest dùng mock. AccountDirectoryIntegrationTest (8), AccountReadAccessIntegrationTest (9), CurrentAccountIntegrationTest (3), MobileCustomerAccessTest (2), OrderQueueSearchIntegrationTest (11), OrderSummaryIntegrationTest (7) và Phase4ReportIntegrationTest (8).
- Frontend ngày 11/11/2026 đạt 41 test offline gồm `test:orders` (17), `test:stats` (7), `test:accounts` (7) và `test:qr` (10).
- `npm --prefix frontend run build` và `npm --prefix frontend run lint` thành công; còn cảnh báo hooks và bundle lớn.
- Người dùng đã đối chiếu thống kê hôm nay trên trình duyệt với đơn #688. Kiểm thử tích hợp bao phủ đơn tồn và thời điểm thanh toán qua ngày.
- Log lần chạy này nằm trong `target/goal1-backend.log`, `target/goal1-test-{orders,stats,accounts,qr}.log`, `target/goal1-build.log` và `target/goal1-lint.log`.

## 5. Dữ liệu demo để đối chiếu

- Frontend demo dùng 127.0.0.1:5173 và backend dùng 127.0.0.1:8081. Kiểm tra hai tiến trình trước khi nghiệm thu lại sau khi khởi động máy.
- Login: http://127.0.0.1:5173/staff/login. STAFF 0999000002, ADMIN 0999000001. Mật khẩu chung demo: DEMO_PASSWORD.
- Demo tổng 245 đơn, 125 máy. Ban đầu: 80 đơn chờ (10 tồn), 234 lượt mới hôm nay, 145 đơn thanh toán hôm nay, F&B 2.400.000đ. Admin: 3.282.000đ thực thu, 125 máy (1 dùng/101 trống/23 bảo trì), 1 phiên hoạt động.
- Đơn #80: PC-02, không phiên, khách 0888800001/Nguyễn Minh Anh. Đơn #82: tạo hôm trước, xác nhận hôm nay. Số liệu sẽ thay đổi nếu người dùng duyệt/hủy đơn hoặc qua ngày.
- Kiểm tra lỗi riêng Admin: DevTools Network → chọn request doanh thu ngày `/api/reports/revenue/summary` → Block request URL (không chặn cả domain) → Làm mới. Máy/phiên vẫn có số; doanh thu/giao dịch báo lỗi và không tăng timestamp thành công. Bỏ chặn rồi thử lại.
- Launcher demo: target/StatisticsDemo.java; classpath: target/browser-qa.classpath; log: target/manual-demo-backend.log. Các tệp target bị Git ignore và có thể mất khi clean; chúng không phải công cụ triển khai chính thức.
- Launcher tự tạo DB `cybernet_browser_<UUID>` và drop chính DB đó khi tiến trình kết thúc. Không dùng PID cũ để dừng tiến trình. Nếu cần chạy lại, kiểm tra quyền sở hữu/cổng và nội dung launcher trước, biên dịch source hiện tại, rồi khởi động với classpath đó; phải giữ datasource demo riêng. Vite cần `VITE_API_BASE_URL=http://127.0.0.1:8081`.

## 6. Checklist nghiệm thu hồi quy

Dùng tài khoản và địa chỉ demo ở mục 5. Đối chiếu số liệu theo dữ liệu hiện có của ngày Việt Nam. Sau mỗi ca, ghi **Đạt** hoặc ghi màn hình, thao tác và kết quả thực tế nếu lệch.

| Ca | Thao tác | Kết quả mong đợi |
|---|---|---|
| Lọc và phân trang đơn | Mở `/staff/orders`. Tìm `#80` ở tab Tất cả, thử lọc QR rồi tiền mặt. Xóa từ khóa, sang trang 2 và đổi bộ lọc hoặc cỡ trang. | Đơn QR PC-02 có `session=null` vẫn tìm được. Bộ lọc tiền mặt loại đơn này. Đổi bộ lọc hoặc cỡ trang đưa về trang 1. Bếp và Thu ngân dùng cùng trang, số đếm từng cột tính trên trang đó. |
| Lỗi duyệt hoặc hủy | Mở modal thao tác cho cùng một đơn tiền mặt đang chờ ở hai tab. Có thể dùng đơn `#1` nếu đơn vẫn đang chờ. Xử lý ở tab A rồi gửi thao tác từ modal còn mở ở tab B. Nếu cần đối chiếu lỗi mạng, mở modal trên một đơn khác và chuyển tab sang Offline trước khi gửi. | Tab A thành công và danh sách cập nhật. Tab B hiện lỗi trạng thái từ backend, giữ modal và tắt loading. Khi Offline, thông báo hướng dẫn kiểm tra kết nối và tải lại đơn. Sau khi bật Online, tải lại trạng thái trước khi thao tác lại. |
| Thống kê ngày | Ghi số liệu ban đầu trên `/staff/orders`. Đổi từ khóa, bộ lọc và trang. Tìm đơn `#82` để đối chiếu đơn tạo hôm trước và thanh toán trong ngày tạo bộ dữ liệu demo. Xử lý một đơn tiền mặt đang chờ trên demo. | Đổi bộ lọc không đổi tổng thống kê. Đơn tồn vẫn hiện ở Chờ xử lý. Lượt gọi theo ngày tạo, đơn đã thanh toán và F&B theo ngày xác nhận. Số chờ và tổng tiền cập nhật sau xử lý. |
| Lỗi một nguồn Admin | Mở `/admin/dashboard`, chặn riêng request doanh thu ngày `/api/reports/revenue/summary` trong DevTools rồi bấm Làm mới. Bỏ chặn và thử lại. | Nhóm doanh thu/giao dịch hiện `—` và cho thử lại. Máy/phiên vẫn hiển thị. Mốc thành công gần nhất giữ nguyên trong lúc lỗi và cập nhật sau khi tải thành công. |

Phân quyền, QR, hội viên và nhãn thanh toán đã được người dùng xác nhận đạt.

## 7. Kết quả nghiệm thu trên bản sao DB quán

Ngày 11/11/2026, người dùng khôi phục dữ liệu từ `tiemnet_db` vào `tiemnet_qa_v11` và xác nhận bản sao có 26 đơn ở V9 trước khi nâng. Flyway báo thành công cho V6.1, V10, V11 và V11.1. Backend khởi động lại ở cổng 8082 với `out-of-order=false`. Frontend nghiệm thu dùng cổng 5174. Ba tài khoản QA và đơn thử #688 được tạo trong bản sao.

| Ca | Kết quả ghi nhận |
|---|---|
| 1. Lọc và phân trang | Người dùng báo đã hoàn tất ca với dữ liệu bản sao. Đơn QR #678 là đơn tại bàn không có phiên và #685 là đơn tiền mặt. |
| 2. Duyệt lặp | Tab A duyệt đơn tiền mặt #688. Tab B báo đơn đã ở `CONFIRMED`. Ảnh cho thấy modal vẫn mở và nút duyệt đã hết loading. |
| 3. Thống kê theo ngày | Người dùng xác nhận 0 đơn chờ, 0 đơn tồn, 1 đơn thanh toán, 1 lượt gọi và 112.000đ F&B. Tìm #678 không đổi các thẻ tổng. Đơn tồn và đơn thanh toán qua ngày còn chờ mẫu để kiểm tra trên giao diện. `OrderSummaryIntegrationTest` đã kiểm tra các tình huống này. |
| 4. Lỗi riêng nguồn Admin | Khi chặn request doanh thu ngày, hai thẻ doanh thu và giao dịch hiện `—` và nút thử lại. Máy, phiên và truy vấn báo cáo 7 ngày vẫn có dữ liệu. Người dùng xác nhận phục hồi đạt sau khi bỏ chặn và thử lại. |

Giai đoạn kế tiếp trong kế hoạch là QA trên thiết bị thật và khi kết nối gián đoạn.

---
## Daily summary/Admin KPI acceptance — 2026-11-10

Implementation: GET /api/orders/summary for STAFF/ADMIN, SQL aggregation across all orders. CountsByStatus/tabs and pending amounts cover all history; backlog is pending created before today. New calls today use createdAt; paid count/F&B today use confirmedAt. FOOD/DRINK snapshot subtotals exclude playtime/service/POS. Date window is Vietnam [00:00, next 00:00), independent of browser timezone/list filters. Admin reads revenue, complete computer pages and session totalElements independently; failures show unavailable values and source-specific retry/last-success time. Auto day rollover/focus is covered offline.

New demo: http://127.0.0.1:5173/staff/login; Staff 0999000002, Admin 0999000001; password DEMO_PASSWORD. Separate synthetic database, 245 orders and 125 computers. Initial Staff values: 80 pending including 10 old backlog, 234 calls created today, 145 confirmed today, F&B 2,400,000 VND. Initial Admin: 3,282,000 VND revenue, 125 machines (1 in use/101 available/23 maintenance), 1 active session. Order #82 illustrates created yesterday/paid today. Search/filter/page changes must not change the cards. Confirm/cancel updates their relevant values.

For partial Admin failure: in browser DevTools Network, locate the daily /api/reports/revenue/summary request, right-click and block that request URL (not the whole API domain), then click KPI Refresh. After the request enters error state, revenue/transaction cards should show unavailable/error/retry; machine/session groups still work. A failed refresh must not advance the failed source's last-success timestamp. Remove the block and retry; real numbers should return. This browser exercise is for the user; offline tests cover the states but do not constitute browser acceptance.

26 backend integration tests and 41 offline frontend tests pass; build/lint pass with existing warnings. Backend/DTO contract documented in both matching API contract copies. No live database migration; no real payment. Remaining paid-label/documentation work requires its own review before edits.

---

## Order action error acceptance — 2026-11-10

Confirm/cancel now use the shared API error-message reader. Direct backend messages are preserved; raw Axios error bodies are supported; missing/invalid messages use the action fallback. Network/timeouts show Vietnamese instructions to check the connection and reload before retrying. Failed actions keep the modal open, clear loading and do not automatically retry. Backend and payment rules are unchanged.

Manual demo: login at http://127.0.0.1:5173/staff/login, Staff 0999000002 / DEMO_PASSWORD, then /staff/orders. In two tabs, find the same pending CASH order and open its confirmation modal in both. Confirm in tab A; confirm the stale modal in tab B. Tab B should show the backend's order-state error (not a generic error), keep the modal open, stop loading and emit no success message. Repeat with a stale cancellation modal if needed. For a network check, open a modal before setting the browser Network panel to Offline; submit, verify Vietnamese feedback/loading reset, restore Online and reload the order before another action. No real payment is required.

14 offline order regressions and production build/lint pass; browser acceptance remains pending. The next task is daily queue statistics/Admin failure states, pending a separate proposal and approval; payment labels are also still pending.

---

## Order queue acceptance — 2026-11-10

Implemented per user approval: /api/orders/search with keyword + server filters/pagination; direct machine/account identity with session fallback; #ID/ORD-ID exact search; unaccented names; one shared 20/50 page split into kitchen/cashier lanes. Previous-day pending orders remain visible; timestamp ties are ordered by ID. Account and QR steps already passed user acceptance.

Demo: http://127.0.0.1:5173/staff/login then /staff/orders. Staff 0999000002 (Admin 0999000001), password DEMO_PASSWORD. New disposable data starts with 120 orders: 80 pending (40 CASH, 40 QR waiting confirmation), 20 confirmed, 20 canceled. First 10 pending orders were created yesterday. Order #80 belongs to customer 0888800001, Nguyen Minh Anh (stored with Vietnamese accents), placed on idle PC-02 without a session; it lies outside the first 50 pending FIFO results. Search #80, ORD-80, nguyen or 0888800001. Switching CASH hides it; QR shows it. Both lane counts refer only to the current page. No actual bank transfer is involved.

Verify page navigation, first-page reset after filtering, shared lane counts, old backlog, and confirm/cancel refresh. Search/pagination has automated coverage; browser acceptance remains for the user. Daily statistics, generic error normalization and CONFIRMED label changes belong to the next tasks and are not claimed complete here.

---

## Account directory acceptance — disposable local demo (2026-11-10)

- Frontend: http://127.0.0.1:5173/staff/login; API: 127.0.0.1:8081. Demo lifetime is the launcher process; no live cafe schema migration.
- Staff phone: `0999000002`; Admin phone: `0999000001`; password for both: `DEMO_PASSWORD` (demo only).
- Initial dataset: 127 CUSTOMER; Admin sees 131 accounts (2 ADMIN, 2 STAFF). Summary: 15,240 standard minutes, independent of list search/role/page.
- Customer ID `7`, phone `0888800001`, name Nguyen Minh Anh (stored with Vietnamese accents), lies outside the first 100 results sorted id descending. Search `nguyen`, full phone or `#7`; plain `7` is a phone/name substring query.
- Manually verify pagination; summary unchanged while searching/filtering; member quick actions preserve selection and show available machines; POS can search/select this older member, load more and keep a newly registered selection.
- Verified: 31 backend integration tests, 7 offline frontend regressions, build/lint (warnings remain); demo login, search, exact ID and scoped summaries checked via API. Browser acceptance is for the user; no automated browser acceptance claim.

---

# Implementation reconciliation ? 2026-11-09

This section supersedes older snapshot claims below. Source manifests declare Java 17, Spring Boot 4.1.1, React 19, Ant Design 6, Tailwind 4, Zustand and TanStack Query.

- Customer mobile ordering remains password-free. Existing CUSTOMER phone numbers only; unknown numbers return 404 NOT_FOUND with counter-registration guidance; STAFF/ADMIN return 403 FORBIDDEN before tokens are issued.
- PC gaming login continues to require a password. Idle-PC QR login returns session=null and does not start play or deduct minutes.
- Zone codes are catalog-backed strings, not a fixed enum. New assignments require an active zone; unchanged inactive assignments remain editable. Computer price remains authoritative.
- QR routing update (2026-11-10, approved option A): preserve the scanned code through redirects; missing code requires rescanning, without a saved/default PC fallback. Scanning a different table requires phone authentication again. Local customer auth/query caches are cleared before reauthentication; the gaming session on the previous PC is never ended by this flow. Ignore stale login responses after table changes. User reported browser acceptance PASS in this chat; automated routing/store tests cover these rules.
- Staff dashboard contains operational metrics and does not query Admin financial reports. Counts load all computer pages.
- Admin CRUD, reports and dashboard already exist. Shared reduced-motion behavior and dashboard loading/retry states have been implemented; browser-wide visual QA remains pending.
- Verification: Java/test compilation and 7 isolated customer/zone/error tests passed; frontend production build passed with a large-bundle warning. Lint exits successfully with warnings. Full database integration and browser verification have not been performed.
- Migration rollout: see `docs/notes/migration-rollout.md`. Existing applied scripts were preserved; startup no longer repairs migration checksums automatically.

---

# 🤝 CyberNet — Tài Liệu Bàn Giao Phát Triển Frontend (Frontend Handoff)

> **Mục tiêu:** Cung cấp tài liệu bàn giao cô đọng (~1 trang) để lập trình viên Frontend hoặc phiên làm việc kế tiếp có thể bắt tay thực hiện ngay **MS-1.1** mà không cần đọc lại toàn bộ nhật ký trao đổi.  
> **Thời điểm lập:** 21/10/2026.

---

## 1. Giới Thiệu Hệ Thống & Đối Tượng Sử Dụng
- **CyberNet** là hệ thống quản lý phòng máy (tiệm net) hiện đại, kiến trúc Client-Server với Backend Spring Boot 4.1.1 và Frontend React 19.
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
  1. *Tìm kiếm hội viên — cập nhật 10/11/2026:* Đã thay lọc client-side bằng `GET /api/accounts?role=CUSTOMER&keyword=...` phân trang server. Tìm SĐT/tên không dấu hoặc `#ID`; dropdown dùng chung cho mở máy và bán giờ, debounce 300 ms, tải thêm từng 20 hội viên, giữ lựa chọn bằng API chi tiết ID. Thẻ tổng quan dùng `/api/accounts/summary`, độc lập trang/từ khóa/bộ lọc. Modal mở máy từ trang hội viên tự tải toàn bộ trang máy AVAILABLE qua API hiện có.
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
  9. **Ứng dụng triết lý thẩm mỹ shadcn/ui (Bento Grid & Recharts) trên nền Ant Design + Tailwind 4:** Đã thống nhất với Tech Lead: Hoàn thành 100% các chức năng quản trị cốt lõi trước (MS-3.5 Thực đơn, MS-3.6 Tài khoản, MS-3.7 đến MS-3.9 Báo cáo), sau đó triển khai MS-3.12 nâng cấp toàn diện Admin Dashboard và xây dựng Staff Shift Hub theo phong cách Bento Grid hiện đại mà không làm đảo lộn cấu trúc thư viện gốc.
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
- **Quyền đọc đã chốt 10/11/2026:** STAFF chỉ xem danh sách CUSTOMER và chi tiết CUSTOMER/hồ sơ chính mình. Lọc danh sách theo ADMIN/STAFF hoặc đọc ID của ADMIN/STAFF khác trả `403 FORBIDDEN`. Trang hội viên STAFF không hiển thị bộ lọc vai trò; ADMIN giữ bộ lọc và quyền đọc mọi tài khoản. Xem chi tiết mục 7.1 của API contract.

---

## 8. Hướng Dẫn Kế Tiếp Cho Phiên Làm Việc Mới (Next Steps)
1. **Triển khai MS-3.5: Quản lý Thực đơn & Dịch vụ Admin (`/admin/items`)**:
   - Bảng quản trị món ăn, đồ uống và các gói nạp giờ chơi (DataTable Twinkle Dark Luxury).
   - Thao tác thêm món mới kèm tải ảnh món ăn (`FileUploadController` qua `/api/files/upload?folder=items`), cập nhật giá bán, trạng thái còn/hết hàng.
   - Dải 4 chỉ số Liquid Glass 3D (Tổng món, Món ăn, Đồ uống, Hết hàng).
   - Đảm bảo các gói nạp giờ ghi rõ số giờ/phút quy đổi trong tên hoặc mô tả để `OrderService` phân tích tự động.
2. **Triển khai MS-3.6: Quản lý Tài khoản & Phân quyền Admin (`/admin/accounts`)**:
   - Bảng quản trị tài khoản đa vai trò (`ADMIN`, `STAFF`, `CUSTOMER`), phân trang server-side, tìm kiếm SĐT.
   - Cấp tài khoản nhân viên / quản trị mới (`POST /api/accounts`), cập nhật thông tin và reset mật khẩu an toàn có RBAC guard.
3. **Triển khai MS-3.7 đến MS-3.9: Trung tâm Báo cáo Doanh thu & Thống kê (`/admin/reports`)**:
   - Tích hợp biểu đồ diện tích Recharts doanh thu 7 ngày (`/api/reports/revenue/daily`).
   - Báo cáo cơ cấu doanh thu F&B vs Giờ chơi, Top 10 món bán chạy (`/api/reports/items/top-selling`), Top khách hàng chi tiêu (`/api/reports/customers/top-spenders`) và Hiệu suất máy trạm (`/api/reports/computers/usage`).
4. **Triển khai MS-3.12: Nâng cấp Toàn diện Dashboard Quản lý & Xây dựng Staff Operations Hub (shadcn/ui Bento Grid)**:
   - Tái cấu trúc Admin Dashboard thành Bento Grid đa tầng giàu dữ liệu thời gian thực.
   - Xây dựng Staff Shift Hub (`/staff/dashboard`) bao quát ca trực, hàng đợi việc khẩn, thanh tiến trình máy online và dock phím tắt 1-click.
