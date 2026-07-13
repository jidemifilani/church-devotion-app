import { useMemo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/hooks/useTheme';
import type { Theme } from '@/constants/theme';
import type { Devotion } from '@/types/database';

type Props = {
  devotion: Devotion;
  isBookmarked: boolean;
  onToggleBookmark: () => void;
};

export function DevotionView({ devotion, isBookmarked, onToggleBookmark }: Props) {
  const { theme } = useTheme();
  const styles = useMemo(() => makeStyles(theme), [theme]);

  const dateLabel = new Date(devotion.devotion_date).toLocaleDateString(undefined, {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  });

  return (
    <>
      <Text style={theme.typography.caption}>{dateLabel}</Text>

      <View style={styles.titleRow}>
        <Text style={[theme.typography.title, styles.titleText]}>{devotion.title}</Text>
        <Pressable onPress={onToggleBookmark} hitSlop={12}>
          <Ionicons
            name={isBookmarked ? 'bookmark' : 'bookmark-outline'}
            size={26}
            color={theme.colors.primary}
          />
        </Pressable>
      </View>

      <View style={styles.scriptureCard}>
        <Text style={styles.scriptureRef}>{devotion.scripture_reference}</Text>
        {devotion.scripture_text ? (
          <Text style={styles.scriptureText}>"{devotion.scripture_text}"</Text>
        ) : null}
      </View>

      <Text style={theme.typography.body}>{devotion.body}</Text>

      {devotion.author ? <Text style={styles.author}>— {devotion.author}</Text> : null}
    </>
  );
}

const makeStyles = (theme: Theme) =>
  StyleSheet.create({
    titleRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: theme.spacing.sm },
    titleText: { flex: 1 },
    scriptureCard: {
      backgroundColor: theme.colors.primaryMuted,
      borderRadius: theme.radius.md,
      padding: theme.spacing.md,
      gap: theme.spacing.xs,
    },
    scriptureRef: { fontSize: 15 * theme.fontScale, fontWeight: '700', color: theme.colors.primary },
    scriptureText: { fontSize: 16 * theme.fontScale, fontStyle: 'italic', color: theme.colors.text },
    author: { fontSize: 15 * theme.fontScale, color: theme.colors.textMuted, textAlign: 'right' },
  });
