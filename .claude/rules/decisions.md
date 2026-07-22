---
name: decisions
description: Log các quyết định kiến trúc/kỹ thuật quan trọng và lý do — đọc trước khi định đổi lại một quyết định đã có ở đây
---

# Quyết định quan trọng và lý do

- **Chunked client-side processing thay vì 1 lần gọi Edge Function cho cả file**:
  Edge Function có trần thời gian chạy cứng mà `EdgeRuntime.waitUntil()` cũng không
  vượt qua được — verify thực tế bằng audio 1h50m bị kill giữa chừng không báo lỗi.
  Giải pháp: chia audio thành chunk ~6 phút phía client, gọi Edge Function
  `transcribe-chunk` (stateless) riêng cho từng chunk.
- **Lưu sentences ngay khi mỗi chunk xong** (không gom hết rồi mới insert 1 lần): để
  không mất dữ liệu các chunk đã xử lý thành công khi một chunk sau đó lỗi (hết quota,
  mạng...) — đổi từ thiết kế ban đầu sau khi phát hiện vấn đề này khi test thật.
- **Model Gemini: `gemini-flash-lite-latest`** (không phải `gemini-3.5-flash`/
  `gemini-2.5-flash` như từng thử): key/project thật đã từ chối thẳng
  `gemini-2.5-flash`/`gemini-2.5-flash-lite` (404 "no longer available to new users")
  và cho quota free-tier = 0 với `gemini-2.0-flash`/`gemini-2.0-flash-lite`. Chọn alias
  `-latest` vì Google giữ nó luôn trỏ vào model flash nhẹ hiện hành, tránh lặp lại vấn
  đề "model bị deprecate" trong tương lai.
  ⚠️ Lưu ý khi thay đổi tiếp: đây là quyết định theo đúng **key/project hiện tại**; nếu
  đổi API key khác có thể cần kiểm tra lại quyền truy cập model tương tự.
- **`supabase.functions.invoke()` cần set `timeout` tường minh**: SDK không có timeout
  mặc định — nếu một lần gọi Edge Function bị treo (đã gặp thật), client sẽ chờ vĩnh
  viễn, bỏ qua toàn bộ logic retry. Đã set `timeout: 90_000` cho mỗi lần gọi
  `transcribe-chunk`.
- **UI transcript: dim câu không active + border trái thay vì chỉ đổi màu nền nhạt**:
  hệ màu của app là monochrome thuần (không có hue riêng cho primary), nên chỉ đổi màu
  nền không đủ nổi bật giữa transcript dài hàng giờ — quyết định sau một vòng review
  UI/UX riêng (tham chiếu Kindle/Speechify/ELSA Speak), đã verify bằng ảnh chụp thật cả
  light/dark mode.
- **Auto-scroll giữ câu active ở ~35% chiều cao viewport (không phải chính giữa)**:
  người học cần thấy câu sắp tới nhiều hơn câu đã qua (nghe trước, đọc theo), giống
  pattern caption karaoke-style của Speechify.
- **Bỏ `WaveformPlaceholder`**: component waveform là giả (random cố định theo seed,
  không phân tích audio thật), tồn tại song song với 1 range-slider khác cùng thể hiện
  tiến trình nghe — gây trùng lặp chức năng mà không thêm thông tin thật, dễ khiến
  người dùng hiểu lầm đó là biên độ âm thanh thật. Đã xóa hẳn component (không dùng ở
  đâu khác trong code).
- **Nén audio: ffmpeg.wasm (client-side, single-threaded core), không phải server-side
  ffmpeg hay `MediaRecorder`**: Edge Function (Deno Deploy) không thể gọi binary ffmpeg
  gốc — cùng giới hạn platform đã buộc transcription phải chunk phía client. `MediaRecorder`
  bị loại vì nó nén theo thời gian thực (phát lại toàn bộ audio) — file 5 tiếng sẽ mất
  5 tiếng thực để nén, không khả thi. Core đa luồng (`@ffmpeg/core-mt`) cần header
  COOP/COEP toàn site (rủi ro hạ tầng), nên chọn core đơn luồng (chậm hơn nhưng không
  cần đổi gì ở hosting) — đúng tinh thần ưu tiên đơn giản/ổn định.
  ⚠️ Ban đầu core được self-host qua `scripts/copy-ffmpeg-core.mjs` (postinstall,
  copy vào `public/ffmpeg/`, gitignored) để không phụ thuộc CDN ngoài lúc runtime.
  Đã đổi lại sau khi deploy thật lên Cloudflare Pages bị chặn cứng ("Pages only
  supports files up to 25 MiB") — `ffmpeg-core.wasm` ~30.7MB nằm trong `public/` bị
  Vite copy thẳng vào output deploy, vượt giới hạn platform không cách nào lách được
  dù file chỉ lazy-load lúc runtime. Chuyển sang load core từ jsDelivr
  (`https://cdn.jsdelivr.net/npm/@ffmpeg/core@<version>/dist/esm/`, pin đúng version
  khớp `@ffmpeg/core` trong `package.json`) — đúng pattern chính thức của ffmpeg.wasm
  docs, chấp nhận đánh đổi quay lại phụ thuộc CDN bên thứ ba vì jsDelivr có SLA cao
  (multi-CDN backing) và core vẫn chỉ được fetch lazy khi người dùng thực sự upload
  audio, không nằm trên critical path của app.
- **Format nén: mono AAC/`.m4a`, không phải Opus/WebM dù Opus tiết kiệm bit hơn ở
  bitrate thấp**: file nén được phát trực tiếp qua `<audio>` (không chỉ dùng để
  transcribe), mà Opus-trong-WebM không chạy ổn định trên Safari. AAC/`.m4a` phát được
  mọi trình duyệt, đánh đổi lấy chất lượng thấp hơn Opus ở cùng bitrate (chấp nhận được
  vì chỉ cần đủ nghe rõ, không cần Hi-Fi).
- **Bitrate/sample-rate tự thích ứng theo độ dài file** (không dùng 1 mức cố định):
  app này target audio "dài >1h" (xem [[overview]] — Phạm vi V1), một mức bitrate cố
  định (vd 48kbps) sẽ khiến bài học dài thường xuyên vượt 50MB. Công thức: budget 45MB,
  `bitrate = clamp(budget*8/duration/1000, 16, 64)` kbps, sample rate 16kHz nếu ≤32kbps
  else 22.05kHz.
  ⚠️ Floor ban đầu là 24kbps — hạ xuống 16kbps sau khi test thật với file 18198s (~5h)
  cho thấy floor 24 đẩy output lên ~52MB (vượt cap 50MB) vì bitrate lý tưởng thực tế của
  file đó chỉ ~20.7kbps mà bị floor 24 kéo ngược lên cao hơn nhu cầu. Với floor 16kbps,
  file thật này nén còn ~45MB (đúng budget). Dưới ~16kbps encoder AAC-LC gốc của ffmpeg
  (không có HE-AAC/SBR) nghe rè rõ rệt cho giọng nói — đây là điểm cân bằng đã verify
  bằng tai + `afinfo`, không phải số tùy ý.
- **Chunking dùng ffmpeg segment muxer (`-c copy`, stream-copy) thay vì decode toàn bộ
  file qua Web Audio API `decodeAudioData()`**: thiết kế ban đầu của `chunkAudioFile`
  decode cả file vào một buffer PCM Float32 trong RAM trước khi cắt chunk — với file
  5h03m (16kHz mono) tương đương ~1.16GB RAM, và trên thực tế báo lỗi thẳng "Unable to
  decode audio data" (không phải lý thuyết — gặp thật khi test file 436MB, lần đầu tiên
  có file dài đến mức này được test end-to-end; các lần test trước chỉ tới ~1h50m nên
  chưa từng lộ ra). Vì file đưa vào chunking đã luôn là file đã nén (AAC/`.m4a`, xem trên),
  segment muxer của ffmpeg cắt trực tiếp theo container/stream có sẵn mà không cần
  decode/re-encode gì cả — không có giới hạn RAM tăng theo độ dài audio nữa. Chunk output
  gửi lên Edge Function `transcribe-chunk` với Content-Type `audio/mp4` (không còn
  `audio/wav`) — không cần sửa gì ở Edge Function vì nó vốn đã forward `Content-Type`
  nhận được thẳng cho Gemini file API.
