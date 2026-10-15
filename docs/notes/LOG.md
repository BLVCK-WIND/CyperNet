# 📒 Nhật ký học tập & phát triển — Dự án CyberNet

> File này ghi lại toàn bộ quá trình luyện tập: **hôm nay học gì, dùng kỹ thuật gì, áp dụng ở đâu, gặp lỗi gì, giải quyết ra sao**.
> Sau này đọc lại sẽ biết ngay: "À, chỗ này mình đã dùng kỹ thuật X vì lý do Y".

---

## Cách ghi log

Mỗi ngày làm việc, ghi 1 entry theo format:

```
### [Ngày] — [Tiêu đề ngắn gọn]

**Phase**: Phase X
**Thời gian**: X giờ
**Việc đã làm**:
- Mô tả ngắn gọn

**Kỹ thuật & kiến thức áp dụng**:
| Kỹ thuật | Dùng ở đâu | Tier |
|---|---|---|
| Tên kỹ thuật | File/class/method cụ thể | 🔴/🟠/🟡/🟢 |

**Lỗi gặp phải & cách fix**:
- Mô tả lỗi → nguyên nhân → cách fix

**Ghi chú / Bài học rút ra**:
- Những điều mới nhận ra, tips, patterns...
```

---

## Log Entries

---

### 2026-09-10 — Khởi động dự án

**Phase**: Chuẩn bị
**Thời gian**: ~2 giờ
**Việc đã làm**:
- Soạn tài liệu mô tả nghiệp vụ hệ thống quản lý tiệm net
- Tạo project Spring Boot 4.1.1 với MySQL, JPA, Lombok
- Tạo 5 entity ban đầu: Account, Computer, Session, Item, Order
- Thống nhất toàn bộ luồng hoạt động và nghiệp vụ chi tiết
- Lên kế hoạch triển khai 6 Phase (PLAN.md)
- Thống kê 24 kỹ thuật sẽ học trong dự án (SKILL.md)

**Kỹ thuật & kiến thức áp dụng**:
| Kỹ thuật | Dùng ở đâu | Tier |
|---|---|---|
| JPA Entity + Annotation | `@Entity`, `@Table`, `@Id`, `@GeneratedValue` trên 5 entity | 🔴 Tier 1 |
| JPA Relationship | `@ManyToOne(fetch = FetchType.LAZY)` trong Session, Order | 🔴 Tier 1 |
| Enum trong Entity | `@Enumerated(EnumType.STRING)` cho Status, PaymentMethod | 🔴 Tier 1 |
| BigDecimal cho tiền | `price`, `totalAmount` — không dùng float/double | 🔴 Tier 1 |
| Audit field | `@CreationTimestamp` cho `createdAt` | 🔴 Tier 1 |
| Lombok | `@Data`, `@NoArgsConstructor` — giảm boilerplate code | 🔴 Tier 1 |

**Lỗi gặp phải & cách fix**:
- *(Chưa có — mới khởi tạo project)*

**Ghi chú / Bài học rút ra**:
- Trước khi code bất cứ gì, phải hiểu rõ 100% nghiệp vụ. Nhảy vào code ngay = sửa đi sửa lại.
- Entity design là nền móng — sai ở đây thì tất cả layer phía trên đều sai theo.
- `BigDecimal` cho tiền, `LocalDateTime` cho thời gian — đây là quy tắc bất di bất dịch.

---

### 2026-09-11 — Phase 0 hoàn thành: Entity layer

**Phase**: Phase 0
**Thời gian**: ~2 giờ (2 buổi: 10/09 + 11/09)
**Việc đã làm**:
- Sửa Account.java: +passwordHash, +role (Enum), +remainingMinutes
- Sửa Computer.java: +zone (Enum), +pricePerHour (BigDecimal), +ipAddress
- Sửa Session.java: +endedAt (nullable)
- Sửa Item.java: +available (boolean)
- Refactor Order.java: xoá item/quantity/price, +totalAmount, +confirmedAt, +@OneToMany → OrderItem
- Tạo mới OrderItem.java: @ManyToOne → Order + Item, quantity, unitPrice, subtotal
- Tạo mới TimePurchase.java: lịch sử mua giờ, paymentMethod, status, confirmedByStaff
- Git init + first commit

**Kỹ thuật & kiến thức áp dụng**:
| Kỹ thuật | Dùng ở đâu | Tier |
|---|---|---|
| @OneToMany + mappedBy | Order → OrderItem | 🔴 Tier 1 |
| @ManyToOne + @JoinColumn | OrderItem → Order, Session → Computer | 🔴 Tier 1 |
| cascade + orphanRemoval | Order → OrderItem | 🔴 Tier 1 |
| FetchType.LAZY | Tất cả @ManyToOne | 🔴 Tier 1 |
| Long vs int | id = Long, remainingMinutes = int | 🔴 Tier 1 |
| @CreationTimestamp + updatable=false | createdAt | 🔴 Tier 1 |
| BigDecimal cho tiền | pricePerHour, totalAmount, unitPrice | 🔴 Tier 1 |

**Lỗi gặp phải & cách fix**:
- TimePurchase: long id → Long id (JPA cần wrapper vì id chưa có trước khi save)
- TimePurchase: confirmedAt gán nhầm @CreationTimestamp (field này gán khi NV xác nhận, không phải lúc tạo)
- TimePurchase: quên field confirmedByStaff
- OrderItem: quên @ManyToOne → Item

**Ghi chú / Bài học rút ra**:
- mappedBy = bên này không phải chủ, nhìn vào field bên kia
- cascade = lan truyền thao tác cha → con. orphanRemoval = xoá khỏi list → xoá trong DB
- @CreationTimestamp chỉ cho field gán 1 lần lúc INSERT
- Luôn tự hỏi: field có thể null không? → primitive vs wrapper



---

### 2026-09-19 — Phase 1: Hoàn thành CRUD Account, Computer, Item và Module TimePurchase

**Phase**: Phase 1 (Kiến trúc phân tầng 3 lớp & DTO)
**Thời gian**: ~2 giờ
**Việc đã làm**:
- Hoàn thành đầy đủ bộ CRUD cho 3 entity độc lập: Account, Computer, Item (Repository, DTO Request/Response, Service, Controller).
- Viết Global Exception Handling (`@RestControllerAdvice`) xử lý tập trung ResourceNotFoundException, IllegalArgumentException, IllegalStateException.
- Xây dựng hoàn chỉnh module **TimePurchase** (Lịch sử nạp giờ):
  + Tạo `TimePurchaseRepository` với các query lọc theo accountId, status.
  + Tạo `CreateTimePurchaseRequest`, `TimePurchaseResponse` (xử lý null-safe cho confirmedByStaff).
  + Tạo `TimePurchaseService`: xử lý nghiệp vụ tạo giao dịch, xác nhận nạp giờ (`@Transactional` cộng `remainingMinutes` vào `Account`), huỷ giao dịch, tra cứu.
  + Tạo `TimePurchaseController`: đầy đủ các endpoint chuẩn REST (`POST`, `PATCH`, `GET`).

**Kỹ thuật & kiến thức áp dụng**:
| Kỹ thuật | Dùng ở đâu | Tier |
|---|---|---|
| Layered Architecture (3 lớp) | Controller ➔ Service ➔ Repository | 🔴 Tier 1 |
| DTO Pattern & Mapping | Request DTO và Response DTO trên mọi endpoint | 🔴 Tier 1 |
| RESTful API Conventions | POST (201 Created), PATCH (200 OK), GET (200 OK), DELETE (204 No Content) | 🔴 Tier 1 |
| Exception Handling tập trung | `@RestControllerAdvice` + `@ExceptionHandler` | 🔴 Tier 1 |
| Transaction Management | `@Transactional` trên hàm confirmTimePurchase để đảm bảo tính nguyên tử (Atomicity) | 🔴 Tier 1 |
| Stream API | Chuyển đổi List<Entity> sang List<DTO> | 🔴 Tier 1 |
| Null-safe Mapping | TimePurchaseResponse.fromEntity xử lý trường confirmedByStaff có thể null | 🔴 Tier 1 |

**Lỗi gặp phải & cách fix**:
- Lỗi NullPointerException tiềm ẩn khi gọi `timePurchase.getConfirmedByStaff().getId()` khi đơn còn PENDING ➔ Fix: Kiểm tra `confirmedByStaff != null` trước khi bóc dữ liệu sang DTO.
- Thiếu xử lý `IllegalStateException` khi người dùng cố tình xác nhận một đơn đã bị CANCELLED hoặc đã CONFIRMED ➔ Fix: Bổ sung `IllegalStateException` vào `@RestControllerAdvice` trả về HTTP 400 Bad Request.

**Ghi chú / Bài học rút ra**:
- Tách bạch DTO và Entity là bắt buộc để bảo mật (không lộ passwordHash) và tránh crash đệ quy JSON.
- Mọi logic thay đổi nhiều bảng liên quan đến tiền bạc/giờ chơi (TimePurchase + Account) bắt buộc phải bọc `@Transactional`.

---

### 2026-10-06 — Phase 1: Hoàn thành Module Session (Quản lý phiên chơi & Đồng bộ máy tính)

**Phase**: Phase 1 (Kiến trúc 3 lớp & DTO)
**Thời gian**: ~2 giờ
**Việc đã làm**:
- Xây dựng hoàn chỉnh module **Session**:
  + Tạo `SessionRepository` với các query lọc session `ACTIVE` theo computerId, computerCode, accountId.
  + Tạo `StartSessionRequest`, `ExtendSessionRequest`, `SessionResponse` (tính toán động thời gian thực đã chơi và số phút còn lại).
  + Tạo `SessionService`: Xử lý mở máy (`startSession` - kiểm tra giờ dư, khoá máy `IN_USE`), đóng máy (`endSession` - mở máy `AVAILABLE`, hoàn lại số phút dư cho khách), gia hạn giờ (`extendSession`), tra cứu phiên cho QR code.
  + Tạo `SessionController`: Cung cấp các endpoint REST (`POST /start`, `PATCH /end`, `PATCH /extend`, `GET`).
- Biên dịch thành công 38 file (`mvn compile` BUILD SUCCESS).
- Cập nhật đầy đủ [interviewX.md](interviewX.md) và [LESSONS.md](LESSONS.md).

**Kỹ thuật & kiến thức áp dụng**:
| Kỹ thuật | Dùng ở đâu | Tier |
|---|---|---|
| Đồng bộ trạng thái Entity | SessionService: Session `ACTIVE` ↔ Computer `IN_USE` | 🔴 Tier 1 |
| Transaction Management | `@Transactional` đảm bảo tính nguyên tử khi mở/đóng phiên | 🔴 Tier 1 |
| Thời gian thực (java.time) | `Duration.between(...)`, `LocalDateTime.now().plusMinutes(...)` | 🔴 Tier 1 |
| Multi-relation DTO Flattening | `SessionResponse`: bóc tách cả thông tin Computer và Account | 🔴 Tier 1 |
| Dynamic Calculated Fields | Tính `playedMinutes` và `remainingMinutesUntilExpiry` động trong DTO | 🔴 Tier 1 |
| Defensive Programming | Kiểm tra 5 lớp trước khi mở máy (khách hết giờ, khách đang chơi máy khác, máy đang bận) | 🔴 Tier 1 |

**Lỗi gặp phải & cách fix**:
- Nguy cơ tính sai giờ khi khách về sớm: Nếu không trừ phút thực tế đã chơi thì khách bị mất toàn bộ số phút còn lại ➔ Fix: Dùng `Duration.between` lấy số phút thực tế, lấy `remainingMinutes` ban đầu trừ đi để hoàn số phút dư vào `Account`.

**Ghi chú / Bài học rút ra**:
- Tuyệt đối không lưu các trường biến động theo từng giây (như phút đã chơi) vào Database. Chỉ lưu mốc cố định (`startedAt`, `expiresAt`) rồi tính động trong DTO.
- Bắt buộc dùng `@Transactional` khi thao tác trên nhiều bảng (Session + Computer + Account).

---

### 2026-10-07 — Phase 1: Hoàn thành Module Order & OrderItem (Chốt hạ 100% Phase 1)

**Phase**: Phase 1 (Kiến trúc 3 lớp & DTO)
**Thời gian**: ~2 giờ
**Việc đã làm**:
- Xây dựng hoàn chỉnh module **Order** & **OrderItem**:
  + Tạo `OrderRepository` & `OrderItemRepository`.
  + Tạo `CreateOrderRequest`, `CreateOrderItemRequest`, `OrderResponse`, `OrderItemResponse`.
  + Tạo `OrderService`: Xử lý tạo đơn giỏ hàng qua QR code, kiểm tra tính khả dụng của món, tự động tính snapshot giá bán (`subtotal`), duyệt đơn thanh toán (`confirmOrder` - tự động gia hạn giờ nếu có món loại `PLAYTIME`), huỷ đơn (`cancelOrder`), tra cứu.
  + Tạo `OrderController`: Đầy đủ các endpoint REST (`POST /api/orders`, `PATCH /confirm`, `PATCH /cancel`, `GET`).
- Biên dịch thành công 46 file source code (`mvn compile` BUILD SUCCESS).
- Cập nhật [interviewX.md](interviewX.md) (Câu hỏi 18 & 19) và [LESSONS.md](LESSONS.md).
- **CHÍNH THỨC HOÀN THÀNH 100% PHASE 1** của dự án CyberNet!

**Kỹ thuật & kiến thức áp dụng**:
| Kỹ thuật | Dùng ở đâu | Tier |
|---|---|---|
| Cascade Persistence | `@OneToMany(cascade = CascadeType.ALL)`: Lưu Order tự động lưu tất cả OrderItem | 🔴 Tier 1 |
| Snapshot Pricing | `OrderItem.unitPrice`: Lưu cứng giá bán tại thời điểm đặt hàng | 🔴 Tier 1 |
| Business Automation | Tự động cộng giờ chơi vào Session khi duyệt đơn có món loại PLAYTIME | 🔴 Tier 1 |
| Transaction Management | `@Transactional` đảm bảo tính nguyên tử khi tạo và duyệt đơn | 🔴 Tier 1 |
| Multi-level DTO Mapping | `OrderResponse` bọc danh sách `OrderItemResponse` | 🔴 Tier 1 |

**Lỗi gặp phải & cách fix**:
- Nguy cơ đặt món đã hết hàng: Nếu không kiểm tra cờ `available` thì khách vẫn đặt được món đã hết trong kho ➔ Fix: Kiểm tra `!item.isAvailable()` ở Service ném ra `IllegalStateException`.

**Ghi chú / Bài học rút ra**:
- Nhờ `cascade = CascadeType.ALL`, việc lưu cấu trúc Cha - Con phức tạp trở nên cực kỳ gọn gàng.
- Luôn lưu cứng đơn giá và thành tiền lịch sử để bảo vệ dữ liệu kế toán.

### 2026-10-14 — Phase 2: Hoàn thành Micro-Step 1 (Task 2.1 — UC-5 Auto-Expire Session Scheduler)

**Phase**: Phase 2 (Complex Business Logic)
**Thời gian**: ~1 giờ
**Việc đã làm**:
- Bật `@EnableScheduling` trong `InternetCafeManagementApplication`.
- Bổ sung derived query `findByStatusAndExpiresAtLessThanEqual` trong `SessionRepository`.
- Viết method `autoEndExpiredSession(Long sessionId)` trong `SessionService` với `Propagation.REQUIRES_NEW`: tự động đóng phiên `ACTIVE` hết giờ, cập nhật `endedAt = expiresAt`, trả máy tính về `AVAILABLE`, và reset `remainingMinutes = 0`.
- Tạo `SessionScheduler` chạy định kỳ 30 giây (`fixedDelay = 30000`) quét và đóng tự động các phiên hết hạn, kèm log SLF4J chi tiết và xử lý try-catch từng phiên.
- Biên dịch thành công 47 file source code (`mvn compile` BUILD SUCCESS).

**Kỹ thuật & kiến thức áp dụng**:
| Kỹ thuật | Dùng ở đâu | Tier |
|---|---|---|
| Background Automation (`@Scheduled`) | `SessionScheduler.scanAndCloseExpiredSessions` chạy ngầm mỗi 30s | 🔴 Tier 1 |
| Transaction Propagation (`REQUIRES_NEW`) | `SessionService.autoEndExpiredSession`: cách ly transaction từng phiên | 🔴 Tier 1 |
| Spring Data JPA Derived Query | `findByStatusAndExpiresAtLessThanEqual` | 🔴 Tier 1 |
| Defensive Logging & Error Isolation | Bọc try-catch từng session trong vòng lặp batch của Scheduler | 🔴 Tier 1 |

**Lỗi gặp phải & cách fix**:
- Nguy cơ 1 phiên bị lỗi làm fail cả mẻ quét của Scheduler ➔ Fix: Tách transaction độc lập với `Propagation.REQUIRES_NEW` và bọc `try-catch` riêng cho từng session trong vòng lặp của Scheduler.

**Ghi chú / Bài học rút ra**:
- Tách riêng class `@Component` Scheduler với Service layer để tuân thủ Single Responsibility Principle.
- Luôn dùng `Propagation.REQUIRES_NEW` khi xử lý batch ngầm để đảm bảo tính độc lập giữa các bản ghi.

---

### 2026-10-14 — Phase 2: Hoàn thành Micro-Step 2 (Task 2.2 — UC-2 Đăng nhập máy trạm mở phiên chơi)

**Phase**: Phase 2 (Complex Business Logic)
**Thời gian**: ~1 giờ
**Việc đã làm**:
- Tạo DTO `ComputerLoginRequest`: đóng gói `phone`, `password`, `computerCode`.
- Viết method `loginAndStartSession(ComputerLoginRequest request)` trong `SessionService`:
  + Kiểm tra chặt chẽ 6 lớp phòng thủ (tài khoản tồn tại, mật khẩu hợp lệ, role CUSTOMER, còn giờ chơi > 0, không chơi đa máy, máy tính AVAILABLE và không có session ACTIVE).
  + Khởi tạo `Session`, chuyển máy tính sang `IN_USE` trong cùng `@Transactional`.
- Bổ sung endpoint `POST /api/sessions/login` trong `SessionController` (trả về HTTP 201 Created).
- Biên dịch thành công 48 file source code (`mvn compile` BUILD SUCCESS).

**Kỹ thuật & kiến thức áp dụng**:
| Kỹ thuật | Dùng ở đâu | Tier |
|---|---|---|
| Defensive Validation (Phòng thủ đa tầng) | `SessionService.loginAndStartSession`: 6 bước kiểm tra trước khi cấp phát tài nguyên | 🔴 Tier 1 |
| Transactional State Synchronization | Đồng bộ kích hoạt `Session` và khóa `Computer` sang `IN_USE` | 🔴 Tier 1 |
| RESTful Convention | `POST /api/sessions/login` trả về 201 Created | 🔴 Tier 1 |

**Lỗi gặp phải & cách fix**:
- Nguy cơ tài khoản STAFF/ADMIN đăng nhập mở máy chơi game ➔ Fix: Chặn rõ ràng ở tầng Service chỉ cho phép `Role.CUSTOMER`.

**Ghi chú / Bài học rút ra**:
- Tách bạch giữa mở máy bởi nhân viên (`/start` nhận ID) và mở máy bởi khách (`/login` nhận Phone + Password) giúp API rõ nghĩa và an toàn.

---

### 2026-10-14 — Phase 2: Hoàn thành Micro-Step 3, 4, 5 — CHÍNH THỨC HOÀN TẤT 100% PHASE 2

**Phase**: Phase 2 (Complex Business Logic)
**Thời gian**: ~3 giờ
**Việc đã làm**:
- **Micro-Step 3 (UC-6 Chuyển máy & Dynamic Tariff):**
  + Tạo `TransferComputerRequest`.
  + Viết `transferComputer` trong `SessionService`: Tính đổi tỉ giá động 100% bằng `BigDecimal` và `RoundingMode.FLOOR` theo đơn giá của 2 máy trong DB ($M_{mới} = M_{cũ} \times \frac{P_{cũ}}{P_{mới}}$), giải phóng máy cũ (hoặc đưa vào MAINTENANCE), khoá máy mới `IN_USE`, giữ nguyên phiên chơi và các đơn hàng `PENDING_PAYMENT`.
  + Tạo endpoint `PATCH /api/sessions/{id}/transfer`.
- **Micro-Step 4 (UC-7 Đơn hàng nâng cao):**
  + Tạo `CreateDirectOrderRequest`.
  + Viết `createDirectOrder` trong `OrderService`: Nhân viên tạo đơn trực tiếp tại quầy thanh toán tiền mặt, tự động chốt `CONFIRMED` ngay, tự động cộng giờ chơi nếu có món loại `PLAYTIME`.
  + Tạo endpoint `POST /api/orders/direct`.
- **Micro-Step 5 (Concurrency & Locking):**
  + Triển khai **Pessimistic Write Lock (`PESSIMISTIC_WRITE`)** trong `ComputerRepository` với `findByIdWithLock` và `findByCodeWithLock`: ngăn chặn triệt để 2 khách cùng mở/chuyển vào 1 máy trạm cùng lúc.
  + Triển khai **Optimistic Lock (`@Version`)** trên entity `Account`: bảo vệ số phút `remainingMinutes` không bị Lost Update khi có 2 transaction cùng ghi đè.
  + Bổ sung xử lý `ObjectOptimisticLockingFailureException`, `PessimisticLockingFailureException`, `CannotAcquireLockException` trong `GlobalExceptionHandler` trả về HTTP 409 Conflict.
- Biên dịch thành công 50 file source code (`mvn clean compile` BUILD SUCCESS).
- **CHÍNH THỨC HOÀN THÀNH 100% PHASE 2**!

**Kỹ thuật & kiến thức áp dụng**:
| Kỹ thuật | Dùng ở đâu | Tier |
|---|---|---|
| Dynamic Tariff Billing Calculation | `SessionService.transferComputer`: tính cước quy đổi giờ động theo giá máy | 🔴 Tier 1 |
| Pessimistic Write Lock (`SELECT FOR UPDATE`) | `ComputerRepository`: khóa máy trạm chống Race Condition đăng nhập | 🔴 Tier 1 |
| Optimistic Locking (`@Version`) | `Account.version`: chống Lost Update số phút chơi tài khoản | 🔴 Tier 1 |
| Concurrency Exception Handling | `GlobalExceptionHandler`: bắt xung đột lock trả về HTTP 409 Conflict | 🔴 Tier 1 |
| Immediate Confirmation Business Flow | `OrderService.createDirectOrder`: tạo và duyệt đơn quầy trong 1 transaction | 🔴 Tier 1 |

**Lỗi gặp phải & cách fix**:
- Xung đột Race Condition khi 2 khách cùng bấm Login 1 máy: Cả 2 cùng đọc DB thấy AVAILABLE ➔ Fix: Dùng `PESSIMISTIC_WRITE` khóa cứng dòng máy tính tại DB, luồng sau phải đợi luồng trước commit.
- Xung đột Lost Update giờ chơi: Tác vụ tự đóng phiên ghi đè lên thao tác nạp giờ của thu ngân ➔ Fix: Thêm `@Version` vào `Account`, giao dịch ghi sau nếu cầm version cũ sẽ bị DB từ chối ngay.

**Ghi chú / Bài học rút ra**:
- Tài nguyên ít, tranh chấp trực tiếp (máy trạm) ➔ Dùng Pessimistic Lock.
- Tài nguyên đọc nhiều, ít va chạm (số phút tài khoản) ➔ Dùng Optimistic Lock (`@Version`) để hệ thống chạy nhanh mà vẫn an toàn.
- Thiết kế cước động 100% dựa vào `pricePerHour` của `Computer` giúp hệ thống không phụ thuộc vào giá cứng hay Zone cứng.

---

### 2026-10-15 — Phase 3: Hoàn thành 100% Spring Security 6, JWT & Role-Based Access Control (RBAC)

**Phase**: Phase 3 (Spring Security 6 & JWT)
**Thời gian**: ~3 giờ
**Việc đã làm**:
- **Task 3.1: Tích hợp Spring Security 6 & BCrypt:**
  + Thêm dependencies `spring-boot-starter-security`, `jjwt-api`, `jjwt-impl`, `jjwt-jackson`, `spring-boot-starter-security-test` vào `pom.xml`.
  + Tạo `SecurityConfig` cấu hình Stateless, tắt CSRF, định nghĩa bean `BCryptPasswordEncoder`.
  + Tích hợp BCrypt vào `AccountService` (mã hóa lúc tạo TK) và `SessionService` (so khớp mật khẩu khi khách đăng nhập máy trạm).
  + Tạo Entity `RefreshToken` và `RefreshTokenRepository` lưu trữ token UUID trong MySQL để quản lý vòng đời và thu hồi (revocation).
- **Task 3.2: Tầng JWT Service & Filter:**
  + Cấu hình secret HMAC-256, thời hạn access token (30 phút) và refresh token (7 ngày) trong `application.properties`.
  + Xây dựng `JwtService`: ký và validate JWT token với custom claim `role` và `sub` (SĐT).
  + Xây dựng `CustomUserDetailsService`: load Account từ DB theo SĐT và ánh xạ Role thành `ROLE_ADMIN`, `ROLE_STAFF`, `ROLE_CUSTOMER`.
  + Xây dựng `JwtAuthenticationFilter` (`OncePerRequestFilter`): phân tích header `Authorization: Bearer <token>`, xác thực và nạp `Authentication` vào `SecurityContextHolder`.
- **Task 3.3: Module Authentication & DTOs:**
  + Tạo các DTOs: `LoginRequest`, `RefreshTokenRequest`, `AuthResponse`.
  + Xây dựng `AuthService`: xử lý `login` cho STAFF/ADMIN (chặn CUSTOMER đăng nhập API quản lý), `refreshToken` áp dụng cơ chế **Refresh Token Rotation** (hủy token cũ, sinh cặp token mới), `logout` (xóa token khỏi DB).
  + Xây dựng `AuthController` với các endpoint: `POST /api/auth/login`, `POST /api/auth/refresh`, `POST /api/auth/logout`.
  + Xây dựng `CustomAuthenticationEntryPoint`: chặn các request không có JWT trả về JSON chuẩn HTTP 401 Unauthorized thay vì redirect sang HTML form.
  + Bổ sung xử lý `AccessDeniedException` trong `GlobalExceptionHandler` trả về JSON chuẩn HTTP 403 Forbidden.
- **Task 3.4: Phân quyền toàn diện (@PreAuthorize):**
  + Hoàn thiện `SecurityConfig`: mở public `/api/auth/**` và `POST /api/sessions/login`, bảo vệ toàn bộ các endpoint còn lại bằng JWT filter.
  + Gắn `@PreAuthorize` theo ma trận phân quyền trên cả 6 Controller: `AccountController`, `ComputerController`, `SessionController`, `OrderController`, `ItemController`, `TimePurchaseController`.
- **Verification & Testing:**
  + Cập nhật `Phase2IntegrationTest` dùng `PasswordEncoder` băm mật khẩu, test chạy pass 100%.
  + Viết mới bộ kiểm thử `Phase3SecurityIntegrationTest` phủ kín 10 test case bảo mật (Login đúng/sai, Chặn Customer, Chặn 401, Quyền STAFF 200, Chặn STAFF 403, Quyền ADMIN 204, Refresh Token Rotation, Logout, Public UC-2 Login).
  + Chạy `./mvnw test`: Toàn bộ **12/12 bài test** (Phase 2 + Phase 3 + App Context) đạt `BUILD SUCCESS` không lỗi.
  + Cập nhật tài liệu: `STATUS.md`, `SCHEMA_SKELETON.md`, `walkthrough.md`.

**Kỹ thuật & kiến thức áp dụng**:
| Kỹ thuật | Dùng ở đâu | Tier |
|---|---|---|
| Spring Security 6 Filter Chain | `SecurityConfig`, `SecurityFilterChain` | 🔴 Tier 1 |
| BCrypt Password Hashing | `AccountService`, `SessionService`, `PasswordEncoder` | 🔴 Tier 1 |
| Stateless JWT Authentication | `JwtService`, `JwtAuthenticationFilter`, HMAC-SHA256 | 🔴 Tier 1 |
| Refresh Token Rotation (RTR) | `AuthService.refreshToken`, `RefreshToken` entity trong DB | 🔴 Tier 1 |
| Method-Level Security | `@PreAuthorize("hasRole('ADMIN')")`, `@PreAuthorize("hasAnyRole(...)")` | 🔴 Tier 1 |
| Custom AuthenticationEntryPoint | `CustomAuthenticationEntryPoint`: trả JSON 401 cho REST API | 🔴 Tier 1 |
| Custom AccessDenied Handler | `GlobalExceptionHandler`: trả JSON 403 | 🔴 Tier 1 |
| Integration Testing với Spring Security | `Phase3SecurityIntegrationTest` dùng `MockMvcBuilders` + `springSecurity()` | 🔴 Tier 1 |

**Lỗi gặp phải & cách fix**:
- Lỗi biên dịch `jakarta.validation` do project không import `spring-boot-starter-validation` ➔ Fix: Thay vì thêm dependency thừa, áp dụng Defensive Programming kiểm tra null/blank trực tiếp tại `AuthService` theo đúng CONVENTIONS.md.
- Lỗi `NoClassDefFoundError: JavaTimeModule` khi dùng `ObjectMapper` trong test ➔ Fix: Chuyển sang dùng `com.jayway.jsonpath.JsonPath` có sẵn trong Spring Test để đọc JSON response cực kỳ gọn nhẹ và an toàn.
- Lỗi khóa ngoại `Foreign Key Constraint Violation` khi dọn dẹp data test `Session` ➔ Fix: Xóa `orderRepository.deleteAll()` trước khi xóa `sessionRepository.deleteAll()`.
- Lỗi test Phase 2 bị fail mật khẩu sau khi đổi sang BCrypt ➔ Fix: Inject `PasswordEncoder` và mã hóa mật khẩu trong `setUp()` của `Phase2IntegrationTest`.

**Ghi chú / Bài học rút ra**:
- REST API Stateless bắt buộc phải vô hiệu hóa CSRF (`csrf.disable()`) và cấu hình `SessionCreationPolicy.STATELESS`.
- Cần phân biệt rõ: 401 Unauthorized (chưa xác thực/thiếu token) do `AuthenticationEntryPoint` xử lý; 403 Forbidden (đã đăng nhập nhưng không đủ quyền) do `AccessDeniedException` xử lý.
- Cơ chế Refresh Token Rotation lưu DB là giải pháp dung hòa tuyệt vời: API kiểm tra JWT ở tầng RAM (nhanh, không query DB), trong khi việc cấp lại token hoặc logout vẫn kiểm soát được tính hợp lệ và thu hồi tức thì ở DB.

---

<!-- 
=== TEMPLATE CHO NGÀY MỚI ===
Copy block bên dưới, paste vào đây, điền thông tin:

### YYYY-MM-DD — [Tiêu đề]

**Phase**: Phase X
**Thời gian**: X giờ
**Việc đã làm**:
- 

**Kỹ thuật & kiến thức áp dụng**:
| Kỹ thuật | Dùng ở đâu | Tier |
|---|---|---|
|  |  |  |

**Lỗi gặp phải & cách fix**:
- 

**Ghi chú / Bài học rút ra**:
- 

---
-->
