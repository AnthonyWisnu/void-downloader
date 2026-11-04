import {
  YouTubeLogo,
  TikTokLogo,
  InstagramLogo,
  XLogo,
  PinterestLogo,
  FacebookLogo,
  SoundCloudLogo,
  RedditLogo,
  DailymotionLogo,
  VimeoLogo
} from "./BrandLogos";
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
    formats: ["MP4 VIDEO", "ORIGINAL JPG", "LOOPING GIF", "AUDIO MP3"],
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
  },
  {
    id: "facebook",
    tag: "CH.06",
    name: "Facebook",
    scope: "REELS, WATCH & FEED",
    colorClass: "card-facebook",
    logo: <FacebookLogo size={32} />,
    formats: ["REELS MP4", "WATCH VIDEO", "CONVERT MP3", "HD/SD"],
    description: "Extract public Facebook Reels and Watch videos with automatic Video to MP3 extraction option."
  },
  {
    id: "soundcloud",
    tag: "CH.07",
    name: "SoundCloud",
    scope: "LOSSLESS / HQ AUDIO",
    colorClass: "card-soundcloud",
    logo: <SoundCloudLogo size={32} />,
    formats: ["HQ MP3", "ALBUM ART", "PODCASTS", "DJ SETS (2H)"],
    description: "Download crystal-clear high quality MP3 audio tracks, podcasts, and DJ sets up to 2 hours with embedded album art."
  },
  {
    id: "reddit",
    tag: "CH.08",
    name: "Reddit",
    scope: "COMMUNITY VIDEO CLIP",
    colorClass: "card-reddit",
    logo: <RedditLogo size={32} />,
    formats: ["SYNC AUDIO+MP4", "CONVERT MP3", "NO VPN", "DIRECT LINK"],
    description: "Automatically merge separated Reddit video and audio tracks into a seamless MP4 without needing a VPN in Indonesia."
  },
  {
    id: "dailymotion",
    tag: "CH.09",
    name: "Dailymotion",
    scope: "HD STREAM PIPELINE",
    colorClass: "card-dailymotion",
    logo: <DailymotionLogo size={32} />,
    formats: ["MP4 VIDEO", "720P/1080P", "EXTRACT MP3", "FAST STREAM"],
    description: "Fast direct stream extraction for public Dailymotion videos and full audio MP3 extraction."
  },
  {
    id: "vimeo",
    tag: "CH.10",
    name: "Vimeo",
    scope: "CINEMATIC MASTER FEED",
    colorClass: "card-vimeo",
    logo: <VimeoLogo size={32} />,
    formats: ["ORIGINAL HD", "HIGH BITRATE", "MP3 AUDIO", "CLEAN MP4"],
    description: "Download high bitrate portfolio videos, indie films, and extract crystal-clear sound tracks directly."
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
          <span className="platform-header-status">ALL PROTOCOLS ACTIVE (10/10)</span>
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
