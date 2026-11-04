import { useState } from "react";
import { Volume2, VolumeX, Archive, Smartphone } from "lucide-react";
import DownloadOptionRow from "./DownloadOptionRow";
import { downloadAllAsZip } from "../utils/mediaBatch";

function DownloadOptions({ adapted }) {
  const [isZipping, setIsZipping] = useState(false);
  const { videoDownloads, audioDownloads, imageDownloads, audioWarning, title } = adapted;

  const handleDownloadAllZip = () => {
    downloadAllAsZip(title, imageDownloads, setIsZipping, adapted);
  };

  return (
    <div className="download-options-container" aria-label="Opsi Unduhan">
      <div className="download-options-title-bar mono">
        <span className="download-options-main-title">DOWNLOAD OPTIONS_</span>
        <span className="download-options-count">
          {imageDownloads.length > 1
            ? `${imageDownloads.length} SLIDES DETECTED`
            : `TOTAL STREAMS: ${adapted.downloads.length}`}
        </span>
      </div>

      {videoDownloads.length > 0 ? (
        <div className="download-group">
          <div className="download-group-header mono">
            <span className="download-group-tag">[VIDEO STREAM]</span>
            <span className="download-group-desc">MP4 / DIRECT CONTAINER</span>
          </div>
          <div className="download-group-list">
            {videoDownloads.map((item) => (
              <DownloadOptionRow key={item.id} item={item} />
            ))}
          </div>
        </div>
      ) : null}

      {audioDownloads.length > 0 ? (
        <div className="download-group">
          <div className="download-group-header mono">
            <span className="download-group-tag">[AUDIO STREAM]</span>
            <span className="download-group-desc">MP3 / EXTRACTED AUDIO</span>
          </div>
          <div className="download-group-list">
            {audioDownloads.map((item) => (
              <div key={item.id} className="audio-row-wrapper">
                <DownloadOptionRow item={item} />
                {item.streamUrl ? (
                  <div className="audio-inline-player">
                    <div className="audio-player-label mono">
                      <Volume2 size={14} strokeWidth={2.5} aria-hidden="true" />
                      <span>AUDIO PREVIEW</span>
                    </div>
                    <audio
                      className="audio-player-element"
                      src={item.streamUrl}
                      controls
                      preload="none"
                    />
                  </div>
                ) : null}
              </div>
            ))}
          </div>
        </div>
      ) : null}

      {audioWarning ? (
        <div className="download-audio-warning mono" role="note">
          <VolumeX size={16} strokeWidth={2.5} aria-hidden="true" />
          <span>{audioWarning}</span>
        </div>
      ) : null}

      {imageDownloads.length > 0 ? (
        <div className="download-group">
          <div className="download-group-header mono">
            <span className="download-group-tag">[IMAGE & SLIDE ASSETS]</span>
            <span className="download-group-desc">
              {imageDownloads.length} {imageDownloads.length > 1 ? "SLIDES" : "PHOTO"} / ORIGINAL QUALITY
            </span>
          </div>

          {imageDownloads.length > 1 ? (
            <>
              <div className="download-zip-banner">
                <button
                  type="button"
                  className="btn btn-block mono download-all-zip-btn"
                  onClick={handleDownloadAllZip}
                  disabled={isZipping}
                >
                  <Archive size={16} strokeWidth={2.5} aria-hidden="true" />
                  <span>
                    {isZipping ? "PACKAGING ALL SLIDES (ZIP)..." : `DOWNLOAD ALL (${imageDownloads.length} SLIDES ZIP)`}
                  </span>
                </button>
              </div>
              <div className="slideshow-ux-hint mono">
                <span>
                  * Preview &amp; unduh slide individual aktif pada viewer sebelah kiri. Pilih slide yang diinginkan dan klik Download Slide.
                </span>
              </div>
            </>
          ) : (
            <div className="download-group-list">
              {imageDownloads.map((item, index) => (
                <DownloadOptionRow
                  key={item.id}
                  item={{
                    ...item,
                    label: item.label || `Photo ${index + 1}`
                  }}
                />
              ))}
            </div>
          )}
        </div>
      ) : null}

      <div className="ios-download-hint mono" role="note">
        <Smartphone size={13} strokeWidth={2.5} aria-hidden="true" />
        <span>
          IOS / IPHONE TIP: To save downloaded video directly into your Photos app, open the file in the Files app, tap Share, and select &quot;Save Video&quot;.
        </span>
      </div>
    </div>
  );
}

export default DownloadOptions;
