import { useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Switch, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/useAuth';
import { colors, radius, spacing, typography } from '@/constants/theme';

const REMINDER_TIMES = ['06:00', '07:00', '08:00', '18:00', '21:00'];

export default function ProfileScreen() {
  const { profile, signOut, refreshProfile } = useAuth();
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
        <Text style={typography.heading}>{profile?.full_name ?? 'Church member'}</Text>
      </View>

      <View style={styles.section}>
        <Text style={typography.caption}>DAILY REMINDER</Text>
        <View style={styles.rowBetween}>
          <Text style={typography.body}>Send me a daily devotion reminder</Text>
          <Switch
            value={profile?.reminder_enabled ?? false}
            onValueChange={setReminderEnabled}
            disabled={saving}
            trackColor={{ true: colors.primary }}
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
        <Pressable style={styles.linkRow} onPress={() => router.push('/bookmarks')}>
          <Ionicons name="bookmark-outline" size={20} color={colors.primary} />
          <Text style={typography.body}>Saved devotions</Text>
          <Ionicons name="chevron-forward" size={18} color={colors.textMuted} style={styles.chevron} />
        </Pressable>

        {profile?.role === 'admin' ? (
          <Pressable style={styles.linkRow} onPress={() => router.push('/admin')}>
            <Ionicons name="construct-outline" size={20} color={colors.primary} />
            <Text style={typography.body}>Admin dashboard</Text>
            <Ionicons name="chevron-forward" size={18} color={colors.textMuted} style={styles.chevron} />
          </Pressable>
        ) : null}
      </View>

      <Pressable style={styles.signOut} onPress={confirmSignOut}>
        <Text style={styles.signOutText}>Sign out</Text>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: spacing.lg, gap: spacing.lg, backgroundColor: colors.background, flexGrow: 1 },
  headerCard: { alignItems: 'center', gap: spacing.sm, paddingVertical: spacing.lg },
  avatar: {
    width: 72,
    height: 72,
    borderRadius: radius.pill,
    backgroundColor: colors.primaryMuted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { fontSize: 28, fontWeight: '700', color: colors.primary },
  section: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    gap: spacing.sm,
  },
  rowBetween: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  chipsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  chip: {
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.md,
    borderRadius: radius.pill,
    backgroundColor: colors.primaryMuted,
  },
  chipActive: { backgroundColor: colors.primary },
  chipText: { color: colors.primary, fontWeight: '600' },
  chipTextActive: { color: '#fff' },
  linkRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, paddingVertical: spacing.sm },
  chevron: { marginLeft: 'auto' },
  signOut: { alignItems: 'center', paddingVertical: spacing.md },
  signOutText: { color: colors.danger, fontWeight: '600', fontSize: 16 },
});
