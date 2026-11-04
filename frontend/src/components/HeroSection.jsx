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
    },
    {
      id: "fb",
      name: "Facebook",
      formatBadge: "REELS · WATCH · MP3",
      colorClass: "channel-fb",
      logo: <FacebookLogo size={22} />
    },
    {
      id: "sc",
      name: "SoundCloud",
      formatBadge: "HQ MP3 · PODCASTS",
      colorClass: "channel-sc",
      logo: <SoundCloudLogo size={22} />
    },
    {
      id: "rd",
      name: "Reddit",
      formatBadge: "SYNC MP4 · AUDIO · NO VPN",
      colorClass: "channel-rd",
      logo: <RedditLogo size={22} />
    },
    {
      id: "dm",
      name: "Dailymotion",
      formatBadge: "HD MP4 · MP3 AUDIO",
      colorClass: "channel-dm",
      logo: <DailymotionLogo size={22} />
    },
    {
      id: "vm",
      name: "Vimeo",
      formatBadge: "ORIG HD · MP3 EXTRACT",
      colorClass: "channel-vm",
      logo: <VimeoLogo size={22} />
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
              <span>FFMPEG H.264 & MP3 STREAM CONVERTER · 400MB LIMIT</span>
            </span>
            <span className="hero-meta-index">[SYS.01]</span>
          </div>
        </div>

        <div className="hero-brand-block">
          <div className="hero-badge-live mono">
            <Sparkles size={13} className="hero-sparkle-icon" aria-hidden="true" />
            <span>10 PROTOCOLS : BUILT-IN VIDEO TO MP3 CONVERTER : MAX 400 MB</span>
          </div>
          <h1 className="hero-headline">
            UNIVERSAL MEDIA
            <br />
            <span className="hero-headline-accent">EXTRACTION DECK.</span>
          </h1>
          <p className="hero-subheadline mono">
            High-speed, uncompressed video, instant MP3 audio extraction, and raw photo scraping from 10 major media platforms without trackers or ads.
          </p>
        </div>

        <div className="hero-divider" aria-hidden="true" />

        <div className="hero-platforms-bar mono" aria-label="Kanal platform yang didukung">
          <div className="hero-channels-header">
            <Terminal size={14} className="hero-terminal-icon" aria-hidden="true" />
            <span className="hero-platforms-label">SUPPORTED PROTOCOLS (10 CHANNELS):</span>
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
