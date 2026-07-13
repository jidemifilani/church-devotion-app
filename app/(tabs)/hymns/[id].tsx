import { useCallback, useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useLocalSearchParams } from 'expo-router';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/useAuth';
import { useTheme } from '@/hooks/useTheme';
import type { Theme } from '@/constants/theme';
import type { Hymn } from '@/types/database';

export default function HymnDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { session } = useAuth();
  const { theme } = useTheme();
  const styles = useMemo(() => makeStyles(theme), [theme]);
  const [hymn, setHymn] = useState<Hymn | null>(null);
  const [isFavorite, setIsFavorite] = useState(false);
  const [loading, setLoading] = useState(true);

  useFocusEffect(
    useCallback(() => {
      let active = true;
      (async () => {
        const { data: hymnData } = await supabase.from('hymns').select('*').eq('id', id).single();
        const { data: favorite } = session
          ? await supabase
              .from('hymn_favorites')
              .select('id')
              .eq('user_id', session.user.id)
              .eq('hymn_id', id)
              .maybeSingle()
          : { data: null };
        if (!active) return;
        setHymn(hymnData ?? null);
        setIsFavorite(!!favorite);
        setLoading(false);
      })();
      return () => {
        active = false;
      };
    }, [id, session])
  );

  const toggleFavorite = async () => {
    if (!session || !hymn) return;
    if (isFavorite) {
      await supabase.from('hymn_favorites').delete().eq('user_id', session.user.id).eq('hymn_id', hymn.id);
    } else {
      await supabase.from('hymn_favorites').insert({ user_id: session.user.id, hymn_id: hymn.id });
    }
    setIsFavorite((v) => !v);
  };

  if (loading || !hymn) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator color={theme.colors.primary} />
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.titleRow}>
        <Text style={[theme.typography.title, styles.titleText]}>
          {hymn.number ? `${hymn.number}. ` : ''}
          {hymn.title}
        </Text>
        <Pressable onPress={toggleFavorite} hitSlop={12}>
          <Ionicons name={isFavorite ? 'heart' : 'heart-outline'} size={26} color={theme.colors.primary} />
        </Pressable>
      </View>
      {hymn.author ? <Text style={theme.typography.caption}>{hymn.author}</Text> : null}
      <Text style={styles.lyrics}>{hymn.lyrics}</Text>
    </ScrollView>
  );
}

const makeStyles = (theme: Theme) =>
  StyleSheet.create({
    centered: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: theme.spacing.lg },
    container: { padding: theme.spacing.lg, gap: theme.spacing.md, backgroundColor: theme.colors.background },
    titleRow: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: theme.spacing.sm },
    titleText: { flex: 1 },
    lyrics: { fontSize: 18, lineHeight: 30, color: theme.colors.text },
  });
