import { useState } from 'react';
import { Modal, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { Colors, FontFamily } from '../../constants/theme';
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
  const [token, setTokenState] = useState(initialToken);
  const [username, setUsernameState] = useState(initialUsername);
  const [repos, setReposState] = useState(initialWatchedRepos.join(', '));

  async function handleSave() {
    const watchedRepos = repos.split(',').map(r => r.trim()).filter(Boolean);
    await Promise.all([setToken(token), setUsername(username), setWatchedRepos(watchedRepos)]);
    onSave(token, username, watchedRepos);
  }

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={s.overlay}>
        <View style={s.dialog}>
          <Text style={s.heading}>SETTINGS</Text>

          <Text style={s.fieldLabel}>GitHub Token (PAT)</Text>
          <TextInput
            style={s.input}
            value={token}
            onChangeText={setTokenState}
            secureTextEntry
            placeholder="ghp_..."
            placeholderTextColor={Colors.gray2}
            autoCorrect={false}
          />

          <Text style={s.fieldLabel}>GitHub Username</Text>
          <TextInput
            style={s.input}
            value={username}
            onChangeText={setUsernameState}
            autoCorrect={false}
            autoCapitalize="none"
            placeholder="your-username"
            placeholderTextColor={Colors.gray2}
          />

          <Text style={s.fieldLabel}>Watched Repos for CI (owner/repo, comma-separated, max 5)</Text>
          <TextInput
            style={s.input}
            value={repos}
            onChangeText={setReposState}
            autoCorrect={false}
            autoCapitalize="none"
            placeholder="user/repo1, user/repo2"
            placeholderTextColor={Colors.gray2}
          />

          <Pressable style={s.saveBtn} onPress={handleSave}>
            <Text style={s.saveBtnText}>SAVE</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

const s = StyleSheet.create({
  overlay:     { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' },
  dialog:      { backgroundColor: Colors.paper, borderWidth: 2, borderColor: Colors.ink, padding: 24, width: 480 },
  heading:     { fontFamily: FontFamily, fontSize: 16, fontWeight: 'bold', letterSpacing: 2, color: Colors.ink, marginBottom: 20 },
  fieldLabel:  { fontFamily: FontFamily, fontSize: 11, letterSpacing: 1, color: Colors.gray1, marginBottom: 4, marginTop: 12 },
  input:       { fontFamily: FontFamily, fontSize: 13, color: Colors.ink, borderWidth: 1, borderColor: Colors.ink, padding: 8, backgroundColor: '#fff' },
  saveBtn:     { marginTop: 20, backgroundColor: Colors.ink, padding: 12, alignItems: 'center' },
  saveBtnText: { fontFamily: FontFamily, fontSize: 13, color: Colors.paper, letterSpacing: 2 },
});
