import { StyleSheet, Text, View } from 'react-native';
import { Colors, FontFamily } from '../../constants/theme';

interface Props {
  error: string | null;
  countdown: string;
}

export function BottomBar({ error, countdown }: Props) {
  return (
    <View style={s.container}>
      <Text style={[s.text, error ? s.error : null]}>
        {error ? `⚠ ${error}` : 'React Native · Expo · GitHub REST API'}
      </Text>
      <Text style={s.text}>next refresh in {countdown}</Text>
    </View>
  );
}

const s = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderTopWidth: 2,
    borderTopColor: Colors.ink,
    marginTop: 12,
    paddingTop: 6,
  },
  text:  { fontFamily: FontFamily, fontSize: 11, color: Colors.gray1 },
  error: { color: Colors.ink },
});
