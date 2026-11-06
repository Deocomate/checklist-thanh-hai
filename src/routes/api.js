const express = require('express');
const router = express.Router();
const db = require('../db');
const sse = require('../services/sse');

const rid = () => Math.random().toString(36).slice(2, 12) + Date.now().toString(36).slice(-6);

// Server-Sent Events stream cho realtime sync
router.get('/events', (req, res) => {
  sse.subscribe(req, res);
});

// Lấy toàn bộ documents trong collection
router.get('/docs/:collection', (req, res) => {
  try {
    const { collection } = req.params;
    const docs = db.getDocs(collection);
    res.json(docs);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Lấy 1 document theo collection và id
router.get('/docs/:collection/:id', (req, res) => {
  try {
    const { collection, id } = req.params;
    const data = db.getDoc(collection, id);
    if (data == null) {
      return res.status(404).json({ error: 'Document not found' });
    }
    res.json({ id, data });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Thêm mới document
router.post('/docs/:collection', (req, res) => {
  try {
    const { collection } = req.params;
    const data = req.body;
    const id = (data && data.id) || rid();
    
    // Nếu data có field id bên trong, ta vẫn lưu nguyên vẹn
    db.putDoc(collection, id, data);
    sse.broadcast('change', { collection, id, data });
    
    res.status(201).json({ id, data });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Ghi đè / Upsert document
router.put('/docs/:collection/:id', (req, res) => {
  try {
    const { collection, id } = req.params;
    const data = req.body;
    
    db.putDoc(collection, id, data);
    sse.broadcast('change', { collection, id, data });
    
    res.json({ id, data });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Cập nhật từng phần (Deep-merge)
router.patch('/docs/:collection/:id', (req, res) => {
  try {
    const { collection, id } = req.params;
    const partial = req.body;
    
    const merged = db.patchDoc(collection, id, partial);
    sse.broadcast('change', { collection, id, data: merged });
    
    res.json({ id, data: merged });
  } catch (err) {
    if (err.message && err.message.startsWith('Document does not exist')) {
      return res.status(404).json({ error: err.message });
    }
    res.status(500).json({ error: err.message });
  }
});

// Xoá document
router.delete('/docs/:collection/:id', (req, res) => {
  try {
    const { collection, id } = req.params;
    const deleted = db.deleteDoc(collection, id);
    
    sse.broadcast('delete', { collection, id });
    res.json({ success: deleted, id });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
