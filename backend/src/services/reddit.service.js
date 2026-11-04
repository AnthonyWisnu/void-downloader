const { createServiceError } = require("../utils/errors");
const { generateMediaFilename } = require("../utils/filenameHelper");
const { getOrCreateNormalizedVideo } = require("./video-cache.service");
const { PLATFORM_LIMITS } = require("../config/limits");
const {
  fetchGenericMetadata,
  createGenericSourceVideo,
  downloadGenericAudio,
  getRawProcessError
} = require("./engine-base.service");

const PRIMARY_MERGE_FORMAT =
  "bv*[vcodec^=avc1][ext=mp4]+ba[ext=m4a]/" +
  "bv*[ext=mp4]+ba[ext=m4a]/" +
  "b[ext=mp4]/" +
  "bestvideo+bestaudio/best";

const FALLBACK_MERGE_FORMAT = "best[ext=mp4]/best";

function normalizeRedditError(error) {
  const raw = getRawProcessError(error).toLowerCase();

  if (raw.includes("file is larger than max-filesize") || raw.includes("larger than max-filesize")) {
    return createServiceError(`Ukuran video melebihi batas maksimal ${PLATFORM_LIMITS.MAX_FILE_SIZE_MB} MB`, 400);
  }

  if (raw.includes("404") || raw.includes("not found") || raw.includes("post was deleted")) {
    return createServiceError("Post Reddit atau video tidak ditemukan atau telah dihapus", 404);
  }

  if (raw.includes("no video") || raw.includes("does not have a video")) {
    return createServiceError("Post Reddit ini tidak memiliki file video untuk diunduh", 400);
  }

  if (raw.includes("quarantine") || raw.includes("nsfw") || raw.includes("private")) {
    return createServiceError("Post Reddit ini memerlukan izin atau berada dalam subreddit privat", 403);
  }

  return createServiceError("Gagal memproses URL Reddit. Pastikan tautan mengarah ke postingan publik.");
}

async function downloadReddit(url) {
  try {
    const meta = await fetchGenericMetadata({ url }).catch(() => null);

    const title = meta?.title || "Reddit Video";
    const author = meta?.uploader || null;
    const thumbnail = meta?.thumbnail || null;
    const duration = meta?.duration || null;

    if (duration && duration > PLATFORM_LIMITS.REDDIT.MAX_DURATION_SEC) {
      throw createServiceError(
        `Durasi video (${Math.round(duration / 60)} menit) melebihi batas maksimal ${Math.round(PLATFORM_LIMITS.REDDIT.MAX_DURATION_SEC / 60)} menit`,
        400
      );
    }

    const videoFile = await getOrCreateNormalizedVideo({
      key: `reddit:${url}`,
      url,
      createSourceFn: (sourcePath) =>
        createGenericSourceVideo({
          url,
          sourcePath,
          primaryFormat: PRIMARY_MERGE_FORMAT,
          fallbackFormat: FALLBACK_MERGE_FORMAT,
          platformLabel: "Reddit"
        })
    });

    const videoFilename = generateMediaFilename({
      platform: "reddit",
      author,
      title,
      sourceUrl: url,
      kind: "video",
      format: "mp4"
    });

    const downloads = [
      {
        label: "MP4 / VIDEO (SYNC AUDIO + VIDEO)",
        url: `/api/file?token=${videoFile.token}&download=1&filename=${encodeURIComponent(videoFilename)}`,
        format: "mp4",
        filename: videoFilename
      }
    ];

    // Ekstraksi MP3 (Video to MP3 Converter)
    try {
      const audioFile = await downloadGenericAudio({
        url,
        cachePrefix: "reddit-audio",
        platformLabel: "Reddit"
      });

      const audioFilename = generateMediaFilename({
        platform: "reddit",
        author,
        title,
        sourceUrl: url,
        kind: "audio",
        format: "mp3"
      });

      downloads.push({
        label: "Extracted Audio (192 kbps MP3)",
        url: `/api/file?token=${audioFile.token}&kind=audio&download=1&filename=${encodeURIComponent(audioFilename)}`,
        format: "mp3",
        filename: audioFilename
      });
    } catch {
      // Audio optional jika video tidak bersuara
    }

    return {
      platform: "reddit",
      type: "video",
      title,
      author,
      thumbnail,
      sourceUrl: url,
      previewUrl: `/api/file?token=${videoFile.token}`,
      downloads
    };
  } catch (error) {
    if (error.message?.startsWith("ERR:") || error.statusCode) {
      throw error;
    }
    throw normalizeRedditError(error);
  }
}

module.exports = {
  downloadReddit
};
