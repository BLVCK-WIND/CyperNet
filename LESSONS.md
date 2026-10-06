# 🎓 TỔNG HỢP CỘT MỐC & BÀI HỌC KINH NGHIỆM THEO TỪNG PHASE

> **Mục đích của file này**:
> Khác với [LOG.md](LOG.md) (ghi nhật ký chi tiết vụn vặt theo ngày) hay [interviewX.md](interviewX.md) (hỏi đáp phỏng vấn), **file này là cuốn Sổ tay Trí thức (Knowledge Base)** tổng hợp lại:
> - **Cột mốc (Milestones)** đạt được sau mỗi chặng.
> - **Các bài học tư duy & kinh nghiệm thực chiến** (Best Practices & Pitfalls) đắt giá nhất để nhìn lại sự tiến bộ của bản thân và chuẩn bị phỏng vấn.

---

## 📍 PHASE 0 — THIẾT KẾ DATA MODEL & ENTITY LAYER (NỀN MÓNG)

### 1. Cột mốc đã đạt được:
- Thiết kế và hoàn thiện 7 Entity cốt lõi phản ánh đúng 100% nghiệp vụ tiệm net:
  1. `Account`: Khách hàng, nhân viên, quản trị viên.
  2. `Computer`: Máy tính, phân khu VIP/Standard, giá tiền, IP.
  3. `Session`: Phiên chơi kết nối giữa Khách và Máy.
  4. `Item`: Danh mục đồ ăn, nước uống, gói nạp giờ chơi.
  5. `Order`: Đơn gọi món gắn liền với phiên chơi.
  6. `OrderItem`: Chi tiết từng món trong giỏ hàng của Order.
  7. `TimePurchase`: Lịch sử mua giờ chơi tại quầy hoặc qua QR.

### 2. Các bài học & kinh nghiệm đắt giá rút ra:
1. **Quy tắc chọn kiểu dữ liệu (Data Types)**:
   - Dùng `BigDecimal` cho tất cả các trường tiền tệ (`price`, `totalAmount`, `unitPrice`). Tuyệt đối không dùng `float`/`double` vì sẽ bị sai số khi tính toán phân số nhị phân.
   - Dùng `int` (primitive) cho `remainingMinutes`: Vì số phút luôn có giá trị xác định (mặc định = 0), không bao giờ được phép `null`.
   - Dùng `Long` (wrapper) cho `id`: Vì khi mới tạo Object trong Java thì ID chưa tồn tại (`null`), chỉ sau khi DB sinh khoá tự tăng (Auto Increment) thì mới có giá trị.
2. **Thiết kế quan hệ JPA chuẩn Enterprise**:
   - Mọi `@ManyToOne` **bắt buộc phải có `fetch = FetchType.LAZY`** để tránh truy vấn quá tải bộ nhớ (N+1 Query Problem).
   - `@OneToMany` chỉ nên đi kèm `cascade = CascadeType.ALL, orphanRemoval = true` khi quan hệ mang tính **ruột thịt** (ví dụ: `Order` ➔ `OrderItem`: đơn hàng mất thì các dòng chi tiết món trong đơn đó phải mất theo).
3. **Audit Fields tự động**:
   - Dùng `@CreationTimestamp` kết hợp `updatable = false` cho `createdAt` để DB chỉ ghi nhận 1 lần duy nhất lúc tạo dòng mới.
   - Các trường như `confirmedAt` (lúc nhân viên bấm duyệt tiền) thì không dùng `@CreationTimestamp` vì lúc tạo đơn nó phải là `null`.

---

## 📍 PHASE 1 — KIẾN TRÚC PHÂN TẦNG 3 LỚP, DTO & NGHIỆP VỤ CỐT LÕI

### 1. Cột mốc đã đạt được:
- Xây dựng hoàn chỉnh luồng 3 lớp (Controller ➔ Service ➔ Repository) cho các Entity:
  1. `Account`: Quản lý tài khoản, mã hoá mật khẩu, kiểm tra trùng SĐT.
  2. `Computer`: Quản lý danh sách máy, phân khu, trạng thái (`AVAILABLE`, `IN_USE`, `MAINTENANCE`).
  3. `Item`: Quản lý danh mục món ăn, nước uống, trạng thái còn/hết hàng.
  4. `TimePurchase`: Tạo yêu cầu mua giờ, nhân viên duyệt thanh toán, cộng giờ chơi, huỷ giao dịch, tra cứu lịch sử.
  5. `GlobalExceptionHandler`: Xử lý ngoại lệ tập trung cho toàn bộ ứng dụng.

### 2. Các bài học & kinh nghiệm đắt giá rút ra:

#### A. Kiến trúc & Tư duy DTO (Data Transfer Object)
- **Không bao giờ trả trực tiếp Entity ra ngoài API**:
  - *Bảo mật*: Giấu các trường nhạy cảm như `passwordHash`.
  - *Chống sập server*: Tránh vòng lặp đệ quy vô tận (*Infinite Recursion*) khi Jackson biến Entity quan hệ 2 chiều thành JSON gây tràn bộ nhớ (*StackOverflowError*).
  - *Tính độc lập*: Database đổi tên cột hay cấu trúc bảng thì giao diện API (DTO) trả cho Mobile/Frontend vẫn giữ nguyên không bị vỡ.
- **Null-safe khi Map dữ liệu**:
  - Khi bóc tách dữ liệu từ Entity sang DTO, phải luôn kiểm tra `null` đối với các quan hệ chưa hoàn tất (Ví dụ: Đơn `PENDING` thì `confirmedByStaff` là `null`, gọi thẳng `.getName()` sẽ dính `NullPointerException` làm chết API ngay lập tức).

#### B. Quản lý Giao dịch & Tính nguyên tử (`@Transactional`)
- Mọi hàm nghiệp vụ có từ 2 thao tác ghi vào Database trở lên bắt buộc phải có `@Transactional`.
- *Ví dụ sống còn*: Khi duyệt nạp giờ (`confirmTimePurchase`): vừa đổi trạng thái đơn thành `CONFIRMED`, vừa cộng `remainingMinutes` vào `Account`. Nếu không có `@Transactional`, rớt mạng ở bước 2 sẽ khiến khách bị trừ tiền mà không nhận được giờ chơi!
- Dùng `@Transactional(readOnly = true)` cho các hàm tra cứu để Hibernate tắt tính năng *Dirty Checking*, giúp tiết kiệm CPU và RAM của server.

#### C. Khái niệm Snapshot (Lưu vết lịch sử kế toán)
- Trong các giao dịch tiền tệ, luôn lưu cứng cả số lượng và số tiền tại thời điểm phát sinh giao dịch (bảng `TimePurchase` lưu cả `minutes` và `amount`).
- Không bao giờ tính nhẩm động theo giá hiện tại, vì khi quán thay đổi bảng giá trong tương lai hoặc có khuyến mãi giờ vàng, các báo cáo tài chính của tháng cũ sẽ bị tính sai lệch hết!

#### D. Tư duy Xóa an toàn: Soft Delete (Xóa mềm)
- **Hard Delete (Xóa cứng - `deleteById`)**: Cực kỳ nguy hiểm vì xóa vĩnh viễn khỏi ổ cứng, làm mất lịch sử kế toán và dễ gây lỗi đứt gãy khóa ngoại (`Foreign Key Constraint Violation`) nếu bảng khác đang tham chiếu tới nó.
- **Soft Delete (Xóa mềm - Chuẩn Enterprise)**: Thêm cờ `boolean isDeleted = false;`. Khi xóa chỉ đổi cờ thành `true` (thực chất là câu lệnh `UPDATE`). Dữ liệu vẫn còn nguyên vẹn trong DB cho kế toán đối soát.

#### E. Phân biệt các loại Exception thường dùng
- `IllegalArgumentException` (HTTP 400): Tham số đầu vào sai cú pháp / vô lý (phút âm, tiền âm, SĐT sai định dạng).
- `IllegalStateException` (HTTP 400): Trạng thái đối tượng không cho phép (đơn đã huỷ mà bấm duyệt, máy đang bận mà bấm mở).
- `ResourceNotFoundException` (HTTP 404): Không tìm thấy ID trong Database.
- Xử lý tập trung qua `@RestControllerAdvice` theo nguyên lý DRY, không viết `try-catch` lặp đi lặp lại ở Controller.

#### F. Cơ chế Spring Data JPA
- **Derived Query Methods**: Đặt tên hàm theo quy ước (`findByAccountIdOrderByCreatedAtDesc`), Spring tự phân tích ngữ pháp để sinh ra câu SQL chuẩn mà không cần viết 1 dòng code nào bên trong.
- **Generic Type `<Item, Long>`**: Giúp Spring biết chính xác cần sinh câu lệnh truy vấn tới bảng `items`.
- **`save()` vs `saveAndFlush()`**: `save()` đưa vào bộ nhớ đệm gom lệnh ghi cuối cùng (tối ưu hiệu năng, dùng 95%); `saveAndFlush()` ép ghi câu SQL xuống DB ngay tại dòng code đó.

#### G. Quản lý Phiên chơi & Đồng bộ trạng thái hai chiều (`Session` & `Computer`)
- **Đồng bộ trạng thái bắt buộc bằng `@Transactional`**:
  + Mở phiên: `Session.ACTIVE` ➔ Khóa máy `Computer.IN_USE`.
  + Kết thúc phiên: `Session.ENDED` ➔ Trả máy `Computer.AVAILABLE`.
  + Không bao giờ để lệch trạng thái: Máy đang dùng mà hệ thống tưởng rảnh, hoặc máy đã tắt mà hệ thống tưởng bận.
- **Tư duy lưu trữ thời gian thực (Time Anchors vs Calculated Fields)**:
  + Trong Database: Chỉ lưu mốc cố định `startedAt`, `expiresAt`, `endedAt`.
  + Không bao giờ tạo cột `playedMinutes` hay `remainingMinutes` lưu trong bảng `sessions` để cập nhật mỗi giây (sẽ làm chết Database). Thay vào đó, tính động trong Response DTO bằng `Duration.between(...)`.
- **Hoàn trả giờ dư (Refund Logic)**:
  + Khi khách về sớm, tính toán chính xác số phút thực tế đã chơi và cập nhật lại `Account.remainingMinutes` để bảo toàn quyền lợi cho khách.

---

## ⏳ BƯỚC TIẾP THEO: HOÀN THIỆN `Order` + `OrderItem` (CHỐT HẠ PHASE 1)
- **`Order` + `OrderItem`**: Quét QR gọi món, tạo giỏ hàng nhiều món, nhân viên duyệt món, trừ kho và cộng giờ nếu đơn có chứa item loại PLAYTIME.
