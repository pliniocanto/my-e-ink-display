export const lightColors = {
  paper: '#eeedec',
  card:  '#ffffff',
  ink:   '#1a1a1a',
  gray1: '#888888',
  gray2: '#aaaaaa',
  gray3: '#dddddd',
} as const;

export const darkColors = {
  paper: '#0d0d0d',
  card:  '#1a1a1a',
  ink:   '#f0ebe0',
  gray1: '#aaaaaa',
  gray2: '#555555',
  gray3: '#2a2a2a',
} as const;

export type ThemeColors = typeof lightColors;

export const lightHeatmap: Record<0 | 1 | 2 | 3 | 4, string> = {
  0: lightColors.paper,
  1: lightColors.gray3,
  2: lightColors.gray2,
  3: lightColors.gray1,
  4: lightColors.ink,
};

export const darkHeatmap: Record<0 | 1 | 2 | 3 | 4, string> = {
  0: darkColors.paper,
  1: '#2a2a2a',
  2: '#444444',
  3: '#777777',
  4: darkColors.ink,
};

// Legacy aliases so existing code doesn't break until migrated
export const Colors = lightColors;
export const HeatmapColors = lightHeatmap;

export const FontFamily = 'SpaceMono_400Regular';

export const Spacing = {
  screen: 16,
  gap:    12,
  inner:  10,
} as const;

/** Prevents flex children from overflowing their column on dense dashboards. */
export const widgetCard = {
  overflow: 'hidden' as const,
  minWidth: 0,
  minHeight: 0,
};
