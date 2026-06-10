import { useEffect, useState } from 'react';
import { FlatList, Pressable, SafeAreaView, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { getToken, getUsername } from '../services/storage';
import { fetchUserRepos } from '../services/github';
import type { GithubRepo } from '../types/github';
import { toRelativeTime } from '../utils/transforms';
import { FontFamily, Spacing } from '../constants/theme';
import { useTheme } from '../contexts/ThemeContext';

export default function ReposScreen() {
  const { colors } = useTheme();
  const router = useRouter();
  const [repos, setRepos] = useState<GithubRepo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const [token, username] = await Promise.all([getToken(), getUsername()]);
        if (!token || !username) throw new Error('Not configured');
        const data = await fetchUserRepos(token, username);
        setRepos(data);
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Failed to load repos');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  return (
    <SafeAreaView style={[s.screen, { backgroundColor: colors.paper }]}>
      <View style={[s.header, { borderBottomColor: colors.ink }]}>
        <Pressable onPress={() => router.back()} style={s.backBtn}>
          <Text style={[s.backText, { color: colors.ink }]}>← BACK</Text>
        </Pressable>
        <Text style={[s.title, { color: colors.ink }]}>▣ REPOSITORIES</Text>
        <Text style={[s.count, { color: colors.gray1 }]}>{repos.length > 0 ? `${repos.length} repos` : ''}</Text>
      </View>

      {loading && <Text style={[s.status, { color: colors.gray1 }]}>Loading...</Text>}
      {error   && <Text style={[s.status, { color: colors.ink }]}>⚠ {error}</Text>}

      <FlatList
        data={repos}
        keyExtractor={r => r.full_name}
        ItemSeparatorComponent={() => <View style={[s.separator, { backgroundColor: colors.gray3 }]} />}
        renderItem={({ item: r }) => (
          <View style={s.row}>
            <View style={s.rowTop}>
              <Text style={[s.repoName, { color: colors.ink }]} numberOfLines={1}>
                {r.private ? '🔒 ' : '⌥ '}{r.full_name}
              </Text>
              <View style={s.badges}>
                {r.fork && <Text style={[s.badge, { color: colors.gray1, borderColor: colors.gray2 }]}>FORK</Text>}
                {r.language ? <Text style={[s.badge, { color: colors.gray1, borderColor: colors.gray2 }]}>{r.language}</Text> : null}
              </View>
            </View>
            {r.description ? (
              <Text style={[s.description, { color: colors.gray1 }]} numberOfLines={2}>{r.description}</Text>
            ) : null}
            <View style={s.stats}>
              <Text style={[s.stat, { color: colors.ink }]}>★ {r.stargazers_count}</Text>
              <Text style={[s.stat, { color: colors.ink }]}>⑂ {r.forks_count}</Text>
              <Text style={[s.stat, { color: colors.ink }]}>○ {r.open_issues_count}</Text>
              <Text style={[s.stat, s.pushed, { color: colors.gray1 }]}>pushed {toRelativeTime(r.pushed_at)}</Text>
            </View>
          </View>
        )}
      />
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  screen:      { flex: 1 },
  header:      { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: Spacing.screen, borderBottomWidth: 2 },
  backBtn:     { paddingRight: 16 },
  backText:    { fontFamily: FontFamily, fontSize: 12, letterSpacing: 1 },
  title:       { fontFamily: FontFamily, fontSize: 16, fontWeight: 'bold', letterSpacing: 2, flex: 1 },
  count:       { fontFamily: FontFamily, fontSize: 11 },
  status:      { fontFamily: FontFamily, fontSize: 13, padding: Spacing.screen },
  separator:   { height: 1 },
  row:         { padding: Spacing.screen, gap: 4 },
  rowTop:      { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  repoName:    { fontFamily: FontFamily, fontSize: 14, fontWeight: 'bold', flex: 1 },
  badges:      { flexDirection: 'row', gap: 6 },
  badge:       { fontFamily: FontFamily, fontSize: 10, borderWidth: 1, paddingHorizontal: 5, paddingVertical: 1 },
  description: { fontFamily: FontFamily, fontSize: 12, lineHeight: 16 },
  stats:       { flexDirection: 'row', gap: 16, marginTop: 2 },
  stat:        { fontFamily: FontFamily, fontSize: 11 },
  pushed:      { marginLeft: 'auto' },
});
