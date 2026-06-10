import { StyleSheet, Text, View } from 'react-native';
import type { GithubCommit } from '../../types/github';
import { FontFamily, Spacing } from '../../constants/theme';
import { useTheme } from '../../contexts/ThemeContext';
import { buildContributionMap, getHeatmapIntensity } from '../../utils/transforms';

interface Props {
  commits: GithubCommit[];
  style?: object;
}

function getLast30Days(): string[] {
  return Array.from({ length: 30 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (29 - i));
    return d.toISOString().slice(0, 10);
  });
}

export function ContributionHeatmap({ commits, style }: Props) {
  const { colors, heatmap } = useTheme();
  const map = buildContributionMap(commits);
  const days = getLast30Days();

  return (
    <View style={[s.card, { borderColor: colors.gray2, backgroundColor: colors.card }, style]}>
      <Text style={[s.label, { color: colors.gray1 }]}>CONTRIBUTIONS · LAST 30 DAYS</Text>
      <View style={s.grid}>
        {days.map(day => {
          const count = map.get(day) ?? 0;
          const intensity = getHeatmapIntensity(count);
          return <View key={day} style={[s.cell, { backgroundColor: heatmap[intensity] }]} />;
        })}
      </View>
      <Text style={[s.total, { color: colors.ink }]}>{commits.length} commits</Text>
    </View>
  );
}

const s = StyleSheet.create({
  card:  { flex: 1, borderWidth: 1, padding: Spacing.inner },
  label: { fontFamily: FontFamily, fontSize: 11, letterSpacing: 1, marginBottom: 6 },
  grid:  { flexDirection: 'row', flexWrap: 'wrap', gap: 3 },
  cell:  { width: 14, height: 14, borderRadius: 2 },
  total: { fontFamily: FontFamily, fontSize: 13, fontWeight: 'bold', marginTop: 8 },
});
