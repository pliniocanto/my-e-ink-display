import { StyleSheet, Text, View } from 'react-native';
import type { GithubEvent } from '../../types/github';
import { Colors, FontFamily, HeatmapColors, Spacing } from '../../constants/theme';
import { buildContributionMap, getHeatmapIntensity } from '../../utils/transforms';

interface Props {
  events: GithubEvent[];
  style?: object;
}

function getLast30Days(): string[] {
  return Array.from({ length: 30 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (29 - i));
    return d.toISOString().slice(0, 10);
  });
}

export function ContributionHeatmap({ events, style }: Props) {
  const map = buildContributionMap(events);
  const days = getLast30Days();
  const total = [...map.values()].reduce((a, b) => a + b, 0);

  return (
    <View style={[s.card, style]}>
      <Text style={s.label}>CONTRIBUTIONS · LAST 30 DAYS</Text>
      <View style={s.grid}>
        {days.map(day => {
          const count = map.get(day) ?? 0;
          const intensity = getHeatmapIntensity(count);
          return (
            <View
              key={day}
              style={[s.cell, { backgroundColor: HeatmapColors[intensity] }]}
            />
          );
        })}
      </View>
      <Text style={s.total}>{total} commits</Text>
    </View>
  );
}

const s = StyleSheet.create({
  card:  { flex: 1, borderWidth: 1, borderColor: Colors.gray2, padding: Spacing.inner, backgroundColor: '#fff' },
  label: { fontFamily: FontFamily, fontSize: 11, letterSpacing: 1, color: Colors.gray1, marginBottom: 6 },
  grid:  { flexDirection: 'row', flexWrap: 'wrap', gap: 3 },
  cell:  { width: 14, height: 14, borderRadius: 2 },
  total: { fontFamily: FontFamily, fontSize: 13, fontWeight: 'bold', color: Colors.ink, marginTop: 8 },
});
