import { Pressable, StyleSheet, Text, View } from 'react-native';
import { FontFamily } from '../../constants/theme';
import { useTheme } from '../../contexts/ThemeContext';

interface Props {
  username: string;
  lastUpdated: Date | null;
  onRefresh: () => void;
  onSettingsPress: () => void;
}

export function TopBar({ username, lastUpdated, onRefresh, onSettingsPress }: Props) {
  const { colors } = useTheme();
  const updated = lastUpdated
    ? lastUpdated.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    : '—';

  return (
    <View style={[s.container, { borderBottomColor: colors.ink }]}>
      <Pressable onLongPress={onSettingsPress}>
        <Text style={[s.title, { color: colors.ink }]}>▣ GITHUB DASHBOARD</Text>
      </Pressable>
      <View style={s.right}>
        <Text style={[s.meta, { color: colors.gray1 }]}>@{username}  |  updated {updated}</Text>
        <Pressable onPress={onRefresh} style={s.refreshBtn}>
          <Text style={[s.refreshText, { color: colors.ink }]}>↻</Text>
        </Pressable>
        <Pressable onPress={onSettingsPress} style={[s.settingsBtn, { borderColor: colors.ink }]}>
          <Text style={[s.settingsText, { color: colors.ink }]}>⚙ CONFIG</Text>
        </Pressable>
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  container:    { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderBottomWidth: 2, paddingBottom: 8, marginBottom: 12 },
  title:        { fontFamily: FontFamily, fontSize: 18, fontWeight: 'bold', letterSpacing: 2 },
  right:        { flexDirection: 'row', alignItems: 'center', gap: 12 },
  meta:         { fontFamily: FontFamily, fontSize: 11 },
  refreshBtn:   { padding: 4 },
  refreshText:  { fontFamily: FontFamily, fontSize: 16 },
  settingsBtn:  { borderWidth: 1, paddingHorizontal: 8, paddingVertical: 3 },
  settingsText: { fontFamily: FontFamily, fontSize: 11, letterSpacing: 1 },
});
