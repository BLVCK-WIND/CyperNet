# 🚀 Quy trình làm việc — AI Pilot & Tech Lead Review

> **Triết lý mới**: 
> - **AI đóng vai:** Developer thi hành (Viết code chuẩn kiến trúc, nhanh chóng, đúng cú pháp).
> - **Bạn đóng vai:** **Tech Lead / Code Reviewer** (Đọc hiểu, duyệt code, chất vấn điểm chưa rõ, kiểm soát chất lượng và nắm vững kiến thức).
> - **Kỷ luật Token:** Mỗi Task là một phiên chat mới độc lập. Không kéo dài phiên chat.

---

## 🔁 Chu kỳ 1 Task = 1 Phiên Chat (Context Reset Loop)

```
[BƯỚC 1: MỞ CHAT MỚI] ──> Nạp Prompt Mẫu + CONVENTIONS.md
         │
[BƯỚC 2: AI VIẾT CODE] ──> Trả code (Diff/File mới) + 2 điểm cần review
         │
[BƯỚC 3: REVIEW & HỌC] ──> Bạn đọc code, hỏi AI giải thích chỗ chưa hiểu
         │
[BƯỚC 4: TEST & ĐÓNG]  ──> Biên dịch (mvn compile), note LOG.md, ĐÓNG CHAT!
```

---

## Chi tiết các bước thực hiện

### Bước 1 — Khởi động phiên làm việc mới (Mở New Chat)
* **Tuyệt đối không** dùng lại phiên chat hôm qua để tránh tích lũy token cũ.
* Gửi prompt kích hoạt chuẩn (xem mẫu ở mục bên dưới). AI sẽ đọc `CONVENTIONS.md` và `SCHEMA_SKELETON.md` để nắm chuẩn kiến trúc.

### Bước 2 — AI thi hành code (Tiết kiệm token)
* **Quy tắc Diff-Only:** Nếu file đã có (như Service, Controller), AI chỉ đưa ra method mới hoặc đoạn code thay đổi, **không viết lại cả file**.
* **Đính kèm Review Checkpoints:** Cuối phản hồi, AI phải nêu 2 điểm mấu chốt trong code (về Transaction, Concurrency, Null-safety...) để bạn kiểm tra.

### Bước 3 — Bạn Review và Đặt câu hỏi
* **Đọc code:** Không copy-paste mù quáng. Đọc từng dòng code AI sinh ra.
* **Chất vấn AI:** Nếu gặp cú pháp lạ, Annotation mới, hoặc logic khó hiểu:
  > *"Giải thích cho tôi method này hoạt động ra sao? Tại sao ở đây lại dùng `@Version` / `@Transactional`?"*
* **Thử thách AI:** *"Trường hợp 2 khách cùng bấm mua món này cùng 1 mili-giây thì code này có bị lỗi không?"*

### Bước 4 — Kiểm thử & Kết thúc Task
* Chạy biên dịch và kiểm tra:
  ```powershell
  ./mvnw compile
  ```
* Ghi 2–3 dòng vào [docs/notes/LOG.md](file:///d:/Antigravity/Java_SpringBoot/internet-cafe-management/docs/notes/LOG.md) hoặc [docs/notes/LESSONS.md](file:///d:/Antigravity/Java_SpringBoot/internet-cafe-management/docs/notes/LESSONS.md) nếu học được kinh nghiệm hay.
* **Commit Git:** `git commit -m "feat: complete UC-X ..."`
* **ĐÓNG / XÓA PHIÊN CHAT ĐÓ.** Sẵn sàng cho Task tiếp theo.

---

## 📋 Template Prompt "1-Click" Cho Phiên Chat Mới

Copy đoạn này dán vào ô chat khi bắt đầu một ngày mới hoặc một task mới:

```markdown
Tôi đang tiếp tục dự án CyberNet (Spring Boot). 
Hãy đọc các file trong thư mục docs/context/ để nắm chuẩn kiến trúc, cấu trúc DB và tiến độ hiện tại.

Nhiệm vụ hôm nay:
[Ghi tên và yêu cầu ngắn gọn của Task, ví dụ: Triển khai UC-5: Tự động kết thúc phiên chơi khi hết giờ dùng @Scheduled]

Yêu cầu đối với AI:
1. Viết code hoàn chỉnh cho task này (Service/DTO/Controller cần thiết).
2. Với các file đã tồn tại, CHỈ trả về code thay đổi hoặc diff, không viết lại cả file.
3. Cuối bài, liệt kê 2 điểm then chốt nhất về mặt kỹ thuật/logic để tôi (Reviewer) kiểm tra và đặt câu hỏi.
```

---

## ⚠️ 4 Nguyên tắc vàng chống "Cháy ví Token"

1. ❌ **Không gửi file log / error trace dài ngoằng:** Chỉ copy 5–10 dòng stacktrace quan trọng nhất chỉ rõ tên class và dòng bị lỗi.
2. ❌ **Không giữ chat dài:** Một phiên chat vượt quá 10–15 lượt hỏi đáp = tạo chat mới ngay.
3. ❌ **Không ném cả thư mục vào context:** Chỉ tag hoặc mở đúng file liên quan trực tiếp đến Task.
4. ✅ **Luôn tận dụng CONVENTIONS.md:** Giúp AI sinh code đồng nhất 100% phong cách với các file cũ dù mỗi ngày là một phiên chat mới.
