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
