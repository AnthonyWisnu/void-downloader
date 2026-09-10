# VOID Downloader

VOID Downloader adalah aplikasi web modern single-page untuk mengunduh media dari 4 platform utama: YouTube, TikTok, Instagram, dan X (Twitter). Mendukung pengunduhan video, reels, shorts, stories, foto, slideshow carousel, dan audio MP3 berkualitas tinggi.

Antarmuka dibangun dengan gaya VOID Brutalist 2.0: tipografi teknis JetBrains Mono, border kontras tinggi, micro-interaction responsif, logo SVG resmi beresolusi tajam, dan tema adaptif dinamis yang otomatis bertransformasi mengikuti warna brand platform yang sedang diproses.

Sistem produksi aktif dan berjalan di: `https://voiddl.my.id`

---

## Fitur Utama

### 1. Multi-Platform Media Engine
- **YouTube**: Mendukung video standar (hingga 1080p/720p), YouTube Shorts, YouTube Community posts, dan ekstraksi audio MP3 kualitas studio.
- **TikTok**: Mendukung video tanpa watermark (HD), video dengan watermark, foto slideshow resolusi penuh, dan audio latar MP3.
- **Instagram**: Mendukung Reels, postingan video feed, postingan foto tunggal, carousel multi-slide via gallery-dl fallback, Instagram Stories, dan audio track dengan dukungan autentikasi cookies Netscape serta guest extraction fallback otomatis.
- **X (Twitter)**: Mendukung video tweet, animasi GIF (MP4), foto tunggal/slideshow multi-foto hingga 4 gambar dengan resolusi asli (orig), mixed media, dan audio MP3.

### 2. Video Normalization Pipeline (iOS & Cross-Device Compatible)
- Pemrosesan video otomatis via FFmpeg dan FFprobe:
  - Video di-remux atau ditranscode ke profil kompatibel universal: H.264 (AVC baseline/high), chroma pixel format YUV420p, dimensi genap (even dimensions).
  - Audio dikodekan ke AAC 128 kbps.
  - Flag MP4 `+faststart` disematkan di awal file (moov atom di awal) agar video dapat langsung di-stream dan diputar tanpa menunggu download selesai di Safari, iOS, Chrome, dan Android.

### 3. Concurrency Semaphore & Proteksi Sumber Daya Server
- Dirancang khusus untuk efisiensi tinggi pada VPS berspesifikasi hemat (misalnya 2 vCPU / 2 GB RAM).
- In-memory `ConcurrencyLimiter` (Semaphore) membatasi proses berat simultan (`MAX_CONCURRENT_HEAVY_JOBS = 2`).
- Operasi transcode CPU-bound FFmpeg dan merge video `yt-dlp` otomatis mengantre dengan batas waktu tunggu terukur (timeout 60 detik), mencegah terjadinya Linux Out-of-Memory (OOM) Killer.
- Pembacaan metadata JSON (`--dump-json`) tetap dieksekusi instan tanpa menahan slot antrian video.

### 4. Smart Caching & Manajemen Kuota Disk LRU
- Manajemen cache berbasis hash SHA-256 di direktori temporary sistem (`/tmp/void-dl-cache`).
- Dukungan HTTP 206 Partial Content (Byte-Range requests) untuk pemutaran instan pada preview video dan audio di browser.
- **Pembersihan Berbasis Kuota LRU**: Jika akumulasi file di direktori cache melebihi 3 GB (`MAX_CACHE_SIZE_BYTES`), sistem otomatis menghapus berkas tertua (`mtimeMs`) hingga kapasitas turun ke batas aman (2.1 GB).
- Pembersihan berkas kedaluwarsa berbasis waktu (TTL 2 jam) tetap berjalan secara berkala setiap 30 menit.

### 5. Keamanan & Proteksi SSRF Anti-DNS Rebinding
- **Safe Socket Agent**: Menghalangi akses ke seluruh jangkauan IP privat, loopback, link-local, carrier-grade NAT (`100.64.0.0/10`), IPv6 ULA (`fc00::/7`), dan IPv4-mapped IPv6 (`::ffff:127.0.0.1`).
- Menggunakan custom HTTP/HTTPS Agent dengan `safeDnsLookup` yang memvalidasi alamat IP saat koneksi socket TCP dibuka, menutup celah Time-of-Check to Time-of-Use (TOCTOU) DNS Rebinding.
- **Batch ZIP Protection**: Pembatasan metode `POST` saja, kuota maksimal 30 item per arsip, dan pemutus stream otomatis (`req.on("close")`) saat pengguna membatalkan unduhan guna mencegah eksploitasi bandwidth dan memori.
- Media proxy server-side untuk melindungi privasi pengguna dan mencegah pembatasan CORS atau hotlinking dari CDN pihak ketiga.

### 6. Standardisasi Nama Berkas (Collision-Proof)
- Format penamaan file konsisten dan informatif di semua platform:
  - Format: `[VOID]_[Platform]_[Author]_[Title]_[Kind]_[Timestamp].[ext]`
  - Mencegah benturan nama file, membersihkan karakter ilegal OS, dan memudahkan arsip unduhan pengguna.

---

## Tech Stack

### Frontend
- **Framework**: React 18 + Vite 5
- **Styling**: Modular CSS, CSS Custom Properties (Variables), Responsive Grid/Flexbox
- **Icons**: Lucide React + Custom Inline SVG Brand Logos
- **HTTP Client**: Axios

### Backend
- **Runtime**: Node.js (LTS v20+)
- **Framework**: Express.js
- **Middleware**: CORS, Rate Limiting (`express-rate-limit`), JSON Body Parser
- **Extraction Tools**: `@tobyg74/tiktok-api-dl`, `instagram-url-direct`, `yt-dlp` CLI wrapper, `gallery-dl`
- **Media Transcoder**: FFmpeg & FFprobe (child_process streaming)
- **Archiving**: Archiver (ZIP streaming)

### Production & Server Infrastructure
- **Hosting**: Tencent Cloud Lighthouse (2 vCPU, 2 GB RAM, 50 GB SSD)
- **Operating System**: Ubuntu 24.04 LTS
- **Process Manager**: PM2 (Cluster/Fork mode)
- **Web Server & Reverse Proxy**: Nginx
- **SSL Certificate**: Let's Encrypt Certbot (Auto-renewal)
- **Production Domain**: `https://voiddl.my.id` (dan `https://www.voiddl.my.id`)

---

## Struktur Direktori

```text
.
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── BrandLogos.jsx          # SVG logo resmi platform (YouTube, IG, TikTok, X)
│   │   │   ├── DownloaderPanel.jsx     # Panel input dan aksi utama
│   │   │   ├── DownloadOptionRow.jsx   # Baris opsi download individual
│   │   │   ├── DownloadOptions.jsx     # Daftar opsi download (video, audio, foto)
│   │   │   ├── FAQSection.jsx          # Bagian pertanyaan umum
│   │   │   ├── FeatureGrid.jsx         # Grid keunggulan aplikasi
│   │   │   ├── Footer.jsx              # Footer halaman dan status sistem
│   │   │   ├── HeroSection.jsx         # Header brutalist dan tagline
│   │   │   ├── HowToSection.jsx        # Panduan langkah penggunaan
│   │   │   ├── MediaMetadata.jsx       # Metadata judul, tipe, thumbnail
│   │   │   ├── MediaPreview.jsx        # Pemutar preview video, audio, atau slideshow foto
│   │   │   ├── MediaResult.jsx         # Container hasil analisis media
│   │   │   ├── Navbar.jsx              # Navigasi atas dan health badge
│   │   │   ├── PlatformHeader.jsx      # Header platform aktif dengan tombol reset
│   │   │   ├── PlatformSupport.jsx     # Indikator platform yang didukung
│   │   │   ├── ResultSection.jsx       # Wrapper section hasil
│   │   │   └── UrlInput.jsx            # Komponen input URL dengan tombol paste dan submit
│   │   ├── hooks/
│   │   │   └── useDownloader.js        # State management dan orchestration fetch data
│   │   ├── styles/
│   │   │   ├── base.css                # Reset dan konfigurasi tipografi
│   │   │   ├── downloader.css          # Styling input bar dan action button
│   │   │   ├── footer.css              # Styling footer
│   │   │   ├── hero.css                # Styling hero brutalist
│   │   │   ├── result.css              # Styling kartu hasil, player, dan download button
│   │   │   ├── sections.css            # Styling grid platform, FAQ, dan how-to
│   │   │   ├── utilities.css           # Utility classes
│   │   │   └── variables.css           # Variabel tema global dan tema adaptif per brand
│   │   ├── utils/
│   │   │   ├── detectPlatform.js       # Validasi domain dan deteksi platform URL
│   │   │   ├── filenameHelper.js       # Generator nama file unduhan terstandarisasi
│   │   │   ├── mediaAdapter.js         # Normalisasi payload backend untuk UI konsisten
│   │   │   ├── mediaBatch.js           # Client-side handler untuk pengunduhan paket ZIP
│   │   │   └── mediaProxy.js           # Helper penyusun URL proxy backend
│   │   ├── App.jsx                     # Root application container (data-platform attribute)
│   │   ├── globals.css                 # Import stylesheet utama
│   │   └── main.jsx                    # Vite React entry point
│   ├── index.html
│   ├── package.json
│   └── vite.config.js
│
├── backend/
│   ├── cookies/
│   │   ├── ig_cookies.txt              # Cookies Instagram (Netscape format, gitignored)
│   │   ├── yt_cookies.txt              # Cookies YouTube (Netscape format, gitignored)
│   │   └── x_cookies.txt               # Cookies X/Twitter (Netscape format, gitignored)
│   ├── src/
│   │   ├── controllers/
│   │   │   ├── batch.controller.js     # Pembuatan arsip ZIP multi-slide streaming
│   │   │   ├── download.controller.js  # Dispatcher unduhan berdasarkan platform
│   │   │   ├── file.controller.js      # Streaming file dari cache internal
│   │   │   └── media.controller.js     # Media proxy dengan validasi SSRF anti-rebinding
│   │   ├── middlewares/
│   │   │   └── rateLimiter.js          # Rate limiter untuk download dan streaming
│   │   ├── routes/
│   │   │   └── download.routes.js      # Routing Express API
│   │   ├── services/
│   │   │   ├── audio-cache.service.js   # Ekstraksi dan konversi audio MP3
│   │   │   ├── cookies.service.js      # Parser dan validator cookies Netscape
│   │   │   ├── engine-base.service.js  # Reusable base engine runner yt-dlp & cache helpers
│   │   │   ├── image-download.service.js# Konversi webp ke jpeg untuk download foto
│   │   │   ├── instagram.service.js    # Ekstraksi media Instagram via yt-dlp / gallery-dl / API
│   │   │   ├── media-cache.service.js  # Utilitas cache disk, TTL cleanup, dan kuota LRU
│   │   │   ├── tiktok.service.js       # Ekstraksi media TikTok
│   │   │   ├── video-cache.service.js  # Manajemen cache video ter-normalisasi
│   │   │   ├── video-normalize.service.js # Pipeline FFmpeg H.264 FastStart
│   │   │   ├── x.service.js            # Ekstraksi video, foto, GIF dari X (Twitter)
│   │   │   └── youtube.service.js      # Ekstraksi video dan audio dari YouTube
│   │   ├── utils/
│   │   │   ├── concurrency.js          # Semaphore limiter untuk kontrol beban proses
│   │   │   ├── errors.js               # Helper konstruktor error layanan terstandarisasi
│   │   │   ├── execTool.js             # Async wrapper child_process yt-dlp dan ffmpeg
│   │   │   ├── filenameHelper.js       # Sanitasi dan generator nama berkas
│   │   │   ├── safeRequest.js          # Safe DNS lookup dan agent anti-SSRF
│   │   │   └── sanitizeUrl.js          # Validasi whitelist protokol dan hostname
│   │   └── app.js                      # Inisialisasi Express server
│   ├── test-audit.js                   # Skrip pengujian otomatis unit & audit
│   ├── .env.example                    # Contoh variabel lingkungan
│   └── package.json
│
├── ecosystem.config.js                 # Konfigurasi proses PM2
├── AGENTS.md                           # Pedoman dan aturan arsitektur untuk developer/agent
├── DESIGN.md                           # Dokumentasi desain sistem VOID Brutalist 2.0
├── PLAN.md                             # Catatan tahapan refactor sistem
└── README.md                           # Dokumentasi teknis proyek
```

---

## Dokumentasi API

### 1. `GET /api/health`
Memeriksa kesiapan dan ketersediaan layanan backend.

- **Status Code**: `200 OK`
- **Response**:
```json
{
  "status": "ok"
}
```

---

### 2. `POST /api/download`
Menganalisis URL media dan menghasilkan link unduhan terstruktur.

- **Request Headers**: `Content-Type: application/json`
- **Request Body**:
```json
{
  "url": "https://www.youtube.com/watch?v=dQw4w9WgXcQ"
}
```

- **Successful Response (Video)**:
```json
{
  "platform": "youtube",
  "type": "video",
  "title": "Rick Astley - Never Gonna Give You Up (Official Music Video)",
  "thumbnail": "https://i.ytimg.com/vi/dQw4w9WgXcQ/maxresdefault.jpg",
  "sourceUrl": "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
  "previewUrl": "/api/file?token=a1b2c3d4e5f6...",
  "downloads": [
    {
      "label": "MP4 / VIDEO",
      "url": "/api/file?token=a1b2c3d4e5f6...&download=1&filename=VOID_YouTube_Rick-Astley_video.mp4",
      "format": "mp4"
    },
    {
      "label": "Audio Only",
      "url": "/api/file?token=f6e5d4c3b2a1...&kind=audio&download=1&filename=VOID_YouTube_Rick-Astley_audio.mp3",
      "format": "mp3"
    }
  ]
}
```

- **Error Response**:
```json
{
  "error": "ERR: URL tidak valid atau konten tidak dapat diakses"
}
```

---

### 3. `GET /api/file`
Menyajikan streaming dan unduhan file media dari cache internal.

- **Query Parameters**:
  - `token` (wajib): Hash SHA-256 sepanjang 32 karakter heksadesimal.
  - `kind` (opsional): Jenis media (`video` atau `audio`, default `video`).
  - `download` (opsional): `1` untuk menyematkan header `Content-Disposition: attachment`.
  - `filename` (opsional): Nama file kustom untuk unduhan.
- **Fitur**: Mendukung header `Range` untuk streaming video/audio (HTTP 206 Partial Content).

---

### 4. `GET /api/media`
Reverse proxy untuk aset eksternal (thumbnail gambar, video remote) dengan validasi anti-SSRF dan socket-level DNS pinning.

- **Query Parameters**:
  - `url` (wajib): URL target media eksternal (harus lolos validasi DNS public IP).
  - `download` (opsional): `1` untuk trigger download file langsung.
  - `filename` (opsional): Nama file kustom.

---

### 5. `POST /api/batch/zip`
Membuat dan men-stream arsip ZIP multi-slide (misalnya album foto carousel Instagram atau X) on-the-fly.

- **Request Body**:
```json
{
  "title": "album-photos",
  "filename": "VOID_Instagram_user_all-slides.zip",
  "items": [
    { "url": "https://...", "format": "jpg", "filename": "slide-01.jpg" },
    { "url": "https://...", "format": "jpg", "filename": "slide-02.jpg" }
  ]
}
```
- **Proteksi**: Dibatasi maksimal 30 item, streaming dibatalkan otomatis jika client disconnect.

---

## Pengujian Otomatis

Proyek menyertakan skrip pengujian otomatis untuk memverifikasi keamanan dan integritas sumber daya:

```bash
cd backend
npm test
```

Cakupan pengujian:
1. **SSRF IP Filtering**: Memvalidasi penolakan terhadap seluruh range IP privat, loopback, link-local, carrier-grade NAT, dan IPv4-mapped IPv6.
2. **Concurrency Limiter (Semaphore)**: Memastikan eksekusi paralel dibatasi tepat sesuai konfigurasi tanpa melebihi batas slot aktif.
3. **LRU Cache Quota Pruning**: Memastikan mekanisme pemotongan kuota disk menghapus berkas tertua saat kapasitas melampaui batas maksimal.

---

## Panduan Instalasi Lokal

### Prasyarat Sistem
- Node.js versi 20 LTS atau lebih tinggi
- Python 3
- FFmpeg dan FFprobe terpasang di sistem PATH
- yt-dlp terpasang di sistem PATH
- gallery-dl (opsional, untuk fallback carousel foto)

### 1. Setup Backend
```bash
cd backend
npm install
cp .env.example .env
npm run dev
```

Server backend berjalan secara default di `http://localhost:3001`.

### 2. Setup Frontend
```bash
cd frontend
npm install
npm run dev
```

Aplikasi frontend berjalan secara default di `http://localhost:5173`. Request `/api/*` diproxy secara otomatis ke backend selama mode development.

---

## Konfigurasi Cookies Platform

Beberapa konten sensitif, dibatasi usia, atau konten privat memerlukan file cookies berformat Netscape HTTP Cookie File (`.txt`):

1. **Instagram**: Letakkan di `backend/cookies/ig_cookies.txt`
2. **YouTube**: Letakkan di `backend/cookies/yt_cookies.txt` (opsional untuk video publik)
3. **X (Twitter)**: Letakkan di `backend/cookies/x_cookies.txt` (opsional untuk tweet publik)

Format baris Netscape:
```text
# Netscape HTTP Cookie File
.instagram.com  TRUE  /  TRUE  1999999999  sessionid  YOUR_SESSION_ID
.instagram.com  TRUE  /  TRUE  1999999999  csrftoken  YOUR_CSRF_TOKEN
```

File cookies dikecualikan dari Git secara default (`.gitignore`) untuk melindungi privasi dan keamanan akun Anda.

---

## Panduan Deployment VPS Production

### Konfigurasi Environment (`backend/.env`)
```env
PORT=3001
FRONTEND_URL=https://voiddl.my.id,https://www.voiddl.my.id
IG_COOKIES_PATH=./cookies/ig_cookies.txt
YT_COOKIES_PATH=./cookies/yt_cookies.txt
X_COOKIES_PATH=./cookies/x_cookies.txt
MAX_CONCURRENT_HEAVY_JOBS=2
MAX_CACHE_SIZE_BYTES=3221225472
NODE_ENV=production
```

### Build & Menjalankan PM2
```bash
# Build frontend
cd /var/www/downloader/frontend
npm run build

# Menjalankan backend dengan PM2 (gunakan user non-root)
cd /var/www/downloader
pm2 start ecosystem.config.js
pm2 save
```

### Konfigurasi Nginx
```nginx
server {
    listen 80;
    server_name voiddl.my.id www.voiddl.my.id;

    # Frontend Single Page App
    location / {
        root /var/www/downloader/frontend/dist;
        index index.html;
        try_files $uri $uri/ /index.html;
    }

    # Backend API Proxy
    location /api/ {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_read_timeout 300s;
        proxy_connect_timeout 60s;
    }
}
```

Setelah DNS domain terhubung, amankan dengan Let's Encrypt SSL:
```bash
sudo certbot --nginx -d voiddl.my.id -d www.voiddl.my.id
```

---

## Lisensi & Aturan Kontribusi
Dibuat untuk tujuan utilitas pribadi dan edukasi. Pastikan Anda memiliki hak atau izin yang sah sebelum mengunduh media dari platform bersangkutan.
