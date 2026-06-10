import { useEffect, useState } from 'react';
import { FlatList, Pressable, SafeAreaView, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { getToken, getUsername } from '../services/storage';
import { fetchUserIssues } from '../services/github';
import type { GithubIssue } from '../types/github';
import { toRelativeTime } from '../utils/transforms';
import { Colors, FontFamily, Spacing } from '../constants/theme';

function repoName(repositoryUrl: string): string {
  return repositoryUrl.split('/repos/')[1] ?? repositoryUrl;
}

export default function IssuesScreen() {
  const router = useRouter();
  const [issues, setIssues] = useState<GithubIssue[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const [token, username] = await Promise.all([getToken(), getUsername()]);
        if (!token || !username) throw new Error('Not configured');
        const data = await fetchUserIssues(token, username);
        setIssues(data);
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Failed to load issues');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  return (
    <SafeAreaView style={s.screen}>
      <View style={s.header}>
        <Pressable onPress={() => router.back()} style={s.backBtn}>
          <Text style={s.backText}>← BACK</Text>
        </Pressable>
        <Text style={s.title}>▣ OPEN ISSUES</Text>
        <Text style={s.count}>{issues.length > 0 ? `${issues.length} open` : ''}</Text>
      </View>

      {loading && <Text style={s.status}>Loading...</Text>}
      {error   && <Text style={s.status}>⚠ {error}</Text>}

      <FlatList
        data={issues}
        keyExtractor={i => String(i.number)}
        ItemSeparatorComponent={() => <View style={s.separator} />}
        renderItem={({ item: issue }) => (
          <View style={s.row}>
            <View style={s.rowTop}>
              <Text style={s.issueTitle} numberOfLines={2}>{issue.title}</Text>
              <Text style={s.number}>#{issue.number}</Text>
            </View>
            <Text style={s.repo}>{repoName(issue.repository_url)}</Text>
            <View style={s.meta}>
              {issue.labels.slice(0, 3).map(l => (
                <Text key={l.name} style={s.label}>{l.name}</Text>
              ))}
              <Text style={s.time}>updated {toRelativeTime(issue.updated_at)}</Text>
              {issue.comments > 0 && (
                <Text style={s.comments}>○ {issue.comments}</Text>
              )}
            </View>
          </View>
        )}
      />
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  screen:     { flex: 1, backgroundColor: Colors.paper },
  header:     { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: Spacing.screen, borderBottomWidth: 2, borderBottomColor: Colors.ink },
  backBtn:    { paddingRight: 16 },
  backText:   { fontFamily: FontFamily, fontSize: 12, color: Colors.ink, letterSpacing: 1 },
  title:      { fontFamily: FontFamily, fontSize: 16, fontWeight: 'bold', letterSpacing: 2, color: Colors.ink, flex: 1 },
  count:      { fontFamily: FontFamily, fontSize: 11, color: Colors.gray1 },
  status:     { fontFamily: FontFamily, fontSize: 13, color: Colors.gray1, padding: Spacing.screen },
  separator:  { height: 1, backgroundColor: Colors.gray3 },
  row:        { padding: Spacing.screen, gap: 4 },
  rowTop:     { flexDirection: 'row', alignItems: 'flex-start', gap: 8 },
  issueTitle: { fontFamily: FontFamily, fontSize: 13, fontWeight: 'bold', color: Colors.ink, flex: 1 },
  number:     { fontFamily: FontFamily, fontSize: 12, color: Colors.gray1 },
  repo:       { fontFamily: FontFamily, fontSize: 11, color: Colors.gray1 },
  meta:       { flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap' },
  label:      { fontFamily: FontFamily, fontSize: 10, color: Colors.gray1, borderWidth: 1, borderColor: Colors.gray2, paddingHorizontal: 5, paddingVertical: 1 },
  time:       { fontFamily: FontFamily, fontSize: 11, color: Colors.gray2, marginLeft: 'auto' },
  comments:   { fontFamily: FontFamily, fontSize: 11, color: Colors.gray1 },
});
