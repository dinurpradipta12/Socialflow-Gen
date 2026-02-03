# Socialflow Server (example)

Minimal example server that accepts external webhooks, validates HMAC signatures, stores events in-memory, and broadcasts to connected admin dashboards via WebSocket.

Quick start

```bash
cd server
npm install
cp .env.example .env
# edit .env ADMIN_SECRET if needed
npm run dev
```

Endpoints
- `POST /webhooks/receive` — accepts webhooks from external apps. Headers: `X-App-Id`, `X-Signature`, `X-Timestamp`.
- `POST /api/admin/apps/register` — register new external app (returns `api_key`).
- `GET /api/admin/members` — list members.
- `POST /api/admin/members/:id/approve` — approve a pending member.

WebSocket
- `ws://HOST:PORT/?token=<ADMIN_SECRET>` connect as admin and receive realtime events.
