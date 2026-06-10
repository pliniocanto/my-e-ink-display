import { ScrollView, StyleSheet, Text, View } from 'react-native';
import type { GithubPR } from '../../types/github';
import { FontFamily, Spacing } from '../../constants/theme';
import { useTheme } from '../../contexts/ThemeContext';

interface Props {
  prs: GithubPR[];
  style?: object;
}

export function PullRequestList({ prs, style }: Props) {
  const { colors } = useTheme();
  const open  = prs.filter(p => !p.draft);
  const draft = prs.filter(p => p.draft);

  return (
    <View style={[s.card, { borderColor: colors.gray2, backgroundColor: colors.card }, style]}>
      <Text style={[s.label, { color: colors.gray1 }]}>PULL REQUESTS</Text>
      <ScrollView showsVerticalScrollIndicator={false}>
        {prs.map(pr => (
          <View key={`${pr.head.repo?.full_name}-${pr.number}`} style={[s.row, { borderBottomColor: colors.gray3 }]}>
            <Text style={[s.bullet, { color: colors.ink }]}>{pr.draft ? '○' : '●'}</Text>
            <View style={s.body}>
              <Text style={[s.title, { color: colors.ink }]} numberOfLines={1}>{pr.title}</Text>
              <Text style={[s.branch, { color: colors.gray1 }]} numberOfLines={1}>
                {pr.head.ref} → {pr.base.ref}
              </Text>
            </View>
            <Text style={[s.number, { color: colors.gray1 }]}>#{pr.number}</Text>
          </View>
        ))}
        {prs.length === 0 && <Text style={[s.empty, { color: colors.gray2 }]}>No open PRs</Text>}
      </ScrollView>
      <Text style={[s.summary, { color: colors.gray1 }]}>{open.length} open · {draft.length} draft</Text>
    </View>
  );
}

const s = StyleSheet.create({
  card:    { flex: 1, borderWidth: 1, padding: Spacing.inner },
  label:   { fontFamily: FontFamily, fontSize: 11, letterSpacing: 1, marginBottom: 6 },
  row:     { flexDirection: 'row', alignItems: 'center', borderBottomWidth: 1, paddingVertical: 4, gap: 6 },
  bullet:  { fontFamily: FontFamily, fontSize: 12, width: 12 },
  body:    { flex: 1 },
  title:   { fontFamily: FontFamily, fontSize: 12 },
  branch:  { fontFamily: FontFamily, fontSize: 10 },
  number:  { fontFamily: FontFamily, fontSize: 12 },
  empty:   { fontFamily: FontFamily, fontSize: 12, paddingVertical: 4 },
  summary: { fontFamily: FontFamily, fontSize: 11, marginTop: 6 },
});
