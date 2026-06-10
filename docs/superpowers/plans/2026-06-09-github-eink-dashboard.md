# GitHub E-Ink Dashboard — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a React Native + Expo app for iPad/Android tablets that displays a GitHub activity dashboard with an e-ink visual aesthetic, polling every 10 minutes.

**Architecture:** Single-screen app with five widgets arranged in a 3-column grid. All GitHub data is fetched in parallel from the REST API and stored in local React state. A fixed-interval poller drives refreshes; no real-time updates.

**Tech Stack:** Expo SDK 52, TypeScript (strict), Expo Router, expo-secure-store, expo-screen-orientation, @expo-google-fonts/space-mono, Jest + jest-expo.

---

## File Map

```
app/
  _layout.tsx                    # Root: landscape lock, status bar hide, font load
  index.tsx                      # DashboardScreen — composes all widgets

components/
  layout/
    TopBar.tsx                   # Username, last-updated timestamp, refresh + settings trigger
    BottomBar.tsx                # Error banner, next-refresh countdown
    DashboardGrid.tsx            # 3-column flex grid container
  widgets/
    ContributionHeatmap.tsx      # 30-day commit heatmap (10×3 cell grid)
    PullRequestList.tsx          # Up to 4 open/draft PRs
    RepoStats.tsx                # 2×2 counter grid (repos, issues, stars, forks)
    RecentCommits.tsx            # Last 5 commits across all repos
    CiStatus.tsx                 # Per-repo workflow run status badges
  settings/
    SettingsModal.tsx            # Token + username + watched repos config

services/
  github.ts                      # All GitHub REST API calls
  storage.ts                     # expo-secure-store wrapper
  poller.ts                      # setInterval-based refresh scheduler

hooks/
  useGitHubData.ts               # Orchestrates parallel fetch + state
  useCountdown.ts                # Seconds-remaining countdown string

utils/
  transforms.ts                  # Pure: heatmap intensity, relative time, contribution map, CI status

constants/
  theme.ts                       # E-ink palette + typography tokens

types/
  github.ts                      # TypeScript interfaces for API responses

__tests__/
  utils/transforms.test.ts
  services/github.test.ts
  services/storage.test.ts
```

---

### Task 1: Bootstrap Expo project

**Files:**
- Create: `package.json`, `tsconfig.json`, `app.json`, `app/_layout.tsx`, `app/index.tsx` (via Expo CLI)
- Create: `.gitignore`

- [ ] **Step 1: Initialise project**

```bash
cd /mnt/sda3/code/candev/my-e-ink-display
npx create-expo-app@latest . --template blank-typescript
```

If prompted that the directory is not empty, confirm to continue. This creates `App.tsx`, `package.json`, `tsconfig.json`, and `app.json`.

- [ ] **Step 2: Install dependencies**

```bash
npx expo install expo-router expo-secure-store expo-screen-orientation expo-font expo-status-bar react-native-safe-area-context react-native-screens
npx expo install @expo-google-fonts/space-mono
```

- [ ] **Step 3: Switch entry point to Expo Router**

In `package.json`, change:
```json
"main": "expo-router/entry"
```

In `app.json`, add inside the `"expo"` object:
```json
"scheme": "myeinkdisplay"
```

- [ ] **Step 4: Delete App.tsx (replaced by Expo Router)**

```bash
rm App.tsx
```

- [ ] **Step 5: Create minimal root layout**

Create `app/_layout.tsx`:
```tsx
import { Stack } from 'expo-router';

export default function RootLayout() {
  return <Stack screenOptions={{ headerShown: false }} />;
}
```

- [ ] **Step 6: Create placeholder index screen**

Create `app/index.tsx`:
```tsx
import { Text, View } from 'react-native';

export default function DashboardScreen() {
  return (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
      <Text>E-Ink Dashboard</Text>
    </View>
  );
}
```

- [ ] **Step 7: Verify app boots**

```bash
npx expo start --ios
# or for Android:
npx expo start --android
```

Expected: app opens showing "E-Ink Dashboard" centred on screen.

- [ ] **Step 8: Add .gitignore and init git**

```bash
cat >> .gitignore << 'EOF'
.superpowers/
node_modules/
.expo/
dist/
EOF
git init
git add .
git commit -m "feat: bootstrap Expo project with Router"
```

---

### Task 2: Types and theme constants

**Files:**
- Create: `types/github.ts`
- Create: `constants/theme.ts`

- [ ] **Step 1: Create TypeScript types**

Create `types/github.ts`:
```ts
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

export type CiRunStatus = 'PASS' | 'FAIL' | 'RUNNING' | 'SKIPPED';
```

- [ ] **Step 2: Create theme constants**

Create `constants/theme.ts`:
```ts
export const Colors = {
  paper:  '#f5f0e8',
  ink:    '#1a1a1a',
  gray1:  '#888888',
  gray2:  '#aaaaaa',
  gray3:  '#dddddd',
} as const;

export const HeatmapColors: Record<0 | 1 | 2 | 3 | 4, string> = {
  0: Colors.paper,
  1: Colors.gray3,
  2: Colors.gray2,
  3: Colors.gray1,
  4: Colors.ink,
};

export const FontFamily = 'SpaceMono_400Regular';

export const Spacing = {
  screen: 16,
  gap:    12,
  inner:  10,
} as const;
```

- [ ] **Step 3: Commit**

```bash
git add types/github.ts constants/theme.ts
git commit -m "feat: add TypeScript types and e-ink theme constants"
```

---

### Task 3: Data transform utilities (TDD)

**Files:**
- Create: `utils/transforms.ts`
- Create: `__tests__/utils/transforms.test.ts`

- [ ] **Step 1: Write failing tests**

Create `__tests__/utils/transforms.test.ts`:
```ts
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
```

- [ ] **Step 2: Run tests — expect failures**

```bash
npx jest __tests__/utils/transforms.test.ts
```

Expected: FAIL — `Cannot find module '../../utils/transforms'`

- [ ] **Step 3: Implement transforms**

Create `utils/transforms.ts`:
```ts
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
```

- [ ] **Step 4: Run tests — expect all pass**

```bash
npx jest __tests__/utils/transforms.test.ts
```

Expected: PASS — 13 tests passed

- [ ] **Step 5: Commit**

```bash
git add utils/transforms.ts __tests__/utils/transforms.test.ts
git commit -m "feat: add data transform utilities with tests"
```

---

### Task 4: Storage service (TDD)

**Files:**
- Create: `services/storage.ts`
- Create: `__tests__/services/storage.test.ts`

- [ ] **Step 1: Write failing tests**

Create `__tests__/services/storage.test.ts`:
```ts
jest.mock('expo-secure-store', () => ({
  getItemAsync: jest.fn(),
  setItemAsync: jest.fn(),
}));

import * as SecureStore from 'expo-secure-store';
import {
  getToken, setToken,
  getUsername, setUsername,
  getWatchedRepos, setWatchedRepos,
} from '../../services/storage';

const mockGet = SecureStore.getItemAsync as jest.Mock;
const mockSet = SecureStore.setItemAsync as jest.Mock;

beforeEach(() => jest.clearAllMocks());

describe('getToken', () => {
  it('returns stored token', async () => {
    mockGet.mockResolvedValue('ghp_abc123');
    expect(await getToken()).toBe('ghp_abc123');
    expect(mockGet).toHaveBeenCalledWith('github_token');
  });
  it('returns null when not set', async () => {
    mockGet.mockResolvedValue(null);
    expect(await getToken()).toBeNull();
  });
});

describe('setToken', () => {
  it('stores token under github_token key', async () => {
    mockSet.mockResolvedValue(undefined);
    await setToken('ghp_xyz');
    expect(mockSet).toHaveBeenCalledWith('github_token', 'ghp_xyz');
  });
});

describe('getWatchedRepos', () => {
  it('returns parsed array', async () => {
    mockGet.mockResolvedValue('["user/repo1","user/repo2"]');
    expect(await getWatchedRepos()).toEqual(['user/repo1', 'user/repo2']);
  });
  it('returns empty array when not set', async () => {
    mockGet.mockResolvedValue(null);
    expect(await getWatchedRepos()).toEqual([]);
  });
  it('returns empty array on invalid JSON', async () => {
    mockGet.mockResolvedValue('{bad json');
    expect(await getWatchedRepos()).toEqual([]);
  });
});

describe('setWatchedRepos', () => {
  it('serialises array to JSON', async () => {
    mockSet.mockResolvedValue(undefined);
    await setWatchedRepos(['a/b', 'c/d']);
    expect(mockSet).toHaveBeenCalledWith('watched_repos', '["a/b","c/d"]');
  });
});
```

- [ ] **Step 2: Run tests — expect failures**

```bash
npx jest __tests__/services/storage.test.ts
```

Expected: FAIL — `Cannot find module '../../services/storage'`

- [ ] **Step 3: Implement storage service**

Create `services/storage.ts`:
```ts
import * as SecureStore from 'expo-secure-store';

const KEYS = {
  token:        'github_token',
  username:     'github_username',
  watchedRepos: 'watched_repos',
} as const;

export async function getToken(): Promise<string | null> {
  return SecureStore.getItemAsync(KEYS.token);
}
export async function setToken(token: string): Promise<void> {
  await SecureStore.setItemAsync(KEYS.token, token);
}
export async function getUsername(): Promise<string | null> {
  return SecureStore.getItemAsync(KEYS.username);
}
export async function setUsername(username: string): Promise<void> {
  await SecureStore.setItemAsync(KEYS.username, username);
}
export async function getWatchedRepos(): Promise<string[]> {
  const raw = await SecureStore.getItemAsync(KEYS.watchedRepos);
  if (!raw) return [];
  try { return JSON.parse(raw) as string[]; } catch { return []; }
}
export async function setWatchedRepos(repos: string[]): Promise<void> {
  await SecureStore.setItemAsync(KEYS.watchedRepos, JSON.stringify(repos));
}
```

- [ ] **Step 4: Run tests — expect all pass**

```bash
npx jest __tests__/services/storage.test.ts
```

Expected: PASS — 7 tests passed

- [ ] **Step 5: Commit**

```bash
git add services/storage.ts __tests__/services/storage.test.ts
git commit -m "feat: add storage service with SecureStore"
```

---

### Task 5: GitHub API service (TDD)

**Files:**
- Create: `services/github.ts`
- Create: `__tests__/services/github.test.ts`

- [ ] **Step 1: Write failing tests**

Create `__tests__/services/github.test.ts`:
```ts
const mockFetch = jest.fn();
global.fetch = mockFetch;

import {
  fetchUserProfile,
  fetchUserEvents,
  fetchOpenPRs,
  fetchUserRepos,
  fetchLatestRun,
} from '../../services/github';

const TOKEN = 'ghp_test';
const USER = 'testuser';

function mockOk(body: unknown) {
  mockFetch.mockResolvedValue({
    ok: true,
    json: () => Promise.resolve(body),
  });
}
function mockError(status: number) {
  mockFetch.mockResolvedValue({ ok: false, status });
}

beforeEach(() => jest.clearAllMocks());

describe('fetchUserProfile', () => {
  it('returns user data', async () => {
    mockOk({ login: 'testuser', public_repos: 5 });
    const user = await fetchUserProfile(TOKEN, USER);
    expect(user.login).toBe('testuser');
    expect(mockFetch).toHaveBeenCalledWith(
      'https://api.github.com/users/testuser',
      expect.objectContaining({ headers: expect.objectContaining({ Authorization: `Bearer ${TOKEN}` }) })
    );
  });
  it('throws on non-2xx response', async () => {
    mockError(401);
    await expect(fetchUserProfile(TOKEN, USER)).rejects.toThrow('GitHub API error: 401');
  });
});

describe('fetchOpenPRs', () => {
  it('returns items from search result', async () => {
    mockOk({ total_count: 1, items: [{ number: 42, title: 'fix: bug', draft: false }] });
    const prs = await fetchOpenPRs(TOKEN, USER);
    expect(prs).toHaveLength(1);
    expect(prs[0].number).toBe(42);
  });
});

describe('fetchLatestRun', () => {
  it('returns first run', async () => {
    mockOk({ workflow_runs: [{ status: 'completed', conclusion: 'success', name: 'CI' }] });
    const run = await fetchLatestRun(TOKEN, 'user', 'repo');
    expect(run?.conclusion).toBe('success');
  });
  it('returns null when no runs', async () => {
    mockOk({ workflow_runs: [] });
    const run = await fetchLatestRun(TOKEN, 'user', 'repo');
    expect(run).toBeNull();
  });
  it('returns null on API error (repo has no Actions)', async () => {
    mockError(404);
    const run = await fetchLatestRun(TOKEN, 'user', 'repo');
    expect(run).toBeNull();
  });
});
```

- [ ] **Step 2: Run tests — expect failures**

```bash
npx jest __tests__/services/github.test.ts
```

Expected: FAIL — `Cannot find module '../../services/github'`

- [ ] **Step 3: Implement GitHub service**

Create `services/github.ts`:
```ts
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
```

- [ ] **Step 4: Run tests — expect all pass**

```bash
npx jest __tests__/services/github.test.ts
```

Expected: PASS — 7 tests passed

- [ ] **Step 5: Run full test suite**

```bash
npx jest
```

Expected: all 27 tests pass

- [ ] **Step 6: Commit**

```bash
git add services/github.ts __tests__/services/github.test.ts
git commit -m "feat: add GitHub REST API service with tests"
```

---

### Task 6: Poller service

**Files:**
- Create: `services/poller.ts`

- [ ] **Step 1: Implement poller**

Create `services/poller.ts`:
```ts
const POLL_INTERVAL_MS = 10 * 60 * 1000;

export function startPoller(onTick: () => void): () => void {
  const id = setInterval(onTick, POLL_INTERVAL_MS);
  return () => clearInterval(id);
}

export const POLL_SECONDS = POLL_INTERVAL_MS / 1000;
```

- [ ] **Step 2: Commit**

```bash
git add services/poller.ts
git commit -m "feat: add interval-based poller service"
```

---

### Task 7: useCountdown hook

**Files:**
- Create: `hooks/useCountdown.ts`

- [ ] **Step 1: Implement hook**

Create `hooks/useCountdown.ts`:
```ts
import { useEffect, useState } from 'react';

export function useCountdown(totalSeconds: number): string {
  const [remaining, setRemaining] = useState(totalSeconds);

  useEffect(() => {
    setRemaining(totalSeconds);
    const id = setInterval(() => {
      setRemaining(r => (r <= 1 ? totalSeconds : r - 1));
    }, 1000);
    return () => clearInterval(id);
  }, [totalSeconds]);

  const m = Math.floor(remaining / 60).toString().padStart(2, '0');
  const s = (remaining % 60).toString().padStart(2, '0');
  return `${m}:${s}`;
}
```

- [ ] **Step 2: Commit**

```bash
git add hooks/useCountdown.ts
git commit -m "feat: add useCountdown hook"
```

---

### Task 8: useGitHubData hook

**Files:**
- Create: `hooks/useGitHubData.ts`

- [ ] **Step 1: Define the hook**

Create `hooks/useGitHubData.ts`:
```ts
import { useCallback, useEffect, useState } from 'react';
import type { GithubUser, GithubEvent, GithubPR, GithubRepo, CiRunStatus } from '../types/github';
import {
  fetchUserProfile, fetchUserEvents,
  fetchOpenPRs, fetchUserRepos, fetchLatestRun,
} from '../services/github';
import { mapRunStatus } from '../utils/transforms';

export interface CiEntry { repo: string; status: CiRunStatus; }

export interface DashboardData {
  profile:     GithubUser | null;
  events:      GithubEvent[];
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
    profile: null, events: [], openPRs: [], repos: [],
    ciEntries: [], totalStars: 0,
    loading: false, error: null, lastUpdated: null,
  });

  const watchedReposKey = watchedRepos.join(',');

  const loadData = useCallback(async () => {
    if (!token || !username) return;
    setData(d => ({ ...d, loading: true, error: null }));
    try {
      const [profile, events, openPRs, repos] = await Promise.all([
        fetchUserProfile(token, username),
        fetchUserEvents(token, username),
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
        profile, events, openPRs, repos, ciEntries: ciRuns,
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
```

- [ ] **Step 2: Commit**

```bash
git add hooks/useGitHubData.ts
git commit -m "feat: add useGitHubData hook"
```

---

### Task 9: Load font in root layout

**Files:**
- Modify: `app/_layout.tsx`

- [ ] **Step 1: Update root layout with font loading and orientation lock**

Replace `app/_layout.tsx`:
```tsx
import { useEffect } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import * as ScreenOrientation from 'expo-screen-orientation';
import { useFonts, SpaceMono_400Regular } from '@expo-google-fonts/space-mono';

export default function RootLayout() {
  const [fontsLoaded] = useFonts({ SpaceMono_400Regular });

  useEffect(() => {
    ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.LANDSCAPE);
  }, []);

  if (!fontsLoaded) return null;

  return (
    <>
      <StatusBar hidden />
      <Stack screenOptions={{ headerShown: false }} />
    </>
  );
}
```

- [ ] **Step 2: Verify app still boots (font loads, rotates to landscape)**

```bash
npx expo start --ios
```

Expected: screen is landscape, no status bar visible, "E-Ink Dashboard" text in SpaceMono font.

- [ ] **Step 3: Commit**

```bash
git add app/_layout.tsx
git commit -m "feat: lock landscape and load SpaceMono font in root layout"
```

---

### Task 10: Layout components (TopBar, BottomBar, DashboardGrid)

**Files:**
- Create: `components/layout/TopBar.tsx`
- Create: `components/layout/BottomBar.tsx`
- Create: `components/layout/DashboardGrid.tsx`

- [ ] **Step 1: Create TopBar**

Create `components/layout/TopBar.tsx`:
```tsx
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Colors, FontFamily } from '../../constants/theme';

interface Props {
  username: string;
  lastUpdated: Date | null;
  onRefresh: () => void;
  onSettingsPress: () => void;
}

export function TopBar({ username, lastUpdated, onRefresh, onSettingsPress }: Props) {
  const updated = lastUpdated
    ? lastUpdated.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    : '—';

  return (
    <View style={s.container}>
      <Pressable onLongPress={onSettingsPress}>
        <Text style={s.title}>▣ GITHUB DASHBOARD</Text>
      </Pressable>
      <View style={s.right}>
        <Text style={s.meta}>@{username}  |  updated {updated}</Text>
        <Pressable onPress={onRefresh} style={s.refreshBtn}>
          <Text style={s.refreshText}>↻</Text>
        </Pressable>
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: Colors.ink,
    paddingBottom: 8,
    marginBottom: 12,
  },
  title: { fontFamily: FontFamily, fontSize: 18, fontWeight: 'bold', letterSpacing: 2, color: Colors.ink },
  right:  { flexDirection: 'row', alignItems: 'center', gap: 12 },
  meta:   { fontFamily: FontFamily, fontSize: 11, color: Colors.gray1 },
  refreshBtn: { padding: 4 },
  refreshText: { fontFamily: FontFamily, fontSize: 16, color: Colors.ink },
});
```

- [ ] **Step 2: Create BottomBar**

Create `components/layout/BottomBar.tsx`:
```tsx
import { StyleSheet, Text, View } from 'react-native';
import { Colors, FontFamily } from '../../constants/theme';

interface Props {
  error: string | null;
  countdown: string;
}

export function BottomBar({ error, countdown }: Props) {
  return (
    <View style={s.container}>
      <Text style={[s.text, error ? s.error : null]}>
        {error ? `⚠ ${error}` : 'React Native · Expo · GitHub REST API'}
      </Text>
      <Text style={s.text}>next refresh in {countdown}</Text>
    </View>
  );
}

const s = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderTopWidth: 2,
    borderTopColor: Colors.ink,
    marginTop: 12,
    paddingTop: 6,
  },
  text:  { fontFamily: FontFamily, fontSize: 11, color: Colors.gray1 },
  error: { color: Colors.ink },
});
```

- [ ] **Step 3: Create DashboardGrid**

Create `components/layout/DashboardGrid.tsx`:
```tsx
import type { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';
import { Spacing } from '../../constants/theme';

interface Props { children: ReactNode }

export function DashboardGrid({ children }: Props) {
  return <View style={s.grid}>{children}</View>;
}

const s = StyleSheet.create({
  grid: {
    flex: 1,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.gap,
  },
});
```

- [ ] **Step 4: Commit**

```bash
git add components/layout/
git commit -m "feat: add TopBar, BottomBar, DashboardGrid layout components"
```

---

### Task 11: ContributionHeatmap widget

**Files:**
- Create: `components/widgets/ContributionHeatmap.tsx`

- [ ] **Step 1: Implement widget**

Create `components/widgets/ContributionHeatmap.tsx`:
```tsx
import { StyleSheet, Text, View } from 'react-native';
import type { GithubEvent } from '../../types/github';
import { Colors, FontFamily, HeatmapColors, Spacing } from '../../constants/theme';
import { buildContributionMap, getHeatmapIntensity } from '../../utils/transforms';

interface Props {
  events: GithubEvent[];
  style?: object;
}

function getLast30Days(): string[] {
  return Array.from({ length: 30 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (29 - i));
    return d.toISOString().slice(0, 10);
  });
}

export function ContributionHeatmap({ events, style }: Props) {
  const map = buildContributionMap(events);
  const days = getLast30Days();
  const total = [...map.values()].reduce((a, b) => a + b, 0);

  return (
    <View style={[s.card, style]}>
      <Text style={s.label}>CONTRIBUTIONS · LAST 30 DAYS</Text>
      <View style={s.grid}>
        {days.map(day => {
          const count = map.get(day) ?? 0;
          const intensity = getHeatmapIntensity(count);
          return (
            <View
              key={day}
              style={[s.cell, { backgroundColor: HeatmapColors[intensity] }]}
            />
          );
        })}
      </View>
      <Text style={s.total}>{total} commits</Text>
    </View>
  );
}

const s = StyleSheet.create({
  card:  { flex: 1, borderWidth: 1, borderColor: Colors.gray2, padding: Spacing.inner, backgroundColor: '#fff' },
  label: { fontFamily: FontFamily, fontSize: 11, letterSpacing: 1, color: Colors.gray1, marginBottom: 6 },
  grid:  { flexDirection: 'row', flexWrap: 'wrap', gap: 3 },
  cell:  { width: 14, height: 14, borderRadius: 2 },
  total: { fontFamily: FontFamily, fontSize: 13, fontWeight: 'bold', color: Colors.ink, marginTop: 8 },
});
```

- [ ] **Step 2: Commit**

```bash
git add components/widgets/ContributionHeatmap.tsx
git commit -m "feat: add ContributionHeatmap widget"
```

---

### Task 12: PullRequestList widget

**Files:**
- Create: `components/widgets/PullRequestList.tsx`

- [ ] **Step 1: Implement widget**

Create `components/widgets/PullRequestList.tsx`:
```tsx
import { StyleSheet, Text, View } from 'react-native';
import type { GithubPR } from '../../types/github';
import { Colors, FontFamily, Spacing } from '../../constants/theme';

interface Props {
  prs: GithubPR[];
  style?: object;
}

export function PullRequestList({ prs, style }: Props) {
  const open  = prs.filter(p => !p.draft);
  const draft = prs.filter(p => p.draft);
  const shown = prs.slice(0, 4);

  return (
    <View style={[s.card, style]}>
      <Text style={s.label}>PULL REQUESTS</Text>
      {shown.map(pr => (
        <View key={pr.number} style={s.row}>
          <Text style={s.bullet}>{pr.draft ? '○' : '●'}</Text>
          <Text style={s.title} numberOfLines={1}>
            {pr.title}
          </Text>
          <Text style={s.number}>#{pr.number}</Text>
        </View>
      ))}
      {shown.length === 0 && <Text style={s.empty}>No open PRs</Text>}
      <Text style={s.summary}>{open.length} open · {draft.length} draft</Text>
    </View>
  );
}

const s = StyleSheet.create({
  card:    { flex: 1, borderWidth: 1, borderColor: Colors.gray2, padding: Spacing.inner, backgroundColor: '#fff' },
  label:   { fontFamily: FontFamily, fontSize: 11, letterSpacing: 1, color: Colors.gray1, marginBottom: 6 },
  row:     { flexDirection: 'row', alignItems: 'center', borderBottomWidth: 1, borderBottomColor: Colors.gray3, paddingVertical: 4, gap: 6 },
  bullet:  { fontFamily: FontFamily, fontSize: 12, color: Colors.ink, width: 12 },
  title:   { fontFamily: FontFamily, fontSize: 12, color: Colors.ink, flex: 1 },
  number:  { fontFamily: FontFamily, fontSize: 12, color: Colors.gray1 },
  empty:   { fontFamily: FontFamily, fontSize: 12, color: Colors.gray2, paddingVertical: 4 },
  summary: { fontFamily: FontFamily, fontSize: 11, color: Colors.gray1, marginTop: 8 },
});
```

- [ ] **Step 2: Commit**

```bash
git add components/widgets/PullRequestList.tsx
git commit -m "feat: add PullRequestList widget"
```

---

### Task 13: RepoStats widget

**Files:**
- Create: `components/widgets/RepoStats.tsx`

- [ ] **Step 1: Implement widget**

Create `components/widgets/RepoStats.tsx`:
```tsx
import { StyleSheet, Text, View } from 'react-native';
import type { GithubUser } from '../../types/github';
import { Colors, FontFamily, Spacing } from '../../constants/theme';

interface Props {
  profile: GithubUser | null;
  totalStars: number;
  totalForks: number;
  openIssues: number;
  style?: object;
}

function Counter({ value, label }: { value: number; label: string }) {
  return (
    <View style={s.counter}>
      <Text style={s.value}>{value}</Text>
      <Text style={s.counterLabel}>{label}</Text>
    </View>
  );
}

export function RepoStats({ profile, totalStars, totalForks, openIssues, style }: Props) {
  return (
    <View style={[s.card, style]}>
      <Text style={s.label}>REPO STATS</Text>
      <View style={s.grid}>
        <Counter value={profile?.public_repos ?? 0} label="REPOS" />
        <Counter value={openIssues} label="ISSUES" />
        <Counter value={totalStars} label="STARS" />
        <Counter value={totalForks} label="FORKS" />
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  card:         { flex: 1, borderWidth: 1, borderColor: Colors.gray2, padding: Spacing.inner, backgroundColor: '#fff' },
  label:        { fontFamily: FontFamily, fontSize: 11, letterSpacing: 1, color: Colors.gray1, marginBottom: 6 },
  grid:         { flexDirection: 'row', flexWrap: 'wrap', gap: 6, flex: 1 },
  counter:      { width: '48%', borderWidth: 1, borderColor: Colors.gray3, padding: 6, alignItems: 'center' },
  value:        { fontFamily: FontFamily, fontSize: 22, fontWeight: 'bold', color: Colors.ink },
  counterLabel: { fontFamily: FontFamily, fontSize: 10, color: Colors.gray1 },
});
```

- [ ] **Step 2: Commit**

```bash
git add components/widgets/RepoStats.tsx
git commit -m "feat: add RepoStats widget"
```

---

### Task 14: RecentCommits widget

**Files:**
- Create: `components/widgets/RecentCommits.tsx`

- [ ] **Step 1: Implement widget**

Create `components/widgets/RecentCommits.tsx`:
```tsx
import { StyleSheet, Text, View } from 'react-native';
import type { GithubEvent } from '../../types/github';
import { Colors, FontFamily, Spacing } from '../../constants/theme';
import { toRelativeTime } from '../../utils/transforms';

interface CommitRow { message: string; repo: string; time: string; }

function extractCommits(events: GithubEvent[]): CommitRow[] {
  const rows: CommitRow[] = [];
  for (const event of events) {
    if (event.type !== 'PushEvent') continue;
    const commits = event.payload.commits ?? [];
    for (const c of commits) {
      rows.push({
        message: c.message.split('\n')[0],
        repo: event.repo.name.split('/')[1] ?? event.repo.name,
        time: toRelativeTime(event.created_at),
      });
      if (rows.length === 5) return rows;
    }
  }
  return rows;
}

interface Props {
  events: GithubEvent[];
  style?: object;
}

export function RecentCommits({ events, style }: Props) {
  const commits = extractCommits(events);

  return (
    <View style={[s.card, style]}>
      <Text style={s.label}>RECENT COMMITS</Text>
      {commits.map((c, i) => (
        <View key={i} style={s.row}>
          <Text style={s.diamond}>◆</Text>
          <Text style={s.message} numberOfLines={1}>{c.message}</Text>
          <Text style={s.meta}>{c.repo} · {c.time}</Text>
        </View>
      ))}
      {commits.length === 0 && <Text style={s.empty}>No recent commits</Text>}
    </View>
  );
}

const s = StyleSheet.create({
  card:    { flex: 2, borderWidth: 1, borderColor: Colors.gray2, padding: Spacing.inner, backgroundColor: '#fff' },
  label:   { fontFamily: FontFamily, fontSize: 11, letterSpacing: 1, color: Colors.gray1, marginBottom: 6 },
  row:     { flexDirection: 'row', alignItems: 'center', borderBottomWidth: 1, borderBottomColor: Colors.gray3, paddingVertical: 4, gap: 6 },
  diamond: { fontFamily: FontFamily, fontSize: 10, color: Colors.ink, width: 12 },
  message: { fontFamily: FontFamily, fontSize: 12, color: Colors.ink, flex: 1 },
  meta:    { fontFamily: FontFamily, fontSize: 11, color: Colors.gray1 },
  empty:   { fontFamily: FontFamily, fontSize: 12, color: Colors.gray2 },
});
```

- [ ] **Step 2: Commit**

```bash
git add components/widgets/RecentCommits.tsx
git commit -m "feat: add RecentCommits widget"
```

---

### Task 15: CiStatus widget

**Files:**
- Create: `components/widgets/CiStatus.tsx`

- [ ] **Step 1: Implement widget**

Create `components/widgets/CiStatus.tsx`:
```tsx
import { StyleSheet, Text, View } from 'react-native';
import type { CiEntry } from '../../hooks/useGitHubData';
import type { CiRunStatus } from '../../types/github';
import { Colors, FontFamily, Spacing } from '../../constants/theme';

const BadgeColor: Record<CiRunStatus, string> = {
  PASS:    Colors.ink,
  FAIL:    Colors.gray1,
  RUNNING: Colors.gray2,
  SKIPPED: Colors.gray3,
};

interface Props {
  ciEntries: CiEntry[];
  style?: object;
}

export function CiStatus({ ciEntries, style }: Props) {
  return (
    <View style={[s.card, style]}>
      <Text style={s.label}>CI / CD</Text>
      {ciEntries.map(({ repo, status }) => {
        const repoName = repo.split('/')[1] ?? repo;
        return (
          <View key={repo} style={s.row}>
            <Text style={s.repo}>▣ {repoName}</Text>
            <View style={[s.badge, { backgroundColor: BadgeColor[status] }]}>
              <Text style={s.badgeText}>{status}</Text>
            </View>
          </View>
        );
      })}
      {ciEntries.length === 0 && <Text style={s.empty}>No repos configured</Text>}
    </View>
  );
}

const s = StyleSheet.create({
  card:      { flex: 1, borderWidth: 1, borderColor: Colors.gray2, padding: Spacing.inner, backgroundColor: '#fff' },
  label:     { fontFamily: FontFamily, fontSize: 11, letterSpacing: 1, color: Colors.gray1, marginBottom: 6 },
  row:       { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 4 },
  repo:      { fontFamily: FontFamily, fontSize: 12, color: Colors.ink, flex: 1 },
  badge:     { paddingHorizontal: 6, paddingVertical: 2 },
  badgeText: { fontFamily: FontFamily, fontSize: 10, color: '#fff' },
  empty:     { fontFamily: FontFamily, fontSize: 12, color: Colors.gray2 },
});
```

- [ ] **Step 2: Commit**

```bash
git add components/widgets/CiStatus.tsx
git commit -m "feat: add CiStatus widget"
```

---

### Task 16: SettingsModal

**Files:**
- Create: `components/settings/SettingsModal.tsx`

- [ ] **Step 1: Implement modal**

Create `components/settings/SettingsModal.tsx`:
```tsx
import { useState } from 'react';
import { Modal, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { Colors, FontFamily } from '../../constants/theme';
import { setToken, setUsername, setWatchedRepos } from '../../services/storage';

interface Props {
  visible: boolean;
  initialToken: string;
  initialUsername: string;
  initialWatchedRepos: string[];
  onSave: (token: string, username: string, watchedRepos: string[]) => void;
}

export function SettingsModal({
  visible, initialToken, initialUsername, initialWatchedRepos, onSave,
}: Props) {
  const [token, setTokenState] = useState(initialToken);
  const [username, setUsernameState] = useState(initialUsername);
  const [repos, setReposState] = useState(initialWatchedRepos.join(', '));

  async function handleSave() {
    const watchedRepos = repos.split(',').map(r => r.trim()).filter(Boolean);
    await Promise.all([setToken(token), setUsername(username), setWatchedRepos(watchedRepos)]);
    onSave(token, username, watchedRepos);
  }

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={s.overlay}>
        <View style={s.dialog}>
          <Text style={s.heading}>SETTINGS</Text>

          <Text style={s.fieldLabel}>GitHub Token (PAT)</Text>
          <TextInput
            style={s.input}
            value={token}
            onChangeText={setTokenState}
            secureTextEntry
            placeholder="ghp_..."
            placeholderTextColor={Colors.gray2}
            autoCorrect={false}
          />

          <Text style={s.fieldLabel}>GitHub Username</Text>
          <TextInput
            style={s.input}
            value={username}
            onChangeText={setUsernameState}
            autoCorrect={false}
            autoCapitalize="none"
            placeholder="your-username"
            placeholderTextColor={Colors.gray2}
          />

          <Text style={s.fieldLabel}>Watched Repos for CI (owner/repo, comma-separated, max 5)</Text>
          <TextInput
            style={s.input}
            value={repos}
            onChangeText={setReposState}
            autoCorrect={false}
            autoCapitalize="none"
            placeholder="user/repo1, user/repo2"
            placeholderTextColor={Colors.gray2}
          />

          <Pressable style={s.saveBtn} onPress={handleSave}>
            <Text style={s.saveBtnText}>SAVE</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

const s = StyleSheet.create({
  overlay:     { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' },
  dialog:      { backgroundColor: Colors.paper, borderWidth: 2, borderColor: Colors.ink, padding: 24, width: 480 },
  heading:     { fontFamily: FontFamily, fontSize: 16, fontWeight: 'bold', letterSpacing: 2, color: Colors.ink, marginBottom: 20 },
  fieldLabel:  { fontFamily: FontFamily, fontSize: 11, letterSpacing: 1, color: Colors.gray1, marginBottom: 4, marginTop: 12 },
  input:       { fontFamily: FontFamily, fontSize: 13, color: Colors.ink, borderWidth: 1, borderColor: Colors.ink, padding: 8, backgroundColor: '#fff' },
  saveBtn:     { marginTop: 20, backgroundColor: Colors.ink, padding: 12, alignItems: 'center' },
  saveBtnText: { fontFamily: FontFamily, fontSize: 13, color: Colors.paper, letterSpacing: 2 },
});
```

- [ ] **Step 2: Commit**

```bash
git add components/settings/SettingsModal.tsx
git commit -m "feat: add SettingsModal component"
```

---

### Task 17: DashboardScreen — wire everything together

**Files:**
- Modify: `app/index.tsx`

- [ ] **Step 1: Replace placeholder with full dashboard**

Replace `app/index.tsx`:
```tsx
import { useEffect, useState } from 'react';
import { SafeAreaView, StyleSheet, View } from 'react-native';
import { useGitHubData } from '../hooks/useGitHubData';
import { useCountdown } from '../hooks/useCountdown';
import { startPoller, POLL_SECONDS } from '../services/poller';
import { getToken, getUsername, getWatchedRepos } from '../services/storage';
import { TopBar } from '../components/layout/TopBar';
import { BottomBar } from '../components/layout/BottomBar';
import { DashboardGrid } from '../components/layout/DashboardGrid';
import { ContributionHeatmap } from '../components/widgets/ContributionHeatmap';
import { PullRequestList } from '../components/widgets/PullRequestList';
import { RepoStats } from '../components/widgets/RepoStats';
import { RecentCommits } from '../components/widgets/RecentCommits';
import { CiStatus } from '../components/widgets/CiStatus';
import { SettingsModal } from '../components/settings/SettingsModal';
import { Colors, Spacing } from '../constants/theme';

export default function DashboardScreen() {
  const [token, setToken]               = useState('');
  const [username, setUsername]         = useState('');
  const [watchedRepos, setWatchedRepos] = useState<string[]>([]);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [ready, setReady]               = useState(false);

  useEffect(() => {
    (async () => {
      const [t, u, r] = await Promise.all([getToken(), getUsername(), getWatchedRepos()]);
      setToken(t ?? '');
      setUsername(u ?? '');
      setWatchedRepos(r);
      setReady(true);
      if (!t || !u) setSettingsOpen(true);
    })();
  }, []);

  const [data, loadData] = useGitHubData(token, username, watchedRepos);
  const refresh = loadData;
  const countdown = useCountdown(POLL_SECONDS);

  useEffect(() => {
    if (!token || !username) return;
    return startPoller(refresh);
  }, [token, username, refresh]);

  const totalForks  = data.repos.reduce((s, r) => s + r.forks_count, 0);
  const openIssues  = data.repos.reduce((s, r) => s + r.open_issues_count, 0);

  return (
    <SafeAreaView style={s.screen}>
      <TopBar
        username={username || '—'}
        lastUpdated={data.lastUpdated}
        onRefresh={refresh}
        onSettingsPress={() => setSettingsOpen(true)}
      />

      <DashboardGrid>
        {/* Row 1 */}
        <ContributionHeatmap events={data.events} style={s.col1} />
        <PullRequestList prs={data.openPRs} style={s.col1} />
        <RepoStats
          profile={data.profile}
          totalStars={data.totalStars}
          totalForks={totalForks}
          openIssues={openIssues}
          style={s.col1}
        />
        {/* Row 2 */}
        <RecentCommits events={data.events} style={s.col2} />
        <CiStatus ciEntries={data.ciEntries} style={s.col1} />
      </DashboardGrid>

      <BottomBar error={data.error} countdown={countdown} />

      {ready && (
        <SettingsModal
          visible={settingsOpen}
          initialToken={token}
          initialUsername={username}
          initialWatchedRepos={watchedRepos}
          onSave={(t, u, r) => {
            setToken(t);
            setUsername(u);
            setWatchedRepos(r);
            setSettingsOpen(false);
            refresh();
          }}
        />
      )}
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  screen: { flex: 1, backgroundColor: Colors.paper, padding: Spacing.screen },
  col1:   { flex: 1 },
  col2:   { flex: 2 },
});
```

- [ ] **Step 2: Run the app and verify end-to-end**

```bash
npx expo start --ios
```

Walk through:
1. First launch: SettingsModal appears (no token stored)
2. Enter a valid GitHub PAT, username, and optionally watched repos → tap SAVE
3. Dashboard loads with real data: heatmap fills with commit squares, PR list shows, CI badges appear
4. Long-press on title → SettingsModal reopens
5. Wait 10 minutes or tap ↻ → data refreshes, "updated HH:MM" timestamp updates
6. Force a network error (airplane mode) → ⚠ error appears in BottomBar, stale data stays visible

- [ ] **Step 3: Run full test suite — confirm nothing broken**

```bash
npx jest
```

Expected: all tests pass

- [ ] **Step 4: Commit**

```bash
git add app/index.tsx
git commit -m "feat: wire DashboardScreen with all widgets, poller, and settings"
```

---

### Task 18: Final cleanup

**Files:**
- Modify: `.gitignore`
- Create: `docs/superpowers/specs/` (already exists)

- [ ] **Step 1: Ensure .gitignore is complete**

Confirm `.gitignore` contains:
```
node_modules/
.expo/
dist/
.superpowers/
*.jks
*.p8
*.p12
*.key
*.mobileprovision
*.orig.*
```

- [ ] **Step 2: Final commit**

```bash
git add .
git commit -m "chore: final cleanup and .gitignore"
```

- [ ] **Step 3: Verify clean build**

```bash
npx jest && npx tsc --noEmit
```

Expected: 0 test failures, 0 TypeScript errors.
