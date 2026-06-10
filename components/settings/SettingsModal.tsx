import { useState } from 'react';
import { Modal, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { FontFamily } from '../../constants/theme';
import { useTheme } from '../../contexts/ThemeContext';
import { setToken, setUsername, setWatchedRepos } from '../../services/storage';

interface Props {
  visible: boolean;
  initialToken: string;
  initialUsername: string;
  initialWatchedRepos: string[];
  onSave: (token: string, username: string, watchedRepos: string[]) => void;
}

export function SettingsModal({
  visible, initialToken, initialUsername, initialWatchedRepos, onSave,
}: Props) {
  const { colors, isDark, setDark } = useTheme();
  const [token, setTokenState]   = useState(initialToken);
  const [username, setUsernameState] = useState(initialUsername);
  const [repos, setReposState]   = useState(initialWatchedRepos.join(', '));

  async function handleSave() {
    const watchedRepos = repos.split(',').map(r => r.trim()).filter(Boolean);
    await Promise.all([setToken(token), setUsername(username), setWatchedRepos(watchedRepos)]);
    onSave(token, username, watchedRepos);
  }

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={s.overlay}>
        <View style={[s.dialog, { backgroundColor: colors.paper, borderColor: colors.ink }]}>
          <Text style={[s.heading, { color: colors.ink }]}>SETTINGS</Text>

          <Text style={[s.fieldLabel, { color: colors.gray1 }]}>THEME</Text>
          <View style={s.themeRow}>
            {(['light', 'dark'] as const).map(t => {
              const active = isDark === (t === 'dark');
              return (
                <Pressable
                  key={t}
                  onPress={() => setDark(t === 'dark')}
                  style={[s.themeBtn, { borderColor: colors.ink, backgroundColor: active ? colors.ink : 'transparent' }]}
                >
                  <Text style={[s.themeBtnText, { color: active ? colors.paper : colors.ink }]}>
                    {t.toUpperCase()}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          <Text style={[s.fieldLabel, { color: colors.gray1 }]}>GitHub Token (PAT)</Text>
          <TextInput
            style={[s.input, { color: colors.ink, borderColor: colors.ink, backgroundColor: colors.card }]}
            value={token}
            onChangeText={setTokenState}
            secureTextEntry
            placeholder="ghp_..."
            placeholderTextColor={colors.gray2}
            autoCorrect={false}
          />

          <Text style={[s.fieldLabel, { color: colors.gray1 }]}>GitHub Username</Text>
          <TextInput
            style={[s.input, { color: colors.ink, borderColor: colors.ink, backgroundColor: colors.card }]}
            value={username}
            onChangeText={setUsernameState}
            autoCorrect={false}
            autoCapitalize="none"
            placeholder="your-username"
            placeholderTextColor={colors.gray2}
          />

          <Text style={[s.fieldLabel, { color: colors.gray1 }]}>Watched Repos for CI (owner/repo, comma-separated, max 5)</Text>
          <TextInput
            style={[s.input, { color: colors.ink, borderColor: colors.ink, backgroundColor: colors.card }]}
            value={repos}
            onChangeText={setReposState}
            autoCorrect={false}
            autoCapitalize="none"
            placeholder="user/repo1, user/repo2"
            placeholderTextColor={colors.gray2}
          />

          <Pressable style={[s.saveBtn, { backgroundColor: colors.ink }]} onPress={handleSave}>
            <Text style={[s.saveBtnText, { color: colors.paper }]}>SAVE</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

const s = StyleSheet.create({
  overlay:      { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'center', alignItems: 'center' },
  dialog:       { borderWidth: 2, padding: 24, width: 480 },
  heading:      { fontFamily: FontFamily, fontSize: 16, fontWeight: 'bold', letterSpacing: 2, marginBottom: 20 },
  fieldLabel:   { fontFamily: FontFamily, fontSize: 11, letterSpacing: 1, marginBottom: 4, marginTop: 12 },
  themeRow:     { flexDirection: 'row', gap: 8, marginTop: 4 },
  themeBtn:     { flex: 1, borderWidth: 1, padding: 8, alignItems: 'center' },
  themeBtnText: { fontFamily: FontFamily, fontSize: 12, letterSpacing: 2 },
  input:        { fontFamily: FontFamily, fontSize: 13, borderWidth: 1, padding: 8 },
  saveBtn:      { marginTop: 20, padding: 12, alignItems: 'center' },
  saveBtnText:  { fontFamily: FontFamily, fontSize: 13, letterSpacing: 2 },
});
