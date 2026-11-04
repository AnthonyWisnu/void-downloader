const { createServiceError } = require("../utils/errors");
const { generateMediaFilename } = require("../utils/filenameHelper");
const { PLATFORM_LIMITS } = require("../config/limits");
const {
  fetchGenericMetadata,
  downloadGenericAudio,
  getRawProcessError
} = require("./engine-base.service");

function normalizeSoundCloudError(error) {
  const raw = getRawProcessError(error).toLowerCase();

  if (raw.includes("file is larger than max-filesize") || raw.includes("larger than max-filesize")) {
    return createServiceError(`Ukuran audio melebihi batas maksimal ${PLATFORM_LIMITS.MAX_FILE_SIZE_MB} MB`, 400);
  }

  if (raw.includes("not found") || raw.includes("404") || raw.includes("does not exist")) {
    return createServiceError("Lagu atau audio SoundCloud tidak ditemukan", 404);
  }

  if (raw.includes("private") || raw.includes("permission") || raw.includes("geo-restricted")) {
    return createServiceError("Audio SoundCloud ini bersifat privat atau dibatasi wilayah geografis", 403);
  }

  return createServiceError("Gagal memproses URL SoundCloud. Pastikan lagu berstatus publik.");
}

async function downloadSoundCloud(url) {
  try {
    const meta = await fetchGenericMetadata({ url }).catch(() => null);

    const title = meta?.title || "SoundCloud Track";
    const author = meta?.uploader || meta?.artist || null;
    const thumbnail = meta?.thumbnail || null;
    const duration = meta?.duration || null;

    if (duration && duration > PLATFORM_LIMITS.SOUNDCLOUD.MAX_DURATION_SEC) {
      throw createServiceError(
        `Durasi audio (${Math.round(duration / 60)} menit) melebihi batas maksimal ${Math.round(PLATFORM_LIMITS.SOUNDCLOUD.MAX_DURATION_SEC / 60)} menit`,
        400
      );
    }

    const audioFile = await downloadGenericAudio({
      url,
      cachePrefix: "soundcloud-audio",
      platformLabel: "SoundCloud"
    });

    const audioFilename = generateMediaFilename({
      platform: "soundcloud",
      author,
      title,
      sourceUrl: url,
      kind: "audio",
      format: "mp3"
    });

    const downloads = [
      {
        label: "Audio MP3 (HQ Audio 192-320 kbps)",
        url: `/api/file?token=${audioFile.token}&kind=audio&download=1&filename=${encodeURIComponent(audioFilename)}`,
        format: "mp3",
        filename: audioFilename
      }
    ];

    return {
      platform: "soundcloud",
      type: "audio",
      title,
      author,
      thumbnail,
      sourceUrl: url,
      previewUrl: `/api/file?token=${audioFile.token}&kind=audio`,
      downloads
    };
  } catch (error) {
    if (error.message?.startsWith("ERR:") || error.statusCode) {
      throw error;
    }
    throw normalizeSoundCloudError(error);
  }
}

module.exports = {
  downloadSoundCloud
};
