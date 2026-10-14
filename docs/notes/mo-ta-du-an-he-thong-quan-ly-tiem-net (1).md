# Hệ thống Quản lý Tiệm Net Thông Minh

## 1. Giới thiệu chung

Đây là một hệ thống phần mềm được thiết kế để thay thế cách vận hành thủ công truyền thống tại các tiệm net (quán game/internet). Điểm cốt lõi: khách hàng dùng **chính điện thoại của mình** để gọi món ăn, thức uống, hoặc mua thêm giờ chơi — không cần đứng dậy ra quầy, không cần thao tác gì trên máy tính đang chơi game (vì máy đó vẫn đang bận chơi, không thể dùng để đặt món).

Mỗi máy tính trong quán có 1 mã QR riêng, dán cố định tại vị trí bàn của máy đó. Khách lấy điện thoại quét đúng mã QR ở bàn mình đang ngồi, hệ thống sẽ hiện ra 1 trang web (mở ngay trên trình duyệt điện thoại, không cần cài app) để khách gọi dịch vụ. Hệ thống biết chính xác đơn hàng này thuộc về máy nào và tài khoản khách nào, nhờ vào việc đối chiếu với phiên chơi đang mở tại đúng máy đó.

## 2. Vấn đề thực tế mà hệ thống giải quyết

Tại một tiệm net vận hành theo cách truyền thống, thường gặp các bất tiện sau:

- Khách muốn ăn uống hoặc thêm giờ chơi phải đứng dậy ra quầy, gây gián đoạn trải nghiệm chơi.
- Nhân viên khó theo dõi chính xác máy nào đang có khách, khách đó gọi những gì, đã thanh toán chưa.
- Việc thanh toán tiền mặt dễ xảy ra sai sót hoặc thất thoát nếu không ghi chép rõ ràng.
- Chủ quán khó có số liệu tổng hợp để biết doanh thu, món nào bán chạy, máy nào hay được dùng.

Hệ thống này được xây dựng để giải quyết đúng những vấn đề trên, bằng cách số hoá toàn bộ quy trình từ lúc khách được mở tài khoản, ngồi vào máy, cho tới lúc khách rời đi.

## 3. Các đối tượng sử dụng hệ thống

| Đối tượng | Vai trò trong hệ thống | Thao tác qua |
|---|---|---|
| **Khách hàng** | Gọi dịch vụ (thêm giờ, món ăn/uống), chọn cách thanh toán | Trang web trên điện thoại riêng của khách (sau khi quét QR tại bàn) |
| **Nhân viên** | Mở tài khoản cho khách mới, xác nhận thanh toán, xử lý phát sinh | Đăng nhập tài khoản nhân viên trên máy tính/thiết bị riêng của quầy |
| **Quản lý/Chủ quán** | Quản lý danh mục, nhân sự, xem báo cáo doanh thu | Đăng nhập tài khoản quản lý, quyền cao hơn nhân viên |

## 4. Luồng hoạt động chi tiết (từng bước, ví dụ cụ thể)

### Bước 1 — Khách lần đầu tới quán: mở tài khoản tại quầy

Khách mới, chưa từng có tài khoản, **bắt buộc phải tới quầy** để nhân viên mở tài khoản giúp — không có cách nào để khách tự đăng ký từ xa hay tự làm qua điện thoại ở lần đầu tiên này. Nhân viên chỉ cần hỏi số điện thoại và tên khách, nhập vào hệ thống là xong, không mất nhiều thời gian.

### Bước 2 — Khách ngồi vào máy và mở phiên chơi

Khách đã có tài khoản (hoặc vừa được nhân viên mở xong ở Bước 1) ngồi vào 1 máy đang trống, ví dụ máy "PC-01". Tại vị trí bàn của máy này có dán sẵn 1 mã QR cố định, chỉ đại diện riêng cho máy PC-01.

Khách lấy điện thoại của mình quét mã QR đó. Hệ thống nhận diện ngay: "đây là máy PC-01, và tài khoản đang mở phiên tại đây là số điện thoại XXX". Từ lúc này, hệ thống bắt đầu tính giờ chơi cho khách, máy PC-01 chuyển trạng thái từ "đang trống" sang "đang có người dùng", đảm bảo không có khách khác bị gán nhầm vào cùng máy này.

### Bước 3 — Khách gọi thêm dịch vụ ngay trên điện thoại của mình

Bất cứ lúc nào trong lúc chơi, nếu khách muốn ăn uống hoặc mua thêm giờ, khách chỉ cần quét lại đúng mã QR tại bàn của mình (hoặc mở lại trang web đã quét từ trước), hệ thống sẽ tự nhận ra ngay "máy PC-01, tài khoản XXX đang mở phiên" — khách **không cần đăng nhập lại hay nhập số điện thoại thêm lần nào nữa**. Khách chỉ việc xem danh sách món/dịch vụ và chọn, ví dụ:

- Mì tôm trứng — 25.000đ
- Nước tăng lực — 15.000đ
- Thêm 1 giờ chơi — 10.000đ

Khách chọn xong, hệ thống tạo ra **1 đơn hàng**, tự động gắn liền với đúng phiên chơi đang mở tại máy PC-01 — không thể bị nhầm lẫn sang máy hay khách khác. Đơn hàng lúc này ở trạng thái "**đang chờ thanh toán**", chưa có gì được xử lý.

### Bước 4 — Thanh toán và xác nhận

Khách chọn 1 trong 2 cách trả tiền, thao tác ngay trên trang web đang mở ở điện thoại:

**Cách 1 — Quét mã QR chuyển khoản**: hệ thống hiện thêm 1 mã QR khác chứa đúng số tiền của đơn hàng. Khách dùng app ngân hàng quét, chuyển khoản. Nhân viên tại quầy (đăng nhập vào hệ thống trên máy tính/thiết bị riêng của quán) kiểm tra thấy tiền đã về, bấm xác nhận.

**Cách 2 — Thanh toán tiền mặt**: hệ thống báo ngay cho nhân viên (trên màn hình quản lý của quầy) biết "có 1 đơn hàng tại máy PC-01 muốn trả tiền mặt". Nhân viên đi tới tận máy PC-01 nhận tiền trực tiếp từ khách, sau đó quay lại thiết bị của mình bấm xác nhận.

Dù chọn cách nào, đơn hàng chỉ thực sự được xử lý **sau khi có nhân viên xác nhận trên hệ thống** — đảm bảo không có sai sót hay gian lận.

Sau khi được xác nhận:
- Nếu là đồ ăn/thức uống → nhân viên chuẩn bị và mang tới tận máy PC-01 cho khách.
- Nếu là "thêm giờ chơi" → hệ thống tự động cộng thêm thời gian vào đồng hồ đếm giờ của phiên chơi đó, không cần ai thao tác tay thêm.

### Bước 5 — Kết thúc phiên chơi

Khi hết giờ chơi (khách không mua thêm giờ), hoặc khách chủ động đăng xuất, hệ thống đóng phiên chơi lại. Máy PC-01 chuyển trạng thái trở lại "đang trống" (hoặc "đang dọn dẹp/bảo trì" nếu cần kiểm tra trước khi đón khách mới).

## 5. Chức năng dành cho Nhân viên và Quản lý

Nhân viên và quản lý không thao tác qua mã QR như khách — họ đăng nhập trực tiếp vào hệ thống bằng tài khoản riêng (do quản lý cấp), trên thiết bị/máy tính cố định của quầy.

### 5.1. Chức năng dành cho Nhân viên

- **Mở tài khoản cho khách hàng mới**: nhập số điện thoại và tên khi khách tới quầy lần đầu — bước bắt buộc, không có ngoại lệ như đã nói ở Bước 1.
- **Xem bảng theo dõi toàn bộ máy trong quán**: 1 màn hình tổng quan hiển thị tất cả máy, trạng thái đang trống/đang dùng/đang bảo trì, giúp nhân viên biết ngay còn máy nào trống để xếp cho khách mới.
- **Xem và xác nhận các đơn hàng đang chờ**: danh sách đơn khách gọi, phân loại theo thanh toán QR hay tiền mặt, nhân viên xác nhận sau khi kiểm tra tiền đã về/đã nhận đủ.
- **Thêm giờ chơi hoặc tạo đơn thủ công cho khách**: dùng trong trường hợp khách muốn thanh toán trực tiếp với nhân viên hoặc quán có khuyến mãi tặng giờ.
- **Kết thúc phiên chơi thay khách**: nếu khách quên đăng xuất trước khi về, hoặc có sự cố với máy.
- **Chuyển khách sang máy khác**: khi máy đang dùng gặp lỗi kỹ thuật, chuyển toàn bộ phiên (kèm giờ còn lại) sang máy trống khác mà không mất giờ khách đã mua.
- **Huỷ đơn hàng**: khi khách đổi ý hoặc có sai sót lúc tạo đơn.
- **Cập nhật trạng thái máy**: chuyển máy sang "đang bảo trì" khi cần lau dọn/kiểm tra, rồi mở lại khi máy sẵn sàng đón khách mới.

### 5.2. Chức năng dành cho Quản lý/Chủ quán

Quản lý có toàn bộ quyền của nhân viên, cộng thêm:

- **Quản lý danh mục món ăn, thức uống, dịch vụ**: thêm/sửa/xoá món, điều chỉnh giá, kể cả giá "thêm giờ chơi".
- **Quản lý danh sách máy trong quán**: thêm máy mới, đặt mã máy, loại bỏ máy đã thanh lý.
- **Quản lý tài khoản nhân viên**: tạo tài khoản đăng nhập cho nhân viên mới, phân quyền (ai chỉ xác nhận đơn thông thường, ai được xem báo cáo/sửa giá).
- **Xem báo cáo và số liệu tổng hợp**: doanh thu theo ngày/tuần/tháng, món bán chạy nhất, máy được dùng nhiều nhất, khung giờ đông khách nhất.
- **Đối soát lịch sử giao dịch**: xem lại toàn bộ đơn hàng đã xử lý, đối chiếu số tiền thực nhận với hệ thống để phát hiện sớm sai sót.

## 6. Điểm nổi bật của hệ thống

- **Khách tự phục vụ qua điện thoại riêng**: không cần đứng dậy, không cần chiếm dụng máy đang chơi game để đặt món.
- **Không cần đăng nhập lại nhiều lần**: sau khi phiên chơi đã mở, mọi lần gọi thêm dịch vụ chỉ cần quét QR, hệ thống tự nhận diện đúng tài khoản và máy.
- **Luôn có bước xác nhận của con người**: dù thanh toán bằng cách nào, luôn cần nhân viên xác nhận trước khi đơn được xử lý — tránh rủi ro gian lận hoặc nhầm lẫn.
- **Theo dõi chính xác từng máy, từng khách, từng phiên chơi**: không nhầm lẫn dữ liệu dù khách quay lại quán nhiều lần trong ngày hoặc các ngày khác nhau.
- **Phân quyền rõ ràng giữa các vai trò**: khách hàng, nhân viên, quản lý mỗi bên chỉ thấy và thao tác đúng phần việc của mình.

## 7. Tình trạng hiện tại của dự án

Đây là dự án đang trong giai đoạn xây dựng, được phát triển như một dự án học tập/thực hành để rèn kỹ năng lập trình thực tế, hướng tới việc có thể triển khai thành sản phẩm dùng thật trong tương lai.

Hiện tại đã hoàn thành:
- Thiết kế toàn bộ luồng hoạt động nghiệp vụ (như mô tả ở trên).
- Thiết kế cấu trúc dữ liệu nền tảng: thông tin máy, thông tin khách hàng, danh mục món/dịch vụ, phiên chơi, và đơn hàng.
- Dựng khung kỹ thuật ban đầu (kết nối được với cơ sở dữ liệu, sẵn sàng để xây dựng các chức năng cụ thể).

Đang tiếp tục phát triển:
- Xây dựng các chức năng xử lý cụ thể (mở phiên chơi, tạo đơn hàng, xác nhận thanh toán).
- Xây dựng giao diện web cho khách hàng (trên điện thoại) và giao diện cho nhân viên/quản lý.
- Bổ sung các bước kiểm thử để đảm bảo hệ thống hoạt động đúng, đặc biệt ở các tình huống nhạy cảm như xử lý tiền bạc.

## 8. Định hướng phát triển tiếp theo

Sau khi hoàn thiện các chức năng cốt lõi ở trên, một số hướng mở rộng có thể tính đến trong tương lai:

- **Phần mềm cài trực tiếp trên máy tính chơi game**: mỗi khi khách bật máy lên, phần mềm này tự động hiện ra đầu tiên, cho phép khách gọi món ăn, thêm giờ, hoặc dịch vụ khác ngay trên chính máy đang dùng — như một lựa chọn thay thế/bổ sung cho việc dùng điện thoại riêng.
- Báo cáo doanh thu theo ngày/tuần/tháng cho chủ quán.
- Thống kê món ăn/dịch vụ bán chạy nhất.
- Tích hợp trực tiếp với ngân hàng để tự động xác nhận thanh toán QR, không cần nhân viên kiểm tra tay.
- Ứng dụng riêng cho khách hàng thân thiết, tích điểm, ưu đãi.

---

*Tài liệu này mô tả ở mức tổng quan nghiệp vụ, không đi vào chi tiết kỹ thuật lập trình, nhằm mục đích giúp người đọc không chuyên vẫn hiểu được cách hệ thống hoạt động.*
