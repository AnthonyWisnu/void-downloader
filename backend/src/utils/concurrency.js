class ConcurrencyLimiter {
  constructor(maxConcurrency = 2, queueTimeoutMs = 60000) {
    this.maxConcurrency = Math.max(1, maxConcurrency);
    this.queueTimeoutMs = queueTimeoutMs;
    this.activeCount = 0;
    this.queue = [];
  }

  acquire() {
    if (this.activeCount < this.maxConcurrency) {
      this.activeCount++;
      return Promise.resolve();
    }

    return new Promise((resolve, reject) => {
      let timeoutId = null;

      const queueItem = {
        resolve: () => {
          if (timeoutId) {
            clearTimeout(timeoutId);
          }
          resolve();
        },
        reject: (err) => {
          if (timeoutId) {
            clearTimeout(timeoutId);
          }
          reject(err);
        }
      };

      timeoutId = setTimeout(() => {
        const index = this.queue.indexOf(queueItem);
        if (index !== -1) {
          this.queue.splice(index, 1);
        }
        const err = new Error("ERR: Antrian server sedang penuh, silakan coba lagi dalam beberapa saat");
        err.statusCode = 503;
        queueItem.reject(err);
      }, this.queueTimeoutMs);

      this.queue.push(queueItem);
    });
  }

  release() {
    this.activeCount = Math.max(0, this.activeCount - 1);
    if (this.queue.length > 0) {
      this.activeCount++;
      const next = this.queue.shift();
      next.resolve();
    }
  }

  async run(taskFn) {
    await this.acquire();
    try {
      return await taskFn();
    } finally {
      this.release();
    }
  }

  get stats() {
    return {
      active: this.activeCount,
      queued: this.queue.length,
      max: this.maxConcurrency
    };
  }
}

const maxJobs = parseInt(process.env.MAX_CONCURRENT_HEAVY_JOBS || "2", 10);
const heavyTaskLimiter = new ConcurrencyLimiter(maxJobs, 60000);

module.exports = {
  ConcurrencyLimiter,
  heavyTaskLimiter
};
