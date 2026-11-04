export function YouTubeLogo({ size = 24, className = "" }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      className={className}
      aria-label="YouTube"
    >
      <path
        d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814z"
        fill="#FF0000"
      />
      <path d="M9.545 15.568V8.432L15.818 12l-6.273 3.568z" fill="#FFFFFF" />
    </svg>
  );
}

export function TikTokLogo({ size = 24, className = "" }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      className={className}
      aria-label="TikTok"
    >
      {/* Cyan glitch shadow */}
      <path
        d="M16.6 5.82s.51.5 1.5 1.05c1 .55 2.15.83 3.4.88V11.2a7.66 7.66 0 0 1-4.9-1.8v6.7a6.1 6.1 0 1 1-6.1-6.1c.35 0 .7.03 1.04.09v3.47a2.72 2.72 0 1 0 1.66 2.54V2.5h3.4a5.3 5.3 0 0 0 0 3.32z"
        fill="#00F2FE"
        transform="translate(-0.8, -0.6)"
        opacity="0.85"
      />
      {/* Red glitch shadow */}
      <path
        d="M16.6 5.82s.51.5 1.5 1.05c1 .55 2.15.83 3.4.88V11.2a7.66 7.66 0 0 1-4.9-1.8v6.7a6.1 6.1 0 1 1-6.1-6.1c.35 0 .7.03 1.04.09v3.47a2.72 2.72 0 1 0 1.66 2.54V2.5h3.4a5.3 5.3 0 0 0 0 3.32z"
        fill="#FE2C55"
        transform="translate(0.8, 0.6)"
        opacity="0.85"
      />
      {/* Crisp White core */}
      <path
        d="M16.6 5.82s.51.5 1.5 1.05c1 .55 2.15.83 3.4.88V11.2a7.66 7.66 0 0 1-4.9-1.8v6.7a6.1 6.1 0 1 1-6.1-6.1c.35 0 .7.03 1.04.09v3.47a2.72 2.72 0 1 0 1.66 2.54V2.5h3.4a5.3 5.3 0 0 0 0 3.32z"
        fill="#FFFFFF"
      />
    </svg>
  );
}

export function InstagramLogo({ size = 24, className = "" }) {
  const gradientId = `ig-grad-${size}`;
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      className={className}
      aria-label="Instagram"
    >
      <defs>
        <radialGradient id={`${gradientId}-rg`} cx="30%" cy="107%" r="150%">
          <stop offset="0%" stopColor="#fdf497" />
          <stop offset="5%" stopColor="#fdf497" />
          <stop offset="45%" stopColor="#fd5949" />
          <stop offset="60%" stopColor="#d6249f" />
          <stop offset="90%" stopColor="#285AEB" />
        </radialGradient>
      </defs>
      <rect
        x="2"
        y="2"
        width="20"
        height="20"
        rx="5"
        fill={`url(#${gradientId}-rg)`}
      />
      <rect
        x="6"
        y="6"
        width="12"
        height="12"
        rx="3.5"
        stroke="#FFFFFF"
        strokeWidth="1.8"
        fill="none"
      />
      <circle cx="12" cy="12" r="3" stroke="#FFFFFF" strokeWidth="1.8" fill="none" />
      <circle cx="16.5" cy="7.5" r="0.9" fill="#FFFFFF" />
    </svg>
  );
}

export function XLogo({ size = 24, className = "" }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      className={className}
      aria-label="X (Twitter)"
    >
      <rect width="24" height="24" rx="4" fill="#0F1419" />
      <path
        d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"
        fill="#FFFFFF"
      />
    </svg>
  );
}

export function PinterestLogo({ size = 24, className = "" }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      className={className}
      aria-label="Pinterest"
    >
      <rect width="24" height="24" rx="5" fill="#E60023" />
      <path
        d="M12 2C6.477 2 2 6.477 2 12c0 4.237 2.636 7.855 6.356 9.312-.088-.791-.167-2.004.035-2.868.182-.781 1.173-4.971 1.173-4.971s-.299-.599-.299-1.485c0-1.39.806-2.428 1.809-2.428.853 0 1.265.641 1.265 1.408 0 .858-.546 2.14-.828 3.329-.236.995.499 1.808 1.481 1.808 1.778 0 3.143-1.874 3.143-4.579 0-2.394-1.72-4.068-4.177-4.068-2.845 0-4.515 2.134-4.515 4.339 0 .859.331 1.782.744 2.282a.3.3 0 0 1 .069.288l-.278 1.133c-.044.183-.145.223-.335.134-1.249-.582-2.03-2.408-2.03-3.874 0-3.154 2.292-6.052 6.608-6.052 3.469 0 6.165 2.473 6.165 5.776 0 3.447-2.173 6.22-5.189 6.22-1.013 0-1.966-.526-2.292-1.148l-.623 2.378c-.226.869-.835 1.958-1.243 2.622C9.642 21.843 10.8 22 12 22c5.523 0 10-4.477 10-10 0-5.523-4.477-10-10-10z"
        fill="#FFFFFF"
      />
    </svg>
  );
}

export function FacebookLogo({ size = 24, className = "" }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      className={className}
      aria-label="Facebook"
    >
      <rect width="24" height="24" rx="5" fill="#1877F2" />
      <path
        d="M15.12 12.67l.48-3.14h-3.01v-2.04c0-.86.42-1.7 1.78-1.7h1.38V3.12s-1.25-.21-2.44-.21c-2.49 0-4.12 1.51-4.12 4.24v2.38H6.42v3.14h2.77V20.5a10.02 10.02 0 0 0 3.4 0v-7.83h2.53z"
        fill="#FFFFFF"
      />
    </svg>
  );
}

export function SoundCloudLogo({ size = 24, className = "" }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      className={className}
      aria-label="SoundCloud"
    >
      <rect width="24" height="24" rx="5" fill="#FF5500" />
      <path
        d="M1.5 13.5c0-.28.22-.5.5-.5s.5.22.5.5v3c0 .28-.22.5-.5.5s-.5-.22-.5-.5v-3zm2-2c0-.28.22-.5.5-.5s.5.22.5.5v5c0 .28-.22.5-.5.5s-.5-.22-.5-.5v-5zm2-1c0-.28.22-.5.5-.5s.5.22.5.5v6c0 .28-.22.5-.5.5s-.5-.22-.5-.5v-6zm2-1c0-.28.22-.5.5-.5s.5.22.5.5v7c0 .28-.22.5-.5.5s-.5-.22-.5-.5v-7zm2-1c0-.28.22-.5.5-.5s.5.22.5.5v8c0 .28-.22.5-.5.5s-.5-.22-.5-.5v-8zm2-.5c0-.28.22-.5.5-.5s.5.22.5.5v8.5c0 .28-.22.5-.5.5s-.5-.22-.5-.5V8zm2.2.3c.4-.7 1.1-1.3 2-1.3 1.2 0 2.2 1 2.2 2.2 0 .1 0 .3-.1.4 1.1.2 2 1.2 2 2.4 0 1.3-1.1 2.4-2.4 2.4H13.7V8.3z"
        fill="#FFFFFF"
      />
    </svg>
  );
}

export function RedditLogo({ size = 24, className = "" }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      className={className}
      aria-label="Reddit"
    >
      <rect width="24" height="24" rx="5" fill="#FF4500" />
      <path
        d="M12 4.5a.9.9 0 0 1 .86.64l.65 2.18c1.3.1 2.5.45 3.5 1 .4-.3.9-.5 1.5-.5 1.1 0 2 .9 2 2 0 .8-.5 1.5-1.2 1.8.03.25.05.5.05.78 0 2.8-3.3 5.1-7.3 5.1s-7.3-2.3-7.3-5.1c0-.28.02-.53.05-.78-.7-.3-1.2-1-1.2-1.8 0-1.1.9-2 2-2 .6 0 1.1.2 1.5.5 1-.55 2.2-.9 3.5-1l.73-2.45a.9.9 0 0 1 .86-.67zm2.5 7.5a1.2 1.2 0 1 0 0 2.4 1.2 1.2 0 0 0 0-2.4zm-5 0a1.2 1.2 0 1 0 0 2.4 1.2 1.2 0 0 0 0-2.4zm2.5 4.7c-1.4 0-2.5-.5-2.7-.6a.5.5 0 0 1 .6-.8c.1 0 1 .4 2.1.4s2-.4 2.1-.4a.5.5 0 0 1 .6.8c-.2.1-1.3.6-2.7.6z"
        fill="#FFFFFF"
      />
    </svg>
  );
}

export function DailymotionLogo({ size = 24, className = "" }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      className={className}
      aria-label="Dailymotion"
    >
      <rect width="24" height="24" rx="5" fill="#0066DC" />
      <path
        d="M14.5 4.5v5.3c-.8-.9-1.9-1.4-3.1-1.4-2.8 0-4.9 2.2-4.9 5.3s2.1 5.3 4.9 5.3c1.2 0 2.3-.5 3.1-1.4v1.2h3.2V4.5h-3.2zm-2.7 11.5c-1.4 0-2.4-1.1-2.4-2.4s1-2.4 2.4-2.4 2.4 1.1 2.4 2.4-1 2.4-2.4 2.4z"
        fill="#FFFFFF"
      />
    </svg>
  );
}

export function VimeoLogo({ size = 24, className = "" }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      className={className}
      aria-label="Vimeo"
    >
      <rect width="24" height="24" rx="5" fill="#1AB7EA" />
      <path
        d="M19.8 8.1c-.1 2-1.5 4.7-4.2 8.1-2.8 3.5-5.1 5.3-7 5.3-1.2 0-2.1-1.1-2.9-3.2-.5-2-1.1-3.9-1.6-5.8-.6-2.1-1.2-3.1-1.8-3.1-.1 0-.6.3-1.4.9L0 9.2c1.1-1 2.2-2 3.3-3 1.5-1.4 2.6-2.1 3.4-2.1 1.8 0 2.9 1.2 3.3 3.6.4 2.6.7 4.2.9 4.8.6 2 1.3 3 2.1 3 .6 0 1.4-.7 2.3-2.1.9-1.4 1.4-2.5 1.5-3.2.2-1.2-.3-1.8-1.7-1.8-.6 0-1.3.1-2 .4 1.3-4.2 3.8-6.2 7.4-6.2 2.6.2 3.8 1.9 3.2 5.5z"
        fill="#FFFFFF"
      />
    </svg>
  );
}

export function PlatformLogo({ platform, size = 24, className = "" }) {
  const p = String(platform || "").toLowerCase();
  if (p === "youtube") return <YouTubeLogo size={size} className={className} />;
  if (p === "tiktok") return <TikTokLogo size={size} className={className} />;
  if (p === "instagram") return <InstagramLogo size={size} className={className} />;
  if (p === "x" || p === "twitter") return <XLogo size={size} className={className} />;
  if (p === "pinterest") return <PinterestLogo size={size} className={className} />;
  if (p === "facebook") return <FacebookLogo size={size} className={className} />;
  if (p === "soundcloud") return <SoundCloudLogo size={size} className={className} />;
  if (p === "reddit") return <RedditLogo size={size} className={className} />;
  if (p === "dailymotion") return <DailymotionLogo size={size} className={className} />;
  if (p === "vimeo") return <VimeoLogo size={size} className={className} />;
  return null;
}
