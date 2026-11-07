// Provider errors carry a user-safe message so provider internals never reach the browser.
const PUBLIC = {
  rejected: "The AI provider rejected this request. Try changing your input.",
  auth: "The AI provider is not available right now. Our team has been notified.",
  busy: "The AI provider is busy. Please try again shortly.",
  unavailable: "The AI provider is temporarily unavailable. Please try again.",
  empty: "The AI provider returned no result. Try rephrasing your input.",
  generic: "The request could not be completed.",
};

export class ProviderError extends Error {
  constructor(message, { status = null, retryable = false, code = "provider_error", publicKey = "generic", needsReview = false } = {}) {
    super(message);
    this.name = "ProviderError";
    this.status = status;
    this.retryable = retryable;
    this.code = code;
    this.needsReview = needsReview;
    this.publicMessage = PUBLIC[publicKey] || PUBLIC.generic;
  }
}

export function fromHttpStatus(status, detail = "") {
  const retryable = status === 408 || status === 429 || status >= 500;
  const publicKey = status === 429 ? "busy" : status === 401 || status === 403 ? "auth" : status >= 500 || status === 408 ? "unavailable" : "rejected";
  return new ProviderError(`HTTP ${status}${detail ? `: ${String(detail).slice(0, 300)}` : ""}`, {
    status, retryable, publicKey, code: `http_${status}`,
  });
}

export const networkError = (err) =>
  new ProviderError(`Network/timeout: ${err?.message || err}`, { retryable: true, publicKey: "unavailable", code: "network" });

export const emptyOutputError = (why = "") =>
  new ProviderError(`Empty output${why ? ` (${why})` : ""}`, { retryable: false, publicKey: "empty", code: "empty_output" });
