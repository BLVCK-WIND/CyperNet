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
- **Kỹ thuật Làm phẳng dữ liệu (Data Flattening)**:
  - Bóc tách các trường từ nhiều Entity quan hệ (`Session`, `Computer`, `Account`) đưa về cùng một tầng duy nhất trong DTO.
  - *Lợi ích*: Cực kỳ gọn gàng cho Frontend/Mobile tiêu thụ API, giấu kín `passwordHash`, và chặn đứng nguy cơ vòng lặp đệ quy vô tận (*Infinite Recursion*).
- **Ngăn chặn lỗi `LazyInitializationException`**:
  - Khi quan hệ được đặt `FetchType.LAZY`, Hibernate dùng Proxy ảo. Nếu trả thẳng Entity ra Controller, khi hàm Service kết thúc thì Hibernate Session đã ĐÓNG, Jackson cố serialize trường LAZY sẽ làm sập API với lỗi `LazyInitializationException`.
  - Giải pháp chuẩn: Bóc tách và map sang DTO ngay bên trong tầng Service khi Transaction/Session JPA còn đang mở.
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

#### H. Quản lý Đơn hàng Giỏ hàng (`Order` & `OrderItem`) — Quan hệ Cha Con 1-N & Cascade
- **Sức mạnh của `CascadeType.ALL`**:
  + Khi lưu một đơn hàng phức tạp (Order cha + 10 OrderItem con), ta chỉ cần gọi `orderRepository.save(order)`. Hibernate tự động lan truyền và sinh hàng loạt lệnh `INSERT` cho cả cha lẫn con trong 1 lần duy nhất, không cần viết vòng lặp gọi repository con thủ công.
- **Snapshot Giá bán & Thành tiền (Subtotal)**:
  + Mọi hệ thống bán hàng chuẩn đều phải lưu cứng `unitPrice` và `subtotal` tại thời điểm đặt hàng. Nếu menu đổi giá, hóa đơn và lịch sử doanh thu của các đơn cũ vẫn được bảo toàn nguyên vẹn 100%.
- **Xử lý món đa năng (Type PLAYTIME)**:
  + Khi duyệt đơn hàng có món loại `PLAYTIME`, hệ thống tự động nhận diện và chuyển đổi sang thời gian chơi, gia hạn trực tiếp vào `Session.expiresAt` và cộng vào `Account.remainingMinutes` mà không cần khách thao tác tay.

---

## 🏆 KẾT QUẢ: PHASE 1 ĐÃ HOÀN THÀNH 100%!
Toàn bộ 6 module cốt lõi theo kiến trúc 3 lớp (Repository ➔ Service ➔ Controller ➔ DTO) đã hoạt động trơn tru:
1. `Account` (Quản lý người dùng, mã hoá mật khẩu, phân quyền)
2. `Computer` (Quản lý máy tính, phân khu VIP/Standard, trạng thái)
3. `Item` (Danh mục món ăn, thức uống, gói giờ chơi)
4. `TimePurchase` (Lịch sử nạp giờ tại quầy và QR)
5. `Session` (Quản lý phiên chơi thời gian thực, đếm giờ, hoàn giờ dư)
6. `Order` + `OrderItem` (Đặt món qua QR, giỏ hàng nhiều món, duyệt đơn, tự cộng giờ)

---

## 📍 PHASE 2 — COMPLEX BUSINESS LOGIC & CONCURRENCY CONTROL (HOÀN THÀNH 100%)

### 1. Cột mốc đã đạt được:
- Xây dựng 5 micro-steps hoàn thiện các luồng nghiệp vụ phức tạp:
  1. **Task 2.1 (UC-5): Tự động hóa tác vụ ngầm (`@Scheduled`)**: Quét và tự động giải phóng máy tính, đóng phiên chơi hết hạn định kỳ mỗi 30s.
  2. **Task 2.2 (UC-2): Luồng đăng nhập máy trạm (PC Login Flow)**: Khách hàng nhập SĐT + Mật khẩu ngay tại máy để mở máy chơi game qua 6 lớp phòng thủ.
  3. **Task 2.3 (UC-6): Nghiệp vụ Chuyển máy & Thuật toán Dynamic Tariff**: Quy đổi thời gian tự động theo tỉ lệ đơn giá giữa 2 máy ($M_{mới} = M_{cũ} \times \frac{P_{cũ}}{P_{mới}}$), bảo toàn phiên chơi và toàn bộ đơn hàng `PENDING_PAYMENT`.
  4. **Task 2.4 (UC-7): Nghiệp vụ Đơn hàng nâng cao**: Cho phép nhân viên tạo đơn và thu tiền mặt trực tiếp tại quầy, tự động chốt `CONFIRMED` và nạp giờ chơi tức thì.
  5. **Task 2.5: Chiến lược Concurrency Control**: Kết hợp **Pessimistic Lock (`PESSIMISTIC_WRITE`)** trên máy trạm và **Optimistic Lock (`@Version`)** trên tài khoản để ngăn chặn Race Condition và Lost Update.

### 2. Các bài học & kinh nghiệm đắt giá rút ra:

#### A. Tự động hóa tác vụ ngầm (`@Scheduled`) & Cách ly Transaction
- **Tách riêng Component Scheduler**: Tuân thủ *Single Responsibility Principle (SRP)*, tạo class riêng trong package `scheduler` thay vì nhét chung vào Service hay Application class.
- **Sử dụng `fixedDelay` thay vì `fixedRate`**:
  + `fixedDelay = 30000`: Đảm bảo lần quét sau chỉ bắt đầu sau khi lần quét trước đã kết thúc trọn vẹn 30s. Tránh tình trạng server bị quá tải hoặc mạng lag khiến nhiều luồng quét chạy chồng chéo lên nhau làm nghẽn Database Connection Pool.
- **Cách ly Transaction từng phần tử bằng `Propagation.REQUIRES_NEW`**:
  + Khi Scheduler quét được danh sách 10 phiên hết hạn, mỗi phiên phải được gọi qua một hàm con có `@Transactional(propagation = Propagation.REQUIRES_NEW)` kèm bọc `try-catch`.
  + *Lợi ích sống còn*: Nếu phiên số 3 bị lỗi dữ liệu (ví dụ lock timeout), chỉ phiên đó bị catch log, 9 phiên còn lại vẫn được đóng thành công và máy tính vẫn được giải phóng bình thường!

#### B. Tư duy Billing Engine động (Dynamic Tariff) — Không bao giờ Hardcode
- **Tuyệt đối không hardcode giá tiền (như 10k, 20k) hay Zone cố định vào code Java**:
  + Mọi phép tính toán cước phải lấy động trực tiếp từ trường `computer.getPricePerHour()` trong Database.
  + Nhờ đó, dù quán có 100 loại máy, đổi giá liên tục, hay thêm khu vực mới (Streaming, PS5, Ghế đôi...), hệ thống vẫn chạy chuẩn xác 100% mà không phải sửa code.
- **Bảo vệ doanh thu bằng `RoundingMode.FLOOR`**:
  + Khi chia số phút quy đổi ra số thập phân lẻ, luôn làm tròn xuống (`FLOOR`) để tránh thất thoát doanh thu cho quán.

#### C. Chiến lược Concurrency Locking: Khi nào dùng Bi quan (Pessimistic), khi nào dùng Lạc quan (Optimistic)?
- **Pessimistic Write Lock (`SELECT ... FOR UPDATE`)**:
  + *Bản chất*: Khóa cứng dòng dữ liệu ngay từ tầng Database, bắt các giao dịch khác phải xếp hàng chờ (Block).
  + *Khi nào dùng*: Áp dụng cho tài nguyên hữu hạn, tranh chấp trực tiếp (Máy tính `Computer`). Khi 2 khách cùng bấm đăng nhập 1 máy cùng 1 mili-giây, máy được khóa cho khách 1; sau khi khách 1 chuyển máy sang `IN_USE`, khách 2 được nhả khóa đọc ra thấy `IN_USE` thì bị từ chối ngay lập tức.
- **Optimistic Locking (`@Version`)**:
  + *Bản chất*: Không khóa DB, cho phép đọc ghi tự do. Kiểm tra số phiên bản (`version`) lúc update, nếu version đã bị giao dịch khác thay đổi thì DB từ chối và ném lỗi `ObjectOptimisticLockingFailureException`.
  + *Khi nào dùng*: Áp dụng cho tài nguyên đọc nhiều, ít xung đột (Tài khoản `Account`). Giúp hệ thống đạt hiệu năng cực cao, không làm chậm DB mà vẫn ngăn chặn được lỗi mất dữ liệu (*Lost Update*) khi nạp giờ và trừ giờ xảy ra đồng thời.
- **Xử lý tập trung qua `GlobalExceptionHandler`**:
  + Bắt `ObjectOptimisticLockingFailureException` và `CannotAcquireLockException` trả về HTTP `409 CONFLICT` với thông báo thân thiện cho người dùng thử lại.

---

## 🏆 KẾT QUẢ: PHASE 2 ĐÃ HOÀN THÀNH 100%!
Biên dịch thành công 50 files source code (`mvn clean compile` BUILD SUCCESS). Toàn bộ nghiệp vụ phức tạp, tự động hóa và đồng thời đã hoạt động hoàn hảo.

---

## 📍 PHASE 3 — SPRING SECURITY 6, JWT & ROLE-BASED ACCESS CONTROL (RBAC) (HOÀN THÀNH 100%)

### 1. Cột mốc đã đạt được:
- Xây dựng hệ thống bảo mật & phân quyền chuẩn Enterprise hoàn chỉnh qua 4 micro-steps:
  1. **Task 3.1: Hạ tầng Spring Security 6 & BCrypt**:
     - Tích hợp `spring-boot-starter-security` và bộ thư viện JJWT 0.12.6 (`jjwt-api`, `jjwt-impl`, `jjwt-jackson`).
     - Chuẩn hóa mã hóa mật khẩu 1 chiều với `BCryptPasswordEncoder` (thay thế hoàn toàn tiền tố giả lập `hashed_`).
     - Cấu hình `SecurityFilterChain`: Vô hiệu hóa CSRF, thiết lập `SessionCreationPolicy.STATELESS`, mở public route `/api/auth/**` và `POST /api/sessions/login`.
  2. **Task 3.2: Dịch vụ JWT & Entity RefreshToken lưu Database**:
     - Thiết kế `JwtService`: Ký và giải mã HMAC-SHA256, sinh Access Token (30 phút, chứa Phone và Role claim), validate chữ ký & thời hạn.
     - Thiết kế Entity `RefreshToken` & `RefreshTokenRepository` liên kết FK với `Account`: Token UUID bảo mật, thời hạn 7 ngày, quản lý trạng thái thu hồi `revoked`.
  3. **Task 3.3: Luồng Xác thực, Xoay vòng Token (Rotation) & Xử lý lỗi chuẩn REST**:
     - Triển khai `CustomUserDetailsService`: Nạp thông tin tài khoản qua SĐT, map Role sang Spring Security `SimpleGrantedAuthority("ROLE_" + role)`.
     - Xây dựng `AuthService` & `AuthController`:
       + `POST /api/auth/login`: Xác thực STAFF / ADMIN bằng BCrypt, cấp cặp Access Token + Refresh Token (chặn đứng CUSTOMER đăng nhập API quản trị).
       + `POST /api/auth/refresh`: Triển khai **Refresh Token Rotation (RTR)** — kiểm tra hạn dùng, thu hồi token cũ ngay lập tức và cấp cặp token mới.
       + `POST /api/auth/logout`: Thu hồi token (`revoked = true`) để chặn tái sử dụng.
     - Xây dựng `CustomAuthenticationEntryPoint`: Chặn unauthenticated request trả về JSON chuẩn HTTP 401 Unauthorized thay vì redirect HTML login form mặc định.
     - Xử lý `AccessDeniedException` trong `GlobalExceptionHandler`: Trả về JSON chuẩn HTTP 403 Forbidden.
  4. **Task 3.4: Bộ lọc bảo mật & Phân quyền Method-Level (@PreAuthorize)**:
     - Tạo `JwtAuthenticationFilter` kế thừa `OncePerRequestFilter`: Bóc tách Bearer token từ header `Authorization`, xác thực và nạp `UsernamePasswordAuthenticationToken` vào `SecurityContextHolder`.
     - Kích hoạt `@EnableMethodSecurity` và gắn `@PreAuthorize` theo đúng ma trận phân quyền trên cả 6 Controller (`AccountController`, `ComputerController`, `SessionController`, `OrderController`, `ItemController`, `TimePurchaseController`).
  5. **Verification & Testing (100% Pass)**:
     - Cập nhật `Phase2IntegrationTest` dùng `PasswordEncoder` cho test data.
     - Viết mới `Phase3SecurityIntegrationTest` với 10 test case chuyên sâu: Xác thực đúng/sai, chặn khách hàng, 401 khi thiếu JWT, STAFF truy cập hợp lệ 200, STAFF bị chặn 403 khi xóa máy, ADMIN xóa máy 204, Refresh Token Rotation, Logout thu hồi token, UC-2 public login.
     - Kết quả: **12/12 test cases PASS tuyệt đối (`BUILD SUCCESS`)**.

---

### 2. Các bài học & kinh nghiệm đắt giá rút ra:

#### A. Kiến trúc Stateless API & Quản lý Phiên với JWT
- **Bản chất Stateless (Phi trạng thái)**:
  + Cấu hình `SessionCreationPolicy.STATELESS` yêu cầu Spring Security không tạo `HttpSession` trên server. Mỗi request từ Client gửi lên phải độc lập và tự chứng minh danh tính qua Header `Authorization: Bearer <token>`.
  + *Lợi ích*: Giúp hệ thống dễ dàng mở rộng quy mô ngang (Horizontal Scaling) qua nhiều instance đằng sau Load Balancer mà không cần dùng Session Clustered (như Redis Session).
- **Vô hiệu hóa CSRF (`csrf.disable()`)**:
  + Tấn công CSRF (Cross-Site Request Forgery) lợi dụng cơ chế trình duyệt tự động đính kèm Cookie của nạn nhân.
  + Vì REST API Stateless dùng JWT lưu ở Authorization Header (không dựa vào Cookie tự gửi của trình duyệt), việc tắt CSRF là hoàn toàn chuẩn mực và tránh được các lỗi 403 vô cớ.

#### B. Cơ chế mã hóa một chiều BCrypt (Salt ngẫu nhiên & Chống Brute Force)
- **Tại sao không dùng MD5, SHA-256 hay giải mã đối xứng?**:
  + MD5 và SHA-256 là hàm băm nhanh, cực kỳ dễ bị tin tặc dùng Bảng cầu vồng (Rainbow Table) hoặc Card màn hình GPU dò quét hàng tỷ mật khẩu mỗi giây.
  + BCrypt là thuật toán Key Derivation Function (KDF) có độ phức tạp điều chỉnh được (Work Factor / Cost). Nó tự động sinh chuỗi Salt ngẫu nhiên (16 bytes) nối vào mật khẩu trước khi băm nhiều vòng.
- **Hiện tượng "Cùng 1 mật khẩu băm ra chuỗi khác nhau"**:
  + Mỗi lần gọi `passwordEncoder.encode("123456")`, BCrypt sinh ra một chuỗi Salt mới, cho ra hash hoàn toàn khác.
  + Khi kiểm tra đăng nhập, hàm `passwordEncoder.matches(raw, hash)` sẽ tự bóc tách Salt nhúng sẵn trong chuỗi hash cũ để băm lại mật khẩu nhập vào rồi so sánh an toàn bằng thuật toán so sánh thời gian không đổi (*Constant-Time Comparison*), chống tấn công Timing Attack.

#### C. Chiến lược Refresh Token Rotation (RTR) & Thu hồi Token trong Database
- **Vấn đề của JWT tự thân (Self-contained JWT)**:
  + Access Token không thể thu hồi tức thì trước khi hết hạn nếu chỉ dựa vào chữ ký.
  + Nếu đặt thời hạn quá dài (vài ngày): Rủi ro nếu token bị lộ.
  + Nếu đặt thời hạn quá ngắn (5 phút): Người dùng bị văng ra liên tục, trải nghiệm rất tệ.
- **Giải pháp dung hòa chuẩn Enterprise**:
  + **Access Token ngắn hạn (30 phút)**: Chứa thông tin tài khoản + role. Mọi request API nghiệp vụ chỉ giải mã JWT trên RAM máy chủ, **không cần query Database**, đảm bảo độ trễ (latency) cực thấp.
  + **Refresh Token dài hạn (7 ngày) lưu Database**: Dùng để xin cấp mới Access Token mà không bắt người dùng nhập lại mật khẩu.
  + **Refresh Token Rotation (RTR)**: Mỗi khi Refresh Token được dùng để đổi token mới, token cũ bị thu hồi (`revoked = true`) ngay lập tức và sinh token mới thay thế. Nếu kẻ gian dùng lại Refresh Token cũ đã bị thu hồi, hệ thống có thể phát hiện và khóa toàn bộ phiên nghi vấn.

#### D. Luồng thực thi Filter Chain & `SecurityContextHolder`
- `OncePerRequestFilter`: Đảm bảo `JwtAuthenticationFilter` chỉ được chạy đúng 1 lần cho mỗi HTTP Request, tránh chạy trùng lặp khi có forward hoặc include request nội bộ.
- Bóc tách Token chuẩn RFC 6750: Kiểm tra Header `Authorization` bắt đầu bằng `Bearer `, cắt chuỗi 7 ký tự đầu để lấy JWT.
- Nạp Authentication: Sau khi `jwtService.validateToken` thành công, tạo `UsernamePasswordAuthenticationToken` kèm danh sách quyền hạn `GrantedAuthority` và đưa vào `SecurityContextHolder.getContext().setAuthentication(auth)`.
- Các filter phía sau và các annotation `@PreAuthorize` ở Controller sẽ lấy quyền từ `SecurityContextHolder` để ra quyết định Cho phép (200) hoặc Từ chối (403).

#### E. Phân biệt rõ rệt HTTP 401 Unauthorized và HTTP 403 Forbidden
- **401 Unauthorized (Chưa xác thực)**:
  + Ý nghĩa: "Bạn là ai? Tôi chưa biết danh tính của bạn". Xảy ra khi Request không gửi JWT, token hết hạn, hoặc chữ ký sai.
  + Thành phần xử lý: `AuthenticationEntryPoint`. Cần viết `CustomAuthenticationEntryPoint` ghi trực tiếp JSON báo lỗi vào `HttpServletResponse` thay vì để Spring Boot redirect về trang login HTML.
- **403 Forbidden (Đã xác thực nhưng không đủ quyền)**:
  + Ý nghĩa: "Tôi biết bạn là ai (ví dụ STAFF), nhưng bạn không có quyền xóa máy tính trạm (chỉ dành cho ADMIN)".
  + Thành phần xử lý: `AccessDeniedHandler` hoặc bắt `AccessDeniedException` trong `@RestControllerAdvice` (`GlobalExceptionHandler`).

#### F. Tách biệt kiến trúc giữa Khách hàng (PC Client) và Nhân viên (Staff/Admin)
- **Khách hàng mở máy trạm (UC-2 PC Login Flow)**:
  + Khách ngồi tại máy, nhập SĐT + Mật khẩu. Xác thực bằng `passwordEncoder.matches()` trực tiếp trong `SessionService`.
  + Trả về `SessionResponseDTO` để phần mềm trạm giữ trạng thái phiên chơi. Endpoint này mở public (`POST /api/sessions/login`), không cần mang Bearer JWT.
- **Nhân viên / Quản lý (Web Dashboard & POS)**:
  + Đăng nhập qua `POST /api/auth/login`. Kiểm tra vai trò: nếu là `CUSTOMER` thì từ chối ngay lập tức.
  + Chỉ cấp Access Token & Refresh Token cho `STAFF` và `ADMIN` để gọi các API quản trị nhạy cảm.

#### G. Kinh nghiệm viết Integration Test với Spring Security MockMvc
- **Khởi tạo MockMvc bảo mật**:
  + Bắt buộc cấu hình `.apply(springSecurity())` trong `MockMvcBuilders.webAppContextSetup(context)` để Spring Security Filter Chain được nạp đầy đủ trong môi trường Test.
- **Dữ liệu mẫu mã hóa**:
  + Trong hàm setup dữ liệu test (`@BeforeEach`), mật khẩu mẫu phải được băm qua `passwordEncoder.encode("123456")`. Tuyệt đối không dùng chuỗi thô kẻo hàm `matches()` trả về false.
- **Xử lý ràng buộc khóa ngoại (Foreign Key Constraints)**:
  + Khi dọn dẹp DB trước mỗi test case: Xóa các bảng con trước (`orderRepository.deleteAll()`, `refreshTokenRepository.deleteAll()`) rồi mới xóa bảng cha (`sessionRepository.deleteAll()`, `accountRepository.deleteAll()`), tránh lỗi `SQLIntegrityConstraintViolationException`.
- **Đọc JSON response an toàn với JsonPath**:
  + Thay vì dùng `ObjectMapper` có thể bị lỗi classloader với `JavaTimeModule`, sử dụng `com.jayway.jsonpath.JsonPath.read(res, "$.accessToken")` giúp trích xuất token trong test cực kỳ nhanh, nhẹ và ổn định.

---

## 🏆 KẾT QUẢ: PHASE 3 ĐÃ HOÀN THÀNH 100%!
Biên dịch thành công 62 files source code (`mvn clean test` BUILD SUCCESS). 12/12 bài kiểm thử tự động (Phase 2 + Phase 3) vượt qua hoàn hảo. Hệ thống quán net CyberNet đã được bảo vệ toàn diện với Spring Security 6, JWT, BCrypt và RBAC.

---

## 📍 PHASE 4 — BÁO CÁO & THỐNG KÊ DOANH THU (REPORTING & REVENUE ANALYTICS) (HOÀN THÀNH 100%)

### 1. Cột mốc đã đạt được:
- Xây dựng hoàn chỉnh hệ thống Báo cáo & Thống kê tài chính cho Quản lý tiệm net (`ADMIN`) qua 5 micro-steps:
  1. **Task 4.1: Tầng JPQL Aggregation Queries tại Repository**:
     - Thiết kế các câu truy vấn tổng hợp hiệu năng cao `SUM`, `COUNT`, `COALESCE`, `GROUP BY` tại `OrderRepository`, `TimePurchaseRepository`, `OrderItemRepository`, `SessionRepository`.
     - Đẩy 100% việc tính toán gom nhóm xuống tầng MySQL Database Engine, không tải Entity lên RAM.
  2. **Task 4.2: Tầng DTO Projections & Response Layer**:
     - Thiết kế 5 DTOs tinh gọn trong package `dto/response/report/`:
       + `RevenueSummaryResponse`: Báo cáo tài chính tổng quan toàn quán.
       + `DailyRevenueResponse`: Báo cáo doanh thu theo chuỗi ngày liên tục.
       + `TopItemResponse`: Xếp hạng món ăn/uống/dịch vụ bán chạy nhất.
       + `TopCustomerResponse`: Khách hàng thân thiết chi tiêu nhiều nhất và chơi nhiều giờ nhất.
       + `ComputerUsageResponse`: Tần suất và thời lượng sử dụng máy tính trạm theo phân khu VIP/Standard.
  3. **Task 4.3: Tầng Nghiệp vụ Đa dòng tiền (`ReportService`)**:
     - Tuân thủ nguyên tắc kế toán tài chính: Chỉ ghi nhận doanh thu từ các giao dịch `CONFIRMED`.
     - Tổng hợp 2 dòng tiền độc lập không trùng lặp: Gọi món/dịch vụ (`Order`) + Nạp giờ tại quầy (`TimePurchase`).
     - Phân tích cơ cấu thanh toán Tiền mặt (`CASH`) vs Chuyển khoản QR (`QR`).
     - Phân tích cơ cấu doanh thu theo dòng hàng: Doanh thu F&B thuần vs Tổng doanh thu giờ chơi.
     - Thuật toán sinh chuỗi ngày liên tục (Continuous Timeline) đảm bảo biểu đồ tài chính không bị đứt gãy điểm mốc khi quán có ngày vắng khách.
  4. **Task 4.4: REST API & Phân quyền Bảo mật (@PreAuthorize)**:
     - Xây dựng 5 endpoints tại `ReportController` (`/api/reports/**`).
     - Khóa chặt toàn bộ module báo cáo ở mức method bằng `@PreAuthorize("hasRole('ADMIN')")`.
  5. **Task 4.5: Kiểm thử Tích hợp Toàn diện (`Phase4ReportIntegrationTest`)**:
     - 8 test cases chuyên sâu: Xác minh độ chính xác 100% của tổng doanh thu, kiểm tra loại trừ đơn huỷ/đơn pending, kiểm tra chuỗi ngày liên tục, kiểm tra top món bán chạy, kiểm tra top khách hàng, kiểm tra máy trạm, kiểm tra quyền ADMIN (200 OK), chặn STAFF (403 Forbidden), chặn unauthenticated (401 Unauthorized).
     - Kết quả: **20/20 test cases PASS tuyệt đối (`BUILD SUCCESS`)**.

---

### 2. Các bài học & kinh nghiệm đắt giá rút ra:

#### A. Tư duy Aggregation: Tại sao cấm kỵ dùng `findAll()` để tính toán trên Java?
- **Thảm họa của việc tính toán trên RAM máy chủ (In-Memory Aggregation)**:
  + Nếu quán net hoạt động 1 năm với 50,000 đơn hàng: gọi `orderRepository.findAll()` sẽ kéo 50,000 Java Objects kèm hàng chục ngàn `OrderItem` proxy lên RAM.
  + Server sẽ ngay lập tức bị nghẽn Garbage Collection (GC Pause), CPU tăng vọt 100%, và có nguy cơ chết đứng vì lỗi `OutOfMemoryError: Java heap space`.
- **Sức mạnh của Database Aggregation (Đẩy tính toán xuống DB Engine)**:
  + Sử dụng `SELECT SUM(o.totalAmount), COUNT(o) FROM Order o WHERE ...` tận dụng Index của MySQL (như B-Tree index trên `confirmed_at` và `status`).
  + Database xử lý hàng trăm ngàn dòng trong vài mili-giây và chỉ gửi ngược về Java duy nhất 1 con số kết quả scalar!

#### B. Xử lý giá trị NULL trong SQL Aggregations với `COALESCE`
- **Hiện tượng `SUM()` trả về `NULL`**:
  + Trong chuẩn SQL, nếu không có dòng nào thỏa mãn điều kiện `WHERE` (ví dụ: ngày đó quán không có đơn nào), hàm `SUM(total_amount)` sẽ trả về `NULL`, chứ KHÔNG PHẢI `0`.
  + Nếu không cẩn thận, Java đón nhận `null` và gọi `.add()` sẽ gây ra `NullPointerException`.
- **Giải pháp chuẩn mực**:
  + Luôn luôn bọc `COALESCE(SUM(...), 0)` trong JPQL/SQL. Nếu kết quả là `NULL`, DB sẽ tự động thế bằng `0`, đảm bảo tầng Service luôn nhận được `BigDecimal` an toàn.

#### C. Hợp nhất Doanh thu Đa dòng tiền (Multi-stream Financial Reconciliation)
- Trong mô hình tiệm net CyberNet, doanh thu thực thu bao gồm 2 nguồn độc lập:
  $$\text{Tổng Doanh Thu} = \sum \text{Order (CONFIRMED)} + \sum \text{TimePurchase (CONFIRMED)}$$
- Doanh thu giờ chơi (Playtime Revenue):
  + Không chỉ lấy từ `TimePurchase`, mà phải cộng thêm cả các món hàng có `type = PLAYTIME` mà khách đặt trực tiếp qua đơn hàng `Order`.

#### D. Thuật toán Continuous Timeline cho Biểu đồ Frontend
- Khi thống kê doanh thu theo ngày trong 30 ngày: Database chỉ trả về các ngày có phát sinh giao dịch.
- Nếu ngày 05/10 và 06/10 quán nghỉ hoặc không có khách, query `GROUP BY DATE` sẽ khuyết mất 2 ngày này.
- Nếu gửi dữ liệu khuyết này cho Frontend, các thư viện biểu đồ (Chart.js, Recharts, ApexCharts) sẽ nối thẳng ngày 04 sang ngày 07, làm biến dạng trục thời gian.
- **Giải pháp**: Tầng Service sử dụng vòng lặp duyệt liên tục từ `start` đến `end`, ngày nào không có giao dịch thì gán `BigDecimal.ZERO`. Giúp Frontend vẽ biểu đồ chuỗi thời gian phẳng, mượt mà và trực quan.

---

## 🏆 KẾT QUẢ: PHASE 4 ĐÃ HOÀN THÀNH 100%!
Biên dịch thành công 69 files source code (`mvn clean test` BUILD SUCCESS). Toàn bộ 20/20 bài kiểm thử tự động của dự án (Phase 2 + Phase 3 + Phase 4) đều vượt qua xuất sắc.

---

---

## 📍 PHASE 5 — PRODUCTION-READY ARCHITECTURE & DEPLOYMENT

### 1. Cột mốc đã đạt được:
- **Micro-Step 5.1: Phân trang & Sắp xếp (Pagination & Sorting)**:
  + Xây dựng generic `PageResponse<T>` chuẩn hóa cấu trúc trả về `{ content, page, size, totalElements, totalPages, last }`.
  + Tích hợp Spring Data `Pageable` và `@PageableDefault` cho toàn bộ các API danh sách (`Order`, `Session`, `TimePurchase`, `Computer`, `Item`, `Account`).
- **Micro-Step 5.2: Structured Logging & Distributed Tracing (MDC)**:
  + Xây dựng `MdcLoggingFilter` tự động phát sinh và truyền `X-Trace-Id` (UUID ngắn 12 ký tự) qua Mapped Diagnostic Context (MDC) và Response Header.
  + Cấu hình `logback-spring.xml` đa appender: Log console có màu sắc theo profile Dev, File log xoay vòng `RollingFileAppender` (tách riêng `cybernet.log` và `cybernet-error.log`).
- **Micro-Step 5.3: OpenAPI 3 / Swagger Documentation**:
  + Tích hợp `springdoc-openapi` 2.8.5, cấu hình `OpenApiConfig` với cơ chế BearerAuth Security Scheme (JWT).
  + Whitelist Swagger UI trong Spring Security, gắn `@Tag` và `@Operation` mô tả nghiệp vụ trực quan trên toàn bộ 8 Controllers.
- **Micro-Step 5.4: Multi-Environment Profiles & Actuator**:
  + Tách biệt triệt để cấu hình `application-dev.properties` (local, debug, ddl-auto=update) và `application-prod.properties` (Twelve-Factor env vars, HikariCP pool 20, ddl-auto=validate).
  + Tích hợp `spring-boot-starter-actuator`: Mở public `/actuator/health` và `/actuator/info` cho probes, bảo vệ các endpoint quản trị nhạy cảm bằng RBAC `hasRole('ADMIN')`.
- **Micro-Step 5.5: Database Migration với Flyway**:
  + Module hóa `FlywayConfig` cho Spring Boot 4, áp dụng `baselineOnMigrate(true)` và `baselineVersion("0")` cho cơ sở dữ liệu đã có sẵn.
  + Viết migration script `V1__init_schema.sql` (DDL 8 bảng) và `V2__initial_seed_data.sql` (Seed data DML) tuân thủ tính lũy tiến và idempotent.
- **Micro-Step 5.6: Containerization (Docker & Docker Compose)**:
  + Xây dựng `Dockerfile` đa tầng (Multi-stage build) với base image Maven JDK 17 (Builder) và Eclipse Temurin JRE 17 (Runtime).
  + Tối ưu bảo mật chạy dưới tài khoản non-root `cybernet`, cấu hình tối ưu JVM container `-XX:+UseContainerSupport -XX:MaxRAMPercentage=75.0`.
  + Viết `docker-compose.yml` kết nối container ứng dụng và container MySQL 8.0 với cơ chế `healthcheck` và `depends_on: condition: service_healthy`.

---

### 2. Các bài học & kinh nghiệm đắt giá rút ra:

#### A. Phân trang phía Server (Server-Side Pagination) vs Client-Side
- Tuyệt đối không bao giờ trả về danh sách không giới hạn (`List<T>`) ở các bảng phát sinh dữ liệu liên tục (`orders`, `sessions`, `time_purchases`).
- Dùng `Pageable` để database chỉ thực hiện `LIMIT ?, ?` và chỉ kéo đúng số lượng bản ghi cần hiển thị, giảm tải băng thông mạng và giải phóng RAM server.

#### B. Tracing & Observability trong hệ thống phân tán
- Trong môi trường thực tế với hàng ngàn request đồng thời, các dòng log xen kẽ nhau sẽ biến thành một đống hỗn độn không thể lần vết.
- Gán mỗi HTTP request một `X-Trace-Id` thông qua **MDC (Mapped Diagnostic Context)** của SLF4J giúp gom toàn bộ luồng xử lý từ Controller qua các tầng Service, Repository và Database xuống một định danh duy nhất. Khi xảy ra sự cố, chỉ cần tìm kiếm theo Trace ID là tái hiện được toàn bộ vòng đời của request.

#### C. Chuẩn Twelve-Factor App & Bảo mật Profile
- Tuyệt đối không hardcode database credentials, secret key, port vào trong source code hoặc file properties nén trong file jar.
- Mọi giá trị nhạy cảm phải được truyền từ bên ngoài vào qua biến môi trường (`${DB_URL}`, `${JWT_SECRET}`).
- Trên Production, Hibernate `ddl-auto` bắt buộc phải là `validate` (chỉ kiểm tra khớp schema) và nhường quyền thay đổi cấu trúc bảng cho các công cụ chuyên dụng như Flyway hoặc Liquibase.

#### D. Multi-Stage Docker Build & Container Hardening
- **Tối ưu dung lượng Image**: Multi-stage build loại bỏ toàn bộ compiler, source code, local maven repository và các công cụ phát triển khỏi image cuối cùng, giúp kích thước image giảm từ ~800MB xuống dưới ~200MB.
- **Bảo mật Non-root User**: Mặc định container chạy dưới quyền `root`. Nếu hacker khai thác được lỗ hổng Remote Code Execution (RCE) trong ứng dụng, chúng sẽ chiếm quyền root của container và có thể leo thang thoát container (container escape) chiếm máy chủ host. Do đó, việc tạo và chuyển sang user không đặc quyền (`USER cybernet`) là nguyên tắc bảo mật tối thượng.
- **Điều phối khởi động (Startup Dependency Gating)**: Không dùng `depends_on` đơn thuần vì Docker chỉ chờ container database được khởi tạo chứ không chờ service MySQL bên trong sẵn sàng nhận kết nối. Bắt buộc phải kết hợp `healthcheck` trên DB và `condition: service_healthy` trên App container để chống lỗi kết nối database lúc vừa khởi động.

---

## 🏆 KẾT LUẬN TOÀN DIỆN BACKEND:
- **Tất cả 6 Phase (Phase 0 đến Phase 5)** đã được hoàn thiện 100% đúng chuẩn kiến trúc phần mềm doanh nghiệp.
- **73 Java source files** sạch sẽ, tuân thủ SOLID, DRY, Clean Code.
- **40/40 Unit & Integration Tests PASS 100%**.
- Dự án sẵn sàng bàn giao, đóng gói và triển khai trên môi trường Production!

---

## 📍 FRONTEND ARCHITECTURE & UX/UI DESIGN (CYBERLUX / TWINKLE THEME)

### 1. Cột mốc đã đạt được:
- Xây dựng hoàn chỉnh kiến trúc nền tảng React 19 + TypeScript + Vite + Tailwind 4 + Ant Design 5.
- Hoàn thành Phase 1 (Customer Web/Mobile QR Calling & VietQR) và Phase 2 (Staff POS Floor Map & Order Queue).

### 2. Các bài học & kinh nghiệm đắt giá rút ra từ Đợt Review Giao diện:

#### A. Bài học UX Quầy Thu Ngân (POS Alert & Passive Monitoring)
- **Sai lầm phổ biến**: Chỉ dựa vào âm thanh thông báo đơn hàng hoặc bắt nhân viên click vào từng màn hình để kiểm tra việc mới phát sinh.
- **Thực tế nghiệp vụ**: Thu ngân thường xuyên phải rời quầy (pha nước, giao món, đi vệ sinh, tiếp khách). Khi quay lại quầy, họ không thể biết có đơn nào mới nếu không có **Badge Counter số đếm trực quan**.
- **Quy tắc sống còn**:
  - Mọi thanh điều hướng (Sidebar, Tab, Header) **bắt buộc phải có Badge số đếm realtime** (Ví dụ: `Đơn hàng [3]`, `Sơ đồ máy [4/6]`).
  - Badge phải dùng màu sắc cảnh báo tương phản cao (`#EF5350` hoặc `#FFB74D`) có hiệu ứng nhấp nháy (pulse) khi có việc khẩn cấp.

#### B. Bài học Phân cấp thị giác trạng thái (Status Visual Hierarchy)
- **Sai lầm phổ biến**: Áp dụng cùng một font chữ, cùng cỡ chữ và sắc thái màu viền tương tự nhau cho tất cả các trạng thái, khiến giao diện trở nên đơn điệu và khó phân biệt từ xa.
- **Quy tắc phân cấp thị giác rành mạch**:
  - `AVAILABLE` (Sẵn sàng): Viền xanh emerald neon sáng rõ (`#4CAF50` / `#22C55E`), chữ "SẴN SÀNG" in hoa đậm nét, tạo cảm giác tươi mới, sẵn sàng đón khách.
  - `IN_USE` (Đang chơi): Bề mặt Slate sâu lắng, tên khách hàng màu cát sáng (`#D3C3B9`), đồng hồ đếm ngược vàng hổ phách (`#B58863`) to đậm font `Space Grotesk`. Cảnh báo vàng khi < 15 phút, cảnh báo đỏ nhấp nháy khi < 5 phút.
  - `MAINTENANCE` (Bảo trì): Tông đỏ trầm kết hợp xám tro mờ (`opacity 60%`), icon cờ lê to bản, tuyệt đối không bị lẫn với máy đang hoạt động.
  - `PENDING_PAYMENT` (Chờ duyệt): Tag vàng cam hổ phách to bản, chữ đậm, kèm nhãn `MỚI` hoặc `CHỜ XP` cảnh báo khi quá 5 phút.

#### C. Bài học Bố cục danh mục Menu F&B (Grouped Category Layout tại Tab "Tất cả")
- **Sai lầm phổ biến**: Đổ dồn toàn bộ sản phẩm vào một danh sách phẳng (flat list) khi khách hàng chọn xem tab "Tất cả".
- **Hệ quả**: Khách lướt xem thực đơn thấy món ăn, nước ngọt và gói nạp giờ chơi nằm xen kẽ lộn xộn, gây ức chế khi tìm kiếm món.
- **Quy tắc bố cục chuẩn (Đã thống nhất)**:
  - Giữ nguyên thanh Tab điều hướng phía trên (Tất cả, Đồ ăn, Đồ uống, Giờ chơi, Dịch vụ). Khi click vào từng tab cụ thể thì vẫn lọc nhanh danh mục đó như cũ.
  - **Riêng tại tab "Tất cả"**: Thay vì một lưới phẳng, giao diện đặt các Section phân chia thẳng theo từng Category tương ứng với DB (`FOOD` ➔ 🍔 Món ăn nóng, `DRINK` ➔ 🥤 Đồ uống giải khát, `PLAYTIME` ➔ 🎮 Gói giờ chơi & Combo, `SERVICE` ➔ ⚡ Dịch vụ & Tiện ích).
  - Mỗi section có tiêu đề to rõ, icon đại diện, badge đếm số lượng món và đường divider ánh kim ngăn cách sang trọng. Section nào không có món thì tự động ẩn đi, đảm bảo gọn gàng và không rườm rà.

#### D. Tư duy phối màu Dark Luxury "Twinkle" vs Flat Dark Mode
- **Sai lầm phổ biến**: Nghĩ rằng Dark Mode chỉ đơn giản là đặt màu nền xám đen phẳng lì (`flat dark`).
- **Bản chất Dark Luxury ("Twinkle" Theme theo ảnh mẫu)**:
  - **Ambient Lighting Gradient**: Nền không bao giờ là một màu đơn sắc lì. Phải có hiệu ứng ánh sáng hoàng hôn ấm áp ở đỉnh lan dần xuống đêm sâu:
    `radial-gradient(ellipse at 50% 0%, rgba(181, 136, 99, 0.15) 0%, rgba(61, 77, 85, 0.08) 50%, #10232A 100%)`.
  - **Bề mặt Card (Surface & Layering)**: Sử dụng gradient chéo nhẹ từ `#3D4D55` xuống `#10232A` kèm viền mỏng ánh cát `rgba(211, 195, 185, 0.12)`.
  - **Soft Pill Shapes**: Bo góc mềm mại kiểu viên thuốc (`rounded-2xl` đến `rounded-full` / 16px - 24px) cho các nút, tag và ô nhập liệu.
  - **Độ tương phản Typography**: Dùng màu cát sáng `#D3C3B9` cho chữ chính và màu vàng caramel đồng `#B58863` cho các số liệu quan trọng để tạo cảm giác sang trọng, ấm cúng.

#### E. Bài học Kiến trúc Frontend: TanStack Query Cache Isolation & Chống lỗi Blank Screen khi F5

1. **Cô lập Cache Key trong TanStack Query (Query Key Isolation)**:
   - **Triệu chứng**: Bấm vào menu "Sơ đồ máy" nhưng màn hình hiện *"Không tìm thấy máy trạm phù hợp"* (0 máy).
   - **Nguyên nhân**: Component hiển thị tóm tắt (`StaffSidebar`, `StaffTopBar`) và Component hiển thị chi tiết (`useFloorMap` trong `FloorMapPage`) cùng dùng chung `queryKey: ['staff-floormap-data']` nhưng cấu trúc dữ liệu trả về khác nhau:
     - Sidebar/TopBar trả về `{ totalComputers: number, activeSessions: number }` (2 số đếm để hiện badge).
     - `useFloorMap` trả về `{ computers: FloorMapComputerItem[], rawComputers: ComputerResponse[], activeSessions: SessionResponse[] }`.
     Vì Sidebar/TopBar mount trước, TanStack Query lưu `{ totalComputers, activeSessions }` vào cache key này. Khi trang Floor Map mở ra, `data.computers` bị `undefined` $\rightarrow$ mảng máy bị gán thành rỗng (`[]`) $\rightarrow$ Màn hình hiện *"Không tìm thấy máy trạm phù hợp"*.
   - **Quy tắc sống còn**: Tuyệt đối không dùng chung `queryKey` giữa các thành phần tóm tắt và trang chi tiết nếu cấu trúc dữ liệu khác nhau. Phân định tiền tố rõ ràng:
     - Quick Stats / Counters: `['staff-quick-status-stats']`
     - Floor Map Full Data: `['staff-floormap-data']`

2. **Ngăn chặn lỗi render Object / Array of Objects vào React JSX**:
   - **Triệu chứng**: Khi F5 làm mới trên `/staff/floormap`, toàn bộ màn hình tối đen.
   - **Nguyên nhân**: Do cache key bị chia sẻ, khi `useFloorMap` hoàn tất query, nó ghi đè lại cache với `activeSessions` là một mảng Object (`SessionResponse[]`). Khi chèn trực tiếp `{floorData?.activeSessions || 0}` vào JSX của `StaffTopBar`, React ném ngoại lệ nghiêm trọng: `Objects are not valid as a React child (found: object with keys {id, computerCode...})`.
   - **Quy tắc**: Luôn đặt tên biến trả về của API đếm số lượng rõ ràng: `activeSessionsCount: number` thay vì dùng chung tên với mảng object, kiểm tra kỹ kiểu dữ liệu trước khi render vào JSX.

3. **React Router 7 Route Error Boundary & Ngăn ngừa màn hình đen (Blank Screen)**:
   - **Triệu chứng**: Khi có runtime error ở component con, toàn bộ màn hình đen tuyền, không có thông báo lỗi hay nút bấm nào.
   - **Nguyên nhân**: React Router `errorElement` không kích hoạt lifecycle `componentDidCatch` của React Class Component `ErrorBoundary` thông thường mà cần Functional Component sử dụng hook `useRouteError()`. Nếu truyền class component không có children, nó render `undefined` (màn hình đen tuyền che giấu lỗi).
   - **Quy tắc**: Xây dựng component `RouteErrorBoundary` riêng tích hợp `useRouteError()`, hiển thị chi tiết lỗi kèm nút Tải lại trang và Về trang chủ, loại bỏ hoàn toàn tình trạng Blank Screen.

4. **Đồng bộ Route Guard & Cấu trúc Router**:
   - Các đường dẫn redirect trong `RoleGuard` (`Navigate to="..."`) phải luôn khớp 1:1 với router tree thực tế (`/staff/floormap` thay vì `/staff/dashboard`, `/staff/login` thay vì `/login`).

5. **Tương thích React 19 giữa Ant Design v5 vs Ant Design v6**:
   - Nếu dùng **Ant Design v5**: Cần import `@ant-design/v5-patch-for-react-19` để patch tương thích ref/portal với React 19.
   - Nhưng dự án CyberNet sử dụng **Ant Design v6 (`antd: ^6.6.7`)**: AntD v6 đã **hỗ trợ React 19 từ trong nhân (Native Support)**, do đó tuyệt đối **không import `@ant-design/v5-patch-for-react-19`** vì sẽ gây cảnh báo `[antd: compatible]` thừa trong console. Luôn kiểm tra version của `antd` trước khi áp dụng patch.

---

## 📍 PHASE 2 (BỔ SUNG) — BÀI HỌC KIẾN TRÚC TÍNH GIỜ ĐỘNG (DYNAMIC TARIFF), GIA HẠN PHIÊN ĐANG CHƠI (AUTO-EXTEND ACTIVE SESSION) & ĐỘ ỔN ĐỊNH GIAO DIỆN REACT (UI RESILIENCE)

> **Bối cảnh thực tế**: Trong quá trình vận hành thử nghiệm tại quầy thu ngân (Staff POS & Floor Map), hệ thống phát sinh các vấn đề nghiệp vụ và kỹ thuật cốt tử:
> 1. Tài khoản khách có 300 phút, mở máy 10k/h được 5.0h, nhưng mở máy VIP 15k/h hay 20k/h thì hệ thống vẫn tính 300 phút (5.0h) — sai lệch doanh thu nghiêm trọng.
> 2. Khách đang chơi máy VIP gần hết giờ, nộp thêm 50,000đ tại quầy: Tiền vào tài khoản nhưng phiên chơi trên máy không được tăng giờ, máy tắt ngấm; hoặc khi trả máy thì số phút dư bị trừ sai lệch.
> 3. Nhân viên click chọn khách hàng trong Modal mở máy / bán giờ, sau 1.2s ô nhập tự động bị xóa trắng (auto-reset).
> 4. Dropdown danh sách khách hàng bị tràn chữ thành ba chấm `090123... (12...`, không đọc được tên và số phút khả dụng.

---

### 1. Kiến Trúc "Đồng Tiền Cơ Sở" & Quy Đổi Đơn Giá Giờ Động (Universal Standard Minutes Currency)

#### A. Bản chất kiến trúc:
- Trong Database, trường `Account.remainingMinutes` **LUÔN LUÔN là Số phút chuẩn (Standard Base Minutes)**.
- Mệnh giá giờ chuẩn được neo cố định tại:
  $$\text{BASE\_PRICE\_PER\_HOUR} = 10,000\text{ VNĐ/giờ} \iff 1\text{ phút chuẩn} = \frac{10,000}{60} \approx 166.67\text{ VNĐ}$$
- Số phút trong tài khoản **KHÔNG PHẢI** là số phút riêng của một máy cụ thể nào, mà là **năng lực chi trả chuẩn hóa**.

#### B. Công thức Mở máy (Start Session / Login):
- Khi khách ngồi vào một máy có đơn giá `computer.pricePerHour`:
  $$\text{playableMinutes} = \left\lfloor \frac{\text{account.remainingMinutes} \times \text{BASE\_PRICE\_PER\_HOUR}}{\text{computer.pricePerHour}} \right\rfloor$$
- **Ví dụ cụ thể** (Khách có 300 phút chuẩn trong tài khoản):
  - Ngồi máy Standard (10k/h): $\lfloor 300 \times 10,000 / 10,000 \rfloor = 300\text{ phút} = 5.0\text{ giờ}$.
  - Ngồi máy VIP (15k/h): $\lfloor 300 \times 10,000 / 15,000 \rfloor = 200\text{ phút} = 3.3\text{ giờ}$.
  - Ngồi máy VIP Pro (20k/h): $\lfloor 300 \times 10,000 / 20,000 \rfloor = 150\text{ phút} = 2.5\text{ giờ}$.
- Backend cập nhật mốc thời gian hết hạn:
  $$\text{session.expiresAt} = \text{LocalDateTime.now}().plusMinutes(\text{playableMinutes})$$
- Đồng thời: `account.remainingMinutes` được set về `0` (do toàn bộ số dư đã nạp vào phiên chơi hiện tại).

#### C. Công thức Trả máy & Hoàn tiền (End Session Refund):
- Khi khách đứng dậy trả máy trước thời hạn, số phút máy trạm còn dư là:
  $$\text{remainingMachineMinutes} = \text{Duration.between}(\text{now}, \text{session.expiresAt}).toMinutes()$$
- **Quy tắc hoàn trả đối xứng**: Số phút máy trạm phải được quy đổi ngược lại thành số phút chuẩn trước khi cộng trả vào `account.remainingMinutes`:
  $$\text{refundStandardMinutes} = \left\lfloor \frac{\text{remainingMachineMinutes} \times \text{computer.pricePerHour}}{\text{BASE\_PRICE\_PER\_HOUR}} \right\rfloor$$
  $$\text{account.remainingMinutes} = \text{account.remainingMinutes} + \text{refundStandardMinutes}$$
- **Minh chứng toán học bảo toàn tài chính**:
  - Khách nạp 50k $\rightarrow$ Có 300 phút chuẩn.
  - Ngồi máy VIP 20k/h $\rightarrow$ Được chơi 150 phút máy VIP.
  - Chơi đúng 30 phút thì có việc bận xin nghỉ $\rightarrow$ Máy VIP còn dư $150 - 30 = 120$ phút máy.
  - Khi bấm Kết thúc phiên: Hoàn trả $\lfloor 120 \times 20,000 / 10,000 \rfloor = 240$ phút chuẩn.
  - Khách đã tiêu hao: $300 - 240 = 60$ phút chuẩn $= 10,000$ VNĐ (Đúng bằng 30 phút ngồi máy 20k/h: $0.5\text{h} \times 20,000 = 10,000$ VNĐ). **Không lệch 1 đồng!**

---

### 2. Nghiệp Vụ Liên Thông Nạp Giờ & Tự Động Gia Hạn Phiên Đang Chơi (Active Session Auto-Extend)

#### A. Bài toán thực tế:
- Khách đang chơi dở trận combat trên máy VIP (20k/h), gần hết giờ thì gọi nhân viên: *"Nộp thêm cho anh 50k nhé!"*.
- **Nếu xử lý ngây thơ (Naive approach)**: Chỉ cộng 300 phút chuẩn vào `account.remainingMinutes`.
  - Hậu quả 1: Phiên chơi trên máy trạm (`session.expiresAt`) không hề thay đổi, máy trạm hết giờ tự động ngắt kết nối giữa lúc khách đang thi đấu!
  - Hậu quả 2: Khi phiên cũ hết giờ, khách phải đăng nhập lại từ đầu để hệ thống mở phiên mới từ số phút trong tài khoản, gây ức chế tột độ.

#### B. Giải pháp Enterprise Chuẩn (Đã triển khai trong `TimePurchaseService.java`):
- Trong hàm `confirmTimePurchase`:
  1. Cộng số phút chuẩn vào `account.remainingMinutes`:
     $$\text{account.remainingMinutes} += \text{purchase.getMinutes}()$$
  2. Tra cứu phiên chơi đang chạy của tài khoản:
     `sessionRepository.findByAccountIdAndStatus(account.getId(), SessionStatus.ACTIVE)`
  3. **Nếu khách đang ngồi máy trạm**:
     - Lấy thông tin máy trạm `computer = session.getComputer()`.
     - Tính số phút quy đổi trực tiếp theo đơn giá máy trạm:
       $$\text{extraMachineMinutes} = \left\lfloor \frac{\text{purchase.getMinutes}() \times \text{BASE\_PRICE\_PER\_HOUR}}{\text{computer.pricePerHour}} \right\rfloor$$
     - Gia hạn trực tiếp mốc hết hạn của phiên:
       $$\text{session.expiresAt} = \text{session.expiresAt}.plusMinutes(\text{extraMachineMinutes})$$
     - Đặt lại `account.remainingMinutes = 0` (vì toàn bộ số phút nạp thêm đã được chuyển hóa vào phiên đang chạy).
     - Gửi WebSocket STOMP notification `SESSION_EXTENDED` tới máy trạm và Dashboard nhân viên để cập nhật đồng hồ đếm ngược tức thì.
  4. **Khi kết thúc phiên**: Toàn bộ thời gian dư trên máy (bao gồm cả giờ cũ và giờ vừa nạp thêm) sẽ được hàm `endSession` quy đổi ngược lại về số phút chuẩn nạp vào tài khoản.

---

### 3. Bài Học Kiến Trúc Frontend: Ổn Định Trạng Thái Dropdown & Tránh Văng State Khi Re-render (State Resilience)

#### A. Triệu chứng lỗi "1.2s tự động xóa trắng":
- Nhân viên bấm "Mở phiên máy", chọn khách hàng "0988001122 - Nguyễn Văn A".
- Chưa kịp bấm nút Xác nhận (trong vòng ~1.2 giây), ô chọn bỗng nhiên bị xóa sạch, trở về trạng thái trống `placeholder="Chọn khách hàng..."`.

#### B. Truy vết nguyên nhân sâu xa (Root Cause Analysis):
- `FloorMapPage.tsx` có cơ chế đồng bộ polling (10s) và nhận sự kiện WebSocket máy đổi trạng thái.
- Khi truyền danh sách máy khả dụng cho Modal:
  `<StartSessionModal availableComputers={computers.filter(c => c.status === 'AVAILABLE')} ... />`
- Mỗi lần `FloorMapPage` re-render (dù dữ liệu không đổi), biểu thức `.filter()` trả về một **Array Reference hoàn toàn mới** (`[] !== []`).
- Trong `StartSessionModal.tsx`:
  ```tsx
  useEffect(() => {
    setSelectedAccountId(null);
  }, [open, availableComputers]); // <-- CHÍNH LÀ THỦ PHẠM!
  ```
  Dependency array chứa `availableComputers`. Khi prop này đổi tham chiếu, `useEffect` chạy lại và gọi `setSelectedAccountId(null)` xóa trắng ô chọn của nhân viên!

#### C. Quy tắc khắc phục sống còn (Best Practices):
1. **Bóc tách Lifecycle Reset**: Trạng thái nhập liệu của Form/Modal **chỉ được phép reset khi thuộc tính `open` thay đổi** (modal mở ra hoặc đóng lại), tuyệt đối không đưa các mảng dữ liệu phụ thuộc (`availableComputers`, `customersList`, v.v.) vào dependency array của reset effect:
   ```tsx
   useEffect(() => {
     if (open) {
       setSelectedAccountId(defaultAccountId ?? null);
     } else {
       setSelectedAccountId(null);
     }
   }, [open]); // CHỈ phụ thuộc vào open!
   ```
2. **Memoize Derived Props ở Component Cha**: Bọc các mảng lọc bằng `useMemo`:
   ```tsx
   const availableComputers = useMemo(
     () => computers.filter((c) => c.status === 'AVAILABLE'),
     [computers]
   );
   ```

---

### 4. Bài Học Frontend UX: Thiết Kế Dropdown 2 Cột Chống Tràn Ba Chấm (`...`) (Anti-Ellipsis Select Layout)

#### A. Vấn đề trải nghiệm:
- Nếu ghép chuỗi đơn thuần vào label của Select:
  `label: "${c.phoneNumber} - ${c.name} (${c.remainingMinutes} phút khả dụng)"`
- Khi hiển thị trên ô Dropdown có bề rộng giới hạn (300px - 400px), chuỗi bị cắt cụt với dấu ba chấm xấu xí:
  `090123... (12...`
- Nhân viên thu ngân hoàn toàn không nhìn thấy tên khách cũng như không biết khách còn bao nhiêu phút.

#### B. Giải pháp 2 Cột Chuyên Nghiệp với Ant Design `optionRender`:
- Tận dụng `optionRender` (Ant Design v5 / v6) để custom toàn diện thẻ item:
  ```tsx
  optionRender={(option) => {
    const customer = customers.find(c => c.id === option.value);
    return (
      <div className="flex items-center justify-between w-full py-0.5 gap-2">
        {/* Cột trái: SĐT Monospace nổi bật + Tên khách cát sáng */}
        <div className="flex items-center gap-2 min-w-0">
          <span className="font-mono text-xs text-[#B58863] shrink-0 font-semibold">
            {customer.phoneNumber}
          </span>
          <span className="text-sm text-[#D3C3B9] font-medium truncate">
            {customer.fullName}
          </span>
        </div>
        {/* Cột phải: Badge vàng đồng hiển thị rõ giờ/phút quy đổi */}
        <div className="shrink-0">
          {playableMinutes > 0 ? (
            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-[#B58863]/20 text-[#B58863] border border-[#B58863]/30">
              {formatHoursMinutes(playableMinutes)}
            </span>
          ) : (
            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-red-500/10 text-red-400 border border-red-500/20">
              0 phút
            </span>
          )}
        </div>
      </div>
    );
  }}
  ```
- **Kết quả**: Cột trái luôn ưu tiên hiển thị SĐT và tên khách; Cột phải luôn cố định Badge số phút màu vàng đồng sang trọng. Không bao giờ xuất hiện chữ ba chấm che giấu thông tin.

---

### 5. Bài Học Xử Lý Trạng Thái Máy Đang Chuyển Tiếp (`IN_USE` Fallback)

- Khi một phiên chơi vừa được tạo, trạng thái của `Computer` lập tức chuyển thành `IN_USE` nhưng dữ liệu chi tiết của `Session` có thể chưa kịp đồng bộ về client qua API/WebSocket (độ trễ ~0.2s - 0.5s).
- **Lỗi cũ**: Khi `session === null`, giao diện rơi vào nhánh bảo trì và hiển thị Icon Cờ lê đỏ rực trên thẻ máy đang có khách chơi.
- **Quy tắc xử lý an toàn**:
  ```tsx
  if (computer.status === 'IN_USE' && !session) {
    return (
      <div className="flex items-center gap-1.5 text-xs text-[#B58863]/80 animate-pulse">
        <Loader2 className="w-3.5 h-3.5 animate-spin" />
        <span>Đang đồng bộ phiên chơi...</span>
      </div>
    );
  }
  ```
  Tuyệt đối không để rơi vào fallback bảo trì hoặc làm crash giao diện khi dữ liệu quan hệ đang trong quá trình đồng bộ (in-flight state).

---

### 7. Bố Cục Máng Trượt Swimlane Trong Kanban Đa Luồng (Khắc Phục Ảo Giác Thị Giác "Cùng Hàng Ngang Rồi Rớt Dòng")

- **Hiện tượng**: Khi phân chia giao diện thành 2 cột (Cột Bếp vs Cột Thu ngân) bằng CSS Grid (`grid grid-cols-2`), nếu chỉ đặt 2 Header nhỏ ở trên và thả các thẻ đơn tự do trên nền tối chung của trang, mắt người dùng sẽ tự động gom nhóm các thẻ theo trục ngang: Thẻ 1 cột trái và Thẻ 1 cột phải nằm ngang nhau (thành Hàng 1), Thẻ 2 cột trái nằm bên dưới (thành Hàng 2). Người dùng nhìn vào có cảm giác đây là một danh sách lưới thông thường bị flex-wrap rớt dòng, hoàn toàn mất đi cảm giác của 2 luồng công việc độc lập.
- **Bài học & Giải pháp kiến trúc**:
  - **Bắt buộc đóng khung Panel Máng Trượt (Swimlane Column Container)**:
    - Mỗi cột phải là một Panel container khép kín có viền (`border`), nền gradient đổ bóng (`shadow-2xl`) và sắc thái màu riêng (Lane Bếp = viền mạ hổ phách ấm, Lane Thu ngân = viền mạ cyan điện tử).
    - Header của cột phải gắn liền vào đỉnh Panel thành một khối duy nhất.
    - Bên trong là rãnh trượt đơn hàng (Lane Track) có chiều cao tối thiểu (`min-h-[280px]`).
  - Nhờ vậy, người dùng từ khoảng cách xa ngay lập tức nhận diện được đây là 2 Máng Xử Lý Chuyên Biệt (như 2 băng chuyền độc lập), triệt tiêu hoàn toàn ảo giác thị giác xếp hàng ngang.

---

### 8. Phân Biệt Ngoại Hình Thẻ Tác Vụ Theo Nghiệp Vụ (Card Identity with Left Accent Stripe)

- **Vấn đề**: Khi các thẻ có nghiệp vụ khác nhau (đơn chỉ làm đồ ăn/nước uống vs đơn nạp giờ chơi vs đơn combo) dùng chung một màu nền và viền, nhân viên thu ngân và nhân viên bếp rất dễ nhầm lẫn, phải đọc từng chữ mới biết thẻ này thuộc về ai.
- **Giải pháp chuẩn hóa**:
  1. **Vạch chỉ thị màu bên trái (Left Accent Stripe):**
     - Đơn Bếp F&B: `border-l-4 border-l-amber-500` (Cam Hổ Phách).
     - Đơn Thu ngân Nạp giờ: `border-l-4 border-l-cyan-400 shadow-[0_0_12px_rgba(6,182,212,0.4)]` (Cyan Neon phát sáng).
     - Đơn Combo: `border-l-4 border-l-emerald-400` (Xanh ngọc bích).
  2. **Gradient nền & Viền phản ánh tính chất nghiệp vụ**:
     - F&B: Gradient ấm mang hơi hướng ẩm thực (`from-[#27201b]/90 via-[#1e202c]/95 to-[#141622]/95`).
     - Playtime: Gradient Cyber Gaming công nghệ cao (`from-[#122433]/90 via-[#18202e]/95 to-[#131622]/95`).
  3. **Huy hiệu & Khối gọi nạp giờ**:
     - Huy hiệu to rõ: `[🍜 MÓN ĂN & UỐNG]` vs `[⚡ NẠP GIỜ CHƠI]` vs `[🎁 COMBO MÓN + GIỜ]`.
     - Với đơn có giờ chơi, box nạp giờ được highlight viền cyan phát sáng, hiển thị tên gói nạp và lưu ý tự động nạp giờ khi duyệt.

---

### 9. Nghiệp Vụ An Toàn Giao Dịch Tiền Mặt & Quản Lý Thời Gian Chơi

- **Không hỗ trợ ví tiền:** Hệ thống tiệm net chỉ quản lý thời gian chơi (phút chuẩn), không có khái niệm số dư tiền ví (`ACCOUNT_BALANCE`). Chỉ có 2 phương thức thanh toán: `CASH` và `QR`.
- **Cảnh báo an toàn thu tiền mặt:** Khi khách đặt đơn nạp giờ hoặc combo bằng tiền mặt từ máy trạm, nhân viên có thể bấm duyệt nhầm khi chưa thu tiền khách. Do đó, hệ thống bắt buộc hiển thị Pop-up Modal xác nhận an toàn: *"Đã thu tiền mặt từ khách chưa?"* trước khi gọi API gia hạn giờ chơi trên máy.
- **Dynamic Tariff trong OrderService:** Khi phân tích tên gói nạp từ đơn hàng (ví dụ: "Gói nạp 2 giờ chơi"), không bao giờ gán cứng `60 * quantity`. Hệ thống dùng regex trích xuất số giờ/phút thực tế (120 phút) và quy đổi động theo giá máy của Session đang mở (VIP vs Standard), gia hạn chính xác `session.expiresAt` và cập nhật phút chuẩn vào tài khoản hội viên.

---

### 10. Tối Ưu Tương Phản Cao Cho Form Controls (Select & Dropdown) Trong Dark Mode

- **Vấn đề**: Trong theme tối Ant Design 5/6, các thuộc tính mặc định của `Select` dropdown options thường dùng màu xanh nhạt hoặc xám mờ. Khi kết hợp với dark background `#202332`, màu nền của option khi active/hover hoặc selected trùng với màu chữ khiến người dùng không đọc được nội dung (như chữ "Quản trị", "Hội viên" biến mất).
- **Giải pháp**:
  - Override trực tiếp CSS và Ant Design Component Tokens:
    - Selected: Nền vàng Gold Caramel (`#bd9875`), chữ Midnight than sâu (`#202332`, font-bold 700), checkmark đen than `#202332`.
    - Active/Hover: Nền kính vàng mờ (`rgba(189, 152, 117, 0.18)`), chữ chuyển sang màu Trắng Sáng (`#ffffff`, font-semibold).
  - Tăng độ đặc hiệu (specificity) trên `.ant-select-item-option-selected` và `.ant-select-item-option-active` để không bị CSS mặc định của Ant Design ghi đè.

---

## 📍 PHASE 3 — QUẢN TRỊ ADMIN, KIẾN TRÚC PHÂN KHU ĐỘNG & BÀI HỌC VẬN HÀNH

### 11. Bất Đối Xứng Độ Dài Dữ Liệu Input Giữa Các Màn Hình (Phone Length Asymmetry Pitfall) ⚠️ CỰC KỲ NGUY HIỂM

- **Triệu chứng & Tác hại**: Nhân viên quầy tạo hội viên mới thành công với SĐT 11 chữ số (`01111111111`), nạp tiền và mở máy `VIP-06` thành công. Tuy nhiên khi khách hàng ngồi vào máy mở trình duyệt đăng nhập thì bị báo lỗi *"Số điện thoại không khớp với người đang chơi tại máy VIP-06"*, gây hoang mang nghi vấn hệ thống bị lỗi nghiêm trọng.
- **Nguyên nhân kỹ thuật gốc rễ**:
  - Tại Form Đăng ký hội viên (`RegisterCustomerModal.tsx`): Cho phép nhận SĐT 9 đến 11 số (`maxLength={11}` và validation `9-11 số`). Tài khoản lưu vào MySQL là `01111111111` (11 số).
  - Nhưng tại Trang Đăng nhập máy trạm (`CustomerLoginPage.tsx`): Ô nhập SĐT lại bị gán cứng `maxLength={10}` và regex `/^0\d{9}$/` (chỉ cho 10 số).
  - Khi khách gõ `01111111111`, input âm thầm cắt cụt số cuối thành `0111111111` (10 số). Request gửi lên Backend lệch đúng 1 ký tự so với số đăng ký phiên, dẫn đến việc Backend từ chối hợp lệ.
- **Bài học & Quy tắc phòng ngừa**:
  - Các trường dữ liệu định danh (SĐT, Mã máy, CCCD) phải có **Validation đồng nhất (Single Source of Truth)** xuyên suốt từ Backend đến mọi Form Frontend.
  - Tuyệt đối không để xảy ra tình trạng "Tạo được ở Form A nhưng không Đăng nhập được ở Form B".
  - Với số điện thoại tại Việt Nam: Quy chuẩn validation Frontend phải hỗ trợ từ 9 đến 11 chữ số (`maxLength={11}`, regex `/^0\d{8,10}$/`).

---

### 12. Độc Lập Màu Sắc Động & Tránh Sai Lệch Màu Sắc Admin - Client (Dynamic Entity Color vs Hardcoded Preset Fallback)

- **Vấn đề**: Admin vào trang Quản lý Khu vực thiết lập màu cho khu `ARENA` là màu **Xanh Cyan (`#06b6d4`)**. Nhưng trên Sơ đồ phòng máy (Staff) hay Màn hình khách (Customer), thẻ máy `VIP-06` lại hiển thị tag màu **Đỏ rực**, gây nhầm lẫn thị giác nghiêm trọng cho quản lý.
- **Nguyên nhân**:
  - Entity `Computer` trong Database chỉ lưu mã khu vực dạng chuỗi (`zone = 'ARENA'`), không lưu mã màu `colorCode`.
  - Component hiển thị Badge khi không được truyền mã màu đã tự động fallback về bảng màu tĩnh hardcode trong file TSX (nơi ARENA bị gán cứng là `#ef4444` màu đỏ).
- **Giải pháp chuẩn hóa**:
  - Xây dựng Custom Hook `useZoneMap()` tải danh mục Zone thời gian thực từ `GET /api/zones/active` và cache toàn cục bằng TanStack Query (`staleTime: 60s`).
  - Component `<ZoneBadge />` tự động tra cứu mã màu thực tế mà Admin đã chọn trong Database: Admin gán màu nào thì mọi màn hình Staff và Customer sẽ **hiển thị chính xác 100% màu đó**, triệt tiêu toàn bộ màu hardcode dự phòng.

---

### 13. Bài Toán Tương Phản Màu Nền Tối & Nguy Cơ "Ngụy Trang Màu" (Dark Surface Camouflage & WCAG 2.1 AA)

- **Vấn đề**: Khu vực tiêu chuẩn `STANDARD` trong hệ thống cũ được gán mã màu `#434e60` (Slate Denim). Khi đưa mã màu này làm màu chữ trên nền Card / Table, chữ "Khu vực Tiêu Chuẩn" bị chìm nghỉm vào nền tối, tỷ lệ tương phản chỉ đạt ~1.4:1 (không đọc được bằng mắt thường).
- **Nguyên nhân**: `#434e60` chính là màu nền bề mặt (`--color-slate` / `colorBgContainer`) của các Card và Table trong Twinkle dark theme.
- **Bài học thiết kế giao diện tối**:
  - **Màu bề mặt nền (Surface color) tuyệt đối không được dùng làm màu văn bản (Text color)**.
  - Phân khu `STANDARD` được nâng cấp sang màu nhận diện **Ice Cyan (`#85C1DC`)** tươi sáng.
  - Trong component `<ZoneBadge />`, văn bản phải luôn đạt độ tương phản cao trên nền tối kết hợp viền mờ phát sáng (`border: ${color}55`) và chấm LED chỉ báo.

---

### 14. Phân Định Mã Viết Tắt (Short Code) vs Tên Đầy Đủ (Full Name) Trên Thẻ Máy Trạm

- **Vấn đề**: Khi hỗ trợ phân khu động, nếu hiển thị đầy đủ tên tiếng Việt (như *"CẤU HÌNH 4K 300HS"*, *"KHU THI ĐẤU VALORANT"*), thẻ máy trạm trên sơ đồ phòng máy sẽ bị dài dòng, chiếm diện tích và vỡ bố cục Cyber Gaming.
- **Quy tắc phân định chuẩn Enterprise**:
  - **Trên Thẻ máy trạm (Computer Card & Header)**: Bắt buộc dùng **Mã viết tắt ngắn gọn (Short Code)**: `STD`, `VIP`, `ARENA`, `VAL`, `FPS` (từ 3 đến 5 ký tự), không kèm icon rườm rà.
  - **Trên Thanh lọc phân khu, Dropdown, Thực đơn, Báo cáo**: Luôn hiển thị **Tên đầy đủ trang trọng (Full Name)** để nhân viên và khách hàng nhận diện rõ ràng cấu hình phòng máy.
  - Khi thêm khu vực mới trong Admin: Hướng dẫn người dùng nhập rõ **"Mã viết tắt trên thẻ máy (Code - VD: VAL, VIP)"** và **"Tên hiển thị đầy đủ (Name - VD: Khu Thi Đấu Valorant)"**.

---

### 15. Tối Ưu Bố Cục Điều Khiển Sơ Đồ Máy: Dropdown Select vs Hàng Nút Bấm Dàn Ngang

- **Vấn đề**: Ban đầu bộ lọc phân khu được làm bằng hàng nút bấm `Segmented`. Khi phòng máy có thêm 4-5 khu vực với tên dài, hàng nút bấm bị dàn ngang quá mức, đẩy ô tìm kiếm rớt dòng và làm vỡ layout trên các màn hình nhỏ.
- **Giải pháp bố cục**:
  - Phân loại rõ ràng 2 nhóm điều khiển:
    - **Lọc Trạng thái máy (ít, cố định 4 mục: Tất cả, Trống, Đang chơi, Bảo trì)**: Đặt dạng Segmented tabs bên trái để nhân viên quầy click 1 chạm.
    - **Lọc Phân khu (nhiều, động, tên dài)**: Chuyển thành **Dropdown `Select` có mũi tên trỏ xuống `▾` (`ChevronDown`)** với độ rộng cố định `w-60`, đặt ngay cạnh ô Tìm kiếm bên phải.
  - Trong dropdown, mỗi tùy chọn có chấm LED màu nhận diện và số lượng máy. Giao diện trở nên vô cùng gọn gàng, thanh thoát và không bao giờ bị vỡ dòng dù phòng máy mở rộng thêm 20 khu vực.









