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

18. Khi lưu Order gồm nhiều OrderItem, tại sao ta chỉ cần gọi `orderRepository.save(order)` mà không cần gọi `orderItemRepository.save()` từng item?
=>
- Nhờ cấu hình `cascade = CascadeType.ALL` trên quan hệ `@OneToMany` trong Entity `Order`.
- Cascade (hiệu ứng thác nước) cho phép Hibernate tự động lan truyền thao tác lưu từ thực thể Cha (`Order`) xuống toàn bộ các thực thể Con (`OrderItem`). Hibernate sẽ tự động sinh các câu lệnh `INSERT INTO orders...` rồi tiếp tục `INSERT INTO order_items...` chỉ với 1 lệnh gọi `save(order)`.

19. Tại sao trong bảng `order_items` ta phải lưu cả `unitPrice` và `subtotal` trong khi bảng `items` đã có cột `price` rồi?
=>
- Đây là nguyên tắc Snapshot (Lưu vết giá bán lịch sử) trong thương mại điện tử:
  + Giá của món ăn trong menu (`items.price`) có thể tăng hoặc giảm theo thời gian (ví dụ mì tôm hôm nay 10k, tháng sau tăng lên 15k).
  + Nếu không lưu cứng `unitPrice` tại thời điểm khách đặt hàng, khi quán tăng giá menu, doanh thu và hóa đơn của các đơn hàng trong quá khứ sẽ bị tính sai lệch theo giá mới!
  + Lưu `subtotal` giúp hệ thống truy vấn và thống kê doanh thu cực nhanh mà không cần tính nhân lại trên từng dòng.

20. Trong tác vụ tự động đóng phiên chơi hết giờ (`@Scheduled`), tại sao phải dùng `Propagation.REQUIRES_NEW` và sự khác nhau giữa `fixedDelay` với `fixedRate` là gì?
=>
- `Propagation.REQUIRES_NEW`:
  + Khi Scheduler quét được danh sách 10 phiên hết giờ, nếu dùng transaction mặc định (`REQUIRED`), cả 10 phiên sẽ chạy chung 1 transaction lớn. Nếu phiên số 5 bị lỗi dữ liệu (ví dụ lock timeout), toàn bộ 10 phiên sẽ bị rollback, máy tính không được giải phóng!
  + Dùng `REQUIRES_NEW` cho method xử lý từng phiên giúp mỗi phiên chạy trong một transaction độc lập: phiên nào thành công thì commit ngay, phiên nào lỗi thì catch log mà không ảnh hưởng tới các phiên khác.
- `fixedDelay` vs `fixedRate`:
  + `fixedRate`: Bắn tác vụ theo chu kỳ cố định (ví dụ đúng 30s một lần, bất kể lần trước chạy mất bao lâu). Nếu DB bị chậm hoặc nghẽn mạng mất 40s, lần chạy thứ 2 sẽ nổ ra chồng lấn lên lần 1 gây nghẽn kết nối DB.
  + `fixedDelay`: Chỉ bắt đầu đếm 30s sau khi lần chạy trước ĐÃ HOÀN TẤT. An toàn hơn rất nhiều cho các tác vụ quét Database định kỳ.

21. Phân biệt Pessimistic Locking và Optimistic Locking? Trong hệ thống quán net, tài nguyên nào áp dụng loại khóa nào và tại sao?
=>
- Pessimistic Locking (Khóa bi quan - `SELECT ... FOR UPDATE`):
  + Cơ chế: Khóa dòng dữ liệu ngay từ tầng Database. Bất kỳ transaction nào khác muốn đọc/ghi vào dòng này đều bị ép đứng chờ (Block) cho đến khi transaction giữ khóa Commit/Rollback.
  + Áp dụng: Máy tính trạm (`Computer`). Vì số máy có hạn (vài chục máy), tần suất 2 khách cùng bấm Login vào 1 máy cùng lúc có thể xảy ra và hậu quả là 2 phiên trùng trên 1 máy, nên cần khóa chặt tại DB.
- Optimistic Locking (Khóa lạc quan - `@Version`):
  + Cơ chế: Không khóa DB, cho phép nhiều luồng đọc ghi tự do. Khi cập nhật, Hibernate kiểm tra cột `version`: nếu version trong DB lớn hơn version mà luồng đang cầm (nghĩa là đã có luồng khác sửa trước), Hibernate ném `OptimisticLockingFailureException` và từ chối cập nhật.
  + Áp dụng: Tài khoản khách (`Account.remainingMinutes`). Khách ít khi vừa hết giờ tự đóng lại vừa nạp tiền đúng tích tắc đó, nên dùng `@Version` giúp hệ thống chạy nhanh, không bị lock database mà vẫn chống được Lost Update.

22. Tại sao khi chuyển máy (UC-6) giữa các khu vực có đơn giá khác nhau, ta phải dùng `BigDecimal` với `RoundingMode.FLOOR`?
=>
- Công thức quy đổi: $M_{mới} = M_{cũ} \times \frac{P_{cũ}}{P_{mới}}$.
- Tuyệt đối không dùng kiểu `double` hay `float` vì số thực dấu phẩy động trong máy tính có sai số nhị phân (ví dụ $0.1 + 0.2 = 0.30000000000000004$). Trong tính toán tài chính và cước phí, phải dùng `BigDecimal` để đảm bảo độ chính xác tuyệt đối.
- Dùng `RoundingMode.FLOOR` (làm tròn xuống): Khi chia số phút ra số lẻ (ví dụ 45.8 phút), làm tròn xuống 45 phút để bảo vệ doanh thu cho quán net, tránh việc làm tròn lên khiến khách được hưởng lợi phút chơi mà chưa thanh toán tiền.

23. Làm thế nào để đảm bảo tính nguyên tử (Atomicity) khi chuyển máy cho khách (vừa đổi máy cũ, đổi máy mới, cập nhật phiên, quy đổi giờ)?
=>
- Bọc toàn bộ phương thức `transferComputer` bằng `@Transactional` (Spring Transaction Management).
- Nếu bất kỳ bước nào thất bại (máy đích bị lỗi, mạng đứt, xung đột lock), Spring AOP sẽ tự động Rollback toàn bộ: máy cũ không bị nhả, máy mới không bị chiếm, và phiên chơi vẫn giữ nguyên trạng thái cũ. Hệ thống luôn ở trạng thái nhất quán 100%.

---

### Câu hỏi phỏng vấn — Ôn tập Phase 3 (Spring Security 6, JWT, BCrypt & RBAC):

24. Tại sao REST API dùng JWT lại cấu hình `SessionCreationPolicy.STATELESS` và tắt CSRF (`csrf.disable()`)?
=>
- `STATELESS`:
  + Khác với mô hình MVC truyền thống lưu `HttpSession` trên RAM server (chiếm bộ nhớ và khó scale), REST API Stateless không lưu trạng thái đăng nhập trên server.
  + Mỗi request gửi lên đều độc lập và tự chứng minh danh tính qua header `Authorization: Bearer <token>`. Nhờ đó, ứng dụng có thể scale-out ra nhiều server/container đằng sau Load Balancer mà không cần cấu hình Sticky Session hay Redis Session cluster.
- `csrf.disable()`:
  + Tấn công CSRF (Cross-Site Request Forgery) xảy ra khi trình duyệt tự động đính kèm Cookie đăng nhập của nạn nhân khi họ bấm vào link độc hại từ trang web khác.
  + Với REST API Stateless, JWT được lưu ở client (Local Storage / Memory) và gửi thủ công qua Header `Authorization` (không dùng Cookie tự động đính kèm), nên hacker không thể ép trình duyệt tự gửi JWT. Do đó, việc bật CSRF là dư thừa và tắt đi giúp tránh lỗi 403 trên các method POST/PUT/DELETE.

25. BCrypt hoạt động như thế nào? Tại sao cùng 1 mật khẩu "123456" băm 2 lần lại ra 2 chuỗi khác nhau mà vẫn verify được? Tại sao không dùng MD5 hay SHA-256?
=>
- MD5 và SHA-256 là hàm băm nhanh (Fast Hash). Chúng được thiết kế để kiểm tra toàn vẹn file, nên hacker có thể dùng GPU/ASIC thử hàng tỷ mật khẩu mỗi giây bằng Rainbow Table (bảng băm tra cứu ngược).
- BCrypt là thuật toán băm chậm (Slow Hash - KDF):
  + Tự động sinh một chuỗi ngẫu nhiên gọi là Salt (16 bytes) và gắn liền vào kết quả băm.
  + Cho phép chỉnh độ phức tạp (Work Factor, mặc định 10 tương đương $2^{10} = 1024$ vòng băm). Dù hacker có siêu máy tính cũng mất hàng chục năm để brute-force.
- Cùng 1 mật khẩu ra hash khác nhau: Vì mỗi lần gọi `passwordEncoder.encode("123456")`, một chuỗi Salt ngẫu nhiên mới được sinh ra.
- Cách verify: Chuỗi hash BCrypt có định dạng `$2a$10$[22 ký tự salt][31 ký tự hash]`. Khi gọi `passwordEncoder.matches(raw, hash)`, BCrypt bóc tách đúng chuỗi Salt đã lưu trong hash cũ, băm lại chuỗi `raw` với đúng Salt đó, rồi so sánh 2 chuỗi băm bằng thuật toán so sánh thời gian không đổi (*Constant-Time Comparison*) để chống Timing Attack.

26. Refresh Token Rotation (RTR) là gì? Tại sao Access Token nên để ngắn hạn (30p) và lưu trong RAM/Header, còn Refresh Token lại lưu Database?
=>
- Vấn đề: JWT là Stateless (tự chứa thông tin và chữ ký số). Server không query DB để check JWT, nên một khi Access Token bị lộ, hacker có thể dùng token đó cho tới khi nó tự hết hạn mà server không thể thu hồi tức thì (Revocation).
- Giải pháp kết hợp:
  + **Access Token ngắn hạn (30 phút)**: Chứa ID, phone, role. Được verify bằng CPU/RAM ở Filter (độ trễ ~0ms, không chạm DB). Giảm thiểu rủi ro nếu token bị lộ vì thời gian sống rất ngắn.
  + **Refresh Token dài hạn (7 ngày) lưu DB**: Lưu dạng UUID bảo mật, có cờ `revoked` và `expiresAt`. Dùng để xin cấp mới Access Token mà người dùng không cần gõ lại mật khẩu.
  + **Refresh Token Rotation (RTR)**: Mỗi khi client gửi Refresh Token lên xin cấp mới (`POST /api/auth/refresh`), server kiểm tra tính hợp lệ trong DB, lập tức đánh dấu thu hồi (`revoked = true`) hoặc xóa token cũ, rồi sinh ra một Refresh Token MỚI kèm Access Token MỚI.
  + *Lợi ích RTR*: Nếu kẻ gian trộm được Refresh Token cũ và cố tình tái sử dụng (Reuse Detection), server phát hiện token này đã bị revoke -> lập tức hủy toàn bộ token liên quan của người dùng đó để bảo vệ tài khoản.

27. Trình bày vòng đời xử lý của một Request qua Spring Security Filter Chain trong dự án CyberNet?
=>
1. Request từ Client gửi tới (ví dụ: `GET /api/computers/VIP`).
2. Đi qua danh sách các Filter trong `SecurityFilterChain`:
   - `JwtAuthenticationFilter` (kế thừa `OncePerRequestFilter`) chặn lại:
     + Đọc Header `Authorization`. Nếu không có hoặc không bắt đầu bằng `Bearer `, cho đi tiếp qua filter chain (chưa có danh tính).
     + Nếu có: Cắt chuỗi lấy JWT raw -> gọi `jwtService.validateToken(token)`.
     + Bóc tách username (SĐT) từ claim `subject` -> gọi `CustomUserDetailsService.loadUserByUsername(phone)` lấy `UserDetails`.
     + Tạo đối tượng `UsernamePasswordAuthenticationToken(userDetails, null, userDetails.getAuthorities())`.
     + Nạp vào luồng xử lý: `SecurityContextHolder.getContext().setAuthentication(auth)`.
3. Đến `AuthorizationFilter`:
   - Kiểm tra route: Nếu là public (`/api/auth/**`, `POST /api/sessions/login`) -> cho qua.
   - Nếu là route khác: Kiểm tra `SecurityContextHolder`. Nếu chưa có Authentication -> chuyển sang `CustomAuthenticationEntryPoint` trả về HTTP 401 JSON.
4. Vào Controller:
   - Interceptor kiểm tra `@PreAuthorize` (ví dụ `@PreAuthorize("hasRole('ADMIN')")`).
   - So sánh với danh sách `GrantedAuthority` trong Authentication. Nếu không đủ quyền -> ném `AccessDeniedException` -> `GlobalExceptionHandler` bắt và trả HTTP 403 JSON.
   - Nếu đủ quyền -> Controller thực thi code nghiệp vụ bình thường và trả HTTP 200/201.

28. Phân biệt HTTP 401 Unauthorized và HTTP 403 Forbidden? Trong Spring Security cấu hình xử lý 2 lỗi này trả về JSON như thế nào?
=>
- **HTTP 401 Unauthorized (Chưa xác thực - Unauthenticated)**:
  + Ý nghĩa: "Bạn chưa cung cấp thông tin danh tính, hoặc token của bạn không hợp lệ/hết hạn".
  + Xử lý: Triển khai interface `AuthenticationEntryPoint`. Trong `SecurityConfig`, cấu hình `.exceptionHandling(ex -> ex.authenticationEntryPoint(customEntryPoint))`. Bên trong entry point, ghi JSON `{"status": 401, "error": "Unauthorized", "message": "..."}` vào `HttpServletResponse`.
- **HTTP 403 Forbidden (Không có quyền - Access Denied)**:
  + Ý nghĩa: "Server biết bạn là ai (đã đăng nhập hợp lệ), nhưng vai trò của bạn không được phép thực hiện hành động này".
  + Xử lý: Bắt `AccessDeniedException.class` trong `@RestControllerAdvice` (`GlobalExceptionHandler`) và trả về `ResponseEntity.status(HttpStatus.FORBIDDEN).body(...)` với mã 403 JSON.

29. Phân biệt phân quyền URL-Level (`requestMatchers`) và Method-Level (`@PreAuthorize`)? Tại sao nên ưu tiên `@PreAuthorize`?
=>
- URL-Level (`SecurityFilterChain`):
  + Khai báo tập trung bằng `authorizeHttpRequests(auth -> auth.requestMatchers("/api/admin/**").hasRole("ADMIN"))`.
  + Nhược điểm: Dễ bị sót route khi hệ thống mở rộng, khó bảo trì khi các endpoint phức tạp nằm rải rác ở nhiều controller.
- Method-Level (`@PreAuthorize`):
  + Kích hoạt bằng `@EnableMethodSecurity`.
  + Gắn annotation trực tiếp trên từng hàm trong Controller: `@PreAuthorize("hasAnyRole('STAFF', 'ADMIN')")`.
  + Ưu điểm vượt trội: Đặt ngay trên code xử lý nghiệp vụ, developer nhìn thấy ngay quyền hạn cần thiết của API đó mà không phải mở file config, hỗ trợ biểu thức SpEL (Spring Expression Language) mạnh mẽ, dễ dàng bảo trì và viết Unit/Integration test độc lập.

30. Tại sao API mở máy trạm UC-2 (`POST /api/sessions/login`) lại không cần dùng JWT Bearer mà mở public?
=>
- Phân biệt bản chất nghiệp vụ của Khách hàng (PC Client) và Nhân viên (Staff Dashboard):
  + Nhân viên đăng nhập vào hệ thống quản trị Web/POS cần giữ phiên đăng nhập để gọi hàng loạt API CRUD, duyệt nạp tiền, quản lý danh mục. Vì vậy, luồng nhân viên cần cấp Access Token và Refresh Token qua Header Bearer JWT.
  + Khách hàng khi ngồi tại máy trạm chỉ cần mở khóa màn hình để chơi game. Máy trạm gửi SĐT + Mật khẩu lên `POST /api/sessions/login`. Hệ thống dùng BCrypt xác thực mật khẩu trực tiếp, kiểm tra số phút chơi còn lại, tạo `Session` và khóa máy `IN_USE`.
  + Phiên chơi của khách được quản lý theo trạng thái máy trạm (Stateful qua bảng `sessions` và socket/heartbeat client trạm), không liên quan đến token quản trị. Do đó, mở public endpoint này giúp kiến trúc đơn giản, hiệu năng cao và phân tách rành mạch trách nhiệm giữa PC Gaming Client và Staff Web Dashboard.



