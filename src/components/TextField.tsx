import { useMemo } from 'react';
import { StyleSheet, Text, TextInput, View, type TextInputProps } from 'react-native';
import { useTheme } from '@/hooks/useTheme';
import type { Theme } from '@/constants/theme';

type Props = TextInputProps & {
  label: string;
  error?: string | null;
};

export function TextField({ label, error, style, ...rest }: Props) {
  const { theme } = useTheme();
  const styles = useMemo(() => makeStyles(theme), [theme]);
  return (
    <View style={styles.container}>
      <Text style={theme.typography.caption}>{label}</Text>
      <TextInput
        placeholderTextColor={theme.colors.textMuted}
        style={[styles.input, style]}
        {...rest}
      />
      {error ? <Text style={styles.error}>{error}</Text> : null}
    </View>
  );
}

const makeStyles = (theme: Theme) =>
  StyleSheet.create({
    container: { gap: theme.spacing.xs },
    input: {
      borderWidth: 1,
      borderColor: theme.colors.border,
      borderRadius: theme.radius.sm,
      paddingHorizontal: theme.spacing.md,
      paddingVertical: theme.spacing.sm + 4,
      fontSize: 16 * theme.fontScale,
      color: theme.colors.text,
      backgroundColor: theme.colors.surface,
    },
    error: { color: theme.colors.danger, fontSize: 13 * theme.fontScale },
  });
