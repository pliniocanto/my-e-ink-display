import { ScrollView, StyleSheet, Text, View } from 'react-native';
import type { BranchEntry } from '../../hooks/useGitHubData';
import { Colors, FontFamily, Spacing } from '../../constants/theme';

interface Props {
  branchEntries: BranchEntry[];
  style?: object;
}

export function BranchList({ branchEntries, style }: Props) {
  const total = branchEntries.reduce((n, e) => n + e.branches.length, 0);

  return (
    <View style={[s.card, style]}>
      <Text style={s.label}>BRANCHES{total > 0 ? ` · ${total}` : ''}</Text>
      <ScrollView showsVerticalScrollIndicator={false}>
        {branchEntries.map(({ repo, branches }) => {
          if (branches.length === 0) return null;
          const repoName = repo.split('/')[1] ?? repo;
          return (
            <View key={repo} style={s.repoBlock}>
              <Text style={s.repoName}>{repoName}</Text>
              {branches.map(b => (
                <View key={b.name} style={s.branchRow}>
                  <Text style={s.bullet}>{b.protected ? '🔒' : '⌥'}</Text>
                  <Text style={s.branchName} numberOfLines={1}>{b.name}</Text>
                </View>
              ))}
            </View>
          );
        })}
        {total === 0 && <Text style={s.empty}>No repos configured</Text>}
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  card:       { flex: 1, borderWidth: 1, borderColor: Colors.gray2, padding: Spacing.inner, backgroundColor: '#fff' },
  label:      { fontFamily: FontFamily, fontSize: 11, letterSpacing: 1, color: Colors.gray1, marginBottom: 6 },
  repoBlock:  { marginBottom: 8 },
  repoName:   { fontFamily: FontFamily, fontSize: 11, color: Colors.gray1, letterSpacing: 1, marginBottom: 2, borderBottomWidth: 1, borderBottomColor: Colors.gray3, paddingBottom: 2 },
  branchRow:  { flexDirection: 'row', alignItems: 'center', paddingVertical: 2, gap: 4 },
  bullet:     { fontSize: 10, width: 16 },
  branchName: { fontFamily: FontFamily, fontSize: 12, color: Colors.ink, flex: 1 },
  empty:      { fontFamily: FontFamily, fontSize: 12, color: Colors.gray2 },
});
