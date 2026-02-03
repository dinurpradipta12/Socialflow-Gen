const express = require('express');
const bodyParser = require('body-parser');
const http = require('http');
const { WebSocketServer } = require('ws');
const { initDb } = require('./db');
const db = require('./db').default;
const { encryptText, decryptText } = require('./crypto');
const crypto = require('crypto');

const dotenv = require('dotenv');
dotenv.config();

const PORT = process.env.PORT ? Number(process.env.PORT) : 4000;
const ADMIN_SECRET = process.env.ADMIN_SECRET || 'change_me_to_secure_value';

const app = express();
const server = http.createServer(app);

// WebSocket server for admin realtime
const wss = new WebSocketServer({ server });
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

function broadcast(payload: any) {
  const raw = JSON.stringify(payload);
  for (const client of wss.clients) {
    if (client.readyState === 1) client.send(raw);
  }
}

app.use('/api/admin', express.json());

async function start() {
  await initDb();

  app.post('/api/admin/apps/register', async (req, res) => {
    const secret = req.header('x-admin-secret');
    if (secret !== ADMIN_SECRET) return res.status(401).json({ error: 'unauthorized' });
    const { app_id, webhook_url, name, provided_api_key } = req.body;
    if (!app_id) return res.status(400).json({ error: 'app_id required' });
    // allow operator to provide an API key (e.g., vendor-provided) or generate one
    const apiKey = provided_api_key && typeof provided_api_key === 'string' && provided_api_key.length > 0
      ? provided_api_key
      : 'sk_live_' + crypto.randomBytes(16).toString('hex');
    const encrypted = encryptText(apiKey);
    // if app exists, update api key and webhook_url/name; otherwise insert
    const exists = await db('apps').where({ app_id }).first();
    if (exists) {
      await db('apps').where({ app_id }).update({ api_key_encrypted: encrypted, webhook_url, name });
    } else {
      await db('apps').insert({ app_id, webhook_url, name, api_key_encrypted: encrypted });
    }
    return res.json({ app_id, api_key: apiKey });
  });

  app.get('/api/admin/members', async (req, res) => {
    const secret = req.header('x-admin-secret');
    if (secret !== ADMIN_SECRET) return res.status(401).json({ error: 'unauthorized' });
    const status = req.query.status as string | undefined;
    const q = db('members').select('*');
    if (status) q.where('status', String(status));
    const rows = await q;
    res.json(rows);
  });

  app.post('/api/admin/members/:id/approve', express.json(), async (req, res) => {
    const secret = req.header('x-admin-secret');
    if (secret !== ADMIN_SECRET) return res.status(401).json({ error: 'unauthorized' });
    const id = req.params.id;
    const member = await db('members').where({ id }).first();
    if (!member) return res.status(404).json({ error: 'member not found' });
    await db('members').where({ id }).update({ status: 'active', approved_by: 'admin', approved_at: new Date().toISOString() });
    const updated = await db('members').where({ id }).first();
    broadcast({ type: 'member.approved', data: updated });
    res.json(updated);
  });

  // Raw body for webhook verification
  app.post('/webhooks/receive', bodyParser.raw({ type: '*/*' }), async (req, res) => {
    try {
      const raw = req.body as Buffer;
      const appId = (req.header('x-app-id') || '').toString();
      const signature = (req.header('x-signature') || '').toString();
      const ts = (req.header('x-timestamp') || '').toString();
      if (!appId || !signature) return res.status(400).send('missing headers');
      const record = await db('apps').where({ app_id: appId }).first();
      if (!record) return res.status(404).send('app not registered');
      if (ts) {
        const age = Math.abs(Date.now() - Number(ts));
        if (age > 1000 * 60 * 5) return res.status(400).send('timestamp out of range');
      }
      const apiKey = decryptText(record.api_key_encrypted);
      const expected = crypto.createHmac('sha256', apiKey).update(raw).digest('hex');
      const provided = signature.replace(/^sha256=/, '');
      const match = crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(provided));
      if (!match) return res.status(401).send('invalid signature');
      const payload = JSON.parse(raw.toString('utf8'));
      // persist event
      await db('events').insert({ app_id: appId, type: payload.type, payload: JSON.stringify(payload) });
      if (payload.type === 'member.created' && payload.data) {
        const mid = 'm_' + crypto.randomBytes(8).toString('hex');
        const member = {
          id: mid,
          external_id: payload.data.external_id || mid,
          app_id: appId,
          email: payload.data.email,
          status: 'pending',
          metadata: JSON.stringify(payload.data.metadata || {}),
          created_at: new Date().toISOString(),
        } as any;
        await db('members').insert(member);
        broadcast({ type: 'member.created', data: member });
      } else if (payload.type && payload.data) {
        broadcast(payload);
      }
      res.json({ ok: true });
    } catch (err) {
      console.error('webhook error', err);
      res.status(500).send('server error');
    }
  });

  server.listen(PORT, () => {
    console.log(`Server listening on http://localhost:${PORT}`);
  });
}

start().catch((err) => {
  console.error('startup error', err);
  process.exit(1);
});
