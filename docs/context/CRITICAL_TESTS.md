# Chọn ca kiểm thử bắt buộc cho CyberNet

Đọc file này trước khi chọn, viết hoặc chạy test cho một thay đổi. Trước tiên xem diff và xác định luồng nghiệp vụ nào bị ảnh hưởng, kể cả nơi gọi chung service, API hoặc cấu hình. Với từng luồng liên quan, dùng ca có sẵn nếu ca đó đã chứng minh được kết quả cần kiểm tra. Chỉ viết thêm khi thiếu ca quan trọng hoặc test hiện có chưa bắt được lỗi đã tái hiện.

## Chọn phạm vi theo thời điểm

| Thời điểm | Bắt buộc kiểm tra |
|---|---|
| Sau mỗi phiên có sửa chức năng | Kiểm tra nhanh phần vừa sửa và chạy các ca áp dụng trong bảng bên dưới. Backend chung cần xác minh API khởi động và trả health phù hợp. Frontend có thay đổi ảnh hưởng bản build cần build và kiểm tra màn hình liên quan. Nếu chỉ sửa nội dung tài liệu, kiểm tra nội dung, đường dẫn và ví dụ lệnh. |
| Trước khi triển khai | Dùng đúng bản sắp phát hành và môi trường thử tương đương môi trường đích. Kiểm tra đăng nhập/phân quyền, phiên chơi, tiền/đơn và hợp đồng lỗi, cùng báo cáo đối soát nếu bản phát hành sử dụng các chức năng đó. Khi có migration hoặc thay đổi lưu trữ, bổ sung ca nâng cấp, kiểm tra lại sau khi tạo lại container và diễn tập khôi phục. |
| Trước khi nghiệm thu | Chạy lại luồng cốt lõi thuộc phạm vi bàn giao và ít nhất một tình huống lỗi liên quan có thể ảnh hưởng người dùng hoặc dữ liệu. Nghiệm thu camera/quét QR cần điện thoại thật. Nghiệm thu tiền về cần đối soát với giao dịch ngân hàng. Lưu kết quả API, hiển thị mã và xác nhận tiền về thành các bước riêng. |

Ví dụ, khi chỉ sửa CSS của danh sách món, kiểm tra build và màn hình liên quan. Khi sửa bộ xử lý lỗi dùng chung, chạy ca lỗi API kèm ít nhất một luồng tiền hoặc phiên chơi đi qua bộ xử lý đó.

## Luồng cần bảo vệ

Danh sách dưới đây nêu các test theo tên để tìm trong bản đang kiểm thử. Một số ca từ đợt rà soát chỉ có trong workspace phát triển. Kiểm tra file có trong checkout trước khi chạy. Nếu chưa có, dùng test hiện có gần nhất hoặc ghi rõ phần còn thiếu. [Kết quả rà soát và ca đã tái hiện](../notes/backend-suite-verification.md)

| Chọn khi thay đổi | Ca cần giữ đúng | Test hoặc bằng chứng có thể dùng |
|---|---|---|
| **Đăng nhập, refresh, quyền hoặc QR tại bàn** | Đăng nhập đúng vai trò. Khách chỉ thấy dữ liệu của mình, nhân viên chỉ truy cập phần được cấp quyền. Đổi vai trò thu hồi phiên cũ. Quét QR mở trang dịch vụ, giữ đúng mã máy và chỉ mở phiên chơi qua thao tác được phép. | `RoleChangeSignOutIntegrationTest`, `OwnershipAndBillingSafetyTest`, `authExpiry.test.mjs`, `customerRoute.test.mjs`. |
| **Mở, chuyển, đóng hoặc tự hết hạn phiên; sửa giá/trạng thái máy** | Một máy và một tài khoản chỉ có phiên đang chạy hợp lệ. Giữ giá đã chốt, quy đổi đúng khi chuyển máy, bảo lưu giờ còn lại và cập nhật đúng trạng thái máy. Nếu thay đổi khóa hoặc giao dịch, kiểm tra hai thao tác cạnh tranh và rollback, gồm số dư và audit. | `SessionConsistencyIntegrationTest`, `IsolatedBillingIntegrationTest`, `OwnershipAndBillingSafetyTest`. Có thể dùng sơ đồ quầy để đối chiếu trạng thái. |
| **Nạp tiền, phiếu POS hoặc mua giờ** | Thử lại sau khi mất phản hồi tạo hoặc xác nhận phiếu. Đối chiếu một phiếu, một lần cộng giờ và một khoản doanh thu. Với POS, cùng khóa và cùng nội dung trả lại phiếu cũ, đổi nội dung với cùng khóa trả `409`. Kiểm tra nạp lẻ, duyệt khi phiên hết hạn hoặc đang chơi trên máy giá khác nếu sửa logic quy đổi. | `TimePurchaseIdempotencyIntegrationTest`, `IsolatedBillingIntegrationTest`, `timePurchaseSale.test.mjs`. |
| **Đặt món, giỏ hàng, tiền mặt hoặc VietQR** | Mất phản hồi lúc gửi giỏ và thử lại chỉ tạo một đơn. Giá và mã thanh toán lấy từ giao dịch đã lưu. Số tiền VietQR dùng được phải sinh dữ liệu QR, số tiền sai phải bị từ chối trước khi lưu phiếu chờ. Với đơn QR, khách báo đã chuyển khoản rồi nhân viên đối soát và xác nhận. | `BillingEdgeCasesIntegrationTest`, `customerRecovery.test.mjs`, `orderQueue.test.mjs`. Kịch bản HTTP trong `test_runtime_resilience.ps1` và ghi chú [VietQR](../notes/production-payment-and-assets.md#vietqr). |
| **Hợp đồng API, lỗi mạng, đăng nhập hết hạn hoặc gián đoạn DB** | So mã HTTP và `errorCode` với hợp đồng. Mất DB phải báo hệ thống tạm gián đoạn và giữ trạng thái giao dịch nhất quán. Phản hồi gián đoạn khi refresh phải cho phép phục hồi. Thử lại sau khi hệ thống chạy lại, kiểm tra giao dịch được ghi đúng một lần và giao diện có đường phục hồi. | `ApiErrorBoundaryIntegrationTest`, `customerRecovery.test.mjs`, `test_runtime_resilience.ps1`. [Hợp đồng API](../api-contract.md) |
| **Báo cáo, doanh thu, món bán chạy hoặc lịch sử máy** | Đối chiếu số tiền và số lượt với giao dịch gốc. Áp dụng mốc ngày Việt Nam. Với phiên qua nửa đêm hoặc chuyển máy, kiểm tra lượt mở, thời lượng mỗi máy và lịch sử từng máy. Nếu sửa thống kê món, kiểm tra đổi tên món vẫn tổng hợp đúng theo ID. | `Phase4ReportIntegrationTest`, `ReportIntegrationTest`, `SessionConsistencyIntegrationTest`, `BillingEdgeCasesIntegrationTest`, `statistics.test.mjs`. |
| **Migration, Docker, profile production hoặc volume** | Xác minh schema mới và bản sao đã nâng cấp. Đối chiếu tài khoản, số dư, đơn và phiếu trước/sau. Kiểm tra khởi động lại giữ dữ liệu, ảnh và trạng thái phù hợp khi thay đổi phần lưu trữ. Nếu phiên bản có thay đổi ảnh hưởng phục hồi, diễn tập khôi phục từ backup vào môi trường riêng. | `Phase5FlywayIntegrationTest`, `IsolatedBillingIntegrationTest`, `ProductionAdminBootstrapIntegrationTest`. [Hướng dẫn migration](../notes/migration-rollout.md) · [Cấu hình triển khai](../notes/production-payment-and-assets.md) |

## Chạy và báo cáo

- Dùng dữ liệu thử và DB riêng cho ca ghi dữ liệu, chạy đồng thời, gián đoạn hoặc khôi phục. Các ca này cần quan sát cả phản hồi API lẫn dữ liệu còn lại. Dùng MySQL 8 khi kết quả phụ thuộc engine, schema hoặc giao dịch.
- Ví dụ thay đổi thu hồi token sau khi đổi vai trò. Tại thư mục dự án, dùng cấu hình DB thử rồi chạy `./mvnw.cmd -B "-Dtest=RoleChangeSignOutIntegrationTest" test`. Nếu thay đổi liên quan màn hình đăng nhập/QR tại bàn, vào `frontend` và chạy `npm.cmd run test:qr`. [Cách đặt cấu hình DB thử](../notes/backend-suite-verification.md#running-the-release-checks)
- Khi một ca cũ đã tái hiện đúng lỗi cần sửa, dùng lại ca đó. Ví dụ, thay đổi xử lý gửi lại đơn cần chạy lại ca mất phản hồi tạo đơn và so số ID đơn cùng số dòng lịch sử.
- Ghi bản/commit và môi trường đã chạy, lệnh hoặc test được chọn, kết quả **Đạt**, **Lỗi** hoặc **Chưa kiểm tra**, cùng bằng chứng ngắn. Với ca bắt buộc còn lỗi hoặc chưa chạy, ghi rõ hạng mục chưa đạt điều kiện triển khai hoặc nghiệm thu. Ghi nguyên nhân và phạm vi ảnh hưởng để người duyệt quyết định bước tiếp theo.
