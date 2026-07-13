import { Pressable, StyleSheet, type PressableProps } from 'react-native';
import { colors, radius, spacing } from '@/constants/theme';

export function Card({ style, ...rest }: PressableProps) {
  return <Pressable style={[styles.card, style as object]} {...rest} />;
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    gap: spacing.xs,
  },
});
