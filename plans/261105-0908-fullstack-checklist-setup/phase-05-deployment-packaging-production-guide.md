---
phase: 5
title: "Production Deployment Packaging, Docker, PM2 & Deployment Guide"
status: completed
priority: P1
effort: "1h"
dependencies: [4]
---

# Phase 5: Production Deployment Packaging, Docker, PM2 & Deployment Guide

## Goal
Đóng gói dự án thành một sản phẩm hoàn chỉnh sẵn sàng triển khai trên server production thông qua nhiều phương thức linh hoạt (Docker container với persistent storage, PM2 process manager, hoặc systemd trên Linux VPS), kèm cấu hình reverse proxy Nginx tối ưu cho Server-Sent Events và hướng dẫn vận hành, sao lưu cơ sở dữ liệu SQLite định kỳ.

## Files to Create / Modify
- Create: `Dockerfile` — Cấu hình build container Docker nhẹ trên nền tảng Node Alpine, chạy non-root user đảm bảo bảo mật.
- Create: `.dockerignore` — Loại bỏ `node_modules`, `plans`, `.git`, logs khỏi image build.
- Create: `docker-compose.yml` — Cấu hình chạy container với volume mount thư mục `./data` ra host để bảo vệ file SQLite database khi container restart/upgrade.
- Create: `ecosystem.config.js` — Cấu hình chạy ứng dụng bằng PM2 (restart tự động khi crash, log file rotation, max memory limit).
- Create: `nginx.conf.example` — Mẫu cấu hình Nginx reverse proxy với các thiết lập bắt buộc cho Server-Sent Events (`proxy_buffering off;`, `proxy_set_header Connection '';`, `proxy_http_version 1.1;`).
- Create: `scripts/backup-db.sh` — Script sao lưu tự động file `checklist.db` định kỳ bằng lệnh `sqlite3 checklist.db ".backup backup.db"`.
- Modify: `README.md` — Viết lại hướng dẫn chi tiết từ A-Z: cài đặt local, cấu hình biến môi trường, hướng dẫn deploy với Docker, PM2, hoặc Nginx, và quy trình backup/restore dữ liệu.

## Tasks & Steps
- [x] **Xây dựng Dockerfile & `.dockerignore`**: Sử dụng `node:20-alpine`, tối ưu build layer, thiết lập user bảo mật và healthcheck.
- [x] **Soạn thảo `docker-compose.yml`**: Mount volume persistent cho thư mục `./data` để file `checklist.db` an toàn qua các lần rebuild hoặc restart.
- [x] **Cấu hình PM2 (`ecosystem.config.js`)**: Thiết lập chế độ fork, tự động khởi động lại, giới hạn memory và cấu hình đường dẫn log.
- [x] **Mẫu Nginx Reverse Proxy (`nginx.conf.example`)**: Cung cấp cấu hình Nginx tối ưu cho Server-Sent Events (`proxy_buffering off`).
- [x] **Xây dựng kịch bản sao lưu (`scripts/backup-db.sh`)**: Sử dụng lệnh SQLite online backup an toàn và hướng dẫn cấu hình cron job.
- [x] **Soạn thảo tài liệu hướng dẫn (`README.md`)**: Hướng dẫn toàn diện từ chạy thử nghiệm trên máy đến triển khai server thực tế.

## Verification
- Thử nghiệm build Docker:
  ```bash
  docker build -t checklist-app .
  ```
- Kiểm tra file cấu hình PM2 không có lỗi cú pháp:
  ```bash
  node -c ecosystem.config.js
  ```
- Kiểm tra hướng dẫn trong `README.md` rõ ràng, có đầy đủ các bước từ khởi chạy đến đưa lên server production.
