require("dotenv").config();

const cors = require("cors");
const express = require("express");
const downloadRoutes = require("./routes/download.routes");
const { validateAllCookiesOnStartup } = require("./services/cookies.service");
const { cleanupCache } = require("./services/media-cache.service");

const app = express();
const port = Number(process.env.PORT || 3001);
const frontendUrl =
  process.env.FRONTEND_URL || "http://localhost:5173,http://127.0.0.1:5173";
const allowedOrigins = new Set(frontendUrl
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean));

// Trust first proxy (Nginx) agar rate limiter dan req.ip akurat
app.set("trust proxy", 1);

app.use(
  cors({
    origin(origin, callback) {
      if (!origin || allowedOrigins.has(origin)) {
        callback(null, true);
        return;
      }

      callback(new Error("CORS origin tidak diizinkan"));
    }
  })
);

app.use(express.json({ limit: "1mb" }));
app.use("/api", downloadRoutes);

app.use("/api", (req, res) => {
  res.status(404).json({ error: "ERR: Endpoint tidak ditemukan" });
});

app.use((error, req, res, next) => {
  const message = error.message || "Server error";

  res.status(500).json({
    error: message.startsWith("ERR:") ? message : `ERR: ${message}`
  });
});

let cleanupTimer = null;

if (require.main === module) {
  validateAllCookiesOnStartup();
  cleanupCache();

  // Jalankan pembersihan cache berkala (TTL dan LRU kuota) setiap 30 menit
  cleanupTimer = setInterval(() => {
    try {
      cleanupCache();
    } catch (cleanupErr) {
      process.stderr.write(`cache cleanup error: ${cleanupErr.message}\n`);
    }
  }, 30 * 60 * 1000);

  if (cleanupTimer.unref) {
    cleanupTimer.unref();
  }

  const server = app.listen(port, () => {
    process.stdout.write(`VOID Downloader backend running on port ${port}\n`);
  });
  server.timeout = 300000;

  function handleShutdown(signal) {
    process.stdout.write(`Received ${signal}, shutting down gracefully\n`);
    if (cleanupTimer) {
      clearInterval(cleanupTimer);
    }
    server.close(() => {
      cleanupExpiredCache();
      process.exit(0);
    });
  }

  process.on("SIGTERM", () => handleShutdown("SIGTERM"));
  process.on("SIGINT", () => handleShutdown("SIGINT"));
}

module.exports = app;
