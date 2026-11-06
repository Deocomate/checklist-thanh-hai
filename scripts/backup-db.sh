#!/usr/bin/env bash
# Script sao lưu tự động cho Checklist Thanh Hải trên Linux server (Crontab)
# Ví dụ cron chạy mỗi ngày lúc 2:00 sáng:
# 0 2 * * * /bin/bash /var/www/checklist-thanh-hai/scripts/backup-db.sh >> /var/log/checklist-backup.log 2>&1

set -e

DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
BACKUP_DIR="${DIR}/backups"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
DB_FILE="${DIR}/data/checklist.db"
TARGET_FILE="${BACKUP_DIR}/checklist-${TIMESTAMP}.db"

mkdir -p "${BACKUP_DIR}"

if [ ! -f "${DB_FILE}" ]; then
  echo "[$(date)] Lỗi: Không tìm thấy file database tại ${DB_FILE}"
  exit 1
fi

echo "[$(date)] Bắt đầu sao lưu ${DB_FILE} -> ${TARGET_FILE}"

if command -v node >/dev/null 2>&1; then
  node "${DIR}/scripts/backup-db.js"
elif command -v sqlite3 >/dev/null 2>&1; then
  sqlite3 "${DB_FILE}" ".backup '${TARGET_FILE}'"
  echo "[$(date)] Đã sao lưu bằng sqlite3 CLI thành công."
else
  cp "${DB_FILE}" "${TARGET_FILE}"
  echo "[$(date)] Đã sao lưu bằng cp thành công."
fi

# Giữ lại tối đa 30 bản sao lưu gần nhất, xoá bản cũ hơn
find "${BACKUP_DIR}" -name "checklist-*.db" -type f -mtime +30 -delete 2>/dev/null || true
echo "[$(date)] Hoàn tất quá trình sao lưu."
