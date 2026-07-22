---
name: status
description: Trạng thái hiện tại của V1 — phần nào đã xong/đã test thật, bước tiếp theo cần làm
---

# Trạng thái hiện tại

## Đã hoàn thành
- Design System + trang showcase `/ui`.
- Auth (đăng ký/đăng nhập/đăng xuất qua email + password), route guard.
- Thư viện bài học: upload, xem danh sách, xóa, trạng thái cập nhật qua Realtime.
- Xử lý AI nền dạng **chunked**: audio được chia thành các đoạn ~6 phút phía client
  (`chunkAudioFile`), mỗi đoạn gọi riêng Edge Function `transcribe-chunk` (stateless,
  không truy cập DB) rồi client insert kết quả từng chunk vào `lesson_sentences` ngay
  lập tức — không gom hết rồi mới insert một lần. Nhờ vậy nếu một chunk giữa chừng lỗi
  (hết quota, mạng chập chờn...), các chunk trước đó không bị mất.
- **Tính năng Retry** cho bài học `failed`: tải lại audio gốc từ Storage, chunk lại y
  hệt (cùng file + cùng độ dài chunk ⇒ cùng ranh giới), bỏ qua các `chunk_index` đã có
  sẵn trong `lesson_sentences`, chỉ xử lý tiếp phần còn thiếu — không tốn lại quota
  Gemini cho phần đã xong. Nút Retry hiện trên `LessonCard` khi `status === 'failed'`.
- Trang học: audio player phát file thật (signed URL), click câu để tua, bôi đen để lưu
  từ vựng. Đã nâng cấp UI/UX (xem [[decisions]]): transcript dạng block mỗi câu một
  dòng, active sentence có border trái + dim câu khác, auto-scroll theo câu đang phát
  (giữ ở ~35% viewport), toggle bật/tắt auto-scroll + nút "về câu đang phát", player
  sticky ở top khi cuộn, phím tắt (Space = play/pause, ←/→ = chuyển câu), touch target
  nút Play ≥44px, bỏ waveform giả (chỉ còn 1 progress bar).
- Trang từ vựng: danh sách + tìm kiếm.
- Đã verify toàn bộ pipeline bằng **audio thật** (~1h50m, audiobook thật) trên project
  Supabase thật (không mock): 19 chunk, 1107 câu, nội dung + timestamp đúng, click-seek
  chính xác, Retry đã tự resume đúng giữa một lần chạy thật.
- `fetchLessonSentences` phân trang qua `.range()` để lấy hết toàn bộ câu — PostgREST
  giới hạn 1000 dòng/request mặc định từng khiến bài học 1107 câu chỉ hiển thị 1000
  câu đầu (mất câu ở cuối một cách âm thầm), đã fix.
- **Tự động nén audio phía client trước khi upload** (`src/shared/lib/audio-compression.ts`,
  ffmpeg.wasm): người dùng không cần tự nén file bằng tool ngoài nữa. Mono, AAC/`.m4a`,
  bitrate/sample-rate tự tính theo độ dài file (budget ~45MB, clamp 16-64kbps — xem
  [[decisions]] để biết lý do hạ floor từ 24 xuống 16kbps) để vừa giới hạn Storage 50MB.
  `MAX_UPLOAD_SIZE_BYTES` giờ áp cho file đã nén (không phải file gốc); thêm
  `MAX_RAW_UPLOAD_SIZE_BYTES` (1GB) chặn file gốc quá khổ trước khi thử nén. `LessonCard`
  hiện tiến độ xử lý chunk (`processing_step`).
- **Chunking audio dựa trên ffmpeg segment muxer (`-c copy`, stream-copy)** thay vì decode
  toàn bộ file vào PCM qua Web Audio API — xem [[decisions]] để biết bug thực tế đã gặp và
  lý do fix. Nhờ đó scale được với audio bất kỳ độ dài nào (không còn giới hạn bởi RAM).
- Đã verify thật với file audiobook 436MB/~5h03m (dài nhất từng test): nén xong ~45MB
  trong 78s không crash tab, đúng công thức tính toán; chunking bằng ffmpeg segment xử lý
  đúng nhiều chunk liên tiếp (verify tới chunk 28/51 = 1677 câu trước khi người dùng chủ
  động dừng để tiết kiệm quota Gemini — không phải lỗi).

## Trạng thái từng phần
| Phần | Trạng thái |
|---|---|
| Auth | Hoàn thành, đã test thật |
| Thư viện bài học (upload/list/xóa) | Hoàn thành, đã test thật |
| Xử lý AI nền (chunking + Gemini) | Hoàn thành, đã test thật với audio 1h50m và 5h03m |
| Retry khi xử lý lỗi giữa chừng | Hoàn thành, đã test thật (resume đúng, không trùng dữ liệu) |
| Trang học — audio player + transcript | Hoàn thành phần lõi + đã nâng cấp UI/UX (Phase 1+2), đã verify bằng Playwright thật (desktop, mobile, dark mode) |
| Trang từ vựng | Hoàn thành (chưa qua vòng review UI/UX riêng) |
| `fetchLessonSentences` phân trang | Hoàn thành, đã fix bug 1000-row |
| Tự động nén audio trước upload | Hoàn thành, đã test thật (file 436MB + file ngắn full pipeline) |
| Chunking bằng ffmpeg segment (thay decode PCM) | Hoàn thành, đã test thật (không còn lỗi "Unable to decode audio data" với file dài) |

## Bước tiếp theo cần làm
1. Loop-theo-câu (A-B loop) — tính năng học lõi cho phương pháp Effortless English,
   đã đề xuất trong review UI/UX (Phase 3) nhưng chưa làm.
2. Tuỳ chỉnh cỡ chữ transcript theo ý người dùng (Phase 3, chưa làm).
3. Cấu hình custom SMTP cho Supabase Auth trước khi có nhiều người dùng thật (rate
   limit mặc định thấp — đã ghi nhận từ trước, vẫn còn hiệu lực, chưa làm).
4. Bài học test thật "Diary of a Wimpy Kid 9 The Long Haul" (tài khoản
   `linhnguyenphuong59+test1@gmail.com`) đang ở trạng thái `failed` dừng giữa chừng ở
   chunk 28/51 (dừng chủ động để tiết kiệm quota, không phải lỗi) — có thể bấm Retry
   trên `LessonCard` để tiếp tục xử lý 23 chunk còn lại bất cứ lúc nào, không tốn lại
   quota cho phần đã xong.
5. File cực dài bất thường (nhiều giờ hơn nữa) về lý thuyết vẫn có thể vượt 50MB dù đã
   ở bitrate floor thấp nhất (16kbps) — hiện chỉ báo lỗi rõ ràng yêu cầu người dùng chia
   nhỏ file, chưa có giải pháp tự động (vd tăng giới hạn Storage nếu plan cho phép, hoặc
   chia nhiều file).
