--------- INTERVIEW X------------
Question 1 : remainingMinutes nên dùng int hay Integer? (2 cái này khác nhau ở đâu? Trong trường hợp này nên dùng cái nào?)

                                int (primitive)	              Integer (wrapper)
Giá trị mặc định	                0	                            null
Có thể null?	                ❌ Không	                        ✅ Có
Trong DB	                    Cột NOT NULL	                Cột cho phép NULL

Trong trường hợp này: dùng int — vì remainingMinutes luôn có giá trị (mặc định = 0, nghĩa là "chưa mua giờ"). Không có lý do để nó là null.

Quy tắc nhớ: Nếu field luôn có giá trị → int. Nếu field có thể không có (chưa biết, chưa điền) → Integer.
Question 2: BigDecimal  so với double trong java

Trong Java, BigDecimal và double đều dùng để lưu số thực, nhưng cách chúng biểu diễn và tính toán rất khác nhau.

🔥 1. Khác nhau cơ bản
	                        double	                    BigDecimal
Kiểu	                Kiểu nguyên thủy	            Class
Độ chính xác	           Có thể sai số	             Độ chính xác rất cao
Tốc độ	                    ⚡ Nhanh	                    Chậm hơn
Bộ nhớ	                    Ít	                         Nhiều hơn
Tiền bạc	                ❌ Không nên	            ✅ Nên dùng
Tính toán khoa học	            ✅ Phù hợp	                Có thể dùng
Cú pháp	                    Đơn giản	                 Dài hơn

🔥 2. Khi nào dùng cái nào?

✅ Dùng double khi:
- Số không liên quan đến tiền
- Cần tốc độ xử lý cao
- Sai số nhỏ chấp nhận được

❌ Dùng BigDecimal khi:
- Liên quan đến tiền (tính tiền, hóa đơn, ngân hàng)
- Cần độ chính xác tuyệt đối
- Số có nhiều chữ số sau dấu phẩy
Question 3: enum có nên để trong entity không? 

Trả lời:
Cả 2 cách đều được hỗ trợ trong Java, nhưng dùng cách nào phụ thuộc vào phạm vi sử dụng (Scope):

1. Nên để bên trong Entity (Inner Enum):
- Khi enum đó CHỈ gắn liền duy nhất với Entity này, không có class/entity nào khác cần dùng đến.
- Ví dụ: `Account.Role` (CUSTOMER, STAFF, ADMIN) nếu chỉ dùng để phân quyền cho Account.
- Ưu điểm: Đóng gói gọn gàng, người đọc mở file Entity là thấy ngay toàn bộ định nghĩa.

2. Nên tách ra file riêng (Standalone Enum - Khuyên dùng trong dự án thực tế):
- Khi enum đó được dùng ở NHIỀU NƠI khác nhau: DTO Request, DTO Response, Service, Controller, hoặc Entity khác.
- Ví dụ: `OrderStatus`, `PaymentMethod` (Order dùng, DTO dùng, Controller query param cũng dùng). Nếu để lồng trong Entity thì ngoài DTO phải import kiểu `Order.Status` hoặc `TimePurchase.PaymentMethod` -> dễ bị phụ thuộc chéo vào Entity.
- Ưu điểm: Tách biệt rõ ràng (Decoupling), DTO không cần phụ thuộc vào Entity để lấy Enum.

=> Quy tắc thực tế: Nếu chỉ dùng nội bộ trong 1 Entity -> để bên trong. Nếu DTO, Service, Controller cần dùng chung -> nên tách file riêng (thường nằm ở package `entity`, `model`, hoặc `common/enums`).
Câu hỏi phỏng vấn — Ôn tập Phase 0:
1. Tại sao dùng FetchType.LAZY thay vì EAGER? Nếu dùng EAGER thì chuyện gì sẽ xảy ra khi query 100 Order?
    → Dùng EAGER → Khi query 100 Order → JPA sẽ JOIN với Account, Session, OrderItem → 100 Order x 3 table = 300 queries trong memory.
    Khi có 1000 Order → 3000 queries → JVM treo.
    => FetchType.LAZY → lazy loading → chỉ tải khi dùng thật → tránh N+1 problem.

2. cascade = CascadeType.ALL có rủi ro gì không? VD: nếu em xoá 1 Order thì chuyện gì xảy ra?
    → Rủi ro: khi xoá Order thì OrderItem cũng bị xoá theo.
    Nếu OrderOrderItem được dùng ở nơi khác → data mất.
    => Chỉ nên dùng cascade = CascadeType.ALL khi:
        - Con không thể tồn tại nếu thiếu cha
        - Con không dùng ở nơi khác
        - Con chỉ là "thuộc tính" của cha
    Trong trường hợp Order → OrderItem:
        - OrderItem có thể sống độc lập nếu Order bị xoá
        - OrderItem có thể được dùng ở nơi khác
    => Nên dùng cascade = CascadeType.REMOVE hoặc REMOVE.

3. Tại sao id dùng Long nhưng remainingMinutes dùng int? 
=> Vì id lúc ghi dữ liệu vào bảng thì chưa có giá trị, nên phải dùng Long. còn remainingMinutes bắt buộc phải có giá trị nhập vào trước khi lưu nên không được phép null -> dùng int
    
4. Tại sao createdAt có updatable = false nhưng confirmedAt thì không?
=>  Vì confirmAt là lúc nào chúng ta nhận được tiền của khách thì chúng ta mới bắt đầu cập nhật trường này. -> updatable = true thì mới cho phép cập nhật trường này sau khi insert trước đó ( null)
=> @CreationTimestamp chỉ gán 1 lần lúc INSERT

---

### Câu hỏi phỏng vấn — Ôn tập Phase 1 (Kiến trúc 3 lớp, DTO, Transaction):

5. Tại sao trong DB đã có `@Column(unique = true)` cho số điện thoại rồi, mà trong Service vẫn phải kiểm tra `existsByPhone`?
=> 
- Nếu không check bằng Java, khi DB nhận trùng lặp sẽ văng ra ngoại lệ `DataIntegrityViolationException` (mã lỗi 500 Internal Server Error). Khi đó, Client/Frontend chỉ nhận được thông báo lỗi chung chung là server bị lỗi.
- Khi ta chủ động check `existsByPhone` ở tầng Service: ta có thể quăng ra `IllegalArgumentException` kèm lời nhắn rõ ràng: "Số điện thoại này đã được đăng ký!" -> Controller chuyển thành mã 400 Bad Request, giúp trải nghiệm người dùng thân thiện và chuyên nghiệp hơn (Defense in Depth).

6. Tại sao không được trả thẳng Entity ra ngoài Controller mà phải map qua Response DTO?
=>
- Bảo mật (Security): Tránh làm lộ dữ liệu nhạy cảm như `passwordHash`.
- Ngăn ngừa Infinite Recursion (lặp vô tận): Khi 2 Entity quan hệ hai chiều (ví dụ: Session <-> Account), thư viện Jackson biến Entity thành JSON sẽ chạy đệ quy vòng lặp vô tận gây tràn bộ nhớ (StackOverflowError).
- Tránh LazyInitializationException: DTO chỉ lấy những trường cần thiết khi Session JPA còn mở.
- Độc lập kiến trúc: Khi Database đổi tên cột, tách bảng thì giao diện API (DTO) trả cho Frontend/Mobile không bị vỡ.

7. Tại sao lại dùng `@RestControllerAdvice` thay vì viết `try-catch` ở từng Controller?
=>
- Tuân thủ nguyên lý DRY (Don't Repeat Yourself): Tránh lặp lại code try-catch ở hàng chục controller khác nhau.
- Tách bạch trách nhiệm (Separation of Concerns): Controller chỉ tập trung điều hướng nghiệp vụ luồng thành công; còn bắt lỗi, định dạng mã lỗi HTTP (400, 404, 500) được gom về một mối duy nhất quản lý tập trung.

8. Tại sao method `confirmTimePurchase` (xác nhận nạp giờ) bắt buộc phải có annotation `@Transactional`?
=>
- Vì method này thực hiện 2 thao tác ghi vào DB: (1) Cập nhật trạng thái `TimePurchase` thành `CONFIRMED` và (2) Cộng `remainingMinutes` vào tài khoản `Account` của khách hàng.
- `@Transactional` đảm bảo tính nguyên tử (Atomicity trong ACID): Cả 2 thao tác này hoặc cùng thành công 100%, hoặc nếu 1 trong 2 gặp lỗi (ví dụ lỗi mạng, crash), toàn bộ dữ liệu sẽ tự động ROLLBACK về trạng thái ban đầu. Tránh trường hợp khách bị trừ tiền nhưng tài khoản không được cộng giờ!

9. Khái niệm Snapshot (Lưu vết lịch sử) trong thiết kế hệ thống là gì? Ví dụ?
=>
- Khái niệm: Lưu cứng giá trị tại thời điểm giao dịch xảy ra, không tính nhẩm động dựa trên bảng giá hiện tại.
- Ví dụ: Bảng `TimePurchase` lưu cả `minutes` (60p) và `amount` (10.000đ). Nếu sau này quán tăng giá lên 15.000đ/60p, báo cáo doanh thu của các tháng cũ vẫn chính xác 10.000đ, không bị tính sai lệch theo giá mới.

10. Phân biệt 4 loại Exception thường dùng nhất trong Spring Boot:
=>
- `IllegalArgumentException` (400 Bad Request): Dữ liệu đầu vào sai cú pháp / vô lý. (VD: phút nạp <= 0, tiền <= 0, SĐT sai định dạng).
- `IllegalStateException` (400 Bad Request): Trạng thái đối tượng không cho phép thực hiện. (VD: đơn đã CANCELLED mà bấm duyệt, máy đang IN_USE mà bấm mở tiếp).
- `ResourceNotFoundException` (404 Not Found): Không tìm thấy bản ghi trong DB theo ID. (VD: tìm Account id = 999 không thấy).
- `Exception` chung (500 Internal Server Error): Lỗi hệ thống bất ngờ (đứt cáp mạng, DB crash, Out of Memory).

11. `save()` khác `saveAndFlush()` như thế nào?
=>
- `save()`: Đưa Entity vào bộ nhớ đệm (Persistence Context), gom lại chờ kết thúc method hoặc trước khi commit transaction mới ghi xuống DB (tối ưu hiệu năng, khuyên dùng 95%).
- `saveAndFlush()`: Lưu và ép Hibernate bắn ngay lập tức câu lệnh SQL INSERT/UPDATE xuống DB tại dòng code đó (nhưng vẫn nằm trong transaction chưa commit). Dùng khi dòng code tiếp theo cần dữ liệu trong DB ngay lập tức.

12. Tại sao hàm trong Repository (VD: `findByCategoryId`) không hề ghi chữ "Item" hay tên bảng mà Spring vẫn biết query bảng `items`?
=>
- Do Spring nhìn vào khai báo Generic Type `<T, ID>` của interface Repository: `ItemRepository extends JpaRepository<Item, Long>`.
- Khai báo `<Item, Long>` chỉ định rõ repository này quản lý Entity `Item` (được map với bảng `items` qua `@Table(name = "items")`). Bất kỳ hàm nào viết bên trong nó đều tự động target vào bảng `items`.

13. Làm sao giải quyết lỗi Khóa ngoại (Foreign Key Constraint) và tránh mất dữ liệu kế toán khi Delete?
=>
- Dùng Xóa mềm (Soft Delete - Khuyên dùng 90% khi đi làm): Thêm trường `boolean isDeleted = false;` vào Entity. Khi xóa, chỉ chuyển `isDeleted = true` (thực chất là câu lệnh UPDATE).
  + Không bao giờ bị lỗi Foreign Key Constraint vì bản ghi cha vẫn tồn tại trong DB, các bảng con trỏ vào không bị đứt gãy.
  + Không mất dữ liệu kế toán/kiểm toán (Audit), lịch sử hoá đơn nạp tiền của khách vẫn còn nguyên vẹn.
- Ngoài ra: Có thể chủ động kiểm tra ở Service (chặn xóa nếu đã phát sinh giao dịch) hoặc dùng `CascadeType.REMOVE` đối với quan hệ cha con ruột thịt (VD: Order -> OrderItem).

14. Tại sao trong hàm startSession và endSession bắt buộc phải có @Transactional?
=>
- Vì cả 2 hàm đều cập nhật đồng thời 2 bảng: `sessions` và `computers` (và cả `accounts` khi tính lại giờ dư).
- `@Transactional` đảm bảo tính nguyên tử (Atomicity): Tránh tình trạng phiên đã tạo thành công nhưng máy tính vẫn ở trạng thái `AVAILABLE` (dẫn đến khách khác nhảy vào ngồi đè), hoặc khi kết thúc phiên mà máy không được mở khóa.

15. Trong `SessionResponse`, tại sao ta tính toán động `playedMinutes` và `remainingMinutesUntilExpiry` mà không lưu cứng 2 cột này vào bảng `sessions`?
=>
- Vì đây là dữ liệu thay đổi liên tục theo từng giây từng phút trôi qua của thời gian thực.
- Nếu lưu vào DB, ta sẽ phải liên tục chạy vòng lặp cập nhật DB mỗi giây (gây nghẽn cổ chai và chết database). Thay vào đó, trong DB chỉ cần lưu mốc mỏ neo cố định: `startedAt` và `expiresAt`. Khi nào Client cần xem thì tính nhẩm động bằng `Duration.between(...)` ngay lúc chuyển sang DTO, vừa chính xác 100% theo thời gian thực vừa không tốn tài nguyên DB.

16. Kỹ thuật "Làm phẳng dữ liệu" (Data Flattening) trong DTO là gì? Tại sao cần làm phẳng?
=>
- Là gì: Thay vì trả về cấu trúc JSON lồng nhau nhiều tầng (Nested JSON: `session.computer.code`, `session.account.name`), ta bóc tách các trường cần thiết đặt cùng trên 1 tầng duy nhất trong Response DTO (`SessionResponse.computerCode`, `SessionResponse.accountName`).
- Tại sao cần làm phẳng:
  + Cực tiện cho Frontend/Mobile: Dễ bóc dữ liệu hiển thị lên giao diện mà không cần chấm nhiều tầng.
  + Bảo mật: Bỏ rơi các trường nhạy cảm phía sau (như `passwordHash` trong Account).
  + Ngắt đệ quy lặp vô tận (Infinite Recursion): Ngăn lỗi tràn bộ nhớ `StackOverflowError` khi 2 Entity trỏ vòng tròn lẫn nhau.
  + Chống lỗi `LazyInitializationException`: Ép nạp dữ liệu ngay trong Service khi Session Hibernate còn mở.

17. `LazyInitializationException` là gì? Các trường hợp hay gặp và cách khắc phục chuẩn Enterprise?
=>
- Bản chất: Xảy ra khi cố truy cập dữ liệu của một trường/quan hệ được cấu hình `FetchType.LAZY` (lúc này Hibernate đang giữ Proxy ảo), nhưng Hibernate Session (Persistence Context) đã bị ĐÓNG (Closed).
- 3 trường hợp hay gặp nhất:
  + Case 1 (Kinh điển): Trả thẳng Entity ra ngoài Controller, khi thư viện Jackson biến Entity thành JSON và gọi getter của trường LAZY thì Session đã đóng -> BÙM! Văng lỗi `LazyInitializationException: could not initialize proxy - no Session`.
  + Case 2: Truy cập quan hệ LAZY bên ngoài phạm vi `@Transactional` (ví dụ ở Controller, Helper, hoặc Filter).
  + Case 3: Chạy tác vụ đa luồng bất đồng bộ (`@Async`, new Thread): Luồng mới không sở hữu Hibernate Session của luồng cũ.
- Cách khắc phục chuẩn Enterprise:
  + Dùng DTO & Map dữ liệu ngay bên trong tầng Service (nơi `@Transactional` và Hibernate Session còn đang mở).
  + Dùng `JOIN FETCH` trong JPQL khi thực sự cần load đồng thời cả bảng cha và con trong 1 query.
  + Không lạm dụng `spring.jpa.open-in-view=true` trên production vì gây treo kết nối DB Connection Pool.


