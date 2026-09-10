const axios = require("axios");
const { createServiceError } = require("../utils/errors");
const { generateMediaFilename } = require("../utils/filenameHelper");
const { validateXCookies } = require("./cookies.service");
const { getOrCreateNormalizedVideo } = require("./video-cache.service");
const {
  BROWSER_USER_AGENT,
  OUTPUT_EXTENSIONS,
  getRawProcessError,
  fetchGenericMetadata,
  createGenericSourceVideo,
  downloadGenericAudio
} = require("./engine-base.service");

const PRIMARY_MERGE_FORMAT =
  "best[ext=mp4]/bestvideo[ext=mp4]+bestaudio[ext=m4a]/bestvideo+bestaudio/best";
const FALLBACK_MERGE_FORMAT = "best";

function normalizeXError(error) {
  const raw = getRawProcessError(error).toLowerCase();

  if (raw.includes("status is not available") || raw.includes("not found") || raw.includes("http error 404")) {
    return createServiceError("Tweet tidak ditemukan atau telah dihapus", 404);
  }

  if (raw.includes("age-restricted") || raw.includes("adult content") || raw.includes("login required") || raw.includes("sign in")) {
    return createServiceError("Tweet ini memerlukan autentikasi cookies X (Twitter)", 401);
  }

  if (raw.includes("protected") || raw.includes("not authorized")) {
    return createServiceError("Akun X ini bersifat privat atau dilindungi", 403);
  }

  return createServiceError("Gagal memproses URL X (Twitter)");
}

function isNoVideoError(error) {
  const raw = getRawProcessError(error).toLowerCase();

  return (
    raw.includes("no video formats found") ||
    raw.includes("no video could be found") ||
    raw.includes("no video") ||
    raw.includes("belum terinstall") ||
    error?.code === "ENOENT"
  );
}

function extractTweetId(url) {
  const match = String(url || "").match(/(?:status|statuses)\/(\d+)/i);
  return match ? match[1] : null;
}

function fetchXMetadata(url) {
  return fetchGenericMetadata({ url, cookieValidatorFn: validateXCookies });
}

function toOriginalTwitterImageUrl(imageUrl) {
  if (typeof imageUrl !== "string" || !imageUrl) {
    return "";
  }

  try {
    const parsed = new URL(imageUrl);

    if (parsed.hostname.includes("twimg.com") && parsed.pathname.includes("/media/")) {
      parsed.searchParams.set("name", "orig");
      return parsed.toString();
    }
  } catch {
    // Kembalikan URL asli jika gagal parse
  }

  return imageUrl;
}

function extractImageUrls(metadata) {
  const imageUrls = new Set();

  if (metadata?._type === "playlist" && Array.isArray(metadata.entries)) {
    metadata.entries.forEach((entry) => {
      if (entry?.url && entry.url.includes("twimg.com/media/")) {
        imageUrls.add(toOriginalTwitterImageUrl(entry.url));
      } else if (entry?.thumbnail) {
        imageUrls.add(toOriginalTwitterImageUrl(entry.thumbnail));
      }
    });
  }

  if (Array.isArray(metadata?.thumbnails)) {
    metadata.thumbnails.forEach((thumb) => {
      if (thumb?.url && thumb.url.includes("twimg.com/media/")) {
        imageUrls.add(toOriginalTwitterImageUrl(thumb.url));
      }
    });
  }

  if (metadata?.url && metadata.url.includes("twimg.com/media/")) {
    imageUrls.add(toOriginalTwitterImageUrl(metadata.url));
  }

  return Array.from(imageUrls);
}

function getTweetDownloads(metadata) {
  const downloads = [];
  const imageUrls = extractImageUrls(metadata);

  imageUrls.forEach((imageUrl, index) => {
    downloads.push({
      label: `JPG / IMAGE ${index + 1}`,
      url: imageUrl,
      format: "jpg"
    });
  });

  return downloads;
}

function hasAudioStream(metadata) {
  const formats = Array.isArray(metadata?.formats) ? metadata.formats : [];
  return formats.some((format) => {
    const acodec = String(format?.acodec || "").toLowerCase();
    return Boolean(acodec) && acodec !== "none";
  });
}

function hasVideoFormats(metadata) {
  const formats = Array.isArray(metadata?.formats) ? metadata.formats : [];
  return formats.some((format) => {
    const vcodec = String(format?.vcodec || "").toLowerCase();
    const ext = String(format?.ext || "").toLowerCase();
    return (Boolean(vcodec) && vcodec !== "none") || ext === "mp4";
  });
}

function createXSourceVideo(url, sourcePath) {
  return createGenericSourceVideo({
    url,
    sourcePath,
    primaryFormat: PRIMARY_MERGE_FORMAT,
    fallbackFormat: FALLBACK_MERGE_FORMAT,
    cookieValidatorFn: validateXCookies,
    platformLabel: "X"
  });
}

function downloadXAudio(url) {
  return downloadGenericAudio({
    url,
    cachePrefix: "x-audio",
    cookieValidatorFn: validateXCookies,
    platformLabel: "X"
  });
}

async function fetchFromFxTwitter(tweetId) {
  const response = await axios.get(`https://api.fxtwitter.com/i/status/${tweetId}`, {
    headers: {
      "User-Agent": BROWSER_USER_AGENT
    },
    timeout: 12000
  });

  if (response.data?.code === 200 && response.data?.tweet) {
    const tweet = response.data.tweet;
    const mediaAll = Array.isArray(tweet.media?.all)
      ? tweet.media.all
      : [
          ...(Array.isArray(tweet.media?.videos) ? tweet.media.videos : []),
          ...(Array.isArray(tweet.media?.photos) ? tweet.media.photos : [])
        ];

    const photos = [];
    const videos = [];

    for (const item of mediaAll) {
      if (item.type === "photo") {
        photos.push(toOriginalTwitterImageUrl(item.url));
      } else if (item.type === "video" || item.type === "gif") {
        videos.push({
          url: item.url,
          thumbnail: item.thumbnail_url || null,
          type: item.type,
          duration: item.duration || null
        });
      }
    }

    if (photos.length > 0 || videos.length > 0) {
      return {
        title: tweet.text || `Tweet by ${tweet.author?.name || "X user"}`,
        author: tweet.author?.name ? `${tweet.author.name} (@${tweet.author.screen_name})` : null,
        photos,
        videos
      };
    }
  }

  return null;
}

async function fetchFromVxTwitter(tweetId) {
  const response = await axios.get(`https://api.vxtwitter.com/i/status/${tweetId}`, {
    headers: {
      "User-Agent": BROWSER_USER_AGENT
    },
    timeout: 12000,
    validateStatus: (status) => status === 200
  });

  if (response.data && Array.isArray(response.data.mediaURLs)) {
    const photos = [];
    const videos = [];

    for (const u of response.data.mediaURLs) {
      if (typeof u === "string") {
        if (u.endsWith(".mp4")) {
          videos.push({
            url: u,
            thumbnail: null,
            type: "video"
          });
        } else {
          photos.push(toOriginalTwitterImageUrl(u));
        }
      }
    }

    if (photos.length > 0 || videos.length > 0) {
      return {
        title: response.data.text || `Tweet by ${response.data.user_name || "X user"}`,
        author: response.data.user_name ? `${response.data.user_name} (@${response.data.user_screen_name})` : null,
        photos,
        videos
      };
    }
  }

  return null;
}

async function fetchXTweetPhotos(url) {
  const tweetId = extractTweetId(url);
  if (!tweetId) {
    throw createServiceError("Gagal mendeteksi ID Tweet dari URL yang diberikan", 400);
  }

  let result = null;
  try {
    result = await fetchFromFxTwitter(tweetId);
  } catch {
    // fallback ke provider alternatif
  }

  if (!result || (!result.photos?.length && !result.videos?.length)) {
    try {
      result = await fetchFromVxTwitter(tweetId);
    } catch {
      // ignore
    }
  }

  if (!result || (!result.photos?.length && !result.videos?.length)) {
    throw createServiceError("Tweet ini tidak memiliki foto atau media yang dapat diunduh", 404);
  }

  const downloads = [];
  if (result.videos?.length) {
    result.videos.forEach((v, idx) => {
      downloads.push({
        label: result.videos.length > 1 ? `MP4 / VIDEO ${idx + 1}` : "MP4 / VIDEO",
        url: v.url,
        format: "mp4"
      });
    });
  }

  if (result.photos?.length) {
    result.photos.forEach((imageUrl, index) => {
      downloads.push({
        label: result.photos.length > 1 ? `Slideshow Image ${index + 1}` : "High-Res Photo",
        url: imageUrl,
        format: "jpg"
      });
    });
  }

  return {
    platform: "x",
    type: result.photos?.length > 1 ? "slideshow" : result.videos?.length > 0 ? "video" : "photo",
    title: result.title,
    author: result.author,
    thumbnail: downloads[0]?.url || null,
    sourceUrl: url,
    downloads
  };
}

async function downloadX(url) {
  try {
    const tweetId = extractTweetId(url);
    let tweetData = null;

    if (tweetId) {
      try {
        tweetData = await fetchFromFxTwitter(tweetId);
      } catch {
        // fallback
      }

      if (!tweetData) {
        try {
          tweetData = await fetchFromVxTwitter(tweetId);
        } catch {
          // fallback
        }
      }
    }

    // Kasus 1: Data media ditemukan via API
    if (tweetData && (tweetData.photos.length > 0 || tweetData.videos.length > 0)) {
      const { photos, videos, title, author } = tweetData;

      // Kasus 1A: Hanya Foto / Slideshow (tanpa video)
      if (videos.length === 0 && photos.length > 0) {
        const type = photos.length > 1 ? "slideshow" : "photo";
        const downloads = photos.map((imgUrl, index) => {
          const filename = generateMediaFilename({
            platform: "x",
            author,
            title,
            sourceUrl: url,
            kind: photos.length > 1 ? "slide" : "photo",
            slideIndex: photos.length > 1 ? index + 1 : null,
            totalSlides: photos.length > 1 ? photos.length : null,
            format: "jpg"
          });
          return {
            label: photos.length > 1 ? `Slideshow Image ${index + 1}` : "High-Res Photo",
            url: imgUrl,
            format: "jpg",
            filename
          };
        });

        return {
          platform: "x",
          type,
          title,
          author,
          thumbnail: photos[0],
          sourceUrl: url,
          downloads
        };
      }

      // Kasus 1B: Mixed Media (Ada Video DAN Foto dalam 1 Tweet)
      if (photos.length > 0 && videos.length > 0) {
        const downloads = [];
        let previewUrl = null;
        const videoFilename = generateMediaFilename({
          platform: "x",
          author,
          title,
          sourceUrl: url,
          kind: "video",
          format: "mp4"
        });

        try {
          const videoFile = await getOrCreateNormalizedVideo({
            sourceKey: `x-video:${url}`,
            sourceExtension: "mp4",
            platform: "x",
            createSource(sourcePath) {
              return createXSourceVideo(url, sourcePath);
            }
          });
          downloads.push({
            label: "MP4 / VIDEO",
            url: `/api/file?token=${videoFile.token}&download=1&filename=${encodeURIComponent(videoFilename)}`,
            format: "mp4",
            filename: videoFilename
          });
          previewUrl = `/api/file?token=${videoFile.token}`;

          try {
            const audioFile = await downloadXAudio(url);
            const audioFilename = generateMediaFilename({
              platform: "x",
              author,
              title,
              sourceUrl: url,
              kind: "audio",
              format: "mp3"
            });
            downloads.push({
              label: "Audio Only",
              url: `/api/file?token=${audioFile.token}&kind=audio&download=1&filename=${encodeURIComponent(audioFilename)}`,
              format: "mp3",
              filename: audioFilename
            });
          } catch {
            // optional audio
          }
        } catch {
          videos.forEach((v, idx) => {
            const vName = generateMediaFilename({
              platform: "x",
              author,
              title,
              sourceUrl: url,
              kind: videos.length > 1 ? `video-${idx + 1}` : "video",
              format: "mp4"
            });
            downloads.push({
              label: videos.length > 1 ? `MP4 / VIDEO ${idx + 1}` : "MP4 / VIDEO",
              url: v.url,
              format: "mp4",
              filename: vName
            });
          });
          previewUrl = videos[0]?.url || null;
        }

        photos.forEach((imgUrl, idx) => {
          const slideFilename = generateMediaFilename({
            platform: "x",
            author,
            title,
            sourceUrl: url,
            kind: "slide",
            slideIndex: idx + 1,
            totalSlides: photos.length,
            format: "jpg"
          });
          downloads.push({
            label: `Slideshow Image ${idx + 1}`,
            url: imgUrl,
            format: "jpg",
            filename: slideFilename
          });
        });

        return {
          platform: "x",
          type: "slideshow",
          title,
          author,
          thumbnail: previewUrl ? (videos[0]?.thumbnail || photos[0]) : photos[0],
          sourceUrl: url,
          previewUrl,
          downloads
        };
      }

      // Kasus 1C: Multiple Videos (2+ Video tanpa foto)
      if (videos.length > 1 && photos.length === 0) {
        const downloads = videos.map((v, idx) => {
          const vName = generateMediaFilename({
            platform: "x",
            author,
            title,
            sourceUrl: url,
            kind: `video-${idx + 1}`,
            format: "mp4"
          });
          return {
            label: `MP4 / VIDEO ${idx + 1}`,
            url: v.url,
            format: "mp4",
            filename: vName
          };
        });

        return {
          platform: "x",
          type: "video",
          title,
          author,
          thumbnail: videos[0]?.thumbnail || null,
          sourceUrl: url,
          previewUrl: videos[0]?.url || null,
          downloads
        };
      }
    }

    // Kasus 2: Single Video atau fallback yt-dlp
    let metadata = null;
    try {
      metadata = await fetchXMetadata(url);
    } catch (metaError) {
      if (isNoVideoError(metaError)) {
        return await fetchXTweetPhotos(url);
      }
      throw metaError;
    }

    const author = metadata.uploader || metadata.uploader_id || "";
    const title = metadata.title || metadata.description || "X post";
    const thumbnail = metadata.thumbnail || null;
    const isVideo = hasVideoFormats(metadata);
    const images = extractImageUrls(metadata);

    if (!isVideo && images.length > 0) {
      const type = images.length > 1 ? "slideshow" : "photo";
      const downloads = images.map((imageUrl, index) => {
        const filename = generateMediaFilename({
          platform: "x",
          author,
          title,
          sourceUrl: url,
          kind: images.length > 1 ? "slide" : "photo",
          slideIndex: images.length > 1 ? index + 1 : null,
          totalSlides: images.length > 1 ? images.length : null,
          format: "jpg"
        });
        return {
          label: images.length > 1 ? `Slideshow Image ${index + 1}` : "High-Res Photo",
          url: imageUrl,
          format: "jpg",
          filename
        };
      });

      return {
        platform: "x",
        type,
        title,
        author: author || null,
        thumbnail: images[0],
        sourceUrl: url,
        downloads
      };
    }

    if (!isVideo && images.length === 0) {
      return await fetchXTweetPhotos(url);
    }

    // Video/GIF Tweet via yt-dlp
    const hasAudio = hasAudioStream(metadata);
    const duration = Number(metadata.duration || 0);
    const isGif = !hasAudio && duration > 0 && duration <= 10;
    const type = isGif ? "gif" : "video";
    const label = isGif ? "MP4 / GIF" : "MP4 / VIDEO";
    const kind = isGif ? "gif" : "video";

    let videoFile = null;
    try {
      videoFile = await getOrCreateNormalizedVideo({
        sourceKey: `x-video:${url}`,
        sourceExtension: "mp4",
        platform: "x",
        createSource(sourcePath) {
          return createXSourceVideo(url, sourcePath);
        }
      });
    } catch (vErr) {
      if (tweetData?.videos?.length > 0) {
        const downloads = tweetData.videos.map((v, idx) => {
          const vName = generateMediaFilename({
            platform: "x",
            author,
            title,
            sourceUrl: url,
            kind: tweetData.videos.length > 1 ? `video-${idx + 1}` : kind,
            format: "mp4"
          });
          return {
            label: tweetData.videos.length > 1 ? `MP4 / VIDEO ${idx + 1}` : label,
            url: v.url,
            format: "mp4",
            filename: vName
          };
        });

        return {
          platform: "x",
          type,
          title,
          author: author || null,
          thumbnail: tweetData.videos[0]?.thumbnail || thumbnail,
          sourceUrl: url,
          previewUrl: tweetData.videos[0]?.url || null,
          downloads
        };
      }
      throw vErr;
    }

    const videoFilename = generateMediaFilename({
      platform: "x",
      author,
      title,
      sourceUrl: url,
      kind,
      format: "mp4"
    });

    const downloads = [
      {
        label,
        url: `/api/file?token=${videoFile.token}&download=1&filename=${encodeURIComponent(videoFilename)}`,
        format: "mp4",
        filename: videoFilename
      }
    ];

    if (hasAudio) {
      try {
        const audioFile = await downloadXAudio(url);
        const audioFilename = generateMediaFilename({
          platform: "x",
          author,
          title,
          sourceUrl: url,
          kind: "audio",
          format: "mp3"
        });
        downloads.push({
          label: "Audio Only",
          url: `/api/file?token=${audioFile.token}&kind=audio&download=1&filename=${encodeURIComponent(audioFilename)}`,
          format: "mp3",
          filename: audioFilename
        });
      } catch {
        // Audio optional jika ekstraksi gagal
      }
    }

    if (images.length > 0) {
      images.forEach((imgUrl, idx) => {
        const slideFilename = generateMediaFilename({
          platform: "x",
          author,
          title,
          sourceUrl: url,
          kind: "slide",
          slideIndex: idx + 1,
          totalSlides: images.length,
          format: "jpg"
        });
        downloads.push({
          label: `Slideshow Image ${idx + 1}`,
          url: imgUrl,
          format: "jpg",
          filename: slideFilename
        });
      });
    }

    return {
      platform: "x",
      type: images.length > 0 ? "slideshow" : type,
      title,
      author: author || null,
      thumbnail,
      sourceUrl: url,
      previewUrl: `/api/file?token=${videoFile.token}`,
      downloads
    };
  } catch (error) {
    if (error.message?.startsWith("ERR:")) {
      throw error;
    }

    throw normalizeXError(error);
  }
}

module.exports = {
  downloadX
};
