// Cấu hình kết nối dữ liệu.
window.APP_CONFIG = {
  // "server": lưu tập trung trên Node.js + SQLite backend (đồng bộ SSE realtime)
  // "local" : lưu trong localStorage của trình duyệt (chế độ offline)
  BACKEND: "server",

  // Tên hiển thị của người dùng trên máy này (tuỳ chọn, dùng cho nhãn "✓ ai đã xong")
  USER_NAME: "",
  READ_ONLY: false,

  // Fallback seed URL khi chạy local offline
  SEED_URL: "data/export.json"
};
