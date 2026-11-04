import { useState, useRef } from "react";
import axios from "axios";
import { UploadCloud, Music, FileVideo, CheckCircle2, Download, RotateCcw, AlertTriangle, Volume2 } from "lucide-react";

function formatBytes(bytes) {
  if (!bytes || bytes <= 0) return "0 Bytes";
  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
}

function VideoToMp3Converter() {
  const [file, setFile] = useState(null);
  const [bitrate, setBitrate] = useState("192");
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [statusMessage, setStatusMessage] = useState("");
  const [error, setError] = useState(null);
  const [result, setResult] = useState(null);
  const fileInputRef = useRef(null);

  function handleFileSelect(selectedFile) {
    if (!selectedFile) return;

    setError(null);
    setResult(null);

    // Maksimal 400 MB
    const maxBytes = 400 * 1024 * 1024;
    if (selectedFile.size > maxBytes) {
      setError("Ukuran video melebihi batas maksimal 400 MB");
      return;
    }

    setFile(selectedFile);
  }

  function handleDragOver(e) {
    e.preventDefault();
    setIsDragging(true);
  }

  function handleDragLeave() {
    setIsDragging(false);
  }

  function handleDrop(e) {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelect(e.dataTransfer.files[0]);
    }
  }

  async function handleConvert(e) {
    e.preventDefault();
    if (!file || isProcessing) return;

    setIsProcessing(true);
    setUploadProgress(0);
    setStatusMessage("UPLOADING VIDEO PAYLOAD (0%)...");
    setError(null);

    const formData = new FormData();
    formData.append("video", file);
    formData.append("bitrate", bitrate);

    try {
      const response = await axios.post("/api/convert-video-mp3", formData, {
        headers: { "Content-Type": "multipart/form-data" },
        onUploadProgress: (progressEvent) => {
          if (progressEvent.total) {
            const percent = Math.round((progressEvent.loaded * 100) / progressEvent.total);
            setUploadProgress(percent);
            if (percent < 100) {
              setStatusMessage(`UPLOADING VIDEO PAYLOAD (${percent}%)...`);
            } else {
              setStatusMessage("FFMPEG AUDIO EXTRACTION IN PROGRESS...");
            }
          }
        }
      });

      setResult(response.data);
    } catch (err) {
      const message =
        err.response?.data?.error ||
        err.message ||
        "Gagal mengonversi video ke MP3. Pastikan video memiliki trek audio.";
      setError(message.replace(/^ERR:\s*/i, ""));
    } finally {
      setIsProcessing(false);
    }
  }

  function handleReset() {
    setFile(null);
    setResult(null);
    setError(null);
    setUploadProgress(0);
    setStatusMessage("");
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }

  return (
    <div className="converter-panel mono" aria-label="Konverter Video ke MP3">
      {result ? (
        /* Result State */
        <div className="converter-result-box">
          <div className="converter-result-header">
            <div className="converter-result-title-row">
              <CheckCircle2 size={18} className="converter-success-icon" aria-hidden="true" />
              <span className="converter-result-title">CONVERSION COMPLETE // MP3 GENERATED</span>
            </div>
            <span className="converter-bitrate-badge">BITRATE: {result.bitrate}</span>
          </div>

          <div className="converter-file-meta">
            <div className="converter-meta-col">
              <span className="converter-meta-label">OUTPUT FILE:</span>
              <span className="converter-meta-value">{result.filename}</span>
            </div>
            <div className="converter-meta-col">
              <span className="converter-meta-label">FILE SIZE:</span>
              <span className="converter-meta-value">{formatBytes(result.size)}</span>
            </div>
          </div>

          {result.previewUrl ? (
            <div className="converter-player-wrapper">
              <div className="converter-player-label">
                <Volume2 size={14} strokeWidth={2.5} aria-hidden="true" />
                <span>AUDIO PREVIEW</span>
              </div>
              <audio
                className="converter-audio-element"
                src={result.previewUrl}
                controls
                preload="none"
              />
            </div>
          ) : null}

          <div className="converter-actions-row">
            <a
              href={result.url}
              className="btn btn-primary converter-download-btn"
              download={result.filename}
            >
              <Download size={16} strokeWidth={2.5} aria-hidden="true" />
              <span>DOWNLOAD MP3</span>
            </a>
            <button
              type="button"
              className="btn btn-secondary converter-reset-btn"
              onClick={handleReset}
            >
              <RotateCcw size={15} strokeWidth={2.2} aria-hidden="true" />
              <span>CONVERT ANOTHER</span>
            </button>
          </div>
        </div>
      ) : (
        /* Input & Upload State */
        <form onSubmit={handleConvert} className="converter-form" noValidate>
          <input
            ref={fileInputRef}
            type="file"
            accept="video/*,.mp4,.mkv,.mov,.webm,.avi,.flv,.wmv,.m4v,.3gp"
            onChange={(e) => handleFileSelect(e.target.files?.[0])}
            style={{ display: "none" }}
            id="converter-file-input"
            disabled={isProcessing}
          />

          {!file ? (
            <div
              className={`converter-dropzone ${isDragging ? "is-dragging" : ""}`}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  fileInputRef.current?.click();
                }
              }}
            >
              <div className="converter-dropzone-icon-wrap" aria-hidden="true">
                <UploadCloud size={32} strokeWidth={2} />
              </div>
              <div className="converter-dropzone-text-block">
                <span className="converter-dropzone-title">DRAG & DROP LOCAL VIDEO OR BROWSE</span>
                <span className="converter-dropzone-sub">
                  MP4 · MKV · MOV · WEBM · AVI · 3GP (MAX 400 MB)
                </span>
              </div>
              <button
                type="button"
                className="btn btn-secondary converter-browse-btn"
                onClick={(e) => {
                  e.stopPropagation();
                  fileInputRef.current?.click();
                }}
              >
                SELECT VIDEO FILE
              </button>
            </div>
          ) : (
            <div className="converter-selected-file-box">
              <div className="converter-selected-info">
                <FileVideo size={24} className="converter-video-icon" aria-hidden="true" />
                <div className="converter-file-details">
                  <span className="converter-file-name">{file.name}</span>
                  <span className="converter-file-size">{formatBytes(file.size)}</span>
                </div>
              </div>
              {!isProcessing ? (
                <button
                  type="button"
                  className="converter-remove-btn"
                  onClick={handleReset}
                  title="Ganti file video"
                >
                  REMOVE / CHANGE
                </button>
              ) : null}
            </div>
          )}

          {file ? (
            <div className="converter-options-row">
              <div className="converter-bitrate-selector">
                <span className="converter-bitrate-label">MP3 BITRATE QUALITY:</span>
                <div className="converter-bitrate-radios">
                  <button
                    type="button"
                    className={`converter-bitrate-pill ${bitrate === "192" ? "is-active" : ""}`}
                    onClick={() => setBitrate("192")}
                    disabled={isProcessing}
                  >
                    192 KBPS (STANDARD HQ)
                  </button>
                  <button
                    type="button"
                    className={`converter-bitrate-pill ${bitrate === "320" ? "is-active" : ""}`}
                    onClick={() => setBitrate("320")}
                    disabled={isProcessing}
                  >
                    320 KBPS (HIGH FIDELITY)
                  </button>
                </div>
              </div>

              {!isProcessing ? (
                <button
                  type="submit"
                  className="btn btn-primary converter-submit-btn"
                  disabled={isProcessing}
                >
                  <Music size={16} strokeWidth={2.5} aria-hidden="true" />
                  <span>EXTRACT & CONVERT TO MP3</span>
                </button>
              ) : null}
            </div>
          ) : null}

          {isProcessing ? (
            <div className="converter-progress-block" role="status" aria-live="polite">
              <div className="converter-progress-header">
                <span className="converter-progress-status">{statusMessage}</span>
                <span className="converter-progress-pct">{uploadProgress}%</span>
              </div>
              <div className="converter-progress-track" aria-hidden="true">
                <div
                  className="converter-progress-bar"
                  style={{ width: `${uploadProgress}%` }}
                />
              </div>
            </div>
          ) : null}

          {error ? (
            <div className="converter-error-banner" role="alert">
              <AlertTriangle size={15} strokeWidth={2.5} aria-hidden="true" />
              <span>{error}</span>
            </div>
          ) : null}
        </form>
      )}
    </div>
  );
}

export default VideoToMp3Converter;
