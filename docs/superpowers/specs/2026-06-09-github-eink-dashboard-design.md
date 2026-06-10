# GitHub E-Ink Dashboard — Design Spec

**Date:** 2026-06-09
**Status:** approved

---

## Overview

A React Native app for iPad and Android tablets that simulates a physical e-ink display showing a GitHub activity dashboard. The screen is always-on, never scrolls, and refreshes on a fixed interval — mimicking the behavior and aesthetic of real e-ink hardware.

---

## Goals

- Display a personal GitHub dashboard that fits entirely on one tablet screen (no scroll)
- Visually simulate an e-ink display: grayscale palette, monospaced font, no animations
- Work on both iOS (iPad) and Android tablets with full parity
- Require minimal interaction — the app is a passive display, not a tool

---

## Non-Goals

- No multi-user support
- No real-time/live data (polling only)
- No navigation beyond a single settings modal
- No GraphQL (REST API only for MVP)
- No offline-first caching beyond the last successful fetch

---

## Architecture

```
app/
  _layout.tsx           # Expo Router root, landscape lock, status bar hide
  index.tsx             # Single screen: DashboardScreen

components/
  widgets/
    ContributionHeatmap.tsx
    PullRequestList.tsx
    RepoStats.tsx
    RecentCommits.tsx
    CiStatus.tsx
  layout/
    DashboardGrid.tsx   # 3-column grid, fills viewport
    TopBar.tsx          # Username, last-updated, manual refresh button
    BottomBar.tsx       # Stack info, next-refresh countdown

services/
  github.ts             # All GitHub REST API calls
  storage.ts            # SecureStore wrapper (token + config)
  poller.ts             # Interval-based refresh logic

hooks/
  useGitHubData.ts      # Orchestrates fetch + state for all widgets
  useCountdown.ts       # Drives the next-refresh countdown display

constants/
  theme.ts              # E-ink color palette + typography tokens
```

### Data flow

1. App boots → reads token from SecureStore
2. If no token → show settings modal (blocking)
3. Token present → `useGitHubData` fetches all 5 data sources in parallel
4. Data stored in local React state; widgets render from that state
5. `poller.ts` fires every 10 minutes → re-triggers fetch
6. Manual refresh button in TopBar triggers immediate fetch

---

## Visual Design

### E-Ink Palette

| Token | Hex | Usage |
|-------|-----|-------|
| `paper` | `#f5f0e8` | Screen background |
| `ink` | `#1a1a1a` | Primary text, borders |
| `gray1` | `#888888` | Secondary text, labels |
| `gray2` | `#aaaaaa` | Inactive items, grid lines |
| `gray3` | `#dddddd` | Heatmap low, disabled |

All values defined in `constants/theme.ts`. No colors outside this palette.

### Typography

- Font family: `SpaceMono` (bundled via `expo-font`) for all text
- No italic, no color text, no shadows

### Layout

- Orientation: landscape locked via `expo-screen-orientation`
- Status bar: hidden
- Grid: 3 equal columns, 2 rows, 12px gap, 16px screen padding
- No `ScrollView` anywhere — layout must fit the viewport exactly

### Animations

None. `useNativeDriver` is irrelevant — no transitions, no fades, no loading spinners. A static "loading…" text placeholder is shown while data fetches.

---

## Widgets

### 1. ContributionHeatmap (col 1, row 1)

- Source: `GET /users/{user}/events` — derive contribution count per day
- Displays last 30 days as a 15×2 grid of colored cells
- 5 intensity levels mapped to the 5 palette grays
- Shows total commit count below the grid

### 2. PullRequestList (col 2, row 1)

- Source: `GET /search/issues?q=is:pr+author:{user}+is:open`
- Shows up to 4 PRs: title truncated to ~35 chars, PR number, open/draft indicator
- Below the list: summary line "N open · M draft"

### 3. RepoStats (col 3, row 1)

- Source: `GET /users/{user}` (single call)
- Displays 4 counters in a 2×2 sub-grid: Repos, Issues, Stars, Forks
- Stars = sum across public repos (requires `GET /users/{user}/repos`)

### 4. RecentCommits (col 1–2, row 2)

- Source: `GET /users/{user}/events` (type: PushEvent) — same call as heatmap, reused
- Shows last 5 commits: message truncated to ~50 chars, repo name, relative time
- Spans 2 columns to give commit messages room to breathe

### 5. CiStatus (col 3, row 2)

- Source: `GET /repos/{user}/{repo}/actions/runs?per_page=1` for each watched repo
- Watched repos: configurable in settings (default: all repos with recent activity, max 5)
- Shows repo name + status badge: PASS / FAIL / RUNNING / SKIPPED
- Badge background maps to palette: PASS=`ink`, FAIL=`gray1`, RUNNING=`gray2`, SKIPPED=`gray3`

---

## Services

### `services/github.ts`

Thin wrapper around `fetch`. Exports one function per data source. All calls include `Authorization: Bearer {token}` and `X-GitHub-Api-Version: 2022-11-28`. Throws on non-2xx. No retry logic in MVP.

```ts
export async function fetchUserProfile(token: string, username: string): Promise<GithubUser>
export async function fetchUserEvents(token: string, username: string): Promise<GithubEvent[]>
export async function fetchOpenPRs(token: string, username: string): Promise<GithubPR[]>
export async function fetchUserRepos(token: string, username: string): Promise<GithubRepo[]>
export async function fetchLatestRun(token: string, owner: string, repo: string): Promise<GithubRun>
```

### `services/storage.ts`

Wraps `expo-secure-store`. Keys:
- `github_token` — PAT string
- `github_username` — cached username
- `watched_repos` — JSON array of `"owner/repo"` strings

### `services/poller.ts`

Sets up a `setInterval` for 10 minutes. Returns a cleanup function for use in `useEffect`. Exposes `triggerNow()` for the manual refresh button.

---

## Settings Modal

Triggered by a long-press on the TopBar title (not a visible button — keeps the UI clean).

Fields:
- **GitHub Token** — text input (obscured), saved to SecureStore on confirm
- **GitHub Username** — text input
- **Watched Repos for CI** — comma-separated `owner/repo` list, max 5

No cancel button — changes apply on "Save". Modal closes and triggers an immediate refresh.

---

## Authentication

Personal Access Token (classic) with scopes: `repo`, `read:user`, `workflow`. The app stores it in `expo-secure-store` (encrypted at rest via device keychain/keystore). The token never leaves the device beyond GitHub API calls.

---

## Tech Stack

| Concern | Choice |
|---------|--------|
| Framework | React Native via Expo SDK 52 |
| Router | Expo Router (file-based) |
| Language | TypeScript (strict) |
| State | React `useState` / `useReducer` — no external store |
| Storage | `expo-secure-store` |
| Orientation | `expo-screen-orientation` |
| Font | `expo-font` + SpaceMono |
| API | GitHub REST v3 via native `fetch` |
| Linting | ESLint + Prettier (Expo defaults) |

No Redux, no Zustand, no React Query — data model is simple enough for local state.

---

## Error Handling

- API error during fetch: keep previous data visible, show "⚠ update failed" in BottomBar
- No token configured: show settings modal, block dashboard
- Rate limit hit (403): show "rate limited — next refresh in N min" in BottomBar, skip polling until window resets
- Network offline: same as API error — keep stale data, show warning

---

## Testing

- Unit tests for `services/github.ts` with mocked `fetch` responses
- Unit tests for data-transform helpers (heatmap cell intensity, relative time)
- No UI snapshot tests — the layout is simple and visual correctness is verified by running the app

---

## Out of Scope (future)

- Multiple profiles / accounts
- Dark mode (ironic for an e-ink app)
- Notifications
- iPad split-screen support
- Portrait mode
