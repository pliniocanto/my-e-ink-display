<div align="center">

# ▣ GitHub E-Ink Dashboard

**A React Native app that turns your iPad or Android tablet into a always-on GitHub activity display — styled to look and feel like a physical e-ink screen.**

[![React Native](https://img.shields.io/badge/React%20Native-Expo%20SDK%2056-000000?style=flat-square&logo=expo)](https://expo.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-strict-3178C6?style=flat-square&logo=typescript)](https://www.typescriptlang.org)
[![License](https://img.shields.io/badge/license-MIT-gray?style=flat-square)](LICENSE)
[![Tests](https://img.shields.io/badge/tests-30%20passing-success?style=flat-square)](/)

</div>

---

## What is this?

This is a passive dashboard — no interactions, no notifications, no noise. You prop your tablet on your desk and it silently shows your GitHub activity, refreshing every 10 minutes like a real e-ink device would.

The aesthetic is intentional: **grayscale palette, monospaced font, sharp borders, zero animations**. It looks like paper.

---

## Features

Light theme
<img width="1275" height="796" alt="image" src="https://github.com/user-attachments/assets/1a1569c9-c542-4da4-8bec-4365fa9b41df" />

Dark theme
<img width="1269" height="793" alt="image" src="https://github.com/user-attachments/assets/02112996-ad5a-4c23-8b3f-514c2400f0f1" />


### Widgets

| Widget | Description |
|--------|-------------|
| **Contribution Heatmap** | Last 30 days of commits, rendered as a grayscale grid |
| **Repo Stats** | Public repos, open issues, total stars, forks — tap to drill down |
| **Branches** | All branches across your watched repos, with protected branch indicator |
| **CI / CD** | Latest workflow run status per watched repo |
| **Pull Requests** | Open and draft PRs with source → target branch |
| **Recent Commits** | Last 5 commits across all repos and branches, including private org repos and co-authored commits |

### Navigation

- **REPOS ↗** — tap to open a full repository list with language, description, and stats
- **ISSUES ↗** — tap to open all your open issues across every accessible repo

### Themes

Switch between **Light** (paper) and **Dark** (charcoal) in Settings. Preference persists across sessions.

---

## Tech Stack

| Concern | Choice |
|---------|--------|
| Framework | React Native via **Expo SDK 56** |
| Language | **TypeScript** (strict mode) |
| Router | **Expo Router** (file-based) |
| Font | **SpaceMono** — monospaced, no serifs |
| Storage | `expo-secure-store` (token encrypted at rest) |
| Orientation | `expo-screen-orientation` (landscape locked) |
| API | **GitHub REST API v3** — no GraphQL |
| State | React `useState` / `useReducer` — no external store |
| Theming | React Context — `ThemeProvider` wraps the full tree |
| Tests | **Jest** — 30 unit tests covering services and transforms |

---

## Getting Started

### Prerequisites

- [Node.js](https://nodejs.org) 18+
- [Expo CLI](https://docs.expo.dev/get-started/installation/) (`npm install -g expo-cli`)
- A physical iPad or Android tablet (or a simulator)
- A [GitHub Personal Access Token](https://github.com/settings/tokens) (classic) with scopes:
  - `repo` — read private repos and events
  - `read:user` — read profile data
  - `workflow` — read Actions workflow runs

### Installation

```bash
git clone https://github.com/your-username/my-e-ink-display.git
cd my-e-ink-display
npm install
```

### Running

```bash
# iOS (iPad)
npx expo start --ios

# Android tablet
npx expo start --android
```

On first launch, the **Settings** modal will appear automatically.

---

## Configuration

Open Settings by tapping **⚙ CONFIG** in the top bar (or long-pressing the title).

| Field | Description |
|-------|-------------|
| **GitHub Token** | Your PAT — stored encrypted via device keychain |
| **GitHub Username** | Your GitHub login (e.g. `pliniocanto`) |
| **Watched Repos** | Comma-separated `owner/repo` list (max 5) — drives Branches, CI/CD, and deep commit fetching |
| **Theme** | `LIGHT` (e-ink paper) or `DARK` (charcoal) |

> **Tip:** Add your most active private repos to Watched Repos. The app fetches commits directly from each branch of watched repos, which catches private org repos and co-authored commits that the GitHub Search API misses.

---

## How Commits Are Fetched

The dashboard uses two strategies and merges the results:

1. **GitHub Search API** — `GET /search/commits?q=author:{username}` — broad coverage across public repos
2. **Per-branch fetch** — `GET /repos/{owner}/{repo}/commits?sha={branch}` for each branch of each watched repo — catches private org repos, co-authored commits, and commits where you are the committer but not the git author

Results are deduplicated by SHA and sorted by date.

---

## Project Structure

```
app/
  _layout.tsx       # Root: ThemeProvider, landscape lock, font load
  index.tsx         # Dashboard screen
  repos.tsx         # Repository list screen
  issues.tsx        # Open issues screen

components/
  layout/           # TopBar, BottomBar, DashboardGrid
  widgets/          # ContributionHeatmap, PullRequestList, RepoStats,
                    # RecentCommits, CiStatus, BranchList
  settings/         # SettingsModal

contexts/
  ThemeContext.tsx   # Light/dark theme provider

hooks/
  useGitHubData.ts  # Orchestrates all GitHub fetches
  useCountdown.ts   # Next-refresh countdown

services/
  github.ts         # GitHub REST API calls
  storage.ts        # SecureStore wrapper
  poller.ts         # 10-minute interval scheduler

utils/
  transforms.ts     # Pure functions: heatmap intensity, relative time, etc.
```

---

## Running Tests

```bash
npx jest
```

30 tests covering data transforms, the GitHub API service, and the storage service.

---

## Design Decisions

**No GraphQL.** The REST API covers everything needed and keeps the dependency surface small.

**No external state manager.** The data model is simple enough for local React state. Adding Redux or Zustand would be over-engineering.

**Single screen.** The dashboard is a passive display, not a tool. There is no navigation beyond the Settings modal and the two drill-down screens (repos, issues).

**Polling, not websockets.** Real e-ink hardware refreshes on a schedule. The 10-minute interval matches that behavior and stays within GitHub's rate limits.

---

## License

MIT — do whatever you want with it.

---

<div align="center">
Built with React Native + Expo · Styled like paper · Powered by GitHub REST API
</div>
