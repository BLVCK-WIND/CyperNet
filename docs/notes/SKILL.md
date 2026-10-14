# Kỹ thuật dự án CyberNet dạy cho em — Xếp theo mức độ ưu tiên

## Cách đọc bảng

| Ký hiệu | Ý nghĩa |
|---|---|
| 🔴 **Tier 1** | **Bắt buộc phải giỏi** — 100% nhà tuyển dụng hỏi, 100% dự án cần |
| 🟠 **Tier 2** | **Điểm khác biệt** — làm em nổi bật hơn 80% ứng viên cùng level |
| 🟡 **Tier 3** | **Production-level** — chứng minh em biết đưa sản phẩm lên thực tế |
| 🟢 **Tier 4** | **Bonus** — có thì tốt, chưa có cũng không sao ở level fresher |

---

## 🔴 Tier 1 — Nền tảng bắt buộc (100% dự án đều cần)

### 1. Kiến trúc phân lớp (Layered Architecture)
| | |
|---|---|
| **Là gì** | Controller → Service → Repository → Database. Tách rõ trách nhiệm từng lớp |
| **Dùng ở đâu trong project** | Toàn bộ — mỗi entity đều đi qua 3 lớp này |
| **Vì sao quan trọng** | Đây là cách tổ chức code **chuẩn nhất** trong enterprise Java. Không biết cái này = không đi làm được |
| **Phỏng vấn hay hỏi** | "Giải thích kiến trúc 3 lớp", "Controller có nên chứa business logic không?", "Tại sao cần Service layer?" |

### 2. Spring Data JPA / Hibernate (ORM)
| | |
|---|---|
| **Là gì** | Ánh xạ Java object ↔ database table. Viết code Java thay vì viết SQL tay |
| **Dùng ở đâu** | Entity mapping, relationship (1-N, N-1), query methods, JPQL |
| **Vì sao quan trọng** | 90%+ dự án Java dùng JPA/Hibernate. Đây là kỹ năng **số 1** mà nhà tuyển dụng tìm ở backend dev |
| **Phỏng vấn hay hỏi** | "FetchType.LAZY vs EAGER?", "N+1 query là gì?", "@ManyToOne vs @OneToMany?", "cascade và orphanRemoval?" |
| **Áp dụng cụ thể** | `Account ↔ Session`, `Order ↔ OrderItem`, `Session ↔ Computer` |

### 3. RESTful API Design
| | |
|---|---|
| **Là gì** | Thiết kế API theo chuẩn REST: đúng HTTP method, đúng status code, đúng URL pattern |
| **Dùng ở đâu** | Toàn bộ controller — CRUD + business endpoints |
| **Vì sao quan trọng** | Mọi ứng dụng web/mobile đều giao tiếp qua REST API. Thiết kế API xấu → frontend/mobile dev ghét |
| **Phỏng vấn hay hỏi** | "POST vs PUT vs PATCH?", "Khi nào trả 201 vs 200?", "Thiết kế API cho chức năng X?" |
| **Áp dụng cụ thể** | `POST /api/orders` (tạo đơn), `PATCH /api/orders/{id}/confirm` (xác nhận), `GET /api/computers?zone=VIP&status=AVAILABLE` |

### 4. DTO Pattern (Data Transfer Object)
| | |
|---|---|
| **Là gì** | Tách Entity (dùng nội bộ) và DTO (gửi ra ngoài). Không bao giờ trả Entity trực tiếp qua API |
| **Dùng ở đâu** | Request DTO (nhận data), Response DTO (trả data) cho mọi endpoint |
| **Vì sao quan trọng** | Bảo mật (không lộ `passwordHash`), linh hoạt (API shape ≠ DB shape), tránh circular reference |
| **Phỏng vấn hay hỏi** | "Tại sao không trả Entity trực tiếp?", "Request DTO và Response DTO khác nhau sao?" |
| **Áp dụng cụ thể** | `CreateOrderRequest` (nhận sessionId + list items), `OrderResponse` (trả đơn kèm chi tiết) — khác hoàn toàn cấu trúc Entity |

### 5. Exception Handling
| | |
|---|---|
| **Là gì** | Xử lý lỗi tập trung bằng `@ControllerAdvice` + `@ExceptionHandler`, custom exception |
| **Dùng ở đâu** | `ResourceNotFoundException` (404), `BusinessRuleException` (400), `InsufficientTimeException`... |
| **Vì sao quan trọng** | API trả lỗi rõ ràng = frontend dễ xử lý, user hiểu được vấn đề. API trả lỗi lộn xộn = bug khắp nơi |
| **Phỏng vấn hay hỏi** | "Xử lý exception trong Spring Boot thế nào?", "Checked vs Unchecked exception?" |
| **Áp dụng cụ thể** | Khách hết giờ mà đăng nhập → `InsufficientTimeException` → API trả 400 + message rõ ràng |

### 6. Bean Validation
| | |
|---|---|
| **Là gì** | Validate input tự động bằng annotation: `@NotNull`, `@NotBlank`, `@Min`, `@Pattern`, `@Valid` |
| **Dùng ở đâu** | Trên DTO: validate SĐT đúng format, quantity > 0, name không trống... |
| **Vì sao quan trọng** | Không validate = SQL injection, data rác, crash. Validate bằng annotation = gọn, dễ maintain |
| **Áp dụng cụ thể** | `@Pattern(regexp = "^0\\d{9}$")` cho SĐT, `@Min(1)` cho quantity |

### 7. Transaction Management
| | |
|---|---|
| **Là gì** | `@Transactional` — đảm bảo 1 loạt thao tác DB hoặc thành công hết, hoặc rollback hết |
| **Dùng ở đâu** | Mọi use-case phức tạp |
| **Vì sao quan trọng** | Không có transaction = data inconsistency. VD: trừ giờ thành công nhưng tạo session fail → khách mất giờ |
| **Phỏng vấn hay hỏi** | "ACID là gì?", "@Transactional hoạt động thế nào?", "Propagation REQUIRED vs REQUIRES_NEW?" |
| **Áp dụng cụ thể** | UC "xác nhận đơn": update Order status + cộng giờ Account + dời expiresAt Session → phải atomic |

### 8. Git (Version Control)
| | |
|---|---|
| **Là gì** | Quản lý source code, lịch sử thay đổi, branching |
| **Vì sao quan trọng** | Không biết Git = không đi làm được. Mọi team đều dùng |
| **Cần biết** | `commit`, `branch`, `merge`, `pull request`, `.gitignore`, commit message conventions |

---

## 🟠 Tier 2 — Điểm khác biệt (nổi bật hơn 80% ứng viên)

### 9. Spring Security + JWT Authentication
| | |
|---|---|
| **Là gì** | Xác thực (ai đang dùng?) + phân quyền (được làm gì?) bằng JWT token |
| **Dùng ở đâu** | Login NV/Admin → nhận JWT → gửi token mỗi request. Phân quyền CUSTOMER/STAFF/ADMIN |
| **Vì sao nổi bật** | 80% fresher chưa bao giờ implement security thật. Em biết JWT = vượt xa đối thủ |
| **Phỏng vấn hay hỏi** | "Session-based vs Token-based auth?", "JWT gồm mấy phần?", "Access token vs Refresh token?", "401 vs 403?" |
| **Áp dụng cụ thể** | NV đăng nhập → JWT → gọi API xác nhận đơn. Khách quét QR → không cần JWT (chỉ cần SĐT + check phiên) |

### 10. Unit Test + Integration Test
| | |
|---|---|
| **Là gì** | Viết code kiểm tra code. Unit test (test 1 method độc lập), Integration test (test full flow) |
| **Dùng ở đâu** | Test service layer (mock repository), test API endpoint (MockMvc), test full flow (H2 DB) |
| **Vì sao nổi bật** | **90% fresher không viết test**. CV có test coverage = nhà tuyển dụng đánh giá cao ngay |
| **Phỏng vấn hay hỏi** | "Unit test vs Integration test?", "Mockito dùng khi nào?", "Code coverage bao nhiêu là đủ?" |
| **Áp dụng cụ thể** | Test: "2 khách cùng đăng nhập 1 máy → chỉ 1 thành công", "confirm order có PLAYTIME → giờ được cộng đúng" |

### 11. Database Locking (Pessimistic / Optimistic)
| | |
|---|---|
| **Là gì** | Khoá record trong DB để tránh 2 thread cùng sửa 1 dữ liệu |
| **Dùng ở đâu** | 2 khách cùng chọn 1 máy, trừ giờ đồng thời |
| **Vì sao nổi bật** | Đây là vấn đề **thực tế 100%** mà rất ít fresher biết. Phỏng vấn senior hay hỏi, fresher biết = ấn tượng mạnh |
| **Phỏng vấn hay hỏi** | "Race condition là gì?", "Pessimistic vs Optimistic locking?", "@Version dùng thế nào?" |
| **Áp dụng cụ thể** | `@Lock(PESSIMISTIC_WRITE)` khi query Computer để mở phiên → chỉ 1 khách lấy được máy |

### 12. State Management (Quản lý trạng thái)
| | |
|---|---|
| **Là gì** | Quản lý lifecycle của object: trạng thái nào → được chuyển sang trạng thái nào |
| **Dùng ở đâu** | Order: `PENDING → CONFIRMED / CANCELLED`. Session: `ACTIVE → ENDED`. Computer: `AVAILABLE ↔ IN_USE ↔ MAINTENANCE` |
| **Vì sao nổi bật** | Mọi hệ thống thực tế đều có state machine (đơn hàng, thanh toán, ticket...). Biết quản lý state = biết thiết kế hệ thống |
| **Phỏng vấn hay hỏi** | "Thiết kế trạng thái cho đơn hàng", "Làm sao đảm bảo không chuyển state sai?" |

### 13. Scheduled Tasks (@Scheduled)
| | |
|---|---|
| **Là gì** | Chạy tác vụ định kỳ tự động (mỗi phút, mỗi giờ...) |
| **Dùng ở đâu** | Tự động kết thúc phiên khi hết giờ, dọn dẹp order quá hạn |
| **Vì sao nổi bật** | Phổ biến trong production: gửi email, cleanup data, sync hệ thống. Fresher ít biết |

### 14. Pagination + Sorting + Filtering
| | |
|---|---|
| **Là gì** | Trả data theo trang, sắp xếp, lọc — thay vì trả hết 10,000 records |
| **Dùng ở đâu** | Danh sách máy, danh sách đơn hàng, lịch sử giao dịch |
| **Vì sao quan trọng** | Mọi API list đều cần. Không có pagination = app chết khi data lớn |
| **Áp dụng cụ thể** | `GET /api/orders?page=0&size=20&sort=createdAt,desc&status=PENDING` |

---

## 🟡 Tier 3 — Production-level (biết deploy = biết làm sản phẩm thật)

### 15. Docker + Docker Compose
| | |
|---|---|
| **Là gì** | Đóng gói app + DB + mọi thứ vào container, chạy ở đâu cũng giống nhau |
| **Vì sao quan trọng** | 90%+ công ty dùng Docker. "Máy tôi chạy được" không còn là lý do chấp nhận được |
| **Phỏng vấn hay hỏi** | "Docker image vs container?", "Dockerfile viết thế nào?", "docker-compose dùng khi nào?" |

### 16. Database Migration (Flyway)
| | |
|---|---|
| **Là gì** | Version control cho database schema. Mỗi thay đổi DB = 1 file migration, chạy tự động |
| **Vì sao quan trọng** | Production **không bao giờ** dùng `ddl-auto=update`. Flyway = cách chuyên nghiệp |
| **Phỏng vấn hay hỏi** | "Quản lý thay đổi DB trong production thế nào?" |

### 17. CI/CD (GitHub Actions)
| | |
|---|---|
| **Là gì** | Push code → tự động build → chạy test → deploy. Không cần làm tay |
| **Vì sao quan trọng** | Mọi team professional đều có CI/CD. Biết setup = chứng minh em hiểu quy trình phát triển phần mềm |

### 18. API Documentation (Swagger/OpenAPI)
| | |
|---|---|
| **Là gì** | Tự động sinh trang web mô tả tất cả API endpoints, request/response schema |
| **Vì sao quan trọng** | Frontend dev, QA, PM đều cần đọc API doc. Không có = team khó làm việc |

### 19. Logging (SLF4J + Logback)
| | |
|---|---|
| **Là gì** | Ghi lại mọi hoạt động của hệ thống: ai làm gì, lúc nào, kết quả thế nào |
| **Vì sao quan trọng** | Production có lỗi → xem log để debug. Không có log = mù hoàn toàn |

### 20. Environment Profiles (dev/prod)
| | |
|---|---|
| **Là gì** | Config khác nhau cho từng môi trường: dev (localhost, show SQL), prod (server thật, no SQL log) |
| **Vì sao quan trọng** | Chạy code trên máy dev ≠ chạy trên server production. Phải tách config |

---

## 🟢 Tier 4 — Bonus (có thì ấn tượng thêm)

### 21. Reporting & Aggregation Queries
| | |
|---|---|
| **Là gì** | Query tổng hợp: SUM doanh thu, COUNT đơn, GROUP BY ngày/tháng, TOP N |
| **Dùng ở đâu** | Báo cáo doanh thu, món bán chạy, top customer |
| **Kỹ thuật** | JPQL / Native Query / Spring Data Projections |

### 22. Caching (Spring Cache / Redis)
| | |
|---|---|
| **Là gì** | Lưu tạm kết quả query vào memory → lần sau không cần query DB |
| **Dùng ở đâu** | Cache danh sách Item (ít thay đổi), cache sơ đồ máy |

### 23. WebSocket (Real-time)
| | |
|---|---|
| **Là gì** | Giao tiếp 2 chiều real-time giữa server và client |
| **Dùng ở đâu** | Thông báo NV khi có đơn mới, cập nhật trạng thái máy real-time trên bảng theo dõi |

### 24. Rate Limiting
| | |
|---|---|
| **Là gì** | Giới hạn số request/giây từ 1 client → chống abuse, DDoS |
| **Dùng ở đâu** | API quét QR, API đăng nhập |

---

## Tổng kết — Nhìn nhanh

```
🔴 Tier 1 (BẮT BUỘC):     8 kỹ thuật — cái nào cũng hỏi khi phỏng vấn
🟠 Tier 2 (NỔI BẬT):      6 kỹ thuật — có = vượt 80% fresher
🟡 Tier 3 (PRODUCTION):    6 kỹ thuật — biết deploy = biết làm thật
🟢 Tier 4 (BONUS):         4 kỹ thuật — cherry on top
─────────────────────────────
TỔNG:                      24 kỹ thuật từ 1 dự án
```

> [!TIP]
> **Khi phỏng vấn**, nhà tuyển dụng không hỏi "em biết bao nhiêu kỹ thuật". Họ hỏi: **"Em đã dùng kỹ thuật này ở đâu, vì sao, gặp vấn đề gì, giải quyết thế nào?"** — Dự án CyberNet cho em câu trả lời thực tế cho từng kỹ thuật ở trên.

> [!IMPORTANT]
> **Thứ tự học trong project**: Tier 1 → Tier 2 → Tier 3 → Tier 4. **Không nhảy tier.** Tier 1 chưa vững mà nhảy sang JWT/Docker = xây nhà trên cát.
