import { Workflow, Copy, Search, DownloadCloud, ArrowRight } from "lucide-react";

const steps = [
  {
    number: "01",
    label: "INGEST",
    title: "ACQUIRE SOURCE LINK / VIDEO",
    icon: Copy,
    colorClass: "step-cyan",
    text: "Copy any public media link from YouTube, TikTok, Instagram, Facebook, X, Pinterest, SoundCloud, Reddit, Dailymotion, Vimeo, or upload a local video."
  },
  {
    number: "02",
    label: "RESOLVE",
    title: "EXECUTE STREAM ANALYSIS",
    icon: Search,
    colorClass: "step-purple",
    text: "Paste the URL or select your video file. The multi-platform resolver validates the payload and extracts live audio-video streams."
  },
  {
    number: "03",
    label: "DELIVER",
    title: "PREVIEW & INSTANT PULL",
    icon: DownloadCloud,
    colorClass: "step-green",
    text: "Inspect the integrated in-line stream preview, select your desired resolution or lossless MP3, and download directly."
  }
];

function HowToStep({ step, isLast }) {
  const Icon = step.icon;

  return (
    <article className={`howto-step ${step.colorClass}`}>
      <span className="deck-corner deck-corner-tl" aria-hidden="true">+</span>
      <span className="deck-corner deck-corner-tr" aria-hidden="true">+</span>

      <div className="howto-step-header mono">
        <span className="howto-number">[{step.number}]</span>
        <span className="howto-step-badge">{step.label}</span>
      </div>

      <div className="howto-step-icon-wrap" aria-hidden="true">
        <Icon size={20} strokeWidth={2.2} />
      </div>

      <div className="howto-step-body">
        <h3 className="howto-step-title mono">{step.title}</h3>
        <p className="howto-step-text">{step.text}</p>
      </div>

      {!isLast ? (
        <div className="howto-connector-arrow" aria-hidden="true">
          <ArrowRight size={16} />
        </div>
      ) : null}
    </article>
  );
}

function HowToSection() {
  return (
    <section id="how-to" className="section howto-section" aria-label="Workflow VOID">
      <div className="section-inner howto-inner">
        <div className="howto-header-bar mono">
          <div className="howto-header-left">
            <Workflow size={14} className="howto-header-icon" aria-hidden="true" />
            <span className="section-tag">[05] EXECUTION PROTOCOL</span>
          </div>
          <span className="howto-header-status">3-PHASE EXTRACTION SEQUENCE</span>
        </div>

        <div className="howto-grid">
          {steps.map((step, idx) => (
            <HowToStep
              key={step.number}
              step={step}
              isLast={idx === steps.length - 1}
            />
          ))}
        </div>
      </div>
    </section>
  );
}

export default HowToSection;
