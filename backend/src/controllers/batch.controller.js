const archiver = require("archiver");
const axios = require("axios");
const { validateMediaUrl, getSafeAxiosAgents } = require("../utils/safeRequest");
const { sanitizeSafeFilename } = require("../utils/filenameHelper");

function sanitizeFilename(name) {
  return String(name || "slides")
    .trim()
    .replace(/[^\w.-]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .slice(0, 45) || "slides";
}

async function createBatchZip(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "ERR: Method tidak diizinkan. Gunakan POST." });
  }

  let clientAborted = false;

  try {
    const title = req.body?.title || "slides";
    const rawItems = Array.isArray(req.body?.items) ? req.body.items : [];
    const customFilename = req.body?.filename;

    if (rawItems.length === 0) {
      return res.status(400).json({ error: "ERR: Daftar media untuk ZIP kosong atau tidak valid" });
    }

    // Batasi hingga 30 item per batch agar performa memori dan CPU server 2GB tetap terjaga
    const safeItems = rawItems.slice(0, 30);
    let zipFilename;

    if (customFilename && typeof customFilename === "string") {
      zipFilename = sanitizeSafeFilename(customFilename, "zip");
    } else {
      const cleanTitle = sanitizeFilename(title);
      zipFilename = `VOID_${cleanTitle}_all-slides.zip`;
    }

    res.setHeader("Content-Type", "application/zip");
    res.setHeader("Content-Disposition", `attachment; filename="${zipFilename}"`);
    res.setHeader("Cache-Control", "no-cache, no-store, must-revalidate");

    const archive = archiver("zip", {
      zlib: { level: 6 }
    });

    req.on("close", () => {
      clientAborted = true;
      try {
        archive.abort();
      } catch {
        // Abaikan error saat abort arsip
      }
    });

    archive.on("warning", (warn) => {
      console.warn("[batch-zip] Warning:", warn.message);
    });

    archive.on("error", (err) => {
      console.error("[batch-zip] Error:", err.message);
      if (!res.headersSent) {
        res.status(500).json({ error: "ERR: Gagal memproses arsip ZIP" });
      } else {
        res.end();
      }
    });

    archive.pipe(res);

    const { httpAgent, httpsAgent } = getSafeAxiosAgents();

    for (let i = 0; i < safeItems.length; i++) {
      if (clientAborted) {
        break;
      }

      const item = safeItems[i];
      const rawUrl = typeof item === "string" ? item : (item?.url || item?.rawUrl);

      if (!rawUrl || typeof rawUrl !== "string" || !rawUrl.startsWith("http")) {
        continue;
      }

      try {
        const parsedUrl = await validateMediaUrl(rawUrl);
        const format = String(item?.format || "").toLowerCase();
        let ext = format === "png" || format === "mp4" || format === "webp" ? format : "jpg";

        if (rawUrl.includes(".png")) ext = "png";
        if (rawUrl.includes(".mp4")) ext = "mp4";

        const slideName = item?.filename
          ? sanitizeSafeFilename(item.filename, ext)
          : `slide-${String(i + 1).padStart(2, "0")}.${ext}`;

        const streamResponse = await axios.get(parsedUrl.toString(), {
          responseType: "stream",
          timeout: 25000,
          httpAgent,
          httpsAgent,
          headers: {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36",
            Referer: parsedUrl.origin
          }
        });

        if (clientAborted) {
          if (typeof streamResponse.data.destroy === "function") {
            streamResponse.data.destroy();
          }
          break;
        }

        archive.append(streamResponse.data, { name: slideName });
      } catch (itemErr) {
        console.warn(`[batch-zip] Lewati slide ${i + 1} karena error: ${itemErr.message}`);
      }
    }

    if (!clientAborted) {
      await archive.finalize();
    }
  } catch (error) {
    console.error("[batch-zip] Exception:", error.message);
    if (!res.headersSent) {
      res.status(500).json({ error: "ERR: Gagal membuat arsip ZIP" });
    }
  }
}

module.exports = {
  createBatchZip
};
