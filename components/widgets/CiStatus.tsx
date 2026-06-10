import { StyleSheet, Text, View } from 'react-native';
import type { CiEntry } from '../../hooks/useGitHubData';
import type { CiRunStatus } from '../../types/github';
import { Colors, FontFamily, Spacing } from '../../constants/theme';

const BadgeColor: Record<CiRunStatus, string> = {
  PASS:    Colors.ink,
  FAIL:    Colors.gray1,
  RUNNING: Colors.gray2,
  SKIPPED: Colors.gray3,
};

interface Props {
  ciEntries: CiEntry[];
  style?: object;
}

export function CiStatus({ ciEntries, style }: Props) {
  return (
    <View style={[s.card, style]}>
      <Text style={s.label}>CI / CD</Text>
      {ciEntries.map(({ repo, status }) => {
        const repoName = repo.split('/')[1] ?? repo;
        return (
          <View key={repo} style={s.row}>
            <Text style={s.repo}>▣ {repoName}</Text>
            <View style={[s.badge, { backgroundColor: BadgeColor[status] }]}>
              <Text style={s.badgeText}>{status}</Text>
            </View>
          </View>
        );
      })}
      {ciEntries.length === 0 && <Text style={s.empty}>No repos configured</Text>}
    </View>
  );
}

const s = StyleSheet.create({
  card:      { flex: 1, borderWidth: 1, borderColor: Colors.gray2, padding: Spacing.inner, backgroundColor: '#fff' },
  label:     { fontFamily: FontFamily, fontSize: 11, letterSpacing: 1, color: Colors.gray1, marginBottom: 6 },
  row:       { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 4 },
  repo:      { fontFamily: FontFamily, fontSize: 12, color: Colors.ink, flex: 1 },
  badge:     { paddingHorizontal: 6, paddingVertical: 2 },
  badgeText: { fontFamily: FontFamily, fontSize: 10, color: '#fff' },
  empty:     { fontFamily: FontFamily, fontSize: 12, color: Colors.gray2 },
});
