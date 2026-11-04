# VOID Downloader

VOID Downloader adalah aplikasi web modern single-page untuk mengunduh media dari 10 platform utama: **YouTube, TikTok, Instagram, X (Twitter), Pinterest, Facebook, SoundCloud, Reddit, Dailymotion, dan Vimeo**, serta dilengkapi fitur **Local Video to MP3 Converter**.

Antarmuka dibangun dengan gaya VOID Brutalist 2.0: tipografi teknis JetBrains Mono, border kontras tinggi, micro-interaction responsif, logo SVG resmi beresolusi tajam, dan tema adaptif dinamis yang otomatis bertransformasi mengikuti warna brand platform yang sedang diproses.

Sistem produksi aktif dan berjalan di: `https://voiddl.my.id`

---

## Fitur Utama

### 1. Multi-Platform Media Engine (10 Channel Matrix)
- **YouTube**: Video Smart Adaptive (hingga 720p 60fps/30fps & 1080p), YouTube Shorts, dan ekstraksi audio MP3 kualitas studio (192 kbps).
- **TikTok**: Video tanpa watermark (HD), video dengan watermark, foto slideshow resolusi penuh hingga 25 slide, dan audio latar MP3.
- **Instagram**: Reels, postingan video feed, postingan foto tunggal, carousel multi-slide hingga 15 item, dan Instagram Stories.
- **X (Twitter)**: Video tweet, animasi GIF (MP4), foto uncompressed asli hingga 10 media per tweet, dan audio MP3.
- **Pinterest**: Foto resolusi asli HD (uncompressed master asset) dan video pin MP4 resolusi penuh dengan penanganan otomatis shortlink `pin.it`.
- **Facebook**: Facebook Reels, Watch, dan video feed publik dengan opsi video MP4 dan ekstraksi audio MP3 murni.
- **SoundCloud**: High-Quality audio MP3 (128 - 320 kbps), album artwork cover, dan metadata lengkap hingga durasi 2 jam.
- **Reddit**: Sinkronisasi otomatis stream video + audio `v.redd.it` menjadi MP4 tunggal, dapat diakses tanpa perlu VPN di Indonesia.
- **Dailymotion**: Fast stream video MP4 (720p/1080p) dan ekstraksi audio MP3.
- **Vimeo**: Video sinematik berbitrate tinggi (Full HD / Original) dan opsi konversi MP3.

### 2. Dedicated Local Video to MP3 Converter
- Dilengkapi tab konverter khusus di Ingestion Console (`[02 // CONVERT VIDEO TO MP3]`).
- Mendukung upload file video lokal (MP4, MKV, MOV, WEBM, AVI, FLV, WMV, 3GP) hingga kapasitas **400 MB**.
- Pilihan kualitas audio: **192 kbps (Standard HQ)** atau **320 kbps (High Fidelity)**.
- Ekstraksi audio murni super cepat via FFmpeg (`-vn -acodec libmp3lame`) hanya dalam 2-4 detik.
- Pembersihan instan: file video asli di server langsung dihapus seketika setelah audio diekstrak guna menjaga efisiensi ruang disk VPS.
- Dilengkapi inline audio player preview untuk mendengarkan hasil konversi sebelum mengunduh.

### 3. Reactive Dynamic Brand Theme
- Seluruh antarmuka website bertransformasi warna ambient glow, border panel, glow input, status dot, dan tombol aksi secara instan begitu tautan ditempelkan:
  - **Instagram**: Pink / Magenta (`#E1306C` / `#FD1D1D`)
  - **YouTube**: Merah Menyala (`#FF0000`)
  - **X (Twitter)**: Ungu Cyber (`#B026FF`)
  - **TikTok**: Cyan / Coral Glitch (`#00F2FE` / `#FE2C55`)
  - **Pinterest**: Crimson Merah (`#E60023`)
  - **Facebook**: Biru Royal (`#1877F2`)
  - **SoundCloud**: Oranye Sunset (`#FF5500`)
  - **Reddit**: Oranye Kemerahan (`#FF4500`)
  - **Dailymotion**: Biru Elektrik (`#0066DC`)
  - **Vimeo**: Biru Laut / Teal (`#1AB7EA`)
  - **Mode Converter**: Emas Cyber / Emerald (`#FFD700` / `#00FF88`)
  - **Default / Kosong**: Cyber Cyan Signature (`#00F2FE`)

### 4. Rincian Batas per Media Platform

| Platform & Command | Batas Ukuran | Batas Durasi | Batas Jumlah Media | Kualitas & Format |
|---|---|---|---|---|
| TikTok (.tt) | 400 MB | 70 Menit (1 jam 10 mnt) | Maks. 25 Foto Slide | Video tanpa watermark + BGM Audio MP3 |
| Instagram (.ig) | 400 MB | 30 Menit | Maks. 15 Item / Slide | Reels, Story, Post foto/video HD |
| YouTube Video (.yt) | 400 MB | 1 Jam (3.600 detik) | 1 Video | Smart Adaptive hingga 720p 60fps/30fps (H.264/AAC) |
| YouTube Music (.play) | 400 MB | 1 Jam (3.600 detik) | 1 Audio | Audio MP3 192 kbps |
| Twitter / X (.x, .twt) | 400 MB | 30 Menit | Maks. 10 Media per tweet | Foto asli HD, video, atau campuran |
| Pinterest (.pin) | 400 MB | Sesuai durasi pin | 1 Pin media | Foto resolusi asli HD (uncompressed) / Video MP4 |
| Facebook (.fb) | 400 MB | 1 Jam (3.600 detik) | 1 Video | Reels & Watch MP4 + MP3 Audio |
| SoundCloud (.sc) | 400 MB | 2 Jam (7.200 detik) | 1 Audio Track / Set | High Quality MP3 (128-320 kbps) + Artwork |
| Reddit (.rd) | 400 MB | 30 Menit | 1 Video Post | Synced MP4 Audio+Video (No VPN required) |
| Dailymotion (.dm) | 400 MB | 1 Jam (3.600 detik) | 1 Video | Fast Stream MP4 + MP3 Audio |
| Vimeo (.vm) | 400 MB | 1 Jam (3.600 detik) | 1 Video | High Bitrate Cinematic MP4 + MP3 Audio |
| Local Video Converter | 400 MB | Bebas durasi | 1 Video File | MP4/MKV/MOV/WEBM to MP3 (192k/320k) |

---

### 5. Video Normalization Pipeline (iOS & Cross-Device Compatible)
- Pemrosesan video otomatis via FFmpeg dan FFprobe:
  - Video di-remux atau ditranscode ke profil kompatibel universal: H.264 (AVC baseline/high), chroma pixel format YUV420p, dimensi genap (even dimensions).
  - Audio dikodekan ke AAC 128 kbps.
  - Flag MP4 `+faststart` disematkan di awal file (moov atom di awal) agar video dapat langsung di-stream dan diputar tanpa menunggu download selesai di Safari, iOS, Chrome, dan Android.

### 6. Concurrency Semaphore & Proteksi Sumber Daya Server
- Dirancang khusus untuk efisiensi tinggi pada VPS berspesifikasi hemat (misalnya 2 vCPU / 2 GB RAM).
- In-memory `ConcurrencyLimiter` (Semaphore) membatasi proses berat simultan (`MAX_CONCURRENT_HEAVY_JOBS = 2`).
- Operasi transcode CPU-bound FFmpeg dan merge video `yt-dlp` otomatis mengantre dengan batas waktu tunggu terukur (timeout 60 detik), mencegah terjadinya Linux Out-of-Memory (OOM) Killer.
- Pembacaan metadata JSON (`--dump-json`) tetap dieksekusi instan tanpa menahan slot antrian video.

### 7. Smart Caching & Manajemen Kuota Disk LRU
- Manajemen cache berbasis hash SHA-256 di direktori temporary sistem (`/tmp/void-dl-cache`).
- Dukungan HTTP 206 Partial Content (Byte-Range requests) untuk pemutaran instan pada preview video dan audio di browser.
- **Pembersihan Berbasis Kuota LRU**: Jika akumulasi file di direktori cache melebihi 5 GB (`MAX_CACHE_SIZE_BYTES`), sistem otomatis menghapus berkas tertua (`mtimeMs`) hingga kapasitas turun ke batas aman (3.5 GB).
- Pembersihan berkas kedaluwarsa berbasis waktu (TTL 2 jam) tetap berjalan secara berkala setiap 30 menit.

### 8. Keamanan & Proteksi SSRF Anti-DNS Rebinding
- **Safe Socket Agent**: Menghalangi akses ke seluruh jangkauan IP privat, loopback, link-local, carrier-grade NAT (`100.64.0.0/10`), IPv6 ULA (`fc00::/7`), dan IPv4-mapped IPv6 (`::ffff:127.0.0.1`).
- Menggunakan custom HTTP/HTTPS Agent dengan `safeDnsLookup` yang memvalidasi alamat IP saat koneksi socket TCP dibuka, menutup celah Time-of-Check to Time-of-Use (TOCTOU) DNS Rebinding.
- **Batch ZIP Protection**: Pembatasan metode `POST` saja, kuota maksimal 30 item per arsip, dan pemutus stream otomatis (`req.on("close")`) saat pengguna membatalkan unduhan guna mencegah eksploitasi bandwidth dan memori.
- Media proxy server-side untuk melindungi privasi pengguna dan mencegah pembatasan CORS atau hotlinking dari CDN pihak ketiga.

### 9. Standardisasi Nama Berkas (Collision-Proof)
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
- **Runtime**: Node.js (>= 20)
- **Framework**: Express.js
- **Media Engine**: yt-dlp, gallery-dl, FFmpeg, FFprobe
- **Upload Engine**: Multer (disk-based streaming)
- **Concurrency & Rate Limit**: Custom Semaphore Limiter, express-rate-limit

---

## Panduan Instalasi & Menjalankan Lokal

### Prasyarat Sistem
- Node.js versi 20 atau lebih tinggi
- Python 3
- FFmpeg dan FFprobe terinstall dan terdaftar di PATH sistem
- yt-dlp dan gallery-dl terinstall dan terdaftar di PATH sistem

### 1. Menjalankan Backend
```bash
cd backend
npm install
npm test
npm start
```

### 2. Menjalankan Frontend
```bash
cd frontend
npm install
npm run dev
```
Buka browser di `http://localhost:5173`.
