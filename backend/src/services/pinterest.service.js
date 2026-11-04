const fs = require("fs");
const os = require("os");
const path = require("path");
const axios = require("axios");

const { runGalleryDl, runYtDlp, parseYtDlpJson } = require("../utils/execTool");
const { createServiceError } = require("../utils/errors");
const { generateMediaFilename } = require("../utils/filenameHelper");
const { PLATFORM_LIMITS } = require("../config/limits");
const {
  DOWNLOAD_CACHE_DIR,
  ensureCacheDir,
  getCacheToken,
  getCacheFilePath,
  hasUsableFile,
  assertFileWithinSizeLimit,
  cleanupFiles
} = require("./media-cache.service");
const { getOrCreateNormalizedVideo } = require("./video-cache.service");

const BROWSER_USER_AGENT =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36";

async function resolvePinterestUrl(url) {
  try {
    const parsed = new URL(url);
    if (parsed.hostname.toLowerCase().includes("pin.it")) {
      const response = await axios.get(url, {
        headers: { "User-Agent": BROWSER_USER_AGENT },
        maxRedirects: 5,
        timeout: 15000,
        validateStatus: (status) => status >= 200 && status < 400
      });
      const finalUrl = response.request?.res?.responseUrl || response.config?.url;
      if (finalUrl && typeof finalUrl === "string") {
        return finalUrl;
      }
    }
  } catch {
    // Abaikan kegagalan redirect resolution dan gunakan URL awal
  }
  return url;
}

function findMediaFiles(dir) {
  const results = [];
  if (!fs.existsSync(dir)) return results;

  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      results.push(...findMediaFiles(fullPath));
    } else if (entry.isFile()) {
      const stat = fs.statSync(fullPath);
      if (stat.size > 0) {
        results.push(fullPath);
      }
    }
  }
  return results;
}

async function downloadPinterest(url) {
  const resolvedUrl = await resolvePinterestUrl(url);
  ensureCacheDir();

  const tempDir = path.join(os.tmpdir(), `pin-dl-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`);
  fs.mkdirSync(tempDir, { recursive: true });

  try {
    let mediaFiles = [];
    let metaAuthor = null;
    let metaTitle = null;

    // 1. Coba gallery-dl terlebih dahulu (terbaik untuk resolusi asli foto & video Pinterest)
    try {
      const args = [
        "--user-agent", BROWSER_USER_AGENT,
        "--no-mtime",
        "-D", tempDir,
        "--",
        resolvedUrl
      ];
      await runGalleryDl(args);
      mediaFiles = findMediaFiles(tempDir);
    } catch {
      // gallery-dl gagal atau bukan foto, lanjut ke yt-dlp
    }

    // 2. Jika gallery-dl tidak menghasilkan file (misal pin video), coba yt-dlp
    if (mediaFiles.length === 0) {
      try {
        const outputTemplate = path.join(tempDir, "pin.%(ext)s");
        const args = [
          "--user-agent", BROWSER_USER_AGENT,
          "--no-warnings",
          "--no-playlist",
          "--ies", "pinterest,pinterestcollection",
          "--max-filesize", `${PLATFORM_LIMITS.MAX_FILE_SIZE_MB}M`,
          "--format", "bestvideo[height<=720]+bestaudio/best[height<=720]/best",
          "--merge-output-format", "mp4",
          "--output", outputTemplate,
          "--",
          resolvedUrl
        ];
        await runYtDlp(args, { heavy: true });
        mediaFiles = findMediaFiles(tempDir);
      } catch (ytErr) {
        const raw = String(ytErr?.stderr || ytErr?.message || "").toLowerCase();
        if (raw.includes("file is larger than max-filesize") || raw.includes("larger than max-filesize")) {
          throw createServiceError(`Ukuran media melebihi batas maksimal ${PLATFORM_LIMITS.MAX_FILE_SIZE_MB} MB`, 400);
        }
      }
    }

    if (mediaFiles.length === 0) {
      throw createServiceError("Pin Pinterest tidak ditemukan atau tidak memiliki media publik", 404);
    }

    // Ambil file media pertama yang valid
    const chosenFile = mediaFiles[0];
    assertFileWithinSizeLimit(chosenFile);

    const ext = path.extname(chosenFile).slice(1).toLowerCase() || "jpg";
    const isVideo = ["mp4", "mkv", "webm", "mov"].includes(ext);
    const token = getCacheToken(`pinterest:${url}`);

    const author = metaAuthor || "pinterest_user";
    const title = metaTitle || "Pinterest Pin";

    if (isVideo) {
      const finalVideoPath = getCacheFilePath(token, "mp4");
      const videoFile = await getOrCreateNormalizedVideo({
        sourceKey: `pinterest-video:${url}`,
        sourceExtension: ext,
        platform: "pinterest",
        async createSource(sourcePath) {
          fs.copyFileSync(chosenFile, sourcePath);
        }
      });

      const filename = generateMediaFilename({
        platform: "pinterest",
        author,
        title,
        sourceUrl: url,
        kind: "video",
        format: "mp4"
      });

      return {
        platform: "pinterest",
        type: "video",
        title,
        author,
        thumbnail: `/api/file?token=${videoFile.token}`,
        sourceUrl: url,
        previewUrl: `/api/file?token=${videoFile.token}`,
        downloads: [
          {
            label: "MP4 / PIN VIDEO",
            url: `/api/file?token=${videoFile.token}&download=1&filename=${encodeURIComponent(filename)}`,
            format: "mp4",
            filename
          }
        ]
      };
    }

    // Foto / Gambar resolusi tinggi
    const cacheExt = ext === "jpeg" ? "jpg" : ext;
    const finalPhotoPath = getCacheFilePath(token, cacheExt);
    fs.copyFileSync(chosenFile, finalPhotoPath);

    const filename = generateMediaFilename({
      platform: "pinterest",
      author,
      title,
      sourceUrl: url,
      kind: "photo",
      format: cacheExt
    });

    const fileKind = cacheExt === "png" ? "png" : "photo";

    return {
      platform: "pinterest",
      type: "photo",
      title,
      author,
      thumbnail: `/api/file?token=${token}&kind=${fileKind}`,
      sourceUrl: url,
      downloads: [
        {
          label: "High-Res Photo (Original HD)",
          url: `/api/file?token=${token}&kind=${fileKind}&download=1&filename=${encodeURIComponent(filename)}`,
          format: cacheExt,
          filename
        }
      ]
    };
  } finally {
    try {
      if (fs.existsSync(tempDir)) {
        fs.rmSync(tempDir, { recursive: true, force: true });
      }
    } catch {
      // Abaikan error cleanup temp
    }
  }
}

module.exports = {
  downloadPinterest,
  resolvePinterestUrl
};
