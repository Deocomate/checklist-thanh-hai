---
phase: 3
title: "Express REST API & Real-Time Sync (SSE)"
status: completed
priority: P1
effort: "1h"
dependencies: [2]
---

# Phase 3: Express REST API & Real-Time Sync (SSE)

## Goal
Xây dựng hệ thống REST API hoàn chỉnh cho các thao tác đọc ghi tài liệu và thiết lập kênh truyền thời gian thực qua Server-Sent Events (SSE), cho phép các thiết bị và tab trình duyệt khác nhau nhận cập nhật ngay lập tức khi có người dùng tick hoàn thành công việc hoặc thay đổi dữ liệu, hoạt động tương đương Supabase Realtime nhưng chạy hoàn toàn tự quản với SQLite.

## Files to Create / Modify
- Create: `src/services/sse.js` — Bộ quản lý kết nối Server-Sent Events (SSE clients pool, broadcast sự kiện, keep-alive heartbeat).
- Create: `src/routes/api.js` — Router chứa toàn bộ các API endpoints CRUD và endpoint SSE.
- Modify: `src/server.js` — Đăng ký API router `/api` vào ứng dụng Express.

## Tasks & Steps
- [x] **Xây dựng module SSE Manager (`src/services/sse.js`)**: Quản lý pool kết nối clients, gửi comment chào mừng, phát sự kiện `broadcast(event, payload)`, và định kỳ heartbeat ping mỗi 25-30 giây.
- [x] **Phát triển REST GET Endpoints**: Xây dựng `GET /api/docs/:collection` (danh sách bản ghi) và `GET /api/docs/:collection/:id` (chi tiết bản ghi).
- [x] **Phát triển REST Mutation Endpoints**: Xây dựng `POST /api/docs/:collection` (tạo mới), `PUT /api/docs/:collection/:id` (upsert), `PATCH /api/docs/:collection/:id` (deep merge), `DELETE /api/docs/:collection/:id` (xoá).
- [x] **Tích hợp Trigger SSE Broadcast**: Kích hoạt phát tín hiệu realtime (`change` hoặc `delete`) tương ứng sau mỗi thao tác ghi thành công vào SQLite.
- [x] **Xây dựng Endpoint `GET /api/events`**: Thiết lập luồng streaming Server-Sent Events cho trình duyệt lắng nghe.

## Verification
- Kiểm tra REST API bằng lệnh curl:
  ```bash
  # 1. Lấy danh sách tasks
  curl -s http://localhost:3000/api/docs/tasks | grep -q "title" && echo "GET OK"

  # 2. Tạo task mới
  curl -s -X POST http://localhost:3000/api/docs/tasks \
    -H "Content-Type: application/json" \
    -d "{\"title\":\"Test task từ API\",\"brand\":\"th\",\"priority\":\"Cao\"}"

  # 3. Mở kết nối SSE và kiểm tra stream
  curl -N http://localhost:3000/api/events
  ```
- Kết quả mong muốn: API trả về đúng dữ liệu định dạng JSON, HTTP status codes chuẩn (200, 201, 404), stream SSE nhận được sự kiện ngay khi có request POST/PUT/PATCH/DELETE.
