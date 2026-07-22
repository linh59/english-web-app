---
name: database
description: Schema Supabase (bảng chính), RLS, Storage, migrations — đọc khi thêm/sửa bảng, policy, hoặc gọi Supabase
---

# Database & Supabase

## Bảng chính (V1)
- `lessons`: id, user_id, title, audio_path, status (`pending | processing | done | failed`), duration_seconds, created_at
- `lesson_sentences`: id, lesson_id, sentence_index, text, start_time, end_time
- `vocabulary`: id, user_id, lesson_id (nullable), word, meaning, example_sentence, created_at

## Quy tắc
- **RLS bật cho mọi bảng từ ngày đầu**, kể cả khi chỉ có 1 user. Policy chuẩn:
  `user_id = auth.uid()`.
- Storage bucket `audio`, path dạng `{user_id}/{lesson_id}.{ext}`, RLS giới hạn user chỉ
  truy cập folder của mình.
- Mọi thay đổi schema đi qua `supabase/migrations`, không sửa trực tiếp qua dashboard rồi
  quên đồng bộ.
- Gemini API key chỉ được dùng trong Edge Function (server-side). Không bao giờ gọi Gemini
  trực tiếp từ frontend vì sẽ lộ key.
- Trạng thái xử lý (`status`) của `lessons` cập nhật qua Edge Function/client sau khi chunk
  xong; frontend theo dõi bằng **Supabase Realtime subscription** trên bảng `lessons`
  (không polling thủ công).
- Audio dài nên việc chia nhỏ (chunk) xảy ra phía **client** trước khi gọi Edge Function
  `transcribe-chunk` (function này stateless, không tự chunk, không truy cập DB) — xem
  [[decisions]] để biết lý do (Edge Function có trần thời gian chạy cứng). Client ghép
  kết quả các chunk lại theo thứ tự khi insert vào `lesson_sentences`.
