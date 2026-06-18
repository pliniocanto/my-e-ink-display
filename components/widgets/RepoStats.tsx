import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import type { GithubUser } from '../../types/github';
import { FontFamily, Spacing, widgetCard } from '../../constants/theme';
import { useTheme } from '../../contexts/ThemeContext';

interface Props {
  profile: GithubUser | null;
  totalStars: number;
  totalForks: number;
  openIssues: number;
  style?: object;
}

function Counter({ value, label, onPress, colors }: {
  value: number; label: string; onPress?: () => void;
  colors: { ink: string; gray1: string; gray2: string; gray3: string };
}) {
  const style = [s.counter, { borderColor: onPress ? colors.ink : colors.gray3 }];
  const content = (
    <>
      <Text style={[s.value, { color: colors.ink }]}>{value}</Text>
      <Text style={[s.counterLabel, { color: colors.gray1 }]}>{label}{onPress ? ' ↗' : ''}</Text>
    </>
  );
  return onPress
    ? <Pressable onPress={onPress} style={style}>{content}</Pressable>
    : <View style={style}>{content}</View>;
}

export function RepoStats({ profile, totalStars, totalForks, openIssues, style }: Props) {
  const { colors } = useTheme();
  const router = useRouter();

  return (
    <View style={[s.card, widgetCard, { borderColor: colors.gray2, backgroundColor: colors.card }, style]}>
      <Text style={[s.label, { color: colors.gray1 }]}>REPO STATS</Text>
      <View style={s.grid}>
        <Counter value={profile?.public_repos ?? 0} label="REPOS"   colors={colors} onPress={() => router.push('/repos')} />
        <Counter value={openIssues}                  label="ISSUES"  colors={colors} onPress={() => router.push('/issues')} />
        <Counter value={totalStars}                  label="STARS"   colors={colors} />
        <Counter value={totalForks}                  label="FORKS"   colors={colors} />
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  card:         { flex: 1, borderWidth: 1, padding: Spacing.inner },
  label:        { fontFamily: FontFamily, fontSize: 11, letterSpacing: 1, marginBottom: 6 },
  grid:         { flexDirection: 'row', flexWrap: 'wrap', gap: 6, flex: 1 },
  counter:      { width: '48%', borderWidth: 1, padding: 6, alignItems: 'center' },
  value:        { fontFamily: FontFamily, fontSize: 22, fontWeight: 'bold' },
  counterLabel: { fontFamily: FontFamily, fontSize: 10 },
});
