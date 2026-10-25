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





