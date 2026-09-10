// Exponential backoff helper for offline-queue sync retries.
// attempt 0 -> base, each failure doubles the delay, capped at maxMs.
export function retryDelayMs(attempt: number, baseMs = 2000, maxMs = 60000): number {
  const a = attempt < 0 ? 0 : Math.floor(attempt)
  return Math.min(baseMs * 2 ** a, maxMs)
}
