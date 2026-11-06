---
phase: 2
title: "SQLite Database Layer & Automatic Seeding Engine"
status: completed
priority: P1
effort: "1h"
dependencies: [1]
---

# Phase 2: SQLite Database Layer & Automatic Seeding Engine

## Goal
Thiết kế tầng truy xuất cơ sở dữ liệu SQLite hiệu năng cao với `better-sqlite3`, hỗ trợ chế độ Write-Ahead Logging (WAL) cho phép đọc ghi đồng thời ổn định, ánh xạ mô hình tài liệu `app_docs` tương thích tuyệt đối với schema Supabase/Firestore hiện tại, và tự động nạp dữ liệu mẫu ban đầu từ `data/export.json` khi database mới khởi tạo.

## Files to Create / Modify
- Create: `src/db.js` — Khởi tạo kết nối SQLite, cấu hình PRAGMA WAL, tự động tạo bảng `app_docs` và các chỉ mục (indexes), cung cấp các hàm helper CRUD.
- Create: `src/scripts/seed.js` — Script nạp dữ liệu từ `data/export.json` vào SQLite database trong một transaction.
- Create/Maintain: `data/export.json` — Giữ nguyên file dữ liệu mẫu đã có sẵn của dự án để làm nguồn seed.

## Tasks & Steps
- [x] **Thiết kế Schema bảng `app_docs` trong SQLite**: Khởi tạo bảng `app_docs` (collection, id, data, updated_at) cùng các indexes tương thích 100% với cấu trúc Supabase.
- [x] **Cấu hình hiệu năng và an toàn với `better-sqlite3`**: Thiết lập `PRAGMA journal_mode = WAL`, `PRAGMA synchronous = NORMAL`, và `foreign_keys = ON`.
- [x] **Xây dựng module CRUD helper (`src/db.js`)**: Cung cấp các hàm `getDocs(col)`, `getDoc(col, id)`, `putDoc(col, id, data)`, `patchDoc(col, id, part)`, `deleteDoc(col, id)`.
- [x] **Cơ chế Auto-seed và Migration dữ liệu**: Kiểm tra khi bảng `app_docs` trống thì tự động nạp toàn bộ các collection `tasks`, `days`, `docs`, `meta` từ `data/export.json` trong một transaction duy nhất.
- [x] **Tạo npm script seed độc lập (`src/scripts/seed.js`)**: Cho phép người quản trị chạy `npm run seed` để khởi tạo lại dữ liệu ban đầu khi cần.

## Verification
- Chạy script kiểm tra database:
  ```bash
  node -e "const db = require('./src/db'); console.log('Tasks:', db.getDocs('tasks').length); console.log('Meta:', db.getDoc('meta', 'settings'));"
  ```
- Kết quả kiểm tra:
  - Bảng `app_docs` được tự động tạo.
  - Số lượng tasks nạp đủ từ `export.json` (>0 items).
  - Bản ghi `meta/settings` chứa đủ tên 3 thương hiệu (`TH CERAMICS`, `ANAM TILES`, `GỐM VŨ GIA`).
  - File `checklist.db` xuất hiện trong thư mục `data/`.
