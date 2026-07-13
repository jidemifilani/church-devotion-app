import { useMemo } from 'react';
import { Pressable, StyleSheet, type PressableProps } from 'react-native';
import { useTheme } from '@/hooks/useTheme';
import type { Theme } from '@/constants/theme';

export function Card({ style, ...rest }: PressableProps) {
  const { theme } = useTheme();
  const styles = useMemo(() => makeStyles(theme), [theme]);
  return <Pressable style={[styles.card, style as object]} {...rest} />;
}

const makeStyles = (theme: Theme) =>
  StyleSheet.create({
    card: {
      backgroundColor: theme.colors.surface,
      borderRadius: theme.radius.md,
      padding: theme.spacing.md,
      borderWidth: 1,
      borderColor: theme.colors.border,
      gap: theme.spacing.xs,
    },
  });
