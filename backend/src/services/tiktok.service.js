const { getOrCreateMp3FromUrl } = require("./audio-cache.service");
const { downloadUrlToFile, getOrCreateNormalizedVideo } = require("./video-cache.service");
const { downloadGenericAudio } = require("./engine-base.service");
const { createServiceError } = require("../utils/errors");
const { generateMediaFilename } = require("../utils/filenameHelper");

function getDownloader() {
  const tiktokApi = require("@tobyg74/tiktok-api-dl");

  return (
    tiktokApi.Downloader ||
    tiktokApi.TiktokDL ||
    tiktokApi.tiktokdl ||
    tiktokApi.tiktokDl ||
    tiktokApi.default ||
    tiktokApi
  );
}

function firstString(...values) {
  for (const value of values) {
    if (typeof value === "string" && value.length > 0) {
      return value;
    }

    if (Array.isArray(value)) {
      const match = value.map((item) => firstString(item)).find(Boolean);

      if (match) {
        return match;
      }
    }

    if (value && typeof value === "object") {
      const match = firstString(
        value.play,
        value.playUrl,
        value.url,
        value.downloadUrl,
        value.download,
        value.href,
        value.src
      );

      if (match) {
        return match;
      }
    }
  }

  return "";
}

function downloadAudioWithYtDlp(url) {
  return downloadGenericAudio({
    url,
    cachePrefix: "tiktok-audio",
    platformLabel: "TikTok"
  });
}

async function createNormalizedVideoDownload(videoUrl, label, filename = "") {
  try {
    const videoFile = await getOrCreateNormalizedVideo({
      sourceKey: `tiktok-video:${videoUrl}`,
      sourceExtension: "mp4",
      platform: "tiktok",
      createSource(sourcePath) {
        return downloadUrlToFile(videoUrl, sourcePath, {
          Referer: "https://www.tiktok.com/"
        });
      }
    });

    const fileUrl = filename
      ? `/api/file?token=${videoFile.token}&download=1&filename=${encodeURIComponent(filename)}`
      : `/api/file?token=${videoFile.token}&download=1`;

    return {
      download: {
        label,
        url: fileUrl,
        format: "mp4",
        filename
      },
      previewUrl: `/api/file?token=${videoFile.token}`
    };
  } catch (error) {
    logVideoNormalizeFallback(error, videoUrl);

    return {
      download: {
        label: `${label} Fallback External`,
        url: videoUrl,
        format: "mp4",
        filename
      },
      previewUrl: ""
    };
  }
}

function findMediaUrlByKeyword(items, keywords) {
  if (!Array.isArray(items)) {
    return "";
  }

  return items
    .map((item) => {
      const descriptor = [
        item?.label,
        item?.type,
        item?.format,
        item?.quality,
        item?.mimeType,
        item?.contentType
      ].filter(Boolean).join(" ").toLowerCase();

      if (!keywords.some((keyword) => descriptor.includes(keyword))) {
        return "";
      }

      return firstString(item);
    })
    .find(Boolean) || "";
}

async function collectDownloads(result, sourceUrl) {
  const payload = result.result || result.data || result;
  const downloads = [];
  let previewUrl = "";

  const author = firstString(
    payload.author?.unique_id,
    payload.author?.nickname,
    payload.author?.name,
    payload.author?.username,
    payload.unique_id,
    payload.nickname,
    payload.author,
    ""
  );
  const title = firstString(payload.desc, payload.title, payload.description, "TikTok content");

  const videoUrl = firstString(
    payload.videoHD,
    payload.videoSD,
    payload.nowm,
    payload.no_watermark,
    payload.noWatermark,
    payload.video_no_watermark,
    payload.video?.noWatermark,
    payload.video?.nowm,
    payload.video?.url,
    payload.video?.playAddr,
    payload.video?.downloadAddr,
    payload.direct
  );

  if (videoUrl) {
    const filename = generateMediaFilename({
      platform: "tiktok",
      author,
      title,
      sourceUrl,
      kind: "video",
      format: "mp4"
    });
    const normalizedVideo = await createNormalizedVideoDownload(videoUrl, "Video (No Watermark)", filename);
    downloads.push(normalizedVideo.download);
    previewUrl = normalizedVideo.previewUrl;
  }

  const watermarkUrl = firstString(
    payload.videoWatermark,
    payload.wm,
    payload.watermark,
    payload.video_watermark,
    payload.video?.watermark
  );

  if (watermarkUrl) {
    const filename = generateMediaFilename({
      platform: "tiktok",
      author,
      title,
      sourceUrl,
      kind: "video-wm",
      format: "mp4"
    });
    const normalizedWatermarkVideo = await createNormalizedVideoDownload(watermarkUrl, "Video (Watermark)", filename);
    downloads.push(normalizedWatermarkVideo.download);
    previewUrl = previewUrl || normalizedWatermarkVideo.previewUrl;
  }

  const audioUrl = firstString(
    findMediaUrlByKeyword(payload.medias, ["audio", "music", "mp3", "m4a"]),
    findMediaUrlByKeyword(payload.downloads, ["audio", "music", "mp3", "m4a"]),
    findMediaUrlByKeyword(payload.links, ["audio", "music", "mp3", "m4a"]),
    payload.music,
    payload.music?.play,
    payload.music?.playUrl,
    payload.music?.url,
    payload.music?.downloadUrl,
    payload.audio,
    payload.audio?.play,
    payload.audio?.playUrl,
    payload.audio?.url,
    payload.audio?.downloadUrl,
    payload.audio_url,
    payload.sound,
    payload.sound?.play,
    payload.sound?.playUrl,
    payload.sound?.url,
    payload.sound?.downloadUrl,
    payload.music_info?.play,
    payload.music_info?.playUrl,
    payload.music_info?.url,
    payload.music_info?.downloadUrl,
    payload.musicInfo?.play,
    payload.musicInfo?.playUrl,
    payload.musicInfo?.url,
    payload.musicInfo?.downloadUrl
  );

  const audioFilename = generateMediaFilename({
    platform: "tiktok",
    author,
    title,
    sourceUrl,
    kind: "audio",
    format: "mp3"
  });

  if (audioUrl) {
    try {
      const audioFile = await getOrCreateMp3FromUrl(`tiktok-audio-url:${audioUrl}`, audioUrl, {
        Referer: "https://www.tiktok.com/"
      });

      downloads.push({
        label: "Audio Only",
        url: `/api/file?token=${audioFile.token}&kind=audio&download=1&filename=${encodeURIComponent(audioFilename)}`,
        format: "mp3",
        filename: audioFilename
      });
    } catch (error) {
      logAudioConvertError(error, audioUrl);

      try {
        const audioFile = await downloadAudioWithYtDlp(sourceUrl);

        downloads.push({
          label: "Audio Only",
          url: `/api/file?token=${audioFile.token}&kind=audio&download=1&filename=${encodeURIComponent(audioFilename)}`,
          format: "mp3",
          filename: audioFilename
        });
      } catch (fallbackError) {
        logAudioFallbackError(fallbackError);
      }
    }
  } else if (videoUrl || watermarkUrl) {
    try {
      const audioFile = await downloadAudioWithYtDlp(sourceUrl);

      downloads.push({
        label: "Audio Only",
        url: `/api/file?token=${audioFile.token}&kind=audio&download=1&filename=${encodeURIComponent(audioFilename)}`,
        format: "mp3",
        filename: audioFilename
      });
    } catch (error) {
      logAudioFallbackError(error);
    }
  }

  const images = payload.images || payload.image_post?.images || payload.imagePost?.images || [];

  if (Array.isArray(images)) {
    images.forEach((imageUrl, index) => {
      if (typeof imageUrl === "string" && imageUrl.length > 0) {
        const slideFilename = generateMediaFilename({
          platform: "tiktok",
          author,
          title,
          sourceUrl,
          kind: images.length > 1 ? "slide" : "photo",
          slideIndex: images.length > 1 ? index + 1 : null,
          totalSlides: images.length > 1 ? images.length : null,
          format: "jpg"
        });
        downloads.push({
          label: `Slideshow Image ${index + 1}`,
          url: imageUrl,
          format: "jpg",
          filename: slideFilename
        });
      }
    });
  }

  return {
    downloads,
    previewUrl,
    author,
    title
  };
}

function getMetadata(result) {
  const payload = result.result || result.data || result;

  return {
    title: firstString(payload.desc, payload.title, payload.description, "TikTok content"),
    author: firstString(
      payload.author?.unique_id,
      payload.author?.nickname,
      payload.author?.name,
      payload.author?.username,
      payload.unique_id,
      payload.nickname,
      payload.author,
      ""
    ),
    thumbnail: firstString(
      payload.cover,
      payload.author?.avatar,
      payload.thumbnail,
      payload.video?.cover,
      payload.video?.originCover,
      payload.video?.dynamicCover
    )
  };
}

async function downloadTikTok(url) {
  const downloader = getDownloader();

  if (typeof downloader !== "function") {
    throw createServiceError("Downloader TikTok tidak tersedia", 503);
  }

  const result = await downloader(url, { version: "v1" });
  const collected = await collectDownloads(result, url);
  const downloads = collected.downloads;

  if (downloads.length === 0) {
    throw createServiceError("URL tidak valid atau konten tidak dapat diakses", 404);
  }

  const metadata = getMetadata(result);
  const hasImages = downloads.some((download) => download.format === "jpg");

  return {
    platform: "tiktok",
    type: hasImages ? "slideshow" : "video",
    title: metadata.title,
    author: collected.author || metadata.author || null,
    thumbnail: metadata.thumbnail,
    previewUrl: collected.previewUrl || undefined,
    downloads
  };
}

module.exports = {
  downloadTikTok
};
