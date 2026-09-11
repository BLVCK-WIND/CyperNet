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