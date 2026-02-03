# Cloudflare Pages Functions Setup

Backend API untuk SocialFlow Gen menggunakan Cloudflare Pages Functions yang terintegrasi langsung dengan Pages deployment.

## Struktur

```
functions/
├── api/
│   └── admin/
│       └── [[path]].ts          # Admin API endpoints
└── webhooks/
    └── receive.ts               # Webhook receiver
```

## Endpoints

### Admin APIs
```
POST /api/admin/apps/register           - Daftar aplikasi baru
GET /api/admin/members                  - List members (with optional ?status=pending)
POST /api/admin/members/:id/approve     - Approve member
```

**Header yang diperlukan:**
- `x-admin-secret`: Admin secret key
- `Content-Type: application/json`

### Webhook
```
POST /webhooks/receive                  - Menerima webhook dari aplikasi eksternal
```

**Header yang diperlukan:**
- `x-app-id`: Application ID
- `x-signature`: HMAC-SHA256 signature (format: sha256=hex)
- `x-timestamp`: Unix timestamp

## Konfigurasi Production

1. **Login ke Cloudflare Dashboard**
   - Buka project: socialflow-gen.pages.dev
   - Ke tab "Settings"

2. **Set Environment Variables**
   - Klik "Variables and Secrets"
   - Tambah Secret:
     - `ADMIN_SECRET`: `admin_secret_prod_secure`
     - `ENCRYPTION_KEY`: 32-byte hex string
     - `DATABASE_URL`: PostgreSQL connection string (dari Neon.tech atau Supabase)

3. **Deploy**
   ```bash
   git push origin main
   ```
   Cloudflare otomatis trigger deployment

## Database Setup (Neon.tech)

1. Daftar di [neon.tech](https://neon.tech)
2. Create new project
3. Copy connection string → gunakan untuk `DATABASE_URL`
4. Create tables:

```sql
CREATE TABLE apps (
  id SERIAL PRIMARY KEY,
  app_id TEXT UNIQUE NOT NULL,
  name TEXT,
  webhook_url TEXT,
  api_key_encrypted TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE members (
  id TEXT PRIMARY KEY,
  external_id TEXT NOT NULL,
  app_id TEXT NOT NULL,
  email TEXT,
  status TEXT DEFAULT 'pending',
  metadata TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  approved_by TEXT,
  approved_at TIMESTAMP
);

CREATE TABLE events (
  id SERIAL PRIMARY KEY,
  app_id TEXT NOT NULL,
  type TEXT NOT NULL,
  payload TEXT,
  received_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

## Testing

### Register App
```bash
curl -X POST https://socialflow-gen.pages.dev/api/admin/apps/register \
  -H "x-admin-secret: admin_secret_prod_secure" \
  -H "Content-Type: application/json" \
  -d '{
    "app_id": "app_test_123",
    "name": "Test App",
    "provided_api_key": "sk_live_xxxx"
  }'
```

### Send Webhook
```bash
curl -X POST https://socialflow-gen.pages.dev/webhooks/receive \
  -H "x-app-id: app_test_123" \
  -H "x-signature: sha256=<hmac_hex>" \
  -H "Content-Type: application/json" \
  -d '{
    "type": "member.created",
    "data": {
      "external_id": "u_123",
      "email": "user@example.com",
      "metadata": {"plan": "pro"}
    }
  }'
```

### List Members
```bash
curl -X GET "https://socialflow-gen.pages.dev/api/admin/members?status=pending" \
  -H "x-admin-secret: admin_secret_prod_secure"
```

## Catatan Penting

- **Crypto**: Pages Functions support Node.js crypto API
- **Database**: Gunakan Neon.tech (PostgreSQL dengan free tier) atau Supabase
- **Secrets**: Jangan commit `.env` files - gunakan Cloudflare dashboard
- **WebSocket**: Untuk real-time updates, gunakan Cloudflare Durable Objects atau polling
- **Rate Limiting**: Implement di Cloudflare Workers rules tab

## Troubleshooting

**401 Unauthorized**
- Check `ADMIN_SECRET` di environment variables
- Ensure header `x-admin-secret` matches

**404 App Not Registered**
- Register app dulu dengan `/api/admin/apps/register`
- Verify `x-app-id` header cocok dengan `app_id` yang terdaftar

**Signature Invalid**
- Pastikan HMAC dihitung dengan API key yang benar
- Gunakan raw request body (jangan JSON stringify dua kali)
- Format signature: `sha256=<hex_digest>`

---

**Deployed at:** `https://socialflow-gen.pages.dev`  
**Webhooks:** `https://socialflow-gen.pages.dev/webhooks/receive`  
**Admin API:** `https://socialflow-gen.pages.dev/api/admin/*`
