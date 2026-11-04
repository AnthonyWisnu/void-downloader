import { YouTubeLogo, TikTokLogo, InstagramLogo, XLogo, PinterestLogo } from "./BrandLogos";
import { Sparkles, Terminal, Cpu } from "lucide-react";

function HeroSection() {
  const platformChannels = [
    {
      id: "yt",
      name: "YouTube",
      formatBadge: "720p · SHORTS · MP3",
      colorClass: "channel-yt",
      logo: <YouTubeLogo size={22} />
    },
    {
      id: "tt",
      name: "TikTok",
      formatBadge: "NO-WM · SLIDES · AUDIO",
      colorClass: "channel-tt",
      logo: <TikTokLogo size={22} />
    },
    {
      id: "ig",
      name: "Instagram",
      formatBadge: "REELS · CAROUSEL · STORY",
      colorClass: "channel-ig",
      logo: <InstagramLogo size={22} />
    },
    {
      id: "x",
      name: "X (Twitter)",
      formatBadge: "ORIG PHOTO · GIF · VIDEO",
      colorClass: "channel-x",
      logo: <XLogo size={22} />
    },
    {
      id: "pin",
      name: "Pinterest",
      formatBadge: "ORIG HD · PIN MP4",
      colorClass: "channel-pin",
      logo: <PinterestLogo size={22} />
    }
  ];

  return (
    <section className="hero" aria-label="VOID Downloader Studio Deck">
      <div className="hero-inner section-inner">
        <div className="hero-meta-bar mono">
          <div className="hero-meta-title-wrapper">
            <span className="hero-status-pulse" />
            <span className="hero-meta-title">VOID // MEDIA DECK ENGINE v2.5</span>
          </div>
          <div className="hero-meta-right">
            <span className="hero-meta-chip">
              <Cpu size={12} aria-hidden="true" />
              <span>FFMPEG H.264 FASTSTART · 400MB LIMIT</span>
            </span>
            <span className="hero-meta-index">[SYS.01]</span>
          </div>
        </div>

        <div className="hero-brand-block">
          <div className="hero-badge-live mono">
            <Sparkles size={13} className="hero-sparkle-icon" aria-hidden="true" />
            <span>DIRECT CDN PIPELINE : ZERO LOGS : MAX 400 MB CAPACITY</span>
          </div>
          <h1 className="hero-headline">
            UNIVERSAL MEDIA
            <br />
            <span className="hero-headline-accent">EXTRACTION DECK.</span>
          </h1>
          <p className="hero-subheadline mono">
            High-speed, uncompressed video, audio synthesis, and raw photo scraping from YouTube, TikTok, Instagram, X, and Pinterest without trackers or ads.
          </p>
        </div>

        <div className="hero-divider" aria-hidden="true" />

        <div className="hero-platforms-bar mono" aria-label="Kanal platform yang didukung">
          <div className="hero-channels-header">
            <Terminal size={14} className="hero-terminal-icon" aria-hidden="true" />
            <span className="hero-platforms-label">SUPPORTED PROTOCOLS:</span>
          </div>
          <ul className="hero-channels-list">
            {platformChannels.map((channel) => (
              <li key={channel.id} className={`hero-channel-card ${channel.colorClass}`}>
                <div className="hero-channel-logo">{channel.logo}</div>
                <div className="hero-channel-info">
                  <span className="hero-channel-name">{channel.name}</span>
                  <span className="hero-channel-badge">{channel.formatBadge}</span>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}

export default HeroSection;
