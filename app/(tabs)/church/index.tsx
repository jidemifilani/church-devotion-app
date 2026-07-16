import { useMemo } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useTheme } from '@/hooks/useTheme';
import type { Theme } from '@/constants/theme';

const SECTIONS = [
  { href: '/church/announcements', icon: 'megaphone-outline', title: 'Announcements', subtitle: 'News and upcoming events' },
  { href: '/church/sermons', icon: 'mic-outline', title: 'Sermons', subtitle: 'Listen to past messages' },
  { href: '/church/ministries', icon: 'people-outline', title: 'Ministries', subtitle: 'Find a group to join' },
  { href: '/church/info', icon: 'location-outline', title: 'Church Info', subtitle: 'Service times, address, contact' },
  { href: '/church/giving', icon: 'heart-circle-outline', title: 'Give', subtitle: 'Support the church' },
] as const;

export default function ChurchHubScreen() {
  const { theme } = useTheme();
  const styles = useMemo(() => makeStyles(theme), [theme]);
  return (
    <ScrollView contentContainerStyle={styles.container}>
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
    </ScrollView>
  );
}

const makeStyles = (theme: Theme) =>
  StyleSheet.create({
    container: { padding: theme.spacing.lg, gap: theme.spacing.md, backgroundColor: theme.colors.background, flexGrow: 1 },
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
