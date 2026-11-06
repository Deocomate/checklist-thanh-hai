const path = require('path');
const fs = require('fs');

let DatabaseSync;
try {
  // Ưu tiên node:sqlite có sẵn trong Node.js 22.5+ và 24+
  DatabaseSync = require('node:sqlite').DatabaseSync;
} catch (e) {
  try {
    const BetterSqlite3 = require('better-sqlite3');
    DatabaseSync = function (filename) {
      const db = new BetterSqlite3(filename);
      return {
        exec: (sql) => db.exec(sql),
        prepare: (sql) => {
          const stmt = db.prepare(sql);
          return {
            run: (...args) => stmt.run(...args),
            get: (...args) => stmt.get(...args),
            all: (...args) => stmt.all(...args)
          };
        },
        close: () => db.close()
      };
    };
  } catch (err) {
    throw new Error('Không tìm thấy node:sqlite hoặc better-sqlite3: ' + err.message);
  }
}

function deepMerge(target, source) {
  const out = Object.assign({}, target || {});
  for (const [k, v] of Object.entries(source || {})) {
    if (v && typeof v === 'object' && !Array.isArray(v) && out[k] && typeof out[k] === 'object' && !Array.isArray(out[k])) {
      out[k] = deepMerge(out[k], v);
    } else {
      out[k] = v;
    }
  }
  return out;
}

const dbDir = path.resolve(process.env.DB_PATH ? path.dirname(process.env.DB_PATH) : path.join(__dirname, '../data'));
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

const dbPath = process.env.DB_PATH ? path.resolve(process.env.DB_PATH) : path.join(dbDir, 'checklist.db');
const db = new DatabaseSync(dbPath);

// Cấu hình tối ưu hiệu năng
db.exec('PRAGMA journal_mode = WAL;');
db.exec('PRAGMA synchronous = NORMAL;');
db.exec('PRAGMA foreign_keys = ON;');

// Khởi tạo bảng app_docs tương thích 100% Supabase/Firestore
db.exec(`
  CREATE TABLE IF NOT EXISTS app_docs (
    collection  TEXT NOT NULL,
    id          TEXT NOT NULL,
    data        TEXT NOT NULL DEFAULT '{}',
    updated_at  TEXT NOT NULL DEFAULT (datetime('now')),
    PRIMARY KEY (collection, id)
  );
  CREATE INDEX IF NOT EXISTS idx_app_docs_collection ON app_docs(collection);
`);

// Prepared statements
const stmts = {
  getDocs: db.prepare('SELECT id, data FROM app_docs WHERE collection = ? ORDER BY id ASC'),
  getDoc: db.prepare('SELECT data FROM app_docs WHERE collection = ? AND id = ?'),
  putDoc: db.prepare(`
    INSERT INTO app_docs (collection, id, data, updated_at)
    VALUES (?, ?, ?, datetime('now'))
    ON CONFLICT(collection, id) DO UPDATE SET
      data = excluded.data,
      updated_at = datetime('now')
  `),
  deleteDoc: db.prepare('DELETE FROM app_docs WHERE collection = ? AND id = ?'),
  countAll: db.prepare('SELECT COUNT(*) as count FROM app_docs')
};

function getDocs(collection) {
  const rows = stmts.getDocs.all(collection);
  return rows.map((r) => [r.id, JSON.parse(r.data)]);
}

function getDoc(collection, id) {
  const row = stmts.getDoc.get(collection, id);
  if (!row) return null;
  return JSON.parse(row.data);
}

function putDoc(collection, id, data) {
  const jsonStr = JSON.stringify(data);
  stmts.putDoc.run(collection, id, jsonStr);
  return data;
}

function patchDoc(collection, id, partialData) {
  const current = getDoc(collection, id);
  if (current == null) {
    throw new Error('Document does not exist: ' + collection + '/' + id);
  }
  const merged = deepMerge(current, partialData);
  putDoc(collection, id, merged);
  return merged;
}

function deleteDoc(collection, id) {
  const result = stmts.deleteDoc.run(collection, id);
  return result.changes > 0;
}

function seedFromExport(filePath) {
  const targetFile = filePath || path.join(__dirname, '../data/export.json');
  if (!fs.existsSync(targetFile)) return 0;

  const content = JSON.parse(fs.readFileSync(targetFile, 'utf8'));
  let inserted = 0;

  db.exec('BEGIN TRANSACTION;');
  try {
    for (const [collection, docs] of Object.entries(content)) {
      if (typeof docs !== 'object' || docs === null) continue;
      for (const [id, data] of Object.entries(docs)) {
        stmts.putDoc.run(collection, id, JSON.stringify(data));
        inserted++;
      }
    }
    db.exec('COMMIT;');
  } catch (err) {
    db.exec('ROLLBACK;');
    throw err;
  }
  return inserted;
}

// Tự động seed nếu database trống
const countRow = stmts.countAll.get();
if (countRow && countRow.count === 0) {
  try {
    const seeded = seedFromExport();
    console.log(`[DB] Đã khởi tạo và tự động nạp ${seeded} tài liệu mẫu từ data/export.json.`);
  } catch (err) {
    console.warn('[DB] Lỗi nạp dữ liệu mẫu ban đầu:', err.message);
  }
}

module.exports = {
  db,
  getDocs,
  getDoc,
  putDoc,
  patchDoc,
  deleteDoc,
  seedFromExport,
  deepMerge
};
