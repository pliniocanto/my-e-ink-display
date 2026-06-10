export const Colors = {
  paper:  '#f5f0e8',
  ink:    '#1a1a1a',
  gray1:  '#888888',
  gray2:  '#aaaaaa',
  gray3:  '#dddddd',
} as const;

export const HeatmapColors: Record<0 | 1 | 2 | 3 | 4, string> = {
  0: Colors.paper,
  1: Colors.gray3,
  2: Colors.gray2,
  3: Colors.gray1,
  4: Colors.ink,
};

export const FontFamily = 'SpaceMono_400Regular';

export const Spacing = {
  screen: 16,
  gap:    12,
  inner:  10,
} as const;
