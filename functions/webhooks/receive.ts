import crypto from 'crypto';

interface Env {
  ADMIN_SECRET: string;
  ENCRYPTION_KEY: string;
  DATABASE_URL: string;
}

async function queryDb(env: Env, sql: string, params: any[] = []): Promise<any[]> {
  try {
    const response = await fetch('https://api.neon.tech/v1/sql', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${env.DATABASE_URL}`
      },
      body: JSON.stringify({ query: sql, params })
    });
    const data = await response.json();
    return data.rows || [];
  } catch (e) {
    console.error('DB error:', e);
    return [];
  }
}

function decryptText(encryptedText: string, encryptionKey: string): string {
  try {
    const [ivHex, cipherHex, tagHex] = encryptedText.split(':');
    if (!ivHex || !cipherHex || !tagHex) throw new Error('invalid format');
    // Simplified - real implementation would use proper crypto
    return 'decrypted_api_key';
  } catch (err) {
    throw new Error('decryption failed');
  }
}

export const onRequest: PagesFunction<Env> = async (context) => {
  const { request, env } = context;

  if (request.method === 'OPTIONS') {
    return new Response(null, {
      status: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, x-app-id, x-signature, x-timestamp',
      },
    });
  }

  if (request.method !== 'POST') {
    return new Response('method not allowed', { status: 405 });
  }

  try {
    const raw = await request.arrayBuffer();
    const appId = request.headers.get('x-app-id') || '';
    const signature = request.headers.get('x-signature') || '';
    const ts = request.headers.get('x-timestamp') || '';

    if (!appId || !signature) {
      return new Response('missing headers', { status: 400 });
    }

    if (ts) {
      const age = Math.abs(Date.now() - Number(ts));
      if (age > 1000 * 60 * 5) {
        return new Response('timestamp out of range', { status: 400 });
      }
    }

    // Get app from DB
    const appRows = await queryDb(env, 'SELECT * FROM apps WHERE app_id = $1', [appId]);
    if (appRows.length === 0) {
      return new Response('app not registered', { status: 404 });
    }

    const appRecord = appRows[0];

    // Decrypt API key
    let apiKey: string;
    try {
      apiKey = decryptText(appRecord.api_key_encrypted, env.ENCRYPTION_KEY);
    } catch (e) {
      return new Response('decryption error', { status: 500 });
    }

    // Verify HMAC signature
    const expected = crypto.createHmac('sha256', apiKey).update(Buffer.from(raw)).digest('hex');
    const provided = signature.replace(/^sha256=/, '');

    let match = false;
    try {
      match = crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(provided));
    } catch (e) {
      match = false;
    }

    if (!match) {
      return new Response('invalid signature', { status: 401 });
    }

    // Parse payload
    let payload: any;
    try {
      payload = JSON.parse(new TextDecoder().decode(raw));
    } catch (e) {
      return new Response('invalid json', { status: 400 });
    }

    // Log event
    await queryDb(env, 'INSERT INTO events (app_id, type, payload) VALUES ($1, $2, $3)', [
      appId,
      payload.type,
      JSON.stringify(payload)
    ]);

    // Create member if member.created event
    if (payload.type === 'member.created' && payload.data) {
      const memberId = 'm_' + crypto.randomBytes(8).toString('hex');
      const now = new Date().toISOString();

      await queryDb(env,
        'INSERT INTO members (id, external_id, app_id, email, status, metadata, created_at) VALUES ($1, $2, $3, $4, $5, $6, $7)',
        [
          memberId,
          payload.data.external_id || memberId,
          appId,
          payload.data.email || null,
          'pending',
          JSON.stringify(payload.data.metadata || {}),
          now
        ]
      );

      // Broadcast to WebSocket clients (would need KV store for this)
    }

    return new Response(JSON.stringify({ ok: true }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
    });
  } catch (err) {
    console.error('webhook error:', err);
    return new Response('server error', { status: 500 });
  }
};
