import { useEffect, useState } from 'react';
import { FlatList, Pressable, SafeAreaView, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { getToken } from '../services/storage';
import { fetchUserIssues } from '../services/github';
import type { GithubIssue } from '../types/github';
import { toRelativeTime } from '../utils/transforms';
import { FontFamily, Spacing } from '../constants/theme';
import { useTheme } from '../contexts/ThemeContext';

function repoName(repositoryUrl: string): string {
  return repositoryUrl.split('/repos/')[1] ?? repositoryUrl;
}

export default function IssuesScreen() {
  const { colors } = useTheme();
  const router = useRouter();
  const [issues, setIssues] = useState<GithubIssue[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const token = await getToken();
        if (!token) throw new Error('Not configured');
        const data = await fetchUserIssues(token);
        setIssues(data);
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Failed to load issues');
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
        <Text style={[s.title, { color: colors.ink }]}>▣ OPEN ISSUES</Text>
        <Text style={[s.count, { color: colors.gray1 }]}>{issues.length > 0 ? `${issues.length} open` : ''}</Text>
      </View>

      {loading && <Text style={[s.status, { color: colors.gray1 }]}>Loading...</Text>}
      {error   && <Text style={[s.status, { color: colors.ink }]}>⚠ {error}</Text>}

      <FlatList
        data={issues}
        keyExtractor={i => String(i.number)}
        ItemSeparatorComponent={() => <View style={[s.separator, { backgroundColor: colors.gray3 }]} />}
        renderItem={({ item: issue }) => (
          <View style={s.row}>
            <View style={s.rowTop}>
              <Text style={[s.issueTitle, { color: colors.ink }]} numberOfLines={2}>{issue.title}</Text>
              <Text style={[s.number, { color: colors.gray1 }]}>#{issue.number}</Text>
            </View>
            <Text style={[s.repo, { color: colors.gray1 }]}>{repoName(issue.repository_url)}</Text>
            <View style={s.meta}>
              {issue.labels.slice(0, 3).map(l => (
                <Text key={l.name} style={[s.label, { color: colors.gray1, borderColor: colors.gray2 }]}>{l.name}</Text>
              ))}
              <Text style={[s.time, { color: colors.gray2 }]}>updated {toRelativeTime(issue.updated_at)}</Text>
              {issue.comments > 0 && (
                <Text style={[s.comments, { color: colors.gray1 }]}>○ {issue.comments}</Text>
              )}
            </View>
          </View>
        )}
      />
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  screen:     { flex: 1 },
  header:     { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: Spacing.screen, borderBottomWidth: 2 },
  backBtn:    { paddingRight: 16 },
  backText:   { fontFamily: FontFamily, fontSize: 12, letterSpacing: 1 },
  title:      { fontFamily: FontFamily, fontSize: 16, fontWeight: 'bold', letterSpacing: 2, flex: 1 },
  count:      { fontFamily: FontFamily, fontSize: 11 },
  status:     { fontFamily: FontFamily, fontSize: 13, padding: Spacing.screen },
  separator:  { height: 1 },
  row:        { padding: Spacing.screen, gap: 4 },
  rowTop:     { flexDirection: 'row', alignItems: 'flex-start', gap: 8 },
  issueTitle: { fontFamily: FontFamily, fontSize: 13, fontWeight: 'bold', flex: 1 },
  number:     { fontFamily: FontFamily, fontSize: 12 },
  repo:       { fontFamily: FontFamily, fontSize: 11 },
  meta:       { flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap' },
  label:      { fontFamily: FontFamily, fontSize: 10, borderWidth: 1, paddingHorizontal: 5, paddingVertical: 1 },
  time:       { fontFamily: FontFamily, fontSize: 11, marginLeft: 'auto' },
  comments:   { fontFamily: FontFamily, fontSize: 11 },
});
