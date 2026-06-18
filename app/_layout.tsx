import { useEffect } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import * as ScreenOrientation from 'expo-screen-orientation';
import { useFonts, SpaceMono_400Regular } from '@expo-google-fonts/space-mono';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { ThemeProvider } from '../contexts/ThemeContext';

export default function RootLayout() {
  const [fontsLoaded] = useFonts({ SpaceMono_400Regular });

  useEffect(() => {
    ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.LANDSCAPE);
  }, []);

  if (!fontsLoaded) return null;

  return (
    <SafeAreaProvider>
      <ThemeProvider>
        <StatusBar hidden />
        <Stack screenOptions={{ headerShown: false }} />
      </ThemeProvider>
    </SafeAreaProvider>
  );
}
