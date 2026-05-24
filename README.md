# Meg Payment Gateway

Payment gateway sederhana berbasis QRIS statis dengan sistem saldo, API key, dan webhook.

## Stack
- **Next.js** — Frontend + API Routes
- **Supabase** — PostgreSQL database
- **NextAuth.js** — Autentikasi JWT
- **Vercel** — Hosting

---

## Setup & Deploy

### 1. Buat Supabase Project
1. Daftar di [supabase.com](https://supabase.com)
2. Buat project baru
3. Buka **SQL Editor**
4. Jalankan `schema.sql` terlebih dahulu
5. Lalu jalankan `rpc-functions.sql`
6. Copy **Project URL** dan **anon key** dari Settings → API

### 2. Deploy ke Vercel
1. Push project ini ke GitHub
2. Import repo di [vercel.com](https://vercel.com)
3. Tambahkan environment variables:

```env
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJxxx...
SUPABASE_SERVICE_ROLE_KEY=eyJxxx...
NEXTAUTH_SECRET=random-string-minimal-32-karakter
NEXTAUTH_URL=https://domain-kamu.vercel.app
NEXT_PUBLIC_QRIS_IMAGE_URL=https://link-ke-gambar-qris-kamu.com/qris.png
```

4. Deploy!

### 3. Setup Admin
Setelah deploy, login dengan:
- **Email:** `admin@megpg.com`
- **Password:** `admin123`

⚠️ **SEGERA GANTI PASSWORD ADMIN** setelah login pertama via Supabase Dashboard → Table Editor → users

---

## Cara Kerja

### Alur Topup
1. User buat request topup di dashboard
2. Sistem generate kode unik 3 digit
3. User transfer ke QRIS kamu dengan nominal **tepat** (amount + kode unik)
4. Kamu cek notifikasi masuk, cocokkan nominal
5. Konfirmasi di Admin Panel → saldo user otomatis bertambah

### Alur Transaksi via API
```
Bot/Website → POST /api/transaction/create
              Header: x-api-key: meg_xxx
              Body: { amount, description, reference, webhook_url }
                     ↓
              Saldo user dipotong
                     ↓
              Response JSON + Webhook dikirim
```

---

## API Reference

### Buat Transaksi
```
POST /api/transaction/create
Header: x-api-key: meg_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx

Body:
{
  "amount": 10000,           // wajib, min 100
  "description": "...",      // opsional
  "reference": "ORDER-123",  // opsional, harus unik
  "webhook_url": "https://..." // opsional
}

Response:
{
  "success": true,
  "transaction": {
    "id": "uuid",
    "reference": "MEG-XXXXXXXXXXXX",
    "amount": 10000,
    "status": "success"
  }
}
```

### Cek Status
```
GET /api/transaction/status?reference=ORDER-123
Header: x-api-key: meg_xxx
```

### Webhook Payload
```json
{
  "event": "transaction.success",
  "transaction_id": "uuid",
  "reference": "ORDER-123",
  "amount": 10000,
  "description": "...",
  "status": "success",
  "timestamp": "2024-01-01T00:00:00Z"
}
```

---

## Fitur
- ✅ Register & Login
- ✅ Dashboard saldo real-time
- ✅ Request topup dengan kode unik
- ✅ Admin konfirmasi topup manual
- ✅ Generate & revoke API key (max 5)
- ✅ Transaksi via API (potong saldo)
- ✅ Webhook otomatis per transaksi
- ✅ Riwayat transaksi
- ✅ Admin panel (kelola user & saldo)
