---
phase: 4
title: "Client Adapter Integration & Frontend Consistency Preservation"
status: completed
priority: P1
effort: "1h"
dependencies: [3]
---

# Phase 4: Client Adapter Integration & Frontend Consistency Preservation

## Goal
Tích hợp client-side adapter kết nối trực tiếp với backend Node.js + SQLite qua REST API và SSE, thay thế hoàn toàn phụ thuộc vào Supabase hoặc LocalStorage mà không làm thay đổi dù chỉ một chi tiết nhỏ về giao diện, chức năng, hoặc trải nghiệm người dùng hiện tại của ứng dụng Checklist.

## Files to Create / Modify
- Create: `public/js/db-adapter.js` — Thêm module `serverBackend()` vào adapter hiện tại, giữ nguyên toàn bộ interface `makeCore`, `claude.use('db')`, `claude.use('user')`, `claude.use('downloads')`.
- Create: `public/js/config.js` — Cấu hình mặc định `BACKEND: "server"`, trỏ tới `/api`.
- Modify: `views/index.hbs` — Đảm bảo liên kết đúng các tệp script trong `public/js/`, kiểm tra giữ nguyên vẹn toàn bộ 1325 dòng code logic UI (bộ lọc brand, lịch tháng, SheetJS excel import, theme switcher).

## Tasks & Steps
- [x] **Xây dựng `serverBackend()` trong `public/js/db-adapter.js`**: Cài đặt `load(col)`, `read(col, id)`, `put(col, id, data)`, `del(col, id)`, `watch(col, fn)` bằng `fetch()` và `EventSource('/api/events')`.
- [x] **Cập nhật hàm khởi tạo `getDb()`**: Tự động chuyển đổi sang `serverBackend()` khi cấu hình `CFG.BACKEND === "server"`.
- [x] **Cập nhật `public/js/config.js`**: Thiết lập `BACKEND: "server"` và giữ lại các cấu hình cá nhân của người dùng.
- [x] **Xác nhận tính tương thích trong `views/index.hbs`**: Đảm bảo toàn bộ 1325 dòng logic JavaScript (bao gồm SheetJS Excel import, theme switching, seasonal animations, calendar math) chạy trơn tru mà không cần sửa đổi.
- [x] **Kiểm tra đồng bộ đa tab/đa thiết bị**: Đảm bảo khi một tab thay đổi dữ liệu, các tab khác cập nhật trạng thái ngay lập tức qua SSE.

## Verification
- Mở ứng dụng trên trình duyệt:
  - Kiểm tra tab "Tổng hợp", "Tháng", "TH CERAMICS", "ANAM TILES", "GỐM VŨ GIA", "Tài liệu".
  - Thử click hoàn thành một công việc: Trạng thái cập nhật tức thì và lưu vào SQLite.
  - Mở đồng thời 2 cửa sổ trình duyệt (hoặc 1 cửa sổ ẩn danh): Khi tick ở cửa sổ 1, cửa sổ 2 tự động cập nhật ngay mà không cần reload trang (Realtime SSE).
  - Tải lại trang (F5): Dữ liệu vẫn được duy trì từ SQLite database.
  - Thử mở popup Cài đặt, popup Thêm việc, popup Import Excel: Mọi giao diện và modal hiển thị mượt mà, không có lỗi console JS.
