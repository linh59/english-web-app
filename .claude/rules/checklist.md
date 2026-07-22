---
name: checklist
description: Checklist từng bước khi tạo tính năng mới — đọc khi bắt đầu bất kỳ tính năng mới nào
---

# Checklist khi tạo tính năng mới

1. Xác định tính năng thuộc feature nào trong `src/features/`, tạo folder nếu chưa có
   (theo mẫu cấu trúc ở [[architecture]]).
2. Kiểm tra `/ui` và `docs/design-system.md` — tái sử dụng component có sẵn trước khi
   tạo mới (xem [[ui]]).
3. Định nghĩa type dữ liệu trong `types.ts` của feature (xem [[typescript]]).
4. Nếu cần lưu trữ: thêm migration trong `supabase/migrations`, bật RLS, viết policy
   theo `user_id = auth.uid()` (xem [[database]]).
5. Nếu cần state dùng chung giữa nhiều component: thêm action/state vào store của
   feature (không tạo store mới nếu đã có store phù hợp — xem [[pinia]]).
6. Thêm route trong `app/router/index.ts` nếu có page mới (xem [[naming]] cho quy ước
   route path).
7. Thêm key locale vào `features/<feature>/locales/{en,vi}.json` cho mọi text hiển thị
   mới — không hardcode (xem [[i18n]]).
8. Build component/page, ưu tiên đơn giản, không thêm option/config chưa ai yêu cầu.
9. Test thủ công: happy path + ít nhất 1 edge case (vd: audio quá dài, mất mạng khi xử
   lý, danh sách rỗng, chuyển đổi ngôn ngữ/theme).
10. Kiểm tra lại: file có vượt ~300 dòng không, có tạo abstraction/service layer thừa
    không, có thêm tính năng nằm ngoài phạm vi V1 không.
