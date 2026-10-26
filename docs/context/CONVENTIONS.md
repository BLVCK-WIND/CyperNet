# 🏛️ CyberNet Architecture & Coding Conventions

> **Mục đích:** File này là "Kim chỉ nam" cho AI và Dev. Mọi đoạn code được sinh ra BẮT BUỘC phải tuân thủ 100% các quy ước dưới đây để đảm bảo tính đồng nhất và tối ưu chi phí token.

---

## 1. Tech Stack & Environment
- **Language & Runtime:** Java 17
- **Framework:** Spring Boot, Spring Data JPA, Spring Web MVC
- **Database:** MySQL
- **Boilerplate:** Lombok (`@Data`, `@NoArgsConstructor`, `@AllArgsConstructor`, `@Builder` khi cần)
- **Base Package:** `com.cybernet.internet_cafe_management`

---

## 2. Layered Architecture (Phân tầng nghiêm ngặt)
- `controller/`: Chỉ nhận HTTP Request, gọi Service, trả về `ResponseEntity<ResponseDTO>`. **Tuyệt đối không chứa logic nghiệp vụ, không gọi Repository trực tiếp.**
- `service/`: Nơi xử lý 100% business logic, validation nghiệp vụ, chuyển đổi Entity ↔ DTO.
- `repository/`: Kế thừa `JpaRepository`, định nghĩa custom query (JPQL, Derived Queries).
- `entity/`: Chỉ ánh xạ DB tables. Không serialize Entity ra API.
- `dto/`:
  - `dto/request/`: Validate đầu vào bằng Java/Bean validation (`@NotBlank`, `@NotNull`, `@Min`, v.v.).
  - `dto/response/`: Dữ liệu trả về cho client. Đóng gói method static `fromEntity(...)` để map null-safe.
- `exception/`: Ném Runtime Exception (`ResourceNotFoundException`, `IllegalStateException`), tập trung xử lý tại `GlobalExceptionHandler`.

---

## 3. Quy tắc JPA & Database Sống còn
1. **Kiểu dữ liệu:**
   - Tiền tệ (`price`, `totalAmount`, `unitPrice`): Luôn dùng `BigDecimal`. Cấm dùng `float`/`double`.
   - Primary Key: Dùng `Long` (wrapper).
   - Số phút (`remainingMinutes`, `minutes`): Dùng `int` (primitive) vì không bao giờ `null`.
   - Thời gian: Dùng `java.time.LocalDateTime`.
2. **Quan hệ (Relationships):**
   - Mọi quan hệ `@ManyToOne` **bắt buộc phải có `fetch = FetchType.LAZY`** (tránh N+1 problem).
   - `@OneToMany` chỉ dùng khi quan hệ ruột thịt (VD: `Order` ➔ `OrderItem` với `cascade = CascadeType.ALL, orphanRemoval = true`).
3. **Quản lý Transaction:**
   - Đặt `@Transactional` trên mọi method Service có từ 2 thao tác ghi vào DB trở lên (Update Account + Create Transaction, Update Session + Update Computer).
   - Sử dụng Locking khi xử lý tranh chấp tài nguyên (ví dụ: đặt máy, trừ giờ đồng thời).
4. **Audit Fields:**
   - Dùng `@CreationTimestamp` kết hợp `updatable = false` cho `createdAt`.

---

## 4. RESTful API Standards
- `POST`: Tạo mới tài nguyên $\rightarrow$ Trả về `201 Created` (kèm body).
- `GET`: Lấy dữ liệu $\rightarrow$ Trả về `200 OK`.
- `PATCH`: Cập nhật một phần trạng thái (confirm, extend, cancel) $\rightarrow$ Trả về `200 OK`.
- `PUT`: Cập nhật toàn bộ $\rightarrow$ Trả về `200 OK`.
- `DELETE`: Xóa tài nguyên $\rightarrow$ Trả về `204 No Content`.
- URL theo danh từ số nhiều: `/api/orders`, `/api/computers`, `/api/sessions`.

---

## 5. NGUYÊN TẮC SINH CODE DÀNH CHO AI (QUAN TRỌNG NHẤT)
1. **Quy tắc Diff-Only:** Nếu file đã tồn tại (như `SessionService.java`), **KHÔNG ĐƯỢC VIẾT LẠI CẢ FILE**. Chỉ đưa ra hàm mới, block code thay đổi, hoặc định dạng diff.
2. **Giải thích tư duy & Điểm cần review:** Cuối mỗi câu trả lời, AI phải cung cấp:
   - **Tóm tắt thiết kế:** 2–3 gạch đầu dòng giải thích tại sao lại viết như vậy.
   - **Gợi ý Review cho User:** Nêu 1–2 câu hỏi hoặc điểm then chốt cần chú ý (edge cases, concurrency, transaction).
3. **Không tạo dependencies thừa:** Chỉ dùng các thư viện đã khai báo trong `pom.xml`.

---

## 6. Frontend UI/UX & Design System Conventions (Bắt buộc cho React 19 + Vite)
1. **Bảng màu Twinkle gốc:**
   - Nền chính: `#202332` (Midnight than sâu).
   - Màu chủ đạo: `#bd9875` (Vàng Gold Caramel Twinkle).
   - Bề mặt thẻ: `#434e60` (Xanh Slate/Denim trầm).
   - Màu phụ & viền: `#8b9a9f` (Khói bạc Mist).
2. **Chuẩn Thẻ Thống Kê Nổi Liquid Glass 3D:**
   - Mọi khối chỉ số KPI/Telemetry bắt buộc dùng 4 class Liquid Glass: `.liquid-glass-sunset`, `.liquid-glass-emerald`, `.liquid-glass-cyan`, `.liquid-glass-amber`.
   - Có viền phản xạ khúc xạ 3D, vệt lóa sáng radial góc trên trái, chân thẻ frosted pill và `cursor-default`.
3. **Chuẩn Bố Cục Máng Cột Swimlane (Kanban Panels):**
   - Không thả các thẻ lơ lửng trên nền trang. Bắt buộc có khung panel máng cột (`rounded-3xl border shadow-xl`) bao quanh từng cột, header tích hợp trên đỉnh, rãnh trượt thẻ bên trong có `min-h-[280px]`.
4. **Chuẩn Nhận Diện Thẻ Đơn Hàng (Visual Card Identity):**
   - Vạch chỉ thị bên trái `border-l-4`: Cam Hổ Phách cho F&B (`border-l-amber-500`), Xanh Cyan Neon cho Nạp Giờ (`border-l-cyan-400`), Xanh Ngọc Bích cho Combo (`border-l-emerald-400`).
   - Nền thẻ gradient riêng biệt phản ánh đúng tính chất nghiệp vụ.
5. **Chuẩn Tương Phản Cao Cho Form Controls:**
   - `Select` & `Dropdown`: Selected = Nền Gold `#bd9875` + Chữ Midnight `#202332` (font-bold); Active/Hover = Nền kính vàng mờ + Chữ Trắng Sáng `#ffffff`.
6. **Chuẩn Trình Bày & Clickable Links:**
   - Mọi đường dẫn file và code symbol trong phản hồi bắt buộc dùng link clickable định dạng `file:///path/to/file` với dấu gạch chéo `/`.
7. **Quy Tắc Tối Thượng:**
   - **Luôn đưa ra kế hoạch chi tiết trước, chờ người dùng duyệt ("OK") rồi mới thực hiện từng bước.** Không tự ý sửa code khi chưa được phê duyệt.
