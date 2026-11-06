/*
 * db-adapter.js — Lớp dữ liệu tương thích Firestore API của Claude artifact.
 * Trang index gọi `await claude.use("db" | "user" | "downloads")`:
 *   db.collection(path).where(field, op, value).onSnapshot(next, err)
 *   db.collection(path).add(data) · db.collection(path).doc(id)
 *   db.doc("col/id").get() / set(data) / update(partial) / delete() / onSnapshot(next)
 * Hỗ trợ 2 backends:
 *   - "server": lưu tập trung trên Node.js + SQLite backend, đồng bộ SSE tức thời cho cả đội
 *   - "local": lưu trong localStorage của trình duyệt (chế độ offline)
 */
(function () {
  "use strict";
  const CFG = window.APP_CONFIG || {};
  const clone = (o) => (o == null ? o : JSON.parse(JSON.stringify(o)));
  const rid = () => Math.random().toString(36).slice(2, 12) + Date.now().toString(36).slice(-6);
  const err = (code, message) => Object.assign(new Error(message || code), { code });
  function deepMerge(a, b) {
    const out = Object.assign({}, a || {});
    for (const [k, v] of Object.entries(b || {})) {
      out[k] = v && typeof v === "object" && !Array.isArray(v) && out[k] && typeof out[k] === "object" && !Array.isArray(out[k]) ? deepMerge(out[k], v) : v;
    }
    return out;
  }
  const OPS = {
    "==": (a, b) => a === b,
    "!=": (a, b) => a !== b,
    "<": (a, b) => a < b,
    "<=": (a, b) => a <= b,
    ">": (a, b) => a > b,
    ">=": (a, b) => a >= b,
    "in": (a, b) => Array.isArray(b) && b.includes(a),
    "not-in": (a, b) => Array.isArray(b) && !b.includes(a),
    "array-contains": (a, b) => Array.isArray(a) && a.includes(b)
  };
  const splitDoc = (path) => {
    const i = path.lastIndexOf("/");
    return [path.slice(0, i), path.slice(i + 1)];
  };

  /* ---------- kho dữ liệu trong bộ nhớ + người nghe thay đổi ---------- */
  function makeCore(backend) {
    const cache = {};          // collection -> Map(id -> data)
    const listeners = new Set();
    const loaded = {};
    const notify = (col) => listeners.forEach((l) => l.col === col && l.fire());
    async function ensure(col) {
      if (!loaded[col]) {
        loaded[col] = backend.load(col).then((rows) => {
          cache[col] = new Map(rows);
          if (backend.watch) backend.watch(col, onRemote);
        });
      }
      return loaded[col];
    }
    function onRemote(col, id, data) {
      if (!cache[col]) cache[col] = new Map();
      if (data == null) cache[col].delete(id);
      else cache[col].set(id, data);
      notify(col);
    }
    const snapDoc = (id, data) => ({
      id,
      exists: data != null,
      data: () => clone(data == null ? undefined : data),
      metadata: { fromCache: false, hasPendingWrites: false }
    });
    function query(col, filters) {
      const q = {
        where: (f, op, v) => query(col, filters.concat([[f, op, v]])),
        orderBy: () => q,
        limit: () => q,
        async get() {
          await ensure(col);
          return mkQuerySnap(col, filters, null);
        },
        onSnapshot(next, onErr) {
          let prev = null, alive = true;
          const l = {
            col,
            fire: () => {
              if (!alive) return;
              const s = mkQuerySnap(col, filters, prev);
              prev = s._map;
              try { next(s); } catch (e) { console.error(e); }
            }
          };
          listeners.add(l);
          ensure(col).then(() => l.fire(), (e) => onErr && onErr(err("unavailable", String(e && e.message || e))));
          return () => { alive = false; listeners.delete(l); };
        },
      };
      return q;
    }
    function mkQuerySnap(col, filters, prevMap) {
      const map = new Map();
      for (const [id, data] of (cache[col] || new Map())) {
        if (filters.every(([f, op, v]) => (OPS[op] || OPS["=="])(data[f], v))) map.set(id, data);
      }
      const docs = [...map.entries()].sort((a, b) => (a[0] < b[0] ? -1 : 1)).map(([id, d]) => snapDoc(id, d));
      const changes = [];
      if (prevMap) {
        for (const [id, d] of map) {
          if (!prevMap.has(id)) changes.push({ type: "added", doc: snapDoc(id, d) });
          else if (JSON.stringify(prevMap.get(id)) !== JSON.stringify(d)) changes.push({ type: "modified", doc: snapDoc(id, d) });
        }
        for (const [id, d] of prevMap) {
          if (!map.has(id)) changes.push({ type: "removed", doc: snapDoc(id, d) });
        }
      } else {
        docs.forEach((d) => changes.push({ type: "added", doc: d }));
      }
      return { docs, size: docs.length, empty: !docs.length, docChanges: () => changes, metadata: { fromCache: false, hasPendingWrites: false }, _map: map };
    }
    function doc(path) {
      const [col, id] = splitDoc(path);
      return {
        id,
        path,
        async get() {
          await ensure(col);
          return snapDoc(id, cache[col].get(id));
        },
        async set(data) {
          await ensure(col);
          const d = clone(data);
          await backend.put(col, id, d);
          cache[col].set(id, d);
          notify(col);
        },
        async update(part) {
          await ensure(col);
          const cur = await backend.read(col, id);
          if (cur == null) throw err("invalid_argument", "Document does not exist: " + path);
          const d = deepMerge(cur, clone(part));
          await backend.put(col, id, d);
          cache[col].set(id, d);
          notify(col);
        },
        async delete() {
          await ensure(col);
          await backend.del(col, id);
          cache[col].delete(id);
          notify(col);
        },
        onSnapshot(next, onErr) {
          let alive = true;
          const l = { col, fire: () => alive && next(snapDoc(id, cache[col] && cache[col].get(id))) };
          listeners.add(l);
          ensure(col).then(() => l.fire(), (e) => onErr && onErr(err("unavailable", String(e))));
          return () => { alive = false; listeners.delete(l); };
        },
        collection: (sub) => collection(path + "/" + sub),
      };
    }
    function collection(col) {
      const q = query(col, []);
      return Object.assign(q, {
        path: col,
        doc: (id) => doc(col + "/" + (id || rid())),
        async add(data) {
          const r = doc(col + "/" + rid());
          await r.set(data);
          return r;
        }
      });
    }
    return { collection, doc, _onRemote: onRemote };
  }

  /* ---------- backend: Node.js + SQLite REST & SSE ---------- */
  function serverBackend() {
    let watcher = null;
    let es = null;
    function connectSSE() {
      if (es || typeof window.EventSource === "undefined") return;
      try {
        es = new EventSource("/api/events");
        es.onmessage = (e) => {
          try {
            if (!e.data || e.data.startsWith(":")) return;
            const msg = JSON.parse(e.data);
            if (watcher && msg.collection && msg.id) {
              watcher(msg.collection, msg.id, msg.type === "delete" ? null : msg.data);
            }
          } catch (err) {
            // Heartbeat or parse skip
          }
        };
        es.onerror = () => {
          // EventSource auto-reconnects
        };
      } catch (e) {
        console.warn("EventSource setup failed:", e);
      }
    }

    return {
      async load(col) {
        connectSSE();
        const res = await fetch("/api/docs/" + encodeURIComponent(col));
        if (!res.ok) throw err("unavailable", "Lỗi tải dữ liệu " + col);
        const data = await res.json();
        return Array.isArray(data) ? data : [];
      },
      async read(col, id) {
        const res = await fetch("/api/docs/" + encodeURIComponent(col) + "/" + encodeURIComponent(id));
        if (res.status === 404) return null;
        if (!res.ok) throw err("unavailable", "Lỗi đọc tài liệu");
        const json = await res.json();
        return json.data ?? null;
      },
      async put(col, id, d) {
        const res = await fetch("/api/docs/" + encodeURIComponent(col) + "/" + encodeURIComponent(id), {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(d)
        });
        if (!res.ok) throw err("unavailable", "Lỗi ghi dữ liệu");
      },
      async del(col, id) {
        const res = await fetch("/api/docs/" + encodeURIComponent(col) + "/" + encodeURIComponent(id), {
          method: "DELETE"
        });
        if (!res.ok) throw err("unavailable", "Lỗi xoá dữ liệu");
      },
      watch(col, fn) {
        watcher = fn;
        connectSSE();
      }
    };
  }

  /* ---------- backend: localStorage ---------- */
  function localBackend() {
    const KEY = CFG.LOCAL_KEY || "checklist-db";
    const readAll = () => { try { return JSON.parse(localStorage.getItem(KEY) || "{}"); } catch (e) { return {}; } };
    const writeAll = (o) => { try { localStorage.setItem(KEY, JSON.stringify(o)); } catch (e) { console.warn("localStorage full/blocked", e); } };
    let watcher = null;
    window.addEventListener("storage", (e) => {
      if (e.key !== KEY || !watcher) return;
      const all = readAll();
      for (const col of Object.keys(all)) {
        for (const [id, d] of Object.entries(all[col])) watcher(col, id, d);
      }
    });
    return {
      async load(col) {
        let all = readAll();
        if (!Object.keys(all).length && CFG.SEED_URL) {
          try {
            const seed = await (await fetch(CFG.SEED_URL)).json();
            all = seed;
            writeAll(all);
          } catch (e) {}
        }
        return Object.entries(all[col] || {});
      },
      async read(col, id) { const all = readAll(); return (all[col] || {})[id] ?? null; },
      async put(col, id, d) { const all = readAll(); (all[col] = all[col] || {})[id] = d; writeAll(all); },
      async del(col, id) { const all = readAll(); if (all[col]) delete all[col][id]; writeAll(all); },
      watch(col, fn) { watcher = fn; },
    };
  }

  let dbApi = null;
  function getDb() {
    if (dbApi) return dbApi;
    const mode = CFG.BACKEND || "server";
    const be = mode === "local" ? localBackend() : serverBackend();
    dbApi = makeCore(be);
    return dbApi;
  }

  window.claude = {
    use: async (name) => {
      try {
        if (name === "db") return getDb();
        if (name === "user") return userApi();
        if (name === "downloads") return downloadsApi;
      } catch (e) { console.error(e); }
      return null;
    },
  };
})();
