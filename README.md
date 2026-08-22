<p align="center">
  <img src="https://img.shields.io/badge/version-0.1.0-2A0510?style=for-the-badge" alt="Version" />
  <img src="https://img.shields.io/badge/Next.js-15.5-black?style=for-the-badge&logo=next.js" alt="Next.js" />
  <img src="https://img.shields.io/badge/Google_Drive_API-v3-4285F4?style=for-the-badge&logo=googledrive" alt="Google Drive" />
  <img src="https://img.shields.io/badge/Redis-6.0-DC382D?style=for-the-badge&logo=redis" alt="Redis" />
</p>

<h1 align="center">
  <samp>BY DRIVE</samp>
</h1>

<p align="center">
  <em>Super Drive Aggregator — Satu Dashboard, Banyak Akun, Tak Terbatas</em>
</p>

<br />

---

## 🎯 Gambaran Umum

**BY Drive** adalah sistem agregasi penyimpanan awan berbasis **Google Drive Multi-Account**. Ia menyatukan puluhan akun Google Drive menjadi satu kesatuan yang koheren — satu dashboard, satu file manager, satu metrik kuota. Dirancang dengan arsitektur _serverless-first_ di atas Next.js dan Redis, BY Drive memungkinkan Anda mengelola kapasitas penyimpanan agregat dalam skala besar tanpa bergantung pada satu penyedia atau satu akun.

> **Prinsip Inti:** Satu akun Google Drive mungkin hanya memberi Anda 15 GB gratis.  
> Tiga puluh akun? Itu **450 GB**. BY Drive mewujudkannya.

<br />

---

## ✨ Fitur Utama

| Fitur | Deskripsi |
|---|---|
| 🔐 **Security Level 4 Gatekeeper** | Layar otentikasi dua jalur — Admin via Google OAuth, Guest via passcode sekali pakai. Dilengkapi rate limiting & timing-attack-proof password verification. |
| 🔗 **Multi-Account Linking** | Sambungkan akun Google Drive tambahan melalui OAuth 2.0 custom flow. Token disimpan terenkripsi di Redis dengan dukungan refresh token. |
| 📊 **Quota Aggregation Engine** | Menggabungkan `storageQuota` dari seluruh akun secara paralel menggunakan `Promise.allSettled`. Menampilkan total kapasitas dan pemakaian dalam satu progress bar. |
| 📁 **File Aggregator** | Menarik file dari semua akun secara simultan, menggabungkannya dalam satu array terurut dengan label sumber (`sourceAccount`, `accountType`). |
| 📈 **File Distribution Analytics** | Klasifikasi file real-time ke dalam 4 kategori: Video, Compressed, Gambar, Dokumen — menggunakan query MIME type Google Drive API. |
| 🔗 **Temporary Share Link** | Generate tautan publik 24 jam dengan permission `anyone:reader` langsung dari dashboard. |
| 👥 **Guest Access System** | Bangkitkan passcode 6 karakter dengan TTL kustom. Cocok untuk klien, mitra, atau anggota tim tanpa perlu akun Google. |
| 🗄️ **Redis-Powered Token Vault** | Seluruh token OAuth, daftar akun, sesi guest, dan data rate limiting disimpan dalam Redis — performa tinggi, auto-expiry, zero cold start. |
| 🧭 **Collapsible Dashboard Shell** | Sidebar navigasi responsif dengan 3 modul: Dashboard, File Manager, Settings. Dibangun dengan Tailwind CSS v4 utility-first. |
| 🛡️ **Type-Safe** | Full TypeScript strict mode dengan deklarasi modul `next-auth` kustom. |

<br />

---

## 🏗️ Arsitektur Sistem

```
                            ┌─────────────────────────────┐
                            │       G A T E K E E P E R    │
                            │   / (page.tsx)               │
                            │                              │
                            │  ┌──────────┐ ┌───────────┐  │
                            │  │  Admin   │ │   Guest   │  │
                            │  │ Password │ │ Passcode  │  │
                            │  └────┬─────┘ └─────┬─────┘  │
                            └───────┼─────────────┼────────┘
                                    │             │
                           Google   │    Cookie   │
                           OAuth    │   Session   │
                                    │             │
                            ┌───────┴─────────────┴────────┐
                            │       D A S H B O A R D       │
                            │   /dashboard                  │
                            │                               │
                            │  ┌──────────┐  ┌───────────┐  │
                            │  │  Quota   │  │   Stats   │  │
                            │  │Aggregator│  │  Analyzer │  │
                            │  └────┬─────┘  └─────┬─────┘  │
                            │       │               │       │
                            │  ┌────┴───────────────┴────┐  │
                            │  │    File Aggregator      │  │
                            │  └──────────┬──────────────┘  │
                            │             │                 │
                            │  ┌──────────┴──────────────┐  │
                            │  │     Settings Panel       │  │
                            │  │  (Connect / Revoke)      │  │
                            │  └──────────────────────────┘  │
                            └───────────────────────────────┘
                                      │          │
                              ┌───────┘          └───────┐
                              ▼                          ▼
                    ┌─────────────────┐        ┌─────────────────┐
                    │   Google APIs   │        │     Redis       │
                    │  (Multi-Account)│        │  (Token Store)  │
                    │                 │        │                 │
                    │ • drive.files   │        │ • linked_acc:*  │
                    │ • drive.about   │        │ • guest_access:*│
                    │ • drive.perms   │        │ • rl:*          │
                    └─────────────────┘        └─────────────────┘
```

<br />

---

## 🛠️ Tech Stack

| Layer | Teknologi |
|---|---|
| **Framework** | Next.js 15.5 (App Router, Turbopack) |
| **Runtime** | Node.js, TypeScript 5 |
| **Autentikasi** | NextAuth v4 (Google Provider), custom OAuth 2.0 flow |
| **Database** | Redis (ioredis) — token vault, session store, rate limiter |
| **API Eksternal** | Google Drive API v3, Google OAuth2 API v2 |
| **Styling** | Tailwind CSS v4 |
| **Deployment Target** | Vercel (Edge-ready, serverless) |

<br />

---

## 📁 Struktur Proyek

```
by-drive/
├── app/
│   ├── page.tsx                              # Gatekeeper (Security Level 4)
│   ├── layout.tsx                            # Root Layout + Metadata
│   ├── AuthProvider.tsx                      # NextAuth SessionProvider Wrapper
│   ├── globals.css                           # Global Styles
│   │
│   ├── dashboard/
│   │   ├── layout.tsx                        # Sidebar + Navigation Shell
│   │   ├── page.tsx                          # Dashboard Utama (Widgets)
│   │   ├── files/                            # 🚧 File Manager (Coming Soon)
│   │   └── settings/
│   │       └── page.tsx                      # Settings & Account Control Panel
│   │
│   └── api/
│       ├── auth/
│       │   ├── [...nextauth]/route.ts        # NextAuth Handler (Google Provider)
│       │   ├── gatekeeper/route.ts           # Password + Guest Validator
│       │   ├── connect/route.ts              # OAuth Redirect Generator
│       │   └── callback/custom/route.ts      # OAuth Callback + Token Storage
│       │
│       ├── drive/
│       │   ├── files/route.ts                # File Aggregator (Multi-Account)
│       │   ├── quota/route.ts                # Quota Aggregator (Multi-Account)
│       │   ├── stats/route.ts                # File Distribution Analytics
│       │   └── share/route.ts                # Public Link Generator (24h)
│       │
│       ├── accounts/route.ts                 # Account CRUD (GET, DELETE)
│       │
│       └── guest/
│           ├── generate/route.ts             # Passcode Generator (Admin)
│           └── validate/route.ts             # Passcode Validator + Session
│
├── types/
│   └── next-auth.d.ts                        # Type Augmentation untuk Session
│
├── public/                                   # Static Assets
├── package.json
├── tsconfig.json
├── next.config.ts
├── tailwind.config.ts
└── README.md
```

<br />

---

## 🔐 Alur Keamanan

### Administratif — Two-Factor Gate

```
User → Gatekeeper (/)
        │
        ├── [Admin Path]
        │     ├── Masukkan password admin
        │     ├── crypto.timingSafeEqual() verifikasi
        │     ├── Muncul tombol "Sign In (OAuth 2.0)"
        │     ├── Redirect ke Google Consent Screen
        │     └── NextAuth JWT session → Dashboard
        │
        └── [Guest Path]
              ├── Masukkan 6-digit passcode
              ├── Validasi ke Redis (guest_access:*)
              ├── Set httpOnly cookie (guest_session)
              └── Redirect → Dashboard (mode read-only)
```

### OAuth Multi-Account Flow

```
Admin (sudah login) → Settings → "Connect Account"
        │
        ├── GET /api/auth/connect
        │     └── Redirect ke Google Consent Screen
        │           │
        │           ▼
        │     User menyetujui akses
        │           │
        │           ▼
        │     GET /api/auth/callback/custom?code=xxx&state=adminEmail
        │           │
        │           ├── Tukar code → access_token + refresh_token
        │           ├── Ambil userinfo (email akun baru)
        │           ├── Simpan ke Redis: linked_accounts:{adminEmail}
        │           └── Redirect → /dashboard/settings?success=Account_Linked
```

### Rate Limiting

- Key: `rl:{ip_address}`
- Threshold: **5 attempts** per 15 menit
- Pelanggaran: HTTP `429 Too Many Requests`
- Auto-reset setelah TTL Redis expires

<br />

---

## 🚀 Panduan Memulai

### Prasyarat

- **Node.js** ≥ 18
- **Redis** (lokal via Docker: `docker run -p 6379:6379 redis`, atau cloud via Upstash/Redis Labs)
- **Google Cloud Console Project** dengan:
  - Google Drive API enabled
  - OAuth 2.0 credentials (Client ID + Client Secret)
  - Redirect URI terdaftar: `http://localhost:3000/api/auth/callback/google` dan `http://localhost:3000/api/auth/callback/custom`

### Environment Variables

Buat file `.env.local` di root proyek:

```env
# NextAuth
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-secret-at-least-32-chars

# Google OAuth
GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-client-secret

# Admin Gatekeeper
ADMIN_PASSWORD=your-admin-password

# Redis
REDIS_URL=redis://localhost:6379
```

### Instalasi & Menjalankan

```bash
# Clone repositori
git clone <repo-url>
cd by-drive

# Install dependensi
npm install

# Jalankan development server dengan Turbopack
npm run dev

# Buka browser
open http://localhost:3000
```

### Deploy ke Vercel

```bash
# Build production
npm run build

# Deploy
vercel --prod
```

> **Catatan:** Pastikan environment variables di-set di dashboard Vercel. Gunakan Redis eksternal (Upstash Redis) karena Vercel serverless tidak mendukung persistent storage.

<br />

---

## 🌐 API Reference

### Gatekeeper & Autentikasi

| Method | Endpoint | Deskripsi | Auth |
|---|---|---|---|
| `POST` | `/api/auth/gatekeeper` | Validasi password admin / passcode guest | Public |
| `GET` | `/api/auth/connect` | Generate URL OAuth untuk akun tambahan | Admin Session |
| `GET` | `/api/auth/callback/custom` | Callback OAuth — tukar kode, simpan token | Public (code) |

### Drive Aggregation

| Method | Endpoint | Deskripsi | Auth |
|---|---|---|---|
| `GET` | `/api/drive/quota` | Agregasi kuota dari seluruh akun | Admin Session |
| `GET` | `/api/drive/files` | Agregasi file dari seluruh akun | Admin Session |
| `GET` | `/api/drive/stats` | Statistik distribusi file per kategori | Admin Session |
| `POST` | `/api/drive/share` | Buat link publik 24 jam (`fileId`) | Admin Token |

### Account Management

| Method | Endpoint | Deskripsi | Auth |
|---|---|---|---|
| `GET` | `/api/accounts` | Daftar akun terhubung (tanpa token) | Admin Session |
| `DELETE` | `/api/accounts` | Hapus akun dari brankas (`email`) | Admin Session |

### Guest Management

| Method | Endpoint | Deskripsi | Auth |
|---|---|---|---|
| `POST` | `/api/guest/generate` | Generate passcode guest (`durationHours`) | Admin Token |
| `POST` | `/api/guest/validate` | Validasi passcode, set cookie session | Public |

<br />

---

## 📊 Mesin Agregasi

### Cara Kerja Quota Aggregator

```
1. Ambil session admin → dapat accessToken utama
2. Baca Redis: linked_accounts:{adminEmail} → dapat semua token tambahan
3. Eksekusi paralel:
     Promise.allSettled([
       getDriveQuota(token_utama),
       getDriveQuota(token_akun_1),
       getDriveQuota(token_akun_2),
       ...
     ])
4. Iterasi hasil:
     ├── status === 'fulfilled' → totalUsage += usage, totalLimit += limit
     └── status === 'rejected'  → console.error(reason), skip
5. Return { usage: totalUsage, limit: totalLimit }
```

### Cara Kerja File Aggregator

```
1. Ambil session admin → dapat accessToken utama + adminEmail
2. Baca Redis → dapat semua token tambahan yang status='active'
3. Eksekusi paralel ke Google Drive API:
     fetchDriveFiles(email, token, accountType) untuk setiap akun
4. Hasil digabung jadi satu array:
     allFiles = [ ...files_utama, ...files_tambahan_1, ...files_tambahan_2 ]
5. Setiap file punya properti:
     - sourceAccount: email pemilik file
     - accountType: 'Utama' | 'Tambahan'
6. Diurutkan berdasarkan nama file (a-z)
7. Return { success, totalFiles, files }
```

### Fault Tolerance

- Menggunakan `Promise.allSettled`, **bukan** `Promise.all`
- Jika satu akun gagal (token expired, rate limit Google), akun lain tetap diproses
- File dari akun yang gagal tidak muncul, tetapi sistem tidak crash
- Error di-log ke console untuk debugging

<br />

---

## 🗄️ Skema Redis

| Key Pattern | Tipe | Konten | TTL |
|---|---|---|---|
| `linked_accounts:{adminEmail}` | String (JSON) | `{ "akun@gmail.com": { accessToken, refreshToken, expiryDate, addedAt, status } }` | Persistent |
| `guest_access:{PASSCODE}` | String | `"valid"` | Sesuai `durationHours` (default 24h) |
| `rl:{ip_address}` | String (counter) | `1` → `2` → `3` → ... | 900 detik (15 menit) |
| `guest_session` | Cookie (httpOnly) | Passcode guest | 24 jam |

<br />

---

## 🔄 Siklus OAuth & Token

```
┌──────────────────────────────────────────────────────────────┐
│                     TOKEN LIFECYCLE                          │
│                                                              │
│  Akun Utama (Admin)                                         │
│  ├── Provider: NextAuth GoogleProvider                       │
│  ├── Scope: drive.readonly, email, profile                   │
│  ├── Strategy: JWT (maxAge: 10 tahun)                        │
│  └── Token disimpan di: JWT Session (encrypted cookie)      │
│                                                              │
│  Akun Tambahan (Secondary)                                  │
│  ├── Provider: Custom OAuth2 Flow                            │
│  ├── Scope: drive (full access), userinfo.email, profile     │
│  ├── Token disimpan di: Redis (linked_accounts:{email})      │
│  ├── Dukungan: Refresh Token (disimpan saat pertama kali)    │
│  └── Status: 'active' | 'revoked'                           │
└──────────────────────────────────────────────────────────────┘

Design by Bae



