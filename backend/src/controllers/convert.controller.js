const fs = require("fs");
const { convertVideoToMp3File } = require("../services/video-convert.service");
const { formatUserSafeError } = require("../utils/errors");

async function convertVideoToMp3(req, res) {
  if (!req.file) {
    res.status(400).json({ error: "ERR: File video tidak ditemukan atau tidak valid" });
    return;
  }

  const tempFilePath = req.file.path;
  const originalName = req.file.originalname || "video.mp4";
  const bitrate = parseInt(req.body?.bitrate || "192", 10);

  try {
    const result = await convertVideoToMp3File({
      tempFilePath,
      originalName,
      bitrate
    });

    res.json(result);
  } catch (error) {
    try {
      if (fs.existsSync(tempFilePath)) {
        fs.unlinkSync(tempFilePath);
      }
    } catch {}

    process.stderr.write(`[convert error] msg=${error?.message || error}\n`);
    const statusCode = error.statusCode || 500;
    res.status(statusCode).json({
      error: formatUserSafeError(error, "ERR: Gagal memproses konversi video ke MP3.")
    });
  }
}

module.exports = {
  convertVideoToMp3
};
