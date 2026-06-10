import type {
  GithubUser, GithubPR,
  GithubRepo, GithubRun, GithubSearchResult, GithubCommit, GithubBranch, GithubIssue,
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

export async function fetchAuthorCommits(token: string, username: string): Promise<GithubCommit[]> {
  const since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
  const result = await request<GithubSearchResult<GithubCommit>>(
    `${BASE}/search/commits?q=author:${username}+committer-date:>${since}&sort=committer-date&order=desc&per_page=100`,
    token,
  );
  return result.items;
}

export async function fetchRepoPRs(token: string, owner: string, repo: string): Promise<GithubPR[]> {
  try {
    return await request<GithubPR[]>(
      `${BASE}/repos/${owner}/${repo}/pulls?state=open&per_page=30`,
      token,
    );
  } catch {
    return [];
  }
}

export async function fetchUserIssues(token: string, username: string): Promise<GithubIssue[]> {
  const result = await request<GithubSearchResult<GithubIssue>>(
    `${BASE}/search/issues?q=is:issue+author:${username}+is:open&sort=updated&per_page=50`,
    token,
  );
  return result.items;
}

export async function fetchUserRepos(token: string, username: string): Promise<GithubRepo[]> {
  return request<GithubRepo[]>(`${BASE}/users/${username}/repos?per_page=100&sort=updated`, token);
}

interface RawRepoCommit {
  sha: string;
  commit: { message: string; committer: { date: string } };
  author:    { login: string } | null;
  committer: { login: string } | null;
}

export async function fetchBranchCommits(
  token: string, owner: string, repo: string, branch: string, username: string,
): Promise<GithubCommit[]> {
  try {
    const raw = await request<RawRepoCommit[]>(
      `${BASE}/repos/${owner}/${repo}/commits?sha=${encodeURIComponent(branch)}&per_page=30`,
      token,
    );
    return raw
      .filter(c => c.author?.login === username || c.committer?.login === username)
      .map(c => ({
        sha: c.sha,
        commit: { message: c.commit.message, committer: { date: c.commit.committer.date } },
        repository: { name: repo, full_name: `${owner}/${repo}` },
      }));
  } catch {
    return [];
  }
}

export async function fetchRepoBranches(
  token: string, owner: string, repo: string,
): Promise<GithubBranch[]> {
  try {
    return request<GithubBranch[]>(
      `${BASE}/repos/${owner}/${repo}/branches?per_page=30`,
      token,
    );
  } catch {
    return [];
  }
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
