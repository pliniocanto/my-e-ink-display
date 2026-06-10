const POLL_INTERVAL_MS = 10 * 60 * 1000;

export function startPoller(onTick: () => void): () => void {
  const id = setInterval(onTick, POLL_INTERVAL_MS);
  return () => clearInterval(id);
}

export const POLL_SECONDS = POLL_INTERVAL_MS / 1000;
