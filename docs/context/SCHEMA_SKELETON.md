# 🗄️ CyberNet Schema & Entity Skeleton

> **Mục đích:** File tóm tắt cấu trúc 7 Entity cốt lõi của hệ thống CyberNet. AI chỉ cần đọc file này để biết chính xác field, type và quan hệ mà không cần đọc từng file Java Entity.

---

## 1. Entities & Fields Definition

### 1. `Account` (`accounts`)
* `id`: `Long` (PK, Auto Increment)
* `phone`: `String` (Unique, Not Null) — SĐT đăng nhập
* `name`: `String` (Not Null)
* `passwordHash`: `String` (Not Null) — BCrypt hash
* `role`: `Role` (Enum: `CUSTOMER`, `STAFF`, `ADMIN`, default: `CUSTOMER`)
* `remainingMinutes`: `int` (Not Null, default: 0) — Số phút chơi còn lại (chỉ dùng cho CUSTOMER)
* `createdAt`: `LocalDateTime` (Auto, Immutable)

### 2. `Computer` (`computers`)
* `id`: `Long` (PK, Auto Increment)
* `name`: `String` (Not Null)
* `code`: `String` (Unique, Not Null) — Mã máy (VD: "VIP-01", "PC-05")
* `zone`: `Zone` (Enum: `STANDARD`, `VIP`, default: `STANDARD`)
* `status`: `Status` (Enum: `AVAILABLE`, `IN_USE`, `MAINTENANCE`, default: `AVAILABLE`)
* `pricePerHour`: `BigDecimal` (Not Null)
* `ipAddress`: `String` (Unique, Not Null)

### 3. `Session` (`sessions`)
* `id`: `Long` (PK, Auto Increment)
* `computer`: `Computer` (FK: `computer_id`, `@ManyToOne(LAZY)`, Not Null)
* `account`: `Account` (FK: `account_id`, `@ManyToOne(LAZY)`, Not Null)
* `startedAt`: `LocalDateTime` (Not Null) — Thời điểm mở máy
* `expiresAt`: `LocalDateTime` (Not Null) — Thời điểm dự kiến hết giờ
* `endedAt`: `LocalDateTime` (Nullable) — Thời điểm thực tế kết thúc phiên
* `status`: `Status` (Enum: `ACTIVE`, `ENDED`, default: `ACTIVE`)

### 4. `Item` (`items`)
* `id`: `Long` (PK, Auto Increment)
* `name`: `String` (Unique, Not Null)
* `price`: `BigDecimal` (Not Null)
* `available`: `boolean` (Not Null, default: true) — Còn hàng/Hết hàng
* `type`: `Type` (Enum: `DRINK`, `FOOD`, `SERVICE`, `PLAYTIME`, Not Null)

### 5. `Order` (`orders`)
* `id`: `Long` (PK, Auto Increment)
* `session`: `Session` (FK: `session_id`, `@ManyToOne(LAZY)`, Not Null)
* `totalAmount`: `BigDecimal` (Not Null)
* `paymentMethod`: `PaymentMethod` (Enum: `QR`, `CASH`, Not Null)
* `status`: `Status` (Enum: `PENDING_PAYMENT`, `CONFIRMED`, `CANCELLED`, default: `PENDING_PAYMENT`)
* `confirmedByStaff`: `Account` (FK: `confirmed_by_staff_id`, `@ManyToOne(LAZY)`, Nullable)
* `confirmedAt`: `LocalDateTime` (Nullable)
* `createdAt`: `LocalDateTime` (Auto, Immutable)
* `orderItems`: `List<OrderItem>` (`@OneToMany(cascade=ALL, orphanRemoval=true)`)

### 6. `OrderItem` (`order_items`)
* `id`: `Long` (PK, Auto Increment)
* `order`: `Order` (FK: `order_id`, `@ManyToOne(LAZY)`, Not Null)
* `item`: `Item` (FK: `item_id`, `@ManyToOne(LAZY)`, Not Null)
* `quantity`: `int` (Not Null)
* `unitPrice`: `BigDecimal` (Not Null) — Snapshot giá tại thời điểm đặt món
* `subtotal`: `BigDecimal` (Not Null) — `quantity * unitPrice`

### 7. `TimePurchase` (`time_purchases`)
* `id`: `Long` (PK, Auto Increment)
* `account`: `Account` (FK: `account_id`, `@ManyToOne(LAZY)`, Not Null)
* `minutes`: `int` (Not Null) — Số phút mua
* `amount`: `BigDecimal` (Not Null) — Số tiền thanh toán
* `paymentMethod`: `PaymentMethod` (Enum: `QR`, `CASH`, Not Null)
* `status`: `Status` (Enum: `PENDING_PAYMENT`, `CONFIRMED`, `CANCELLED`, default: `PENDING_PAYMENT`)
* `confirmedByStaff`: `Account` (FK: `confirmed_by_staff_id`, `@ManyToOne(LAZY)`, Nullable)
* `confirmedAt`: `LocalDateTime` (Nullable)
* `createdAt`: `LocalDateTime` (Auto, Immutable)

---

## 2. Relationships Diagram (Rút gọn)

```
Account (1) ──── (N) Session (N) ──── (1) Computer
   │                     │
   │ (1)                 │ (1)
   ▼                     ▼
TimePurchase (N)       Order (1) ──── (N) OrderItem (N) ──── (1) Item
```
