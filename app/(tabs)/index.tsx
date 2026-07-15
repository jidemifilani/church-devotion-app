import { useCallback, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/useAuth';
import { useTheme } from '@/hooks/useTheme';
import { DevotionView } from '@/components/DevotionView';
import { updateTodayVerseWidget } from '@/widgets/updateWidget';
import type { Theme } from '@/constants/theme';
import type { Devotion } from '@/types/database';

function todayIso() {
  return new Date().toISOString().slice(0, 10);
}

export default function TodayScreen() {
  const { session, profile } = useAuth();
  const { theme } = useTheme();
  const styles = useMemo(() => makeStyles(theme), [theme]);
  const [devotion, setDevotion] = useState<Devotion | null>(null);
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    const { data: devotionData } = await supabase
      .from('devotions')
      .select('*')
      .eq('status', 'published')
      .lte('devotion_date', todayIso())
      .order('devotion_date', { ascending: false })
      .limit(1)
      .maybeSingle();

    setDevotion(devotionData ?? null);

    if (devotionData) {
      updateTodayVerseWidget({
        title: devotionData.title,
        scriptureReference: devotionData.scripture_reference,
        scriptureText: devotionData.scripture_text,
      });
    }

    if (devotionData && session) {
      const { data: bookmark } = await supabase
        .from('bookmarks')
        .select('id')
        .eq('user_id', session.user.id)
        .eq('devotion_id', devotionData.id)
        .maybeSingle();
      setIsBookmarked(!!bookmark);
      supabase.rpc('record_devotion_read', { p_devotion_id: devotionData.id });
    }
  }, [session]);

  useEffect(() => {
    setLoading(true);
    load().finally(() => setLoading(false));
  }, [load]);

  const onRefresh = async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  };

  const toggleBookmark = async () => {
    if (!devotion || !session) return;
    if (isBookmarked) {
      await supabase
        .from('bookmarks')
        .delete()
        .eq('user_id', session.user.id)
        .eq('devotion_id', devotion.id);
      setIsBookmarked(false);
    } else {
      await supabase.from('bookmarks').insert({ user_id: session.user.id, devotion_id: devotion.id });
      setIsBookmarked(true);
    }
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator color={theme.colors.primary} />
      </View>
    );
  }

  if (!devotion) {
    return (
      <View style={styles.centered}>
        <Text style={theme.typography.body}>No devotion has been posted yet. Check back soon.</Text>
      </View>
    );
  }

  return (
    <ScrollView
      contentContainerStyle={styles.container}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.colors.primary} />}>
      <View style={styles.topRow}>
        {profile && profile.current_streak > 0 ? (
          <View style={styles.streak}>
            <Ionicons name="flame" size={16} color={theme.colors.primary} />
            <Text style={styles.streakText}>{profile.current_streak}-day streak</Text>
          </View>
        ) : (
          <View />
        )}
        <Pressable onPress={() => router.push('/archive')} hitSlop={12} style={styles.archiveLink}>
          <Ionicons name="calendar-outline" size={18} color={theme.colors.textMuted} />
          <Text style={styles.archiveLinkText}>Past devotions</Text>
        </Pressable>
      </View>
      <DevotionView devotion={devotion} isBookmarked={isBookmarked} onToggleBookmark={toggleBookmark} />
    </ScrollView>
  );
}

const makeStyles = (theme: Theme) =>
  StyleSheet.create({
    centered: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: theme.colors.background, padding: theme.spacing.lg },
    container: { padding: theme.spacing.lg, gap: theme.spacing.md, backgroundColor: theme.colors.background },
    topRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
    streak: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      backgroundColor: theme.colors.primaryMuted,
      paddingHorizontal: theme.spacing.sm,
      paddingVertical: 4,
      borderRadius: theme.radius.pill,
    },
    streakText: { color: theme.colors.primary, fontWeight: '600', fontSize: 13 },
    archiveLink: { flexDirection: 'row', alignItems: 'center', gap: 4 },
    archiveLinkText: { color: theme.colors.textMuted, fontSize: 13 },
  });
