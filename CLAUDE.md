# English App — CLAUDE.md (V1)

Ứng dụng học tiếng Anh từ audio dài (>1h): upload audio → AI sinh transcript + chia câu + timestamp → nghe và học theo câu → lưu từ vựng.

File này mô tả kiến trúc và quy tắc code cho **V1**. Không thiết kế trước cho V2/V3 (xem phần "Không làm trong V1" ở cuối).

## Trạng thái hiện tại

### Đã hoàn thành
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
  từ vựng. Đã nâng cấp UI/UX (xem mục quyết định bên dưới): transcript dạng block mỗi
  câu một dòng, active sentence có border trái + dim câu khác, auto-scroll theo câu
  đang phát (giữ ở ~35% viewport), toggle bật/tắt auto-scroll + nút "về câu đang phát",
  player sticky ở top khi cuộn, phím tắt (Space = play/pause, ←/→ = chuyển câu), touch
  target nút Play ≥44px, bỏ waveform giả (chỉ còn 1 progress bar).
- Trang từ vựng: danh sách + tìm kiếm.
- Đã verify toàn bộ pipeline bằng **audio thật** (~1h50m, audiobook thật) trên project
  Supabase thật (không mock): 19 chunk, 1107 câu, nội dung + timestamp đúng, click-seek
  chính xác, Retry đã tự resume đúng giữa một lần chạy thật.
- `fetchLessonSentences` phân trang qua `.range()` để lấy hết toàn bộ câu — PostgREST
  giới hạn 1000 dòng/request mặc định từng khiến bài học 1107 câu chỉ hiển thị 1000
  câu đầu (mất câu ở cuối một cách âm thầm), đã fix.

### Trạng thái từng phần
| Phần | Trạng thái |
|---|---|
| Auth | Hoàn thành, đã test thật |
| Thư viện bài học (upload/list/xóa) | Hoàn thành, đã test thật |
| Xử lý AI nền (chunking + Gemini) | Hoàn thành, đã test thật với audio 1h50m |
| Retry khi xử lý lỗi giữa chừng | Hoàn thành, đã test thật (resume đúng, không trùng dữ liệu) |
| Trang học — audio player + transcript | Hoàn thành phần lõi + đã nâng cấp UI/UX (Phase 1+2), đã verify bằng Playwright thật (desktop, mobile, dark mode) |
| Trang từ vựng | Hoàn thành (chưa qua vòng review UI/UX riêng) |
| `fetchLessonSentences` phân trang | Hoàn thành, đã fix bug 1000-row |

### Bước tiếp theo cần làm
1. Loop-theo-câu (A-B loop) — tính năng học lõi cho phương pháp Effortless English,
   đã đề xuất trong review UI/UX (Phase 3) nhưng chưa làm.
2. Tuỳ chỉnh cỡ chữ transcript theo ý người dùng (Phase 3, chưa làm).
3. Cấu hình custom SMTP cho Supabase Auth trước khi có nhiều người dùng thật (rate
   limit mặc định thấp — đã ghi nhận từ trước, vẫn còn hiệu lực, chưa làm).

### Quyết định quan trọng và lý do
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

## Phạm vi V1

1. Auth: đăng ký / đăng nhập / đăng xuất (Supabase Auth)
2. Thư viện bài học: upload audio, xem danh sách, xóa
3. Xử lý AI nền: transcript → chia câu → timestamp (Gemini), chạy background vì audio thường >1h
4. Trang học: audio player + danh sách câu, click câu để tua đến đúng vị trí
5. Từ vựng: chọn từ/cụm từ, lưu kèm câu ví dụ
6. Trang từ vựng: danh sách, tìm kiếm

**Chưa làm trong V1**: YouTube link import, flashcard, FSRS, shadowing, pronunciation scoring, AI chat, grammar, social, leaderboard, notification, offline/PWA, folder, tag, thống kê/dashboard nâng cao.

---

## Công nghệ

- Frontend: Vue 3 (Composition API + `<script setup>`), TypeScript, Vite, TailwindCSS v4, Vue Router, Pinia
- UI kit: shadcn-vue (base: reka-ui, style "mira", copy code trực tiếp vào repo — không phải black-box dependency) + Lucide icon (`@lucide/vue`)
- Đa ngôn ngữ: vue-i18n (English + Tiếng Việt mặc định)
- Backend: Supabase (Postgres + Auth + Storage + Edge Functions + Realtime)
- AI: Gemini (STT trực tiếp từ audio + LLM để chia câu/sinh timestamp)

Không dùng framework/thư viện nào ngoài danh sách trên trừ khi thực sự cần thiết cho V1.

---

## Cấu trúc thư mục (Feature First)

```
src/
  app/
    App.vue
    main.ts
    router/
      index.ts               # route /ui chỉ đăng ký khi import.meta.env.DEV
  features/
    dev-ui/                   # trang showcase design system, dev-only
      pages/UiShowcasePage.vue
      components/             # 1 file section cho mỗi nhóm component
      locales/{en,vi}.json
    auth/                      # CHƯA XÂY — sẽ theo cấu trúc dưới đây khi làm
      components/
      pages/                    # LoginPage.vue, SignupPage.vue
      stores/                    # auth.store.ts
      locales/{en,vi}.json
      types.ts
    lessons/                    # CHƯA XÂY
      components/
      pages/                      # LibraryPage.vue, LessonStudyPage.vue
      stores/                     # lessons.store.ts
      locales/{en,vi}.json
      types.ts
    vocabulary/                  # CHƯA XÂY
      components/
      pages/                        # VocabularyPage.vue
      stores/                       # vocabulary.store.ts
      locales/{en,vi}.json
      types.ts
  shared/
    components/
      ui/                        # primitive shadcn-vue (Button, Input, Dialog, Dropdown, Popover, Tooltip, Card, Badge, Alert, Skeleton, Switch, Textarea, Label...)
      AudioPlayer/                 # + PlaybackSpeedControl, LoopButton
      Transcript/                  # + TranscriptSentence, SelectedTextToolbar, types.ts
      VocabularyPopup/
      LessonCard/
      VocabularyCard/
      EmptyState/
      Progress/
      Spinner/
      WaveformPlaceholder/
      Navbar/                       # + ThemeToggle, LocaleSwitcher
    composables/
      useTheme.ts
    lib/
      utils.ts                     # cn() — clsx + tailwind-merge (quy ước shadcn-vue)
      i18n.ts                      # setup vue-i18n, tự gom locale theo feature qua import.meta.glob
      format.ts                    # formatDuration()...
    locales/{en,vi}.json            # string dùng chung: save/cancel/delete/loading/lỗi chung...
    styles/
      tokens.css                    # design token (xem docs/design-system.md)
supabase/
  migrations/
  functions/
    process-lesson/                 # Edge Function: gọi Gemini, chia chunk nếu cần, ghi transcript + câu + timestamp
docs/
  design-system.md
components.json                      # cấu hình shadcn-vue CLI — alias đã trỏ vào src/shared/...
```

Quy tắc:
- Mỗi feature tự chứa component/page/store/locale/types của nó.
- Feature được phép import từ `shared/`, không import ngược từ feature khác sang `shared/`.
- Feature này được phép dùng store/composable public của feature khác khi cần (vd: `lessons` gọi `vocabulary.store` để lưu từ khi người dùng chọn text trong trang học). Không tạo layer trung gian cho việc này.
- Không tạo `services/` hoặc `repositories/` riêng — Supabase call nằm thẳng trong store action hoặc composable. Chỉ tách ra khi logic thực sự lặp lại ở nhiều nơi.
- Component UI dùng chung (không phải primitive shadcn) chỉ vào `shared/components/` khi thực sự dùng lại ở ≥2 nơi, hoặc là component đặc thù nghiệp vụ đã biết trước sẽ tái sử dụng (như các component trong `docs/design-system.md`). Luôn kiểm tra `/ui` trước khi tạo component mới.

---

## Database & Supabase

Bảng chính (V1):
- `lessons`: id, user_id, title, audio_path, status (`pending | processing | done | failed`), duration_seconds, created_at
- `lesson_sentences`: id, lesson_id, sentence_index, text, start_time, end_time
- `vocabulary`: id, user_id, lesson_id (nullable), word, meaning, example_sentence, created_at

Quy tắc:
- **RLS bật cho mọi bảng từ ngày đầu**, kể cả khi chỉ có 1 user. Policy chuẩn: `user_id = auth.uid()`.
- Storage bucket `audio`, path dạng `{user_id}/{lesson_id}.{ext}`, RLS giới hạn user chỉ truy cập folder của mình.
- Mọi thay đổi schema đi qua `supabase/migrations`, không sửa trực tiếp qua dashboard rồi quên đồng bộ.
- Gemini API key chỉ được dùng trong Edge Function (server-side). Không bao giờ gọi Gemini trực tiếp từ frontend vì sẽ lộ key.
- Trạng thái xử lý (`status`) của `lessons` cập nhật qua Edge Function; frontend theo dõi bằng **Supabase Realtime subscription** trên bảng `lessons` (không polling thủ công).
- Audio dài nên Edge Function cần chia nhỏ (chunk) trước khi gửi Gemini nếu vượt giới hạn, rồi ghép transcript lại theo thứ tự — xử lý bên trong 1 function, chưa cần queue system riêng cho V1.

---

## Quy tắc Vue

- Chỉ dùng Composition API + `<script setup lang="ts">`. Không dùng Options API.
- Props/emits khai báo qua `defineProps<T>()` / `defineEmits<T>()` với type rõ ràng, không dùng runtime declaration khi không cần.
- Component chỉ nhận props/emit sự kiện, không tự ý gọi Supabase trực tiếp trong component nếu logic có thể nằm trong store/composable dùng lại được — nhưng cũng không bắt buộc tách composable nếu component đó là nơi duy nhất dùng logic đó.
- Không tạo component tái sử dụng (`shared/components`) trước khi có nhu cầu dùng lại thật sự (≥2 nơi).
- Mỗi file component nên dưới ~300 dòng. Nếu vượt, tách phần hiển thị con ra file riêng trong cùng feature (xem `AudioPlayer/` hoặc `Transcript/` làm ví dụ tách component con).

## Quy tắc TypeScript

- `strict: true` trong tsconfig.
- Định nghĩa type dữ liệu domain (Lesson, Sentence, VocabularyItem, ...) trong `types.ts` của từng feature, không dùng `any`.
- Type của Supabase response nên khai báo tay theo bảng (interface khớp cột DB), chưa cần generate type tự động cho V1 nếu team chỉ 1 người — nhưng nếu dùng `supabase gen types typescript`, đặt kết quả tại `src/shared/lib/database.types.ts`.

## Quy tắc Pinia

- Mỗi feature domain có tối đa 1 store (`auth`, `lessons`, `vocabulary`). Không tách nhỏ store hơn nữa cho V1.
- Store chứa state + actions gọi Supabase trực tiếp. Không thêm getters phức tạp khi computed đơn giản trong component là đủ.
- Đặt tên store theo `useXStore` (vd: `useLessonsStore`), file `stores/lessons.store.ts`.
- Chỉ `app.use(pinia)` trong `main.ts` khi store đầu tiên thực sự được tạo — đừng đăng ký Pinia "phòng khi cần" trước đó.

## Quy tắc UI

- Component UI dựng trên design token đã có (`shared/styles/tokens.css`) — dùng class Tailwind như `bg-primary`, `text-muted-foreground`, `border-border`. Không hardcode màu/spacing ngoài token.
- Ưu tiên tái sử dụng component có sẵn trong `shared/components/ui/` (shadcn-vue) và component đặc thù trong `shared/components/` — xem đầy đủ tại `/ui` (chạy `npm run dev`, mở `/ui`) và `docs/design-system.md` trước khi tạo mới.
- Chỉ thêm component/variant mới khi màn hình V1 thật sự cần — xem danh sách "đã cắt" trong `docs/design-system.md` trước khi tự ý thêm lại (Table, Select, Date Picker, Avatar, Tabs, Sidebar dùng chung...).
- TailwindCSS utility-first, viết class thẳng trong template. Không tạo file CSS riêng trừ khi cần global reset.
- Route `/ui` phải luôn ở dạng dev-only (đăng ký có điều kiện theo `import.meta.env.DEV` trong `router/index.ts`) — không xóa điều kiện này.

## Responsive

- Thiết kế mobile-first (người dùng có thể nghe/học trên điện thoại), test ở breakpoint nhỏ trước khi mở rộng lên desktop/tablet.
- Dùng spacing/scale mặc định của Tailwind, tránh giá trị tùy chỉnh một lần (`mt-[13px]`).

## Đa ngôn ngữ (i18n)

- Toàn bộ text hiển thị cho người dùng trong tính năng thật phải qua `t()`, **không hardcode**. String dùng chung ở `shared/locales/{en,vi}.json` (namespace `common`), còn lại đặt tại `features/<tên feature>/locales/{en,vi}.json` (namespace = tên thư mục feature).
- Mỗi khi thêm text hiển thị mới: thêm key vào **cả** `en.json` và `vi.json` của đúng feature đó — không thêm string trực tiếp vào template.
- `shared/lib/i18n.ts` tự động gom locale theo feature qua `import.meta.glob` — không cần sửa cấu hình khi thêm feature mới. Thêm ngôn ngữ mới: thêm vào hằng số `SUPPORTED_LOCALES` + thêm file json cho từng feature, không sửa component.
- Ngoại lệ: nội dung mẫu/demo bên trong các section của `/ui` không bắt buộc qua i18n (dev tool, không phải sản phẩm thật) — chỉ khung của chính trang showcase mới cần.

## Quy tắc đặt tên

- Component: PascalCase (`LessonCard.vue`)
- Composable: camelCase, tiền tố `use` (`useAudioPlayer.ts`)
- Store file: `feature.store.ts`, export `useFeatureStore`
- Route path: kebab-case (`/lessons`, `/lessons/:id`, `/vocabulary`)
- Bảng/cột DB: snake_case
- Locale file: `locales/en.json`, `locales/vi.json` trong mỗi feature/`shared`

---

## Checklist khi tạo tính năng mới

1. Xác định tính năng thuộc feature nào trong `src/features/`, tạo folder nếu chưa có (theo mẫu cấu trúc ở trên).
2. Kiểm tra `/ui` và `docs/design-system.md` — tái sử dụng component có sẵn trước khi tạo mới.
3. Định nghĩa type dữ liệu trong `types.ts` của feature.
4. Nếu cần lưu trữ: thêm migration trong `supabase/migrations`, bật RLS, viết policy theo `user_id = auth.uid()`.
5. Nếu cần state dùng chung giữa nhiều component: thêm action/state vào store của feature (không tạo store mới nếu đã có store phù hợp).
6. Thêm route trong `app/router/index.ts` nếu có page mới.
7. Thêm key locale vào `features/<feature>/locales/{en,vi}.json` cho mọi text hiển thị mới — không hardcode.
8. Build component/page, ưu tiên đơn giản, không thêm option/config chưa ai yêu cầu.
9. Test thủ công: happy path + ít nhất 1 edge case (vd: audio quá dài, mất mạng khi xử lý, danh sách rỗng, chuyển đổi ngôn ngữ/theme).
10. Kiểm tra lại: file có vượt ~300 dòng không, có tạo abstraction/service layer thừa không, có thêm tính năng nằm ngoài phạm vi V1 không.
