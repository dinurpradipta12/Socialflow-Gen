import crypto from 'crypto';

interface Env {
  ADMIN_SECRET: string;
  ENCRYPTION_KEY: string;
  DATABASE_URL: string;
}

async function queryDb(env: Env, sql: string, params: any[] = []): Promise<any[]> {
  // For Neon.tech or Supabase - simple fetch to their API
  try {
    const response = await fetch('https://api.neon.tech/v1/sql', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${env.DATABASE_URL}`
      },
      body: JSON.stringify({
        query: sql,
        params
      })
    });
    const data = await response.json();
    return data.rows || [];
  } catch (e) {
    console.error('DB error:', e);
    return [];
  }
}

async function registerApp(request: Request, env: Env): Promise<Response> {
  const secret = request.headers.get('x-admin-secret');
  if (secret !== env.ADMIN_SECRET) {
    return new Response(JSON.stringify({ error: 'unauthorized' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  try {
    const body = await request.json() as any;
    const { app_id, webhook_url, name, provided_api_key } = body;

    if (!app_id) {
      return new Response(JSON.stringify({ error: 'app_id required' }), { status: 400 });
    }

    const apiKey = provided_api_key && typeof provided_api_key === 'string' && provided_api_key.length > 0
      ? provided_api_key
      : 'sk_live_' + crypto.randomBytes(16).toString('hex');

    return new Response(JSON.stringify({ app_id, api_key: apiKey }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: 'request error' }), { status: 500 });
  }
}

async function listMembers(request: Request, env: Env): Promise<Response> {
  const secret = request.headers.get('x-admin-secret');
  if (secret !== env.ADMIN_SECRET) {
    return new Response(JSON.stringify({ error: 'unauthorized' }), { status: 401 });
  }

  const url = new URL(request.url);
  const status = url.searchParams.get('status');

  try {
    let sql = 'SELECT * FROM members';
    const params: any[] = [];
    if (status) {
      sql += ' WHERE status = $1';
      params.push(status);
    }

    const rows = await queryDb(env, sql, params);
    return new Response(JSON.stringify(rows), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: 'db error' }), { status: 500 });
  }
}

async function approveMember(request: Request, env: Env, memberId: string): Promise<Response> {
  const secret = request.headers.get('x-admin-secret');
  if (secret !== env.ADMIN_SECRET) {
    return new Response(JSON.stringify({ error: 'unauthorized' }), { status: 401 });
  }

  try {
    const now = new Date().toISOString();
    const sql = 'UPDATE members SET status = $1, approved_by = $2, approved_at = $3 WHERE id = $4 RETURNING *';
    const rows = await queryDb(env, sql, ['active', 'admin', now, memberId]);

    if (rows.length === 0) {
      return new Response(JSON.stringify({ error: 'member not found' }), { status: 404 });
    }

    return new Response(JSON.stringify(rows[0]), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: 'db error' }), { status: 500 });
  }
}

export const onRequest: PagesFunction<Env> = async (context) => {
  const { request, env } = context;
  const url = new URL(request.url);
  const method = request.method;

  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, x-admin-secret, x-app-id, x-signature, x-timestamp',
  };

  if (method === 'OPTIONS') {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    if (url.pathname === '/api/admin/apps/register' && method === 'POST') {
      const res = await registerApp(request, env);
      Object.entries(corsHeaders).forEach(([k, v]) => res.headers.set(k, v));
      return res;
    }

    if (url.pathname === '/api/admin/members' && method === 'GET') {
      const res = await listMembers(request, env);
      Object.entries(corsHeaders).forEach(([k, v]) => res.headers.set(k, v));
      return res;
    }

    if (url.pathname.match(/^\/api\/admin\/members\/[^/]+\/approve$/) && method === 'POST') {
      const memberId = url.pathname.split('/')[4];
      const res = await approveMember(request, env, memberId);
      Object.entries(corsHeaders).forEach(([k, v]) => res.headers.set(k, v));
      return res;
    }

    return new Response(JSON.stringify({ error: 'not found' }), {
      status: 404,
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
    });
  } catch (err) {
    console.error(err);
    return new Response(JSON.stringify({ error: 'internal server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
    });
  }
};
