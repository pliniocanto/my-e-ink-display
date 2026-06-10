import type { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';
import { Spacing } from '../../constants/theme';

interface Props { children: ReactNode }

export function DashboardGrid({ children }: Props) {
  return <View style={s.grid}>{children}</View>;
}

const s = StyleSheet.create({
  grid: {
    flex: 1,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.gap,
  },
});
