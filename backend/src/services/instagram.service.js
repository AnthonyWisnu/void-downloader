const fs = require("fs");
const path = require("path");
const axios = require("axios");
const qs = require("qs");
const { instagramGetUrl } = require("instagram-url-direct");
const { getOrCreateMp3FromUrl } = require("./audio-cache.service");
const { validateInstagramCookies } = require("./cookies.service");
const { getOrCreateNormalizedVideo } = require("./video-cache.service");
const { runYtDlp, runGalleryDl, parseYtDlpJson } = require("../utils/execTool");
const { createServiceError } = require("../utils/errors");
const { generateMediaFilename } = require("../utils/filenameHelper");

const {
  BROWSER_USER_AGENT,
  OUTPUT_EXTENSIONS,
  getRawProcessError,
  logProcessStderr
} = require("./engine-base.service");

const PRIMARY_MERGE_FORMAT =
  "bestvideo[ext=mp4][vcodec^=avc1]+bestaudio[ext=m4a]/best[ext=mp4][vcodec^=avc1]/best[ext=mp4]/best";
const FALLBACK_MERGE_FORMAT = "bestvideo+bestaudio/best";

function getRawError(error) {
  return getRawProcessError(error);
}

function logYtDlpStderr(error) {
  logProcessStderr("instagram", error);
}

function logAudioConvertError(error, audioUrl) {
  const host = (() => {
    try {
      return new URL(audioUrl).hostname;
    } catch {
      return "invalid-host";
    }
  })();
  const message = String(error?.message || "").slice(0, 180);

  process.stderr.write(`[instagram] audio convert failed host=${host} reason=${message}\n`);
}

function normalizeInstagramError(error) {
  const normalized = getRawError(error).toLowerCase();

  if (normalized.includes("http error 404")) {
    return createServiceError("Konten tidak ditemukan atau sudah dihapus", 404);
  }

  if (normalized.includes("login required")) {
    return createServiceError("Konten membutuhkan autentikasi", 401);
  }

  if (
    normalized.includes("metadata instagram kosong") ||
    normalized.includes("output json kosong") ||
    normalized.includes("unexpected end of json input")
  ) {
    return createServiceError("Gagal mengambil metadata, coba lagi");
  }

  return createServiceError("Gagal memproses URL Instagram");
}

function isNoVideoFormatsError(error) {
  return getRawError(error).toLowerCase().includes("no video formats found");
}

function isHttpUrl(value) {
  return typeof value === "string" && /^https?:\/\//i.test(value);
}

function getItems(metadata) {
  if (metadata?._type === "playlist" && Array.isArray(metadata.entries)) {
    return metadata.entries.filter(Boolean);
  }

  return [metadata].filter(Boolean);
}

function detectInstagramType(url, metadata) {
  const source = String(metadata?.webpage_url || metadata?.original_url || url || "").toLowerCase();

  if (source.includes("/stories/")) {
    return "story";
  }

  if (source.includes("/reel/") || source.includes("/reels/")) {
    return "reels";
  }

  return "video";
}

function getFormatScore(format) {
  return Number(format?.tbr || 0) * 1000000 +
    Number(format?.height || 0) * 1000 +
    Number(format?.width || 0);
}

function hasAudioStream(metadata) {
  return getItems(metadata).some((item) => {
    const formats = Array.isArray(item?.formats) ? item.formats : [];

    return formats.some((format) => {
      const acodec = String(format?.acodec || "").toLowerCase();
      return Boolean(acodec) && acodec !== "none";
    });
  });
}

function hasUsableAudioCodec(format) {
  const acodec = String(format?.acodec || "").toLowerCase();
  return Boolean(acodec) && acodec !== "none";
}

function hasNoVideoCodec(format) {
  const vcodec = String(format?.vcodec || "").toLowerCase();
  return !vcodec || vcodec === "none";
}

function isSupportedAudioExt(format) {
  return ["m4a", "mp4", "aac"].includes(String(format?.ext || "").toLowerCase());
}

function extractAudioUrl(metadata) {
  const audioFormats = getItems(metadata)
    .flatMap((item) => Array.isArray(item?.formats) ? item.formats : [])
    .filter((format) =>
      isHttpUrl(format?.url) &&
      hasUsableAudioCodec(format) &&
      hasNoVideoCodec(format) &&
      isSupportedAudioExt(format)
    )
    .sort((left, right) => Number(right?.tbr || 0) - Number(left?.tbr || 0));

  return audioFormats[0]?.url || null;
}

function pickBestVideoUrl(item) {
  const formats = Array.isArray(item?.formats) ? item.formats : [];
  const bestFormat = formats
    .filter((format) => format?.ext === "mp4" && isHttpUrl(format.url))
    .sort((left, right) => getFormatScore(right) - getFormatScore(left))[0];

  if (bestFormat) {
    return bestFormat.url;
  }

  if (item?.ext === "mp4" && isHttpUrl(item.url)) {
    return item.url;
  }

  return "";
}

function buildYtDlpDownloads(metadata) {
  const items = getItems(metadata);
  const downloads = items
    .map((item, index) => {
      const url = pickBestVideoUrl(item);

      if (!url) {
        return null;
      }

      return {
        label: `MP4 / VIDEO ${index + 1}`,
        url,
        format: "mp4"
      };
    })
    .filter(Boolean);

  if (metadata?.thumbnail && detectInstagramType("", metadata) === "story") {
    downloads.unshift({
      label: "JPG / STORY IMAGE 1",
      url: metadata.thumbnail,
      format: "jpg"
    });
  }

  return downloads;
}

async function fetchYtDlpMetadata(url, cookiesPath) {
  const baseArgs = [
    "--user-agent",
    BROWSER_USER_AGENT,
    "--dump-json",
    "--no-warnings",
    "--no-playlist",
    url
  ];

  if (cookiesPath && fs.existsSync(cookiesPath)) {
    try {
      const output = await runYtDlp(["--cookies", cookiesPath, ...baseArgs]);
      return parseYtDlpJson(output);
    } catch (cookieErr) {
      logYtDlpStderr(cookieErr);
    }
  }

  const output = await runYtDlp(baseArgs);
  return parseYtDlpJson(output);
}

async function runYtDlpVideoDownload(url, cookiesPath, sourcePath, format) {
  const outputBase = sourcePath.replace(/\.[^.]+$/, "");
  const outputTemplate = `${outputBase}.%(ext)s`;
  const candidatePaths = OUTPUT_EXTENSIONS.map((extension) => `${outputBase}.${extension}`);

  candidatePaths.forEach((candidatePath) => {
    if (fs.existsSync(candidatePath)) {
      fs.rmSync(candidatePath, { force: true });
    }
  });

  const baseArgs = [
    "--user-agent",
    BROWSER_USER_AGENT,
    "--no-warnings",
    "--no-playlist",
    "--format",
    format,
    "--merge-output-format",
    "mp4",
    "--output",
    outputTemplate,
    url
  ];

  if (cookiesPath && fs.existsSync(cookiesPath)) {
    try {
      await runYtDlp(["--cookies", cookiesPath, ...baseArgs]);
      const found = candidatePaths.find((candidatePath) =>
        fs.existsSync(candidatePath) && fs.statSync(candidatePath).size > 0
      );
      if (found) return found;
    } catch (cookieErr) {
      logYtDlpStderr(cookieErr);
    }
  }

  await runYtDlp(baseArgs);

  return candidatePaths.find((candidatePath) =>
    fs.existsSync(candidatePath) && fs.statSync(candidatePath).size > 0
  );
}

async function createInstagramSourceVideo(url, cookiesPath, sourcePath) {
  let mergedPath;

  try {
    mergedPath = await runYtDlpVideoDownload(url, cookiesPath, sourcePath, PRIMARY_MERGE_FORMAT);
  } catch (error) {
    logYtDlpStderr(error);
    mergedPath = await runYtDlpVideoDownload(url, cookiesPath, sourcePath, FALLBACK_MERGE_FORMAT);
  }

  if (!mergedPath) {
    throw new Error("Merged file kosong");
  }

  if (mergedPath !== sourcePath) {
    fs.renameSync(mergedPath, sourcePath);
  }
}

async function downloadWithMerge(url, cookiesPath) {
  return getOrCreateNormalizedVideo({
    sourceKey: url,
    sourceExtension: "mp4",
    platform: "instagram",
    createSource(sourcePath) {
      return createInstagramSourceVideo(url, cookiesPath, sourcePath);
    }
  });
}

function detectPhotoFormat(url) {
  const normalized = String(url || "").toLowerCase();

  if (normalized.includes(".mp4")) {
    return {
      labelFormat: "MP4",
      format: "mp4",
      type: "VIDEO"
    };
  }

  return {
    labelFormat: "JPG",
    format: "jpg",
    type: "IMAGE"
  };
}

function extractInstagramShortcode(url) {
  const match = String(url || "").match(/\/(?:p|reel|reels|tv)\/([A-Za-z0-9_-]+)/i);
  return match ? match[1] : null;
}

function getInstagramCookieHeader(cookiesPath) {
  if (!cookiesPath || !fs.existsSync(cookiesPath)) {
    return { cookieStr: "", csrfToken: "" };
  }

  const lines = fs.readFileSync(cookiesPath, "utf8").split(/\r?\n/);
  const pairs = [];
  let csrfToken = "";

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const parts = trimmed.split("\t");
    if (parts.length >= 7) {
      const domain = parts[0];
      const name = parts[5];
      const value = parts[6];
      if (domain.includes("instagram.com")) {
        pairs.push(`${name}=${value}`);
        if (name === "csrftoken") csrfToken = value;
      }
    }
  }

  return {
    cookieStr: pairs.join("; "),
    csrfToken
  };
}

function extractInstagramMediaItems(media) {
  if (!media) return [];

  // 1. Sidecar / Carousel via GraphQL (edge_sidecar_to_children)
  if (Array.isArray(media.edge_sidecar_to_children?.edges) && media.edge_sidecar_to_children.edges.length > 0) {
    return media.edge_sidecar_to_children.edges
      .map((edge, idx) => {
        const node = edge.node || {};
        const isVideo = Boolean(node.is_video);
        const url = isVideo && node.video_url
          ? node.video_url
          : (node.display_url || node.display_resources?.slice(-1)[0]?.src);

        return {
          url,
          format: isVideo ? "mp4" : "jpg",
          label: isVideo ? `Slide Video ${idx + 1}` : `Slide Image ${idx + 1}`,
          isVideo
        };
      })
      .filter((item) => Boolean(item.url));
  }

  // 2. Carousel via REST API (carousel_media)
  if (Array.isArray(media.carousel_media) && media.carousel_media.length > 0) {
    return media.carousel_media
      .map((item, idx) => {
        const isVideo = item.media_type === 2 || Boolean(item.video_versions?.length);
        const videoUrl = item.video_versions?.[0]?.url;
        const imageUrl = item.image_versions2?.candidates?.[0]?.url || item.display_url;
        const url = isVideo && videoUrl ? videoUrl : imageUrl;

        return {
          url,
          format: isVideo ? "mp4" : "jpg",
          label: isVideo ? `Slide Video ${idx + 1}` : `Slide Image ${idx + 1}`,
          isVideo
        };
      })
      .filter((item) => Boolean(item.url));
  }

  // 3. Single Item (GraphQL atau REST)
  const isVideo = Boolean(media.is_video) || media.media_type === 2;
  const videoUrl = media.video_url || media.video_versions?.[0]?.url;
  const imageUrl = media.display_url || media.image_versions2?.candidates?.[0]?.url || media.thumbnail_url;
  const url = isVideo && videoUrl ? videoUrl : imageUrl;

  if (url) {
    return [
      {
        url,
        format: isVideo ? "mp4" : "jpg",
        label: isVideo ? "MP4 / VIDEO" : "High-Res Photo",
        isVideo
      }
    ];
  }

  return [];
}

async function fetchIgViaGraphQL(shortcode, cookiesPath) {
  const { cookieStr, csrfToken } = getInstagramCookieHeader(cookiesPath);
  const BASE_URL = "https://www.instagram.com/graphql/query";
  const docIds = ["9510064595728286", "8845758582119845"];

  for (const docId of docIds) {
    try {
      const dataBody = qs.stringify({
        variables: JSON.stringify({
          shortcode,
          child_comment_count: 3,
          fetch_comment_count: 40,
          parent_comment_count: 24,
          has_threaded_comments: true
        }),
        doc_id: docId
      });

      const headers = {
        "User-Agent": BROWSER_USER_AGENT,
        "X-IG-App-ID": "936619743392459",
        "Content-Type": "application/x-www-form-urlencoded",
        Referer: "https://www.instagram.com/"
      };

      if (csrfToken) headers["X-CSRFToken"] = csrfToken;
      if (cookieStr) headers["Cookie"] = cookieStr;

      const response = await axios.post(BASE_URL, dataBody, {
        headers,
        timeout: 15000,
        validateStatus: (status) => status >= 200 && status < 400
      });

      const media =
        response.data?.data?.xdt_shortcode_media ||
        response.data?.data?.shortcode_media;

      if (media) {
        const items = extractInstagramMediaItems(media);
        if (items.length > 0) {
          const caption =
            media.edge_media_to_caption?.edges?.[0]?.node?.text ||
            media.title ||
            "Instagram content";

          return {
            items,
            caption,
            thumbnail: items[0]?.url || null
          };
        }
      }
    } catch {
      // coba docId berikutnya
    }
  }

  return null;
}

async function fetchIgViaRest(shortcode, cookiesPath) {
  const { cookieStr } = getInstagramCookieHeader(cookiesPath);
  const targetUrl = `https://www.instagram.com/p/${shortcode}/?__a=1&__d=dis`;

  try {
    const headers = {
      "User-Agent": BROWSER_USER_AGENT,
      "X-IG-App-ID": "936619743392459",
      "X-Requested-With": "XMLHttpRequest",
      Referer: "https://www.instagram.com/"
    };

    if (cookieStr) headers["Cookie"] = cookieStr;

    const response = await axios.get(targetUrl, {
      headers,
      timeout: 15000,
      validateStatus: (status) => status >= 200 && status < 400
    });

    const data = response.data;
    const media =
      data?.graphql?.shortcode_media ||
      data?.items?.[0] ||
      data;

    const items = extractInstagramMediaItems(media);
    if (items.length > 0) {
      const caption =
        media.edge_media_to_caption?.edges?.[0]?.node?.text ||
        media.caption?.text ||
        media.title ||
        "Instagram content";

      return {
        items,
        caption,
        thumbnail: items[0]?.url || null
      };
    }
  } catch {
    // fallback
  }

  return null;
}

async function fetchIgViaLegacy(url) {
  try {
    const data = await instagramGetUrl(url);
    const urls = Array.isArray(data?.url_list) ? data.url_list : [];
    const validUrls = urls.filter(isHttpUrl);

    if (validUrls.length > 0) {
      const items = validUrls.map((mediaUrl, idx) => {
        const isVideo = mediaUrl.toLowerCase().includes(".mp4");
        return {
          url: mediaUrl,
          format: isVideo ? "mp4" : "jpg",
          label: isVideo ? `Slide Video ${idx + 1}` : `Slide Image ${idx + 1}`,
          isVideo
        };
      });

      return {
        items,
        caption: data?.post_info?.caption || "Instagram content",
        thumbnail: data?.media_details?.[0]?.thumbnail || validUrls[0]
      };
    }
  } catch {
    // ignore
  }

  return null;
}

async function fetchIgViaGalleryDl(url, cookiesPath) {
  const cleanUrl = String(url || "").split("?")[0];
  const baseArgs = ["-j", "--retries", "0"];

  let raw = null;
  if (cookiesPath && fs.existsSync(cookiesPath)) {
    try {
      raw = await runGalleryDl(["--cookies", cookiesPath, ...baseArgs, cleanUrl]);
      const testParsed = JSON.parse(raw);
      if (Array.isArray(testParsed) && testParsed.length === 1 && testParsed[0][0] === -1) {
        raw = null;
      }
    } catch {
      raw = null;
    }
  }

  if (!raw) {
    try {
      raw = await runGalleryDl([...baseArgs, cleanUrl]);
    } catch {
      return null;
    }
  }

  try {
    const parsed = JSON.parse(raw);
    let postMeta = null;
    let audioUrl = null;
    const mediaItems = [];

    for (const entry of parsed) {
      if (!Array.isArray(entry)) continue;
      const [type, data1, data2] = entry;
      if (type === -1) continue;

      if (type === 2 && data1 && typeof data1 === "object") {
        postMeta = data1;
      } else if (type === 3 && typeof data1 === "string") {
        const extension = (data2?.extension || "").toLowerCase();
        const isAudioFile =
          extension === "mp3" ||
          extension === "m4a" ||
          extension === "aac" ||
          (data2?.width === 0 && data2?.height === 0 && (extension === "mp4" || extension === "mkv" || extension === "webm"));

        if (isAudioFile) {
          audioUrl = data1;
          continue;
        }

        if (data2?.audio_url && typeof data2.audio_url === "string" && data2.audio_url.startsWith("http")) {
          audioUrl = data2.audio_url;
        }

        const isVideo = extension === "mp4" || extension === "mkv" || extension === "webm";
        mediaItems.push({
          url: data1,
          format: isVideo ? "mp4" : (extension || "jpg"),
          isVideo,
          meta: data2 || {}
        });
      }
    }

    if (mediaItems.length === 0) {
      return null;
    }

    const caption = postMeta?.description || postMeta?.caption || mediaItems[0]?.meta?.description || "Instagram content";
    const author = postMeta?.username || postMeta?.owner_username || postMeta?.author?.name || postMeta?.author || mediaItems[0]?.meta?.username || "";
    const thumbnail = mediaItems[0]?.url || null;

    const downloads = mediaItems.map((item, index) => {
      const filename = generateMediaFilename({
        platform: "instagram",
        author,
        title: caption,
        sourceUrl: url,
        kind: mediaItems.length > 1 ? "slide" : (item.isVideo ? "video" : "photo"),
        slideIndex: mediaItems.length > 1 ? index + 1 : null,
        totalSlides: mediaItems.length > 1 ? mediaItems.length : null,
        format: item.format
      });

      return {
        label: mediaItems.length > 1
          ? `${item.format.toUpperCase()} / SLIDE ${index + 1}`
          : (item.isVideo ? "MP4 / VIDEO" : "High-Res Photo"),
        url: item.url,
        format: item.format,
        filename
      };
    });

    let audioStatus = null;
    if (audioUrl) {
      try {
        const audioFile = await getOrCreateMp3FromUrl(`instagram-photo-audio:${audioUrl}`, audioUrl, {
          Referer: "https://www.instagram.com/"
        });
        const audioFilename = generateMediaFilename({
          platform: "instagram",
          author,
          title: caption,
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
        audioStatus = "available";
      } catch (audioError) {
        logAudioConvertError(audioError, audioUrl);
      }
    }

    return {
      platform: "instagram",
      type: downloads.length > 1 ? "carousel" : (mediaItems[0]?.isVideo ? "video" : "photo"),
      title: caption,
      author,
      thumbnail,
      sourceUrl: url,
      audioStatus,
      downloads
    };
  } catch (err) {
    const rawErr = [err?.stderr, err?.stdout, err?.message].filter(Boolean).join("\n");
    if (
      rawErr.includes("404") ||
      rawErr.includes("Media not found or unavailable") ||
      rawErr.includes("httpErrorPage")
    ) {
      throw createServiceError("Konten tidak ditemukan atau postingan bersifat privat", 404);
    }
    return null;
  }
}

async function fetchIgPhoto(url, cookiesPath) {
  // 1. Primary extractor for photos and multi-slide carousels: gallery-dl
  try {
    const gdlResult = await fetchIgViaGalleryDl(url, cookiesPath);
    if (gdlResult && gdlResult.downloads.length > 0) {
      return gdlResult;
    }
  } catch (err) {
    if (err.message?.startsWith("ERR:")) {
      throw err;
    }
  }

  // 2. Secondary fallbacks (GraphQL, REST, Legacy)
  const shortcode = extractInstagramShortcode(url);
  let result = null;

  if (shortcode) {
    result = await fetchIgViaGraphQL(shortcode, cookiesPath);

    if (!result || result.items.length === 0) {
      result = await fetchIgViaRest(shortcode, cookiesPath);
    }
  }

  if (!result || result.items.length === 0) {
    result = await fetchIgViaLegacy(url);
  }

  if (!result || result.items.length === 0) {
    throw createServiceError("ERR: Konten tidak dapat diakses atau postingan bersifat privat");
  }

  const author = result.author || "";
  const caption = result.caption || "Instagram content";
  const downloads = result.items.map((item, index) => {
    const filename = generateMediaFilename({
      platform: "instagram",
      author,
      title: caption,
      sourceUrl: url,
      kind: result.items.length > 1 ? "slide" : "photo",
      slideIndex: result.items.length > 1 ? index + 1 : null,
      totalSlides: result.items.length > 1 ? result.items.length : null,
      format: item.format
    });

    return {
      label: result.items.length > 1 ? `${item.format.toUpperCase()} / SLIDE ${index + 1}` : item.label,
      url: item.url,
      format: item.format,
      filename
    };
  });

  return {
    platform: "instagram",
    type: downloads.length > 1 ? "carousel" : "photo",
    title: caption,
    author,
    thumbnail: result.thumbnail || downloads[0]?.url || null,
    sourceUrl: url,
    downloads
  };
}

async function downloadInstagram(url) {
  const cleanUrl = String(url || "").trim().replace("/reels/", "/reel/");
  const cookies = validateInstagramCookies();
  const cookiesPath = cookies.ok ? cookies.path : null;

  try {
    const metadata = await fetchYtDlpMetadata(cleanUrl, cookiesPath);
    const downloads = buildYtDlpDownloads(metadata);

    if (downloads.length === 0) {
      throw new Error("No video formats found");
    }

    const author = metadata.uploader || metadata.uploader_id || metadata.channel || "";
    const title = metadata.title || metadata.description || "Instagram content";
    const videoFile = await downloadWithMerge(cleanUrl, cookiesPath);
    const token = videoFile.token;
    const hasAudio = hasAudioStream(metadata);
    const label = hasAudio ? "MP4 / VIDEO" : "MP4 / VIDEO (NO AUDIO)";
    const videoFilename = generateMediaFilename({
      platform: "instagram",
      author,
      title,
      sourceUrl: cleanUrl,
      kind: "video",
      format: "mp4"
    });

    const responseDownloads = [
      {
        label,
        url: `/api/file?token=${token}&download=1&filename=${encodeURIComponent(videoFilename)}`,
        format: "mp4",
        filename: videoFilename
      }
    ];
    const audioUrl = extractAudioUrl(metadata);
    let audioStatus = "unavailable";

    if (audioUrl) {
      try {
        const audioFile = await getOrCreateMp3FromUrl(`instagram-audio-url:${audioUrl}`, audioUrl, {
          Referer: "https://www.instagram.com/"
        });
        const audioFilename = generateMediaFilename({
          platform: "instagram",
          author,
          title,
          sourceUrl: cleanUrl,
          kind: "audio",
          format: "mp3"
        });

        responseDownloads.push({
          label: "Audio Only",
          url: `/api/file?token=${audioFile.token}&kind=audio&download=1&filename=${encodeURIComponent(audioFilename)}`,
          format: "mp3",
          filename: audioFilename
        });
        audioStatus = "available";
      } catch (audioError) {
        logAudioConvertError(audioError, audioUrl);
      }
    }

    return {
      platform: "instagram",
      type: detectInstagramType(cleanUrl, metadata),
      title,
      author,
      thumbnail: metadata.thumbnail || null,
      sourceUrl: cleanUrl,
      previewUrl: `/api/file?token=${token}`,
      audioStatus,
      downloads: responseDownloads
    };
  } catch (error) {
    logYtDlpStderr(error);

    if (error.message?.startsWith("ERR:")) {
      throw error;
    }

    // Try extracting photo/carousel via gallery-dl and fallbacks
    try {
      return await fetchIgPhoto(cleanUrl, cookiesPath);
    } catch (photoError) {
      if (photoError.message?.startsWith("ERR:")) {
        throw photoError;
      }
      throw normalizeInstagramError(error);
    }
  }
}

module.exports = {
  downloadInstagram
};
