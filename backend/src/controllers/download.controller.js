const axios = require("axios");
const { sanitizeUrl } = require("../utils/sanitizeUrl");
const { downloadTikTok } = require("../services/tiktok.service");
const { downloadInstagram } = require("../services/instagram.service");
const { downloadYouTube } = require("../services/youtube.service");
const { downloadX } = require("../services/x.service");

const DEFAULT_ERROR = "URL tidak valid atau konten tidak dapat diakses";

function reportTelemetry(platform, status, format = "auto") {
  try {
    const pulseUrl = process.env.PULSE_COLLECT_URL || "http://127.0.0.1:3002/api/collect";
    axios.post(pulseUrl, {
      type: "event",
      website_id: "void-downloader",
      event_name: "download_media",
      event_data: {
        platform,
        status,
        format
      }
    }, {
      timeout: 2000
    }).catch(() => {});
  } catch (err) {
    // Fire-and-forget: abaikan kegagalan analitik agar tidak mengganggu download
  }
}

function formatApiError(message) {
  const cleanMessage = message || DEFAULT_ERROR;

  if (cleanMessage.startsWith("ERR:")) {
    return cleanMessage;
  }

  return `ERR: ${cleanMessage}`;
}

function healthCheck(req, res) {
  res.json({ status: "ok" });
}

async function downloadContent(req, res) {
  const sanitized = sanitizeUrl(req.body?.url);

  if (!sanitized.ok) {
    res.status(400).json({ error: formatApiError(sanitized.error) });
    return;
  }

  try {
    let result;

    if (sanitized.platform === "tiktok") {
      result = await downloadTikTok(sanitized.url);
    } else if (sanitized.platform === "instagram") {
      result = await downloadInstagram(sanitized.url);
    } else if (sanitized.platform === "youtube") {
      result = await downloadYouTube(sanitized.url);
    } else if (sanitized.platform === "x") {
      result = await downloadX(sanitized.url);
    } else {
      res.status(400).json({ error: formatApiError() });
      return;
    }

    res.json(result);
    reportTelemetry(sanitized.platform, "success", result?.type || "media");
  } catch (error) {
    reportTelemetry(sanitized.platform, "failed", "unknown");
    const statusCode = error.statusCode || 502;
    res.status(statusCode).json({
      error: formatApiError(error.message)
    });
  }
}

module.exports = {
  healthCheck,
  downloadContent
};
