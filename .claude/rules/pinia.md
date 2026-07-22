---
name: pinia
description: Quy tắc tổ chức Pinia store — đọc khi tạo/sửa file trong stores/
---

# Quy tắc Pinia

- Mỗi feature domain có tối đa 1 store (`auth`, `lessons`, `vocabulary`). Không tách
  nhỏ store hơn nữa cho V1.
- Store chứa state + actions gọi Supabase trực tiếp. Không thêm getters phức tạp khi
  computed đơn giản trong component là đủ.
- Đặt tên store theo `useXStore` (vd: `useLessonsStore`), file `stores/lessons.store.ts`.
- Chỉ `app.use(pinia)` trong `main.ts` khi store đầu tiên thực sự được tạo — đừng đăng
  ký Pinia "phòng khi cần" trước đó.
