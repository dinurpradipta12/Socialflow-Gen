# Implementation Notes - User Registration & Approval System

## 📋 Overview
Implementasi sistem registrasi pengguna self-service dan antrian approval admin untuk Socialflow app. Pengguna dapat mendaftar melalui halaman login, dan admin dapat mereview serta approve/reject registrasi melalui Dev Portal Hub.

## ✨ Fitur Baru

### 1. **User Self-Registration (Halaman Login)**
- **Lokasi**: Tab "Register" di halaman login
- **Fields**:
  - Full Name (required)
  - Email Address (required)
  - WhatsApp Number (required)
  - Security Code/Password (required, min 6 karakter)
  - Social Media Handle (optional)
  - Niche/Industry (optional)
  - Reason for Socialflow (optional)

- **Validasi**:
  - Email tidak boleh duplikat dengan user yang sudah terdaftar
  - Email tidak boleh duplikat dengan registrasi pending
  - Password minimal 6 karakter
  - Password & confirm password harus cocok

- **Data Persistence**:
  - Registrasi disimpan ke `localStorage` dengan key `sf_registrations_db`
  - Status awal: `pending`
  - User akan menerima notifikasi sukses setelah 2 detik, kemudian otomatis redirect ke tab login

### 2. **Admin Approval Queue (Dev Portal Hub)**
- **Lokasi**: Tab "Approval Queue" di DevPortal (default tab pertama kali akses)
- **Fitur**:
  - Menampilkan daftar semua registrasi dengan status `pending`
  - Badge merah menunjukkan jumlah pending registrations
  - Tampil pesan kosong jika tidak ada pending registrations

- **Tabel Informasi**:
  - Profile (nama + avatar)
  - Email
  - WhatsApp Handle
  - Niche/Industry
  - Registered Date (tanggal pendaftaran)
  - Actions (Approve/Reject buttons)

### 3. **Approval Actions**
- **Approve Registration**:
  - Membuat user baru dari data registrasi
  - User ID: `U-REG-{timestamp}`
  - Status awal user: `pending`
  - Subscription: 90 hari dari hari ini
  - Role: `viewer`
  - `requiresPasswordChange`: true (harus ganti password saat first login)
  - Mengirim email kredensial melalui `mailService`
  - Update status registrasi ke `approved`

- **Reject Registration**:
  - Konfirmasi melalui window.confirm()
  - Update status registrasi ke `rejected`
  - Data registrasi tetap tersimpan untuk audit trail

## 📁 Files Modified

### 1. **App.tsx**
```typescript
// Tambahan state:
- authTab: 'login' | 'register'
- registrations: RegistrationRequest[]
- registerForm: { name, email, password, confirmPassword, whatsapp, handle, niche, reason }
- registerError, registerSuccess

// Tambahan functions:
- handleRegister(): form submission handler untuk registrasi baru
- fetchCloudData(): pull registrations dari storage

// Tambahan useEffect:
- localStorage sync untuk registrations
```

### 2. **components/DevPortal.tsx**
```typescript
// Modified state:
- activeSubTab: 'queue' | 'manual' | 'users' (ditambah 'queue')
- approvalLoading: tracking loading state per registrasi

// Tambahan functions:
- handleApproveRegistration(regId): approve dan buat user baru
- handleRejectRegistration(regId): reject registrasi

// Tambahan UI:
- Queue tab dengan table pending registrations
- Approval/Reject buttons dengan loading states
```

## 🗄️ Data Structure

### RegistrationRequest
```typescript
{
  id: string;              // REG-{timestamp}
  name: string;
  email: string;
  password?: string;
  handle?: string;         // Social media handle
  niche?: string;          // Industry/Niche
  reason?: string;         // Why interested
  timestamp: string;       // ISO datetime
  status: 'pending' | 'approved' | 'rejected';
  nodeId: string;          // NODE-{timestamp}
}
```

### LocalStorage Keys
- `sf_users_db`: User database
- `sf_registrations_db`: Registration queue
- `sf_session_user`: Current session
- `sf_analytics_db`: Analytics data

## 🔄 Workflow

### User Registration Flow
1. User click "Register" tab di halaman login
2. Isi form registrasi (validasi di frontend)
3. Submit → simpan ke `sf_registrations_db`
4. Tampil success message
5. Auto-redirect ke login tab setelah 2 detik

### Admin Approval Flow
1. Admin login sebagai `developer` role
2. Masuk ke "Dev Portal Hub"
3. Lihat tab "Approval Queue" (default)
4. Review pending registrations
5. Click "Approve" atau "Reject"
6. Jika approve:
   - Buat user baru
   - Kirim email kredensial
   - Update registrasi status → `approved`
7. Jika reject:
   - Confirm rejection
   - Update registrasi status → `rejected`

### User First Login After Approval
1. User menerima email dengan credentials
2. Login dengan email dan password
3. Sistem detect `requiresPasswordChange: true`
4. Redirect ke modal "Setup Password Baru"
5. User ganti password
6. Setelah update:
   - `requiresPasswordChange` → false
   - `status` → `active`
   - Auto login ke dashboard

## 🎯 Key Changes Summary

| Component | Change | Purpose |
|-----------|--------|---------|
| App.tsx | Add register form + handler | Enable user self-registration |
| App.tsx | Add registrations state | Track pending approvals |
| App.tsx | Login UI: Add tabs | Switch between login/register |
| DevPortal.tsx | Add 'queue' tab | Show approval queue |
| DevPortal.tsx | Add approval handlers | Approve/reject registrations |
| LocalStorage | Add sf_registrations_db | Persist registration data |

## 🔐 Security Notes

- Passwords hashed: ❌ (Saat ini plaintext, consider hashing untuk production)
- Email verification: ❌ (Tidak ada email verification, consider menambahkan)
- Rate limiting: ❌ (Tidak ada rate limiting, consider menambahkan)
- CSRF protection: ✅ (BroadcastChannel untuk sync antar tabs)

## 📝 Testing Checklist

- [ ] User dapat register melalui form
- [ ] Validasi email duplikat berfungsi
- [ ] Validasi password berfungsi
- [ ] Registrasi disimpan ke localStorage
- [ ] Admin dapat melihat queue pending registrations
- [ ] Admin dapat approve registrasi
- [ ] Admin dapat reject registrasi
- [ ] User baru tercipta setelah approval
- [ ] Email credentials terkirim
- [ ] User dapat login dengan credentials baru
- [ ] Modal password change muncul saat first login
- [ ] Status user berubah menjadi active setelah password change

## 🚀 Future Enhancements

1. Email verification via OTP
2. Password hashing (bcrypt)
3. Rate limiting untuk registrations
4. Admin dapat edit user dari approval queue
5. Approval notifications email
6. Bulk actions di approval queue
7. Filter & search di approval queue
8. Approval statistics/analytics
9. Audit logs untuk semua approval actions
10. Auto-reject after X days if not approved
