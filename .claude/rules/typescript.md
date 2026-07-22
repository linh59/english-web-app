---
name: typescript
description: Quy tắc TypeScript — strict mode, nơi định nghĩa type domain — đọc khi khai báo type/interface mới
---

# Quy tắc TypeScript

- `strict: true` trong tsconfig.
- Định nghĩa type dữ liệu domain (Lesson, Sentence, VocabularyItem, ...) trong `types.ts`
  của từng feature, không dùng `any`.
- Type của Supabase response nên khai báo tay theo bảng (interface khớp cột DB), chưa
  cần generate type tự động cho V1 nếu team chỉ 1 người — nhưng nếu dùng
  `supabase gen types typescript`, đặt kết quả tại `src/shared/lib/database.types.ts`.
