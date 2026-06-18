import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { FontFamily } from '../../constants/theme';
import { useTheme } from '../../contexts/ThemeContext';

interface Props {
  username: string;
  avatarUrl?: string;
  lastUpdated: Date | null;
  onRefresh: () => void;
  onSettingsPress: () => void;
}

export function TopBar({ username, avatarUrl, lastUpdated, onRefresh, onSettingsPress }: Props) {
  const { colors } = useTheme();
  const updated = lastUpdated
    ? lastUpdated.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    : '—';

  return (
    <View style={[s.container, { borderBottomColor: colors.ink }]}>
      <View style={s.left}>
        {avatarUrl && (
          <View style={[s.avatarWrapper, { borderColor: colors.ink }]}>
            <Image
              source={{ uri: avatarUrl }}
              style={[s.avatar, { filter: [{ grayscale: 1 }, { contrast: 1.15 }] } as object]}
            />
          </View>
        )}
        <Pressable onLongPress={onSettingsPress}>
          <Text style={[s.title, { color: colors.ink }]}>▣ GITHUB DASHBOARD</Text>
        </Pressable>
      </View>
      <View style={s.right}>
        <Text style={[s.meta, { color: colors.gray1 }]} numberOfLines={1}>@{username}  |  updated {updated}</Text>
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
  container:    { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderBottomWidth: 2, paddingBottom: 8, marginBottom: 12, minWidth: 0 },
  left:         { flexDirection: 'row', alignItems: 'center', gap: 10, flexShrink: 1, minWidth: 0 },
  avatarWrapper: { borderWidth: 1, borderRadius: 4, overflow: 'hidden', width: 36, height: 36 },
  avatar:       { width: 36, height: 36 },
  title:        { fontFamily: FontFamily, fontSize: 18, fontWeight: 'bold', letterSpacing: 2 },
  right:        { flexDirection: 'row', alignItems: 'center', gap: 12, flexShrink: 0 },
  meta:         { fontFamily: FontFamily, fontSize: 11 },
  refreshBtn:   { padding: 4 },
  refreshText:  { fontFamily: FontFamily, fontSize: 16 },
  settingsBtn:  { borderWidth: 1, paddingHorizontal: 8, paddingVertical: 3 },
  settingsText: { fontFamily: FontFamily, fontSize: 11, letterSpacing: 1 },
});
