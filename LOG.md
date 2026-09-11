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
- Table name "orders" thay vì "order" vì "order" là từ khóa SQL.

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
