---
phase: 1
title: "Project Structure, Dependencies & Handlebars (HBS) Views"
status: completed
priority: P1
effort: "1h"
dependencies: []
---

# Phase 1: Project Structure, Dependencies & Handlebars (HBS) Views

## Goal
Khởi tạo cấu trúc dự án Node.js chuẩn với Express và Handlebars (`hbs`), cài đặt các dependencies cần thiết, tổ chức thư mục mã nguồn (`src/`, `views/`, `public/`) và chuyển đổi toàn bộ giao diện từ `index.html` sang Handlebars view đảm bảo giữ nguyên 100% markup, CSS, style và client scripts.

## Files to Create / Modify
- Create: `package.json` — Cấu hình dự án Node.js, dependencies và npm scripts (`start`, `dev`, `seed`, `test`).
- Create: `.env.example` & `.env` — Biến môi trường (`PORT=3000`, `NODE_ENV=development`, `DB_PATH=./data/checklist.db`).
- Create: `.gitignore` — Loại trừ `node_modules/`, `.env`, file database runtime `*.db`, `*.db-journal`, `*.db-wal`.
- Create: `src/server.js` — Khởi tạo Express server, cấu hình view engine `hbs`, static middleware `public/`, routes loader.
- Create: `views/index.hbs` — Chuyển đổi toàn bộ mã nguồn `index.html` sang Handlebars template, giữ nguyên toàn bộ CSS, HTML layout, dialogs, và client scripts.
- Create: `public/js/` — Thư mục chứa các client scripts tĩnh (`db-adapter.js`, `config.js`).

## Tasks & Steps
- [x] **Khởi tạo `package.json`**: Khai báo dependencies (`express`, `hbs`, `better-sqlite3`, `dotenv`, `cors`, `morgan`), devDependencies và các npm scripts (`start`, `dev`, `seed`, `test`).
- [x] **Thiết lập cấu trúc thư mục**: Tạo các thư mục `src/`, `views/`, `public/js/`, `data/`, và file `.gitignore`, `.env.example`.
- [x] **Xây dựng Express server (`src/server.js`)**: Cấu hình Express app tích hợp `hbs` view engine, middleware static `public/`, parse JSON và route `/health`.
- [x] **Chuyển đổi giao diện sang Handlebars view (`views/index.hbs`)**: Chuyển toàn bộ nội dung HTML, CSS và logic JavaScript từ `index.html` sang `views/index.hbs`, xử lý xung đột ký tự và cập nhật đường dẫn script tĩnh.
- [x] **Tạo route trang chủ**: Định nghĩa route `GET /` render `index.hbs` và kiểm tra hiển thị HTTP 200.

## Verification
- Chạy lệnh `npm install` thành công, không phát sinh lỗi xung đột phiên bản.
- Chạy `npm start` (hoặc `node src/server.js`), server lắng nghe tại port được cấu hình (mặc định 3000).
- Dùng trình duyệt hoặc curl mở `http://localhost:3000/`:
  - Mã phản hồi HTTP: 200 OK.
  - Toàn bộ giao diện người dùng hiển thị chuẩn xác (tiêu đề, thanh điều hướng 3 brand, dải tuần 7 ngày, nút chuyển theme).
- Mở `http://localhost:3000/health`: trả về `{"status":"ok"}`.
