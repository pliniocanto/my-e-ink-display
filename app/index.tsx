import { useEffect, useState } from 'react';
import { SafeAreaView, StyleSheet, View } from 'react-native';
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
import { SettingsModal } from '../components/settings/SettingsModal';
import { Colors, Spacing } from '../constants/theme';

export default function DashboardScreen() {
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
    <SafeAreaView style={s.screen}>
      <TopBar
        username={username || '—'}
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
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  screen: { flex: 1, backgroundColor: Colors.paper, padding: Spacing.screen },
  grid:   { flex: 1, flexDirection: 'column', gap: Spacing.gap },
  row:    { flex: 1, flexDirection: 'row', gap: Spacing.gap },
  col1:   { flex: 1 },
  col2:   { flex: 2 },
});
