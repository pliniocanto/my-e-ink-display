export interface GithubUser {
  login: string;
  public_repos: number;
  followers: number;
  following: number;
}

export interface GithubEventPayload {
  commits?: Array<{ message: string; sha: string }>;
  size?: number;
}

export interface GithubEvent {
  type: string;
  repo: { name: string };
  payload: GithubEventPayload;
  created_at: string;
}

export interface GithubPR {
  number: number;
  title: string;
  draft: boolean;
  html_url: string;
}

export interface GithubRepo {
  name: string;
  full_name: string;
  stargazers_count: number;
  forks_count: number;
  open_issues_count: number;
}

export interface GithubRun {
  status: string;
  conclusion: string | null;
  name: string;
}

export interface GithubSearchResult<T> {
  total_count: number;
  items: T[];
}

export interface GithubCommit {
  sha: string;
  commit: {
    message: string;
    committer: { date: string };
  };
  repository: {
    name: string;
    full_name: string;
  };
}

export type CiRunStatus = 'PASS' | 'FAIL' | 'RUNNING' | 'SKIPPED';
