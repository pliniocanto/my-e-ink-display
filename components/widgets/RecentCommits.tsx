import { StyleSheet, Text, View } from 'react-native';
import type { GithubCommit } from '../../types/github';
import { Colors, FontFamily, Spacing } from '../../constants/theme';
import { toRelativeTime } from '../../utils/transforms';

interface Props {
  commits: GithubCommit[];
  style?: object;
}

export function RecentCommits({ commits, style }: Props) {
  const shown = commits.slice(0, 5);

  return (
    <View style={[s.card, style]}>
      <Text style={s.label}>RECENT COMMITS</Text>
      {shown.map((c, i) => (
        <View key={i} style={s.row}>
          <Text style={s.diamond}>◆</Text>
          <Text style={s.message} numberOfLines={1}>{c.commit.message.split('\n')[0]}</Text>
          <Text style={s.meta}>{c.repository.name} · {toRelativeTime(c.commit.committer.date)}</Text>
        </View>
      ))}
      {shown.length === 0 && <Text style={s.empty}>No recent commits</Text>}
    </View>
  );
}

const s = StyleSheet.create({
  card:    { flex: 2, borderWidth: 1, borderColor: Colors.gray2, padding: Spacing.inner, backgroundColor: '#fff' },
  label:   { fontFamily: FontFamily, fontSize: 11, letterSpacing: 1, color: Colors.gray1, marginBottom: 6 },
  row:     { flexDirection: 'row', alignItems: 'center', borderBottomWidth: 1, borderBottomColor: Colors.gray3, paddingVertical: 4, gap: 6 },
  diamond: { fontFamily: FontFamily, fontSize: 10, color: Colors.ink, width: 12 },
  message: { fontFamily: FontFamily, fontSize: 12, color: Colors.ink, flex: 1 },
  meta:    { fontFamily: FontFamily, fontSize: 11, color: Colors.gray1 },
  empty:   { fontFamily: FontFamily, fontSize: 12, color: Colors.gray2 },
});
