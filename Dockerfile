# Base image Node.js 22 Alpine nhẹ, bảo mật và có sẵn node:sqlite
FROM node:22-alpine

# Thiết lập thư mục làm việc
WORKDIR /app

# Thiết lập biến môi trường production
ENV NODE_ENV=production \
    PORT=3000 \
    DB_PATH=/app/data/checklist.db

# Copy package files để cache layer cài đặt thư viện
COPY package*.json ./

# Cài đặt production dependencies (không cần build tool C++)
RUN npm install --omit=dev --no-optional

# Copy toàn bộ mã nguồn ứng dụng
COPY . .

# Tạo thư mục data và phân quyền cho user node
RUN mkdir -p /app/data && chown -R node:node /app

# Chuyển sang user không phải root để đảm bảo an toàn bảo mật
USER node

# Expose cổng ứng dụng
EXPOSE 3000

# Healthcheck định kỳ 30s
HEALTHCHECK --interval=30s --timeout=5s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3000/health || exit 1

# Lệnh khởi chạy
CMD ["node", "src/server.js"]
