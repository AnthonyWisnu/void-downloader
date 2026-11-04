const assert = require("assert");
const { isPrivateAddress, validateMediaUrl } = require("./src/utils/safeRequest");
const { sanitizeUrl } = require("./src/utils/sanitizeUrl");
const { ConcurrencyLimiter } = require("./src/utils/concurrency");
const { cleanupCacheLRU, ensureCacheDir, assertFileWithinSizeLimit } = require("./src/services/media-cache.service");
const { PLATFORM_LIMITS, MAX_FILE_SIZE_MB, MAX_FILE_SIZE_BYTES } = require("./src/config/limits");
const fs = require("fs");
const path = require("path");
const os = require("os");

async function runTests() {
  process.stdout.write("=== MENJALANKAN TEST AUDIT & REFAKTORISASI ===\n\n");

  // 1. Uji IP SSRF Filtering
  process.stdout.write("1. Pengujian SSRF & IP Filtering...\n");
  const privateIPs = [
    "127.0.0.1",
    "127.0.1.1",
    "10.0.0.1",
    "10.255.255.255",
    "172.16.0.1",
    "172.31.255.255",
    "192.168.1.1",
    "169.254.169.254",
    "100.64.0.1",
    "0.0.0.0",
    "::1",
    "::ffff:127.0.0.1",
    "::ffff:10.0.0.1",
    "fc00::1",
    "fd12:3456:789a::1",
    "fe80::1"
  ];

  for (const ip of privateIPs) {
    assert.strictEqual(
      isPrivateAddress(ip),
      true,
      `Harus mendeteksi IP privat: ${ip}`
    );
  }

  const publicIPs = ["8.8.8.8", "1.1.1.1", "104.244.42.1", "2606:4700:4700::1111"];
  for (const ip of publicIPs) {
    assert.strictEqual(
      isPrivateAddress(ip),
      false,
      `Harus mengizinkan IP publik: ${ip}`
    );
  }
  process.stdout.write("   -> Sukses: Semua pengujian IP privat dan publik lolos.\n\n");

  // 2. Uji Concurrency Limiter
  process.stdout.write("2. Pengujian Concurrency Limiter (Semaphore)...\n");
  const limiter = new ConcurrencyLimiter(2, 5000);
  let currentlyRunning = 0;
  let maxObserved = 0;

  const makeTask = (id, ms) => async () => {
    currentlyRunning++;
    if (currentlyRunning > maxObserved) {
      maxObserved = currentlyRunning;
    }
    await new Promise((r) => setTimeout(r, ms));
    currentlyRunning--;
    return id;
  };

  const results = await Promise.all([
    limiter.run(makeTask(1, 40)),
    limiter.run(makeTask(2, 40)),
    limiter.run(makeTask(3, 40)),
    limiter.run(makeTask(4, 40))
  ]);

  assert.deepStrictEqual(results, [1, 2, 3, 4]);
  assert.strictEqual(maxObserved, 2, "Konkurensi maksimal tidak boleh melebihi 2");
  assert.strictEqual(limiter.stats.active, 0, "Semua slot limiter harus kembali kosong");
  process.stdout.write("   -> Sukses: ConcurrencyLimiter berhasil membatasi 2 tugas bersamaan.\n\n");

  // 3. Uji LRU Cache Cleanup Quota
  process.stdout.write("3. Pengujian LRU Cache Quota Pruning...\n");
  const tempDir = path.join(os.tmpdir(), `test-cache-quota-${Date.now()}`);
  fs.mkdirSync(tempDir, { recursive: true });

  try {
    const file1 = path.join(tempDir, "file1.bin");
    const file2 = path.join(tempDir, "file2.bin");
    const file3 = path.join(tempDir, "file3.bin");

    // Tulis file 1MB masing-masing
    const data1MB = Buffer.alloc(1024 * 1024, "a");
    fs.writeFileSync(file1, data1MB);
    // Ubah mtime agar file1 paling tua
    fs.utimesSync(file1, 1000, 1000);

    fs.writeFileSync(file2, data1MB);
    fs.utimesSync(file2, 2000, 2000);

    fs.writeFileSync(file3, data1MB);
    fs.utimesSync(file3, 3000, 3000);

    // Total 3MB. Batas max 2.5MB, target 1.5MB.
    // file1 dan file2 harus dihapus agar sisa <= 1.5MB.
    cleanupCacheLRU(tempDir, 2.5 * 1024 * 1024, 1.5 * 1024 * 1024);

    assert.strictEqual(fs.existsSync(file1), false, "file1 (tertua) harus sudah dihapus");
    assert.strictEqual(fs.existsSync(file2), false, "file2 harus sudah dihapus");
    assert.strictEqual(fs.existsSync(file3), true, "file3 (terbaru) harus tetap tersimpan");

    process.stdout.write("   -> Sukses: LRU Cache berhasil memotong file tertua sesuai batas kuota.\n\n");
  } finally {
    try {
      fs.rmSync(tempDir, { recursive: true, force: true });
    } catch {}
  }

  // 4. Uji Error Sanitization
  process.stdout.write("4. Pengujian Error Sanitization & Info Leakage Prevention...\n");
  const { isUserSafeErrorMessage, formatUserSafeError } = require("./src/utils/errors");

  const dangerousErrors = [
    new Error("connect ECONNREFUSED 127.0.0.1:3002"),
    new Error("ENOENT: no such file or directory, open 'C:\\laragon\\www\\backend\\.env'"),
    new Error("TypeError: Cannot read properties of undefined (reading 'split') at /var/www/index.js:10"),
    new Error("spawnSync yt-dlp ENOENT at child_process:100"),
    new Error("Gagal membaca cookies di /home/anthony/MinjiBot/cookies/yt_cookies.txt")
  ];

  for (const err of dangerousErrors) {
    assert.strictEqual(isUserSafeErrorMessage(err.message), false, `Harus mendeteksi leak teknis: ${err.message}`);
    const safeMsg = formatUserSafeError(err, "ERR: Terjadi kesalahan pada server.");
    assert.strictEqual(safeMsg, "ERR: Terjadi kesalahan pada server.");
  }

  const safeError = new Error("Video tidak ditemukan atau bersifat privat");
  assert.strictEqual(isUserSafeErrorMessage(safeError.message), true);
  assert.strictEqual(formatUserSafeError(safeError), "ERR: Video tidak ditemukan atau bersifat privat");

  process.stdout.write("   -> Sukses: Filter error berhasil mencegah kebocoran informasi teknis.\n\n");

  // 5. Uji Pinterest Sanitization & Platform Limits
  process.stdout.write("5. Pengujian Pinterest Sanitization & Konfigurasi Batas Platform...\n");

  const pinterestUrls = [
    "https://pin.it/7wXyZ12",
    "https://www.pinterest.com/pin/123456789012345678/",
    "https://id.pinterest.com/pin/987654321/",
    "http://pinterest.co.uk/pin/111222333/"
  ];

  for (const purl of pinterestUrls) {
    const sanitized = sanitizeUrl(purl);
    assert.strictEqual(sanitized.ok, true, `Pinterest URL harus valid: ${purl}`);
    assert.strictEqual(sanitized.platform, "pinterest", `Platform harus terdeteksi sebagai pinterest: ${purl}`);
  }

  assert.strictEqual(MAX_FILE_SIZE_MB, 400, "Batas maksimal file global harus 400 MB");
  assert.strictEqual(MAX_FILE_SIZE_BYTES, 400 * 1024 * 1024, "Batas byte file harus 400 * 1024 * 1024");
  assert.strictEqual(PLATFORM_LIMITS.TIKTOK.MAX_DURATION_SEC, 4200, "Batas durasi TikTok harus 70 menit (4.200s)");
  assert.strictEqual(PLATFORM_LIMITS.TIKTOK.MAX_SLIDES, 25, "Batas slide foto TikTok harus 25");
  assert.strictEqual(PLATFORM_LIMITS.INSTAGRAM.MAX_DURATION_SEC, 1800, "Batas durasi Instagram harus 30 menit (1.800s)");
  assert.strictEqual(PLATFORM_LIMITS.INSTAGRAM.MAX_SLIDES, 15, "Batas slide Instagram harus 15");
  assert.strictEqual(PLATFORM_LIMITS.YOUTUBE.MAX_DURATION_SEC, 3600, "Batas durasi YouTube harus 1 jam (3.600s)");
  assert.strictEqual(PLATFORM_LIMITS.X.MAX_DURATION_SEC, 1800, "Batas durasi X (Twitter) harus 30 menit (1.800s)");
  assert.strictEqual(PLATFORM_LIMITS.X.MAX_MEDIA_ITEMS, 10, "Batas media item X (Twitter) harus 10");

  // Uji assertFileWithinSizeLimit
  const sizeTestDir = path.join(os.tmpdir(), `test-size-limit-${Date.now()}`);
  fs.mkdirSync(sizeTestDir, { recursive: true });
  try {
    const smallFile = path.join(sizeTestDir, "small.bin");
    const oversizedFile = path.join(sizeTestDir, "oversized.bin");

    fs.writeFileSync(smallFile, Buffer.alloc(1024, "x"));
    fs.writeFileSync(oversizedFile, Buffer.alloc(2048, "y"));

    // Batas 1500 bytes: small (1024) lolos, oversized (2048) melempar error
    assert.doesNotThrow(() => assertFileWithinSizeLimit(smallFile, 1500));
    assert.throws(
      () => assertFileWithinSizeLimit(oversizedFile, 1500),
      /Ukuran file melebihi batas maksimal/
    );
  } finally {
    try {
      fs.rmSync(sizeTestDir, { recursive: true, force: true });
    } catch {}
  }

  process.stdout.write("   -> Sukses: Validasi Pinterest dan konfigurasi batas platform lolos 100%.\n\n");

  process.stdout.write("=== SEMUA PENGUJIAN AUDIT BERHASIL LOLOS 100% ===\n");
}

runTests().catch((err) => {
  process.stderr.write(`Test gagal: ${err.message}\n${err.stack}\n`);
  process.exit(1);
});
