// Pure. Prompts, pasted text and chat history can contain personal data, so the copy kept for retries is
// erased after the retention period. The asset id and options are kept (they hold no free text).
export const DAY_MS = 86_400_000;
export const redactAtMs = (createdMs, days) => createdMs + days * DAY_MS;

export function redactJobInput(input) {
  return { ...(input || {}), text: "", history: [], redacted: true };
}
