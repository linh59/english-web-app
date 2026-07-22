---
name: naming
description: Quy tắc đặt tên file/route/DB — đọc khi tạo file, route, hoặc cột DB mới
---

# Quy tắc đặt tên

- Component: PascalCase (`LessonCard.vue`)
- Composable: camelCase, tiền tố `use` (`useAudioPlayer.ts`)
- Store file: `feature.store.ts`, export `useFeatureStore`
- Route path: kebab-case (`/lessons`, `/lessons/:id`, `/vocabulary`)
- Bảng/cột DB: snake_case
- Locale file: `locales/en.json`, `locales/vi.json` trong mỗi feature/`shared`
