import { useMemo } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, type PressableProps } from 'react-native';
import { useTheme } from '@/hooks/useTheme';
import type { Theme } from '@/constants/theme';

type Props = PressableProps & {
  label: string;
  variant?: 'primary' | 'secondary';
  loading?: boolean;
};

export function Button({ label, variant = 'primary', loading, disabled, style, ...rest }: Props) {
  const { theme } = useTheme();
  const styles = useMemo(() => makeStyles(theme), [theme]);
  const isSecondary = variant === 'secondary';
  return (
    <Pressable
      accessibilityRole="button"
      disabled={disabled || loading}
      style={({ pressed }) => [
        styles.base,
        isSecondary ? styles.secondary : styles.primary,
        (disabled || loading) && styles.disabled,
        pressed && styles.pressed,
        typeof style === 'function' ? undefined : style,
      ]}
      {...rest}>
      {loading ? (
        <ActivityIndicator color={isSecondary ? theme.colors.primary : '#fff'} />
      ) : (
        <Text style={[styles.label, isSecondary && styles.labelSecondary]}>{label}</Text>
      )}
    </Pressable>
  );
}

const makeStyles = (theme: Theme) =>
  StyleSheet.create({
    base: {
      borderRadius: theme.radius.md,
      paddingVertical: theme.spacing.md,
      alignItems: 'center',
      justifyContent: 'center',
    },
    primary: { backgroundColor: theme.colors.primary },
    secondary: { backgroundColor: theme.colors.primaryMuted },
    disabled: { opacity: 0.5 },
    pressed: { opacity: 0.85 },
    label: { color: '#fff', fontSize: 16 * theme.fontScale, fontWeight: '600' },
    labelSecondary: { color: theme.colors.primary },
  });
