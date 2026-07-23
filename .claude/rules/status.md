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
  (giữ ở ~35% viewport), phím tắt (Space = play/pause, ←/→ = chuyển câu), touch target
  nút Play ≥44px, bỏ waveform giả (chỉ còn 1 progress bar). (Bố cục player/auto-scroll đã
  đổi lại tiếp theo phản hồi UX mobile — xem bullet riêng bên dưới.)
- Trang từ vựng: danh sách + tìm kiếm.
- **Mobile UX overhaul cho trang học** (phản hồi thực tế sau khi dùng trên điện thoại):
  - **Resume vị trí nghe**: cột `last_position_seconds` mới trên bảng `lessons`, ghi lại
    qua nhiều trigger (pause, tab bị ẩn/`visibilitychange`, đóng tab/`pagehide`, rời trang
    trong app, cộng thêm interval 5s làm lưới an toàn) chứ không chỉ 1 sự kiện — vì audio
    thường vẫn đang phát (chưa pause) đúng lúc người dùng tắt màn hình hay chuyển tab.
    Tự động seek lại đúng chỗ khi mở lại bài học (trừ khi có deep-link `?t=` từ trang từ
    vựng, cái đó ưu tiên hơn). Đồng bộ qua Supabase (không phải localStorage) nên nghe dở
    trên điện thoại rồi mở laptop vẫn tiếp tục đúng chỗ.
  - **Mobile navigation**: thêm `BottomNav` (tab Library/Từ vựng, `sm:hidden`) — trước đó
    `Navbar` ẩn hẳn 2 link này dưới breakpoint `sm` mà không có gì thay thế, trên điện
    thoại không có cách nào chuyển trang. Tự ẩn khi đang ở trang học để nhường không gian
    cho transcript, thay bằng nút back tích hợp trong thanh player.
  - **Lưu từ vựng trên mobile**: `Transcript.vue` thêm `touchend`/`touchstart` (trước đó
    luồng chọn-từ chỉ có `mouseup`/`mousedown`, 0 touch listener nào). `VocabularyPopup`
    giờ responsive theo `useMediaQuery('(min-width: 640px)')`: dưới `sm` render thành
    bottom sheet full-width trượt lên từ đáy (nút Save/Cancel ≥44px), trên `sm` giữ nguyên
    popup nổi định vị theo toạ độ chọn chữ như cũ — vì popup rộng cố định 288px định vị
    theo pixel tuyệt đối từng có thể tràn ra ngoài màn hình hẹp.
  - **Bố cục player + bỏ toggle Auto-scroll**: `AudioPlayer` chuyển từ sticky-top (gộp
    chung khối với thanh options, chiếm nhiều chiều cao đầu trang) sang thanh riêng
    `LessonPlayerBar` cố định đáy màn hình (mọi breakpoint, không chỉ mobile — cùng
    pattern Spotify/YouTube Music). Thanh trên giờ chỉ còn counter + toggle dịch, rất
    mỏng. Toggle Auto-scroll bị xoá hẳn (từng có bug thật: bật lại switch không cuộn
    ngay, chỉ cần cuộn 1px là tự tắt — khiến người dùng thấy nó "luôn disable"), thay
    bằng 1 nút nổi "về câu đang phát" tự hiện khi cần; kèm sửa 2 nguyên nhân gốc (ngưỡng
    scroll trước khi tắt auto-follow, `ResizeObserver` thay vì chỉ dựa `window resize`).
    Logic auto-scroll tách ra composable `useAutoFollowScroll` (feature `lessons`) để
    giữ trang học dưới ~300 dòng theo [[vue]].
  - Đã type-check (`vue-tsc -b`) + `npm run build` sạch, dev server boot/serve bình
    thường. **Chưa** test tương tác thật (touch thật, resume qua lại thiết bị, bottom
    sheet lưu từ vựng) — môi trường code lúc làm không có trình duyệt tương tác/tài khoản
    thật để verify, xem mục "Bước tiếp theo" bên dưới.
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
  đúng nhiều chunk liên tiếp — sau đó đã bấm Retry để xử lý nốt phần còn lại, bài học này
  giờ ở trạng thái `done` hoàn chỉnh.
- **Bản dịch tiếng Việt hiển thị dưới câu transcript đang active**: `transcribe-chunk`
  sinh thêm field `translation` cho mỗi câu ngay trong cùng 1 lệnh gọi Gemini đã có (không
  tốn thêm quota, không gọi AI lúc user học — xem [[decisions]]). Lưu ở bảng riêng
  `lesson_sentence_translations` (không phải cột trong `lesson_sentences`) để mở rộng đa
  ngôn ngữ sau này không cần migrate. Toggle bật/tắt hiển thị (mặc định BẬT, persist qua
  localStorage giống theme/locale). Bài học cũ (đã `done` trước khi có tính năng này) có
  nút "Dịch lại" trên `LessonCard` — dịch text đã lưu qua Edge Function mới
  `translate-lesson-chunk` (text-only, không audio, không transcribe lại), resume theo
  `chunk_index` giống cơ chế Retry. Nút "Dịch lại" hiện/ẩn dựa trên **đếm thật** số câu
  chưa có bản dịch (RPC `get_lessons_translation_progress`), không dựa vào cột
  `translation_status` (cột này chỉ để hiện spinner — dễ bị kẹt sai nếu tab đóng giữa
  chừng, xem [[decisions]]).

## Trạng thái từng phần
| Phần | Trạng thái |
|---|---|
| Auth | Hoàn thành, đã test thật |
| Thư viện bài học (upload/list/xóa) | Hoàn thành, đã test thật |
| Xử lý AI nền (chunking + Gemini) | Hoàn thành, đã test thật với audio 1h50m và 5h03m |
| Retry khi xử lý lỗi giữa chừng | Hoàn thành, đã test thật (resume đúng, không trùng dữ liệu) |
| Trang học — audio player + transcript | Hoàn thành phần lõi + đã nâng cấp UI/UX (Phase 1+2), đã verify bằng Playwright thật (desktop, mobile, dark mode) |
| Trang từ vựng | Hoàn thành (chưa qua vòng review UI/UX riêng) |
| Mobile UX overhaul (resume vị trí, bottom nav, lưu từ vựng bottom sheet, bố cục player) | Code xong, type-check + build sạch, migration đã áp dụng lên Supabase thật — **chưa** test tương tác thật trên thiết bị/trình duyệt thật |
| `fetchLessonSentences` phân trang | Hoàn thành, đã fix bug 1000-row |
| Tự động nén audio trước upload | Hoàn thành, đã test thật (file 436MB + file ngắn full pipeline) |
| Chunking bằng ffmpeg segment (thay decode PCM) | Hoàn thành, đã test thật (không còn lỗi "Unable to decode audio data" với file dài) |
| Bản dịch câu (hiển thị + retrofit "Dịch lại") | Hoàn thành, đã test thật (pipeline mới, toggle, retrofit, resume sau khi kẹt trạng thái, RLS) |

## Bước tiếp theo cần làm
1. Loop-theo-câu (A-B loop) — tính năng học lõi cho phương pháp Effortless English,
   đã đề xuất trong review UI/UX (Phase 3) nhưng chưa làm.
2. Tuỳ chỉnh cỡ chữ transcript theo ý người dùng (Phase 3, chưa làm).
3. Cấu hình custom SMTP cho Supabase Auth trước khi có nhiều người dùng thật (rate
   limit mặc định thấp — đã ghi nhận từ trước, vẫn còn hiệu lực, chưa làm).
4. File cực dài bất thường (nhiều giờ hơn nữa) về lý thuyết vẫn có thể vượt 50MB dù đã
   ở bitrate floor thấp nhất (16kbps) — hiện chỉ báo lỗi rõ ràng yêu cầu người dùng chia
   nhỏ file, chưa có giải pháp tự động (vd tăng giới hạn Storage nếu plan cho phép, hoặc
   chia nhiều file).
5. Các bài học `done` có sẵn từ trước khi có tính năng dịch (vd 2 audiobook Diary of a
   Wimpy Kid trong tài khoản test) chưa có bản dịch cho tới khi người dùng tự bấm "Dịch
   lại" trên `LessonCard` — mỗi bài ~17-18 chunk nên tốn tương ứng ~17-18 lệnh gọi Gemini
   nếu bấm (chưa bấm, cố tình để dành quota, chỉ verify luồng "Dịch lại" trên 1 bài học
   test ngắn 4 câu).
6. Test tương tác thật (touch thật trên điện thoại, hoặc ít nhất DevTools mobile
   emulation) cho mobile UX overhaul vừa làm: resume vị trí nghe qua lại giữa các trang/
   thiết bị, bottom nav, bottom sheet lưu từ vựng, nút nổi "về câu đang phát". Đã
   type-check/build sạch và migration đã lên Supabase thật, nhưng chưa ai thao tác thử
   trên UI thật.
