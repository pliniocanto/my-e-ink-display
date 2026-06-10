import { StyleSheet, Text, View } from 'react-native';
import type { CiEntry } from '../../hooks/useGitHubData';
import type { CiRunStatus } from '../../types/github';
import { FontFamily, Spacing } from '../../constants/theme';
import { useTheme } from '../../contexts/ThemeContext';

interface Props {
  ciEntries: CiEntry[];
  style?: object;
}

export function CiStatus({ ciEntries, style }: Props) {
  const { colors } = useTheme();

  const badgeColor: Record<CiRunStatus, string> = {
    PASS:    colors.ink,
    FAIL:    colors.gray1,
    RUNNING: colors.gray2,
    SKIPPED: colors.gray3,
  };

  return (
    <View style={[s.card, { borderColor: colors.gray2, backgroundColor: colors.card }, style]}>
      <Text style={[s.label, { color: colors.gray1 }]}>CI / CD</Text>
      {ciEntries.map(({ repo, status }) => {
        const repoName = repo.split('/')[1] ?? repo;
        return (
          <View key={repo} style={s.row}>
            <Text style={[s.repo, { color: colors.ink }]}>▣ {repoName}</Text>
            <View style={[s.badge, { backgroundColor: badgeColor[status] }]}>
              <Text style={[s.badgeText, { color: colors.card }]}>{status}</Text>
            </View>
          </View>
        );
      })}
      {ciEntries.length === 0 && <Text style={[s.empty, { color: colors.gray2 }]}>No repos configured</Text>}
    </View>
  );
}

const s = StyleSheet.create({
  card:      { flex: 1, borderWidth: 1, padding: Spacing.inner },
  label:     { fontFamily: FontFamily, fontSize: 11, letterSpacing: 1, marginBottom: 6 },
  row:       { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 4 },
  repo:      { fontFamily: FontFamily, fontSize: 12, flex: 1 },
  badge:     { paddingHorizontal: 6, paddingVertical: 2 },
  badgeText: { fontFamily: FontFamily, fontSize: 10 },
  empty:     { fontFamily: FontFamily, fontSize: 12 },
});
