import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Colors, FontFamily } from '../../constants/theme';

interface Props {
  username: string;
  lastUpdated: Date | null;
  onRefresh: () => void;
  onSettingsPress: () => void;
}

export function TopBar({ username, lastUpdated, onRefresh, onSettingsPress }: Props) {
  const updated = lastUpdated
    ? lastUpdated.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    : '—';

  return (
    <View style={s.container}>
      <Pressable onLongPress={onSettingsPress}>
        <Text style={s.title}>▣ GITHUB DASHBOARD</Text>
      </Pressable>
      <View style={s.right}>
        <Text style={s.meta}>@{username}  |  updated {updated}</Text>
        <Pressable onPress={onRefresh} style={s.refreshBtn}>
          <Text style={s.refreshText}>↻</Text>
        </Pressable>
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: Colors.ink,
    paddingBottom: 8,
    marginBottom: 12,
  },
  title: { fontFamily: FontFamily, fontSize: 18, fontWeight: 'bold', letterSpacing: 2, color: Colors.ink },
  right:  { flexDirection: 'row', alignItems: 'center', gap: 12 },
  meta:   { fontFamily: FontFamily, fontSize: 11, color: Colors.gray1 },
  refreshBtn: { padding: 4 },
  refreshText: { fontFamily: FontFamily, fontSize: 16, color: Colors.ink },
});
