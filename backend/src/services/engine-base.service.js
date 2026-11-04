const fs = require("fs");
const path = require("path");
const { runYtDlp, parseYtDlpJson } = require("../utils/execTool");
const { MAX_FILE_SIZE_MB } = require("../config/limits");
const {
  DOWNLOAD_CACHE_DIR,
  ensureCacheDir,
  getCacheToken,
  getCacheFilePath,
  hasUsableFile,
  assertFileWithinSizeLimit,
  cleanupFiles
} = require("./media-cache.service");

const BROWSER_USER_AGENT =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36";

const OUTPUT_EXTENSIONS = ["mp4", "mkv", "webm"];

function getRawProcessError(error) {
  return [error?.stderr, error?.stdout, error?.message, error?.rawStderr]
    .filter(Boolean)
    .join("\n")
    .trim();
}

function logProcessStderr(prefix, error) {
  const raw = String(error?.stderr || error?.rawStderr || "").trim();
  if (!raw) return;
  const firstLine = raw.split(/\r?\n/).find(Boolean) || raw;
  console.warn(`[${prefix}] yt-dlp stderr: ${firstLine.slice(0, 240)}`);
}

function getCookieArgsFromValidator(validatorFn) {
  if (typeof validatorFn !== "function") {
    return [];
  }
  const cookies = validatorFn();
  return cookies && cookies.ok ? ["--cookies", cookies.path] : [];
}

async function fetchGenericMetadata({ url, cookieValidatorFn, extraArgs = [] }) {
  const cookieArgs = getCookieArgsFromValidator(cookieValidatorFn);
  const args = [
    ...cookieArgs,
    "--user-agent",
    BROWSER_USER_AGENT,
    "--dump-json",
    "--no-warnings",
    "--no-playlist",
    ...extraArgs,
    "--",
    url
  ];

  const output = await runYtDlp(args, { heavy: false });
  return parseYtDlpJson(output);
}

async function runGenericYtDlpDownload({
  url,
  sourcePath,
  format,
  cookieValidatorFn,
  mergeOutputFormat = "mp4",
  extraArgs = []
}) {
  const outputBase = sourcePath.replace(/\.[^.]+$/, "");
  const outputTemplate = `${outputBase}.%(ext)s`;
  const candidatePaths = OUTPUT_EXTENSIONS.map((ext) => `${outputBase}.${ext}`);

  cleanupFiles(candidatePaths);

  const cookieArgs = getCookieArgsFromValidator(cookieValidatorFn);
  const args = [
    ...cookieArgs,
    "--user-agent",
    BROWSER_USER_AGENT,
    "--no-warnings",
    "--no-playlist",
    "--max-filesize",
    `${MAX_FILE_SIZE_MB}M`,
    "--format",
    format,
    "--merge-output-format",
    mergeOutputFormat,
    "--output",
    outputTemplate,
    ...extraArgs,
    "--",
    url
  ];

  await runYtDlp(args, { heavy: true });

  const foundPath = candidatePaths.find((candidate) => hasUsableFile(candidate));
  if (foundPath) {
    assertFileWithinSizeLimit(foundPath);
  }

  return foundPath;
}

async function createGenericSourceVideo({
  url,
  sourcePath,
  primaryFormat,
  fallbackFormat,
  cookieValidatorFn,
  platformLabel = "media"
}) {
  let mergedPath;

  try {
    mergedPath = await runGenericYtDlpDownload({
      url,
      sourcePath,
      format: primaryFormat,
      cookieValidatorFn
    });
  } catch (error) {
    mergedPath = await runGenericYtDlpDownload({
      url,
      sourcePath,
      format: fallbackFormat,
      cookieValidatorFn
    });
  }

  if (!mergedPath) {
    throw new Error(`File unduhan video ${platformLabel} kosong atau melebihi batas`);
  }

  if (mergedPath !== sourcePath) {
    fs.renameSync(mergedPath, sourcePath);
  }

  return sourcePath;
}

async function downloadGenericAudio({
  url,
  cachePrefix,
  cookieValidatorFn,
  platformLabel = "audio"
}) {
  ensureCacheDir();

  const token = getCacheToken(`${cachePrefix}:${url}`);
  const outputPath = getCacheFilePath(token, "mp3");

  if (hasUsableFile(outputPath)) {
    return { token, path: outputPath };
  }

  const outputBase = path.join(DOWNLOAD_CACHE_DIR, token);
  const cookieArgs = getCookieArgsFromValidator(cookieValidatorFn);
  const args = [
    ...cookieArgs,
    "--user-agent",
    BROWSER_USER_AGENT,
    "--no-warnings",
    "--no-playlist",
    "--max-filesize",
    `${MAX_FILE_SIZE_MB}M`,
    "--extract-audio",
    "--audio-format",
    "mp3",
    "--audio-quality",
    "0",
    "--output",
    `${outputBase}.%(ext)s`,
    "--",
    url
  ];

  await runYtDlp(args, { heavy: true });

  if (!hasUsableFile(outputPath)) {
    throw new Error(`File audio ${platformLabel} kosong atau melebihi batas`);
  }

  assertFileWithinSizeLimit(outputPath);

  return { token, path: outputPath };
}

module.exports = {
  BROWSER_USER_AGENT,
  OUTPUT_EXTENSIONS,
  getRawProcessError,
  logProcessStderr,
  getCookieArgsFromValidator,
  fetchGenericMetadata,
  runGenericYtDlpDownload,
  createGenericSourceVideo,
  downloadGenericAudio
};
