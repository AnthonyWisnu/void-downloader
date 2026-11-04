import { ArrowUpRight, Clipboard, CheckCircle2, ShieldCheck, Music, Video, Image as ImageIcon } from "lucide-react";
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
import { platformLabel } from "../utils/detectPlatform";

const PLATFORMS = [
  { id: "youtube", label: "YouTube", renderLogo: (size) => <YouTubeLogo size={size} /> },
  { id: "tiktok", label: "TikTok", renderLogo: (size) => <TikTokLogo size={size} /> },
  { id: "instagram", label: "Instagram", renderLogo: (size) => <InstagramLogo size={size} /> },
  { id: "x", label: "X (Twitter)", renderLogo: (size) => <XLogo size={size} /> },
  { id: "pinterest", label: "Pinterest", renderLogo: (size) => <PinterestLogo size={size} /> },
  { id: "facebook", label: "Facebook", renderLogo: (size) => <FacebookLogo size={size} /> },
  { id: "soundcloud", label: "SoundCloud", renderLogo: (size) => <SoundCloudLogo size={size} /> },
  { id: "reddit", label: "Reddit", renderLogo: (size) => <RedditLogo size={size} /> },
  { id: "dailymotion", label: "Dailymotion", renderLogo: (size) => <DailymotionLogo size={size} /> },
  { id: "vimeo", label: "Vimeo", renderLogo: (size) => <VimeoLogo size={size} /> }
];

function UrlInput({
  value,
  error,
  isLoading,
  detectedPlatform,
  canSubmit,
  onChange,
  onSubmit
}) {
  const hasError = Boolean(error);
  const detected = detectedPlatform && detectedPlatform !== "unknown";

  async function handlePaste() {
    try {
      if (navigator?.clipboard?.readText) {
        const text = await navigator.clipboard.readText();
        if (text) {
          onChange(text.trim());
        }
      }
    } catch {
      // Clipboard permission denied
    }
  }

  function handleKeyDown(event) {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      if (canSubmit && !isLoading) {
        onSubmit(event);
      }
    }
  }

  return (
    <form className="url-form" onSubmit={onSubmit} noValidate>
      <div className="url-form-header mono">
        <div className="url-header-left">
          <span className="url-input-status-dot" />
          <label htmlFor="url-input" className="url-input-label">
            STREAM INPUT / COMMAND DECK_
          </label>
        </div>
        {navigator?.clipboard?.readText ? (
          <button
            type="button"
            className="url-paste-btn"
            onClick={handlePaste}
            disabled={isLoading}
            title="Paste dari clipboard"
            aria-label="Paste dari clipboard"
          >
            <Clipboard size={13} strokeWidth={2.5} aria-hidden="true" />
            <span>PASTE LINK</span>
            <kbd className="url-paste-kbd">[Ctrl+V]</kbd>
          </button>
        ) : null}
      </div>

      <div className={`url-input-wrapper ${hasError ? "has-error" : ""} ${detected ? `detected-${detectedPlatform}` : ""}`}>
        <input
          id="url-input"
          className="url-field mono"
          type="url"
          value={value}
          placeholder="ENTER OR PASTE MEDIA URL (YOUTUBE, TIKTOK, IG, FB, SOUNDCLOUD, REDDIT, X, ETC)..."
          autoComplete="off"
          spellCheck="false"
          aria-invalid={hasError}
          disabled={isLoading}
          onChange={(event) => onChange(event.target.value)}
          onKeyDown={handleKeyDown}
        />

        <button
          className="url-submit-btn mono"
          type="submit"
          disabled={!canSubmit || isLoading}
          aria-label="Ekstrak media stream"
        >
          {isLoading ? (
            <span className="url-btn-text">EXTRACTING...</span>
          ) : (
            <>
              <span className="url-btn-text">ANALYZE STREAM</span>
              <ArrowUpRight size={16} strokeWidth={2.5} aria-hidden="true" />
            </>
          )}
        </button>
      </div>

      <div className="url-footer mono">
        <div className="url-platforms-row" aria-label="Platform terdeteksi">
          <span className="url-platforms-prefix">RESOLVER:</span>
          <div className="url-platform-chips">
            {PLATFORMS.map((p) => {
              const isCurrent = detected && detectedPlatform === p.id;
              return (
                <div
                  key={p.id}
                  className={`url-platform-chip chip-${p.id} ${isCurrent ? "is-active" : ""}`}
                  title={p.label}
                >
                  <span className="chip-logo">{p.renderLogo(14)}</span>
                  <span className="chip-name">{p.label}</span>
                  {isCurrent ? <CheckCircle2 size={11} className="chip-check" aria-hidden="true" /> : null}
                </div>
              );
            })}
          </div>
        </div>

        <div className="url-state-indicator" aria-live="polite">
          {detected ? (
            <span className="url-detected-label">
              READY: {platformLabel(detectedPlatform)}
            </span>
          ) : (
            <span className="url-idle-label">AWAITING INPUT_</span>
          )}
        </div>
      </div>

      <div className="deck-spec-bar mono" aria-label="Spesifikasi Pipeline">
        <div className="deck-spec-chip spec-video">
          <Video size={12} aria-hidden="true" />
          <span>H.264 UNIVERSAL (FASTSTART)</span>
        </div>
        <div className="deck-spec-chip spec-audio">
          <Music size={12} aria-hidden="true" />
          <span>192K STEREO MP3</span>
        </div>
        <div className="deck-spec-chip spec-photo">
          <ImageIcon size={12} aria-hidden="true" />
          <span>ORIGINAL RESOLUTION</span>
        </div>
        <div className="deck-spec-chip spec-security">
          <ShieldCheck size={12} aria-hidden="true" />
          <span>ZERO-LOG CDN PROXY</span>
        </div>
      </div>
    </form>
  );
}

export default UrlInput;
