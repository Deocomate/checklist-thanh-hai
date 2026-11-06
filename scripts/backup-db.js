const fs = require('fs');
const path = require('path');
require('dotenv').config();

const dbPath = process.env.DB_PATH ? path.resolve(process.env.DB_PATH) : path.resolve(__dirname, '../data/checklist.db');
const backupDir = path.resolve(__dirname, '../backups');

if (!fs.existsSync(dbPath)) {
  console.error('[Backup] Không tìm thấy file database:', dbPath);
  process.exit(1);
}

if (!fs.existsSync(backupDir)) {
  fs.mkdirSync(backupDir, { recursive: true });
}

const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
const backupPath = path.join(backupDir, `checklist-${timestamp}.db`);

let DatabaseSync;
try {
  DatabaseSync = require('node:sqlite').DatabaseSync;
} catch (e) {
  try {
    const BetterSqlite3 = require('better-sqlite3');
    DatabaseSync = function (filename) {
      const db = new BetterSqlite3(filename);
      return {
        exec: (sql) => db.exec(sql),
        close: () => db.close()
      };
    };
  } catch (err) {}
}

console.log(`[Backup] Bắt đầu sao lưu ${dbPath} -> ${backupPath}...`);

try {
  if (DatabaseSync) {
    const db = new DatabaseSync(dbPath);
    // VACUUM INTO tạo bản sao lưu nhất quán (consistent snapshot) trực tuyến
    const escapedPath = backupPath.replace(/'/g, "''");
    db.exec(`VACUUM INTO '${escapedPath}'`);
    db.close();
  } else {
    fs.copyFileSync(dbPath, backupPath);
  }
  console.log(`[Backup] Thành công! File sao lưu: ${backupPath}`);
} catch (err) {
  console.warn('[Backup] Lỗi VACUUM INTO, chuyển sang copy trực tiếp:', err.message);
  fs.copyFileSync(dbPath, backupPath);
  console.log(`[Backup] Đã copy file thành công sang ${backupPath}`);
}
