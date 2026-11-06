# Checklist Thanh Hải — Ứng dụng Quản lý Công việc Fullstack

Checklist công việc hằng ngày cho 3 thương hiệu:
- **TH CERAMICS** (Gốm sứ xây dựng)
- **ANAM TILES** (Gạch mosaic)
- **GỐM VŨ GIA** (Đồ thờ cúng tâm linh gốm sứ)

Dự án được xây dựng hoàn chỉnh dưới dạng ứng dụng **Fullstack Node.js**, sử dụng view engine **Handlebars (HBS)** để phục vụ giao diện, cơ sở dữ liệu **SQLite** (Write-Ahead Logging mode) nhúng sẵn không cần cài đặt thêm server database cồng kềnh, và kênh truyền **Server-Sent Events (SSE)** để cập nhật trạng thái realtime tức thời cho cả đội ngũ.

> **Đảm bảo:** Giữ nguyên 100% giao diện, màu sắc, bố cục, font chữ, icon và mọi chức năng nghiệp vụ (lọc 3 brand, xem lịch tháng, tạo việc, sửa việc, tick hoàn thành, import Excel qua SheetJS, đổi theme sáng/tối/mùa).

---

## 🏗️ Kiến trúc & Cấu trúc Thư mục

```
checklist-thanh-hai/
├── src/
│   ├── server.js               # Điểm khởi chạy Express, cấu hình HBS & static files
│   ├── db.js                   # Kết nối SQLite (WAL mode), CRUD helpers & auto-seed
│   ├── routes/
│   │   └── api.js              # REST API endpoints (/api/docs/:col) & SSE endpoint
│   ├── services/
│   │   └── sse.js              # Quản lý luồng Server-Sent Events realtime & heartbeat
│   └── scripts/
│       └── seed.js             # Script nạp lại dữ liệu mẫu từ data/export.json
├── views/
│   └── index.hbs               # Template Handlebars chứa toàn bộ giao diện & logic client
├── public/
│   ├── js/
│   │   ├── config.js           # Cấu hình phía client (BACKEND: "server")
│   │   └── db-adapter.js       # Client adapter kết nối REST API + SSE
│   └── data/
│       └── export.json         # Dữ liệu mẫu tĩnh phục vụ offline fallback
├── data/
│   ├── export.json             # File dữ liệu mẫu ban đầu để auto-seed
│   └── checklist.db            # Cơ sở dữ liệu SQLite (tự động tạo khi chạy)
├── scripts/
│   ├── backup-db.js            # Sao lưu SQLite trực tuyến (online VACUUM backup)
│   └── backup-db.sh            # Script sao lưu tự động cho Linux crontab
├── tests/
│   └── smoke.test.js           # Bộ test kiểm tra toàn bộ API, SSE và View render
├── Dockerfile                  # Cấu hình đóng gói Docker container (Node 22 Alpine)
├── docker-compose.yml          # Triển khai Docker kèm mount persistent volume
├── ecosystem.config.js         # Cấu hình tiến trình PM2 cho VPS
├── nginx.conf.example          # Cấu hình mẫu Nginx Reverse Proxy (tối ưu SSE)
├── systemd.service.example     # Mẫu file service quản lý bằng systemd trên Linux
├── package.json                # Quản lý dependencies & scripts npm
└── .env.example                # File mẫu biến môi trường
```

---

## 🚀 Chạy trên Máy Cục bộ (Development)

### Yêu cầu
- Đã cài đặt **Node.js** (khuyên dùng Node >= 20, tốt nhất là Node 22+).
- Không cần cài MySQL, PostgreSQL hay bất kỳ database nào khác.

### Các bước khởi chạy:
```bash
# 1. Cài đặt các thư viện cần thiết
npm install

# 2. Khởi tạo file biến môi trường (nếu chưa có)
cp .env.example .env

# 3. Khởi chạy server
npm start
# hoặc chạy chế độ tự động reload khi sửa code:
npm run dev
```

Mở trình duyệt truy cập: **`http://localhost:3000`**

*(Lần đầu khởi chạy, ứng dụng sẽ tự động tạo file `data/checklist.db` và nạp toàn bộ 10 công việc mẫu cùng thông tin 3 brand từ `data/export.json`.)*

### Chạy kiểm thử tự động (Smoke Test)
```bash
npm test
```

---

## 🚢 Hướng dẫn Triển khai Lên Server (Production)

Bạn có thể lựa chọn 1 trong các cách triển khai phổ biến sau tuỳ theo hạ tầng server của bạn:

---

### Cách 1: Triển khai bằng Docker & Docker Compose (Khuyên dùng)

Cách nhanh nhất, ổn định nhất, không lo xung đột môi trường trên server:

1. **Đưa toàn bộ mã nguồn lên server** (qua Git clone hoặc SFTP/rsync).
2. **Khởi chạy container:**
   ```bash
   docker compose up -d --build
   ```
3. **Kiểm tra trạng thái:**
   ```bash
   docker compose ps
   docker compose logs -f
   ```

> **Lưu ý dữ liệu:** File `docker-compose.yml` đã được cấu hình mount thư mục `./data` ra máy chủ host. Toàn bộ dữ liệu trong file SQLite `checklist.db` sẽ được bảo toàn tuyệt đối khi bạn rebuild image hoặc restart container.

---

### Cách 2: Triển khai bằng PM2 trên VPS Linux (Ubuntu / Debian)

1. **Cài đặt Node.js & PM2 trên server:**
   ```bash
   # Cài đặt Node.js 22 LTS
   curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
   sudo apt-get install -y nodejs

   # Cài đặt PM2 toàn cục
   sudo npm install -g pm2
   ```

2. **Cài đặt dependencies và chạy với PM2:**
   ```bash
   cd /var/www/checklist-thanh-hai
   npm install --omit=dev --no-optional
   pm2 start ecosystem.config.js --env production
   pm2 save
   pm2 startup
   ```

3. **Quản lý tiến trình PM2:**
   - Xem logs: `pm2 logs checklist-thanh-hai`
   - Khởi động lại: `pm2 restart checklist-thanh-hai`
   - Dừng ứng dụng: `pm2 stop checklist-thanh-hai`

---

### Cách 3: Cấu hình Nginx Reverse Proxy & SSL (HTTPS)

Khi chạy sau Nginx, bạn cần cấu hình tắt buffer đối với đường dẫn `/api/events` để tín hiệu realtime Server-Sent Events được chuyển tiếp tức thì tới trình duyệt người dùng.

1. **Tạo file cấu hình virtual host:**
   ```bash
   sudo nano /etc/nginx/sites-available/checklist.conf
   ```
2. **Dán nội dung từ file [`nginx.conf.example`](./nginx.conf.example):**
   ```nginx
   upstream checklist_upstream {
       server 127.0.0.1:3000;
       keepalive 32;
   }

   server {
       listen 80;
       server_name checklist.yourcompany.com; # Đổi thành domain của bạn

       client_max_body_size 20M;

       # Cấu hình bắt buộc cho Server-Sent Events (SSE)
       location /api/events {
           proxy_pass http://checklist_upstream;
           proxy_http_version 1.1;
           proxy_set_header Connection '';
           proxy_set_header Host $host;
           proxy_buffering off;
           proxy_cache off;
           chunked_transfer_encoding off;
           proxy_read_timeout 24h;
       }

       location / {
           proxy_pass http://checklist_upstream;
           proxy_http_version 1.1;
           proxy_set_header Upgrade $http_upgrade;
           proxy_set_header Connection 'upgrade';
           proxy_set_header Host $host;
           proxy_set_header X-Real-IP $remote_addr;
           proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
           proxy_set_header X-Forwarded-Proto $scheme;
       }
   }
   ```
3. **Kích hoạt và nạp lại Nginx:**
   ```bash
   sudo ln -s /etc/nginx/sites-available/checklist.conf /etc/nginx/sites-enabled/
   sudo nginx -t
   sudo systemctl reload nginx
   ```
4. **Cài đặt chứng chỉ SSL miễn phí qua Certbot:**
   ```bash
   sudo apt install -y certbot python3-certbot-nginx
   sudo certbot --nginx -d checklist.yourcompany.com
   ```

---

### Cách 4: Chạy dạng Systemd Service

Nếu không muốn dùng PM2 hay Docker, bạn có thể chạy ứng dụng như một Linux daemon service:

```bash
sudo cp systemd.service.example /etc/systemd/system/checklist.service
# Mở chỉnh sửa đường dẫn WorkingDirectory và User cho phù hợp
sudo nano /etc/systemd/system/checklist.service

sudo systemctl daemon-reload
sudo systemctl enable checklist
sudo systemctl start checklist
sudo systemctl status checklist
```

---

## 💾 Quản trị & Sao lưu Cơ sở dữ liệu (SQLite Backup)

### Sao lưu trực tuyến (Online Consistent Backup)
Hệ thống tích hợp sẵn kịch bản sao lưu online không cần dừng server, không ảnh hưởng đến người đang truy cập:

```bash
# Chạy sao lưu bằng Node.js script:
node scripts/backup-db.js
```
Bản sao lưu sẽ được nén và lưu trong thư mục `backups/checklist-<timestamp>.db`.

### Thiết lập Cron job tự động sao lưu hằng ngày trên Linux
Mở cấu hình crontab bằng lệnh `crontab -e` và thêm dòng sau để tự động sao lưu vào lúc 2:00 sáng mỗi ngày:
```cron
0 2 * * * /bin/bash /var/www/checklist-thanh-hai/scripts/backup-db.sh >> /var/log/checklist-backup.log 2>&1
```

### Phục hồi dữ liệu (Restore)
Nếu cần khôi phục lại dữ liệu từ một bản sao lưu:
```bash
# Dừng ứng dụng
pm2 stop checklist-thanh-hai  # hoặc: docker compose stop

# Khôi phục file db
cp backups/checklist-YYYY-MM-DD.db data/checklist.db

# Khởi động lại ứng dụng
pm2 start checklist-thanh-hai # hoặc: docker compose start
```

### Nạp lại dữ liệu mẫu (Reset về trạng thái ban đầu)
```bash
npm run seed
```

---

## 📡 Danh sách REST API Reference

| Phương thức | Endpoint | Mô tả |
|---|---|---|
| `GET` | `/health` | Kiểm tra trạng thái hoạt động của server và số lượng client SSE |
| `GET` | `/api/docs/:collection` | Lấy toàn bộ documents trong collection (`tasks`, `days`, `docs`, `meta`) |
| `GET` | `/api/docs/:collection/:id` | Lấy dữ liệu 1 document cụ thể |
| `POST` | `/api/docs/:collection` | Thêm mới document (tự sinh ID ngẫu nhiên hoặc dùng ID truyền lên) |
| `PUT` | `/api/docs/:collection/:id` | Ghi đè / Upsert document |
| `PATCH` | `/api/docs/:collection/:id` | Cập nhật từng phần (Deep merge, chuẩn Firestore update) |
| `DELETE` | `/api/docs/:collection/:id` | Xoá document |
| `GET` | `/api/events` | Luồng Server-Sent Events phát tín hiệu realtime `change` / `delete` |
