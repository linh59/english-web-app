# Design System

Nền tảng UI dùng chung cho English App. Xem trực quan tại `/ui` (chỉ chạy ở môi trường dev — `npm run dev` rồi mở `http://localhost:5173/ui`, route này bị loại hoàn toàn khỏi bản production build).

## Triết lý thiết kế

Tối giản, nhiều khoảng trắng, typography rõ ràng, màu dịu mắt, shadow nhẹ, bo góc mềm, animation tiết chế — lấy cảm hứng từ Apple, Linear, Raycast, Notion, Vercel, Stripe Dashboard. Component chỉ được thêm vào khi có màn hình thật trong V1 cần dùng (xem phần "Phạm vi" bên dưới) — không xây trước cho tính năng chưa tồn tại.

## Stack

Vue 3 (Composition API + `<script setup>`), TypeScript, Vite, TailwindCSS v4, shadcn-vue (base: reka-ui) + Lucide icon (`@lucide/vue`), vue-i18n.

## Design Token

Định nghĩa tại `src/shared/styles/tokens.css`, theo cơ chế CSS variables của Tailwind v4 (`@theme inline`), tự động đổi giá trị giữa light/dark qua class `.dark` trên `<html>`.

- **Color**: `--background`, `--foreground`, `--card`, `--popover`, `--primary`, `--secondary`, `--muted`, `--accent`, `--destructive`, `--border`, `--input`, `--ring`, cùng 3 token bổ sung ngoài mặc định shadcn: `--success`, `--warning`, `--info` (mỗi token có biến thể `-foreground` để đặt màu chữ tương phản).
- **Radius**: `--radius` gốc (0.625rem), suy ra `radius-sm/md/lg/xl` qua `calc()`.
- **Shadow, Spacing, Icon size**: dùng thẳng thang mặc định của Tailwind — không tự chế thang riêng, tránh phá vỡ tính nhất quán với hệ sinh thái Tailwind.
- **Animation/Transition**: 1 easing tùy chỉnh `ease-smooth` (`cubic-bezier(0.4, 0, 0.2, 1)`), còn lại dùng `duration-*` mặc định của Tailwind.
- **Z-index**: thang riêng cho các lớp nổi — `z-dropdown` (1000), `z-popover` (1100), `z-modal` (1200), `z-toast` (1300).

Không hardcode giá trị màu/spacing trực tiếp trong component — luôn dùng token (class Tailwind như `bg-primary`, `text-muted-foreground`, `border-border`...).

## Component

### Primitive (từ shadcn-vue, tại `src/shared/components/ui/`)
Button, Input, Textarea, Switch, Label, Badge, Alert, Card, Dialog, Dropdown Menu, Popover, Tooltip, Skeleton. Đây là code mình sở hữu (copy qua CLI, không phải black-box dependency) — có thể sửa trực tiếp khi cần.

### Đặc thù English App (tại `src/shared/components/`)
- `AudioPlayer` — play/pause, seek (single progress bar), playback speed (`PlaybackSpeedControl`), lặp lại (`LoopButton`).
- `Transcript` + `TranscriptSentence` — danh sách câu, click câu để tua; bôi đen từ/cụm từ để mở `SelectedTextToolbar` → `VocabularyPopup` (lưu từ + nghĩa + câu ví dụ).
- `LessonCard`, `VocabularyCard` — dựng trên Card cơ bản.
- `EmptyState`, `Progress`, `Spinner` — dùng chung nhiều nơi.
- `Navbar` (kèm `ThemeToggle`, `LocaleSwitcher`) — nav thật của app, nhận `links` qua prop.

### Đã cắt khỏi V1 (thêm khi có tính năng thật cần — xem `CLAUDE.md`)
Table, Select, Combobox, Date Picker, Radio, Checkbox, Avatar, Breadcrumb, Pagination, Tabs, Bottom Navigation, Context Menu, Sidebar dùng chung cho app, Mini Player, Sentence Bookmark, Difficulty Badge, Statistic/Information/Action Card.

## Quy tắc sử dụng

- Ưu tiên dùng component đã có trong `shared/components/` trước khi tạo mới. Kiểm tra `/ui` trước khi viết component mới.
- Component mới chỉ tạo khi dùng lại ở ≥2 nơi, hoặc là component đặc thù nghiệp vụ đã biết trước sẽ tái sử dụng (như các component English-learning ở trên).
- Không tạo biến thể (variant) cho trạng thái/tính năng chưa tồn tại trong V1 (ví dụ: không thêm Badge "Premium" khi chưa có tính năng premium).

## Đa ngôn ngữ (i18n)

- Toàn bộ text hiển thị cho người dùng trong **tính năng thật** (auth, lessons, vocabulary...) phải qua `t()`, không hardcode. Locale đặt tại `features/<tên feature>/locales/{en,vi}.json`, string dùng chung tại `shared/locales/{en,vi}.json`.
- `shared/lib/i18n.ts` tự động gom toàn bộ locale file theo feature (`import.meta.glob`) — thêm feature mới không cần sửa file cấu hình.
- Namespace key = tên thư mục feature: `t('auth.login.title')`, `t('common.save')`.
- Riêng nội dung mẫu bên trong từng section của trang `/ui` (ví dụ câu "The quick brown fox...", tên bài học demo) là dữ liệu minh họa cho dev tool, không bắt buộc qua i18n — chỉ phần khung của chính trang showcase (tiêu đề section, thanh tìm kiếm...) mới cần i18n để dogfood hệ thống.
- Thêm ngôn ngữ mới: thêm hằng số vào `SUPPORTED_LOCALES` trong `shared/lib/i18n.ts` + thêm file json cho từng feature. Không cần sửa component nào.

## Responsive

Thiết kế mobile-first. Trang `/ui` minh họa: sidebar điều hướng mặc định thu gọn trên mobile (< 640px), mở dạng overlay khi bấm nút toggle; ở `sm` trở lên là cột tĩnh trong layout. Áp dụng cùng nguyên tắc cho các trang nghiệp vụ sau này — test ở breakpoint nhỏ trước khi mở rộng lên desktop.

## Accessibility

- Toàn bộ Dialog/Dropdown/Popover/Tooltip dùng primitive từ reka-ui — đã có sẵn quản lý focus trap, đóng bằng phím Escape, điều hướng bằng bàn phím.
- Nút icon-only (như nút xóa trên `LessonCard`, toggle sidebar) cần có `aria-label` hoặc `title` mô tả hành động.
- Giữ tỷ lệ tương phản đủ dùng token màu có sẵn (`-foreground` luôn được thiết kế tương phản với màu nền tương ứng) — không tự phối màu ngoài token.
