import type { GithubEvent, GithubRun, CiRunStatus } from '../types/github';

export function getHeatmapIntensity(count: number): 0 | 1 | 2 | 3 | 4 {
  if (count === 0)  return 0;
  if (count <= 2)   return 1;
  if (count <= 5)   return 2;
  if (count <= 10)  return 3;
  return 4;
}

export function toRelativeTime(isoString: string): string {
  const diff = Date.now() - new Date(isoString).getTime();
  const minutes = Math.floor(diff / 60_000);
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h`;
  return `${Math.floor(hours / 24)}d`;
}

export function buildContributionMap(events: GithubEvent[]): Map<string, number> {
  const map = new Map<string, number>();
  const cutoff = Date.now() - 30 * 24 * 60 * 60 * 1000;
  for (const event of events) {
    if (event.type !== 'PushEvent') continue;
    const date = new Date(event.created_at);
    if (date.getTime() < cutoff) continue;
    const key = date.toISOString().slice(0, 10);
    map.set(key, (map.get(key) ?? 0) + (event.payload.size ?? 0));
  }
  return map;
}

export function mapRunStatus(run: GithubRun | null): CiRunStatus {
  if (!run) return 'SKIPPED';
  if (run.status === 'in_progress' || run.status === 'queued') return 'RUNNING';
  if (run.conclusion === 'success') return 'PASS';
  if (run.conclusion === 'failure') return 'FAIL';
  return 'SKIPPED';
}
