import { useCallback, useEffect, useState } from 'react';
import type { GithubUser, GithubCommit, GithubPR, GithubRepo, CiRunStatus } from '../types/github';
import {
  fetchUserProfile, fetchAuthorCommits,
  fetchOpenPRs, fetchUserRepos, fetchLatestRun,
} from '../services/github';
import { mapRunStatus } from '../utils/transforms';

export interface CiEntry { repo: string; status: CiRunStatus; }

export interface DashboardData {
  profile:     GithubUser | null;
  commits:     GithubCommit[];
  openPRs:     GithubPR[];
  repos:       GithubRepo[];
  ciEntries:   CiEntry[];
  totalStars:  number;
  loading:     boolean;
  error:       string | null;
  lastUpdated: Date | null;
}

export function useGitHubData(
  token: string,
  username: string,
  watchedRepos: string[],
): [DashboardData, () => void] {
  const [data, setData] = useState<DashboardData>({
    profile: null, commits: [], openPRs: [], repos: [],
    ciEntries: [], totalStars: 0,
    loading: false, error: null, lastUpdated: null,
  });

  const watchedReposKey = watchedRepos.join(',');

  const loadData = useCallback(async () => {
    if (!token || !username) return;
    setData(d => ({ ...d, loading: true, error: null }));
    try {
      const [profile, commits, openPRs, repos] = await Promise.all([
        fetchUserProfile(token, username),
        fetchAuthorCommits(token, username),
        fetchOpenPRs(token, username),
        fetchUserRepos(token, username),
      ]);

      const reposToWatch = watchedReposKey
        ? watchedReposKey.split(',')
        : repos.slice(0, 5).map(r => r.full_name);

      const ciRuns = await Promise.all(
        reposToWatch.map(async (full) => {
          const [owner, repo] = full.split('/');
          const run = await fetchLatestRun(token, owner, repo);
          return { repo: full, status: mapRunStatus(run) };
        }),
      );

      const totalStars = repos.reduce((sum, r) => sum + r.stargazers_count, 0);

      setData({
        profile, commits, openPRs, repos, ciEntries: ciRuns,
        totalStars, loading: false, error: null, lastUpdated: new Date(),
      });
    } catch (e) {
      setData(d => ({
        ...d,
        loading: false,
        error: e instanceof Error ? e.message : 'Fetch failed',
      }));
    }
  }, [token, username, watchedReposKey]);

  useEffect(() => { loadData(); }, [loadData]);

  return [data, loadData];
}
