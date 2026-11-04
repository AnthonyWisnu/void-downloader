import { YouTubeLogo, TikTokLogo, InstagramLogo, XLogo, PinterestLogo } from "./BrandLogos";
import { Radio, ArrowUpRight } from "lucide-react";

const platforms = [
  {
    id: "youtube",
    tag: "CH.01",
    name: "YouTube",
    scope: "VIDEO & AUDIO MATRIX",
    colorClass: "card-youtube",
    logo: <YouTubeLogo size={32} />,
    formats: ["720P ADAPTIVE", "SHORTS", "192K MP3", "AUDIO ONLY"],
    description: "Extract Smart Adaptive videos up to 720p 60fps/30fps, Shorts, and 192 kbps MP3 audio up to 1 hour (400 MB)."
  },
  {
    id: "tiktok",
    tag: "CH.02",
    name: "TikTok",
    scope: "WATERMARK-FREE ENGINE",
    colorClass: "card-tiktok",
    logo: <TikTokLogo size={32} />,
    formats: ["NO WATERMARK", "SLIDES (25)", "BGM MP3", "70 MENIT"],
    description: "Extract clean, watermark-free videos up to 70 minutes, multi-photo carousels up to 25 slides, and viral BGM audio."
  },
  {
    id: "instagram",
    tag: "CH.03",
    name: "Instagram",
    scope: "FEED, REELS, STORIES",
    colorClass: "card-instagram",
    logo: <InstagramLogo size={32} />,
    formats: ["REELS MP4", "POSTS", "STORIES", "CAROUSEL (15)"],
    description: "Query high-bitrate Reels up to 30 minutes, multi-post image albums up to 15 items, and active public Stories."
  },
  {
    id: "x",
    tag: "CH.04",
    name: "X (Twitter)",
    scope: "MEDIA & ORIG PHOTO",
    colorClass: "card-x",
    logo: <XLogo size={32} />,
    formats: ["MP4 VIDEO", "ORIGINAL JPG", "LOOPING GIF", "AUDIO"],
    description: "Download embedded video clips up to 30 minutes, looping GIFs, and full uncompressed master photos up to 10 media per tweet."
  },
  {
    id: "pinterest",
    tag: "CH.05",
    name: "Pinterest",
    scope: "HD PHOTO & PIN VIDEO",
    colorClass: "card-pinterest",
    logo: <PinterestLogo size={32} />,
    formats: ["ORIGINAL HD", "PIN VIDEO", "UNCOMPRESSED", "MAX 400MB"],
    description: "Download original uncompressed master photos and high-resolution pin videos directly without quality degradation."
  }
];

function PlatformCard({ platform }) {
  return (
    <article className={`platform-card ${platform.colorClass}`}>
      <span className="deck-corner deck-corner-tl" aria-hidden="true">+</span>
      <span className="deck-corner deck-corner-tr" aria-hidden="true">+</span>

      <div className="platform-card-header">
        <div className="platform-card-logo-wrap">
          {platform.logo}
        </div>
        <div className="platform-card-tag-wrap mono">
          <span className="platform-card-tag">[{platform.tag}]</span>
          <ArrowUpRight size={14} className="platform-card-arrow" aria-hidden="true" />
        </div>
      </div>

      <div className="platform-card-body">
        <div className="platform-card-meta mono">
          <span className="platform-card-scope">{platform.scope}</span>
        </div>
        <h3 className="platform-card-title">{platform.name}</h3>
        <p className="platform-card-text">{platform.description}</p>

        <div className="platform-format-pills mono" aria-label="Format yang didukung">
          {platform.formats.map((fmt) => (
            <span key={fmt} className="platform-format-pill">
              {fmt}
            </span>
          ))}
        </div>
      </div>
    </article>
  );
}

function PlatformSupport() {
  return (
    <section className="section platform-section" aria-label="Platform yang didukung">
      <div className="section-inner platform-inner">
        <div className="platform-header-bar mono">
          <div className="platform-header-left">
            <Radio size={14} className="platform-header-icon" aria-hidden="true" />
            <span className="section-tag">[03] CHANNEL MATRIX</span>
          </div>
          <span className="platform-header-status">ALL PROTOCOLS ACTIVE (5/5)</span>
        </div>

        <div className="platform-grid">
          {platforms.map((platform) => (
            <PlatformCard key={platform.id} platform={platform} />
          ))}
        </div>
      </div>
    </section>
  );
}

export default PlatformSupport;
