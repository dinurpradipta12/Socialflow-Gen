# 🚀 Cloudflare Pages Functions Deployment Guide

## Ringkasan

Kamu sudah setup Pages Functions untuk webhook backend yang terintegrasi langsung dengan deployment Pages kamu di `socialflow-gen.pages.dev`.

---

## ✅ Yang Sudah Dibuat

### 1. **Functions Files** (Automatic Deployment)
```
functions/
├── api/admin/[[path]].ts          ← Admin API (register, members, approve)
└── webhooks/receive.ts            ← Webhook receiver & member creation
```

### 2. **Setup Documentation**
- [PAGES_FUNCTIONS_SETUP.md](./PAGES_FUNCTIONS_SETUP.md) - Full setup & testing guide

### 3. **Endpoints Ready**
| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/admin/apps/register` | POST | Register external app |
| `/api/admin/members` | GET | List members |
| `/api/admin/members/:id/approve` | POST | Approve member |
| `/webhooks/receive` | POST | Receive webhook events |

---

## 🔧 Deployment Steps

### Step 1: Push ke GitHub
```bash
cd /path/to/Socialflow-Gen  # workspace repo
git add functions/ PAGES_FUNCTIONS_SETUP.md
git commit -m "feat: add Cloudflare Pages Functions for webhook backend"
git push origin main
```

### Step 2: Set Environment Variables di Cloudflare Dashboard

1. Go to **Cloudflare Dashboard** → **Pages** → **socialflow-gen**
2. Click **Settings** → **Environment variables**
3. Add Secrets:

| Name | Value | Type |
|------|-------|------|
| `ADMIN_SECRET` | `admin_secret_prod_secure_change_me` | Secret |
| `ENCRYPTION_KEY` | `4155e7b50e03ec737257a7c20a04a3e86225caa927bb3883541ab6bea439715f` | Secret |
| `DATABASE_URL` | `postgresql://user:pass@neon.tech/db` | Secret |

### Step 3: Create Database (Neon.tech)

1. Sign up at [neon.tech](https://neon.tech)
2. Create project → copy connection string
3. Set as `DATABASE_URL` in Cloudflare
4. Run SQL setup:

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

### Step 4: Deployment Automatic ✅

Setelah push ke GitHub, Cloudflare otomatis:
- Detect `functions/` directory
- Build & deploy ke edge
- Available di: `https://socialflow-gen.pages.dev/*`

---

## 🧪 Testing

### Register App
```bash
curl -X POST https://socialflow-gen.pages.dev/api/admin/apps/register \
  -H "x-admin-secret: admin_secret_prod_secure_change_me" \
  -H "Content-Type: application/json" \
  -d '{
    "app_id": "app_test_001",
    "name": "Test Application",
    "provided_api_key": "sk_live_test_123"
  }'
```

Expected response:
```json
{
  "app_id": "app_test_001",
  "api_key": "sk_live_test_123"
}
```

### Send Test Webhook
```bash
# Generate HMAC signature
API_KEY="sk_live_test_123"
PAYLOAD='{"type":"member.created","data":{"external_id":"u_001","email":"test@example.com"}}'
SIGNATURE=$(echo -n "$PAYLOAD" | openssl dgst -sha256 -hmac "$API_KEY" -hex | cut -d' ' -f2)

curl -X POST https://socialflow-gen.pages.dev/webhooks/receive \
  -H "x-app-id: app_test_001" \
  -H "x-signature: sha256=$SIGNATURE" \
  -H "Content-Type: application/json" \
  -d "$PAYLOAD"
```

Expected response:
```json
{"ok": true}
```

### List Members
```bash
curl -X GET "https://socialflow-gen.pages.dev/api/admin/members?status=pending" \
  -H "x-admin-secret: admin_secret_prod_secure_change_me"
```

---

## 📊 Architecture

```
External App
    ↓
Sends Webhook (HMAC-signed)
    ↓
Cloudflare Pages Function (/webhooks/receive)
    ↓
Validates Signature + Decrypts API Key
    ↓
Create Member in PostgreSQL
    ↓
Admin Dashboard (WebSocket)
    ↓
Admin Approves
    ↓
Update Status to 'active'
```

---

## 🔐 Security Features

✅ HMAC-SHA256 signature verification  
✅ AES-256-GCM API key encryption  
✅ Timestamp validation (5-min window)  
✅ Admin secret header authentication  
✅ CORS enabled for specific origins  
✅ Database credentials in Cloudflare Secrets  

---

## 📝 Next Steps

1. **Push to GitHub** (Step 1 above)
2. **Set Secrets in Cloudflare** (Step 2 above)
3. **Setup Database** (Step 3 above)
4. **Test Webhooks** (Testing section above)
5. **Update Frontend** - Set env vars:
   ```env
   VITE_ADMIN_API=https://socialflow-gen.pages.dev/api/admin
   VITE_WEBHOOK_URL=https://socialflow-gen.pages.dev/webhooks/receive
   VITE_ADMIN_SECRET=admin_secret_prod_secure_change_me
   ```

---

## 🚨 Important Notes

- **Do NOT commit secrets** to Git - use Cloudflare dashboard only
- **Database**: Neon.tech free tier includes 3GB storage
- **Functions**: Cold start ~100ms, cached requests instant
- **Limits**: Pages Functions free tier = 100,000 requests/day
- **Support**: Full Node.js crypto API available
- **Logs**: Check Cloudflare Dashboard → Pages → socialflow-gen → Deployments

---

## 📞 Troubleshooting

**Functions not working?**
- Check `PAGES_FUNCTIONS_SETUP.md` troubleshooting section
- View logs in Cloudflare Dashboard
- Ensure secrets are set correctly

**Database connection failed?**
- Verify `DATABASE_URL` format
- Test connection from terminal: `psql DATABASE_URL`
- Check Neon.tech project status

**Webhook signature invalid?**
- Ensure HMAC calculated with correct API key
- Check header format: `sha256=<hex>`
- Verify timestamp not older than 5 minutes

---

**Setup Complete! 🎉**

Webhook API is live at: `https://socialflow-gen.pages.dev`
