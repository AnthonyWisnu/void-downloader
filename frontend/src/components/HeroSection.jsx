import { Sparkles } from "lucide-react";

function HeroSection() {
  return (
    <section className="hero" aria-label="VOID Downloader Studio Deck">
      <div className="hero-inner section-inner">
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
      </div>
    </section>
  );
}

export default HeroSection;
