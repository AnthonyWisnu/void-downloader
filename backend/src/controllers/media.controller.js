const fs = require("fs");
const axios = require("axios");
const { downloadFile } = require("./file.controller");
const { convertWebpStreamToJpeg } = require("../services/image-download.service");
const { sanitizeSafeFilename } = require("../utils/filenameHelper");
const { validateMediaUrl, getSafeAxiosAgents } = require("../utils/safeRequest");

const DEFAULT_ERROR = "ERR: Media tidak dapat diputar";
const CONTENT_TYPE_EXTENSIONS = {
  "image/jpeg": "jpg",
  "image/jpg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/gif": "gif",
  "audio/mpeg": "mp3",
  "audio/mp3": "mp3",
  "audio/mp4": "m4a",
  "audio/aac": "aac",
  "video/mp4": "mp4",
  "video/webm": "webm"
};

function getRequestHeaders(req, parsedUrl) {
  const headers = {
    Accept: "*/*",
    "User-Agent":
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/125 Safari/537.36"
  };

  if (req.headers.range) {
    headers.Range = req.headers.range;
  }

  if (parsedUrl.hostname.includes("instagram") || parsedUrl.hostname.includes("fbcdn")) {
    headers.Referer = "https://www.instagram.com/";
  }

  if (parsedUrl.hostname.includes("tiktok")) {
    headers.Referer = "https://www.tiktok.com/";
  }

  if (
    parsedUrl.hostname.includes("youtube") ||
    parsedUrl.hostname.includes("googlevideo") ||
    parsedUrl.hostname.includes("ggpht.com")
  ) {
    headers.Referer = "https://www.youtube.com/";
  }

  if (
    parsedUrl.hostname.includes("twitter") ||
    parsedUrl.hostname.includes("x.com") ||
    parsedUrl.hostname.includes("twimg.com")
  ) {
    headers.Referer = "https://x.com/";
  }

  return headers;
}

function getContentType(upstream, parsedUrl) {
  const upstreamType = String(upstream.headers["content-type"] || "").split(";")[0].trim();

  if (upstreamType) {
    return upstreamType;
  }

  const extension = getUrlExtension(parsedUrl);

  if (["jpg", "jpeg"].includes(extension)) {
    return "image/jpeg";
  }

  if (extension === "png") {
    return "image/png";
  }

  if (extension === "webp") {
    return "image/webp";
  }

  if (extension === "mp3") {
    return "audio/mpeg";
  }

  if (extension === "mp4") {
    return "video/mp4";
  }

  return "application/octet-stream";
}

function getUrlExtension(parsedUrl) {
  const pathname = parsedUrl.pathname.toLowerCase();
  const match = /\.([a-z0-9]+)$/.exec(pathname);

  return match ? match[1] : "";
}

function getDownloadFilename(contentType, parsedUrl) {
  const normalizedType = String(contentType || "").toLowerCase();
  const mappedExtension = CONTENT_TYPE_EXTENSIONS[normalizedType];
  const urlExtension = getUrlExtension(parsedUrl);
  const extension = mappedExtension || urlExtension || "bin";

  if (normalizedType.startsWith("image/") || ["jpg", "jpeg", "png", "webp", "gif"].includes(extension)) {
    const imageExtension = extension === "jpeg" ? "jpg" : extension;
    return `void-image.${imageExtension}`;
  }

  if (normalizedType.startsWith("audio/") || ["mp3", "m4a", "aac"].includes(extension)) {
    return `void-audio.${extension}`;
  }

  if (normalizedType.startsWith("video/") || ["mp4", "webm"].includes(extension)) {
    return `void-video.${extension}`;
  }

  return `void-download.${extension}`;
}

function setProxyHeaders(res, upstream, shouldDownload, parsedUrl, customFilename) {
  const contentType = getContentType(upstream, parsedUrl);
  const passthroughHeaders = [
    "content-length",
    "content-range",
    "accept-ranges"
  ];

  res.setHeader("Content-Type", contentType);

  passthroughHeaders.forEach((header) => {
    const value = upstream.headers[header];

    if (value) {
      res.setHeader(header, value);
    }
  });

  if (shouldDownload) {
    let filename = getDownloadFilename(contentType, parsedUrl);
    if (customFilename && typeof customFilename === "string") {
      const defaultExt = filename.split(".").pop() || "jpg";
      filename = sanitizeSafeFilename(customFilename, defaultExt);
    }
    res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
  }
}

async function sendConvertedWebpDownload(res, upstream, customFilename) {
  const converted = await convertWebpStreamToJpeg(upstream.data);
  const stat = fs.statSync(converted.outputPath);
  let filename = "void-image.jpg";
  if (customFilename && typeof customFilename === "string") {
    filename = sanitizeSafeFilename(customFilename, "jpg");
  }

  res.setHeader("Content-Type", "image/jpeg");
  res.setHeader("Content-Length", stat.size);
  res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);

  const outputStream = fs.createReadStream(converted.outputPath);
  outputStream.on("close", converted.cleanup);
  outputStream.pipe(res);
}

async function fetchSecureUpstream(initialUrl, req, maxHops = 3) {
  let currentUrl = initialUrl;
  let hops = 0;
  const { httpAgent, httpsAgent } = getSafeAxiosAgents();

  while (hops <= maxHops) {
    const parsedUrl = await validateMediaUrl(currentUrl);
    const headers = getRequestHeaders(req, parsedUrl);

    const response = await axios.get(parsedUrl.toString(), {
      headers,
      httpAgent,
      httpsAgent,
      responseType: "stream",
      timeout: 60000,
      maxRedirects: 0,
      validateStatus(status) {
        return (status >= 200 && status < 400) || [301, 302, 303, 307, 308].includes(status);
      }
    });

    if ([301, 302, 303, 307, 308].includes(response.status)) {
      const redirectLocation = response.headers.location;
      if (!redirectLocation) {
        throw new Error(DEFAULT_ERROR);
      }
      currentUrl = new URL(redirectLocation, parsedUrl).toString();
      hops++;
      continue;
    }

    return { response, parsedUrl };
  }

  throw new Error("Terlalu banyak redirect media");
}

async function proxyMedia(req, res) {
  try {
    const customFilename = req.query.filename;

    if (typeof req.query.url === "string" && req.query.url.startsWith("/api/file?")) {
      const internalUrl = new URL(req.query.url, "http://127.0.0.1");
      const syntheticReq = {
        ...req,
        query: {
          token: internalUrl.searchParams.get("token") || "",
          kind: internalUrl.searchParams.get("kind") || "",
          download: req.query.download === "1" ? "1" : (internalUrl.searchParams.get("download") || "0"),
          filename: customFilename || internalUrl.searchParams.get("filename") || ""
        },
        headers: req.headers
      };
      downloadFile(syntheticReq, res);
      return;
    }

    const shouldDownload = req.query.download === "1";
    const { response: upstream, parsedUrl } = await fetchSecureUpstream(req.query.url, req);

    res.status(upstream.status);
    const upstreamContentType = getContentType(upstream, parsedUrl).toLowerCase();

    if (shouldDownload && upstreamContentType === "image/webp") {
      await sendConvertedWebpDownload(res, upstream, customFilename);
      return;
    }

    setProxyHeaders(res, upstream, shouldDownload, parsedUrl, customFilename);

    req.on("close", () => {
      if (upstream && upstream.data && typeof upstream.data.destroy === "function") {
        upstream.data.destroy();
      }
    });

    upstream.data.pipe(res);
  } catch (error) {
    const status = error.response?.status || "no-status";
    const host = (() => {
      try {
        return new URL(req.query.url).hostname;
      } catch {
        return "invalid-host";
      }
    })();

    process.stderr.write(`media proxy failed host=${host} status=${status}\n`);

    res.status(502).json({
      error: DEFAULT_ERROR
    });
  }
}

module.exports = {
  proxyMedia,
  validateMediaUrl
};
