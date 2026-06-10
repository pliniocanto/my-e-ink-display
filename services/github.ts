import type {
  GithubUser, GithubEvent, GithubPR,
  GithubRepo, GithubRun, GithubSearchResult,
} from '../types/github';

const BASE = 'https://api.github.com';

async function request<T>(url: string, token: string): Promise<T> {
  const res = await fetch(url, {
    headers: {
      Authorization: `Bearer ${token}`,
      'X-GitHub-Api-Version': '2022-11-28',
      Accept: 'application/vnd.github+json',
    },
  });
  if (!res.ok) throw new Error(`GitHub API error: ${res.status}`);
  return res.json() as Promise<T>;
}

export async function fetchUserProfile(token: string, username: string): Promise<GithubUser> {
  return request<GithubUser>(`${BASE}/users/${username}`, token);
}

export async function fetchUserEvents(token: string, username: string): Promise<GithubEvent[]> {
  return request<GithubEvent[]>(`${BASE}/users/${username}/events?per_page=100`, token);
}

export async function fetchOpenPRs(token: string, username: string): Promise<GithubPR[]> {
  const result = await request<GithubSearchResult<GithubPR>>(
    `${BASE}/search/issues?q=is:pr+author:${username}+is:open&per_page=10`,
    token,
  );
  return result.items;
}

export async function fetchUserRepos(token: string, username: string): Promise<GithubRepo[]> {
  return request<GithubRepo[]>(`${BASE}/users/${username}/repos?per_page=100&sort=updated`, token);
}

export async function fetchLatestRun(
  token: string, owner: string, repo: string,
): Promise<GithubRun | null> {
  try {
    const result = await request<{ workflow_runs: GithubRun[] }>(
      `${BASE}/repos/${owner}/${repo}/actions/runs?per_page=1`,
      token,
    );
    return result.workflow_runs[0] ?? null;
  } catch {
    return null;
  }
}
