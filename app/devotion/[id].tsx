import { useCallback, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useLocalSearchParams } from 'expo-router';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/useAuth';
import { colors, radius, spacing, typography } from '@/constants/theme';
import type { Devotion } from '@/types/database';

export default function DevotionDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { session } = useAuth();
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
        <ActivityIndicator color={colors.primary} />
      </View>
    );
  }

  const dateLabel = new Date(devotion.devotion_date).toLocaleDateString(undefined, {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  });

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={typography.caption}>{dateLabel}</Text>
      <View style={styles.titleRow}>
        <Text style={[typography.title, styles.titleText]}>{devotion.title}</Text>
        <Pressable onPress={toggleBookmark} hitSlop={12}>
          <Ionicons name={isBookmarked ? 'bookmark' : 'bookmark-outline'} size={26} color={colors.primary} />
        </Pressable>
      </View>
      <View style={styles.scriptureCard}>
        <Text style={styles.scriptureRef}>{devotion.scripture_reference}</Text>
        {devotion.scripture_text ? <Text style={styles.scriptureText}>"{devotion.scripture_text}"</Text> : null}
      </View>
      <Text style={typography.body}>{devotion.body}</Text>
      {devotion.author ? <Text style={styles.author}>— {devotion.author}</Text> : null}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: spacing.lg },
  container: { padding: spacing.lg, gap: spacing.md, backgroundColor: colors.background },
  titleRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: spacing.sm },
  titleText: { flex: 1 },
  scriptureCard: { backgroundColor: colors.primaryMuted, borderRadius: radius.md, padding: spacing.md, gap: spacing.xs },
  scriptureRef: { fontSize: 15, fontWeight: '700', color: colors.primary },
  scriptureText: { fontSize: 16, fontStyle: 'italic', color: colors.text },
  author: { fontSize: 15, color: colors.textMuted, textAlign: 'right' },
});
