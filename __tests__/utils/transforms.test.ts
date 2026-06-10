import {
  getHeatmapIntensity,
  toRelativeTime,
  buildContributionMap,
  mapRunStatus,
} from '../../utils/transforms';
import type { GithubCommit, GithubRun } from '../../types/github';

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
  const makeCommit = (date: string): GithubCommit => ({
    sha: 'abc',
    commit: { message: 'fix: something', committer: { date } },
    repository: { name: 'repo', full_name: 'user/repo' },
  });

  it('counts one commit per entry', () => {
    const map = buildContributionMap([makeCommit(new Date().toISOString())]);
    const today = new Date().toISOString().slice(0, 10);
    expect(map.get(today)).toBe(1);
  });
  it('accumulates multiple commits on the same day', () => {
    const today = new Date().toISOString();
    const map = buildContributionMap([makeCommit(today), makeCommit(today)]);
    expect(map.get(today.slice(0, 10))).toBe(2);
  });
  it('returns empty map for no commits', () => {
    expect(buildContributionMap([])).toEqual(new Map());
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
