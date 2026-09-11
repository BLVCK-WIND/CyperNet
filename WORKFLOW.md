# Quy trình làm việc — Anh & Em

> File này ghi lại cách anh và em phối hợp trong suốt dự án.
> Đọc lại khi cần nhắc nhở bản thân về kỷ luật làm việc.

---

## Nguyên tắc cốt lõi

1. **Em là người code, anh là người hướng dẫn** — Anh không code hộ.
2. **Hiểu trước, code sau** — Không bao giờ gõ code khi chưa hiểu tại sao.
3. **1 ngày 1 task nhỏ** — Xong hẳn rồi mới sang cái tiếp theo. Không tham.
4. **Không bỏ quá 1 ngày** — Nếu bận thì làm ít (30 phút) cũng được, nhưng không được bỏ.
5. **Hỏi là tốt, không hỏi mới nguy** — Chưa hiểu thì hỏi, không tự đoán rồi code sai.

---

## Quy trình mỗi task

### Bước 1 — Anh đặt bài toán
- Anh nói rõ: **LÀM GÌ** + **TẠI SAO** (nghiệp vụ + kỹ thuật)
- Anh chỉ ra kỹ thuật nào trong SKILL.md sẽ được dùng

### Bước 2 — Em suy nghĩ trước
- Anh hỏi: *"Em nghĩ nên viết thế nào?"*
- Em trả lời theo hiểu biết, đúng sai đều được
- Mục đích: rèn tư duy phân tích, không phải test kiến thức

### Bước 3 — Hướng dẫn (cái đầu tiên mỗi loại: anh làm mẫu)
- **Cái đầu tiên** của mỗi loại task: anh code mẫu, giải thích từng dòng
- **Các cái tiếp theo**: em tự làm dựa trên mẫu, anh chỉ hỗ trợ khi stuck

### Bước 4 — Em tự code
- Em gõ code (không copy-paste)
- Gặp lỗi → đọc error message → đoán nguyên nhân → thử fix
- Nếu không fix được → hỏi anh kèm: lỗi gì, đã thử gì, kết quả ra sao

### Bước 5 — Anh review + hỏi phỏng vấn
- Anh review code: chỗ tốt / chỗ cần sửa / best practice
- Anh hỏi câu phỏng vấn liên quan (VD: "Tại sao dùng LAZY?", "Nếu 2 request đồng thời thì sao?")
- Câu hỏi + câu trả lời ghi vào file interview để ôn tập sau

### Bước 6 — Ghi LOG.md + Commit
- Ghi lại: việc đã làm, kỹ thuật dùng, lỗi gặp, bài học
- Git commit với message rõ ràng

---

## Quy trình debug (khi gặp lỗi)

```
1. ĐỌC LỖI  — Error message / stack trace nói gì?
2. XÁC ĐỊNH  — Lỗi ở file nào, dòng nào?
3. ĐOÁN      — Tại sao lỗi? (nghĩ 2-3 khả năng)
4. THỬ FIX   — Thử từng khả năng
5. HỎI ANH   — Nếu không fix được, kèm: lỗi gì + đã thử gì + kết quả
```

Anh sẽ **đưa gợi ý** để em tự tìm, không fix hộ.

---

## Về ngôn ngữ

- **Phase 0–1**: Comment tiếng Việt (dễ hiểu khi mới bắt đầu)
- **Phase 2 trở đi**: Chuyển dần sang comment tiếng Anh (chuẩn bị cho đi làm thực tế)
- **Giải thích, trao đổi**: Luôn tiếng Việt

---

## Về phỏng vấn

- Sau mỗi task hoặc mỗi Phase, anh sẽ hỏi câu phỏng vấn
- Câu hỏi + đáp án lưu vào file `interviewX.md`
- Mục đích: ôn tập + rèn khả năng giải thích kỹ thuật bằng lời

---

## Nhắc nhở cho bản thân em

> ❌ **KHÔNG** nhảy phase khi phase hiện tại chưa xong
> ❌ **KHÔNG** code khi chưa hiểu tại sao
> ❌ **KHÔNG** copy-paste code mà không gõ lại
> ❌ **KHÔNG** bỏ quá 1 ngày không động vào project
> ✅ **CÓ** hỏi khi chưa hiểu — hỏi nhiều = tốt
> ✅ **CÓ** ghi LOG.md mỗi ngày — dù chỉ 1 dòng
> ✅ **CÓ** đọc error message trước khi hỏi anh
> ✅ **CÓ** commit code mỗi khi xong 1 task nhỏ
