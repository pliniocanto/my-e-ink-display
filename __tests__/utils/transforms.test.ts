import {
  getHeatmapIntensity,
  toRelativeTime,
  buildContributionMap,
  mapRunStatus,
} from '../../utils/transforms';
import type { GithubEvent, GithubRun } from '../../types/github';

describe('getHeatmapIntensity', () => {
  it('returns 0 for zero commits', () => {
    expect(getHeatmapIntensity(0)).toBe(0);
  });
  it('returns 1 for 1 commit', () => {
    expect(getHeatmapIntensity(1)).toBe(1);
  });
  it('returns 2 for 3 commits', () => {
    expect(getHeatmapIntensity(3)).toBe(2);
  });
  it('returns 3 for 6 commits', () => {
    expect(getHeatmapIntensity(6)).toBe(3);
  });
  it('returns 4 for 11+ commits', () => {
    expect(getHeatmapIntensity(11)).toBe(4);
  });
});

describe('toRelativeTime', () => {
  it('returns minutes for recent events', () => {
    const d = new Date(Date.now() - 30 * 60 * 1000).toISOString();
    expect(toRelativeTime(d)).toBe('30m');
  });
  it('returns hours for same-day events', () => {
    const d = new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString();
    expect(toRelativeTime(d)).toBe('3h');
  });
  it('returns days for older events', () => {
    const d = new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString();
    expect(toRelativeTime(d)).toBe('2d');
  });
});

describe('buildContributionMap', () => {
  it('counts push events within the last 30 days', () => {
    const event: GithubEvent = {
      type: 'PushEvent',
      repo: { name: 'user/repo' },
      payload: { size: 3 },
      created_at: new Date().toISOString(),
    };
    const map = buildContributionMap([event]);
    const today = new Date().toISOString().slice(0, 10);
    expect(map.get(today)).toBe(3);
  });
  it('ignores non-push events', () => {
    const event: GithubEvent = {
      type: 'WatchEvent',
      repo: { name: 'user/repo' },
      payload: {},
      created_at: new Date().toISOString(),
    };
    const map = buildContributionMap([event]);
    expect(map.size).toBe(0);
  });
  it('ignores events older than 30 days', () => {
    const old = new Date(Date.now() - 31 * 24 * 60 * 60 * 1000).toISOString();
    const event: GithubEvent = {
      type: 'PushEvent',
      repo: { name: 'user/repo' },
      payload: { size: 2 },
      created_at: old,
    };
    const map = buildContributionMap([event]);
    expect(map.size).toBe(0);
  });
});

describe('mapRunStatus', () => {
  it('returns SKIPPED for null run', () => {
    expect(mapRunStatus(null)).toBe('SKIPPED');
  });
  it('returns RUNNING for in_progress status', () => {
    const run: GithubRun = { status: 'in_progress', conclusion: null, name: 'CI' };
    expect(mapRunStatus(run)).toBe('RUNNING');
  });
  it('returns PASS for completed+success', () => {
    const run: GithubRun = { status: 'completed', conclusion: 'success', name: 'CI' };
    expect(mapRunStatus(run)).toBe('PASS');
  });
  it('returns FAIL for completed+failure', () => {
    const run: GithubRun = { status: 'completed', conclusion: 'failure', name: 'CI' };
    expect(mapRunStatus(run)).toBe('FAIL');
  });
  it('returns SKIPPED for completed+cancelled', () => {
    const run: GithubRun = { status: 'completed', conclusion: 'cancelled', name: 'CI' };
    expect(mapRunStatus(run)).toBe('SKIPPED');
  });
});
