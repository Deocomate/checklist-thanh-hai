// Quản lý kết nối Server-Sent Events (SSE) để đồng bộ realtime giữa các trình duyệt
const clients = new Set();

function subscribe(req, res) {
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache, no-transform',
    'Connection': 'keep-alive',
    'X-Accel-Buffering': 'no',
    'Access-Control-Allow-Origin': '*'
  });

  // Gửi comment chào mừng
  res.write(':connected\n\n');

  clients.add(res);

  req.on('close', () => {
    clients.delete(res);
  });
}

function broadcast(type, payload) {
  const data = JSON.stringify({ type, ...payload });
  const message = `data: ${data}\n\n`;

  for (const client of clients) {
    try {
      client.write(message);
    } catch (err) {
      clients.delete(client);
    }
  }
}

// Heartbeat ping mỗi 25 giây để tránh timeout từ proxy/firewall
setInterval(() => {
  for (const client of clients) {
    try {
      client.write(':ping\n\n');
    } catch (err) {
      clients.delete(client);
    }
  }
}, 25000);

module.exports = {
  subscribe,
  broadcast,
  getClientCount: () => clients.size
};
