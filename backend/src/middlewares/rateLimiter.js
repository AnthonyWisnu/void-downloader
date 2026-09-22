const rateLimit = require("express-rate-limit");

const globalApiRateLimiter = rateLimit({
  windowMs: 1 * 60 * 1000,
  max: 180,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: "ERR: Terlalu banyak permintaan ke server. Silakan coba lagi sebentar lagi."
  }
});

const downloadBurstLimiter = rateLimit({
  windowMs: 1 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: "ERR: Terlalu banyak permintaan unduhan berturut-turut. Harap tunggu satu menit."
  }
});

const downloadRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 60,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: "ERR: Terlalu banyak permintaan unduhan. Silakan coba lagi setelah beberapa menit."
  }
});

const mediaStreamRateLimiter = rateLimit({
  windowMs: 1 * 60 * 1000,
  max: 120,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: "ERR: Terlalu banyak request media. Harap tunggu sebentar."
  }
});

const healthRateLimiter = rateLimit({
  windowMs: 1 * 60 * 1000,
  max: 60,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: "ERR: Terlalu banyak health check request."
  }
});

module.exports = {
  globalApiRateLimiter,
  downloadBurstLimiter,
  downloadRateLimiter,
  mediaStreamRateLimiter,
  healthRateLimiter
};
