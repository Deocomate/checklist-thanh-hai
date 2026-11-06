---
title: "Setup Backend & Frontend Fullstack (Node.js, SQLite, Handlebars)"
description: "Chuyển đổi dự án Checklist sang kiến trúc Fullstack hoàn chỉnh với Node.js, SQLite và HBS, giữ nguyên 100% giao diện và tính năng, sẵn sàng deploy server."
status: completed
priority: P1
effort: "5h"
tags: [fullstack, backend, nodejs, sqlite, handlebars, devops]
blockedBy: []
blocks: []
created: 2026-11-05
---

# Setup Backend & Frontend Fullstack (Node.js, SQLite, Handlebars)

## Overview
Kế hoạch chuyển đổi toàn diện ứng dụng **Checklist Thanh Hải** từ định dạng HTML tĩnh/Supabase hiện tại thành một ứng dụng Fullstack tự quản hoàn chỉnh chạy trên **Node.js (Express)**, sử dụng template engine **Handlebars (HBS)** để phục vụ giao diện, và cơ sở dữ liệu **SQLite** nhúng (với `better-sqlite3` / `node:sqlite` + WAL mode) để lưu trữ bền vững.

Kế hoạch tuân thủ nghiêm ngặt nguyên tắc cốt lõi: **Giữ nguyên 100% giao diện người dùng, màu sắc, phong cách thiết kế và mọi chức năng nghiệp vụ hiện có**, đồng thời cung cấp đầy đủ các kịch bản và cấu hình đóng gói chuẩn production (Docker, PM2, systemd, Nginx reverse proxy) để sẵn sàng deploy lên bất kỳ môi trường server nào.

## Goals

| # | Goal | Priority |
|---|------|----------|
| 1 | Khởi tạo cấu trúc dự án Node.js + Express + Handlebars (HBS), giữ nguyên 100% giao diện `index.html`. | P1 |
| 2 | Xây dựng tầng cơ sở dữ liệu SQLite tối ưu với chế độ WAL và tự động nạp (seed) dữ liệu mẫu từ `data/export.json`. | P1 |
| 3 | Phát triển hệ thống REST API CRUD và cơ chế phát tín hiệu thời gian thực qua Server-Sent Events (SSE). | P1 |
| 4 | Tích hợp Client Adapter trong `db-adapter.js` kết nối mượt mà với REST + SSE, giữ nguyên mọi logic nghiệp vụ. | P1 |
| 5 | Đóng gói môi trường Production với Docker, PM2, Nginx reverse proxy và tài liệu hướng dẫn vận hành chi tiết. | P1 |

## Phases

| # | Phase | Status | Effort | Dependencies |
|---|-------|--------|--------|--------------|
| 1 | [Phase 1: Project Structure, Dependencies & Handlebars (HBS) Views](./phase-01-project-structure-handlebars.md) | Completed | 1h | None |
| 2 | [Phase 2: SQLite Database Layer & Automatic Seeding Engine](./phase-02-sqlite-database-seeding.md) | Completed | 1h | Phase 1 |
| 3 | [Phase 3: Express REST API & Real-Time Sync (SSE)](./phase-03-backend-api-realtime-sse.md) | Completed | 1h | Phase 2 |
| 4 | [Phase 4: Client Adapter Integration & Frontend Consistency Preservation](./phase-04-client-adapter-ui-preservation.md) | Completed | 1h | Phase 3 |
| 5 | [Phase 5: Production Deployment Packaging, Docker, PM2 & Deployment Guide](./phase-05-deployment-packaging-production-guide.md) | Completed | 1h | Phase 4 |

## Architecture & Data Flow

```
[ Trình duyệt Client ]
        │
        ├────────────────────── GET / ─────────────────────► [ Express App ]
        │                                                           │
        │                                                           ▼
        │                                                   [ Handlebars View ]
        │                                                   (views/index.hbs)
        │                                                           │
        │◄────────── Trả về HTML + CSS + JS thuần ──────────────────┘
        │
        ├───────── REST API (/api/docs/:collection) ────────► [ API Router ]
        │          (GET, POST, PUT, PATCH, DELETE)                  │
        │                                                           ▼
        │                                                   [ SQLite Database ]
        │                                                   (better-sqlite3 / WAL)
        │                                                           │
        │◄──────── Server-Sent Events (/api/events) ───────── [ SSE Broadcaster ]
```

## Success Criteria

- [x] Dự án khởi chạy được chỉ bằng các lệnh tiêu chuẩn `npm install` và `npm start`.
- [x] Giao diện người dùng hiển thị thông qua view Handlebars (`index.hbs`) khớp 100% về visual, font chữ, bố cục, icon và animation so với bản `index.html` ban đầu.
- [x] Mọi chức năng nghiệp vụ (lọc 3 brand, xem lịch tháng, tạo việc, sửa việc, tick hoàn thành, import Excel qua SheetJS, đổi theme sáng/tối/mùa) hoạt động trơn tru.
- [x] Cơ sở dữ liệu SQLite tự khởi tạo bảng `app_docs` và tự nạp toàn bộ dữ liệu từ `data/export.json` khi database trống.
- [x] Đồng bộ thời gian thực (Realtime SSE) hoạt động tức thời giữa nhiều tab trình duyệt hoặc nhiều thiết bị khi có thao tác tick hoàn thành hoặc cập nhật công việc.
- [x] Có đầy đủ cấu hình Docker (`Dockerfile`, `docker-compose.yml`), PM2 (`ecosystem.config.js`), Nginx reverse proxy và kịch bản sao lưu dữ liệu.
- [x] File `README.md` được cập nhật hướng dẫn đầy đủ, rõ ràng cho cả môi trường chạy thử cục bộ lẫn triển khai server thực tế.

<!-- slug: fullstack-checklist-setup -->
