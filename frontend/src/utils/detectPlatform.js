export function detectPlatform(url) {
  if (!url) {
    return "unknown";
  }

  try {
    const hostname = new URL(url).hostname.toLowerCase();

    if (hostname.includes("tiktok.com")) {
      return "tiktok";
    }

    if (hostname.includes("instagram.com") || hostname.includes("instagr.am")) {
      return "instagram";
    }

    if (hostname.includes("youtube.com") || hostname.includes("youtu.be")) {
      return "youtube";
    }

    if (hostname.includes("x.com") || hostname.includes("twitter.com")) {
      return "x";
    }

    if (hostname.includes("pinterest.") || hostname.includes("pin.it")) {
      return "pinterest";
    }
  } catch {
    return "unknown";
  }

  return "unknown";
}

export function platformLabel(platform, type) {
  if (platform === "tiktok") {
    return "TIKTOK";
  }

  if (platform === "instagram" && (type === "story" || type === "story_photo")) {
    return "INSTAGRAM STORY";
  }

  if (platform === "instagram") {
    return "INSTAGRAM";
  }

  if (platform === "youtube" && type === "shorts") {
    return "YOUTUBE SHORTS";
  }

  if (platform === "youtube") {
    return "YOUTUBE";
  }

  if (platform === "x") {
    return "X (TWITTER)";
  }

  if (platform === "pinterest") {
    return "PINTEREST";
  }

  return "UNKNOWN";
}

export function typeLabel(type) {
  const labels = {
    video: "VIDEO",
    shorts: "SHORTS",
    gif: "GIF",
    audio: "AUDIO",
    slideshow: "SLIDESHOW",
    reels: "REELS",
    story: "STORY",
    story_photo: "STORY PHOTO",
    photo: "PHOTO",
    carousel: "CAROUSEL",
    image: "IMAGE",
    mixed: "MIXED MEDIA",
    community: "COMMUNITY POST"
  };

  return labels[type] || "VIDEO";
}
