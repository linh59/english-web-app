---
name: architecture
description: Cấu trúc thư mục Feature First và quy tắc import giữa feature/shared — đọc khi tạo file/thư mục mới hoặc quyết định code nên nằm ở đâu
---

# Cấu trúc thư mục (Feature First)

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
    auth/
      components/
      pages/                    # LoginPage.vue, SignupPage.vue
      stores/                    # auth.store.ts
      locales/{en,vi}.json
      types.ts
    lessons/
      components/
      pages/                      # LibraryPage.vue, LessonStudyPage.vue
      stores/                     # lessons.store.ts
      locales/{en,vi}.json
      types.ts
    vocabulary/
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
      Navbar/                       # + ThemeToggle, LocaleSwitcher
    composables/
      useTheme.ts
    lib/
      utils.ts                     # cn() — clsx + tailwind-merge (quy ước shadcn-vue)
      i18n.ts                      # setup vue-i18n, tự gom locale theo feature qua import.meta.glob
      format.ts                    # formatDuration()...
      audio-compression.ts         # nén audio phía client trước upload (ffmpeg.wasm)
      audio-chunking.ts            # cắt audio đã nén thành chunk để gửi transcribe-chunk
      ffmpeg-client.ts             # singleton loader ffmpeg.wasm dùng chung cho 2 file trên
    locales/{en,vi}.json            # string dùng chung: save/cancel/delete/loading/lỗi chung...
    styles/
      tokens.css                    # design token (xem docs/design-system.md)
supabase/
  migrations/
  functions/
    transcribe-chunk/               # Edge Function stateless: nhận 1 chunk audio, gọi Gemini, trả sentences
docs/
  design-system.md
components.json                      # cấu hình shadcn-vue CLI — alias đã trỏ vào src/shared/...
```

## Quy tắc
- Mỗi feature tự chứa component/page/store/locale/types của nó.
- Feature được phép import từ `shared/`, không import ngược từ feature khác sang `shared/`.
- Feature này được phép dùng store/composable public của feature khác khi cần (vd:
  `lessons` gọi `vocabulary.store` để lưu từ khi người dùng chọn text trong trang học).
  Không tạo layer trung gian cho việc này.
- Không tạo `services/` hoặc `repositories/` riêng — Supabase call nằm thẳng trong store
  action hoặc composable. Chỉ tách ra khi logic thực sự lặp lại ở nhiều nơi.
- Component UI dùng chung (không phải primitive shadcn) chỉ vào `shared/components/` khi
  thực sự dùng lại ở ≥2 nơi, hoặc là component đặc thù nghiệp vụ đã biết trước sẽ tái sử
  dụng (như các component trong `docs/design-system.md`). Luôn kiểm tra `/ui` trước khi
  tạo component mới.
