const axios = require("axios");
const { sanitizeUrl } = require("../utils/sanitizeUrl");
const { formatUserSafeError } = require("../utils/errors");
const { downloadTikTok } = require("../services/tiktok.service");
const { downloadInstagram } = require("../services/instagram.service");
const { downloadYouTube } = require("../services/youtube.service");
const { downloadX } = require("../services/x.service");
const { downloadPinterest } = require("../services/pinterest.service");
const { downloadFacebook } = require("../services/facebook.service");
const { downloadSoundCloud } = require("../services/soundcloud.service");
const { downloadReddit } = require("../services/reddit.service");
const { downloadDailymotion } = require("../services/dailymotion.service");
const { downloadVimeo } = require("../services/vimeo.service");

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

function healthCheck(req, res) {
  res.json({ status: "ok" });
}

async function downloadContent(req, res) {
  const sanitized = sanitizeUrl(req.body?.url);

  if (!sanitized.ok) {
    res.status(400).json({ error: formatUserSafeError(sanitized.error, "ERR: " + DEFAULT_ERROR) });
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
    } else if (sanitized.platform === "pinterest") {
      result = await downloadPinterest(sanitized.url);
    } else if (sanitized.platform === "facebook") {
      result = await downloadFacebook(sanitized.url);
    } else if (sanitized.platform === "soundcloud") {
      result = await downloadSoundCloud(sanitized.url);
    } else if (sanitized.platform === "reddit") {
      result = await downloadReddit(sanitized.url);
    } else if (sanitized.platform === "dailymotion") {
      result = await downloadDailymotion(sanitized.url);
    } else if (sanitized.platform === "vimeo") {
      result = await downloadVimeo(sanitized.url);
    } else {
      res.status(400).json({ error: "ERR: " + DEFAULT_ERROR });
      return;
    }

    res.json(result);
    reportTelemetry(sanitized.platform, "success", result?.type || "media");
  } catch (error) {
    reportTelemetry(sanitized.platform, "failed", "unknown");
    process.stderr.write(`[download error] platform=${sanitized.platform} msg=${error?.message || error}\n`);
    const statusCode = error.statusCode || 502;
    res.status(statusCode).json({
      error: formatUserSafeError(error, "ERR: Konten tidak dapat diunduh. Pastikan link publik dan dapat diakses.")
    });
  }
}

module.exports = {
  healthCheck,
  downloadContent
};
