# Cấu hình tài khoản nhận tiền và ảnh khi triển khai

## Môi trường production

- Tạo `.env` từ [mẫu cấu hình](../../.env.example). Cấp mật khẩu MySQL, mật khẩu ứng dụng DB và `JWT_SECRET` ngẫu nhiên riêng cho môi trường. Thay secret cũ khi triển khai bản này để yêu cầu đăng nhập mới với các access token đã ký bằng secret cũ.
- Khi giữ volume MySQL cũ, sao lưu rồi đổi mật khẩu trực tiếp cho các tài khoản tương ứng trong MySQL. Cập nhật `DB_PASSWORD` và `MYSQL_ROOT_PASSWORD` theo các giá trị vừa đổi rồi tạo lại dịch vụ. MySQL chỉ áp dụng biến khởi tạo tài khoản khi volume dữ liệu còn trống.
- `HOST_APP_PORT` đổi cổng bên ngoài. Ứng dụng và health check trong container dùng cổng 8080. `HOST_DB_PORT` phục vụ quản trị từ máy chủ Docker qua loopback.
- Trước khi build frontend, đặt `VITE_API_BASE_URL` thành URL HTTPS của backend mà thiết bị tại quán truy cập được. Nếu frontend và backend khác origin, đặt `CORS_ALLOWED_ORIGINS` thành danh sách origin HTTPS của frontend, gồm giao thức, hostname và cổng nếu có. URL `localhost` chỉ dùng khi trình duyệt và backend đang ở cùng thiết bị.
- Lần khởi động khi chưa có quản trị viên sử dụng được, đặt `BOOTSTRAP_ADMIN_PHONE` và `BOOTSTRAP_ADMIN_PASSWORD`. Mật khẩu dài 12–72 byte UTF-8. Dùng số mới hoặc số quản trị viên mẫu đã bị vô hiệu hóa. Kiểm tra đăng nhập rồi bỏ hai biến bootstrap khỏi cấu hình triển khai.
- Khởi động với profile `prod` sẽ vô hiệu hóa mật khẩu ADMIN/STAFF mặc định đã biết và thu hồi token của các tài khoản đó. Có thể cấp mật khẩu mới cho nhân viên qua quản trị. Tài khoản lịch sử được giữ để các giao dịch cũ vẫn có người xác nhận.

## VietQR

- Đặt `VIETQR_BANK_ID` và `VIETQR_ACCOUNT_NO` theo tài khoản nhận của quán. `VIETQR_ACCOUNT_NAME` là tên hiển thị tùy chọn. Dùng `VIETQR_TEMPLATE` nếu đã được cấp template VietQR riêng.
- Frontend lấy mã cho đơn hoặc phiếu đã lưu. Nhân viên đối chiếu đúng tài khoản nhận, số tiền và nội dung trước khi duyệt. Nếu chuyển phiên bản khi còn đơn QR đang chờ duyệt, đối chiếu cả mã cũ dạng `ORDER-CYBERNET-<id>` và mã mới dạng `ORDER CYBERNET <id>` với cùng ID đơn.
- Trong staging, dùng cấu hình giả để kiểm tra số tiền, nội dung chuyển khoản và URL mà API trả về. Dịch vụ ảnh có thể trả `404` với mã ngân hàng thử tự đặt. Khi nghiệm thu phần hiển thị và quét, đối chiếu thông tin người nhận, số tiền và nội dung trong ứng dụng ngân hàng với giao dịch trong CyberNet.

### Kết quả chạy thử cục bộ — 17/11/2026

- Docker Compose chạy backend profile `prod` cùng MySQL 8. Frontend Vite Preview trên cổng `4173` gọi API ở cổng `8080`, đăng nhập và tải sơ đồ quầy. Người dùng đã khởi động lại Windows và mở lại môi trường thành công.
- Với phiếu nạp mẫu số 4, API VietQR trả `200`, số tiền `20000`, nội dung `NAP GIO 4` và URL ảnh chứa cấu hình thử. Yêu cầu tải ảnh từ `img.vietqr.io` trả `404` khi dùng `TESTBANK`. Đã đối chiếu dữ liệu tạo QR. Ca ảnh hiển thị trong CyberNet, quét và chuyển khoản thật còn chờ.
- Đơn món có bước khách báo đã chuyển khoản. Nhân viên kiểm tra khoản tiền nhận được rồi xác nhận trên CyberNet. Phiếu nạp QR tại quầy do nhân viên đối soát và xác nhận. Tự động nhận thông báo từ ngân hàng, đổi trạng thái và tạo hóa đơn thuộc đợt phát triển sau.

## Ảnh thực đơn

- Volume `app-uploads` lưu ảnh ở `/app/uploads`. Với cài đặt ngoài Docker, đặt `UPLOAD_DIRECTORY` tới thư mục dữ liệu có quyền ghi cho ứng dụng.
- Trước khi thay container đang chạy, sao lưu ảnh đã có từ `/app/uploads` và phục hồi vào volume mới. Sao lưu thư mục ảnh cùng bản sao DB để các đường dẫn món vẫn dùng được khi khôi phục.
- Sau khi phục hồi, tạo lại container rồi kiểm tra một ảnh thực đơn cũ và tải thử một ảnh mới.
