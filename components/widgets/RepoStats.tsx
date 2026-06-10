import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import type { GithubUser } from '../../types/github';
import { Colors, FontFamily, Spacing } from '../../constants/theme';

interface Props {
  profile: GithubUser | null;
  totalStars: number;
  totalForks: number;
  openIssues: number;
  style?: object;
}

function Counter({ value, label, onPress }: { value: number; label: string; onPress?: () => void }) {
  const inner = (
    <View style={[s.counter, onPress ? s.tappable : null]}>
      <Text style={s.value}>{value}</Text>
      <Text style={s.counterLabel}>{label}{onPress ? ' ↗' : ''}</Text>
    </View>
  );
  return onPress ? <Pressable onPress={onPress}>{inner}</Pressable> : inner;
}

export function RepoStats({ profile, totalStars, totalForks, openIssues, style }: Props) {
  const router = useRouter();

  return (
    <View style={[s.card, style]}>
      <Text style={s.label}>REPO STATS</Text>
      <View style={s.grid}>
        <Counter
          value={profile?.public_repos ?? 0}
          label="REPOS"
          onPress={() => router.push('/repos')}
        />
        <Counter value={openIssues} label="ISSUES" />
        <Counter value={totalStars} label="STARS" />
        <Counter value={totalForks} label="FORKS" />
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  card:         { flex: 1, borderWidth: 1, borderColor: Colors.gray2, padding: Spacing.inner, backgroundColor: '#fff' },
  label:        { fontFamily: FontFamily, fontSize: 11, letterSpacing: 1, color: Colors.gray1, marginBottom: 6 },
  grid:         { flexDirection: 'row', flexWrap: 'wrap', gap: 6, flex: 1 },
  counter:      { width: '48%', borderWidth: 1, borderColor: Colors.gray3, padding: 6, alignItems: 'center' },
  tappable:     { borderColor: Colors.ink },
  value:        { fontFamily: FontFamily, fontSize: 22, fontWeight: 'bold', color: Colors.ink },
  counterLabel: { fontFamily: FontFamily, fontSize: 10, color: Colors.gray1 },
});
