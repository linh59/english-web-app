---
name: ui
description: Quy tắc dùng design token/component có sẵn và responsive — đọc khi viết template/style hoặc tạo component UI mới
---

# Quy tắc UI

- Component UI dựng trên design token đã có (`shared/styles/tokens.css`) — dùng class
  Tailwind như `bg-primary`, `text-muted-foreground`, `border-border`. Không hardcode
  màu/spacing ngoài token.
- Ưu tiên tái sử dụng component có sẵn trong `shared/components/ui/` (shadcn-vue) và
  component đặc thù trong `shared/components/` — xem đầy đủ tại `/ui` (chạy
  `npm run dev`, mở `/ui`) và `docs/design-system.md` trước khi tạo mới.
- Chỉ thêm component/variant mới khi màn hình V1 thật sự cần — xem danh sách "đã cắt"
  trong `docs/design-system.md` trước khi tự ý thêm lại (Table, Select, Date Picker,
  Avatar, Tabs, Sidebar dùng chung...).
- TailwindCSS utility-first, viết class thẳng trong template. Không tạo file CSS riêng
  trừ khi cần global reset.
- Route `/ui` phải luôn ở dạng dev-only (đăng ký có điều kiện theo
  `import.meta.env.DEV` trong `router/index.ts`) — không xóa điều kiện này.

## Responsive

- Thiết kế mobile-first (người dùng có thể nghe/học trên điện thoại), test ở breakpoint
  nhỏ trước khi mở rộng lên desktop/tablet.
- Dùng spacing/scale mặc định của Tailwind, tránh giá trị tùy chỉnh một lần
  (`mt-[13px]`).
