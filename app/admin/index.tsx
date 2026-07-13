import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { colors, radius, spacing, typography } from '@/constants/theme';

const SECTIONS = [
  { href: '/admin/devotions', icon: 'sunny-outline', title: 'Devotions', subtitle: 'Write and schedule daily devotions' },
  { href: '/admin/plans', icon: 'book-outline', title: 'Reading Plans', subtitle: 'Create multi-day reading plans' },
  { href: '/admin/hymns', icon: 'musical-notes-outline', title: 'Hymns', subtitle: 'Manage the hymn book' },
  { href: '/admin/prayer', icon: 'heart-outline', title: 'Prayer Requests', subtitle: 'Moderate and mark as answered' },
] as const;

export default function AdminDashboard() {
  return (
    <View style={styles.container}>
      {SECTIONS.map((section) => (
        <Pressable key={section.href} style={styles.card} onPress={() => router.push(section.href)}>
          <View style={styles.iconWrap}>
            <Ionicons name={section.icon as any} size={24} color={colors.primary} />
          </View>
          <View style={styles.textWrap}>
            <Text style={typography.heading}>{section.title}</Text>
            <Text style={typography.caption}>{section.subtitle}</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color={colors.textMuted} />
        </Pressable>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { padding: spacing.lg, gap: spacing.md, backgroundColor: colors.background, flex: 1 },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
  },
  iconWrap: {
    width: 44,
    height: 44,
    borderRadius: radius.md,
    backgroundColor: colors.primaryMuted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  textWrap: { flex: 1, gap: 2 },
});
