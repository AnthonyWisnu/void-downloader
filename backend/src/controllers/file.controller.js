const fs = require("fs");
const {
  TOKEN_PATTERN,
  getCacheFilePath,
  hasUsableFile
} = require("../services/media-cache.service");
const { sanitizeSafeFilename } = require("../utils/filenameHelper");

const FILE_TYPES = {
  audio: {
    extension: "mp3",
    contentType: "audio/mpeg",
    filename: "void-download.mp3"
  },
  video: {
    extension: "mp4",
    contentType: "video/mp4",
    filename: "void-download.mp4"
  },
  photo: {
    extension: "jpg",
    contentType: "image/jpeg",
    filename: "void-download.jpg"
  },
  image: {
    extension: "jpg",
    contentType: "image/jpeg",
    filename: "void-download.jpg"
  },
  png: {
    extension: "png",
    contentType: "image/png",
    filename: "void-download.png"
  }
};

function getFileType(req) {
  const kind = String(req.query.kind || "").toLowerCase();
  return FILE_TYPES[kind] || FILE_TYPES.video;
}

function getFilePath(token, fileType) {
  return getCacheFilePath(token, fileType.extension);
}

function streamFile(req, res, filePath, fileType) {
  const stat = fs.statSync(filePath);
  const range = req.headers.range;

  res.setHeader("Content-Type", fileType.contentType);
  res.setHeader("Accept-Ranges", "bytes");
  res.setHeader("Cache-Control", "private, max-age=7200");

  if (req.query.download === "1") {
    let filename = fileType.filename;
    if (req.query.filename && typeof req.query.filename === "string") {
      filename = sanitizeSafeFilename(req.query.filename, fileType.extension);
    }
    res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
  }

  if (!range) {
    res.setHeader("Content-Length", stat.size);
    fs.createReadStream(filePath).pipe(res);
    return;
  }

  const [startRaw, endRaw] = range.replace(/bytes=/, "").split("-");
  const suffixLength = startRaw === "" ? Number(endRaw) : null;
  const start = suffixLength ? Math.max(stat.size - suffixLength, 0) : Number(startRaw);
  const requestedEnd = endRaw && startRaw !== "" ? Number(endRaw) : stat.size - 1;
  const end = Math.min(requestedEnd, stat.size - 1);

  if (Number.isNaN(start) || Number.isNaN(end) || start >= stat.size || start > end) {
    res.status(416).end();
    return;
  }

  res.status(206);
  res.setHeader("Content-Range", `bytes ${start}-${end}/${stat.size}`);
  res.setHeader("Content-Length", end - start + 1);
  fs.createReadStream(filePath, { start, end }).pipe(res);
}

function downloadFile(req, res) {
  const token = String(req.query.token || "");
  const fileType = getFileType(req);

  if (!TOKEN_PATTERN.test(token)) {
    res.status(404).json({ error: "ERR: File tidak ditemukan" });
    return;
  }

  const filePath = getFilePath(token, fileType);

  if (!hasUsableFile(filePath)) {
    res.status(404).json({ error: "ERR: File tidak ditemukan" });
    return;
  }

  streamFile(req, res, filePath, fileType);
}

module.exports = {
  downloadFile
};
