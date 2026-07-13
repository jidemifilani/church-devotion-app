import { useCallback, useMemo, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, View } from 'react-native';
import { useFocusEffect, useLocalSearchParams } from 'expo-router';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/useAuth';
import { useTheme } from '@/hooks/useTheme';
import { DevotionView } from '@/components/DevotionView';
import type { Theme } from '@/constants/theme';
import type { Devotion } from '@/types/database';

export default function DevotionDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { session } = useAuth();
  const { theme } = useTheme();
  const styles = useMemo(() => makeStyles(theme), [theme]);
  const [devotion, setDevotion] = useState<Devotion | null>(null);
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [loading, setLoading] = useState(true);

  useFocusEffect(
    useCallback(() => {
      let active = true;
      (async () => {
        const { data: devotionData } = await supabase.from('devotions').select('*').eq('id', id).single();
        const { data: bookmark } = session
          ? await supabase
              .from('bookmarks')
              .select('id')
              .eq('user_id', session.user.id)
              .eq('devotion_id', id)
              .maybeSingle()
          : { data: null };
        if (!active) return;
        setDevotion(devotionData ?? null);
        setIsBookmarked(!!bookmark);
        setLoading(false);
      })();
      return () => {
        active = false;
      };
    }, [id, session])
  );

  const toggleBookmark = async () => {
    if (!devotion || !session) return;
    if (isBookmarked) {
      await supabase.from('bookmarks').delete().eq('user_id', session.user.id).eq('devotion_id', devotion.id);
    } else {
      await supabase.from('bookmarks').insert({ user_id: session.user.id, devotion_id: devotion.id });
    }
    setIsBookmarked((v) => !v);
  };

  if (loading || !devotion) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator color={theme.colors.primary} />
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <DevotionView devotion={devotion} isBookmarked={isBookmarked} onToggleBookmark={toggleBookmark} />
    </ScrollView>
  );
}

const makeStyles = (theme: Theme) =>
  StyleSheet.create({
    centered: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: theme.spacing.lg },
    container: { padding: theme.spacing.lg, gap: theme.spacing.md, backgroundColor: theme.colors.background },
  });
