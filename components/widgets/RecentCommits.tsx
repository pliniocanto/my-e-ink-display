import { StyleSheet, Text, View } from 'react-native';
import type { GithubEvent } from '../../types/github';
import { Colors, FontFamily, Spacing } from '../../constants/theme';
import { toRelativeTime } from '../../utils/transforms';

interface CommitRow { message: string; repo: string; time: string; }

function extractCommits(events: GithubEvent[]): CommitRow[] {
  const rows: CommitRow[] = [];
  for (const event of events) {
    if (event.type !== 'PushEvent') continue;
    const commits = event.payload.commits ?? [];
    for (const c of commits) {
      rows.push({
        message: c.message.split('\n')[0],
        repo: event.repo.name.split('/')[1] ?? event.repo.name,
        time: toRelativeTime(event.created_at),
      });
      if (rows.length === 5) return rows;
    }
  }
  return rows;
}

interface Props {
  events: GithubEvent[];
  style?: object;
}

export function RecentCommits({ events, style }: Props) {
  const commits = extractCommits(events);

  return (
    <View style={[s.card, style]}>
      <Text style={s.label}>RECENT COMMITS</Text>
      {commits.map((c, i) => (
        <View key={i} style={s.row}>
          <Text style={s.diamond}>◆</Text>
          <Text style={s.message} numberOfLines={1}>{c.message}</Text>
          <Text style={s.meta}>{c.repo} · {c.time}</Text>
        </View>
      ))}
      {commits.length === 0 && <Text style={s.empty}>No recent commits</Text>}
    </View>
  );
}

const s = StyleSheet.create({
  card:    { flex: 2, borderWidth: 1, borderColor: Colors.gray2, padding: Spacing.inner, backgroundColor: '#fff' },
  label:   { fontFamily: FontFamily, fontSize: 11, letterSpacing: 1, color: Colors.gray1, marginBottom: 6 },
  row:     { flexDirection: 'row', alignItems: 'center', borderBottomWidth: 1, borderBottomColor: Colors.gray3, paddingVertical: 4, gap: 6 },
  diamond: { fontFamily: FontFamily, fontSize: 10, color: Colors.ink, width: 12 },
  message: { fontFamily: FontFamily, fontSize: 12, color: Colors.ink, flex: 1 },
  meta:    { fontFamily: FontFamily, fontSize: 11, color: Colors.gray1 },
  empty:   { fontFamily: FontFamily, fontSize: 12, color: Colors.gray2 },
});
