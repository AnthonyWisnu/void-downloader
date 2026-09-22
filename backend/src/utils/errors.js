const TECHNICAL_PATTERNS = [
  "econnrefused",
  "etimedout",
  "enotfound",
  "enoent",
  "eacces",
  "eperm",
  "typeerror",
  "syntaxerror",
  "referenceerror",
  "evalerror",
  "rangeerror",
  "node_modules",
  "c:\\",
  "/home/",
  "/var/",
  "/usr/",
  "/tmp/",
  "child_process",
  "execfile",
  "spawnsync",
  "cookies.txt",
  ".env",
  "internal/"
];

const STACK_TRACE_PATTERN = /(?:^|\n)\s*at\s+[a-zA-Z0-9_.]+/;

const DEFAULT_USER_ERROR = "ERR: Gagal memproses permintaan. Pastikan tautan publik dan dapat diakses.";

function isUserSafeErrorMessage(message) {
  if (typeof message !== "string" || message.trim().length === 0) {
    return false;
  }
  const lower = message.toLowerCase();
  if (STACK_TRACE_PATTERN.test(message)) {
    return false;
  }
  return !TECHNICAL_PATTERNS.some((pattern) => lower.includes(pattern));
}

function formatUserSafeError(error, fallback = DEFAULT_USER_ERROR) {
  const rawMessage = error instanceof Error ? error.message : (typeof error === "string" ? error : "");
  if (isUserSafeErrorMessage(rawMessage)) {
    return rawMessage.startsWith("ERR:") ? rawMessage : `ERR: ${rawMessage}`;
  }
  return fallback;
}

function createServiceError(message, statusCode = 502) {
  const cleanMessage = message || "Gagal memproses permintaan";
  const formatted = cleanMessage.startsWith("ERR:") ? cleanMessage : `ERR: ${cleanMessage}`;
  const error = new Error(formatted);
  error.statusCode = statusCode;
  error.isUserSafe = true;
  return error;
}

module.exports = {
  createServiceError,
  isUserSafeErrorMessage,
  formatUserSafeError,
  DEFAULT_USER_ERROR
};
