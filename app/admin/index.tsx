import { useMemo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useTheme } from '@/hooks/useTheme';
import type { Theme } from '@/constants/theme';

const SECTIONS = [
  { href: '/admin/devotions', icon: 'sunny-outline', title: 'Devotions', subtitle: 'Write and schedule daily devotions' },
  { href: '/admin/plans', icon: 'book-outline', title: 'Reading Plans', subtitle: 'Create multi-day reading plans' },
  { href: '/admin/hymns', icon: 'musical-notes-outline', title: 'Hymns', subtitle: 'Manage the hymn book' },
  { href: '/admin/prayer', icon: 'heart-outline', title: 'Prayer Requests', subtitle: 'Moderate and mark as answered' },
] as const;

export default function AdminDashboard() {
  const { theme } = useTheme();
  const styles = useMemo(() => makeStyles(theme), [theme]);
  return (
    <View style={styles.container}>
      {SECTIONS.map((section) => (
        <Pressable key={section.href} style={styles.card} onPress={() => router.push(section.href)}>
          <View style={styles.iconWrap}>
            <Ionicons name={section.icon as any} size={24} color={theme.colors.primary} />
          </View>
          <View style={styles.textWrap}>
            <Text style={theme.typography.heading}>{section.title}</Text>
            <Text style={theme.typography.caption}>{section.subtitle}</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color={theme.colors.textMuted} />
        </Pressable>
      ))}
    </View>
  );
}

const makeStyles = (theme: Theme) =>
  StyleSheet.create({
    container: { padding: theme.spacing.lg, gap: theme.spacing.md, backgroundColor: theme.colors.background, flex: 1 },
    card: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: theme.spacing.md,
      backgroundColor: theme.colors.surface,
      borderRadius: theme.radius.md,
      borderWidth: 1,
      borderColor: theme.colors.border,
      padding: theme.spacing.md,
    },
    iconWrap: {
      width: 44,
      height: 44,
      borderRadius: theme.radius.md,
      backgroundColor: theme.colors.primaryMuted,
      alignItems: 'center',
      justifyContent: 'center',
    },
    textWrap: { flex: 1, gap: 2 },
  });
