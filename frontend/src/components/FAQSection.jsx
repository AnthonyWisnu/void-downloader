import { useState } from "react";
import { Minus, Plus, HelpCircle } from "lucide-react";

const faqs = [
  {
    question: "Which platforms are supported by VOID?",
    answer:
      "VOID natively supports 10 media platforms: YouTube, TikTok, Instagram, X (Twitter), Pinterest, Facebook (Reels & Watch), SoundCloud (HQ Audio & Podcasts), Reddit (Audio+Video synced without VPN), Dailymotion, and Vimeo."
  },
  {
    question: "Can I convert video to MP3 audio directly in VOID?",
    answer:
      "Yes! VOID features a built-in Video to MP3 converter. For supported video streams (YouTube, Facebook, Reddit, TikTok, Dailymotion, Vimeo, Twitter), the system extracts the audio track into a 192 kbps MP3 file complete with an inline audio preview player."
  },
  {
    question: "What are the media size and duration limits in VOID?",
    answer:
      "All platforms support file downloads up to 400 MB. Duration limits: YouTube up to 1 Hour, TikTok up to 70 Minutes & 25 photo slides, Instagram up to 30 Minutes & 15 carousel items, X (Twitter) up to 30 Minutes, Facebook up to 1 Hour, SoundCloud up to 2 Hours, Reddit up to 30 Minutes, Dailymotion up to 1 Hour, and Vimeo up to 1 Hour."
  },
  {
    question: "Are downloaded videos compatible with iPhone, Android, and Desktop?",
    answer:
      "Yes. All videos are normalized to H.264 FastStart MP4 with universal AAC audio, making them fully playable across iOS Safari, Android Chrome, and all desktop systems. On iPhone, Safari saves downloads to the Files app; tap Share and select 'Save Video' to add the file directly into your Photos gallery."
  },
  {
    question: "Does VOID require accounts, authentication, or extensions?",
    answer:
      "No. VOID is completely clientless and requires no user account, registration, payment, or browser extension."
  },
  {
    question: "Why do videos offer audio extraction separately?",
    answer:
      "Alongside video containers, the extractor provides a direct MP3 audio stream, allowing you to quickly save songs, background music, or dialogue tracks independently."
  },
  {
    question: "Why might extraction fail on certain links?",
    answer:
      "Private accounts, geo-blocked media, copyright-locked audio, or expired ephemeral posts (such as 24-hour stories that expired) cannot be accessed by public scrapers."
  },
  {
    question: "Are submitted URLs logged or permanently archived?",
    answer:
      "No. Incoming URLs are sanitized in memory, dispatched to the extraction pipeline, and discarded. Temporary cached files are automatically pruned by background cache cleanup."
  }
];

function FaqItem({ faq, index, isOpen, onToggle }) {
  return (
    <div className={`faq-item ${isOpen ? "is-open" : ""}`}>
      <button
        className="faq-question mono"
        type="button"
        aria-expanded={isOpen}
        onClick={onToggle}
      >
        <div className="faq-question-text-wrap">
          <span className="faq-index">[{String(index + 1).padStart(2, "0")}]</span>
          <span className="faq-title">{faq.question}</span>
        </div>
        {isOpen ? (
          <Minus size={16} strokeWidth={2.5} className="faq-toggle-icon" aria-hidden="true" />
        ) : (
          <Plus size={16} strokeWidth={2.5} className="faq-toggle-icon" aria-hidden="true" />
        )}
      </button>

      {isOpen ? <p className="faq-answer">{faq.answer}</p> : null}
    </div>
  );
}

function FAQSection() {
  const [openIndex, setOpenIndex] = useState(0);

  function toggle(index) {
    setOpenIndex((current) => (current === index ? -1 : index));
  }

  return (
    <section className="section faq-section" aria-label="Frequently Asked Questions">
      <div className="section-inner faq-inner">
        <div className="faq-header-bar mono">
          <div className="faq-header-left">
            <HelpCircle size={14} className="faq-header-icon" aria-hidden="true" />
            <span className="section-tag">[06] FREQUENT INQUIRIES</span>
          </div>
          <span className="faq-header-status">TECHNICAL REFERENCE &amp; SPECS</span>
        </div>

        <div className="faq-list">
          {faqs.map((faq, index) => (
            <FaqItem
              key={faq.question}
              faq={faq}
              index={index}
              isOpen={openIndex === index}
              onToggle={() => toggle(index)}
            />
          ))}
        </div>
      </div>
    </section>
  );
}

export default FAQSection;
