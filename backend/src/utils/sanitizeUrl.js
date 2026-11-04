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

const FACEBOOK_HOSTS = new Set([
  "facebook.com",
  "www.facebook.com",
  "m.facebook.com",
  "web.facebook.com",
  "fb.watch",
  "fb.com",
  "www.fb.com"
]);

const SOUNDCLOUD_HOSTS = new Set([
  "soundcloud.com",
  "www.soundcloud.com",
  "m.soundcloud.com",
  "on.soundcloud.com"
]);

const REDDIT_HOSTS = new Set([
  "reddit.com",
  "www.reddit.com",
  "old.reddit.com",
  "redd.it",
  "v.redd.it"
]);

const DAILYMOTION_HOSTS = new Set([
  "dailymotion.com",
  "www.dailymotion.com",
  "dai.ly"
]);

const VIMEO_HOSTS = new Set([
  "vimeo.com",
  "www.vimeo.com",
  "player.vimeo.com"
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

  if (
    FACEBOOK_HOSTS.has(hostname) ||
    hostname.endsWith(".facebook.com") ||
    hostname === "fb.watch" ||
    hostname.endsWith(".fb.watch") ||
    hostname === "fb.com" ||
    hostname.endsWith(".fb.com")
  ) {
    return "facebook";
  }

  if (SOUNDCLOUD_HOSTS.has(hostname) || hostname.endsWith(".soundcloud.com")) {
    return "soundcloud";
  }

  if (
    REDDIT_HOSTS.has(hostname) ||
    hostname.endsWith(".reddit.com") ||
    hostname === "redd.it" ||
    hostname.endsWith(".redd.it")
  ) {
    return "reddit";
  }

  if (
    DAILYMOTION_HOSTS.has(hostname) ||
    hostname.endsWith(".dailymotion.com") ||
    hostname === "dai.ly" ||
    hostname.endsWith(".dai.ly")
  ) {
    return "dailymotion";
  }

  if (
    VIMEO_HOSTS.has(hostname) ||
    hostname.endsWith(".vimeo.com")
  ) {
    return "vimeo";
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
