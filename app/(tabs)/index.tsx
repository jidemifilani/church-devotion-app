import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Pressable } from 'react-native';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/useAuth';
import { colors, radius, spacing, typography } from '@/constants/theme';
import type { Devotion } from '@/types/database';

function todayIso() {
  return new Date().toISOString().slice(0, 10);
}

export default function TodayScreen() {
  const { session } = useAuth();
  const [devotion, setDevotion] = useState<Devotion | null>(null);
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    const { data: devotionData } = await supabase
      .from('devotions')
      .select('*')
      .lte('devotion_date', todayIso())
      .order('devotion_date', { ascending: false })
      .limit(1)
      .maybeSingle();

    setDevotion(devotionData ?? null);

    if (devotionData && session) {
      const { data: bookmark } = await supabase
        .from('bookmarks')
        .select('id')
        .eq('user_id', session.user.id)
        .eq('devotion_id', devotionData.id)
        .maybeSingle();
      setIsBookmarked(!!bookmark);
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
        <ActivityIndicator color={colors.primary} />
      </View>
    );
  }

  if (!devotion) {
    return (
      <View style={styles.centered}>
        <Text style={typography.body}>No devotion has been posted yet. Check back soon.</Text>
      </View>
    );
  }

  const dateLabel = new Date(devotion.devotion_date).toLocaleDateString(undefined, {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  });

  return (
    <ScrollView
      contentContainerStyle={styles.container}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}>
      <Text style={typography.caption}>{dateLabel}</Text>

      <View style={styles.titleRow}>
        <Text style={[typography.title, styles.titleText]}>{devotion.title}</Text>
        <Pressable onPress={toggleBookmark} hitSlop={12}>
          <Ionicons
            name={isBookmarked ? 'bookmark' : 'bookmark-outline'}
            size={26}
            color={colors.primary}
          />
        </Pressable>
      </View>

      <View style={styles.scriptureCard}>
        <Text style={styles.scriptureRef}>{devotion.scripture_reference}</Text>
        {devotion.scripture_text ? (
          <Text style={styles.scriptureText}>"{devotion.scripture_text}"</Text>
        ) : null}
      </View>

      <Text style={typography.body}>{devotion.body}</Text>

      {devotion.author ? <Text style={styles.author}>— {devotion.author}</Text> : null}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.background, padding: spacing.lg },
  container: { padding: spacing.lg, gap: spacing.md, backgroundColor: colors.background },
  titleRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: spacing.sm },
  titleText: { flex: 1 },
  scriptureCard: {
    backgroundColor: colors.primaryMuted,
    borderRadius: radius.md,
    padding: spacing.md,
    gap: spacing.xs,
  },
  scriptureRef: { fontSize: 15, fontWeight: '700', color: colors.primary },
  scriptureText: { fontSize: 16, fontStyle: 'italic', color: colors.text },
  author: { fontSize: 15, color: colors.textMuted, textAlign: 'right' },
});
