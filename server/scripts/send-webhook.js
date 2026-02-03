const crypto = require('crypto');
const http = require('http');

const WEBHOOK_URL = process.env.WEBHOOK_URL || 'http://localhost:4000/webhooks/receive';
const APP_ID = process.env.APP_ID || 'db_sf_prod_8823';
const API_KEY = process.env.API_KEY || 'sk_live_sf_9921';

async function send() {
  const payload = {
    type: 'member.created',
    data: { external_id: 'u_123', email: 'test@example.com', metadata: { plan: 'pro' } }
  };
  const raw = Buffer.from(JSON.stringify(payload), 'utf8');
  const timestamp = Date.now().toString();
  const hmac = crypto.createHmac('sha256', API_KEY).update(raw).digest('hex');
  const signature = `sha256=${hmac}`;

  const url = new URL(WEBHOOK_URL);
  const opts = {
    hostname: url.hostname,
    port: url.port || 80,
    path: url.pathname + (url.search || ''),
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': raw.length,
      'X-App-Id': APP_ID,
      'X-Timestamp': timestamp,
      'X-Signature': signature
    }
  };

  const req = http.request(opts, (res) => {
    let body = '';
    res.on('data', (c) => body += c.toString());
    res.on('end', () => {
      console.log('status', res.statusCode);
      console.log('body', body);
    });
  });
  req.on('error', (err) => console.error('request error', err));
  req.write(raw);
  req.end();
}

send();
