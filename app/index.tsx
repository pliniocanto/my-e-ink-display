import { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useGitHubData } from '../hooks/useGitHubData';
import { useCountdown } from '../hooks/useCountdown';
import { startPoller, POLL_SECONDS } from '../services/poller';
import { getToken, getUsername, getWatchedRepos } from '../services/storage';
import { TopBar } from '../components/layout/TopBar';
import { BottomBar } from '../components/layout/BottomBar';
import { ContributionHeatmap } from '../components/widgets/ContributionHeatmap';
import { PullRequestList } from '../components/widgets/PullRequestList';
import { RepoStats } from '../components/widgets/RepoStats';
import { RecentCommits } from '../components/widgets/RecentCommits';
import { CiStatus } from '../components/widgets/CiStatus';
import { BranchList } from '../components/widgets/BranchList';
import { SettingsModal } from '../components/settings/SettingsModal';
import { Spacing } from '../constants/theme';
import { useTheme } from '../contexts/ThemeContext';

export default function DashboardScreen() {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const [token, setTokenState]               = useState('');
  const [username, setUsernameState]         = useState('');
  const [watchedRepos, setWatchedReposState] = useState<string[]>([]);
  const [settingsOpen, setSettingsOpen]      = useState(false);
  const [ready, setReady]                    = useState(false);

  useEffect(() => {
    (async () => {
      const [t, u, r] = await Promise.all([getToken(), getUsername(), getWatchedRepos()]);
      setTokenState(t ?? '');
      setUsernameState(u ?? '');
      setWatchedReposState(r);
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
    <View
      style={[
        s.screen,
        {
          backgroundColor: colors.paper,
          paddingTop: insets.top + Spacing.screen,
          paddingBottom: insets.bottom + Spacing.screen,
          paddingLeft: insets.left + Spacing.screen,
          paddingRight: insets.right + Spacing.screen,
        },
      ]}
    >
      <TopBar
        username={username || '—'}
        avatarUrl={data.profile?.avatar_url}
        lastUpdated={data.lastUpdated}
        onRefresh={refresh}
        onSettingsPress={() => setSettingsOpen(true)}
      />

      <View style={s.grid}>
        {/* Top row: compact widgets */}
        <View style={s.row}>
          <ContributionHeatmap commits={data.commits} style={s.col1} />
          <RepoStats
            profile={data.profile}
            totalStars={data.totalStars}
            totalForks={totalForks}
            openIssues={openIssues}
            style={s.col1}
          />
          <BranchList branchEntries={data.branchEntries} style={s.col1} />
          <CiStatus ciEntries={data.ciEntries} style={s.col1} />
        </View>
        {/* Bottom row: wide text widgets */}
        <View style={s.row}>
          <PullRequestList prs={data.openPRs} style={s.col1} />
          <RecentCommits commits={data.commits} style={s.col2} />
        </View>
      </View>

      <BottomBar error={data.error} countdown={countdown} />

      {ready && (
        <SettingsModal
          visible={settingsOpen}
          initialToken={token}
          initialUsername={username}
          initialWatchedRepos={watchedRepos}
          onSave={(t, u, r) => {
            setTokenState(t);
            setUsernameState(u);
            setWatchedReposState(r);
            setSettingsOpen(false);
            refresh();
          }}
        />
      )}
    </View>
  );
}

const s = StyleSheet.create({
  screen: { flex: 1, overflow: 'hidden' },
  grid:   { flex: 1, flexDirection: 'column', gap: Spacing.gap, minHeight: 0 },
  row:    { flex: 1, flexDirection: 'row', gap: Spacing.gap, minHeight: 0, minWidth: 0 },
  col1:   { flex: 1, minWidth: 0, minHeight: 0 },
  col2:   { flex: 2, minWidth: 0, minHeight: 0 },
});
