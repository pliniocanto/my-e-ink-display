import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import type { GithubCommit } from '../../types/github';
import { FontFamily, Spacing, widgetCard } from '../../constants/theme';
import { useTheme } from '../../contexts/ThemeContext';
import { toRelativeTime } from '../../utils/transforms';

interface Props {
  commits: GithubCommit[];
  style?: object;
}

export function RecentCommits({ commits, style }: Props) {
  const { colors } = useTheme();
  const router = useRouter();
  const shown = commits.slice(0, 10);

  return (
    <View style={[s.card, widgetCard, { borderColor: colors.gray2, backgroundColor: colors.card }, style]}>
      <Text style={[s.label, { color: colors.gray1 }]}>RECENT COMMITS</Text>
      <ScrollView style={s.list} showsVerticalScrollIndicator={false}>
      {shown.map((c, i) => (
        <Pressable
          key={i}
          style={[s.row, { borderBottomColor: colors.gray3 }]}
          onPress={() => router.push(`/commit/${c.sha}?repo=${encodeURIComponent(c.repository.full_name)}`)}
        >
          <Text style={[s.diamond, { color: colors.ink }]}>◆</Text>
          <Text style={[s.message, { color: colors.ink }]} numberOfLines={1}>{c.commit.message.split('\n')[0]}</Text>
          <Text style={[s.meta, { color: colors.gray1 }]}>{c.repository.name} · {toRelativeTime(c.commit.committer.date)}</Text>
        </Pressable>
      ))}
      {shown.length === 0 && <Text style={[s.empty, { color: colors.gray2 }]}>No recent commits</Text>}
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  card:    { flex: 2, borderWidth: 1, padding: Spacing.inner },
  list:    { flex: 1 },
  label:   { fontFamily: FontFamily, fontSize: 11, letterSpacing: 1, marginBottom: 6 },
  row:     { flexDirection: 'row', alignItems: 'center', borderBottomWidth: 1, paddingVertical: 4, gap: 6 },
  diamond: { fontFamily: FontFamily, fontSize: 10, width: 12 },
  message: { fontFamily: FontFamily, fontSize: 12, flex: 1 },
  meta:    { fontFamily: FontFamily, fontSize: 11 },
  empty:   { fontFamily: FontFamily, fontSize: 12 },
});
