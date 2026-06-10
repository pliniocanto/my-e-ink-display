import { ScrollView, StyleSheet, Text, View } from 'react-native';
import type { GithubPR } from '../../types/github';
import { Colors, FontFamily, Spacing } from '../../constants/theme';

interface Props {
  prs: GithubPR[];
  style?: object;
}

export function PullRequestList({ prs, style }: Props) {
  const open  = prs.filter(p => !p.draft);
  const draft = prs.filter(p => p.draft);

  return (
    <View style={[s.card, style]}>
      <Text style={s.label}>PULL REQUESTS</Text>
      <ScrollView showsVerticalScrollIndicator={false}>
        {prs.map(pr => (
          <View key={`${pr.head.repo?.full_name}-${pr.number}`} style={s.row}>
            <Text style={s.bullet}>{pr.draft ? '○' : '●'}</Text>
            <View style={s.body}>
              <Text style={s.title} numberOfLines={1}>{pr.title}</Text>
              <Text style={s.branch} numberOfLines={1}>
                {pr.head.ref} → {pr.base.ref}
              </Text>
            </View>
            <Text style={s.number}>#{pr.number}</Text>
          </View>
        ))}
        {prs.length === 0 && <Text style={s.empty}>No open PRs</Text>}
      </ScrollView>
      <Text style={s.summary}>{open.length} open · {draft.length} draft</Text>
    </View>
  );
}

const s = StyleSheet.create({
  card:    { flex: 1, borderWidth: 1, borderColor: Colors.gray2, padding: Spacing.inner, backgroundColor: '#fff' },
  label:   { fontFamily: FontFamily, fontSize: 11, letterSpacing: 1, color: Colors.gray1, marginBottom: 6 },
  row:     { flexDirection: 'row', alignItems: 'center', borderBottomWidth: 1, borderBottomColor: Colors.gray3, paddingVertical: 4, gap: 6 },
  bullet:  { fontFamily: FontFamily, fontSize: 12, color: Colors.ink, width: 12 },
  body:    { flex: 1 },
  title:   { fontFamily: FontFamily, fontSize: 12, color: Colors.ink },
  branch:  { fontFamily: FontFamily, fontSize: 10, color: Colors.gray1 },
  number:  { fontFamily: FontFamily, fontSize: 12, color: Colors.gray1 },
  empty:   { fontFamily: FontFamily, fontSize: 12, color: Colors.gray2, paddingVertical: 4 },
  summary: { fontFamily: FontFamily, fontSize: 11, color: Colors.gray1, marginTop: 6 },
});
