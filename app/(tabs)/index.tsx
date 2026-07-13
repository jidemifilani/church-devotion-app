import { useCallback, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/useAuth';
import { useTheme } from '@/hooks/useTheme';
import { DevotionView } from '@/components/DevotionView';
import type { Theme } from '@/constants/theme';
import type { Devotion } from '@/types/database';

function todayIso() {
  return new Date().toISOString().slice(0, 10);
}

export default function TodayScreen() {
  const { session } = useAuth();
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
      <DevotionView devotion={devotion} isBookmarked={isBookmarked} onToggleBookmark={toggleBookmark} />
    </ScrollView>
  );
}

const makeStyles = (theme: Theme) =>
  StyleSheet.create({
    centered: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: theme.colors.background, padding: theme.spacing.lg },
    container: { padding: theme.spacing.lg, gap: theme.spacing.md, backgroundColor: theme.colors.background },
  });
