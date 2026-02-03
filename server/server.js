const express = require('express');
const bodyParser = require('body-parser');
const http = require('http');
const { WebSocketServer } = require('ws');
const crypto = require('crypto');
const sqlite3 = require('sqlite3');
const path = require('path');
require('dotenv').config();

const PORT = process.env.PORT ? Number(process.env.PORT) : 4000;
const ADMIN_SECRET = process.env.ADMIN_SECRET || 'change_me_to_secure_value';
const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || '';

const app = express();
const server = http.createServer(app);
const wss = new WebSocketServer({ server });

// Database setup
const dbPath = path.resolve(__dirname, 'data.sqlite');
const db = new sqlite3.Database(dbPath);

db.configure('busyTimeout', 5000);

// Encryption helpers
function getKey() {
  if (!ENCRYPTION_KEY || Buffer.from(ENCRYPTION_KEY, 'utf8').length < 32) {
    throw new Error('ENCRYPTION_KEY must be set and 32 bytes');
  }
  return Buffer.from(ENCRYPTION_KEY, 'utf8').slice(0, 32);
}

function encryptText(plain) {
  const key = getKey();
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
  const encrypted = Buffer.concat([cipher.update(plain, 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();
  return `${iv.toString('hex')}:${encrypted.toString('hex')}:${tag.toString('hex')}`;
}

function decryptText(encryptedText) {
  const key = getKey();
  const [ivHex, cipherHex, tagHex] = encryptedText.split(':');
  if (!ivHex || !cipherHex || !tagHex) throw new Error('invalid encrypted payload');
  const iv = Buffer.from(ivHex, 'hex');
  const encrypted = Buffer.from(cipherHex, 'hex');
  const tag = Buffer.from(tagHex, 'hex');
  const decipher = crypto.createDecipheriv('aes-256-gcm', key, iv);
  decipher.setAuthTag(tag);
  const decrypted = Buffer.concat([decipher.update(encrypted), decipher.final()]);
  return decrypted.toString('utf8');
}

// Initialize DB
function initDb() {
  return new Promise((resolve, reject) => {
    db.serialize(() => {
      db.run(`CREATE TABLE IF NOT EXISTS apps (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        app_id TEXT UNIQUE NOT NULL,
        name TEXT,
        webhook_url TEXT,
        api_key_encrypted TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )`, (err) => {
        if (err && !err.message.includes('already exists')) console.error('apps table error', err);
      });

      db.run(`CREATE TABLE IF NOT EXISTS members (
        id TEXT PRIMARY KEY,
        external_id TEXT NOT NULL,
        app_id TEXT NOT NULL,
        email TEXT,
        status TEXT NOT NULL DEFAULT 'pending',
        metadata TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        approved_by TEXT,
        approved_at DATETIME
      )`, (err) => {
        if (err && !err.message.includes('already exists')) console.error('members table error', err);
      });

      db.run(`CREATE TABLE IF NOT EXISTS events (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        app_id TEXT NOT NULL,
        type TEXT NOT NULL,
        payload TEXT,
        received_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )`, (err) => {
        if (err && !err.message.includes('already exists')) console.error('events table error', err);
        resolve();
      });
    });
  });
}

// WebSocket handler
wss.on('connection', (ws, req) => {
  const url = req.url || '';
  const params = new URLSearchParams(url.split('?')[1]);
  const token = params.get('token');
  if (token !== ADMIN_SECRET) {
    ws.close();
    return;
  }
  ws.send(JSON.stringify({ type: 'connected', message: 'admin' }));
});

function broadcast(payload) {
  const raw = JSON.stringify(payload);
  for (const client of wss.clients) {
    if (client.readyState === 1) client.send(raw);
  }
}

app.use('/api/admin', express.json());

// API: register app
app.post('/api/admin/apps/register', (req, res) => {
  const secret = req.header('x-admin-secret');
  if (secret !== ADMIN_SECRET) return res.status(401).json({ error: 'unauthorized' });
  const { app_id, webhook_url, name, provided_api_key } = req.body;
  if (!app_id) return res.status(400).json({ error: 'app_id required' });
  
  const apiKey = (provided_api_key && typeof provided_api_key === 'string' && provided_api_key.length > 0)
    ? provided_api_key
    : 'sk_live_' + crypto.randomBytes(16).toString('hex');
  
  const encrypted = encryptText(apiKey);
  
  db.get('SELECT * FROM apps WHERE app_id = ?', [app_id], (err, row) => {
    if (err) return res.status(500).json({ error: err.message });
    if (row) {
      db.run('UPDATE apps SET api_key_encrypted = ?, webhook_url = ?, name = ? WHERE app_id = ?', 
        [encrypted, webhook_url, name, app_id], function(e) {
          if (e) return res.status(500).json({ error: e.message });
          res.json({ app_id, api_key: apiKey });
        }
      );
    } else {
      db.run('INSERT INTO apps (app_id, name, webhook_url, api_key_encrypted) VALUES (?, ?, ?, ?)', 
        [app_id, name, webhook_url, encrypted], function(e) {
          if (e) return res.status(500).json({ error: e.message });
          res.json({ app_id, api_key: apiKey });
        }
      );
    }
  });
});

// API: list members
app.get('/api/admin/members', (req, res) => {
  const secret = req.header('x-admin-secret');
  if (secret !== ADMIN_SECRET) return res.status(401).json({ error: 'unauthorized' });
  const status = req.query.status;
  
  let sql = 'SELECT * FROM members';
  let params = [];
  if (status) {
    sql += ' WHERE status = ?';
    params.push(status);
  }
  
  db.all(sql, params, (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows || []);
  });
});

// API: approve member
app.post('/api/admin/members/:id/approve', express.json(), (req, res) => {
  const secret = req.header('x-admin-secret');
  if (secret !== ADMIN_SECRET) return res.status(401).json({ error: 'unauthorized' });
  const id = req.params.id;
  const now = new Date().toISOString();
  
  db.run('UPDATE members SET status = ?, approved_by = ?, approved_at = ? WHERE id = ?', 
    ['active', 'admin', now, id], function(err) {
      if (err) return res.status(500).json({ error: err.message });
      
      db.get('SELECT * FROM members WHERE id = ?', [id], (getErr, member) => {
        if (getErr) return res.status(500).json({ error: getErr.message });
        if (!member) return res.status(404).json({ error: 'member not found' });
        
        broadcast({ type: 'member.approved', data: member });
        res.json(member);
      });
    }
  );
});

// Webhook receiver
app.post('/webhooks/receive', bodyParser.raw({ type: '*/*' }), (req, res) => {
  try {
    const raw = req.body;
    const appId = (req.header('x-app-id') || '').toString();
    const signature = (req.header('x-signature') || '').toString();
    const ts = (req.header('x-timestamp') || '').toString();
    
    if (!appId || !signature) return res.status(400).send('missing headers');
    
    db.get('SELECT * FROM apps WHERE app_id = ?', [appId], (err, record) => {
      if (err) return res.status(500).send('db error');
      if (!record) return res.status(404).send('app not registered');
      
      // Timestamp check (optional)
      if (ts) {
        const age = Math.abs(Date.now() - Number(ts));
        if (age > 1000 * 60 * 5) return res.status(400).send('timestamp out of range');
      }
      
      // Verify signature
      let apiKey;
      try {
        apiKey = decryptText(record.api_key_encrypted);
      } catch (e) {
        return res.status(500).send('decryption error');
      }
      
      const expected = crypto.createHmac('sha256', apiKey).update(raw).digest('hex');
      const provided = signature.replace(/^sha256=/, '');
      
      let match = false;
      try {
        match = crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(provided));
      } catch (e) {
        match = false;
      }
      
      if (!match) return res.status(401).send('invalid signature');
      
      // Parse and persist event
      let payload;
      try {
        payload = JSON.parse(raw.toString('utf8'));
      } catch (e) {
        return res.status(400).send('invalid json');
      }
      
      db.run('INSERT INTO events (app_id, type, payload) VALUES (?, ?, ?)', 
        [appId, payload.type, JSON.stringify(payload)], function(err) {
          if (err) console.error('event insert error', err);
        }
      );
      
      // Handle member.created event
      if (payload.type === 'member.created' && payload.data) {
        const mid = 'm_' + crypto.randomBytes(8).toString('hex');
        const member = {
          id: mid,
          external_id: payload.data.external_id || mid,
          app_id: appId,
          email: payload.data.email || null,
          status: 'pending',
          metadata: JSON.stringify(payload.data.metadata || {}),
          created_at: new Date().toISOString(),
          approved_by: null,
          approved_at: null
        };
        
        db.run('INSERT INTO members (id, external_id, app_id, email, status, metadata, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)', 
          [member.id, member.external_id, member.app_id, member.email, member.status, member.metadata, member.created_at], 
          function(err) {
            if (err) console.error('member insert error', err);
            broadcast({ type: 'member.created', data: member });
          }
        );
      } else if (payload.type && payload.data) {
        broadcast(payload);
      }
      
      res.json({ ok: true });
    });
  } catch (err) {
    console.error('webhook error', err);
    res.status(500).send('server error');
  }
});

async function start() {
  await initDb();
  server.listen(PORT, () => {
    console.log(`Server listening on http://localhost:${PORT}`);
    console.log(`Admin WebSocket: ws://localhost:${PORT}/?token=${ADMIN_SECRET}`);
  });
}

start().catch((err) => {
  console.error('startup error', err);
  process.exit(1);
});
