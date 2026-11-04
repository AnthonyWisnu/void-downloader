const os = require("os");
const path = require("path");
const express = require("express");
const multer = require("multer");
const { downloadContent, healthCheck } = require("../controllers/download.controller");
const { convertVideoToMp3 } = require("../controllers/convert.controller");
const { downloadFile } = require("../controllers/file.controller");
const { proxyMedia } = require("../controllers/media.controller");
const { createBatchZip } = require("../controllers/batch.controller");
const {
  downloadBurstLimiter,
  downloadRateLimiter,
  mediaStreamRateLimiter,
  healthRateLimiter
} = require("../middlewares/rateLimiter");
const { PLATFORM_LIMITS } = require("../config/limits");

const router = express.Router();

const upload = multer({
  dest: path.join(os.tmpdir(), "void-uploads"),
  limits: {
    fileSize: PLATFORM_LIMITS.MAX_FILE_SIZE_BYTES
  },
  fileFilter(req, file, cb) {
    const ext = path.extname(file.originalname || "").toLowerCase();
    const validExtensions = new Set([
      ".mp4", ".mkv", ".mov", ".webm", ".avi",
      ".flv", ".wmv", ".m4v", ".3gp", ".ts", ".mpeg", ".mpg"
    ]);

    if (file.mimetype.startsWith("video/") || validExtensions.has(ext)) {
      cb(null, true);
    } else {
      cb(new Error("Format file bukan merupakan video yang valid"));
    }
  }
});

router.get("/health", healthRateLimiter, healthCheck);
router.get("/file", mediaStreamRateLimiter, downloadFile);
router.get("/media", mediaStreamRateLimiter, proxyMedia);
router.post("/batch/zip", downloadBurstLimiter, downloadRateLimiter, createBatchZip);
router.post("/download", downloadBurstLimiter, downloadRateLimiter, downloadContent);
router.post(
  "/convert-video-mp3",
  downloadBurstLimiter,
  downloadRateLimiter,
  (req, res, next) => {
    upload.single("video")(req, res, (err) => {
      if (err) {
        if (err.code === "LIMIT_FILE_SIZE") {
          return res.status(400).json({
            error: `ERR: Ukuran video melebihi batas maksimal ${PLATFORM_LIMITS.MAX_FILE_SIZE_MB} MB`
          });
        }
        return res.status(400).json({ error: `ERR: ${err.message || "Gagal mengunggah file video"}` });
      }
      next();
    });
  },
  convertVideoToMp3
);

module.exports = router;
