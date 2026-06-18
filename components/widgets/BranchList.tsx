import { ScrollView, StyleSheet, Text, View } from 'react-native';
import type { BranchEntry } from '../../hooks/useGitHubData';
import { FontFamily, Spacing, widgetCard } from '../../constants/theme';
import { useTheme } from '../../contexts/ThemeContext';

interface Props {
  branchEntries: BranchEntry[];
  style?: object;
}

export function BranchList({ branchEntries, style }: Props) {
  const { colors } = useTheme();
  const total = branchEntries.reduce((n, e) => n + e.branches.length, 0);

  return (
    <View style={[s.card, widgetCard, { borderColor: colors.gray2, backgroundColor: colors.card }, style]}>
      <Text style={[s.label, { color: colors.gray1 }]}>BRANCHES{total > 0 ? ` · ${total}` : ''}</Text>
      <ScrollView style={s.list} showsVerticalScrollIndicator={false}>
        {branchEntries.map(({ repo, branches }) => {
          if (branches.length === 0) return null;
          const repoName = repo.split('/')[1] ?? repo;
          return (
            <View key={repo} style={s.repoBlock}>
              <Text style={[s.repoName, { color: colors.gray1, borderBottomColor: colors.gray3 }]}>{repoName}</Text>
              {branches.map(b => (
                <View key={b.name} style={s.branchRow}>
                  <Text style={s.bullet}>{b.protected ? '🔒' : '⌥'}</Text>
                  <Text style={[s.branchName, { color: colors.ink }]} numberOfLines={1}>{b.name}</Text>
                </View>
              ))}
            </View>
          );
        })}
        {total === 0 && <Text style={[s.empty, { color: colors.gray2 }]}>No repos configured</Text>}
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  card:       { flex: 1, borderWidth: 1, padding: Spacing.inner },
  list:       { flex: 1 },
  label:      { fontFamily: FontFamily, fontSize: 11, letterSpacing: 1, marginBottom: 6 },
  repoBlock:  { marginBottom: 8 },
  repoName:   { fontFamily: FontFamily, fontSize: 11, letterSpacing: 1, marginBottom: 2, borderBottomWidth: 1, paddingBottom: 2 },
  branchRow:  { flexDirection: 'row', alignItems: 'center', paddingVertical: 2, gap: 4 },
  bullet:     { fontSize: 10, width: 16 },
  branchName: { fontFamily: FontFamily, fontSize: 12, flex: 1 },
  empty:      { fontFamily: FontFamily, fontSize: 12 },
});
