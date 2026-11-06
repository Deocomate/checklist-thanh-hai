const path = require('path');
require('dotenv').config();
const { seedFromExport, getDocs } = require('../db');

console.log('[Seed] Bắt đầu quá trình nạp lại dữ liệu mẫu...');
try {
  const count = seedFromExport(path.join(__dirname, '../../data/export.json'));
  console.log(`[Seed] Thành công! Đã chèn/cập nhật ${count} tài liệu vào SQLite.`);
  console.log(`[Seed] Số lượng tasks hiện tại: ${getDocs('tasks').length}`);
} catch (err) {
  console.error('[Seed] Thất bại:', err);
  process.exit(1);
}
