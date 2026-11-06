const http = require('http');
const assert = require('assert');
const app = require('../src/server');

const TEST_PORT = 3001;

function request(method, path, body = null, headers = {}) {
  return new Promise((resolve, reject) => {
    const opts = {
      hostname: '127.0.0.1',
      port: TEST_PORT,
      path,
      method,
      headers: {
        'Content-Type': 'application/json',
        ...headers
      }
    };
    const req = http.request(opts, (res) => {
      let data = '';
      res.on('data', (chunk) => (data += chunk));
      res.on('end', () => {
        let parsed = data;
        try {
          parsed = JSON.parse(data);
        } catch (e) {}
        resolve({ status: res.statusCode, headers: res.headers, body: parsed, raw: data });
      });
    });
    req.on('error', reject);
    if (body) {
      req.write(typeof body === 'string' ? body : JSON.stringify(body));
    }
    req.end();
  });
}

async function runTests() {
  console.log('[Test] Khởi động test server trên port', TEST_PORT);
  const server = app.listen(TEST_PORT);

  try {
    // 1. Health check
    console.log('[Test 1] Kiểm tra /health...');
    const health = await request('GET', '/health');
    assert.strictEqual(health.status, 200);
    assert.strictEqual(health.body.status, 'ok');
    console.log(' > PASS /health');

    // 2. View Handlebars render
    console.log('[Test 2] Kiểm tra GET / (Handlebars render)...');
    const home = await request('GET', '/');
    assert.strictEqual(home.status, 200);
    assert.ok(home.raw.includes('Checklist'), 'Trang chủ phải chứa chữ Checklist');
    assert.ok(home.raw.includes('TH CERAMICS') || home.raw.includes('TH Ceramics'), 'Trang chủ phải chứa TH Ceramics');
    assert.ok(home.raw.includes('xlsx.full.min.js'), 'Trang chủ phải chứa thư viện Excel');
    console.log(' > PASS GET / (Handlebars render)');

    // 3. Static assets
    console.log('[Test 3] Kiểm tra file tĩnh /js/config.js và /js/db-adapter.js...');
    const configRes = await request('GET', '/js/config.js');
    assert.strictEqual(configRes.status, 200);
    assert.ok(configRes.raw.includes('BACKEND'), 'config.js phải chứa BACKEND');
    
    const dbAdapterRes = await request('GET', '/js/db-adapter.js');
    assert.strictEqual(dbAdapterRes.status, 200);
    assert.ok(dbAdapterRes.raw.includes('serverBackend'), 'db-adapter.js phải có serverBackend');
    console.log(' > PASS Static assets');

    // 4. API Docs tasks
    console.log('[Test 4] Kiểm tra GET /api/docs/tasks...');
    const tasksRes = await request('GET', '/api/docs/tasks');
    assert.strictEqual(tasksRes.status, 200);
    assert.ok(Array.isArray(tasksRes.body), 'Phải là mảng');
    assert.ok(tasksRes.body.length >= 10, 'Phải có ít nhất 10 task ban đầu');
    console.log(` > PASS GET /api/docs/tasks (${tasksRes.body.length} tasks)`);

    // 5. API Meta settings
    console.log('[Test 5] Kiểm tra GET /api/docs/meta/settings...');
    const metaRes = await request('GET', '/api/docs/meta/settings');
    assert.strictEqual(metaRes.status, 200);
    assert.strictEqual(metaRes.body.id, 'settings');
    assert.ok(metaRes.body.data.brands.th, 'Phải có cấu hình brand th');
    console.log(' > PASS GET /api/docs/meta/settings');

    // 6. CRUD Flow: POST -> PATCH -> DELETE
    console.log('[Test 6] Kiểm tra CRUD Document...');
    const newDoc = { title: 'Task kiểm tra tự động', brand: 'th', priority: 'Cao', kind: 'once' };
    const createRes = await request('POST', '/api/docs/tasks', newDoc);
    assert.strictEqual(createRes.status, 201);
    const createdId = createRes.body.id;
    assert.ok(createdId, 'Phải sinh ra ID');

    // Patch
    const patchRes = await request('PATCH', `/api/docs/tasks/${createdId}`, { priority: 'Thấp' });
    assert.strictEqual(patchRes.status, 200);
    assert.strictEqual(patchRes.body.data.priority, 'Thấp');

    // Verify Read
    const getRes = await request('GET', `/api/docs/tasks/${createdId}`);
    assert.strictEqual(getRes.status, 200);
    assert.strictEqual(getRes.body.data.title, 'Task kiểm tra tự động');

    // Delete
    const delRes = await request('DELETE', `/api/docs/tasks/${createdId}`);
    assert.strictEqual(delRes.status, 200);
    assert.strictEqual(delRes.body.success, true);

    // Verify Gone
    const checkDel = await request('GET', `/api/docs/tasks/${createdId}`);
    assert.strictEqual(checkDel.status, 404);
    console.log(' > PASS CRUD Flow (POST, PATCH, GET, DELETE)');

    // 7. SSE Connection Test
    console.log('[Test 7] Kiểm tra kết nối SSE /api/events...');
    await new Promise((resolve, reject) => {
      const sseReq = http.request({
        hostname: '127.0.0.1',
        port: TEST_PORT,
        path: '/api/events',
        method: 'GET'
      }, (res) => {
        assert.strictEqual(res.statusCode, 200);
        assert.ok(res.headers['content-type'].includes('text/event-stream'));
        res.on('data', (chunk) => {
          const str = chunk.toString();
          if (str.includes(':connected')) {
            console.log(' > PASS SSE connection greeting received');
            sseReq.destroy();
            resolve();
          }
        });
      });
      sseReq.on('error', (e) => {
        if (e.code === 'ECONNRESET' || sseReq.destroyed) {
          resolve(); // Expected on destroy
        } else {
          reject(e);
        }
      });
      sseReq.end();
    });

    console.log('\n========================================');
    console.log(' TẤT CẢ CÁC BƯỚC TEST ĐỀU THÀNH CÔNG! ✓');
    console.log('========================================\n');
  } finally {
    server.close();
  }
}

runTests().catch((err) => {
  console.error('\n[LỖI TEST]:', err);
  process.exit(1);
});
