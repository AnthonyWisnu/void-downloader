const express = require("express");
const { downloadContent, healthCheck } = require("../controllers/download.controller");
const { downloadFile } = require("../controllers/file.controller");
const { proxyMedia } = require("../controllers/media.controller");
const { createBatchZip } = require("../controllers/batch.controller");
const {
  downloadBurstLimiter,
  downloadRateLimiter,
  mediaStreamRateLimiter,
  healthRateLimiter
} = require("../middlewares/rateLimiter");

const router = express.Router();

router.get("/health", healthRateLimiter, healthCheck);
router.get("/file", mediaStreamRateLimiter, downloadFile);
router.get("/media", mediaStreamRateLimiter, proxyMedia);
router.post("/batch/zip", downloadBurstLimiter, downloadRateLimiter, createBatchZip);
router.post("/download", downloadBurstLimiter, downloadRateLimiter, downloadContent);

module.exports = router;
