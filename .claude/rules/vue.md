---
name: vue
description: Quy tắc viết component Vue — đọc khi tạo/sửa file .vue
---

# Quy tắc Vue

- Chỉ dùng Composition API + `<script setup lang="ts">`. Không dùng Options API.
- Props/emits khai báo qua `defineProps<T>()` / `defineEmits<T>()` với type rõ ràng,
  không dùng runtime declaration khi không cần.
- Component chỉ nhận props/emit sự kiện, không tự ý gọi Supabase trực tiếp trong
  component nếu logic có thể nằm trong store/composable dùng lại được — nhưng cũng
  không bắt buộc tách composable nếu component đó là nơi duy nhất dùng logic đó.
- Không tạo component tái sử dụng (`shared/components`) trước khi có nhu cầu dùng lại
  thật sự (≥2 nơi) — xem thêm [[architecture]].
- Mỗi file component nên dưới ~300 dòng. Nếu vượt, tách phần hiển thị con ra file riêng
  trong cùng feature (xem `AudioPlayer/` hoặc `Transcript/` làm ví dụ tách component con).
