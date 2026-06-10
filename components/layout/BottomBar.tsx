import { StyleSheet, Text, View } from 'react-native';
import { FontFamily } from '../../constants/theme';
import { useTheme } from '../../contexts/ThemeContext';

interface Props {
  error: string | null;
  countdown: string;
}

export function BottomBar({ error, countdown }: Props) {
  const { colors } = useTheme();
  return (
    <View style={[s.container, { borderTopColor: colors.ink }]}>
      <Text style={[s.text, { color: error ? colors.ink : colors.gray1 }]}>
        {error ? `⚠ ${error}` : 'React Native · Expo · GitHub REST API'}
      </Text>
      <Text style={[s.text, { color: colors.gray1 }]}>next refresh in {countdown}</Text>
    </View>
  );
}

const s = StyleSheet.create({
  container: { flexDirection: 'row', justifyContent: 'space-between', borderTopWidth: 2, marginTop: 12, paddingTop: 6 },
  text:      { fontFamily: FontFamily, fontSize: 11 },
});
