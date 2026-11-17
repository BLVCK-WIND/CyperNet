# Kết quả rà soát và kiểm thử CyberNet

## Rà soát tình huống lỗi — 17/11/2026

Backend và bộ script HTTP chạy với MySQL 8 trong môi trường thử riêng, gồm dừng DB, khởi động lại và thử lại giao dịch. Mã nguồn ứng dụng giữ nguyên trong lượt rà soát.

| Nhóm kiểm thử | Kết quả |
|---|---|
| Backend Maven | 212/218 đạt. Cả 209 ca có sẵn đạt. Sáu ca mới phát hiện sai hợp đồng HTTP hoặc sai dữ liệu nghiệp vụ. |
| Frontend Node | 62/65 đạt. Cả 56 ca có sẵn đạt. Build thành công, lint hoàn tất với cảnh báo hooks. |
| HTTP trên Docker | 9/9 ca có sẵn đạt. Trong bảy ca mới, năm ca đạt và hai ca tái hiện lỗi đặt món trùng, trả sai `401` khi DB ngừng. |

| Luồng | Kết quả quan sát được |
|---|---|
| Đặt món khi mất phản hồi | Gửi lại cùng khóa tạo hai đơn khác ID. Test frontend cũng tái hiện lần gửi thứ hai sau khi mất phản hồi tạo đơn. |
| Mất DB và phục hồi | Health báo `503`. API duyệt giao dịch trả `401` dù nhân viên đã đăng nhập. Test frontend riêng cho thấy phản hồi `503` khi refresh làm mất trạng thái đăng nhập. Khi DB chạy lại, phiếu vẫn chờ xử lý và thử lại chỉ cộng giờ một lần. Gửi lại phiếu POS với cùng khóa sau khi khởi động lại backend vẫn dùng phiếu cũ. |
| Hợp đồng lỗi API | Sai phương thức, sai kiểu nội dung và thiếu phần đính kèm trả `500` thay vì `405`, `415`, `400`. Các yêu cầu đọc tiếp theo vẫn thành công. JSON sai cú pháp và ID sai kiểu trả `400`. |
| Phiếu nạp VietQR | Phiếu 10.000,50 đồng được lưu ở trạng thái chờ thanh toán, rồi API lấy QR từ chối số tiền lẻ. |
| Báo cáo và lịch sử máy | Đổi tên món làm báo cáo món bán chạy tách thành hai dòng cùng ID. Sau khi chuyển máy, lịch sử tra theo máy cũ thiếu phiên đã diễn ra trên máy đó. |
| Khôi phục trên giao diện | Thiếu Clipboard API làm thao tác sao chép QR phát sinh `TypeError`. Ca phục hồi từ lỗi trang và ca giữ hộp thoại khi gửi thông báo chuyển khoản thất bại đều đạt. |

Các ca mới đang thất bại là những lỗi còn mở. Phạm vi lần chạy gồm dữ liệu thử và phản hồi được mô phỏng ở frontend. Nghiệm thu trên thiết bị thật và xác nhận tiền về ngân hàng vẫn đang chờ.

Các file của đợt rà soát hiện nằm trong workspace phát triển. Khi dùng tài liệu trên nhánh khác, kiểm tra sự hiện diện của file trước khi chạy.

- Các ca HTTP và gián đoạn chạy bằng `scripts/test_runtime_resilience.ps1`.
- Các ca tích hợp trên MySQL nằm trong `ApiErrorBoundaryIntegrationTest.java` và `BillingEdgeCasesIntegrationTest.java` dưới `src/test/java`.
- Các ca phục hồi frontend nằm trong `frontend/tests/customerRecovery.test.mjs`.

---

## Full backend suite verification — 2026-11-09

### Running the release checks

Run `./mvnw.cmd -B verify` on Windows or `bash ./mvnw -B verify` on Linux. To use a dedicated MySQL 8 test server, set `CYBERNET_TEST_DB_URL`, `CYBERNET_TEST_DB_USER`, and `CYBERNET_TEST_DB_PASSWORD`. The harness creates and removes UUID-named schemas on that server. Set `CYBERNET_TEST_MYSQL_BIN` to the directory containing the MySQL 8 clients to exercise a real dump and restore of the synthetic V10 fixture before upgrading it. GitHub Actions uses the MySQL service container's clients for the same check.

For HTTP smoke checks, start the packaged backend against a disposable database. CI loads `scripts/e2e-fixtures.sql` after startup to create synthetic ADMIN and STAFF users. Set `CYBERNET_E2E_ADMIN_PHONE`, `CYBERNET_E2E_ADMIN_PASSWORD`, `CYBERNET_E2E_STAFF_PHONE`, and `CYBERNET_E2E_STAFF_PASSWORD` to the fixture credentials for your test database. Set the same synthetic `VIETQR_BANK_ID` and `VIETQR_ACCOUNT_NO` for the server and the script to verify the payment metadata. Each script requires the backend URL. Scenarios create their own fixtures and close the sessions they open. Historical orders and purchases remain in the disposable database for reconciliation.

```powershell
pwsh -NoProfile -File scripts/test_e2e_assertions.ps1
pwsh -NoProfile -File test_admin_reports_e2e.ps1 -BaseUrl http://127.0.0.1:18080
pwsh -NoProfile -File scratch/run_all_client_api_tests.ps1 -BaseUrl http://127.0.0.1:18080
```

### Result

The complete Maven test run passed: **144 tests across 27 classes; 0 failures, 0 errors, 0 skipped**. This includes legacy backend integration tests and the ownership/billing regression tests. A separate read-only metadata check confirmed all **24 databases recorded in the final run were removed**. The configured cafe database was not used or migrated.

### Changes made during this verification

- Added a Spring test context customizer that gives each legacy integration-test class its own UUID-named database, migrated through Flyway and validated by Hibernate. This is the default for ordinary `mvn test`; the billing-specific integration class retains its own isolated setup.
- Limited test connection pools to four connections with no minimum idle pool, preventing retained test contexts from exhausting the local server.
- Created the menu-test customer explicitly instead of assuming it existed in a developer database.
- Separated existing-but-wrong customer phone tests from unknown-phone tests. Added an explicit unknown-phone 404 check that verifies no account is created.
- Compared migration versions using Flyway's version API, allowing versions such as 11.1.
- Gave rate-limit tests their own login account instead of depending on a seeded administrator password. Success and HTTP 429 assertions remain intact.
- Supplied a valid IP address in the invalid-price test, ensuring only the intended validation rule fails rather than relying on constraint-error ordering.

No application production code was changed during this verification stage. No tests were disabled or skipped to obtain the result.

### Reproducing

Run `mvn test` from the repository root using the installed Maven binary. The test harness reads the local connection credentials from application-dev.properties, requires permission to create/drop test schemas, and uses only UUID-named test databases. Credentials are not printed by the harness. Reports are generated under target/surefire-reports. Test cleanup is restricted to schemas created by the harness.

### Remaining work

Browser/mobile QA and rehearsal against a restored copy of the actual cafe database remain separate deployment gates. This result verifies the backend suite on the local MariaDB server; it is not a production migration or a claim of browser verification.
