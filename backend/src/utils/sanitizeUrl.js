const SUPPORTED_PROTOCOLS = new Set(["http:", "https:"]);

const TIKTOK_HOSTS = new Set([
  "tiktok.com",
  "www.tiktok.com",
  "m.tiktok.com",
  "vm.tiktok.com",
  "vt.tiktok.com"
]);

const INSTAGRAM_HOSTS = new Set([
  "instagram.com",
  "www.instagram.com",
  "m.instagram.com",
  "instagr.am",
  "www.instagr.am"
]);

const YOUTUBE_HOSTS = new Set([
  "youtube.com",
  "www.youtube.com",
  "m.youtube.com",
  "music.youtube.com",
  "youtu.be",
  "www.youtu.be"
]);

const X_HOSTS = new Set([
  "x.com",
  "www.x.com",
  "mobile.x.com",
  "twitter.com",
  "www.twitter.com",
  "mobile.twitter.com"
]);

const PINTEREST_HOSTS = new Set([
  "pinterest.com",
  "www.pinterest.com",
  "pin.it",
  "id.pinterest.com"
]);

function getPlatform(hostname) {
  if (TIKTOK_HOSTS.has(hostname) || hostname.endsWith(".tiktok.com")) {
    return "tiktok";
  }

  if (INSTAGRAM_HOSTS.has(hostname) || hostname.endsWith(".instagram.com")) {
    return "instagram";
  }

  if (YOUTUBE_HOSTS.has(hostname) || hostname.endsWith(".youtube.com") || hostname.endsWith(".youtu.be")) {
    return "youtube";
  }

  if (X_HOSTS.has(hostname) || hostname.endsWith(".x.com") || hostname.endsWith(".twitter.com")) {
    return "x";
  }

  if (
    PINTEREST_HOSTS.has(hostname) ||
    hostname.endsWith(".pinterest.com") ||
    hostname.includes("pinterest.") ||
    hostname === "pin.it" ||
    hostname.endsWith(".pin.it")
  ) {
    return "pinterest";
  }

  return null;
}

function sanitizeUrl(rawUrl) {
  if (typeof rawUrl !== "string") {
    return {
      ok: false,
      error: "URL tidak valid atau konten tidak dapat diakses"
    };
  }

  const trimmedUrl = rawUrl.trim();

  if (!trimmedUrl) {
    return {
      ok: false,
      error: "URL tidak valid atau konten tidak dapat diakses"
    };
  }

  let parsedUrl;

  try {
    parsedUrl = new URL(trimmedUrl);
  } catch {
    return {
      ok: false,
      error: "URL tidak valid atau konten tidak dapat diakses"
    };
  }

  if (!SUPPORTED_PROTOCOLS.has(parsedUrl.protocol)) {
    return {
      ok: false,
      error: "URL tidak valid atau konten tidak dapat diakses"
    };
  }

  parsedUrl.hash = "";

  const hostname = parsedUrl.hostname.toLowerCase();
  const platform = getPlatform(hostname);

  if (!platform) {
    return {
      ok: false,
      error: "URL tidak valid atau konten tidak dapat diakses"
    };
  }

  return {
    ok: true,
    platform,
    url: parsedUrl.toString()
  };
}

module.exports = {
  sanitizeUrl
};
