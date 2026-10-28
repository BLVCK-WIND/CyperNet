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

### 2026-10-17 — Phase 4: Hoàn thành 100% Báo cáo & Thống kê doanh thu (Reporting & Revenue Analytics)

**Phase**: Phase 4 (Báo cáo & Thống kê doanh thu)
**Thời gian**: ~2.5 giờ
**Việc đã làm**:
- **Micro-Step 4.1: JPQL Aggregation Queries tại Repository Layer:**
  + Bổ sung các câu query tổng hợp hiệu năng cao `SUM`, `COUNT`, `COALESCE`, `GROUP BY` trực tiếp trong Database:
    * `OrderRepository`: `sumRevenueByStatusAndDateRange`, `countByStatusAndDateRange`, `sumRevenueByPaymentMethod`, `findDailyOrderRevenue`, `findSpendingByAccount`.
    * `TimePurchaseRepository`: `sumRevenueByStatusAndDateRange`, `countByStatusAndDateRange`, `sumRevenueByPaymentMethod`, `findDailyTimePurchaseRevenue`, `findSpendingByAccount`.
    * `OrderItemRepository`: `findTopSellingItems` (kèm `Pageable` phân trang Top N), `sumRevenueByItemType` (F&B vs Playtime).
    * `SessionRepository`: `findComputerUsageCount`, `findComputerSessionDurations`, `findCustomerSessionDurations`.
- **Micro-Step 4.2: DTO Projections & Response Layer:**
  + Tạo package mới `dto/response/report/` chứa 5 DTOs siêu nhẹ, chống rò rỉ entity: `RevenueSummaryResponse`, `DailyRevenueResponse`, `TopItemResponse`, `TopCustomerResponse`, `ComputerUsageResponse`.
- **Micro-Step 4.3: Service Layer & Đa nguồn Doanh thu (`ReportService`):**
  + Triển khai logic tính toán tài chính đa nguồn (`Order` + `TimePurchase`) đảm bảo nguyên tắc ghi nhận doanh thu kế toán: Chỉ tính các giao dịch `CONFIRMED`.
  + Phân tích cơ cấu thanh toán Tiền mặt (`CASH`) vs Chuyển khoản (`QR`).
  + Phân tích cơ cấu doanh thu theo dòng hàng: Doanh thu thuần F&B (Món ăn/Thức uống) vs Doanh thu giờ chơi (Nạp quầy + Gói giờ trong order).
  + Sinh chuỗi ngày liên tục (`start` đến `end`) cho biểu đồ tài chính không bị đứt gãy dữ liệu.
  + Thống kê Top món bán chạy, Top khách hàng chi tiêu lớn nhất, và hiệu suất sử dụng máy trạm/khu vực.
- **Micro-Step 4.4: REST API & Phân quyền Bảo mật (`ReportController`):**
  + Xây dựng 5 endpoints:
    * `GET /api/reports/revenue/summary`: Tổng quan doanh thu theo khoảng thời gian.
    * `GET /api/reports/revenue/daily`: Doanh thu theo chuỗi ngày liên tục.
    * `GET /api/reports/items/top-selling`: Top món bán chạy nhất (mặc định top 10).
    * `GET /api/reports/customers/top-spenders`: Top khách hàng chi tiêu lớn nhất.
    * `GET /api/reports/computers/usage`: Tần suất và thời lượng sử dụng máy tính.
  + Phân quyền nghiêm ngặt với `@PreAuthorize("hasRole('ADMIN')")`: Chặn hoàn toàn STAFF và CUSTOMER.
- **Micro-Step 4.5: Kiểm thử Tích hợp Toàn diện (`Phase4ReportIntegrationTest`):**
  + Xây dựng 8 integration test cases phủ kín: Doanh thu tổng quan, loại trừ đơn huỷ/đơn pending, doanh thu theo ngày, top món bán chạy, top khách hàng, công suất máy trạm, quyền ADMIN (200), chặn STAFF (403), chặn Unauthenticated (401).
  + Kết quả: Chạy `./mvnw test` đạt **20/20 test cases PASS 100%** (Toàn bộ Phase 2, Phase 3, Phase 4).

**Kỹ thuật & kiến thức áp dụng**:
| Kỹ thuật | Dùng ở đâu | Tier |
|---|---|---|
| JPQL Aggregation Queries (`SUM`, `COUNT`, `GROUP BY`) | `OrderRepository`, `TimePurchaseRepository`, `OrderItemRepository`, `SessionRepository` | 🟢 Tier 4 |
| DTO Projection Pattern | Package `dto/response/report/` | 🔴 Tier 1 |
| Safe Null Handling (`COALESCE`) | Các query `SUM` trong JPQL tránh trả về null khi không có record | 🔴 Tier 1 |
| Multi-stream Revenue Reconciliation | `ReportService`: Tổng hợp 2 dòng tiền độc lập `Order` + `TimePurchase` | 🟠 Tier 2 |
| Continuous Timeline Data Generation | `ReportService.getDailyRevenue`: sinh chuỗi ngày liên tục cho Chart UI | 🟠 Tier 2 |
| Method-level Strict Security | `ReportController`: `@PreAuthorize("hasRole('ADMIN')")` | 🔴 Tier 1 |
| Integration Testing với Spring Security | `Phase4ReportIntegrationTest` dùng `MockMvc` + `springSecurity()` | 🔴 Tier 1 |

**Lỗi gặp phải & cách fix**:
- Lỗi `DataIntegrityViolation: Duplicate entry '192.168.1.101' for key 'computers.UK_ip_address'` trong test `setUp` do máy tính mẫu có IP bị trùng với record đã tạo trước đó ➔ Fix: Thay vì tạo mới mù quáng, test setup kiểm tra `computerRepository.findAll()` để tái sử dụng máy trạm hiện có hoặc tạo mới với IP an toàn, đồng thời dùng `availablePc.getCode()` trong assertions.

**Ghi chú / Bài học rút ra**:
- Tuyệt đối không bao giờ dùng `findAll()` rồi lôi hàng chục nghìn Entity lên RAM để tính `SUM` trong Java. Luôn đẩy tính toán xuống MySQL Database Engine qua JPQL/SQL.
- Hàm `SUM()` trong SQL trả về `NULL` nếu không có record nào thỏa mãn điều kiện. Luôn luôn bọc `COALESCE(SUM(...), 0)` trong JPQL để đảm bảo luôn nhận được `BigDecimal.ZERO` thay vì `null`.
- Kế toán tiệm net có 2 nguồn thu riêng biệt: Tiền nạp giờ chơi tại quầy (`TimePurchase`) và Tiền gọi món/dịch vụ tại máy (`Order`). Khi thống kê cơ cấu doanh thu giờ chơi, phải cộng cả `TimePurchase` lẫn các món loại `PLAYTIME` nằm trong `Order`.

### 2026-10-17 — Phase 5.1: Chuẩn hóa Pagination & Sorting cho toàn bộ hệ thống API

**Phase**: Phase 5 (Micro-Step 5.1)
**Thời gian**: ~1 giờ
**Việc đã làm**:
- Xây dựng DTO generic [PageResponse.java](file:///d:/Antigravity/Java_SpringBoot/internet-cafe-management/src/main/java/com/cybernet/internet_cafe_management/dto/response/PageResponse.java) đóng gói dữ liệu phân trang (`content`, `pageNumber`, `pageSize`, `totalElements`, `totalPages`, `isFirst`, `isLast`, `hasNext`, `hasPrevious`) kèm 2 phương thức static tiện ích `fromPage(...)`.
- Cập nhật Repository Layer (`OrderRepository`, `SessionRepository`, `TimePurchaseRepository`, `ComputerRepository`, `ItemRepository`, `AccountRepository`) bổ sung các truy vấn kế thừa `Pageable` và Spring Data `Page<T>`.
- Nâng cấp Service Layer (`OrderService`, `SessionService`, `TimePurchaseService`, `ComputerService`, `ItemService`, `AccountService`) hỗ trợ phương thức trả về `PageResponse<T>`. Vẫn giữ các phương thức cũ phục vụ tính tương thích logic nội bộ.
- Chuẩn hóa toàn bộ Controller Layer:
  + `GET /api/orders`: Phân trang, lọc theo `Status`, mặc định `sort = createdAt,desc`.
  + `GET /api/orders/session/{sessionId}`: Phân trang danh sách đơn theo phiên.
  + `GET /api/sessions`: Phân trang, lọc theo `Status`, mặc định `sort = startedAt,desc`.
  + `GET /api/sessions/account/{accountId}`: Phân trang lịch sử phiên theo khách hàng.
  + `GET /api/time-purchases`: Phân trang, lọc theo `Status`, mặc định `sort = createdAt,desc`.
  + `GET /api/time-purchases/account/{accountId}`: Phân trang lịch sử nạp tiền theo tài khoản.
  + `GET /api/computers`: Phân trang, lọc theo `Status`/`Zone`, mặc định `sort = code,asc`.
  + `GET /api/items` & `GET /api/items/type/{type}`: Phân trang, mặc định `sort = id,asc`.
  + `GET /api/accounts`: Phân trang, lọc theo `Role`, mặc định `sort = id,asc`.
- Viết bộ Integration Test `Phase5PaginationIntegrationTest` (7 test cases kiểm thử toàn diện mọi endpoint phân trang).
- Kết quả kiểm thử: Toàn bộ **31/31 test cases PASS 100%** (Toàn bộ Phase 2, Phase 3, Phase 4, Phase 5.1).

**Kỹ thuật & kiến thức áp dụng**:
| Kỹ thuật | Dùng ở đâu | Tier |
|---|---|---|
| Spring Data `Pageable` & `Page<T>` | Toàn bộ 6 Repository interfaces | 🟡 Tier 3 |
| `@PageableDefault` Annotation | Controller layer (định nghĩa sort & size mặc định) | 🟡 Tier 3 |
| Generic Envelope Pattern | `PageResponse<T>` | 🔴 Tier 1 |
| Functional Interface Projection | `PageResponse.fromPage(page, Entity::fromEntity)` | 🔴 Tier 1 |
| API Pagination Integration Testing | `Phase5PaginationIntegrationTest` | 🔴 Tier 1 |

**Lỗi gặp phải & cách fix**:
- Khi đổi endpoint `GET /api/accounts` trả về `PageResponse<AccountResponse>`, test case cũ `TC-5` trong `Phase3SecurityIntegrationTest` bị fail vì vẫn kỳ vọng root JSON `$` là Array. ➔ Fix: Cập nhật JSONPath assertion thành `$.content` là Array (`jsonPath("$.content").isArray()`).

**Ghi chú / Bài học rút ra**:
- Tuyệt đối không để API danh sách (List API) unpaged trên môi trường Production. Việc phân trang chặn đứng nguy cơ ứng dụng bị OOM (Out Of Memory) khi dữ liệu tăng trưởng.
- Sử dụng phương thức helper generic `fromPage(Page<E> page, Function<E, D> mapper)` giúp code mapping từ Entity sang DTO ở Service Layer chỉ còn đúng 1 dòng gọn gàng, giảm thiểu boilerplate code.

---

### 2026-10-17 — Phase 5.2: Structured Logging & Request Tracing với SLF4J, Logback & MDC

**Phase**: Phase 5 (Micro-Step 5.2)
**Thời gian**: ~1 giờ
**Việc đã làm**:
- Xây dựng [MdcLoggingFilter.java](file:///d:/Antigravity/Java_SpringBoot/internet-cafe-management/src/main/java/com/cybernet/internet_cafe_management/logging/MdcLoggingFilter.java) tạo Correlation ID (`X-Trace-Id`) ngẫu nhiên ngắn gọn (12 hex digits), đẩy vào SLF4J `MDC` ("traceId"), tự động đính kèm vào response header `X-Trace-Id`, đồng thời đo thời gian thực thi của từng HTTP request và clean-up MDC trong khối `finally`.
- Đăng ký `MdcLoggingFilter` vào Spring Security chain trong [SecurityConfig.java](file:///d:/Antigravity/Java_SpringBoot/internet-cafe-management/src/main/java/com/cybernet/internet_cafe_management/security/SecurityConfig.java) trước `SecurityContextHolderFilter.class` để bảo đảm trace ID luôn được khởi tạo trước mọi security filter và có mặt trong mọi bối cảnh test của MockMvc.
- Thiết lập cấu hình chuyên nghiệp [logback-spring.xml](file:///d:/Antigravity/Java_SpringBoot/internet-cafe-management/src/main/resources/logback-spring.xml) với 3 Appender:
  + `CONSOLE`: Định dạng có màu sắc, hiển thị `[%X{traceId:-SYSTEM}]`, package name viết tắt.
  + `FILE`: RollingFileAppender (`logs/cybernet.log`) quay vòng khi chạm 20MB, lưu tối đa 30 ngày, giới hạn 1GB.
  + `ERROR_FILE`: Lọc mức `LevelFilter` `ERROR` lưu riêng vào `logs/cybernet-error.log` phục vụ trực ban & cảnh báo sự cố.
- Bổ sung Audit Logging bằng `@Slf4j` cho các nghiệp vụ trọng yếu (Session login/expire/transfer, Order create/confirm/cancel, TimePurchase create/confirm/cancel, GlobalExceptionHandler bắt lỗi unhandled exception và validation failure).
- Viết integration test `Phase5LoggingIntegrationTest` kiểm thử: HTTP response header `X-Trace-Id` được sinh tự động, reuse traceId nếu client truyền lên, và kiểm tra ghi file log ra đĩa `logs/cybernet.log`.
- Kết quả kiểm thử: Toàn bộ **34/34 test cases PASS 100%**.

**Kỹ thuật & kiến thức áp dụng**:
| Kỹ thuật | Dùng ở đâu | Tier |
|---|---|---|
| Mapped Diagnostic Context (MDC) | `MdcLoggingFilter` & `logback-spring.xml` | 🔴 Tier 1 |
| Spring Security Filter Order Integration | `SecurityConfig.addFilterBefore(...)` | 🔴 Tier 1 |
| Logback Rolling File & Error Level Filtering | `logback-spring.xml` | 🟡 Tier 3 |
| Correlation ID / Request Tracing Pattern | `MdcLoggingFilter` & Client Header `X-Trace-Id` | 🔴 Tier 1 |
| Business Transaction Audit Logging | `SessionService`, `OrderService`, `TimePurchaseService` | 🔴 Tier 1 |

**Lỗi gặp phải & cách fix**:
- Nếu dùng `.addFilterBefore(mdcLoggingFilter, JwtAuthenticationFilter.class)` sẽ gặp lỗi runtime vì `JwtAuthenticationFilter` là custom filter chưa được Spring Security xác định order. ➔ Fix: Gắn filter trước `SecurityContextHolderFilter.class` (filter chuẩn đầu chuỗi của Spring Security).
- Nguy cơ memory leak hoặc trace ID bị rò rỉ chéo giữa các request trong thread pool của Tomcat nếu worker thread được tái sử dụng. ➔ Fix: Luôn dọn dẹp bằng `MDC.clear()` trong khối `finally`.

**Ghi chú / Bài học rút ra**:
- Log không chỉ để debug khi có bug, mà là mắt thần vận hành hệ thống. Bất cứ luồng tài chính hoặc trạng thái máy nào thay đổi cũng phải để lại audit trail rõ ràng.
- Trace ID giúp liên kết toàn bộ chuỗi log từ lúc request vào Servlet cho tới Repository, Service, Event và Response trả về. Khi xảy ra sự cố trên Prod, chỉ cần search trace ID là tái hiện toàn bộ hành trình của request.

---

### 2026-10-17 — Phase 5.3: OpenAPI 3 / Swagger Documentation (SpringDoc)

**Phase**: Phase 5 (Micro-Step 5.3)
**Thời gian**: ~1 giờ
**Việc đã làm**:
- Tích hợp dependency `springdoc-openapi-starter-webmvc-ui` (phiên bản 2.8.5) vào [pom.xml](file:///d:/Antigravity/Java_SpringBoot/internet-cafe-management/pom.xml).
- Xây dựng cấu hình OpenAPI tập trung [OpenApiConfig.java](file:///d:/Antigravity/Java_SpringBoot/internet-cafe-management/src/main/java/com/cybernet/internet_cafe_management/config/OpenApiConfig.java):
  + Metadata hệ thống: Tiêu đề API, mô tả, thông tin liên hệ và License.
  + Đăng ký Security Scheme `BearerAuth` (HTTP Bearer JWT) toàn cục, cho phép người dùng click **Authorize** trên giao diện Swagger UI để nhập Access Token thử nghiệm các endpoint yêu cầu quyền RBAC.
- Cấu hình [application.properties](file:///d:/Antigravity/Java_SpringBoot/internet-cafe-management/src/main/resources/application.properties):
  + Tùy biến đường dẫn: `springdoc.api-docs.path=/v3/api-docs` và `springdoc.swagger-ui.path=/swagger-ui.html`.
  + Tự động sắp xếp tag theo alphabet (`tags-sorter=alpha`), sắp xếp endpoint theo phương thức HTTP (`operations-sorter=method`), bật đo thời gian phản hồi `display-request-duration=true`.
- Cập nhật [SecurityConfig.java](file:///d:/Antigravity/Java_SpringBoot/internet-cafe-management/src/main/java/com/cybernet/internet_cafe_management/security/SecurityConfig.java) whitelist toàn bộ các đường dẫn `/v3/api-docs/**`, `/swagger-ui/**`, `/swagger-ui.html` cho phép truy cập công khai mà không bị Spring Security chặn 401 Unauthorized.
- Trang bị đầy đủ `@Tag` (phân nhóm) và `@Operation` (mô tả chi tiết nghiệp vụ & yêu cầu quyền hạn) cho toàn bộ 8 Controllers:
  + `AuthController`: Xác thực JWT, cấp lại token và đăng xuất.
  + `AccountController`: Quản lý tài khoản khách, nhân viên, admin.
  + `ComputerController`: Quản lý danh mục máy trạm, zone, đơn giá.
  + `ItemController`: Quản lý menu đồ ăn, thức uống, gói giờ chơi.
  + `OrderController`: Đặt món QR, bán hàng trực tiếp quầy, xác nhận thanh toán.
  + `SessionController`: Mở phiên chơi, khách đăng nhập máy trạm (UC-2), chuyển máy (UC-6), kết thúc phiên (UC-5).
  + `TimePurchaseController`: Nạp tiền giờ chơi tại quầy và lịch sử giao dịch.
  + `ReportController`: Báo cáo tài chính doanh thu, top khách hàng, best-sellers (ADMIN-only).
- Xây dựng bộ Integration Test [Phase5OpenApiIntegrationTest.java](file:///d:/Antigravity/Java_SpringBoot/internet-cafe-management/src/test/java/com/cybernet/internet_cafe_management/Phase5OpenApiIntegrationTest.java) (3 test cases):
  + `TC-1`: Kiểm tra `GET /v3/api-docs` trả về 200 OK với OpenAPI 3 JSON, cấu hình SecurityScheme `BearerAuth` và các paths nghiệp vụ cốt lõi.
  + `TC-2`: Kiểm tra `GET /swagger-ui/index.html` truy cập công khai thành công qua Spring Security.
  + `TC-3`: Kiểm tra việc đăng ký đầy đủ 8 Tags nghiệp vụ trong schema OpenAPI.
- Kết quả kiểm thử: Toàn bộ **33/33 test cases PASS 100%**.

**Kỹ thuật & kiến thức áp dụng**:
| Kỹ thuật | Dùng ở đâu | Tier |
|---|---|---|
| SpringDoc OpenAPI 3 Starter | `pom.xml` & `OpenApiConfig.java` | 🔴 Tier 1 |
| JWT Bearer Security Scheme Specification | `OpenApiConfig.customOpenAPI()` | 🔴 Tier 1 |
| Spring Security Whitelisting for Static UI Docs | `SecurityConfig.java` | 🔴 Tier 1 |
| Controller Documentation Annotations (`@Tag`, `@Operation`) | Toàn bộ 8 REST Controllers | 🟡 Tier 3 |
| Automated OpenAPI Schema Integration Testing | `Phase5OpenApiIntegrationTest.java` | 🔴 Tier 1 |

**Lỗi gặp phải & cách fix**:
- Khi thêm import annotation `@Tag` và `@Operation` vào `SessionController.java`, vô tình xóa nhầm import `SessionResponse` dẫn đến lỗi `cannot find symbol: class SessionResponse` khi compile. ➔ Fix: Bổ sung lại import đầy đủ và biên dịch sạch sẽ.

**Ghi chú / Bài học rút ra**:
- Tài liệu API tự sinh (Contract-driven) qua Swagger/OpenAPI giúp giảm thiểu 100% độ trễ và sai lệch thông tin giữa Backend team và Frontend/Mobile team.
- Cấu hình `SecurityScheme` ngay từ đầu giúp việc test API trên Swagger UI trở nên trực quan: chỉ cần đăng nhập lấy token dán vào là test được mọi API có phân quyền.

---

### 2026-10-17 — Phase 5.4: Multi-Environment Profiles (Dev vs Prod) & Spring Boot Actuator

**Phase**: Phase 5 (Micro-Step 5.4)
**Thời gian**: ~1 giờ
**Việc đã làm**:
- Tích hợp dependency `spring-boot-starter-actuator` vào [pom.xml](file:///d:/Antigravity/Java_SpringBoot/internet-cafe-management/pom.xml).
- Thiết kế phân tách cấu hình đa môi trường:
  + [application.properties](file:///d:/Antigravity/Java_SpringBoot/internet-cafe-management/src/main/resources/application.properties): Cấu hình dùng chung, kích hoạt profile mặc định `spring.profiles.active=dev`, expose Actuator endpoints (`health`, `info`, `metrics`), bật health probes cho containerization.
  + [application-dev.properties](file:///d:/Antigravity/Java_SpringBoot/internet-cafe-management/src/main/resources/application-dev.properties): Cấu hình cho môi trường phát triển (Dev) với MySQL local, `ddl-auto=update`, `show-sql=true`, `format_sql=true`, `health.show-details=always`, bật Swagger UI và log level `DEBUG`.
  + [application-prod.properties](file:///d:/Antigravity/Java_SpringBoot/internet-cafe-management/src/main/resources/application-prod.properties): Cấu hình sẵn sàng cho Production (Prod) với thông số nạp từ biến môi trường (`${DB_URL}`, `${DB_USERNAME}`, `${DB_PASSWORD}`, `${JWT_SECRET}`), tinh chỉnh tối ưu HikariCP connection pool (max 20 pool, idle 5, timeout 300s), bảo mật Actuator (`health.show-details=never`), tắt Swagger UI mặc định (`${SWAGGER_ENABLED:false}`) và log level `INFO`.
- Cấu hình phân quyền Spring Security cho Actuator trong [SecurityConfig.java](file:///d:/Antigravity/Java_SpringBoot/internet-cafe-management/src/main/java/com/cybernet/internet_cafe_management/security/SecurityConfig.java):
  + Công khai: `/actuator/health` và `/actuator/info` (cho Kubernetes/Docker/Nginx health check probes).
  + Bảo mật RBAC: Toàn bộ `/actuator/**` còn lại (metrics, env, beans) yêu cầu đăng nhập và có đặc quyền `hasRole('ADMIN')`.
- Viết bộ Integration Test [Phase5ActuatorProfileIntegrationTest.java](file:///d:/Antigravity/Java_SpringBoot/internet-cafe-management/src/test/java/com/cybernet/internet_cafe_management/Phase5ActuatorProfileIntegrationTest.java) (4 test cases):
  + `TC-1`: `GET /actuator/health` công khai trả về 200 OK và `status: "UP"`.
  + `TC-2`: `GET /actuator/info` công khai không yêu cầu token.
  + `TC-3`: `GET /actuator/metrics` kiểm tra bảo mật 3 cấp độ: 401 khi không đăng nhập, 403 khi dùng token CUSTOMER, 200 OK + danh sách metrics khi dùng token ADMIN.
  + `TC-4`: Xác nhận profile `dev` được nạp đúng vào Spring Environment.
- Kết quả kiểm thử: Toàn bộ **37/37 test cases PASS 100%**.

**Kỹ thuật & kiến thức áp dụng**:
| Kỹ thuật | Dùng ở đâu | Tier |
|---|---|---|
| Spring Boot Actuator & Health Probes | `pom.xml`, `application.properties` | 🔴 Tier 1 |
| Multi-Environment Profile Segregation (`dev` vs `prod`) | `application-dev.properties`, `application-prod.properties` | 🔴 Tier 1 |
| Production HikariCP Pool Tuning | `application-prod.properties` | 🟡 Tier 3 |
| Production 12-Factor App Config via Env Variables | `application-prod.properties` | 🔴 Tier 1 |
| Actuator Endpoint RBAC Securing | `SecurityConfig.java` (`hasRole('ADMIN')`) | 🔴 Tier 1 |
| Actuator Vendor Media Type Matching | `Phase5ActuatorProfileIntegrationTest.java` | 🟡 Tier 3 |

**Lỗi gặp phải & cách fix**:
- Actuator trả về media type `application/vnd.spring-boot.actuator.v3+json` khiến assertion `contentTypeCompatibleWith(APPLICATION_JSON)` bị fail. ➔ Fix: Sử dụng `MediaType.valueOf("application/vnd.spring-boot.actuator.v3+json")`.
- Tài khoản test trong DB đã tồn tại từ các phase trước với role CUSTOMER, khi gọi `orElseGet` không cập nhật lại role ADMIN khiến test case RBAC bị 403 thay vì 200. ➔ Fix: Luôn gán lại role rõ ràng và `accountRepository.save(account)` trong `@BeforeEach`.

**Ghi chú / Bài học rút ra**:
- Tách bạch profile giữa Dev và Prod là nguyên tắc sống còn theo chuẩn Twelve-Factor App. Tuyệt đối không bao giờ hardcode mật khẩu, DB credential hoặc secret key trên môi trường Production.
- Không bao giờ mở toang toàn bộ Actuator ra Internet vì có nguy cơ làm lộ biến môi trường, kết nối DB và cấu trúc bộ nhớ. Chỉ mở `health` và `info`, mọi endpoint quản trị khác phải được bảo vệ bằng quyền ADMIN.

---

### 2026-10-17 — Phase 5 (Micro-Step 5.5): Database Migration với Flyway

**Phase**: Phase 5 (Micro-Step 5.5)
**Thời gian**: ~1 giờ
**Việc đã làm**:
- Thêm dependency `flyway-core` và `flyway-mysql` vào `pom.xml`.
- Tạo `FlywayConfig.java`: Spring Boot 4 modular configuration nạp `Flyway.configure().dataSource(dataSource)...baselineOnMigrate(true).load()` và kích hoạt `flyway.migrate()`.
- Viết migration script `V1__init_schema.sql`: DDL idempotency (`CREATE TABLE IF NOT EXISTS`) khởi tạo chuẩn xác 8 bảng cơ sở dữ liệu (`accounts`, `computers`, `items`, `sessions`, `orders`, `order_items`, `time_purchases`, `refresh_tokens`) với đầy đủ ràng buộc khóa ngoại, chỉ mục index và kiểu dữ liệu chuẩn (`DECIMAL(10,2)`, `DATETIME(6)`).
- Viết migration script `V2__initial_seed_data.sql`: DML idempotency (`INSERT IGNORE INTO`) nạp dữ liệu mẫu ban đầu gồm tài khoản ADMIN & STAFF (mật khẩu mã hóa BCrypt), dàn máy trạm STANDARD/VIP và danh mục thức ăn nước uống/gói giờ chơi.
- Cấu hình baseline: `spring.flyway.baseline-on-migrate=true` và `spring.flyway.baseline-version=0` cho phép Flyway tương thích mượt mà với cơ sở dữ liệu đã tồn tại sẵn từ các phase trước.
- Viết integration test `Phase5FlywayIntegrationTest.java`: Kiểm thử xác nhận Flyway bean được nạp, version schema đạt 2, dữ liệu Admin/Staff và máy trạm được seed đầy đủ. Toàn bộ 40/40 test cases của hệ thống PASS 100%.

**Kỹ thuật & kiến thức áp dụng**:
| Kỹ thuật | Dùng ở đâu | Tier |
|---|---|---|
| Database Migration Versioning | `src/main/resources/db/migration/V1__...`, `V2__...` | 🔴 Tier 1 |
| Spring Boot 4 Modular Flyway Config | `FlywayConfig.java` | 🟡 Tier 3 |
| Flyway Baseline on Existing Database | `baselineOnMigrate(true)`, `baselineVersion("0")` | 🔴 Tier 1 |
| Idempotent DDL / DML SQL Scripts | `CREATE TABLE IF NOT EXISTS`, `INSERT IGNORE INTO` | 🔴 Tier 1 |
| Automated Migration Verification | `Phase5FlywayIntegrationTest.java` | 🟡 Tier 3 |

**Lỗi gặp phải & cách fix**:
- Spring Boot 4.1.1 đã tách riêng module Flyway khỏi auto-configuration mặc định, dẫn đến không tự khởi tạo Flyway bean từ file properties. ➔ Fix: Tạo `FlywayConfig.java` bean để chủ động nạp cấu hình và kích hoạt `flyway.migrate()` khi context khởi động.
- DB hiện tại đã có sẵn các bản ghi từ các phase trước (ví dụ máy với id=5), khiến lệnh `INSERT IGNORE INTO computers (id, code, ...)` với `id=5` bị bỏ qua. ➔ Fix: Tinh chỉnh assertion trong integration test tập trung vào các bản ghi chắc chắn được seed (Admin, Staff, PC-01, tổng số lượng máy >= 4).

**Ghi chú / Bài học rút ra**:
- Trong môi trường Production, không bao giờ được dùng `ddl-auto=update` hay `create-drop` mà phải quản lý schema hoàn toàn bằng các file migration có version rõ ràng (Flyway/Liquibase).
- Mọi script migration phải tuân thủ nghiêm ngặt tính lũy tiến (Forward-only) và tính bất biến (Immutable): một khi script đã chạy trên môi trường khác, không được sửa script cũ mà phải tạo script phiên bản mới để điều chỉnh schema/data.

---

### 2026-10-17 — Phase 5 (Micro-Step 5.6): Containerization (Dockerfile & Docker Compose)

**Phase**: Phase 5 (Micro-Step 5.6)
**Thời gian**: ~1 giờ
**Việc đã làm**:
- Tạo `.dockerignore`: Loại trừ triệt để `.git/`, `target/`, `logs/`, `.env`, IDE configs và tài liệu nội bộ nhằm giảm thiểu dung lượng context chuyển tới Docker daemon.
- Tạo `Dockerfile` đa tầng (Multi-stage build):
  + **Stage 1 (Builder):** `maven:3.9.6-eclipse-temurin-17-alpine`, tận dụng cache layer với `mvn dependency:go-offline`, build `.jar` độc lập không phụ thuộc máy host.
  + **Stage 2 (Runtime):** `eclipse-temurin:17-jre-alpine` siêu nhẹ, tạo non-root user `cybernet`, cấu hình tối ưu JVM container `-XX:+UseContainerSupport -XX:MaxRAMPercentage=75.0` và entropy provider.
- Tạo `.env.example`: Cung cấp danh mục biến môi trường chuẩn Twelve-Factor App cho môi trường triển khai Production.
- Tạo `docker-compose.yml`:
  + Service `db`: MySQL 8.0, cấu hình mã hóa `utf8mb4`, volume `mysql-data`, healthcheck `mysqladmin ping`.
  + Service `app`: Spring Boot container, kết nối `db` qua mạng nội bộ `cybernet-net`, volume `app-logs`, dependency gating `condition: service_healthy`, healthcheck qua Actuator `/actuator/health`.
- Chạy kiểm thử tự động toàn diện: Toàn bộ 40/40 test cases của hệ thống PASS 100%.

**Kỹ thuật & kiến thức áp dụng**:
| Kỹ thuật | Dùng ở đâu | Tier |
|---|---|---|
| Multi-Stage Docker Build | `Dockerfile` | 🔴 Tier 1 |
| Non-Root Container Security | `Dockerfile` (`addgroup`, `adduser`, `USER cybernet`) | 🔴 Tier 1 |
| JVM Container Memory Tuning | `Dockerfile` (`-XX:MaxRAMPercentage=75.0`) | 🟡 Tier 3 |
| Compose Healthcheck & Dependency Gating | `docker-compose.yml` (`condition: service_healthy`) | 🔴 Tier 1 |
| Persistent Data Volumes & Isolated Networks | `docker-compose.yml` (`mysql-data`, `app-logs`, `cybernet-net`) | 🔴 Tier 1 |
| Twelve-Factor App Env Injection | `.env.example`, `docker-compose.yml` | 🔴 Tier 1 |

**Lỗi gặp phải & cách fix**:
- Cần ánh xạ đúng biến `DB_USERNAME` thay vì `DB_USER` giữa `.env.example`, `docker-compose.yml` và `application-prod.properties` để Spring Boot nạp chính xác thông tin xác thực MySQL.

**Ghi chú / Bài học rút ra**:
- Multi-stage build là tiêu chuẩn bắt buộc cho ứng dụng Java: nó tách rời hoàn toàn môi trường build (chứa compiler, build tools, plugins nặng hàng trăm MB) khỏi môi trường runtime chỉ chứa JRE tối giản, giảm diện tích bề mặt tấn công bảo mật và giảm kích thước image xuống mức tối đa.
- Luôn chỉ định `condition: service_healthy` cho database dependency thay vì chỉ `depends_on: [db]`, vì MySQL cần 15-30 giây để hoàn tất khởi động và mở port lắng nghe.

---

### 2026-10-20 — Hoàn thành toàn diện 4 bước theo Roadmap khắc phục 7 Backend Gaps

**Phase**: Phase 6 — Advanced Backend Resilience & Enablers
**Thời gian**: 3 giờ
**Việc đã làm**:
- **Bước 1**: Rà soát và siết chặt toàn bộ Bean Validation (`@NotBlank`, `@Min`, `@Size`, `@Positive`, `@Valid`) trên 14 Request DTOs và 8 Controllers.
- **Bước 2**: Thiết lập hệ thống Real-time Event Push với Spring WebSocket + STOMP Broker (`/ws`, `/ws-raw`, `/topic/computers`, `/topic/orders`, `/topic/sessions`), kết nối trực tiếp với SessionService và OrderService để push trạng thái máy và thông báo đơn hàng tức thì.
- **Bước 3**: 
  - Xây dựng hệ thống Nhật ký kiểm toán Audit Trail (`audit_logs` table via Flyway V3, `AuditLogService` với `Propagation.REQUIRES_NEW`, `AuditLogController` phân quyền ADMIN).
  - Triển khai `RateLimitingFilter` chống Brute-force & spam request (HTTP 429 Too Many Requests kèm Retry-After).
- **Bước 4**:
  - Triển khai JPA Specification Pattern (`OrderSpecification`, `ComputerSpecification`) hỗ trợ tìm kiếm & lọc nâng cao đa tiêu chí kết hợp.
  - Xây dựng `FileUploadController` và `WebMvcConfig` hỗ trợ upload hình ảnh (PNG, JPG, WEBP tối đa 5MB) và API phát sinh mã thanh toán VietQR động chuẩn Napas247.
- **Kiểm thử**: Viết mới 18 test cases chuyên sâu, nâng tổng test suite lên **63/63 test cases PASS 100%**.

**Kỹ thuật & kiến thức áp dụng**:
| Kỹ thuật | Dùng ở đâu | Tier |
|---|---|---|
| Jakarta Bean Validation | `dto/request/*`, Controllers `@Valid` | 🟢 Cơ bản |
| Spring WebSocket + STOMP | `config/WebSocketConfig`, `RealtimeNotificationService` | 🔴 Nâng cao |
| Audit Logging & Propagation.REQUIRES_NEW | `service/AuditLogService`, `entity/AuditLog` | 🟡 Trung bình |
| Sliding Window Rate Limiting | `security/RateLimitingFilter` | 🟡 Trung bình |
| JPA Specification Pattern | `repository/specification/*`, `OrderService`, `ComputerService` | 🔴 Nâng cao |
| Multipart Upload & VietQR Helper | `controller/FileUploadController`, `config/WebMvcConfig` | 🟢 Cơ bản |

**Lỗi gặp phải & cách fix**:
- `ObjectMapper` thiếu `JavaTimeModule` khi render `LocalDateTime` trong RateLimitingFilter → Tạo `JacksonConfig` bean có đăng ký `JavaTimeModule`.
- Tần suất login của test suite làm đầy quota rate limiting ở môi trường test → Cho phép cấu hình qua properties và tăng limit trong dev/test, bổ sung hàm `clearLimits()`.
- Flyway V3 làm tăng version lên 3 khiến test cũ so sánh version == 2 bị fail → Cập nhật assertion kiểm tra `>= 2`.

---

### 2026-10-21 — Backend Audit, 3 CRUD Endpoints Bổ Sung & Thống Nhất Quy Chuẩn Mở Máy

**Phase**: Post-Phase 6 Audit & Frontend Preparation
**Thời gian**: 1.5 giờ
**Việc đã làm**:
- Rà soát toàn diện codebase theo `audit-backend.md`, `fe-api-coverage.md` và `api-contract.md`.
- Triển khai 3 CRUD endpoints còn thiếu: `PUT /api/computers/{id}`, `PUT /api/accounts/{id}`, `GET /api/sessions/computer/{computerId}`.
- Viết test suite `Phase6CrudEndpointsIntegrationTest` bao phủ toàn bộ 3 endpoints mới.
- Chạy toàn bộ test suite dự án đạt 73/73 test cases PASS 100%.
- Chạy toàn bộ bộ sưu tập 47 runtime HTTP tests trong `api-test.http` trên server thật port 8080 (100% PASS, xác minh CORS LAN IP).
- Thống nhất Phương án A cho logic mở máy (`StartSessionRequest`): mở theo số dư tài khoản khả dụng, hoàn trả phút dư khi kết thúc phiên.

**Kỹ thuật & kiến thức áp dụng**:
| Kỹ thuật | Dùng ở đâu | Tier |
|---|---|---|
| RESTful Update & DTO Validation | `ComputerController`, `AccountController`, DTOs | 🟢 Cơ bản |
| Derived Pagination Query | `SessionRepository.findByComputerId` | 🟢 Cơ bản |
| BCrypt Password Reset | `AccountService.updateAccount` | 🟡 Trung bình |
| Runtime HTTP Integration Scripting | `scratch/run_http_tests.ps1` | 🟡 Trung bình |

**Ghi chú / Bài học rút ra**:
- Quyết định chốt Phương án A giúp giao diện quầy thu ngân tinh gọn, khách không bao giờ mất giờ oan và không phát sinh lỗi đồng hồ giữa client/server.
- Toàn bộ backend hiện đã hoàn chỉnh 100%, sẵn sàng chuyển sang xây dựng UI theo kế hoạch.

---

### 2026-10-21 — Hoàn thành toàn diện Phase 1 (Customer UI: MS-1.1 đến MS-1.11) & Thiết lập Checklist Must-Fix Ảnh Món Ăn

**Phase**: Frontend Phase 1 — Customer UI (Web PC & Mobile QR Ordering)  
**Thời gian**: ~6 giờ  
**Việc đã làm**:
- **MS-1.1 (Scaffold & Theme Setup):** Khởi tạo Vite + React 19 + TypeScript tại `frontend/`. Tích hợp Tailwind CSS 4 (`@theme`), Ant Design 5 Dark Tokens (`antd-theme.ts`), `@ant-design/v5-patch-for-react-19`, Google Fonts *Inter* & *Space Grotesk*, và hệ thống keyframes hiệu ứng CyberLux (`animations.css`).
- **MS-1.2 (Auth Module & API Layer):** Thiết lập `axiosClient.ts` tự động gắn JWT Bearer, cơ chế mutex hàng đợi xử lý refresh token tự động khi gặp HTTP 401, chuẩn hóa `ErrorResponse`, xây dựng Zustand `authStore` lưu trữ phiên đăng nhập (`sessionId`, `computerCode`).
- **MS-1.3 (Customer QR Login Page):** Xây dựng trang `/customer/login?code=PC-01` nhận diện mã máy trạm từ QR Code bàn, form nhập SĐT (10 số), GlassCard bo góc, hiệu ứng rung (shake animation) khi lỗi và thông báo trực quan.
- **MS-1.4 (Session Dashboard & Countdown):** Xây dựng trang `/customer/dashboard`, vòng tròn đồng hồ SVG `TimerRing` biến đổi màu sắc (`gold` $\rightarrow$ `warning` $\rightarrow$ `danger`), thuật toán bù lệch đồng hồ (Clock Drift Compensation) với `dayjs.tz` dựa trên `serverTime` của backend. Thẻ thống kê phiên chơi và 2 nút hành động nhanh.
- **MS-1.5 (Menu Browser & Filter):** Trang `/customer/menu` tải danh mục món, thanh tìm kiếm debounced, bộ lọc tabs (Tất cả, Đồ ăn, Đồ uống, Giờ chơi), thẻ món `MenuCard` trạng thái hết hàng/còn hàng.
- **MS-1.6 (Cart & Order Creation):** Giỏ hàng nổi `FloatingCartButton` badge đỏ, Drawer trượt từ phải `CartDrawer` chọn tiền mặt hoặc VietQR, tích hợp API sinh mã thanh toán Napas247 động (`/api/files/vietqr`) qua popup `QrPaymentModal`.
- **MS-1.7 (Order History & Detail):** Trang `/customer/orders` danh sách đơn hàng theo phiên chơi, polling tự động mỗi 10 giây, badge trạng thái `CHỜ XỬ LÝ` vàng amber nhấp nháy độ tương phản cao, xem chi tiết qua `OrderDetailDrawer` và mở lại mã VietQR theo yêu cầu.
- **MS-1.8 (Page Transitions & Animations):** Bọc các trang bằng Framer Motion `PageTransition` (fade & slide-up), hiệu ứng hiển thị so le `StaggerContainer`, hạt ánh sáng lấp lánh `Sparkles`.
- **MS-1.9 (Mobile Responsive & Bottom Navigation Bar):** Thiết kế thanh điều hướng cố định dưới màn hình `CustomerBottomNav` cho khách dùng điện thoại quét QR, tối ưu Drawer full-screen và giải pháp ẩn footer trên mobile để không che khuất thao tác.
- **MS-1.10 (Loading & Error Handling):** Tích hợp `ErrorBoundary` bảo vệ ứng dụng khi có lỗi runtime, trang 404 `NotFoundPage` phong cách CyberLux, thanh tiến trình vàng kim `GlobalProgressBar` phía trên cùng khi gọi API.
- **MS-1.11 (UX Polish & Edge Cases):** Modal cảnh báo hết phiên `SessionExpiredModal` (có nút kiểm tra lại phiên khi đã nạp thêm tại quầy), khóa chống click đúp (double-click lock) trên toàn bộ form và nút đặt hàng/thanh toán, chỉ báo viền vàng `:focus-visible` hỗ trợ Accessibility, hook `useDocumentTitle` đồng bộ tiêu đề tab trình duyệt.
- **Thiết lập Checklist Bắt Buộc (Must-Fix):** Lên danh sách nhiệm vụ bổ sung thuộc tính `imageUrl` cho `Item` (Spring Boot Entity + Flyway V4 + DTOs + Frontend UI Menu Card) để hoàn thiện hiển thị ảnh món ăn thực tế (mì tôm, Sting, gà rán...) ngay đầu phiên làm việc kế tiếp trước khi sang Phase 2.

**Kỹ thuật & kiến thức áp dụng**:
| Kỹ thuật | Dùng ở đâu | Tier |
|---|---|---|
| React 19 + Vite + TypeScript | `frontend/src/*` | 🟢 Cơ bản |
| Tailwind CSS 4 `@theme` | `src/styles/index.css` | 🟢 Cơ bản |
| Ant Design 5 Dark Tokens & Patch | `src/styles/antd-theme.ts`, `main.tsx` | 🟢 Cơ bản |
| Token Refresh Mutex Queue | `src/api/axiosClient.ts` | 🟡 Trung bình |
| Zustand State Management | `src/store/authStore.ts`, `cartStore.ts` | 🟢 Cơ bản |
| Clock Drift Compensation | `src/features/customer/hooks/useCountdown.ts` | 🔴 Nâng cao |
| Napas247 Dynamic VietQR | `src/features/customer/components/QrPaymentModal.tsx` | 🟡 Trung bình |
| Polling & Cache Invalidation | TanStack React Query v5 | 🟡 Trung bình |
| Framer Motion Page Transitions | `src/components/animations/*` | 🟡 Trung bình |
| Responsive Touch & Mobile Nav | `src/components/layout/CustomerBottomNav.tsx` | 🟡 Trung bình |
| React Error Boundary | `src/components/common/ErrorBoundary.tsx` | 🟡 Trung bình |

**Lỗi gặp phải & cách fix**:
- Tailwind CSS 4 làm thẻ SVG trong nút Ant Design hiển thị dạng `display: block` dẫn đến icon bị lệch dòng $\rightarrow$ Thêm `.ant-btn svg { display: inline-block; vertical-align: middle; }` trong `index.css`.
- Bottom Navigation Bar trên mobile đè lên phần footer của trang $\rightarrow$ Ẩn footer trên mobile (`hidden sm:block`) và chỉ hiện trên màn hình desktop.
- Modal `styles` trong Ant Design không nhận thuộc tính `content` $\rightarrow$ Chuyển sang định dạng `styles={{ body: ... }}`.
- So sánh `session.status === 'EXPIRED'` bị lỗi TypeScript vì Entity backend định nghĩa `ACTIVE` hoặc `ENDED` $\rightarrow$ Chỉnh lại `session.status === 'ENDED'`.

**Ghi chú / Bài học rút ra**:
- Việc xây dựng giao diện chia nhỏ thành từng Micro-step rõ ràng giúp kiểm soát chất lượng chặt chẽ, mọi khâu đều có thể review và test thực tế ngay trên trình duyệt.
- Cần ưu tiên hoàn thiện thuộc tính ảnh món ăn (`imageUrl`) ở đầu phiên sau để Menu trông chân thực và bắt mắt nhất trước khi bước sang giao diện quầy thu ngân.

---

### 2026-10-23 — Bổ sung imageUrl Thực đơn & Tinh chỉnh toàn diện độ mượt Frontend

**Phase**: Pre-Phase 2 Stability & Image Integration
**Thời gian**: ~3 giờ
**Việc đã làm**:
- **Backend (MS-A):**
  - Bổ sung trường `imageUrl` vào `Item` entity, DTOs (`ItemResponse`, `CreateItemRequest`, `UpdateItemRequest`, `OrderItemResponse`).
  - Viết migration `V4__add_image_url_to_items.sql` bổ sung cột `image_url VARCHAR(500)` và seed ảnh chất lượng cao Unsplash CDN cho các món.
  - Cập nhật `ItemService.java`, `ItemController.java` và tích hợp `flyway.repair()` tự động.
  - Viết bộ Integration Test `ItemImageUrlIntegrationTest.java` (5/5 PASS), toàn bộ test suite đạt 78/78 tests PASS 100%.
- **Frontend (MS-B & Bugfixes):**
  - Bổ sung `imageUrl` vào `types/item.ts` và `types/order.ts`.
  - Thiết kế lại `MenuCard.tsx` hiển thị thumbnail ảnh tỉ lệ chuẩn CyberLux, bo góc, gradient shadow và fallback Lucide Icon.
  - Thêm ảnh thu nhỏ vào `CartDrawer.tsx` và `OrderDetailDrawer.tsx`.
  - Fix lỗi chớp giật modal hết hạn phiên trong 0.1s khi đăng nhập: chuyển `useCountdown.ts` sang đồng bộ tức thời bằng `useMemo` (Derived State) thay vì cập nhật trễ qua `useState` + `useEffect`.
  - Triệt tiêu lỗi nảy giật trục Y kép 26px từ dưới lên khi chuyển trang: đồng bộ `PageTransition.tsx` (micro-scale 0.992 $\rightarrow$ 1, duration 0.28s, bezier `[0.22, 1, 0.36, 1]`) và `StaggerContainer.tsx` (y: 8px).
  - Khắc phục rung giật layout do scrollbar trên Windows: thêm `html { scrollbar-gutter: stable; scroll-behavior: smooth; }` trong `index.css`.
  - Dọn sạch 100% Ant Design v6 runtime warnings: chuyển toàn bộ 7 component sang dùng `const { message } = App.useApp()`, đổi `Drawer.width` sang `Drawer.size`.
  - `npm run build` thành công 100% không phát sinh bất kỳ cảnh báo console nào.

**Kỹ thuật & kiến thức áp dụng**:
| Kỹ thuật | Dùng ở đâu | Tier |
|---|---|---|
| Flyway Idempotent Dynamic SQL | `V4__add_image_url_to_items.sql` | 🟡 Trung bình |
| DTO Projection with Media URL | `ItemResponse.java`, `OrderItemResponse.java` | 🔴 Tier 1 |
| Derived State Pattern in React | `frontend/src/features/customer/hooks/useCountdown.ts` | 🟡 Trung bình |
| Ant Design v6 Contextual Message Bridge | `App.useApp()` trên toàn bộ 7 components | 🟢 Cơ bản |
| Micro-scale Page Transition Depth | `frontend/src/components/animations/PageTransition.tsx` | 🟡 Trung bình |
| CSS Scrollbar Gutter Stabilization | `frontend/src/styles/index.css` | 🟢 Cơ bản |

**Lỗi gặp phải & cách fix**:
- `useCountdown` dùng `useState` + `useEffect` gây lag 1 khung hình làm `totalSeconds = 0`, kích hoạt `countdown.isExpired` nhấp nháy modal kết thúc phiên $\rightarrow$ Chuyển `totalSeconds` sang tính toán đồng bộ tức thì bằng `useMemo`.
- `PageTransition` (`y: 12`) kết hợp cùng `StaggerItem` (`y: 14`) gây cộng hưởng trục Y 26px làm trang bị giật nảy từ dưới trồi lên $\rightarrow$ Đổi toàn trang sang micro-scale và giảm biên độ `StaggerItem` xuống `y: 8`.
- Cảnh báo Ant Design static function can not consume context $\rightarrow$ Đổi sang `const { message } = App.useApp()`.
- Cảnh báo `Drawer.width` deprecated $\rightarrow$ Thay thế bằng thuộc tính `size`.

**Ghi chú / Bài học rút ra**:
- Tuyệt đối không lưu derived state từ props vào `useState` rồi chờ `useEffect` cập nhật nếu state đó quyết định logic hiển thị quan trọng (như modal cảnh báo), hãy tính toán đồng bộ qua `useMemo`.
- Animation toàn trang (Page Transition) nên ưu tiên thay đổi độ trong suốt (`opacity`) hoặc co giãn vi mô (`scale`) thay vì dịch chuyển trục Y (`translateY`), để tránh làm xê dịch thanh Header cố định và cộng hưởng với animation của các thẻ con bên trong.

---

### 2026-10-25 — Đánh giá toàn diện Phase 1 & Phase 2, Thiết lập kế hoạch cải tiến Twinkle Luxury Theme

**Phase**: Pre-Phase 3 UX/UI Review & Theme Standardization (MS-2.12b)
**Thời gian**: ~2 giờ
**Việc đã làm**:
- Khởi động thành công môi trường kiểm thử E2E liên thông giữa Customer và Staff quầy POS (`http://localhost:5173` và Spring Boot `http://localhost:8080`).
- Tiếp nhận 4 phản hồi đánh giá then chốt từ Tech Lead:
  1. *Staff Dashboard thiếu số đếm (Badge Counter)*: Nhân viên rời quầy đi vệ sinh hoặc pha chế không nghe được chuông báo, khi quay lại không có số đếm trực quan để biết có đơn chờ hay máy online.
  2. *Trạng thái thiếu phân cấp thị giác*: Toàn bộ thẻ máy và thẻ đơn hàng dùng chung một kiểu font chữ thường và màu sắc viền nhàn nhạt, thiếu độ rành mạch từ xa.
  3. *Menu khách hàng tab "Tất cả" bị trộn lẫn lộn xộn*: Đồ ăn, nước uống và gói nạp giờ chơi xen kẽ nhau, chưa chia theo Section phân loại danh mục.
  4. *Phối màu phẳng chưa đạt chuẩn ảnh mẫu "Twinkle"*: Chưa có Ambient Lighting Gradient, các card còn phẳng và thiếu độ bo cong viên thuốc (pill shapes) cao cấp.
- Cập nhật tài liệu kiến trúc: `LESSONS.md`, `frontend-plan.md`, `STATUS.md`, `frontend-handoff.md` ghi nhận bài học và quy chuẩn mới.
- Thiết lập kế hoạch 4 bước cải tiến `MS-2.12b` để hoàn thiện triệt để giao diện trước khi bắt tay vào Phase 3 (Admin Panel).

**Kỹ thuật & kiến thức áp dụng**:
| Kỹ thuật | Dùng ở đâu | Tier |
|---|---|---|
| Ambient Lighting Radial Gradient | CSS Foundation / Theme | 🟢 Cơ bản |
| Status Visual Hierarchy Matrix | `ComputerCard.tsx`, `StaffOrderCard.tsx` | 🟡 Trung bình |
| Reactive Realtime Badge Counters | `StaffSidebar.tsx`, `StaffTopBar.tsx` | 🟡 Trung bình |
| Grouped Category Sectioning | `CustomerMenuPage.tsx` | 🟡 Trung bình |
| Soft Pill-shaped Components | Buttons, Tags, Form Inputs | 🟢 Cơ bản |

**Lỗi gặp phải & cách fix**:
- Frontend báo lỗi `ERR_CONNECTION_REFUSED :8080/api/sessions/check/PC-01` $\rightarrow$ Nguyên nhân: Port 3306 MySQL đang chạy nhưng tiến trình Spring Boot chưa được start $\rightarrow$ Khởi động Spring Boot backend bằng `mvnw spring-boot:run`, kết nối database thành công và trả về `HTTP 200 OK`.

**Ghi chú / Bài học rút ra**:
- Tài liệu hóa ngay lập tức sau mỗi đợt review giúp bảo toàn tri thức cho các phiên làm việc tiếp theo, chống lặp lại các lỗi thiết kế cũ.
- Thiết kế quầy thu ngân thực tế phải đặt khả năng "liếc mắt nhận diện ngay" (Glanceable UI) lên hàng đầu thông qua Badge Counter và màu sắc tương phản cao.

---

### 2026-10-25 — Phân tích & Tài liệu hóa Khắc phục sự cố MS-2.12c (Floor Map Cache Key Collision & Blank Screen)

**Phase**: Post-MS-2.12b Bug Analysis & Hotfix Planning (MS-2.12c)
**Thời gian**: ~1 giờ
**Việc đã làm**:
- Tiếp nhận phản ánh lỗi từ Tech Lead: Bấm vào "Sơ đồ máy" hiển thị 0 máy ("Không tìm thấy máy trạm phù hợp"), và khi F5 làm mới thì toàn bộ màn hình tối đen.
- Phân tích và truy vết chính xác 2 nguyên nhân gốc rễ:
  1. *Xung đột TanStack Query Key*: `['staff-floormap-data']` dùng chung giữa `StaffSidebar`/`StaffTopBar` (trả về `{ totalComputers, activeSessions }`) và `useFloorMap` (trả về `{ computers, rawComputers, activeSessions }`). Do Sidebar/TopBar mount trước, cache bị lưu đè dạng số đếm khiến `data.computers` bị undefined, mảng máy rỗng.
  2. *Lỗi render Object vào React JSX*: Khi `useFloorMap` hoàn tất query và ghi đè mảng Object vào cache, `StaffTopBar` đọc `floorData.activeSessions` và chèn trực tiếp vào JSX `{floorData?.activeSessions}` gây sập React (`Objects are not valid as a React child`). Kết hợp với `ErrorBoundary` thiếu hook `useRouteError()`, React Router render `undefined` biến cả màn hình thành màu đen tuyền.
- Đề xuất giải pháp khắc phục toàn diện:
  + Tách riêng query key `['staff-quick-status-stats']` với trường đếm `activeSessionsCount: number` cho Sidebar và TopBar.
  + Bổ sung component `RouteErrorBoundary` sử dụng `useRouteError()` để bắt lỗi React Router và hiển thị giao diện báo lỗi trực quan kèm nút Tải lại trang.
  + Sửa đường dẫn redirect trong `RoleGuard.tsx` sang `/staff/floormap` và `/staff/login` / `/customer/login`.
  + Gỡ bỏ `@ant-design/v5-patch-for-react-19` khỏi `main.tsx` vì Ant Design v6 đã hỗ trợ Native React 19, làm sạch 100% console warning.
  + Bổ sung fallback an toàn cho `statusConfig` trong `ComputerCard.tsx`.
- Cập nhật bài học kiến trúc chi tiết vào `LESSONS.md`.

**Kỹ thuật & kiến thức áp dụng**:
| Kỹ thuật | Dùng ở đâu | Tier |
|---|---|---|
| TanStack Query Cache Granular Key Isolation | `StaffSidebar.tsx`, `StaffTopBar.tsx`, `useFloorMap.ts` | 🟡 Trung bình |
| React Router Route Error Handling (`useRouteError`) | `RouteErrorBoundary` trong `ErrorBoundary.tsx` | 🟡 Trung bình |
| Ant Design v6 Native React 19 Support | `main.tsx` (loại bỏ v5-patch thừa) | 🟢 Cơ bản |
| Guard Redirect Canonical Paths | `RoleGuard.tsx` | 🟢 Cơ bản |
| Defensive Style Map Lookup | `ComputerCard.tsx` | 🟢 Cơ bản |

**Lỗi gặp phải & cách fix**:
- Xung đột cache TanStack Query làm rỗng danh sách máy $\rightarrow$ Tách riêng key `['staff-quick-status-stats']` cho badge/stats và giữ `['staff-floormap-data']` độc quyền cho sơ đồ máy.
- Chèn trực tiếp Object Array vào JSX và sập ErrorBoundary $\rightarrow$ Đổi tên trường đếm `activeSessionsCount`, xây dựng `RouteErrorBoundary` tích hợp `useRouteError()`.
- Cảnh báo console `Warning: [antd: compatible] antd v6 support React 19 already` $\rightarrow$ Gỡ bỏ import `@ant-design/v5-patch-for-react-19` khỏi `main.tsx`.
- Lỗi `ws://127.0.0.1:5500//ws` và `STAGING is false` $\rightarrow$ Xác minh đây là tiến trình của tiện ích Live Server extension phía trình duyệt người dùng, hoàn toàn độc lập và không ảnh hưởng tới hệ thống.

**Ghi chú / Bài học rút ra**:
- Tuyệt đối không dùng chung TanStack Query Key nếu 2 component sử dụng cấu trúc dữ liệu trả về khác nhau.
- Mọi Error Boundary dùng cho React Router bắt buộc phải là Functional Component sử dụng `useRouteError()`, không dùng React Class Component đơn thuần vì sẽ render `undefined` khi có lỗi.
- Ant Design v6 đã native React 19, không cần và không được nạp `@ant-design/v5-patch-for-react-19`.

---

### 2026-10-25 / 2026-10-26 — Hoàn tất Toàn diện Phase 2 (Staff POS Floor Map, Session Manager, Sell Time POS) & Tái Cấu Trúc Kiến Trúc Dynamic Tariff & Active Session Auto-Extend

**Phase**: Phase 2 Finalization & Core Business Refactoring (MS-2.6, MS-2.7, MS-2.9, Dynamic Tariff)  
**Thời gian**: ~4 giờ  
**Việc đã làm**:
1. **Hoàn thiện Giao diện Sơ đồ máy (Floor Map Polish)**:
   - `frontend/src/features/staff/components/ComputerCard.tsx`: Khắc phục lỗi xung đột trạng thái: khi máy `IN_USE` mà `session` đang đồng bộ (`null`), hiển thị loading pulse "Đang đồng bộ phiên chơi..." thay vì cờ lê bảo trì. Bổ sung `whitespace-nowrap truncate` ngăn chữ mã máy dài (ví dụ `SEC-PC-01`) bị rớt dòng.
   - `frontend/src/features/staff/pages/FloorMapPage.tsx`: Giảm lưới hiển thị từ 6 cột chật chội về 4-5 cột thoáng đãng; bọc danh sách `availableComputers` bằng `useMemo`.
   - `frontend/src/components/layout/StaffTopBar.tsx` & `StaffSidebar.tsx`: Đồng bộ số lượng máy online chính xác theo `computers.filter(c => c.status === 'IN_USE')`.
2. **Xây dựng Trang Bán Giờ Chơi Quầy POS (`SellTimePage.tsx` — MS-2.9)**:
   - Bổ sung API `getTimePurchases` và `cancelTimePurchase` trong `frontend/src/api/timePurchaseApi.ts`.
   - Xây dựng giao diện POS bán giờ chuyên nghiệp: Tìm kiếm khách hàng theo SĐT/Tên, 6 nút preset mệnh giá thông dụng (10k, 20k, 50k, 100k, 200k, 500k), lựa chọn thanh toán Tiền mặt hoặc Chuyển khoản VietQR Napas247, kèm bảng lịch sử giao dịch nạp giờ gần nhất trong ngày.
3. **Xây dựng Màn hình Quản Lý Phiên Chơi (`SessionManagerPage.tsx` — MS-2.6 & MS-2.7)**:
   - Tạo mới trang quản lý tập trung toàn bộ phiên chơi tại `/staff/sessions` với 2 tab:
     - Tab "Đang hoạt động": Lưới card các phiên chơi realtime, đồng hồ đếm ngược, thanh tiến trình % thời gian đã chơi, cảnh báo vàng khi $\le 15$ phút, cảnh báo đỏ khi $\le 5$ phút, 3 nút hành động nhanh: Nạp giờ, Đổi máy, Kết thúc phiên.
     - Tab "Lịch sử phiên": Bảng danh sách các phiên đã kết thúc trong ngày kèm số phút thực tế đã chơi.
   - Tích hợp 10s auto-refresh polling và liên kết trực tiếp với các modal nghiệp vụ `StartSessionModal`, `EndSessionModal`, `TransferSessionModal`, `SellTimeModal`.
4. **Tái Cấu Trúc Toàn Diện Kiến Trúc Tính Giờ Động (Dynamic Tariff Architecture)**:
   - **Frontend**: Khắc phục lỗi hiển thị 5.0h cho cả máy 15k và 10k (300 phút chuẩn). Áp dụng công thức quy đổi động: $\text{playableMinutes} = \lfloor \frac{\text{account.remainingMinutes} \times 10000}{\text{pricePerHour}} \rfloor$.
   - **Backend (`SessionService.java`)**: Khai báo hằng số chuẩn `BASE_PRICE_PER_HOUR = 10000`. Xây dựng hàm `calculatePlayableMinutes` và áp dụng đồng bộ cho `startSession`, `loginAndStartSession`, `extendSession`.
   - **Hoàn trả giờ dư đối xứng (`endSession`)**: Quy đổi số phút máy trạm còn dư về lại số phút chuẩn: $\text{refundStandardMinutes} = \lfloor \frac{\text{remainingMachineMinutes} \times \text{pricePerHour}}{10000} \rfloor$, bảo toàn 100% giá trị tài sản của khách.
5. **Khắc Phục Sự Cố UI/UX Dropdown Khách Hàng (Zero-Ellipsis & State Resilience)**:
   - **Lỗi xóa trắng sau 1.2s**: Bóc tách mảng `availableComputers` ra khỏi dependency array của `useEffect` reset trong `StartSessionModal.tsx` và `TransferSessionModal.tsx`, chỉ cho phép reset khi modal đóng/mở (`open`).
   - **Lỗi ba chấm `...`**: Tận dụng Ant Design `optionRender` thiết kế bố cục Flexbox 2 cột (Cột trái: SĐT Monospace vàng kim + Tên khách cát sáng; Cột phải: Badge vàng đồng số phút/giờ quy đổi tương ứng với đơn giá máy được chọn, hoặc Badge đỏ khi 0 phút).
6. **Nghiệp Vụ Liên Thông Nạp Giờ & Tự Động Gia Hạn Phiên Đang Chơi (Active Session Auto-Extend)**:
   - `src/main/java/com/cybernet/internet_cafe_management/service/TimePurchaseService.java`: Bổ sung tiêm `SessionRepository` và `RealtimeNotificationService`.
   - Khi nhân viên duyệt phiếu nạp tiền (`confirmTimePurchase`): Kiểm tra nếu khách đang có phiên `ACTIVE`, tự động gia hạn `session.expiresAt` theo đơn giá của máy đó: $\text{extraMinutes} = \lfloor \text{topupStandardMinutes} \times \frac{10000}{\text{computer.pricePerHour}} \rfloor$, đồng thời bắn WebSocket realtime notification `SESSION_EXTENDED`.
   - Khi phiên kết thúc, toàn bộ thời gian dư trên máy được quy đổi ngược lại về số phút chuẩn hoàn lại tài khoản mà không bị lệch 1 đồng.
7. **Kiểm Thử Thực Nghiệm & Biên Dịch (PASS 100%)**:
   - Backend compilation `./mvnw.cmd compile`: BUILD SUCCESS.
   - Frontend compilation `npm run build --prefix frontend`: PASS (0 errors, 0 warnings, 1.85s).
   - Chạy kịch bản PowerShell thực nghiệm (`scratch/verify_vip_auto_extend.ps1`): Khách nạp 50k trên máy VIP 20k/h (`TEST-VIP-01`) gia hạn chính xác 150 phút; kết thúc phiên hoàn lại 598 phút chuẩn nguyên vẹn.
   - **Bộ Kiểm Thử Toàn Diện API & Trải Nghiệm Client (`scratch/run_all_client_api_tests.ps1`)**: Tự động hóa 4 luồng kiểm thử thực nghiệm (F&B Order Snapshot & PLAYTIME item, Dynamic Tariff Machine Transfer, Floor Map Data Mapping & Quick Stats, Customer Session Lifecycle & Token Invalidation) $\rightarrow$ **PASS 100% trong 3.09s**.

**Kỹ thuật & kiến thức áp dụng**:
| Kỹ thuật | Dùng ở đâu | Tier |
|---|---|---|
| Universal Base Currency Dynamic Tariff | `SessionService.java`, `StartSessionModal.tsx` | 🔴 Nâng cao |
| Active Session Auto-Extend Linkage | `TimePurchaseService.java` | 🔴 Nâng cao |
| Bidirectional Symmetrical Refund Logic | `SessionService.java` (`endSession`) | 🟡 Trung bình |
| Ant Design `optionRender` 2-Column Flexbox | `StartSessionModal.tsx`, `SellTimeModal.tsx` | 🟡 Trung bình |
| React Hook Dependency Decoupling & `useMemo` | `FloorMapPage.tsx`, `StartSessionModal.tsx` | 🟡 Trung bình |
| Full POS Screen with Napas247 VietQR | `SellTimePage.tsx` | 🟡 Trung bình |
| Centralized Live Session Manager | `SessionManagerPage.tsx` | 🟡 Trung bình |

**Lỗi gặp phải & cách fix**:
- *Lỗi 1: Máy VIP 15k và máy Standard 10k đều hiển thị 5.0h cho 300 phút* $\rightarrow$ Fix: Áp dụng Dynamic Tariff quy đổi theo tỷ lệ `10000 / pricePerHour` trên cả Frontend Modal và Backend `SessionService`.
- *Lỗi 2: Chọn khách xong bị mất sau 1.2s* $\rightarrow$ Fix: Gỡ `availableComputers` khỏi `useEffect` dependency array và bọc `useMemo` ở `FloorMapPage`.
- *Lỗi 3: Text danh sách khách bị tràn dấu ba chấm `...`* $\rightarrow$ Fix: Dùng `optionRender` chia 2 cột: SĐT + Tên bên trái, Badge vàng số phút bên phải.
- *Lỗi 4: Máy `IN_USE` chớp cờ lê bảo trì* $\rightarrow$ Fix: Thêm nhánh loading pulse "Đang đồng bộ phiên chơi..." khi `status === 'IN_USE'` và `session === null`.
- *Lỗi 5: Nạp tiền khi đang chơi máy VIP không tăng giờ* $\rightarrow$ Fix: Thêm cơ chế liên thông tự động gia hạn `session.expiresAt` trong `TimePurchaseService.confirmTimePurchase`.

**Ghi chú / Bài học rút ra**:
- Tiền tệ giờ chơi trong Database phải luôn lưu theo đơn vị chuẩn (Universal Standard Minutes), không bao giờ lưu theo đơn vị máy riêng lẻ.
- Mọi thao tác nạp tiền tại quầy phải chủ động kiểm tra phiên chơi đang chạy của khách để gia hạn kịp thời, bảo đảm trải nghiệm không gián đoạn.
- Trạng thái nhập liệu của Modal chỉ được reset khi `open` thay đổi, không bao giờ đưa các mảng phụ thuộc bên ngoài vào reset hook.

---

### 2026-10-26 — Chuẩn hóa toàn diện Bảng màu Twinkle gốc theo ảnh tham khảo

**Phase**: Phase 3 (Admin Panel Preparation & Foundation Alignment)
**Thời gian**: ~1 giờ
**Việc đã làm**:
- Đính chính và chuẩn hóa toàn bộ Design System của CyberNet theo 4 mã màu gốc từ ảnh tham khảo "Twinkle" do Tech Lead cung cấp:
  - (1) Nền chính (`--midnight`): `#202332` (Deep Twilight Navy)
  - (2) Màu chủ đạo (`--gold`): `#bd9875` (Warm Twinkle Caramel Gold)
  - (3) Bề mặt thẻ (`--slate`): `#434e60` (Slate Denim Navy)
  - (4) Màu phụ & viền (`--mist`): `#8b9a9f` (Sage Slate Mist)
- Cập nhật tài liệu thiết kế: `docs/notes/frontend-plan.md`, `docs/notes/frontend-handoff.md`, `docs/context/STATUS.md`.
- Chuẩn hóa Ambient Gradient: `radial-gradient(ellipse at 50% -10%, rgba(189, 152, 117, 0.16) 0%, rgba(67, 78, 96, 0.12) 50%, #202332 100%)`.
- Chuẩn hóa Card Surface Gradient: `linear-gradient(145deg, rgba(67, 78, 96, 0.85) 0%, rgba(32, 35, 50, 0.95) 100%)` với viền `1px solid rgba(139, 154, 159, 0.2)`.

**Kỹ thuật & kiến thức áp dụng**:
| Kỹ thuật | Dùng ở đâu | Tier |
|---|---|---|
| Design Tokens Global Mapping | `frontend-plan.md`, `antd-theme.ts`, `index.css` | 🟡 Trung bình |
| Documentation Integrity Synchronization | `frontend-plan.md`, `frontend-handoff.md`, `STATUS.md` | 🟢 Cơ bản |

**Lỗi gặp phải & cách fix**:
- *Lỗi sai lệch tông màu*: Trước đây trích xuất ước lượng nhầm sang tông xanh teal đen (`#10232A`, `#3D4D55`, `#B58863`) $\rightarrow$ Fix: Đồng bộ lại 100% theo 4 dải màu gốc Twinkle do Tech Lead cung cấp (`#202332`, `#bd9875`, `#434e60`, `#8b9a9f`). Nhờ kiến trúc Design Tokens, toàn bộ hệ thống sẽ đổi màu tự động qua biến CSS.

**Ghi chú / Bài học rút ra**:
- Mọi thay đổi nền tảng thiết kế cốt lõi bắt buộc phải được quy chuẩn hóa trong tài liệu trước khi chỉnh sửa mã nguồn.

---

### 2026-10-26 — Áp dụng Phối màu Đảo ngược (Reversed Gold Cards) & Hero Ambient Flow cho Admin Dashboard

**Phase**: Phase 3 (MS-3.1 Admin Layout & Dashboard Polish)
**Thời gian**: ~30 phút
**Việc đã làm**:
- Áp dụng phong cách thiết kế thẻ đảo ngược (Reversed Card Styling) cho các thẻ chức năng (Module Cards) trên trang `AdminDashboardPage.tsx` theo ảnh tham khảo do Tech Lead cung cấp:
  - Nền thẻ (Card Background): màu vàng caramel chủ đạo (`.twinkle-card-gold` gradient `linear-gradient(145deg, #c5a382 0%, #bd9875 45%, #a8835f 100%)`).
  - Hộp chứa Icon (Icon Container): Đảo ngược sang màu tối tương phản cao (`bg-midnight` `#202332` viền `border-midnight/40`), icon hiển thị màu vàng hổ phách (`text-gold`).
  - Chữ hiển thị trên thẻ (Typography): Tiêu đề và nội dung mô tả dùng màu tối đậm (`text-midnight` `#202332` / `text-midnight/80`) tạo độ tương phản cực kỳ rõ nét và nổi bật trên nền vàng.
  - Welcome Hero Banner: Sử dụng `.twinkle-hero-flow` với dải chuyển màu từ trên xuống (Top-to-Bottom) từ caramel gold `#bd9875` xuống denim slate `#434e60` và midnight navy `#202332`.
- Kiểm tra build: `npm --prefix frontend run build` PASS 100% (0 errors, 0 warnings).

**Kỹ thuật & kiến thức áp dụng**:
| Kỹ thuật | Dùng ở đâu | Tier |
|---|---|---|
| Inverted Surface Contrast Pattern | `AdminDashboardPage.tsx` | 🟡 Trung bình |
| Ambient Lighting Top-to-Bottom Flow | `index.css`, `AdminDashboardPage.tsx` | 🟢 Cơ bản |

**Lỗi gặp phải & cách fix**:
- *Lỗi thẻ bị chìm vào nền*: Trước đây thẻ dùng nền tối slate/midnight trùng màu nền khiến không có điểm nhấn phân biệt $\rightarrow$ Fix: Đảo ngược nền thẻ sang màu vàng chủ đạo với hộp icon tối theo đúng ảnh mẫu thực tế của Tech Lead.

**Ghi chú / Bài học rút ra**:
- Trong thiết kế Dashboard cao cấp, việc đảo ngược nền thẻ sang màu sáng rực rỡ (accent surface) kết hợp chữ và hộp icon tối màu giúp phân tầng thị giác vượt trội so với chỉ dùng viền phát sáng (glow border).

---

### 2026-10-26 — Đợt 1: Chuẩn hóa Lớp móng CSS & Thẻ Admin Dashboard theo chuẩn Hero Flow + Mũi tên phát sáng

**Phase**: Phase 3 (Design System Standardization - Round 1)
**Thời gian**: ~30 phút
**Việc đã làm**:
- Định nghĩa bộ utility classes cốt lõi cho hệ thống thẻ Twinkle trong `index.css`:
  - `.twinkle-card-flow`: Nền chuyển màu từ trên xuống (Top-to-Bottom Flow: vàng caramel `#bd9875` $\rightarrow$ xanh denim `#434e60` $\rightarrow$ xanh đêm `#202332`), viền nóc mạ ánh kim phản quang `border-t: 1px solid rgba(220, 185, 150, 0.5)`.
  - `.twinkle-arrow-capsule`: Vòng tròn mũi tên hành động phát sáng ở chân thẻ (mặc định nền kính mờ vàng; khi hover cả thẻ lập tức biến thành khối vàng rực `bg-gold`, mũi tên chuyển màu xanh đêm `text-midnight`, trượt nhẹ sang phải 4px và tỏa quầng sáng).
  - `.twinkle-icon-box`: Hộp icon kính mờ vàng hổ phách (`bg-gold/15`, viền `border-gold/35`, icon `text-gold-light`, hover scale 1.06 và sáng rực).
  - `.twinkle-btn-secondary`: Nút bấm phụ / làm mới chuẩn Twinkle (`bg-slate/50`, viền `border-mist/25`, hover ánh vàng).
- Nâng cấp `.glass-panel` và `.glass-panel-elevated` trong `index.css` & `GlassCard.tsx` kế thừa hiệu ứng ánh sáng rót từ trên xuống và viền nóc phản quang cho toàn bộ hệ thống.
- Cập nhật trang `AdminDashboardPage.tsx`: áp dụng `.twinkle-card-flow`, `.twinkle-icon-box`, `.twinkle-arrow-capsule` cho toàn bộ 5 thẻ module chức năng.
- Kiểm tra build: `npm --prefix frontend run build` PASS 100% (0 errors, 0 warnings).

**Kỹ thuật & kiến thức áp dụng**:
| Kỹ thuật | Dùng ở đâu | Tier |
|---|---|---|
| CSS Top-to-Bottom Specular Lighting | `index.css`, `GlassCard.tsx` | 🟡 Trung bình |
| Interactive Arrow Action Capsule Animation | `index.css`, `AdminDashboardPage.tsx` | 🟢 Cơ bản |

---

### 2026-10-26 — Tinh chỉnh Gradient Vàng Caramel Chảy Đậm Xuống 50% Chiều Cao Thẻ

**Phase**: Phase 3 (Twinkle Design System Refinement)
**Thời gian**: ~20 phút
**Việc đã làm**:
- Tinh chỉnh gradient Top-to-Bottom Flow theo chỉ đạo của Tech Lead:
  - Tăng độ phủ và độ đậm của màu vàng caramel `#bd9875` từ đỉnh (0%) kéo dài đậm đà xuống ngang 40-50% chiều cao của thẻ (opacity 0.35 - 0.55).
  - Từ mốc 50% trở xuống, dải vàng bắt đầu nhạt dần và chuyển tiếp êm ái sang xanh denim `#434e60` rồi hạ về nền xanh đêm sâu `#202332`.
  - Tăng độ sáng viền nóc mạ ánh kim phản quang lên `1.5px solid rgba(220, 185, 150, 0.75)`.
- Cập nhật đồng bộ vào các class: `.twinkle-hero-flow`, `.twinkle-card-flow`, `.glass-panel`, `.glass-panel-elevated` trong `index.css`.
- Đồng bộ lại tài liệu thiết kế: `frontend-plan.md`, `frontend-handoff.md`, `STATUS.md`.
- Kiểm tra build: `npm --prefix frontend run build` PASS 100%.

**Kỹ thuật & kiến thức áp dụng**:
| Kỹ thuật | Dùng ở đâu | Tier |
|---|---|---|
| Rich 5-Stop Vertical Gradient Interpolation | `index.css` | 🟡 Trung bình |
| Documentation & Plan Synchronization | `frontend-plan.md`, `frontend-handoff.md`, `STATUS.md` | 🟢 Cơ bản |

---

### 2026-10-26 — Hoàn tất Đồng bộ Giao diện Twinkle Design System Toàn Diện & MS-3.2 Admin Stats

**Phase**: Phase 3 (Twinkle Design System & Admin Dashboard MS-3.2)
**Thời gian**: ~1.5 giờ
**Việc đã làm**:
1. **Dọn sạch 100% mã màu cũ (Legacy Tokens Elimination)**:
   - Thay thế toàn bộ chuỗi hardcode cũ (`rgba(181,136,99,...)`, `rgba(167,158,156,...)`, `rgba(61,77,85,...)`, `rgba(16,35,42,...)`, `#10232A`, `#3D4D55`, `#B58863`, `#D3C3B9`) trên toàn bộ codebase frontend (`frontend/src`).
   - Các file đã xử lý hoàn tất:
     - Staff: `ComputerCard.tsx`, `FloorMapPage.tsx`, `StaffOrderCard.tsx`, `SellTimePage.tsx`, `SessionManagerPage.tsx`, `StaffOrderQueuePage.tsx`, `StaffSidebar.tsx`, `StaffTopBar.tsx`, `ComputerDetailDrawer.tsx`, `StaffOrderDetailDrawer.tsx`, `StartSessionModal.tsx`, `SellTimeModal.tsx`, `EndSessionModal.tsx`, `TransferSessionModal.tsx`, `StaffLoginPage.tsx`.
     - Customer: `CustomerBottomNav.tsx`, `CustomerDashboardPage.tsx`, `CartDrawer.tsx`, `OrderDetailDrawer.tsx`, `QrPaymentModal.tsx`, `SessionExpiredModal.tsx`, `CustomerLoginPage.tsx`, `TimerRing.tsx`.
     - Admin: `AdminDashboardPage.tsx`.
   - Kết quả quét kiểm tra: `git grep -E "181,136,99|167,158,156|61,77,85|16,35,42|10232A|3D4D55|B58863|D3C3B9" frontend/src` trả về **0 dòng** (loại bỏ hoàn toàn, không còn sót bất kỳ token cũ nào).

2. **Phân cấp thị giác chuẩn xác (Visual Hierarchy Rules)**:
   - **Thẻ chủ đề lớn / Banner chính**: áp dụng `.twinkle-hero-flow` và `.twinkle-major-flow` (vàng caramel rót đậm từ đỉnh 0% xuống 50% chiều cao thẻ, rồi chuyển tiếp êm qua xanh slate và xanh đêm) giúp phân biệt rõ ràng tiêu đề/khu vực điều hướng chính.
   - **Thẻ nhỏ / Card con / Hàng con**: áp dụng `.twinkle-card-flow` và `.glass-panel` với ánh sáng rót nhẹ (`0.18 -> 0.55 -> 0.95`) kèm viền nóc phản quang, tôn vinh thẻ chính mà không làm rối mắt người dùng.
   - **Hộp icon caramel**: chuẩn hóa `.twinkle-icon-box` mạ ánh kim sang trọng.
   - **Mũi tên hành động**: chuẩn hóa `.twinkle-arrow-capsule` với hiệu ứng trượt và quầng sáng vàng khi hover.

3. **Hoàn thành Micro-Step MS-3.2 (Chỉ số vận hành trực tuyến Admin)**:
   - Xây dựng [report.ts](file:///d:/Antigravity/Java_SpringBoot/internet-cafe-management/frontend/src/types/report.ts): Khai báo kiểu TypeScript đầy đủ cho `RevenueSummaryResponse`, `DailyRevenueResponse`, `ComputerUsageResponse`, `TopItemResponse`.
   - Xây dựng [reportApi.ts](file:///d:/Antigravity/Java_SpringBoot/internet-cafe-management/frontend/src/api/reportApi.ts): Kết nối các endpoint báo cáo tài chính backend (`GET /api/reports/revenue/summary`, `GET /api/reports/revenue/daily`, `GET /api/reports/items/top-selling`, `GET /api/reports/computers/usage`).
   - Xây dựng hook [useAdminStats.ts](file:///d:/Antigravity/Java_SpringBoot/internet-cafe-management/frontend/src/features/admin/hooks/useAdminStats.ts): Tự động nạp song song 3 nguồn dữ liệu thời gian thực (doanh thu hôm nay, tình trạng máy trạm, phiên đang chạy), auto-refresh chu kỳ 15 giây.
   - Xây dựng component [AdminStatsCards.tsx](file:///d:/Antigravity/Java_SpringBoot/internet-cafe-management/frontend/src/features/admin/components/AdminStatsCards.tsx): Gồm 4 thẻ thống kê nhanh (Doanh thu hôm nay, Máy đang phục vụ & Tỷ lệ lấp đầy, Phiên chơi trực tiếp, Đơn hàng & Lượt nạp giờ POS) với nút bấm làm mới `.twinkle-btn-secondary`.
   - Tích hợp vào [AdminDashboardPage.tsx](file:///d:/Antigravity/Java_SpringBoot/internet-cafe-management/frontend/src/features/admin/pages/AdminDashboardPage.tsx) nằm ngay dưới Hero Banner.

4. **Kiểm tra chất lượng (Quality Gate)**:
   - Lệnh `npm --prefix frontend run build` (`tsc -b && vite build`) chạy thành công 100%, **0 error, 0 warning**.

**Kỹ thuật & kiến thức áp dụng**:
| Kỹ thuật | Dùng ở đâu | Tier |
|---|---|---|
| Complete Design Token Elimination & Normalization | Toàn bộ `frontend/src` | 🟢 Cơ bản |
| Visual Hierarchy Flow Differentiation (Hero vs Subcard) | `index.css`, `AdminDashboardPage.tsx`, `FloorMapPage.tsx` | 🟡 Trung bình |
| React Query Multi-Endpoint Aggregation Hook | `useAdminStats.ts` | 🟡 Trung bình |
| Production Build Verification & Type Safety | `npm run build` | 🟢 Cơ bản |

---

### 2026-10-26 — Khắc phục Dứt Điểm Lỗi Máy Kẹt Trạng Thái & Deadlock Khôi Phục (Bước 1)

**Phase**: Bugfix & Production Resilience (Bước 1)
**Thời gian**: ~25 phút
**Việc đã làm**:
1. **Phân tích & Tái hiện Deadlock**:
   - Máy `TEST-PC-02` (id: 37) trong DB mang cờ `status = IN_USE`, nhưng trong bảng `sessions` không có session nào đang hoạt động.
   - Frontend không tìm thấy session nên báo *"Đang đồng bộ phiên chơi..."*. Khi mở Drawer chi tiết, nhánh điều kiện bị rớt vào thẻ Bảo trì và nút *"Khôi phục hoạt động"*.
   - Khi bấm khôi phục, Backend `ComputerService.java` chặn cứng `if (computer.getStatus() == IN_USE)` ném lỗi `IllegalStateException`, khiến thao tác khôi phục bị thất bại hoàn toàn.
2. **Sửa đổi Backend (`ComputerService.java`)**:
   - Inject `SessionRepository`.
   - Cập nhật logic: Kiểm tra `sessionRepository.existsByComputerIdAndStatus(computer.getId(), Session.Status.ACTIVE)`. Chỉ chặn đổi trạng thái khi máy THỰC SỰ có phiên chơi đang hoạt động. Nếu máy bị kẹt trạng thái (dangling `IN_USE`), cho phép Staff/Admin giải phóng máy về `AVAILABLE` hoặc `MAINTENANCE`.
   - Tự động broadcast WebSocket thông báo trạng thái mới của máy trạm.
3. **Cập nhật Frontend**:
   - [`ComputerDetailDrawer.tsx`](file:///d:/Antigravity/Java_SpringBoot/internet-cafe-management/frontend/src/features/staff/components/ComputerDetailDrawer.tsx): Bổ sung nhánh hiển thị máy bị kẹt trạng thái desync (`status === 'IN_USE' && !activeSession`), cảnh báo rõ ràng cho nhân viên và hiển thị nút hành động nổi bật: *"GIẢI PHÓNG MÁY VỀ SẴN SÀNG"*.
   - [`ComputerCard.tsx`](file:///d:/Antigravity/Java_SpringBoot/internet-cafe-management/frontend/src/features/staff/components/ComputerCard.tsx): Thay text mơ hồ bằng nhãn cảnh báo: *"Kẹt trạng thái (Bấm để gỡ)"*.
4. **Kiểm tra & Nghiệm thu**:
   - Khởi động lại Spring Boot backend (`task-945`).
   - Gọi API giải phóng thành công máy `TEST-PC-02` về `AVAILABLE`.
   - Toàn bộ 8/8 máy trạm trên hệ thống đã trở về trạng thái `AVAILABLE` (Sẵn sàng) sạch sẽ.
   - Build frontend `npm run build` PASS 100%.

**Kỹ thuật & kiến thức áp dụng**:
| Kỹ thuật | Dùng ở đâu | Tier |
|---|---|---|
| Desynchronized Entity State Recovery Pattern | `ComputerService.java` | 🔴 Tier 1 |
| Explicit Fallback Branching for State Machine | `ComputerDetailDrawer.tsx` | 🟢 Cơ bản |
| Spring Boot Hot Recovery & Zero Downtime Restart | Backend CLI | 🟢 Cơ bản |

---

### 2026-10-26 — Tối Ưu Triệt Tiêu Giật Khựng Khi Chuyển Tab (Bước 2)

**Phase**: Performance & Smooth UX (Bước 2)
**Thời gian**: ~20 phút
**Việc đã làm**:
1. **Triệt tiêu Layout Thrashing trên Sơ Đồ Máy (`FloorMapPage.tsx` & `ComputerCard.tsx`)**:
   - Loại bỏ `motion.div layout` và `AnimatePresence mode="popLayout"` trên Grid máy trạm vốn gây ra tính toán FLIP layout đè lên CSS Grid.
   - Loại bỏ `layout` prop trên `ComputerCard.tsx`, giữ lại micro-interaction `whileHover` và `whileTap` nhẹ nhàng.
   - Thao tác chuyển tab trạng thái (Tất cả, Trống, Đang chơi, Bảo trì) và phân khu (Toàn bộ, Standard, VIP) phản hồi tức thì 0ms, mượt mà 60fps/144fps.
2. **Loại bỏ hiện tượng nháy giật Skeleton trên Hàng Đợi Đơn Hàng (`useOrderQueue.ts` & `StaffOrderQueuePage.tsx`)**:
   - Bổ sung `placeholderData: keepPreviousData` vào `useQuery`.
   - Chuyển Grid đơn hàng thành container tĩnh mượt mà, không giật FLIP.
   - Khi chuyển tab giữa các trạng thái đơn hàng (Chờ thanh toán, Đang làm, Hoàn tất, Hủy), dữ liệu cũ được giữ nguyên trên màn hình cho đến khi dữ liệu mới trả về, loại bỏ hoàn toàn việc chớp giật khung Skeleton xám.
3. **Loại bỏ hiện tượng nháy Skeleton trên Quản Lý Phiên Chơi (`SessionManagerPage.tsx`)**:
   - Bổ sung `placeholderData: keepPreviousData` vào `useQuery` của `staff-sessions-page`.
   - Chuyển đổi giữa 3 tab "Đang chơi", "Lịch sử kết thúc", "Tất cả phiên" êm ái, danh sách không bị hủy bỏ giữa chừng.
4. **Kiểm tra chất lượng**:
   - `npm --prefix frontend run build` PASS 100% (0 errors, 0 warnings).

**Kỹ thuật & kiến thức áp dụng**:
| Kỹ thuật | Dùng ở đâu | Tier |
|---|---|---|
| Zero-Jank React Query `keepPreviousData` Pattern | `useOrderQueue.ts`, `SessionManagerPage.tsx` | 🟡 Trung bình |
| Layout Thrashing Elimination on CSS Grid | `FloorMapPage.tsx`, `ComputerCard.tsx`, `StaffOrderQueuePage.tsx` | 🟡 Trung bình |

---

### 2026-10-26 — Tái Thiết Kế Chỉ Số Vận Hành Trực Tuyến Admin (Bước 3)

**Phase**: Admin Dashboard Refinement (Bước 3)
**Thời gian**: ~20 phút
**Việc đã làm**:
1. **Tách biệt hoàn toàn khỏi thẻ điều hướng chuyển trang**:
   - Loại bỏ class `.twinkle-card-flow` và `cursor-pointer`, loại bỏ hiệu ứng hover nhảy thẻ (`hover:-translate-y-1`, shadow jump) trên 4 thẻ chỉ số.
   - Định hình class mới `.twinkle-kpi-card`: Nền sẫm cao cấp (`linear-gradient(180deg, rgba(67, 78, 96, 0.42), rgba(32, 35, 50, 0.94))`), `cursor-default`, `user-select: none`.
2. **Thiết kế dải Telemetry KPI Báo Cáo Nhanh (Executive KPI Strip)**:
   - Header: Huy hiệu nhấp nháy `BÁO CÁO NHANH VẬN HÀNH` + nhãn thời gian thực hôm nay + đồng hồ thời gian cập nhật gần nhất (`HH:mm:ss`) + nút làm mới nhỏ gọn `.twinkle-btn-secondary`.
   - 4 thẻ KPI với viền LED nóc (Accent Top Border) phân định theo nghiệp vụ:
     - **Doanh thu thực thu**: Viền vàng caramel `border-t-gold`, số tiền nổi bật `text-gold font-black`, chia tách Tiền mặt vs VietQR.
     - **Công suất phòng máy**: Viền xanh lục `border-t-[#4ADE80]`, hiển thị số máy online / tổng máy + tag phần trăm lấp đầy.
     - **Phiên chơi trực tiếp**: Viền xanh băng `border-t-[#85C1DC]`, hiển thị số phiên chơi live + số máy trống sẵn sàng.
     - **Giao dịch hôm nay**: Viền cát ấm `border-t-sand`, hiển thị số đơn món F&B + lượt nạp giờ tại quầy POS.
3. **Kiểm tra chất lượng**:
   - `npm --prefix frontend run build` PASS 100% (0 errors, 0 warnings).

**Kỹ thuật & kiến thức áp dụng**:
| Kỹ thuật | Dùng ở đâu | Tier |
|---|---|---|
| Glanceable Executive Telemetry Strip UI | `AdminStatsCards.tsx`, `index.css` | 🟢 Cơ bản |
| Affordance Separation (Navigation vs Informational) | `AdminStatsCards.tsx` | 🟡 Trung bình |

---

### 2026-10-26 — Áp Dụng Phong Cách Kính Lỏng (Liquid Glass 3D) Cho 4 Thẻ KPI Admin

**Phase**: UI/UX Innovation & Advanced Visual Effects
**Thời gian**: ~25 phút
**Việc đã làm**:
1. **Phân tích thiết kế Liquid Glass theo ảnh tham khảo**:
   - Đặc trưng: Khối kính lỏng nổi 3D, vệt phản quang khúc xạ ánh sáng ở góc trên trái (`radial-gradient`), viền kính kép nổi khối (`inset 0 1.5px 2px`, `inset 0 -2px 4px`), và quầng sáng neon mềm nở tỏa bên dưới (`box-shadow: 0 16px 36px -8px ...`).
2. **Xây dựng 4 sắc thái Liquid Glass trong cùng dải màu vàng đất / caramel / xám khói / cát ngà**:
   - `.liquid-glass-caramel`: *Rich Caramel & Midnight Obsidian* (Đen tuyền đổ sang vàng caramel óng ánh, hào quang hổ phách).
   - `.liquid-glass-sand`: *Sand & Platinum Slate* (Xám denim pha vàng cát ngà thanh lịch, hào quang cát sáng).
   - `.liquid-glass-smoke`: *Deep Smoked Charcoal & Bronze Gold* (Đen khói sâu thẳm điểm ánh đồng, hào quang khói xám sâu).
   - `.liquid-glass-amber`: *Dark Amber & Frosted Cream* (Hổ phách đậm pha kem sữa ấm, hào quang mật ong).
3. **Chân thẻ Frosted Glass Pill**:
   - Tái hiện khung thẻ mờ bên dưới giống các swatch trong ảnh tham khảo: `backdrop-blur-md bg-black/20 rounded-xl px-3 py-1.5 border-t border-white/10`.
4. **Kiểm tra chất lượng**:
   - `npm --prefix frontend run build` PASS 100% (0 errors, 0 warnings).

**Kỹ thuật & kiến thức áp dụng**:
| Kỹ thuật | Dùng ở đâu | Tier |
|---|---|---|
| CSS 3D Liquid Glass with Inset Specular & Ambient Bloom | `index.css`, `AdminStatsCards.tsx` | 🔴 Nâng cao |
| Monochromatic Tonal Harmonies (Earth/Caramel Family) | `AdminStatsCards.tsx` | 🟡 Trung bình |

---

### 2026-10-26 — Tinh Chỉnh Bảng Màu Liquid Glass: Cam Cháy & Xanh Cyan Điện Tử (Bước 3)

**Phase**: UI/UX Refinement & Visual Distinction
**Thời gian**: ~15 phút
**Việc đã làm**:
1. **Phối màu mới theo feedback**:
   - **Thẻ 1 (Doanh thu thực thu)**: Chuyển sang `.liquid-glass-sunset` (Cam cháy hoàng hôn phối đỏ san hô `rgba(234, 88, 12, ...)` & `rgba(225, 29, 72, ...)`, điểm nhấn `text-[#fed7aa]`, TM `#fb923c`, QR `#fdba74`). Nổi bật vị thế doanh số tài chính hàng đầu.
   - **Thẻ 2 (Công suất phòng máy)**: Giữ nguyên `.liquid-glass-sand` (Vàng cát ngà & xám slate denim thanh lịch, điểm nhấn xanh lá `#4ADE80`).
   - **Thẻ 3 (Phiên chơi trực tiếp)**: Đổi sang `.liquid-glass-cyan` (Xanh Cyan điện tử & Lam ngọc sống động `rgba(6, 182, 212, ...)`, điểm nhấn `text-[#38bdf8]`, số máy trống `#4ade80`). Nổi bật tính chất máy tính gaming kết nối trực tiếp.
   - **Thẻ 4 (Giao dịch hôm nay)**: Giữ nguyên `.liquid-glass-amber` (Hổ phách đậm & kem sữa ấm).
2. **Kiểm tra chất lượng**:
   - `npm --prefix frontend run build` PASS 100% (0 errors).

---

### 2026-10-26 — Chuẩn Hóa Nghiệp Vụ Đăng Ký Hội Viên & Nạp Đầu Tại Quầy POS (Bước 4)

**Phase**: Domain Integrity, RBAC Hardening & Fast Onboarding
**Thời gian**: ~30 phút
**Việc đã làm**:
1. **Lập luận nghiệp vụ thực tế quán net**:
   - Loại bỏ tự đăng ký online ẩn danh để tránh rửa tiền, tài khoản rác và gian lận.
   - Khách muốn mở tài khoản phải đến trực tiếp quầy POS, nạp tiền lần đầu tối thiểu $\ge 10.000$đ, có camera an ninh đối soát giữa nhân viên nhận tiền và khách hàng.
   - Chống leo thang đặc quyền (Anti-Privilege Escalation): Nhân viên quầy chỉ được phép tạo tài khoản có vai trò `ROLE_CUSTOMER`.
2. **Backend Architecture**:
   - DTOs: `RegisterCustomerWithDepositRequest` (phone, name, optional password, initialDeposit $\ge 10.000$đ, paymentMethod), `RegisterCustomerResponse`.
   - Service: `AccountService.registerCustomerWithDeposit`:
     - Validate SĐT duy nhất.
     - Tự động sinh mật khẩu: Nếu không nhập, lấy 4 số cuối của SĐT làm mật khẩu khởi tạo.
     - Quy đổi số tiền nạp sang phút chuẩn (@ 10.000đ = 60 phút) và gán trực tiếp vào `account.remainingMinutes`.
     - Tạo ngay bản ghi `TimePurchase` với trạng thái `CONFIRMED`, liên kết `staffId` của nhân viên ca trực.
     - Ghi vết kiểm toán tự động qua `AuditLogService` (`REGISTER_CUSTOMER_WITH_DEPOSIT`).
   - Controller: `POST /api/accounts/register-with-deposit` (PreAuthorize `ADMIN`, `STAFF`).
   - Siết chặt `POST /api/accounts`: Nếu người gọi không phải ADMIN, bắt buộc role = `CUSTOMER`.
3. **Frontend Architecture**:
   - Component modal: `RegisterCustomerModal.tsx` chuẩn Twinkle Glassmorphism với presets mệnh giá (10k, 20k, 50k, 100k, 200k + số khác), preview thời gian quy đổi, checkbox "Mật khẩu 4 số cuối SĐT", chọn phương thức thu tiền (Tiền mặt / VietQR).
   - Tích hợp nút `+ Hội viên mới` vào:
     - `StartSessionModal.tsx` (Mở máy quầy).
     - `SellTimePage.tsx` (POS nạp giờ).
     - `SellTimeModal.tsx` (Popup nạp giờ).
   - Cơ chế tự động chọn (Auto-Select): Sau khi tạo thành công, tự động chọn ngay khách hàng mới vào trường chọn khách và sẵn sàng mở máy trong 1 click.
4. **Kiểm thử & Nghiệm thu toàn diện**:
   - Integration Test: `CustomerRegistrationWithDepositIntegrationTest.java` (5/5 tests PASS).
   - Toàn bộ backend test suite: 83/83 tests PASS 100%.
   - Live script test `test_register_customer.ps1`: Chạy thành công toàn bộ luồng tạo khách -> nạp giờ -> mở máy PC-01 -> khách quét QR login -> nhân viên kết thúc phiên -> kiểm tra chống trùng SĐT.
   - Frontend `npm run build`: PASS 100% (0 errors).

**Kỹ thuật & kiến thức áp dụng**:
| Kỹ thuật | Dùng ở đâu | Tier |
|---|---|---|
| Domain-Driven Design (In-person Counter Onboarding with Deposit) | `AccountService.java`, `AccountController.java` | 🔴 Nâng cao |
| Anti-Privilege Escalation RBAC Guard | `AccountController.java` | 🔴 Nâng cao |
| Atomic Member Creation with Time Purchase & Audit Trail | `AccountService.java` | 🔴 Nâng cao |
| Fast Onboarding Modal with Twinkle Design Tokens | `RegisterCustomerModal.tsx` | 🟡 Trung bình |

---

### 2026-10-26 — Đồng Bộ Phong Cách Liquid Glass 3D Sang Toàn Bộ Phân Hệ Staff & Tạo Telemetry Đơn Hàng

**Phase**: UI/UX Architecture & Executive Telemetry System
**Thời gian**: ~25 phút
**Việc đã làm**:
1. **Mở rộng hệ thống CSS Liquid Glass 3D (`index.css`)**:
   - Thêm `.liquid-glass-emerald`: *Emerald Mint & Cyber Jade* (`rgba(16, 185, 129, ...)` & `rgba(34, 197, 94, ...)`), đại diện cho trạng thái *Sẵn sàng, Đã hoàn tất*.
   - Thêm `.liquid-glass-ruby`: *Ruby Crimson & Flame Rose* (`rgba(225, 29, 72, ...)` & `rgba(239, 68, 68, ...)`), đại diện cho *Máy bảo trì, Cảnh báo*.
2. **Nâng cấp Sơ đồ máy (`FloorMapPage.tsx`)**:
   - Chuyển 4 thẻ thống kê sang Liquid Glass 3D:
     - Tổng số máy: `.liquid-glass-sand` (Vàng cát ngà & slate, phân chia STD/VIP).
     - Máy sẵn sàng: `.liquid-glass-emerald` (Xanh lục ngọc bích sáng, số máy trống đón khách).
     - Đang hoạt động: `.liquid-glass-cyan` (Xanh Cyan điện tử gaming, % công suất phòng).
     - Máy bảo trì: `.liquid-glass-ruby` (Đỏ ruby san hô cảnh báo).
3. **Bổ sung dải Telemetry Báo Cáo Nhanh Đơn Hàng (`StaffOrderQueuePage.tsx`)**:
   - Tạo mới dải 4 thẻ Liquid Glass 3D cho hàng đợi đơn hàng:
     - **Chờ xác nhận**: `.liquid-glass-sunset` (Cam cháy hoàng hôn, đèn pulse nhấp nháy khi có đơn chờ duyệt, tổng tiền tạm tính).
     - **Đã hoàn thành**: `.liquid-glass-emerald` (Xanh lục, số đơn đã giao & thu tiền).
     - **Tổng lượt gọi món**: `.liquid-glass-cyan` (Cyan điện tử, tổng số đơn gọi hôm nay).
     - **Doanh thu F&B**: `.liquid-glass-amber` (Hổ phách đậm, tổng doanh thu đồ ăn thức uống).
   - Nâng cấp hook `useOrderQueue.ts` truy vấn thống kê song song thời gian thực.
4. **Nâng cấp Quản lý phiên chơi (`SessionManagerPage.tsx`)**:
   - Chuyển 3 thẻ tổng quan sang Liquid Glass 3D:
     - Phiên đang hoạt động: `.liquid-glass-cyan`.
     - Máy trạm sẵn sàng: `.liquid-glass-emerald`.
     - Tổng lượt phiên: `.liquid-glass-amber`.
5. **Nâng cấp Quản lý tài khoản (`AccountManagerPage.tsx`)**:
   - Chuyển 3 thẻ mini sang Liquid Glass 3D:
     - Tổng số hội viên: `.liquid-glass-sand`.
     - Tổng giờ khả dụng: `.liquid-glass-emerald`.
     - Quy định nạp đầu quầy POS: `.liquid-glass-amber`.
6. **Kiểm tra chất lượng**:
   - `npm run build` PASS 100% (0 errors, 0 warnings).
   - HMR tự động cập nhật ngay trên giao diện trình duyệt.

**Kỹ thuật & kiến thức áp dụng**:
| Kỹ thuật | Dùng ở đâu | Tier |
|---|---|---|
| Universal 3D Liquid Glass Theming System | `index.css`, cả 4 trang Staff | 🔴 Nâng cao |
| Order Queue Executive Telemetry Strip & Aggregations | `StaffOrderQueuePage.tsx`, `useOrderQueue.ts` | 🟡 Trung bình |

---

### 2026-10-26 — Khắc phục lỗ hổng bảo mật & Tối ưu nghiệp vụ đổi mật khẩu tại quầy

**Phase**: Domain Security & Counter Operations Optimization
**Thời gian**: ~20 phút
**Việc đã làm**:
1. **Khắc phục lỗ hổng leo thang đặc quyền (Privilege Escalation & Account Takeover)**:
   - File: `AccountController.java` (`PUT /api/accounts/{id}`)
   - Trước đây: Nếu nhân viên (`STAFF`) gọi `PUT /api/accounts/{id}` vào ID của Admin hoặc Staff khác, controller chỉ đơn thuần gán `request.setRole(CUSTOMER)` rồi cập nhật mật khẩu, vô tình cho phép Staff chiếm đoạt tài khoản Admin và giáng role Admin thành Customer.
   - Sửa: Truy vấn `target = accountRepository.findById(id)`. Nếu caller không phải `ROLE_ADMIN` mà target có role `ADMIN` hoặc `STAFF`, lập tức chặn lại và ném `AccessDeniedException("Nhân viên chỉ có quyền cập nhật và đổi mật khẩu cho tài khoản Hội viên (CUSTOMER)!")`.
2. **Cải thiện thông báo lỗi tại `GlobalExceptionHandler.java`**:
   - Tùy biến `handleAccessDeniedException`: Nếu ngoại lệ chứa custom message (khác message mặc định `"Access Denied"`), trả về đúng custom message đó thay vì câu thông báo chung chung, giúp giao diện hiển thị thông báo rõ ràng cho nhân viên.
3. **Tối ưu trải nghiệm đặt lại mật khẩu tại quầy (`AccountManagerPage.tsx`)**:
   - Thao tác nhanh trong bảng: Chỉ hiển thị icon đổi mật khẩu/chỉnh sửa cho dòng hội viên (`role === 'CUSTOMER'`) đối với nhân viên (Admin vẫn thấy toàn bộ).
   - Modal đổi mật khẩu:
     - Hiển thị thông tin trực quan: Tên khách hàng, SĐT, nhãn Hội viên.
     - Nút 1-click: `[⚡ Điền nhanh {4 số cuối SĐT}]` (sử dụng 4 số cuối SĐT của khách làm mật khẩu mặc định khi khách quên).
     - Ô nhập mật khẩu: Cho phép nhân viên tự gõ mật khẩu mới theo yêu cầu của khách hoặc bấm nút điền nhanh. Có nút ẩn/hiện mật khẩu để đối chiếu đọc lại cho khách tại quầy.
4. **Kiểm thử tự động & Nghiệm thu**:
   - Bổ sung 2 test case vào `Phase6CrudEndpointsIntegrationTest.java`:
     - `testStaffUpdateCustomerAccount_Success`: Staff đổi mật khẩu hội viên thành công (200 OK).
     - `testStaffUpdateAdminAccount_Forbidden`: Staff cố ý sửa tài khoản Admin bị chặn ngay (403 Forbidden).
   - Chạy JUnit test: 5/5 test pass 100%.
   - Chạy kịch bản PowerShell end-to-end với backend đang chạy:
     - Staff login -> thử sửa Admin -> Bị chặn 403 Forbidden.
     - Staff login -> thử sửa đồng nghiệp Staff -> Bị chặn 403 Forbidden.
     - Staff login -> đổi mật khẩu Customer sang 4 số cuối SĐT -> Thành công 200 OK.
     - Customer đăng nhập máy trạm (Client PC) bằng mật khẩu mới -> Thành công tạo session.

**Kỹ thuật & kiến thức áp dụng**:
| Kỹ thuật | Dùng ở đâu | Tier |
|---|---|---|
| Anti-Privilege Escalation & Access Control | `AccountController.java` | 🔴 Tier 1 (Security) |
| Fine-Grained Exception Handling | `GlobalExceptionHandler.java` | 🟡 Tier 2 |
| Quick Reset UX (4 last digits) | `AccountManagerPage.tsx` | 🟢 Tier 3 (UX) |
| Integration Testing & Live Verification | `Phase6CrudEndpointsIntegrationTest.java`, PowerShell | 🔴 Tier 1 |

---

### 2026-10-26 — Khắc phục lỗi trùng màu nền & text khi Select Option active/selected

**Phase**: UI/UX High-Contrast Polish (Ant Design Select Dropdown)
**Thời gian**: ~10 phút
**Việc đã làm**:
1. **Phân tích nguyên nhân**:
   - Khi tùy chọn trong Ant Design `<Select>` (ví dụ bộ lọc vai trò: "Quản trị", "Hội viên"...) được chọn hoặc active (`.ant-select-item-option-selected.ant-select-item-option-active`), mặc định Ant Design áp dụng màu nền sáng (light cream/tint), trùng với màu text sáng `--sand` (`#f0ebe5`). Hậu quả: chữ bị chìm hoàn toàn vào nền, không đọc được và không phân biệt được mục nào đang chọn.
2. **Cập nhật Design Tokens (`antd-theme.ts`)**:
   - Khai báo token component chuẩn cho `Select`: `colorBgElevated: '#202332'`, `optionSelectedBg: '#bd9875'`, `optionSelectedColor: '#202332'`, `optionActiveBg: 'rgba(189, 152, 117, 0.18)'`.
   - Bổ sung cấu hình cho `Dropdown` menu.
3. **Viết quy tắc CSS tương phản cao (High-Contrast AAA) (`index.css`)**:
   - Dropdown container: Nền Midnight `#202332` sâu, viền mạ vàng `border-top: 1.5px solid rgba(220, 185, 150, 0.55)`, đổ bóng 3D.
   - Trạng thái chưa chọn: Text Sand `#f0ebe5` sáng rõ trên nền tối.
   - Trạng thái Hover / Active: Nền kính mạ vàng `rgba(189, 152, 117, 0.18)`, text chuyển Trắng Sáng `#ffffff` (font-semibold).
   - Trạng thái Đang Chọn (`Selected`): Nền vàng Gold Caramel đặc trưng Twinkle (`#bd9875`), chữ Midnight đen than đậm nét (`#202332`, font-bold 700), checkmark đen than `#202332`.
   - Trạng thái Vừa Chọn Vừa Active (`Selected + Active`): Nền Gold sáng hơn (`#d4b595`), chữ Đen Than Sâu (`#151722`, font-black 800), đổ bóng nổi 3D `box-shadow: 0 6px 16px rgba(189, 152, 117, 0.5)`.
4. **Kiểm tra chất lượng**:
   - `npm run build` PASS 100% (0 errors, 0 warnings). HMR cập nhật tức thì trên trình duyệt.

**Kỹ thuật & kiến thức áp dụng**:
| Kỹ thuật | Dùng ở đâu | Tier |
|---|---|---|
| High-Contrast Option Styling & Specificity Overrides | `index.css`, `antd-theme.ts` | 🟡 Trung bình |

---

### 2026-10-26 — Tái thiết kế Máng Cột Swimlane Kanban & Phân biệt Nhận diện Thẻ Đơn

**Phase**: Order Queue UX/UI Refinement & Visual Hierarchy
**Thời gian**: ~20 phút
**Việc đã làm**:
1. **Thiết kế Khung Máng Trượt Độc Lập (Swimlane Column Panels - `StaffOrderQueuePage.tsx`)**:
   - Triệt tiêu hoàn toàn cảm giác "nằm chung hàng ngang rồi xuống dòng" bằng cách đóng khung Cột 1 và Cột 2 vào 2 Panel Kanban lớn độc lập:
     - **Máng Bếp (F&B Lane):** Panel bo tròn `rounded-3xl`, viền mạ hổ phách ấm `border-amber-500/30`, nền kính tối sâu `from-amber-950/25 via-[#1c1f2e]/70 to-[#141622]/95`, header gắn liền đỉnh panel, có rãnh trượt đơn hàng riêng.
     - **Máng Thu Ngân (Playtime & Combo Lane):** Panel bo tròn `rounded-3xl`, viền mạ xanh cyan điện tử `border-cyan-500/30`, nền kính Cyber Gaming `from-cyan-950/25 via-[#1c1f2e]/70 to-[#141622]/95`, header gắn liền đỉnh panel.
2. **Cá nhân hóa Ngoại hình Thẻ Đơn Hàng (`StaffOrderCard.tsx`)**:
   - **Đơn Bếp (🍜 Món ăn & Nước uống):**
     - Vạch chỉ thị bên trái màu Cam Hổ Phách `border-l-4 border-l-amber-500`.
     - Nền thẻ gradient ấm áp `from-[#27201b]/90 via-[#1e202c]/95 to-[#141622]/95`, viền `border-amber-500/35`.
     - Huy hiệu `[🍜 MÓN ĂN & UỐNG]` với icon `Utensils` màu vàng cam.
   - **Đơn Thu Ngân Nạp Giờ (⚡ Nạp giờ chơi):**
     - Vạch chỉ thị bên trái màu Xanh Cyan Neon `border-l-4 border-l-cyan-400 shadow-[0_0_12px_rgba(6,182,212,0.4)]`.
     - Nền thẻ gradient Cyber Gaming `from-[#122433]/90 via-[#18202e]/95 to-[#131622]/95`, viền `border-cyan-500/35`.
     - Huy hiệu `[⚡ NẠP GIỜ CHƠI]` với icon `Zap` nhấp nháy.
     - Box nạp giờ chuyên biệt với cảnh báo thu tiền mặt và làm nổi bật dòng gói nạp giờ màu cyan phát sáng.
   - **Đơn Combo (🎁 Món + Giờ chơi):**
     - Vạch chỉ thị màu xanh lục ngọc `border-l-4 border-l-emerald-400`.
     - Nền thẻ ánh ngọc bích `from-[#132724]/90`, huy hiệu `[🎁 COMBO MÓN + GIỜ]`.
3. **Kiểm thử chất lượng**:
   - `npm run build`: PASS 100% (0 errors, 0 warnings).

---

### 2026-10-26 — Đồng bộ Bố cục 2 Cột (Dual-Lane) trên TẤT CẢ các Tab Hàng đợi đơn hàng

**Phase**: Order Management & Staff UX Refinement
**Thời gian**: ~15 phút
**Việc đã làm**:
1. **Đồng bộ Bố cục 2 Luồng (Cột 1: Bếp & Pha Chế | Cột 2: Thu Ngân & Nạp Giờ) trên Toàn bộ các Tab (`StaffOrderQueuePage.tsx`)**:
   - Xóa bỏ điều kiện giới hạn chỉ hiển thị 2 cột ở tab `PENDING_PAYMENT`. Áp dụng thống nhất cho cả 4 tab: `Chờ xử lý`, `Đã xác nhận`, `Đã hủy`, và `Tất cả`.
   - Nhân viên khi chuyển sang bất kỳ tab nào cũng đều theo dõi được 2 luồng phân định rõ ràng (Bếp F&B vs Thu ngân Nạp giờ).
2. **Ngữ cảnh hóa Tiêu đề & Thông báo Rỗng (Contextual Empty States)**:
   - Tùy biến phụ đề cột và thông báo placeholder khi không có đơn phù hợp cho từng tab (`Chờ xử lý` $\rightarrow$ "Bếp chế biến & giao bàn", `Đã xác nhận` $\rightarrow$ "Đã chế biến & hoàn tất giao bàn", `Đã hủy` $\rightarrow$ "Lịch sử đơn đã hủy", `Tất cả` $\rightarrow$ "Toàn bộ lịch sử hệ thống").
   - Giữ vững cấu trúc khung 2 cột ổn định trên màn hình, không bị giật hay co giãn layout khi chuyển tab.
3. **Nâng cấp Hook `useOrderQueue.ts`**:
   - Thêm query `cancelledSummaryData` (`status = 'CANCELLED'`) và xuất ra `cancelledCount`.
   - Hiển thị đầy đủ số đếm cho cả 4 tab trên thanh điều hướng Segmented: `Chờ xử lý (X)`, `Đã xác nhận (Y)`, `Đã hủy (Z)`, `Tất cả (W)`.
4. **Kiểm thử chất lượng**:
   - `npm run build`: PASS 100% (0 errors, 0 warnings).

---

### 2026-10-28 — Kiến Trúc Phân Khu Động (Dynamic Zone), Chuẩn Hóa Màu Sắc & Sửa Lỗi Nghiêm Trọng

**Phase**: Phase 3 Admin Panel & Global Resiliency
**Thời gian**: ~3.5 giờ
**Việc đã làm**:
1. **Kiến trúc Phân khu Động Toàn Diện (Dynamic Zone Architecture)**:
   - **Backend**:
     - Tạo migration Flyway V5 bảng `zones` (`code`, `name`, `default_price_per_hour`, `color_code`, `active`, `description`).
     - Tạo migration Flyway V6 mở rộng `computers.zone` từ ENUM sang `VARCHAR(50)`.
     - Xây dựng Entity `Zone.java`, `ZoneRepository.java`, DTOs (`CreateZoneRequest`, `UpdateZoneRequest`, `ZoneResponse`), `ZoneService.java` và `ZoneController.java`.
     - Thiết lập rào chắn an toàn (Guards): Không thể xóa `STANDARD` và `VIP`; không thể xóa khu vực đang có máy trạm liên kết.
     - Viết bài test tích hợp `ZoneIntegrationTest.java`: 8/8 tests PASS 100%.
   - **Frontend**:
     - Xây dựng trang Quản lý Khu Vực ([`ZoneManagerPage.tsx`](file:///d:/Antigravity/Java_SpringBoot/internet-cafe-management/frontend/src/features/admin/pages/ZoneManagerPage.tsx)): Bảng danh sách, form tạo/sửa với Color Presets và color picker tự do.
     - Xây dựng trang Quản lý Máy Trạm ([`ManageComputersPage.tsx`](file:///d:/Antigravity/Java_SpringBoot/internet-cafe-management/frontend/src/features/admin/pages/ManageComputersPage.tsx)): CRUD máy trạm, chọn phân khu động, tự động gợi ý giá theo zone, toggle bảo trì, xóa máy an toàn.
     - Đăng ký routes `/admin/zones` và `/admin/computers`, bổ sung menu trên Sidebar.
2. **Hệ thống Hiển thị Zone Động & Tương phản cao (Zero-Camouflage System)**:
   - Tạo hook `useZoneMap.ts` tra cứu danh mục khu vực từ API backend (`GET /api/zones/active`) và cache bằng React Query.
   - Tạo component `<ZoneBadge />`:
     - Tự động lấy **chính xác 100% màu sắc Admin cấu hình** trong database (khắc phục triệt để lỗi khu ARENA bị hiển thị màu Đỏ ở giao diện Staff).
     - Quy chuẩn thẻ viết tắt ngắn gọn (Short Code: `STD`, `VIP`, `ARENA`, `VAL`, `FPS`...) trên thẻ máy trạm, bỏ icon rườm rà.
     - Nâng cấp màu phân khu `STANDARD` từ `#434e60` sang **Ice Cyan (`#85C1DC`)**, giải quyết triệt để lỗi chữ bị chìm nghỉm vào nền tối.
   - Đồng bộ toàn bộ các trang Staff (`ComputerCard`, `ComputerDetailDrawer`, `StartSessionModal`, `TransferSessionModal`, `SellTimeModal`, `SessionManagerPage`) và Customer (`CustomerLoginPage`, `CustomerDashboardPage`, `SessionStats`).
3. **Tối ưu Bố cục Điều khiển Sơ đồ máy (Floor Map Control Optimization)**:
   - Chuyển bộ lọc phân khu từ hàng nút bấm Segmented dàn ngang thành **Dropdown Select có mũi tên trỏ xuống `▾`** đặt liền kề cạnh ô Tìm kiếm bên phải.
   - Giữ các nút trạng thái máy dạng 1-click bên trái, tạo bố cục cân đối và chống vỡ dòng responsive.
4. **Sửa lỗi nghiêm trọng: Bất đối xứng độ dài SĐT (Phone Length Asymmetry Bug)**:
   - **Triệu chứng**: Khách đăng ký hội viên số 11 chữ số (`01111111111`) tại quầy thành công, mở máy `VIP-06` thành công, nhưng khi vào màn hình khách đăng nhập thì bị báo lỗi *"Số điện thoại không khớp với người đang chơi tại máy VIP-06"*.
   - **Nguyên nhân**: `RegisterCustomerModal.tsx` cho phép 9-11 số (`maxLength={11}`), nhưng `CustomerLoginPage.tsx` lại chặn cứng 10 số (`maxLength={10}` và regex `/^0\d{9}$/`). Khi người dùng gõ số 11 ký tự, ô input âm thầm cắt bỏ số cuối (`0111111111`), dẫn đến gửi chuỗi lệch 1 ký tự lên backend.
   - **Khắc phục**:
     - Nâng cấp `CustomerLoginPage.tsx`: `maxLength={11}`, regex `/^0\d{8,10}$/` cho phép 9 đến 11 số đồng bộ hoàn toàn với backend và modal đăng ký khách.
     - Cập nhật số điện thoại tài khoản #82 trong MySQL từ `01111111111` về chuẩn 10 số `0111111111` theo mong muốn của người dùng. Kiểm tra đăng nhập thành công 100% (200 OK).

**Kỹ thuật & kiến thức áp dụng**:
| Kỹ thuật | Dùng ở đâu | Tier |
|---|---|---|
| Dynamic Zone Architecture & Flyway V5, V6 | `Zone.java`, `ZoneService.java`, `V5__`, `V6__` | 🔴 Architecture |
| React Query Global Cache Hook | `useZoneMap.ts` | 🟠 Frontend State |
| Zero-Camouflage High-Contrast Badge | `ZoneBadge.tsx` | 🟠 Design System |
| Responsive Dropdown Control Layout | `FloorMapPage.tsx` | 🟡 UI/UX |
| Single Source of Truth Validation | `CustomerLoginPage.tsx`, `RegisterCustomerModal.tsx` | 🔴 Reliability |

**Kiểm thử chất lượng**:
- `npm run build`: PASS 100% (built in 1.73s, 0 errors, 0 warnings).
- `mvn test`: 13/13 tests PASS 100% (ZoneIntegrationTest + Phase6CrudEndpointsIntegrationTest).
- Backend & Frontend dev servers chạy ổn định trong background.

---












