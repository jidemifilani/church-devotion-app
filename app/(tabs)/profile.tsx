import { useMemo, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Switch, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/useAuth';
import { useTheme } from '@/hooks/useTheme';
import { useLocale } from '@/hooks/useLocale';
import { SUPPORTED_LOCALES } from '@/lib/i18n';
import { STAFF_ROLES } from '@/constants/roles';
import type { Theme } from '@/constants/theme';
import type { ThemePreference } from '@/types/database';

const REMINDER_TIMES = ['06:00', '07:00', '08:00', '18:00', '21:00'];
const THEME_OPTIONS: { value: ThemePreference; label: string }[] = [
  { value: 'system', label: 'System' },
  { value: 'light', label: 'Light' },
  { value: 'dark', label: 'Dark' },
];
const FONT_SCALE_OPTIONS = [
  { value: 0.85, label: 'A' },
  { value: 1, label: 'A' },
  { value: 1.3, label: 'A' },
];

export default function ProfileScreen() {
  const { profile, signOut, refreshProfile } = useAuth();
  const { theme, preference, fontScale, setPreference, setFontScale } = useTheme();
  const { locale, setLocale } = useLocale();
  const { t } = useTranslation();
  const styles = useMemo(() => makeStyles(theme), [theme]);
  const [saving, setSaving] = useState(false);

  const setReminderEnabled = async (value: boolean) => {
    if (!profile) return;
    setSaving(true);
    await supabase.from('profiles').update({ reminder_enabled: value }).eq('id', profile.id);
    await refreshProfile();
    setSaving(false);
  };

  const setReminderTime = async (time: string) => {
    if (!profile) return;
    setSaving(true);
    await supabase.from('profiles').update({ reminder_time: `${time}:00` }).eq('id', profile.id);
    await refreshProfile();
    setSaving(false);
  };

  const confirmSignOut = () => {
    Alert.alert('Sign out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Sign out', style: 'destructive', onPress: signOut },
    ]);
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.headerCard}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{(profile?.full_name ?? '?').charAt(0).toUpperCase()}</Text>
        </View>
        <Text style={theme.typography.heading}>{profile?.full_name ?? 'Church member'}</Text>
      </View>

      <View style={styles.section}>
        <Text style={theme.typography.caption}>DAILY REMINDER</Text>
        <View style={styles.rowBetween}>
          <Text style={theme.typography.body}>Send me a daily devotion reminder</Text>
          <Switch
            value={profile?.reminder_enabled ?? false}
            onValueChange={setReminderEnabled}
            disabled={saving}
            trackColor={{ true: theme.colors.primary }}
          />
        </View>
        {profile?.reminder_enabled ? (
          <View style={styles.chipsRow}>
            {REMINDER_TIMES.map((time) => {
              const active = profile.reminder_time?.startsWith(time);
              return (
                <Pressable
                  key={time}
                  onPress={() => setReminderTime(time)}
                  style={[styles.chip, active && styles.chipActive]}>
                  <Text style={[styles.chipText, active && styles.chipTextActive]}>{time}</Text>
                </Pressable>
              );
            })}
          </View>
        ) : null}
      </View>

      <View style={styles.section}>
        <Text style={theme.typography.caption}>{t('language.title').toUpperCase()}</Text>
        <View style={styles.chipsRow}>
          {SUPPORTED_LOCALES.map((code) => (
            <Pressable
              key={code}
              onPress={() => setLocale(code)}
              style={[styles.chip, locale === code && styles.chipActive]}>
              <Text style={[styles.chipText, locale === code && styles.chipTextActive]}>{t(`language.${code}`)}</Text>
            </Pressable>
          ))}
        </View>
      </View>

      <View style={styles.section}>
        <Text style={theme.typography.caption}>APPEARANCE</Text>
        <View style={styles.chipsRow}>
          {THEME_OPTIONS.map((option) => (
            <Pressable
              key={option.value}
              onPress={() => setPreference(option.value)}
              style={[styles.chip, preference === option.value && styles.chipActive]}>
              <Text style={[styles.chipText, preference === option.value && styles.chipTextActive]}>{option.label}</Text>
            </Pressable>
          ))}
        </View>
        <Text style={theme.typography.caption}>TEXT SIZE</Text>
        <View style={styles.chipsRow}>
          {FONT_SCALE_OPTIONS.map((option) => (
            <Pressable
              key={option.value}
              onPress={() => setFontScale(option.value)}
              style={[styles.chip, fontScale === option.value && styles.chipActive]}>
              <Text
                style={[
                  styles.chipText,
                  { fontSize: 14 * option.value },
                  fontScale === option.value && styles.chipTextActive,
                ]}>
                {option.label}
              </Text>
            </Pressable>
          ))}
        </View>
      </View>

      <View style={styles.section}>
        <Pressable style={styles.linkRow} onPress={() => router.push('/bookmarks')}>
          <Ionicons name="bookmark-outline" size={20} color={theme.colors.primary} />
          <Text style={theme.typography.body}>Saved devotions</Text>
          <Ionicons name="chevron-forward" size={18} color={theme.colors.textMuted} style={styles.chevron} />
        </Pressable>

        {profile && STAFF_ROLES.includes(profile.role) ? (
          <Pressable style={styles.linkRow} onPress={() => router.push('/admin')}>
            <Ionicons name="construct-outline" size={20} color={theme.colors.primary} />
            <Text style={theme.typography.body}>Admin dashboard</Text>
            <Ionicons name="chevron-forward" size={18} color={theme.colors.textMuted} style={styles.chevron} />
          </Pressable>
        ) : null}
      </View>

      <Pressable style={styles.signOut} onPress={confirmSignOut}>
        <Text style={styles.signOutText}>Sign out</Text>
      </Pressable>
    </ScrollView>
  );
}

const makeStyles = (theme: Theme) =>
  StyleSheet.create({
    container: { padding: theme.spacing.lg, gap: theme.spacing.lg, backgroundColor: theme.colors.background, flexGrow: 1 },
    headerCard: { alignItems: 'center', gap: theme.spacing.sm, paddingVertical: theme.spacing.lg },
    avatar: {
      width: 72,
      height: 72,
      borderRadius: theme.radius.pill,
      backgroundColor: theme.colors.primaryMuted,
      alignItems: 'center',
      justifyContent: 'center',
    },
    avatarText: { fontSize: 28, fontWeight: '700', color: theme.colors.primary },
    section: {
      backgroundColor: theme.colors.surface,
      borderRadius: theme.radius.md,
      padding: theme.spacing.md,
      borderWidth: 1,
      borderColor: theme.colors.border,
      gap: theme.spacing.sm,
    },
    rowBetween: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
    chipsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: theme.spacing.sm },
    chip: {
      paddingVertical: theme.spacing.xs,
      paddingHorizontal: theme.spacing.md,
      borderRadius: theme.radius.pill,
      backgroundColor: theme.colors.primaryMuted,
    },
    chipActive: { backgroundColor: theme.colors.primary },
    chipText: { color: theme.colors.primary, fontWeight: '600' },
    chipTextActive: { color: '#fff' },
    linkRow: { flexDirection: 'row', alignItems: 'center', gap: theme.spacing.sm, paddingVertical: theme.spacing.sm },
    chevron: { marginLeft: 'auto' },
    signOut: { alignItems: 'center', paddingVertical: theme.spacing.md },
    signOutText: { color: theme.colors.danger, fontWeight: '600', fontSize: 16 },
  });
