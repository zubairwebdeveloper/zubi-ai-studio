const realSleep = (ms) => new Promise((r) => setTimeout(r, ms));

// Retries only errors flagged `retryable`, with exponential backoff and jitter.
export async function withRetry(fn, { retries = 2, baseMs = 500, sleep = realSleep } = {}) {
  for (let attempt = 0; ; attempt++) {
    try {
      return await fn();
    } catch (err) {
      if (!err?.retryable || attempt >= retries) throw err;
      await sleep(baseMs * 2 ** attempt + Math.floor(Math.random() * 100));
    }
  }
}
