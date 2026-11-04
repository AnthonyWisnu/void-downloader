const fs = require("fs");
const path = require("path");
const { runFfmpeg } = require("../utils/execTool");
const { createServiceError } = require("../utils/errors");
const { sanitizeSafeFilename } = require("../utils/filenameHelper");
const {
  ensureCacheDir,
  getCacheToken,
  getCacheFilePath,
  hasUsableFile,
  assertFileWithinSizeLimit
} = require("./media-cache.service");
const { PLATFORM_LIMITS } = require("../config/limits");

const ALLOWED_BITRATES = new Set([128, 192, 256, 320]);

async function convertVideoToMp3File({ tempFilePath, originalName, bitrate = 192 }) {
  ensureCacheDir();

  const chosenBitrate = ALLOWED_BITRATES.has(Number(bitrate)) ? Number(bitrate) : 192;
  const baseName = path.basename(originalName || "video", path.extname(originalName || "video"));
  const sanitizedBase = sanitizeSafeFilename(baseName, "mp3").replace(/\.mp3$/i, "") || "converted-audio";
  const finalFilename = `${sanitizedBase}.mp3`;

  const stat = fs.statSync(tempFilePath);
  if (stat.size > PLATFORM_LIMITS.MAX_FILE_SIZE_BYTES) {
    try {
      fs.unlinkSync(tempFilePath);
    } catch {}
    throw createServiceError(
      `Ukuran video melebihi batas maksimal ${PLATFORM_LIMITS.MAX_FILE_SIZE_MB} MB`,
      400
    );
  }

  // Token dibuat berbasis timestamp unik dan hash file
  const cacheKey = `upload-convert:${Date.now()}:${Math.random().toString(36).slice(2, 9)}:${sanitizedBase}`;
  const token = getCacheToken(cacheKey);
  const outputPath = getCacheFilePath(token, "mp3");

  try {
    const ffmpegArgs = [
      "-y",
      "-i",
      tempFilePath,
      "-vn",
      "-acodec",
      "libmp3lame",
      "-b:a",
      `${chosenBitrate}k`,
      "-ar",
      "44100",
      outputPath
    ];

    await runFfmpeg(ffmpegArgs, { heavy: true });

    if (!hasUsableFile(outputPath)) {
      throw createServiceError(
        "Gagal mengekstrak audio dari file video. Pastikan video memiliki trek audio.",
        400
      );
    }

    assertFileWithinSizeLimit(outputPath);
    const outStat = fs.statSync(outputPath);

    return {
      success: true,
      token,
      filename: finalFilename,
      size: outStat.size,
      bitrate: `${chosenBitrate} kbps`,
      url: `/api/file?token=${token}&kind=audio&download=1&filename=${encodeURIComponent(finalFilename)}`,
      previewUrl: `/api/file?token=${token}&kind=audio`
    };
  } catch (error) {
    if (error.message?.startsWith("ERR:") || error.statusCode) {
      throw error;
    }
    const raw = (error.stderr || error.message || "").toLowerCase();
    if (raw.includes("does not contain any stream") || raw.includes("output file is empty")) {
      throw createServiceError("Video tidak mengandung trek audio yang dapat dikonversi", 400);
    }
    throw createServiceError("Gagal mengonversi video ke MP3", 500);
  } finally {
    // Selalu hapus file video sementara agar kapasitas disk VPS tetap hemat
    try {
      if (fs.existsSync(tempFilePath)) {
        fs.unlinkSync(tempFilePath);
      }
    } catch {}
  }
}

module.exports = {
  convertVideoToMp3File
};
