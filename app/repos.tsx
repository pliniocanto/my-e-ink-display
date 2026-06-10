import { useEffect, useState } from 'react';
import { FlatList, Pressable, SafeAreaView, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { getToken, getUsername } from '../services/storage';
import { fetchUserRepos } from '../services/github';
import type { GithubRepo } from '../types/github';
import { toRelativeTime } from '../utils/transforms';
import { Colors, FontFamily, Spacing } from '../constants/theme';

export default function ReposScreen() {
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
    <SafeAreaView style={s.screen}>
      {/* Header */}
      <View style={s.header}>
        <Pressable onPress={() => router.back()} style={s.backBtn}>
          <Text style={s.backText}>← BACK</Text>
        </Pressable>
        <Text style={s.title}>▣ REPOSITORIES</Text>
        <Text style={s.count}>{repos.length > 0 ? `${repos.length} repos` : ''}</Text>
      </View>

      {loading && <Text style={s.status}>Loading...</Text>}
      {error   && <Text style={s.status}>⚠ {error}</Text>}

      <FlatList
        data={repos}
        keyExtractor={r => r.full_name}
        ItemSeparatorComponent={() => <View style={s.separator} />}
        renderItem={({ item: r }) => (
          <View style={s.row}>
            <View style={s.rowTop}>
              <Text style={s.repoName} numberOfLines={1}>
                {r.private ? '🔒 ' : '⌥ '}{r.full_name}
              </Text>
              <View style={s.badges}>
                {r.fork && <Text style={s.badge}>FORK</Text>}
                {r.language ? <Text style={s.badge}>{r.language}</Text> : null}
              </View>
            </View>
            {r.description ? (
              <Text style={s.description} numberOfLines={2}>{r.description}</Text>
            ) : null}
            <View style={s.stats}>
              <Text style={s.stat}>★ {r.stargazers_count}</Text>
              <Text style={s.stat}>⑂ {r.forks_count}</Text>
              <Text style={s.stat}>○ {r.open_issues_count}</Text>
              <Text style={[s.stat, s.pushed]}>pushed {toRelativeTime(r.pushed_at)}</Text>
            </View>
          </View>
        )}
      />
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  screen:      { flex: 1, backgroundColor: Colors.paper },
  header:      { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: Spacing.screen, borderBottomWidth: 2, borderBottomColor: Colors.ink },
  backBtn:     { paddingRight: 16 },
  backText:    { fontFamily: FontFamily, fontSize: 12, color: Colors.ink, letterSpacing: 1 },
  title:       { fontFamily: FontFamily, fontSize: 16, fontWeight: 'bold', letterSpacing: 2, color: Colors.ink, flex: 1 },
  count:       { fontFamily: FontFamily, fontSize: 11, color: Colors.gray1 },
  status:      { fontFamily: FontFamily, fontSize: 13, color: Colors.gray1, padding: Spacing.screen },
  separator:   { height: 1, backgroundColor: Colors.gray3 },
  row:         { padding: Spacing.screen, gap: 4 },
  rowTop:      { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  repoName:    { fontFamily: FontFamily, fontSize: 14, fontWeight: 'bold', color: Colors.ink, flex: 1 },
  badges:      { flexDirection: 'row', gap: 6 },
  badge:       { fontFamily: FontFamily, fontSize: 10, color: Colors.gray1, borderWidth: 1, borderColor: Colors.gray2, paddingHorizontal: 5, paddingVertical: 1 },
  description: { fontFamily: FontFamily, fontSize: 12, color: Colors.gray1, lineHeight: 16 },
  stats:       { flexDirection: 'row', gap: 16, marginTop: 2 },
  stat:        { fontFamily: FontFamily, fontSize: 11, color: Colors.ink },
  pushed:      { color: Colors.gray1, marginLeft: 'auto' },
});
