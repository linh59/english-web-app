# English App — CLAUDE.md (V1)

Ứng dụng học tiếng Anh từ audio dài (>1h): upload audio → AI sinh transcript + chia câu + timestamp → nghe và học theo câu → lưu từ vựng.

File này mô tả kiến trúc và quy tắc code cho **V1**. Không thiết kế trước cho V2/V3 (xem "Chưa làm trong V1" bên dưới).

## Cách dùng file này

Đây là file **index**, không chứa đầy đủ quy tắc. Chi tiết theo từng chủ đề nằm ở các
file riêng trong [.claude/rules/](.claude/rules/) — mỗi file 1 chủ đề rõ ràng, có
frontmatter `description` nói khi nào nên đọc. Quy trình cho mỗi task:

1. Đọc bảng điều hướng bên dưới, xác định (các) file `.claude/rules/*.md` liên quan
   trực tiếp đến task hiện tại (vd: sửa store → đọc `pinia.md`; thêm text hiển thị →
   đọc `i18n.md`).
2. Đọc (các) file đó **trước khi** viết code — chúng chứa quy tắc bắt buộc, không phải
   tham khảo tùy chọn.
3. Không cần đọc hết tất cả file mỗi lần — chỉ đọc file liên quan đến phần đang làm.
   `decisions.md` là ngoại lệ đáng cân nhắc đọc rộng hơn: trước khi đổi lại một cách
   tiếp cận đã có (model AI, format audio, cách chunk...), kiểm tra ở đó xem đã có lý
   do/thử nghiệm trước đó chưa.
4. Các file rules dùng cú pháp `[[tên-file]]` để trỏ chéo sang nhau — theo đúng file đó
   trong cùng thư mục khi cần thêm ngữ cảnh.

## Phạm vi V1

1. Auth: đăng ký / đăng nhập / đăng xuất (Supabase Auth)
2. Thư viện bài học: upload audio, xem danh sách, xóa
3. Xử lý AI nền: transcript → chia câu → timestamp (Gemini), chạy background vì audio thường >1h
4. Trang học: audio player + danh sách câu, click câu để tua đến đúng vị trí
5. Từ vựng: chọn từ/cụm từ, lưu kèm câu ví dụ
6. Trang từ vựng: danh sách, tìm kiếm

**Chưa làm trong V1**: YouTube link import, flashcard, FSRS, shadowing, pronunciation scoring, AI chat, grammar, social, leaderboard, notification, offline/PWA, folder, tag, thống kê/dashboard nâng cao.

## Công nghệ

- Frontend: Vue 3 (Composition API + `<script setup>`), TypeScript, Vite, TailwindCSS v4, Vue Router, Pinia
- UI kit: shadcn-vue (base: reka-ui, style "mira", copy code trực tiếp vào repo — không phải black-box dependency) + Lucide icon (`@lucide/vue`)
- Đa ngôn ngữ: vue-i18n (English + Tiếng Việt mặc định)
- Backend: Supabase (Postgres + Auth + Storage + Edge Functions + Realtime)
- AI: Gemini (STT trực tiếp từ audio + LLM để chia câu/sinh timestamp)
- Nén/cắt audio phía client: ffmpeg.wasm (single-threaded core, self-hosted)

Không dùng framework/thư viện nào ngoài danh sách trên trừ khi thực sự cần thiết cho V1.

## Điều hướng chi tiết

| Chủ đề | File | Đọc khi nào |
|---|---|---|
| Trạng thái hiện tại | [status.md](.claude/rules/status.md) | Cần biết phần nào đã xong/chưa, bước tiếp theo, trước khi bắt đầu bất kỳ task nào không rõ nên làm gì |
| Quyết định kiến trúc & lý do | [decisions.md](.claude/rules/decisions.md) | Trước khi đổi lại một quyết định kỹ thuật đã có (model Gemini, format/bitrate audio, cách chunk, timeout...) |
| Cấu trúc thư mục & feature-first | [architecture.md](.claude/rules/architecture.md) | Tạo file/thư mục mới, quyết định code nên nằm ở feature nào hay `shared/` |
| Database & Supabase | [database.md](.claude/rules/database.md) | Thêm/sửa bảng, RLS policy, Storage, migration, gọi Supabase |
| Quy tắc Vue | [vue.md](.claude/rules/vue.md) | Tạo/sửa file `.vue` |
| Quy tắc TypeScript | [typescript.md](.claude/rules/typescript.md) | Khai báo type/interface domain mới |
| Quy tắc Pinia | [pinia.md](.claude/rules/pinia.md) | Tạo/sửa file trong `stores/` |
| Quy tắc UI & Responsive | [ui.md](.claude/rules/ui.md) | Viết template/style, tạo component UI mới |
| Đa ngôn ngữ (i18n) | [i18n.md](.claude/rules/i18n.md) | Thêm bất kỳ text hiển thị nào cho người dùng |
| Quy tắc đặt tên | [naming.md](.claude/rules/naming.md) | Đặt tên file, route, cột DB |
| Checklist tính năng mới | [checklist.md](.claude/rules/checklist.md) | Bắt đầu một tính năng mới từ đầu |
