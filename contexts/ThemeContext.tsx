import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import { lightColors, darkColors, lightHeatmap, darkHeatmap, type ThemeColors } from '../constants/theme';
import { getTheme, saveTheme } from '../services/storage';

interface ThemeContextValue {
  colors:      ThemeColors;
  heatmap:     Record<0 | 1 | 2 | 3 | 4, string>;
  isDark:      boolean;
  setDark:     (dark: boolean) => void;
}

const ThemeContext = createContext<ThemeContextValue>({
  colors:  lightColors,
  heatmap: lightHeatmap,
  isDark:  false,
  setDark: () => {},
});

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    getTheme().then(t => setIsDark(t === 'dark'));
  }, []);

  const setDark = useCallback((dark: boolean) => {
    setIsDark(dark);
    saveTheme(dark ? 'dark' : 'light');
  }, []);

  return (
    <ThemeContext.Provider value={{
      colors:  isDark ? darkColors : lightColors,
      heatmap: isDark ? darkHeatmap : lightHeatmap,
      isDark,
      setDark,
    }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}
