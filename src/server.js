require('dotenv').config();
const path = require('path');
const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const apiRouter = require('./routes/api');
const sse = require('./services/sse');

const app = express();
const PORT = process.env.PORT || 3000;

// Cấu hình template engine Handlebars (hbs)
app.set('view engine', 'hbs');
app.set('views', path.join(__dirname, '../views'));

// Logging và CORS
if (process.env.NODE_ENV !== 'test') {
  app.use(morgan('dev'));
}
app.use(cors());

// Middleware parse JSON và Form dữ liệu
app.use(express.json({ limit: '15mb' }));
app.use(express.urlencoded({ extended: true, limit: '15mb' }));

// Phục vụ tài nguyên tĩnh (public/js, public/css, public/data, v.v.)
app.use(express.static(path.join(__dirname, '../public')));

// Gắn REST API và SSE router
app.use('/api', apiRouter);

// Health check endpoint (phục vụ container/load balancer)
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    uptime: Math.floor(process.uptime()),
    timestamp: new Date().toISOString(),
    sseClients: sse.getClientCount()
  });
});

// Route chính: Phục vụ ứng dụng Checklist qua view Handlebars
app.get('/', (req, res) => {
  res.render('index');
});

// Khởi chạy server nếu được gọi trực tiếp
if (require.main === module) {
  const server = app.listen(PORT, () => {
    console.log(`=======================================================`);
    console.log(` Checklist Thanh Hải Server đang chạy tại:`);
    console.log(` > Local:   http://localhost:${PORT}`);
    console.log(` > Health:  http://localhost:${PORT}/health`);
    console.log(` > API:     http://localhost:${PORT}/api/docs/tasks`);
    console.log(` > Realtime SSE: http://localhost:${PORT}/api/events`);
    console.log(`=======================================================`);
  });

  // Graceful shutdown
  const shutdown = () => {
    console.log('\n[Server] Đang đóng kết nối an toàn...');
    server.close(() => {
      console.log('[Server] Đã dừng server.');
      process.exit(0);
    });
  };

  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);
}

module.exports = app;
