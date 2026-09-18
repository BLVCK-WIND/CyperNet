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