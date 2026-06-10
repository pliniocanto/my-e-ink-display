import { StyleSheet, Text, View } from 'react-native';
import type { GithubCommit } from '../../types/github';
import { FontFamily, Spacing } from '../../constants/theme';
import { useTheme } from '../../contexts/ThemeContext';
import { toRelativeTime } from '../../utils/transforms';

interface Props {
  commits: GithubCommit[];
  style?: object;
}

export function RecentCommits({ commits, style }: Props) {
  const { colors } = useTheme();
  const shown = commits.slice(0, 10);

  return (
    <View style={[s.card, { borderColor: colors.gray2, backgroundColor: colors.card }, style]}>
      <Text style={[s.label, { color: colors.gray1 }]}>RECENT COMMITS</Text>
      {shown.map((c, i) => (
        <View key={i} style={[s.row, { borderBottomColor: colors.gray3 }]}>
          <Text style={[s.diamond, { color: colors.ink }]}>◆</Text>
          <Text style={[s.message, { color: colors.ink }]} numberOfLines={1}>{c.commit.message.split('\n')[0]}</Text>
          <Text style={[s.meta, { color: colors.gray1 }]}>{c.repository.name} · {toRelativeTime(c.commit.committer.date)}</Text>
        </View>
      ))}
      {shown.length === 0 && <Text style={[s.empty, { color: colors.gray2 }]}>No recent commits</Text>}
    </View>
  );
}

const s = StyleSheet.create({
  card:    { flex: 2, borderWidth: 1, padding: Spacing.inner },
  label:   { fontFamily: FontFamily, fontSize: 11, letterSpacing: 1, marginBottom: 6 },
  row:     { flexDirection: 'row', alignItems: 'center', borderBottomWidth: 1, paddingVertical: 4, gap: 6 },
  diamond: { fontFamily: FontFamily, fontSize: 10, width: 12 },
  message: { fontFamily: FontFamily, fontSize: 12, flex: 1 },
  meta:    { fontFamily: FontFamily, fontSize: 11 },
  empty:   { fontFamily: FontFamily, fontSize: 12 },
});
